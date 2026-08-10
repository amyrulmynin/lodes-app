import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { orders, deliveryLocations } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// GET /api/public/track/[token]/location - customer: latest driver location
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    const order = await db.query.orders.findFirst({
      where: eq(orders.trackingToken, token),
    });
    if (!order) {
      return NextResponse.json({ error: "Order tidak dijumpai" }, { status: 404 });
    }

    // Latest driver ping
    const latest = await db.query.deliveryLocations.findFirst({
      where: eq(deliveryLocations.orderId, order.id),
      orderBy: desc(deliveryLocations.createdAt),
    });

    return NextResponse.json({
      status: order.status,
      destination:
        order.latitude && order.longitude
          ? { lat: parseFloat(String(order.latitude)), lng: parseFloat(String(order.longitude)) }
          : null,
      driver: latest
        ? {
            lat: parseFloat(String(latest.latitude)),
            lng: parseFloat(String(latest.longitude)),
            at: latest.createdAt,
          }
        : null,
    });
  } catch (error) {
    console.error("Track location error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
