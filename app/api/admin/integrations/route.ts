import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  getIntegrationMasked,
  getIntegration,
  saveIntegration,
  INTEGRATION_KEYS,
  type IntegrationKey,
  type AiConfig,
  type TelegramConfig,
  type MudahPayConfig,
} from "@/lib/integrations/config";
import { testTelegram } from "@/lib/integrations/telegram";
import { testAi } from "@/lib/integrations/ai";
import { testMudahPay } from "@/lib/integrations/mudahpay";

async function requireAdmin() {
  const session = await auth();
  if (!session || session.user.role !== "admin") return null;
  return session;
}

// GET /api/admin/integrations - all integration configs (secrets masked)
export async function GET() {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result: Record<string, any> = {};
  for (const key of INTEGRATION_KEYS) {
    result[key] = await getIntegrationMasked(key);
  }
  return NextResponse.json(result);
}

// PUT /api/admin/integrations - save one integration config
export async function PUT(request: NextRequest) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { key, config, isEnabled } = body;

    if (!INTEGRATION_KEYS.includes(key)) {
      return NextResponse.json({ error: "Invalid key" }, { status: 400 });
    }

    await saveIntegration(key as IntegrationKey, config || {}, !!isEnabled);
    const masked = await getIntegrationMasked(key as IntegrationKey);
    return NextResponse.json({ success: true, config: masked });
  } catch (error) {
    console.error("Error saving integration:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// POST /api/admin/integrations - test a connection
export async function POST(request: NextRequest) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { key, config } = body;

    // Resolve secrets: if the incoming value is masked (or empty), use the
    // stored decrypted value instead so the test uses real credentials.
    const stored = (await getIntegration(key as IntegrationKey)) as any;
    const resolve = (field: string) => {
      const v = config?.[field];
      if (!v || (typeof v === "string" && v.includes("••••"))) {
        return stored?.[field] || "";
      }
      return v;
    };

    let result: { ok: boolean; error?: string; botName?: string; model?: string };

    if (key === "telegram") {
      result = await testTelegram(resolve("botToken"), config?.chatId ?? stored?.chatId);
    } else if (key === "ai") {
      result = await testAi({
        baseUrl: config?.baseUrl ?? stored?.baseUrl ?? "",
        apiKey: resolve("apiKey"),
        model: config?.model ?? stored?.model ?? "",
      });
    } else if (key === "mudahpay") {
      result = await testMudahPay(resolve("apiKey"));
    } else {
      return NextResponse.json({ error: "Invalid key" }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error testing integration:", error);
    return NextResponse.json(
      { ok: false, error: "Test gagal" },
      { status: 500 }
    );
  }
}
