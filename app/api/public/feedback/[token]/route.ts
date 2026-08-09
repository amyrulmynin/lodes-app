import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { orders, reviews } from "@/db/schema";
import { eq } from "drizzle-orm";
import { sendReviewNotification } from "@/lib/integrations/whatsapp";
import { telegramNewReview } from "@/lib/integrations/telegram";

// GET /api/public/feedback/[token] - get order info for feedback form
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    const order = await db.query.orders.findFirst({
      where: eq(orders.feedbackToken, token),
      with: { dessert: true },
    });

    if (!order) {
      return NextResponse.json({ error: "Link tidak sah" }, { status: 404 });
    }

    const existing = await db.query.reviews.findFirst({
      where: eq(reviews.orderId, order.id),
    });

    return NextResponse.json({
      orderId: order.id,
      customerName: order.customerName,
      dessertName: order.dessert?.name || "Dessert",
      alreadyReviewed: !!existing,
    });
  } catch (error) {
    console.error("Error fetching feedback info:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// POST /api/public/feedback/[token] - submit review
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const body = await request.json();
    const { rating, comment } = body;

    const ratingNum = parseInt(rating);
    if (!ratingNum || ratingNum < 1 || ratingNum > 5) {
      return NextResponse.json(
        { error: "Rating mestilah antara 1 hingga 5" },
        { status: 400 }
      );
    }

    const order = await db.query.orders.findFirst({
      where: eq(orders.feedbackToken, token),
    });

    if (!order) {
      return NextResponse.json({ error: "Link tidak sah" }, { status: 404 });
    }

    const existing = await db.query.reviews.findFirst({
      where: eq(reviews.orderId, order.id),
    });
    if (existing) {
      return NextResponse.json(
        { error: "Order ini sudah diberi feedback" },
        { status: 409 }
      );
    }

    await db.insert(reviews).values({
      orderId: order.id,
      affiliateId: order.affiliateId,
      dessertId: order.dessertId,
      customerName: order.customerName,
      rating: ratingNum,
      comment: comment?.trim() || null,
      isVisible: ratingNum >= 4 ? 1 : 0, // auto-show only 4-5 stars
    });

    // Notify admin about the new review (non-blocking)
    try {
      const fullOrder = await db.query.orders.findFirst({
        where: eq(orders.feedbackToken, token),
        with: { dessert: true },
      });
      sendReviewNotification({
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        rating: ratingNum,
        comment: comment?.trim() || null,
        dessertName: fullOrder?.dessert?.name,
        source: "order",
      }).catch((e) => console.error("Review notify failed:", e));

      telegramNewReview({
        customerName: order.customerName,
        rating: ratingNum,
        comment: comment?.trim() || null,
        dessertName: fullOrder?.dessert?.name,
      }).catch((e) => console.error("Telegram review notify failed:", e));
    } catch (e) {
      console.error("Review notify setup failed:", e);
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("Error submitting feedback:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

