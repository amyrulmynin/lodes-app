import crypto from "crypto";
import { getIntegration, type MudahPayConfig } from "./config";

// ============================================================
// MudahPay integration - DuitNow QR payments
// Docs: https://mudahpay.my.id/docs
// Auth: x-api-key header. Amounts in SEN (RM1 = 100 sen).
// ============================================================

const BASE_URL = "https://api.mudahpay.my.id";

export interface CreateTransactionResult {
  ok: boolean;
  transactionId?: string;
  qrString?: string;
  uniqueAmount?: number; // in sen
  error?: string;
}

// Create a dynamic DuitNow QR for a payment
export async function createMudahPayTransaction(params: {
  amountSen: number;
  reference: string;
  expiresIn?: number; // seconds
}): Promise<CreateTransactionResult> {
  const cfg = await getIntegration<MudahPayConfig>("mudahpay");
  if (!cfg || !cfg.isEnabled || !cfg.apiKey) {
    return { ok: false, error: "MudahPay belum dikonfigurasi" };
  }

  try {
    const res = await fetch(`${BASE_URL}/transactions`, {
      method: "POST",
      headers: {
        "x-api-key": cfg.apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: params.amountSen,
        reference: params.reference,
        expiresIn: params.expiresIn ?? 3600,
      }),
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      return {
        ok: false,
        error: json?.error || json?.message || `MudahPay error (${res.status})`,
      };
    }

    return {
      ok: true,
      transactionId: json.data?.id,
      qrString: json.data?.qrdn,
      uniqueAmount: json.data?.unique_amount,
    };
  } catch (error: any) {
    return { ok: false, error: error?.message || "MudahPay network error" };
  }
}

// Check a transaction status (paid / pending / expired / cancelled)
export async function getMudahPayTransaction(
  transactionId: string
): Promise<{ ok: boolean; status?: string; paidAmount?: number; error?: string }> {
  const cfg = await getIntegration<MudahPayConfig>("mudahpay");
  if (!cfg || !cfg.isEnabled || !cfg.apiKey) {
    return { ok: false, error: "MudahPay belum dikonfigurasi" };
  }

  try {
    const res = await fetch(`${BASE_URL}/transactions/${transactionId}`, {
      headers: { "x-api-key": cfg.apiKey },
      cache: "no-store",
    });
    const json = await res.json();
    if (!res.ok) {
      return { ok: false, error: json?.message || `Error (${res.status})` };
    }
    return {
      ok: true,
      status: json.data?.status,
      paidAmount: json.data?.paid_amount,
    };
  } catch (error: any) {
    return { ok: false, error: error?.message || "Network error" };
  }
}

// Verify webhook signature: HMAC_SHA256(secret, "<timestamp>.<raw_body>")
export async function verifyMudahPayWebhook(
  signature: string,
  timestamp: string,
  rawBody: string
): Promise<boolean> {
  const cfg = await getIntegration<MudahPayConfig>("mudahpay");
  if (!cfg || !cfg.webhookSecret) return false;

  const expected = crypto
    .createHmac("sha256", cfg.webhookSecret)
    .update(`${timestamp}.${rawBody}`)
    .digest("hex");

  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expected)
    );
  } catch {
    return false;
  }
}

// Test connection: list recent transactions (lightweight call)
export async function testMudahPay(
  apiKey: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`${BASE_URL}/transactions?limit=1`, {
      headers: { "x-api-key": apiKey },
      cache: "no-store",
    });
    if (res.status === 401 || res.status === 403) {
      return { ok: false, error: "API key tidak sah" };
    }
    if (!res.ok) {
      return { ok: false, error: `MudahPay error (${res.status})` };
    }
    return { ok: true };
  } catch (error: any) {
    return { ok: false, error: error?.message || "Network error" };
  }
}
