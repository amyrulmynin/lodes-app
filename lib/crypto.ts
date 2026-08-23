import crypto from "crypto";

// AES-256-GCM encryption for storing API secrets in the database.
// Key derived from AUTH_SECRET (or a dedicated INTEGRATION_SECRET).

function getKey(): Buffer {
  const secret =
    process.env.INTEGRATION_SECRET ||
    process.env.AUTH_SECRET ||
    "lodes-dev-fallback-secret-change-me";
  return crypto.createHash("sha256").update(secret).digest();
}

const PREFIX = "enc:v1:";

export function encryptSecret(plain: string): string {
  if (!plain) return plain;
  const key = getKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return PREFIX + Buffer.concat([iv, tag, encrypted]).toString("base64");
}

export function decryptSecret(value: string): string {
  if (!value || !value.startsWith(PREFIX)) return value;
  try {
    const key = getKey();
    const buf = Buffer.from(value.slice(PREFIX.length), "base64");
    const iv = buf.subarray(0, 12);
    const tag = buf.subarray(12, 28);
    const encrypted = buf.subarray(28);
    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
  } catch {
    return "";
  }
}

export function isEncrypted(value: string): boolean {
  return typeof value === "string" && value.startsWith(PREFIX);
}

// Mask a secret for display: show last 4 chars only
export function maskSecret(value: string): string {
  if (!value) return "";
  if (value.length <= 4) return "••••";
  return "••••••••" + value.slice(-4);
}
