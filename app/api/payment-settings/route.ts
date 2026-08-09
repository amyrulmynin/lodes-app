import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { paymentSettings } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { getIntegration, type MudahPayConfig } from "@/lib/integrations/config";

export async function GET(request: NextRequest) {
  try {
    const settings = await db.query.paymentSettings.findFirst({
      orderBy: desc(paymentSettings.updatedAt),
    });

    // Tell the shop whether automatic MudahPay QR checkout is active.
    // Admin controls this via the Integrations page toggle.
    const mp = await getIntegration<MudahPayConfig>("mudahpay");
    const mudahpayEnabled = !!(mp && mp.isEnabled && mp.apiKey);

    return NextResponse.json({ ...(settings || {}), mudahpayEnabled });
  } catch (error) {
    console.error("Error fetching payment settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { qrCodeUrl, bankName, accountNumber, accountHolder, paymentInstructions } = body;

    const existingSettings = await db.query.paymentSettings.findFirst({
      orderBy: desc(paymentSettings.updatedAt),
    });

    let result;

    if (existingSettings) {
      result = await db
        .update(paymentSettings)
        .set({
          qrCodeUrl: qrCodeUrl || null,
          bankName: bankName || null,
          accountNumber: accountNumber || null,
          accountHolder: accountHolder || null,
          paymentInstructions: paymentInstructions || null,
          updatedAt: new Date(),
        })
        .where(eq(paymentSettings.id, existingSettings.id))
        .returning();
    } else {
      result = await db.insert(paymentSettings).values({
        qrCodeUrl: qrCodeUrl || null,
        bankName: bankName || null,
        accountNumber: accountNumber || null,
        accountHolder: accountHolder || null,
        paymentInstructions: paymentInstructions || null,
      }).returning();
    }

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error("Error saving payment settings:", error);
    return NextResponse.json(
      { error: "Failed to save settings" },
      { status: 500 }
    );
  }
}
