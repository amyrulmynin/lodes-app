import { db } from "@/db";
import { integrationSettings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { encryptSecret, decryptSecret, isEncrypted, maskSecret } from "@/lib/crypto";

// ============================================================
// Integration config management (stored in DB, editable in admin)
// ============================================================

export interface AiConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
}

export interface TelegramConfig {
  botToken: string;
  chatId: string;
  notifyOrders: boolean;
  notifyReviews: boolean;
  notifyWithdrawals: boolean;
  notifyStock: boolean;
  dailyReport: boolean;
  dailyReportTime: string;
}

export interface MudahPayConfig {
  apiKey: string;
  webhookSecret: string;
}

// Fields that must be encrypted at rest
const SECRET_FIELDS: Record<string, string[]> = {
  ai: ["apiKey"],
  telegram: ["botToken"],
  mudahpay: ["apiKey", "webhookSecret"],
};

export const INTEGRATION_KEYS = ["ai", "telegram", "mudahpay"] as const;
export type IntegrationKey = (typeof INTEGRATION_KEYS)[number];

const DEFAULTS: Record<IntegrationKey, Record<string, any>> = {
  ai: {
    baseUrl: "https://bakdmy-9r.hf.space/v1",
    apiKey: "",
    model: "cbcn/kimi-k3",
  },
  telegram: {
    botToken: "",
    chatId: "",
    notifyOrders: true,
    notifyReviews: true,
    notifyWithdrawals: true,
    notifyStock: true,
    dailyReport: false,
    dailyReportTime: "21:00",
  },
  mudahpay: {
    apiKey: "",
    webhookSecret: "",
  },
};

// Decrypt secret fields in a config object
function decryptConfig(key: string, config: Record<string, any>): Record<string, any> {
  const secretFields = SECRET_FIELDS[key] || [];
  const out = { ...config };
  for (const f of secretFields) {
    if (out[f] && typeof out[f] === "string") {
      out[f] = decryptSecret(out[f]);
    }
  }
  return out;
}

// Encrypt secret fields before saving. Empty string / mask-only => keep existing.
function encryptConfig(
  key: string,
  config: Record<string, any>,
  existing: Record<string, any>
): Record<string, any> {
  const secretFields = SECRET_FIELDS[key] || [];
  const out = { ...config };
  for (const f of secretFields) {
    const val = out[f];
    if (typeof val !== "string") continue;
    // If value is the masked placeholder or empty, keep the existing encrypted value
    if (val === "" || val.includes("••••")) {
      out[f] = existing[f] || "";
    } else if (!isEncrypted(val)) {
      out[f] = encryptSecret(val);
    }
  }
  return out;
}

// Get full config with decrypted secrets (server-side use only)
export async function getIntegration<T = Record<string, any>>(
  key: IntegrationKey
): Promise<(T & { isEnabled: boolean }) | null> {
  try {
    const row = await db.query.integrationSettings.findFirst({
      where: eq(integrationSettings.key, key),
    });
    if (!row) {
      return { ...DEFAULTS[key], isEnabled: false } as any;
    }
    let config: Record<string, any> = {};
    try {
      config = JSON.parse(row.config || "{}");
    } catch {
      config = {};
    }
    const merged = { ...DEFAULTS[key], ...config };
    return {
      ...decryptConfig(key, merged),
      isEnabled: row.isEnabled === 1,
    } as any;
  } catch (error) {
    console.error(`Error reading integration ${key}:`, error);
    return { ...DEFAULTS[key], isEnabled: false } as any;
  }
}

// Get config with masked secrets (for admin UI display)
export async function getIntegrationMasked(
  key: IntegrationKey
): Promise<Record<string, any>> {
  const full = await getIntegration(key);
  if (!full) return { ...DEFAULTS[key], isEnabled: false };
  const out: Record<string, any> = { ...full };
  const secretFields = SECRET_FIELDS[key] || [];
  for (const f of secretFields) {
    if (out[f]) out[f] = maskSecret(out[f]);
  }
  return out;
}

// Save config (encrypts secret fields). Admin only — caller must check auth.
export async function saveIntegration(
  key: IntegrationKey,
  config: Record<string, any>,
  isEnabled: boolean
): Promise<void> {
  const existing = await db.query.integrationSettings.findFirst({
    where: eq(integrationSettings.key, key),
  });

  let existingConfig: Record<string, any> = {};
  if (existing) {
    try {
      existingConfig = JSON.parse(existing.config || "{}");
    } catch {
      existingConfig = {};
    }
  }

  const encrypted = encryptConfig(key, config, existingConfig);
  const merged = { ...DEFAULTS[key], ...encrypted };

  if (existing) {
    await db
      .update(integrationSettings)
      .set({
        config: JSON.stringify(merged),
        isEnabled: isEnabled ? 1 : 0,
        updatedAt: new Date(),
      })
      .where(eq(integrationSettings.key, key));
  } else {
    await db.insert(integrationSettings).values({
      key,
      config: JSON.stringify(merged),
      isEnabled: isEnabled ? 1 : 0,
    });
  }
}
