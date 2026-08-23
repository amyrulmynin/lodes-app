import { getIntegration, type TelegramConfig } from "./config";

// ============================================================
// Telegram Bot integration - notifications to admin chat
// ============================================================

const E = {
  cake: "\u{1F370}",
  box: "\u{1F4E6}",
  chart: "\u{1F4CA}",
  money: "\u{1F4B0}",
  person: "\u{1F464}",
  people: "\u{1F465}",
  memo: "\u{1F4DD}",
  star: "\u2B50",
  warn: "\u26A0\uFE0F",
  check: "\u2705",
  wallet: "\u{1F45B}",
  package: "\u{1F4E6}",
  speech: "\u{1F4AC}",
};

async function sendTelegramMessage(
  cfg: TelegramConfig,
  text: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(
      `https://api.telegram.org/bot${cfg.botToken}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: cfg.chatId,
          text,
          parse_mode: "HTML",
          disable_web_page_preview: true,
        }),
      }
    );
    const data = await res.json();
    if (!data.ok) {
      return { ok: false, error: data.description || "Telegram API error" };
    }
    return { ok: true };
  } catch (error: any) {
    return { ok: false, error: error?.message || "Network error" };
  }
}

// Core: send a notification if telegram is enabled
export async function telegramNotify(
  text: string,
  category?: keyof Pick<
    TelegramConfig,
    "notifyOrders" | "notifyReviews" | "notifyStock"
  >
): Promise<void> {
  const cfg = await getIntegration<TelegramConfig>("telegram");
  if (!cfg || !cfg.isEnabled || !cfg.botToken || !cfg.chatId) return;
  if (category && cfg[category] === false) return;
  const result = await sendTelegramMessage(cfg, text);
  if (!result.ok) {
    console.error("Telegram notify failed:", result.error);
  }
}

// Test connection: getMe + optional test message
export async function testTelegram(
  botToken: string,
  chatId?: string
): Promise<{ ok: boolean; botName?: string; error?: string }> {
  try {
    const res = await fetch(`https://api.telegram.org/bot${botToken}/getMe`, {
      cache: "no-store",
    });
    const data = await res.json();
    if (!data.ok) {
      return { ok: false, error: data.description || "Token tidak sah" };
    }
    const botName = data.result?.username
      ? `@${data.result.username}`
      : data.result?.first_name;

    if (chatId) {
      const send = await fetch(
        `https://api.telegram.org/bot${botToken}/sendMessage`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            text: `${E.check} <b>Lodes Desserts</b> - Telegram bersambung!`,
            parse_mode: "HTML",
          }),
        }
      );
      const sendData = await send.json();
      if (!sendData.ok) {
        return {
          ok: false,
          botName,
          error: `Bot OK tapi gagal hantar ke chat: ${sendData.description}. Pastikan bot sudah /start atau admin dalam group.`,
        };
      }
    }
    return { ok: true, botName };
  } catch (error: any) {
    return { ok: false, error: error?.message || "Network error" };
  }
}

// Register the webhook so the bot receives receipt photos
export async function setupTelegramWebhook(
  botToken: string,
  webhookUrl: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(
      `https://api.telegram.org/bot${botToken}/setWebhook`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: webhookUrl }),
      }
    );
    const data = await res.json();
    if (!data.ok) return { ok: false, error: data.description };
    return { ok: true };
  } catch (error: any) {
    return { ok: false, error: error?.message };
  }
}

// ===== Specific notification builders =====

export async function telegramNewOrder(o: {
  orderId: number;
  dessertName: string;
  quantity: number;
  totalPrice: string;
  customerName: string;
  agentName: string;
}) {
  await telegramNotify(
    `${E.cake} <b>ORDER BARU #${o.orderId}</b>\n\n` +
      `${E.box} ${o.dessertName} x${o.quantity}\n` +
      `${E.money} RM ${o.totalPrice}\n` +
      `${E.person} ${o.customerName}\n` +
      `${E.people} Agent: ${o.agentName}`,
    "notifyOrders"
  );
}



export async function telegramNewReview(r: {
  customerName: string;
  rating: number;
  comment?: string | null;
  dessertName?: string;
}) {
  const stars = E.star.repeat(r.rating);
  await telegramNotify(
    `${E.star} <b>REVIEW BARU</b>\n\n` +
      `${E.person} ${r.customerName}\n` +
      (r.dessertName ? `${E.cake} ${r.dessertName}\n` : "") +
      `Rating: ${stars} (${r.rating}/5)` +
      (r.comment ? `\n${E.speech} "${r.comment}"` : ""),
    "notifyReviews"
  );
}

export async function telegramLowStock(s: {
  ingredientName: string;
  currentStock: string;
  unit: string;
  minLevel: string;
}) {
  await telegramNotify(
    `${E.warn} <b>STOK RENDAH</b>\n\n` +
      `${E.package} ${s.ingredientName}\n` +
      `${E.chart} Baki: ${s.currentStock} ${s.unit} (min: ${s.minLevel} ${s.unit})\n\n` +
      `Sila restock tidak lama lagi.`,
    "notifyStock"
  );
}
