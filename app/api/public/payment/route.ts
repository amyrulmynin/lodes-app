import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { eq } from "drizzle-orm";
import QRCode from "qrcode";
import {
  createMudahPayTransaction,
  getMudahPayTransaction,
} from "@/lib/integrations/mudahpay";

// POST /api/public/payment - create a MudahPay QR for an order
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json({ error: "orderId diperlukan" }, { status: 400 });
    }

    const order = await db.query.orders.findFirst({
      where: eq(orders.id, parseInt(orderId)),
    });

    if (!order) {
      return NextResponse.json({ error: "Order tidak dijumpai" }, { status: 404 });
    }

    if (order.paymentStatus === "paid") {
      return NextResponse.json({ error: "Order sudah dibayar" }, { status: 400 });
    }

    const amountSen = Math.round(parseFloat(order.totalPrice) * 100);
    const reference = `ORDER-${order.id}`;

    const result = await createMudahPayTransaction({
      amountSen,
      reference,
      expiresIn: 3600,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 502 });
    }

    // Store txn id + mark as online payment (enum only allows 'online'|'cod')
    await db
      .update(orders)
      .set({
        paymentMethod: "online",
        mudahpayTxnId: result.transactionId,
        paymentStatus: "awaiting_payment",
      })
      .where(eq(orders.id, order.id));

    // Render the DuitNow QR string as a scannable QR image
    let qrImage: string | null = null;
    if (result.qrString) {
      qrImage = await QRCode.toDataURL(result.qrString, {
        width: 400,
        margin: 2,
        color: { dark: "#141412", light: "#ffffff" },
      });
    }

    return NextResponse.json({
      transactionId: result.transactionId,
      qrString: result.qrString,
      qrImage,
      uniqueAmount: result.uniqueAmount,
    });
  } catch (error) {
    console.error("Error creating payment:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// GET /api/public/payment?orderId=x - check payment status
export async function GET(request: NextRequest) {
  try {
    const orderId = request.nextUrl.searchParams.get("orderId");
    if (!orderId) {
      return NextResponse.json({ error: "orderId diperlukan" }, { status: 400 });
    }

    const order = await db.query.orders.findFirst({
      where: eq(orders.id, parseInt(orderId)),
    });

    if (!order) {
      return NextResponse.json({ error: "Order tidak dijumpai" }, { status: 404 });
    }

    // If we have a txn and not yet marked paid, re-verify with MudahPay
    if (order.mudahpayTxnId && order.paymentStatus !== "paid") {
      const check = await getMudahPayTransaction(order.mudahpayTxnId);
      if (check.ok && check.status === "paid") {
        await db
          .update(orders)
          .set({ paymentStatus: "paid", paidAt: new Date() })
          .where(eq(orders.id, order.id));
        return NextResponse.json({ status: "paid" });
      }
    }

    return NextResponse.json({ status: order.paymentStatus });
  } catch (error) {
    console.error("Error checking payment:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
