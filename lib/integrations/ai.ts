import { getIntegration, type AiConfig } from "./config";

// ============================================================
// AI integration via 9router (OpenAI-compatible API)
// ============================================================

export interface AiMessage {
  role: "system" | "user" | "assistant";
  content: string | AiContentPart[];
}

export interface AiContentPart {
  type: "text" | "image_url";
  text?: string;
  image_url?: { url: string };
}

export interface AiResult {
  ok: boolean;
  content?: string;
  error?: string;
}

async function callAi(
  cfg: AiConfig,
  messages: AiMessage[],
  opts?: { maxTokens?: number; temperature?: number }
): Promise<AiResult> {
  try {
    const base = cfg.baseUrl.replace(/\/+$/, "");
    const res = await fetch(`${base}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${cfg.apiKey}`,
      },
      body: JSON.stringify({
        model: cfg.model,
        messages,
        // kimi-k3 uses reasoning tokens; give a generous budget so the
        // visible answer is not empty
        max_tokens: opts?.maxTokens ?? 4000,
        temperature: opts?.temperature ?? 0.4,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      return {
        ok: false,
        error: data?.error?.message || `AI error (${res.status})`,
      };
    }

    const content = data?.choices?.[0]?.message?.content;
    if (!content) {
      return { ok: false, error: "AI returned empty response" };
    }
    return { ok: true, content };
  } catch (error: any) {
    return { ok: false, error: error?.message || "AI network error" };
  }
}

// Test connection: tiny prompt
export async function testAi(
  cfg: AiConfig
): Promise<{ ok: boolean; model?: string; error?: string }> {
  if (!cfg.baseUrl || !cfg.apiKey) {
    return { ok: false, error: "Base URL dan API key diperlukan" };
  }
  const result = await callAi(
    cfg,
    [{ role: "user", content: "Reply with exactly: OK" }],
    { maxTokens: 2000, temperature: 0 }
  );
  if (!result.ok) return { ok: false, error: result.error };
  return { ok: true, model: cfg.model };
}

// Main entry: ask AI with admin config (returns null if disabled)
export async function askAi(
  messages: AiMessage[],
  opts?: { maxTokens?: number; temperature?: number }
): Promise<AiResult> {
  const cfg = await getIntegration<AiConfig>("ai");
  if (!cfg || !cfg.isEnabled) {
    return { ok: false, error: "AI integration belum diaktifkan" };
  }
  if (!cfg.baseUrl || !cfg.apiKey || !cfg.model) {
    return { ok: false, error: "AI belum dikonfigurasi sepenuhnya" };
  }
  return callAi(cfg, messages, opts);
}

// Vision: analyse an image (e.g. receipt) and return structured text
export async function analyseImage(
  imageDataUrl: string,
  prompt: string
): Promise<AiResult> {
  return askAi(
    [
      {
        role: "user",
        content: [
          { type: "text", text: prompt },
          { type: "image_url", image_url: { url: imageDataUrl } },
        ],
      },
    ],
    { maxTokens: 4000, temperature: 0.2 }
  );
}
