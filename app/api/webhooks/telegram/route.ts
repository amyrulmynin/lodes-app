import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { ingredients, stockMovements } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getIntegration, type TelegramConfig } from "@/lib/integrations/config";
import { analyseImage } from "@/lib/integrations/ai";

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
};

async function tgSend(botToken: string, chatId: string | number, text: string) {
  await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
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
  try {
    const cfg = await getIntegration<TelegramConfig>("telegram");
    if (!cfg || !cfg.isEnabled || !cfg.botToken) {
      return NextResponse.json({ ok: true }); // ignore silently
    }

    const update = await request.json();
    const message = update.message || update.channel_post;
    if (!message) return NextResponse.json({ ok: true });

    const chatId = message.chat?.id;

    // Security: only respond to the configured admin chat
    if (cfg.chatId && String(chatId) !== String(cfg.chatId)) {
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
        `${E.package} <b>Lodes Bot</b>\n\nHantar gambar resit pembelian bahan dan saya akan masukkan ke stok secara automatik.\n\nArahan:\n/stok - lihat baki stok`
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

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Telegram webhook error:", error);
    return NextResponse.json({ ok: true });
  }
}
