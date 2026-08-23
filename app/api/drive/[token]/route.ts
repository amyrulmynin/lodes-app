import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { orders, deliveryLocations } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import crypto from "crypto";

export const dynamic = "force-dynamic";

// GET /api/drive/[token] - driver: get order info for the delivery
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const order = await db.query.orders.findFirst({
      where: eq(orders.driverToken, token),
      with: { dessert: true },
    });
    if (!order) {
      return NextResponse.json({ error: "Link tidak sah" }, { status: 404 });
    }
    return NextResponse.json({
      id: order.id,
      dessertName: order.dessert?.name || "Dessert",
      quantity: order.quantity,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      customerAddress: order.customerAddress,
      latitude: order.latitude,
      longitude: order.longitude,
      status: order.status,
    });
  } catch (error) {
    console.error("Drive GET error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// POST /api/drive/[token] - driver pushes current GPS location
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const body = await request.json();
    const { latitude, longitude, accuracy } = body;

    const order = await db.query.orders.findFirst({
      where: eq(orders.driverToken, token),
    });
    if (!order) {
      return NextResponse.json({ error: "Link tidak sah" }, { status: 404 });
    }

    if (latitude == null || longitude == null) {
      return NextResponse.json({ error: "Koordinat diperlukan" }, { status: 400 });
    }

    await db.insert(deliveryLocations).values({
      orderId: order.id,
      latitude: String(latitude),
      longitude: String(longitude),
      accuracy: accuracy != null ? String(accuracy) : null,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Drive POST error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
