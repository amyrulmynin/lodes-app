import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { orders, users, desserts } from "@/db/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";
import { sendWhatsAppNotification } from "@/lib/integrations/whatsapp";
import { logOrderToGoogleSheets } from "@/lib/integrations/google-sheets";
import { telegramNewOrder } from "@/lib/integrations/telegram";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      affiliateId,
      dessertId,
      quantity,
      customerName,
      customerPhone,
      customerAddress,
      notes,
      receiptUrl,
    } = body;

    if (!affiliateId || !dessertId || !quantity || !customerName || !customerPhone) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const affiliate = await db.query.users.findFirst({
      where: eq(users.id, affiliateId),
    });

    if (!affiliate || affiliate.role !== "affiliate") {
      return NextResponse.json(
        { error: "Invalid affiliate" },
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
      affiliateId,
      dessertId,
      quantity,
      totalPrice: totalPrice.toFixed(2),
      commissionAmount: commissionAmount.toFixed(2),
      customerName,
      customerPhone,
      customerAddress: customerAddress || null,
      notes: notes || null,
      receiptUrl: receiptUrl || null,
      // payment_method is a NOT NULL ENUM ('online' | 'cod') in the DB.
      // MudahPay -> 'online'; anything else defaults to 'cod'.
      paymentMethod: body.paymentMethod === "mudahpay" || body.paymentMethod === "online" ? "online" : "cod",
      latitude: body.latitude != null ? String(body.latitude) : null,
      longitude: body.longitude != null ? String(body.longitude) : null,
      locationAccuracy: body.locationAccuracy != null ? String(body.locationAccuracy) : null,
      trackingToken: crypto.randomBytes(20).toString("hex"),
      status: 'pending',
    }).returning();

    try {
      await sendWhatsAppNotification({
        customerName,
        customerPhone,
        dessertName: dessert.name,
        quantity,
        totalPrice: totalPrice.toFixed(2),
        affiliateName: affiliate.name,
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
        affiliateName: affiliate.name,
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
      affiliateName: affiliate.name,
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
