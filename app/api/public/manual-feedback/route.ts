import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { reviews } from "@/db/schema";
import { sendReviewNotification } from "@/lib/integrations/whatsapp";

const ADMIN_WHATSAPP = "60166673810";

// POST /api/public/manual-feedback - public manual review (no order needed)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, phone, rating, comment } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: "Nama diperlukan" }, { status: 400 });
    }
    if (!phone?.trim()) {
      return NextResponse.json(
        { error: "No. WhatsApp diperlukan" },
        { status: 400 }
      );
    }

    const ratingNum = parseInt(rating);
    if (!ratingNum || ratingNum < 1 || ratingNum > 5) {
      return NextResponse.json(
        { error: "Rating mestilah antara 1 hingga 5" },
        { status: 400 }
      );
    }

    await db.insert(reviews).values({
      orderId: null,
      affiliateId: null,
      dessertId: null,
      customerName: name.trim(),
      customerPhone: phone.trim(),
      source: "manual",
      rating: ratingNum,
      comment: comment?.trim() || null,
      isVisible: ratingNum >= 4 ? 1 : 0,
    });

    // Notify admin about the new review (non-blocking)
    sendReviewNotification({
      customerName: name.trim(),
      customerPhone: phone.trim(),
      rating: ratingNum,
      comment: comment?.trim() || null,
      source: "manual",
    }).catch((e) => console.error("Review notify failed:", e));

    // Build WhatsApp share message for the customer
    const stars = "?".repeat(ratingNum) + "?".repeat(5 - ratingNum);
    const waMessage = `Hi Lodes Desserts! Saya ${name.trim()}.%0A%0ARating: ${stars} (${ratingNum}/5)%0A${comment?.trim() ? "Komen: " + encodeURIComponent(comment.trim()) + "%0A" : ""}%0ATerima kasih!`;
    const whatsappUrl = `https://wa.me/${ADMIN_WHATSAPP}?text=${waMessage.replace(/ /g, "%20")}`;

    return NextResponse.json({ success: true, whatsappUrl }, { status: 201 });
  } catch (error) {
    console.error("Error submitting manual feedback:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

