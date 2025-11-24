import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { orders, users, desserts } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { sendWhatsAppNotification } from "@/lib/integrations/whatsapp";
import { logOrderToGoogleSheets } from "@/lib/integrations/google-sheets";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let allOrders;

    if (session.user.role === "admin") {
      allOrders = await db.query.orders.findMany({
        with: {
          affiliate: true,
          dessert: true,
        },
        orderBy: desc(orders.submittedAt),
      });
    } else {
      allOrders = await db.query.orders.findMany({
        where: eq(orders.affiliateId, parseInt(session.user.id)),
        with: {
          dessert: true,
        },
        orderBy: desc(orders.submittedAt),
      });
    }

    return NextResponse.json(allOrders);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      dessertId,
      quantity,
      customerName,
      customerPhone,
      customerAddress,
      notes,
    } = body;

    if (!dessertId || !quantity || !customerName || !customerPhone) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const dessert = await db.query.desserts.findFirst({
      where: eq(desserts.id, dessertId),
    });

    if (!dessert) {
      return NextResponse.json(
        { error: "Dessert not found" },
        { status: 404 }
      );
    }

    const totalPrice = parseFloat(dessert.price) * quantity;
    const commissionAmount = (totalPrice * parseFloat(dessert.commissionRate)) / 100;

    const newOrder = await db.insert(orders).values({
      affiliateId: parseInt(session.user.id),
      dessertId,
      quantity,
      totalPrice: totalPrice.toFixed(2),
      commissionAmount: commissionAmount.toFixed(2),
      customerName,
      customerPhone,
      customerAddress: customerAddress || null,
      notes: notes || null,
      status: 'pending',
    }).returning();

    const affiliate = await db.query.users.findFirst({
      where: eq(users.id, parseInt(session.user.id)),
    });

    try {
      await sendWhatsAppNotification({
        customerName,
        customerPhone,
        dessertName: dessert.name,
        quantity,
        totalPrice: totalPrice.toFixed(2),
        affiliateName: affiliate?.name || session.user.name || 'Unknown',
        customerAddress,
        notes,
      });
    } catch (error) {
      console.error('WhatsApp notification failed:', error);
    }

    try {
      await logOrderToGoogleSheets({
        orderId: newOrder[0].id,
        date: new Date().toISOString(),
        customerName,
        customerPhone,
        dessertName: dessert.name,
        quantity,
        totalPrice: totalPrice.toFixed(2),
        commissionAmount: commissionAmount.toFixed(2),
        affiliateName: affiliate?.name || session.user.name || 'Unknown',
        status: 'pending',
      });
    } catch (error) {
      console.error('Google Sheets logging failed:', error);
    }

    return NextResponse.json(newOrder[0], { status: 201 });
  } catch (error) {
    console.error("Error creating order:", error);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}
