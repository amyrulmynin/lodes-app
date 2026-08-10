import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { eq } from "drizzle-orm";

// POST /api/drive/[token]/status - driver updates delivery status
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const body = await request.json();
    const { status } = body;

    if (!["out_for_delivery", "delivered"].includes(status)) {
      return NextResponse.json({ error: "Status tidak sah" }, { status: 400 });
    }

    const order = await db.query.orders.findFirst({
      where: eq(orders.driverToken, token),
    });
    if (!order) {
      return NextResponse.json({ error: "Link tidak sah" }, { status: 404 });
    }

    await db
      .update(orders)
      .set({ status })
      .where(eq(orders.id, order.id));

    return NextResponse.json({ ok: true, status });
  } catch (error) {
    console.error("Drive status error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
