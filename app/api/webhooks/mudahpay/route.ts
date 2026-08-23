import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { eq } from "drizzle-orm";
import { verifyMudahPayWebhook } from "@/lib/integrations/mudahpay";
import { telegramNotify } from "@/lib/integrations/telegram";

// POST /api/webhooks/mudahpay - MudahPay payment notification
export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-mudahpay-signature") || "";
    const timestamp = request.headers.get("x-mudahpay-timestamp") || "";

    // Verify signature (mandatory)
    const valid = await verifyMudahPayWebhook(signature, timestamp, rawBody);
    if (!valid) {
      console.error("MudahPay webhook: invalid signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const payload = JSON.parse(rawBody);
    const event = payload.event;
    const data = payload.data;

    if (event === "transaction.paid" && data) {
      const reference: string = data.reference || "";

      // reference format: "ORDER-<orderId>"
      const match = reference.match(/^ORDER-(\d+)$/);
      if (!match) {
        console.warn("MudahPay webhook: unknown reference", reference);
        return NextResponse.json({ received: true });
      }

      const orderId = parseInt(match[1]);
      const order = await db.query.orders.findFirst({
        where: eq(orders.id, orderId),
        with: { dessert: true },
      });

      if (!order) {
        console.warn("MudahPay webhook: order not found", orderId);
        return NextResponse.json({ received: true });
      }

      // Idempotency: skip if already paid
      if (order.paymentStatus === "paid") {
        return NextResponse.json({ received: true });
      }

      await db
        .update(orders)
        .set({
          paymentStatus: "paid",
          paidAt: new Date(),
          mudahpayTxnId: data.id || order.mudahpayTxnId,
        })
        .where(eq(orders.id, orderId));

      // Notify admin
      telegramNotify(
        `\u{1F4B3} <b>PEMBAYARAN DITERIMA</b>\n\n` +
          `Order #${orderId} - ${order.dessert?.name || "Dessert"}\n` +
          `Jumlah: RM ${((data.paid_amount || 0) / 100).toFixed(2)}\n` +
          `Customer: ${order.customerName}\n\n` +
          `Pembayaran disahkan secara automatik.`,
        "notifyOrders"
      ).catch(() => {});
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("MudahPay webhook error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
