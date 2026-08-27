import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { ingredients, stockMovements, paymentSettings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getIntegration, type TelegramConfig } from "@/lib/integrations/config";
import { analyseImage } from "@/lib/integrations/ai";
import {
  getInvoiceState,
  setInvoiceState,
  clearInvoiceState,
  isInvoiceActive,
  type InvoiceItem,
  type InvoiceState,
} from "@/lib/telegram-invoice-state";
import { getNextInvoiceNumber } from "@/lib/telegram-invoice-counter";
import { generateTelegramInvoicePDF } from "@/lib/telegram-invoice-pdf";

// ============================================================
// Telegram webhook - receive receipt photos, AI reads them,
// and restock ingredients automatically.
// ============================================================

const E = {
  check: "\u2705",
  cross: "\u274C",
  package: "\u{1F4E6}",
  scan: "\u{1F50D}",
  hourglass: "\u23F3",
  warn: "\u26A0\uFE0F",
  memo: "\u{1F4DD}",
  person: "\u{1F464}",
  phone: "\u{1F4DE}",
  home: "\u{1F3E0}",
  cart: "\u{1F6D2}",
  money: "\u{1F4B0}",
  note: "\u{1F4DD}",
  star: "\u2B50",
  invoice: "\u{1F9FE}",
};

async function tgSend(botToken: string, chatId: string | number, text: string) {
  await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
  }).catch(() => {});
}

async function tgSendDocument(
  botToken: string,
  chatId: string | number,
  document: Buffer,
  filename: string,
  caption?: string
) {
  const formData = new FormData();
  formData.append("chat_id", String(chatId));
  formData.append("document", new Blob([new Uint8Array(document)], { type: "application/pdf" }), filename);
  if (caption) {
    formData.append("caption", caption);
    formData.append("parse_mode", "HTML");
  }

  await fetch(`https://api.telegram.org/bot${botToken}/sendDocument`, {
    method: "POST",
    body: formData,
  }).catch(() => {});
}

async function tgGetFileUrl(botToken: string, fileId: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://api.telegram.org/bot${botToken}/getFile?file_id=${fileId}`
    );
    const data = await res.json();
    if (!data.ok || !data.result?.file_path) return null;
    return `https://api.telegram.org/file/bot${botToken}/${data.result.file_path}`;
  } catch {
    return null;
  }
}

// Match a receipt item name to an existing ingredient (fuzzy)
function matchIngredient(name: string, all: { id: number; name: string }[]) {
  const lower = name.toLowerCase();
  // exact / contains match
  let found = all.find(
    (i) =>
      i.name.toLowerCase() === lower ||
      i.name.toLowerCase().includes(lower) ||
      lower.includes(i.name.toLowerCase())
  );
  // word-overlap fallback
  if (!found) {
    const words = lower.split(/\s+/).filter((w) => w.length > 3);
    found = all.find((i) =>
      words.some((w) => i.name.toLowerCase().includes(w))
    );
  }
  return found;
}

export async function POST(request: NextRequest) {
  console.log("[Telegram Webhook] Received request");
  try {
    const cfg = await getIntegration<TelegramConfig>("telegram");
    console.log("[Telegram Webhook] Config loaded:", { isEnabled: cfg?.isEnabled, hasToken: !!cfg?.botToken, chatId: cfg?.chatId });
    
    if (!cfg || !cfg.isEnabled || !cfg.botToken) {
      console.log("[Telegram Webhook] Bot not configured or disabled");
      return NextResponse.json({ ok: true }); // ignore silently
    }

    const update = await request.json();
    console.log("[Telegram Webhook] Update received:", JSON.stringify(update).slice(0, 500));
    
    const message = update.message || update.channel_post;
    if (!message) {
      console.log("[Telegram Webhook] No message in update");
      return NextResponse.json({ ok: true });
    }

    const chatId = message.chat?.id;
    console.log("[Telegram Webhook] Chat ID:", chatId, "Text:", message.text);

    // Security: only respond to the configured admin chat
    if (cfg.chatId && String(chatId) !== String(cfg.chatId)) {
      console.log("[Telegram Webhook] Chat ID mismatch, ignoring");
      return NextResponse.json({ ok: true });
    }

    // --- Handle receipt photo ---
    const photos = message.photo;
    if (photos && photos.length > 0) {
      // largest version
      const photo = photos[photos.length - 1];

      await tgSend(
        cfg.botToken,
        chatId,
        `${E.hourglass} <b>Resit diterima.</b> AI sedang membaca...`
      );

      // Download image -> base64
      const fileUrl = await tgGetFileUrl(cfg.botToken, photo.file_id);
      if (!fileUrl) {
        await tgSend(cfg.botToken, chatId, `${E.cross} Gagal memuat turun gambar.`);
        return NextResponse.json({ ok: true });
      }
      const imgRes = await fetch(fileUrl);
      const buf = await imgRes.arrayBuffer();
      const base64 = Buffer.from(buf).toString("base64");
      const dataUrl = `data:image/jpeg;base64,${base64}`;

      // AI reads the receipt
      const prompt = `Anda ialah pembantu yang membaca resit pembelian bahan. Analisis gambar resit ini dan return JSON sahaja (tanpa markdown/penjelasan):
{"store":"nama kedai","date":"tarikh","items":[{"name":"nama item","quantity":1,"unit":"pcs","price":0.00}],"total":0.00}
Peraturan: quantity nombor; price dalam RM; unit guna "kg","g","L","ml", atau "pcs". Jika ragu, anggar munasabah.`;

      const ai = await analyseImage(dataUrl, prompt);
      if (!ai.ok || !ai.content) {
        await tgSend(
          cfg.botToken,
          chatId,
          `${E.cross} AI tidak dapat membaca resit. Cuba gambar yang lebih jelas.`
        );
        return NextResponse.json({ ok: true });
      }

      let text = ai.content.trim().replace(/```json\s*/g, "").replace(/```\s*/g, "");
      let receipt: any;
      try {
        receipt = JSON.parse(text);
      } catch {
        await tgSend(cfg.botToken, chatId, `${E.cross} Format resit tidak dapat dibaca.`);
        return NextResponse.json({ ok: true });
      }

      // Restock each matched ingredient
      const all = await db.query.ingredients.findMany();
      const lines: string[] = [];
      for (const item of receipt.items || []) {
        const matched = matchIngredient(item.name || "", all);
        if (matched) {
          const current = all.find((a) => a.id === matched.id)!;
          const newStock = parseFloat(String(current.name ? (current as any).currentStock : 0)) + (item.quantity || 0);
          await db
            .update(ingredients)
            .set({ currentStock: newStock.toFixed(2), updatedAt: new Date() })
            .where(eq(ingredients.id, matched.id));
          await db.insert(stockMovements).values({
            ingredientId: matched.id,
            type: "restock",
            quantity: String(item.quantity || 0),
            note: `Telegram resit - ${receipt.store || "pembelian"}`,
          });
          lines.push(
            `${E.check} ${matched.name}: +${item.quantity} ${item.unit} (baki ${newStock.toFixed(1)})`
          );
        } else {
          lines.push(`${E.warn} ${item.name}: tiada padanan bahan (skip)`);
        }
      }

      const summary =
        `${E.package} <b>Resit diproses - ${receipt.store || "Kedai"}</b>\n` +
        (receipt.date ? `${receipt.date}\n` : "") +
        `\n${lines.join("\n") || "(tiada item)"}\n\n` +
        (receipt.total ? `Jumlah: RM ${Number(receipt.total).toFixed(2)}` : "");

      await tgSend(cfg.botToken, chatId, summary);
      return NextResponse.json({ ok: true });
    }

    // --- /start help ---
    if (message.text === "/start" || message.text === "/help") {
      await tgSend(
        cfg.botToken,
        chatId,
        `${E.package} <b>Lodes Bot</b>\n\n` +
          `Hantar gambar resit pembelian bahan dan saya akan masukkan ke stok secara automatik.\n\n` +
          `Arahan:\n` +
          `/stok - lihat baki stok\n` +
          `/invoice - buat invoice manual (PDF)\n` +
          `/batal - batalkan invoice yang sedang dibuat`
      );
      return NextResponse.json({ ok: true });
    }

    // --- /stok command ---
    if (message.text === "/stok" || message.text === "/stock") {
      const all = await db.query.ingredients.findMany();
      const list =
        all.length > 0
          ? all
              .map(
                (i) =>
                  `• ${i.name}: <b>${parseFloat(String(i.currentStock)).toFixed(1)} ${i.unit}</b>`
              )
              .join("\n")
          : "(tiada bahan)";
      await tgSend(cfg.botToken, chatId, `${E.package} <b>Baki Stok</b>\n\n${list}`);
      return NextResponse.json({ ok: true });
    }

    // --- /invoice command ---
    if (message.text === "/invoice" || message.text === "/inv") {
      console.log("[Telegram Webhook] /invoice command received");
      try {
        if (await isInvoiceActive(String(chatId))) {
          console.log("[Telegram Webhook] Invoice already active");
          await tgSend(
            cfg.botToken,
            chatId,
            `${E.warn} Anda sedang membuat invoice. Taip /batal untuk mula semula.`
          );
          return NextResponse.json({ ok: true });
        }

        console.log("[Telegram Webhook] Getting next invoice number...");
        const invoiceNumber = getNextInvoiceNumber();
        console.log("[Telegram Webhook] Invoice number:", invoiceNumber);
        
        console.log("[Telegram Webhook] Setting invoice state...");
        await setInvoiceState(String(chatId), {
          step: "awaiting_name",
          invoiceNumber,
        });
        console.log("[Telegram Webhook] State set successfully");

        await tgSend(
          cfg.botToken,
          chatId,
          `${E.invoice} <b>Buat Invoice Manual</b>\n\n` +
            `No. Invoice: <b>${invoiceNumber}</b>\n\n` +
            `${E.person} Sila masukkan <b>nama pelanggan</b>:`
        );
        console.log("[Telegram Webhook] Response sent");
        return NextResponse.json({ ok: true });
      } catch (invoiceError) {
        console.error("[Telegram Webhook] Invoice error:", invoiceError);
        await tgSend(cfg.botToken, chatId, `${E.cross} Ralat: ${String(invoiceError)}`);
        return NextResponse.json({ ok: true });
      }
    }

    // --- /batal command ---
    if (message.text === "/batal" || message.text === "/cancel") {
      if (await isInvoiceActive(String(chatId))) {
        await clearInvoiceState(String(chatId));
        await tgSend(cfg.botToken, chatId, `${E.check} Invoice dibatalkan.`);
      } else {
        await tgSend(cfg.botToken, chatId, `${E.warn} Tiada invoice sedang dibuat.`);
      }
      return NextResponse.json({ ok: true });
    }

    // --- Handle invoice conversation steps ---
    try {
      const state = await getInvoiceState(String(chatId));
      console.log("[Telegram Webhook] Current state:", state?.step);
      if (state && state.step !== "idle" && state.step !== "done") {
        await handleInvoiceStep(cfg.botToken, chatId, message.text || "", state);
        return NextResponse.json({ ok: true });
      }
    } catch (stateError) {
      console.error("[Telegram Webhook] State error:", stateError);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Telegram webhook error:", error);
    return NextResponse.json({ ok: true });
  }
}

// ============================================================
// Invoice conversation step handler
// ============================================================

async function handleInvoiceStep(
  botToken: string,
  chatId: string | number,
  text: string,
  state: InvoiceState
) {
  if (!state) return;
  const input = text.trim();

  switch (state.step) {
    case "awaiting_name": {
      if (!input) {
        await tgSend(botToken, chatId, `${E.cross} Nama tidak boleh kosong. Sila masukkan nama pelanggan:`);
        return;
      }
      await setInvoiceState(String(chatId), {
        customerName: input,
        step: "awaiting_phone",
      });
      await tgSend(
        botToken,
        chatId,
        `${E.check} Nama: <b>${input}</b>\n\n${E.phone} Masukkan <b>no. telefon pelanggan</b>:`
      );
      break;
    }

    case "awaiting_phone": {
      if (!input) {
        await tgSend(botToken, chatId, `${E.cross} No. telefon tidak boleh kosong. Sila masukkan no. telefon:`);
        return;
      }
      await setInvoiceState(String(chatId), {
        customerPhone: input,
        step: "awaiting_address",
      });
      await tgSend(
        botToken,
        chatId,
        `${E.check} Telefon: <b>${input}</b>\n\n${E.home} Masukkan <b>alamat pelanggan</b> (taip <b>-</b> jika tiada):`
      );
      break;
    }

    case "awaiting_address": {
      const address = input === "-" ? "" : input;
      await setInvoiceState(String(chatId), {
        customerAddress: address,
        step: "awaiting_item_name",
      });
      await tgSend(
        botToken,
        chatId,
        `${E.check} Alamat: ${address ? `<b>${address}</b>` : "<i>(tiada)</i>"}\n\n` +
          `${E.cart} Masukkan <b>nama item pertama</b>:`
      );
      break;
    }

    case "awaiting_item_name": {
      if (!input) {
        await tgSend(botToken, chatId, `${E.cross} Nama item tidak boleh kosong. Sila masukkan nama item:`);
        return;
      }
      await setInvoiceState(String(chatId), {
        currentItem: { name: input },
        step: "awaiting_item_price",
      });
      await tgSend(
        botToken,
        chatId,
        `${E.check} Item: <b>${input}</b>\n\n${E.money} Masukkan <b>harga unit (RM)</b> untuk "${input}":`
      );
      break;
    }

    case "awaiting_item_price": {
      const price = parseFloat(input);
      if (isNaN(price) || price <= 0) {
        await tgSend(
          botToken,
          chatId,
          `${E.cross} Harga tidak sah. Masukkan nombor sahaja (contoh: 10.50):`
        );
        return;
      }
      await setInvoiceState(String(chatId), {
        currentItem: { ...state.currentItem, price },
        step: "awaiting_item_quantity",
      });
      await tgSend(
        botToken,
        chatId,
        `${E.check} Harga: <b>RM ${price.toFixed(2)}</b>\n\n${E.package} Masukkan <b>kuantiti</b> untuk "${state.currentItem.name}":`
      );
      break;
    }

    case "awaiting_item_quantity": {
      const qty = parseInt(input);
      if (isNaN(qty) || qty <= 0) {
        await tgSend(
          botToken,
          chatId,
          `${E.cross} Kuantiti tidak sah. Masukkan nombor bulat sahaja (contoh: 2):`
        );
        return;
      }

      const newItem: InvoiceItem = {
        name: state.currentItem.name!,
        price: state.currentItem.price!,
        quantity: qty,
      };

      const updatedItems = [...state.items, newItem];
      const runningTotal = updatedItems.reduce((s, i) => s + i.price * i.quantity, 0);

      await setInvoiceState(String(chatId), {
        items: updatedItems,
        currentItem: {},
        step: "awaiting_more_items",
      });

      const itemList = updatedItems
        .map((i, idx) => `${idx + 1}. ${i.name} x${i.quantity} @ RM ${i.price.toFixed(2)} = RM ${(i.price * i.quantity).toFixed(2)}`)
        .join("\n");

      await tgSend(
        botToken,
        chatId,
        `${E.check} Item ditambah!\n\n${E.cart} <b>Senarai Item:</b>\n${itemList}\n\n` +
          `${E.money} Jumlah sementara: <b>RM ${runningTotal.toFixed(2)}</b>\n\n` +
          `Tambah item lagi? Taip <b>nama item baru</b> atau taip <b>selesai</b> untuk teruskan.`
      );
      break;
    }

    case "awaiting_more_items": {
      if (input.toLowerCase() === "selesai" || input.toLowerCase() === "done" || input.toLowerCase() === "siap") {
        await setInvoiceState(String(chatId), { step: "awaiting_notes" });
        await tgSend(
          botToken,
          chatId,
          `${E.note} Masukkan <b>nota tambahan</b> (contoh: penghantaran Sabtu, bayaran tunai).\nTaip <b>-</b> jika tiada nota:`
        );
      } else {
        // User is adding another item - treat input as item name
        await setInvoiceState(String(chatId), {
          currentItem: { name: input },
          step: "awaiting_item_price",
        });
        await tgSend(
          botToken,
          chatId,
          `${E.cart} Item baru: <b>${input}</b>\n\n${E.money} Masukkan <b>harga unit (RM)</b>:`
        );
      }
      break;
    }

    case "awaiting_notes": {
      const notes = input === "-" ? "" : input;
      await setInvoiceState(String(chatId), {
        notes,
        step: "awaiting_status",
      });
      await tgSend(
        botToken,
        chatId,
        `${E.check} Nota: ${notes ? `<b>${notes}</b>` : "<i>(tiada)</i>"}\n\n` +
          `${E.star} Pilih <b>status invoice</b>:\n` +
          `1 - DISAHKAN (default)\n` +
          `2 - DIBAYAR\n` +
          `3 - MENUNGGU PENGESAHAN\n\n` +
          `Taip <b>1</b>, <b>2</b>, atau <b>3</b>:`
      );
      break;
    }

    case "awaiting_status": {
      let status: "accepted" | "paid" | "pending" = "accepted";
      if (input === "2") status = "paid";
      else if (input === "3") status = "pending";

      await setInvoiceState(String(chatId), { status, step: "done" });

      // Generate and send PDF
      await tgSend(botToken, chatId, `${E.hourglass} Menjana invoice PDF...`);

      try {
        // Load payment settings from DB
        let paymentSettingsData: any = null;
        try {
          const rows = await db.query.paymentSettings.findMany();
          if (rows.length > 0) {
            const row = rows[0];
            paymentSettingsData = {
              bankName: row.bankName,
              accountNumber: row.accountNumber,
              accountHolder: row.accountHolder,
              paymentInstructions: row.paymentInstructions,
            };
          }
        } catch (e) {
          console.error("Failed to load payment settings:", e);
        }

        const pdfBuffer = generateTelegramInvoicePDF({
          invoiceNumber: state.invoiceNumber,
          invoiceDate: new Date(),
          customerName: state.customerName,
          customerPhone: state.customerPhone,
          customerAddress: state.customerAddress || undefined,
          items: state.items,
          notes: state.notes || undefined,
          status,
          paymentSettings: paymentSettingsData,
        });

        const total = state.items.reduce((s, i) => s + i.price * i.quantity, 0);
        const fileName = `Invoice_${state.invoiceNumber}_${state.customerName.replace(/\s+/g, "_")}.pdf`;

        await tgSendDocument(
          botToken,
          chatId,
          pdfBuffer,
          fileName,
          `${E.invoice} <b>Invoice ${state.invoiceNumber}</b>\n` +
            `${E.person} ${state.customerName}\n` +
            `${E.money} Jumlah: RM ${total.toFixed(2)}\n` +
            `${E.star} Status: ${status === "accepted" ? "DISAHKAN" : status === "paid" ? "DIBAYAR" : "MENUNGGU PENGESAHAN"}`
        );

        await clearInvoiceState(String(chatId));
      } catch (error) {
        console.error("Invoice generation error:", error);
        await tgSend(
          botToken,
          chatId,
          `${E.cross} Gagal menjana invoice. Sila cuba lagi dengan /invoice.`
        );
        await clearInvoiceState(String(chatId));
      }
      break;
    }

    default:
      await clearInvoiceState(String(chatId));
      await tgSend(botToken, chatId, `${E.warn} Sesi invoice tamat. Taip /invoice untuk mula semula.`);
  }
}
