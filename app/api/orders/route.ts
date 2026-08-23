import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { orders, agents, cashFlow, desserts } from "@/db/schema";
import { eq, desc, inArray, and, gte, sql } from "drizzle-orm";
import { sendWhatsAppNotification } from "@/lib/integrations/whatsapp";
import { logOrderToGoogleSheets } from "@/lib/integrations/google-sheets";
import { telegramNewOrder } from "@/lib/integrations/telegram";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const allOrders = await db.query.orders.findMany({
      with: {
        agent: true,
        dessert: true,
      },
      orderBy: desc(orders.submittedAt),
    });

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
      agentId,
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

    const newOrder = await db.insert(orders).values({
      agentId: agentId || null,
      dessertId,
      quantity,
      totalPrice: totalPrice.toFixed(2),
      customerName,
      customerPhone,
      customerAddress: customerAddress || null,
      notes: notes || null,
      status: 'pending',
    }).returning();

    // Record cash inflow
    await db.insert(cashFlow).values({
      type: "in",
      category: "Jualan",
      description: `Order #${newOrder[0].id} - ${dessert.name}`,
      amount: totalPrice.toFixed(2),
      referenceId: newOrder[0].id,
      referenceType: "order",
    });

    const agent = agentId ? await db.query.agents.findFirst({
      where: eq(agents.id, agentId),
    }) : null;

    try {
      await sendWhatsAppNotification({
        customerName,
        customerPhone,
        dessertName: dessert.name,
        quantity,
        totalPrice: totalPrice.toFixed(2),
        agentName: agent?.name || 'Direct',
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
        agentName: agent?.name || 'Direct',
        status: 'pending',
      });
    } catch (error) {
      console.error('Google Sheets logging failed:', error);
    }

    // Telegram notification (non-blocking)
    telegramNewOrder({
      orderId: newOrder[0].id,
      dessertName: dessert.name,
      quantity,
      totalPrice: totalPrice.toFixed(2),
      customerName,
      agentName: agent?.name || 'Direct',
    }).catch((e) => console.error('Telegram notify failed:', e));

    return NextResponse.json(newOrder[0], { status: 201 });
  } catch (error) {
    console.error("Error creating order:", error);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}
