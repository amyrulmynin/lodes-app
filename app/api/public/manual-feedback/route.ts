import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { reviews } from "@/db/schema";
import { sendReviewNotification } from "@/lib/integrations/whatsapp";
import { telegramNewReview } from "@/lib/integrations/telegram";

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
      agentId: null,
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

    // Telegram notification (non-blocking)
    telegramNewReview({
      customerName: name.trim(),
      rating: ratingNum,
      comment: comment?.trim() || null,
    }).catch((e) => console.error("Telegram review notify failed:", e));

    // Build WhatsApp share message for the customer - direct stars
    const stars = "⭐".repeat(ratingNum);
    const lines = [
      `Hi Lodes Desserts! Saya ${name.trim()}.`,
      "",
      `Rating: ${stars} (${ratingNum}/5)`,
      comment?.trim() ? `Komen: ${comment.trim()}` : "",
      "",
      "Terima kasih!",
    ];
    // Use api.whatsapp.com/send which handles UTF-8 emoji more reliably
    // than wa.me on some devices
    const whatsappUrl = `https://api.whatsapp.com/send?phone=${ADMIN_WHATSAPP}&text=${encodeURIComponent(
      lines.join("\n")
    )}`;

    return NextResponse.json({ success: true, whatsappUrl }, { status: 201 });
  } catch (error) {
    console.error("Error submitting manual feedback:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
