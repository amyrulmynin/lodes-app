import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";

// GET /api/orders/[id]/feedback-token - get or generate feedback token
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const orderId = parseInt(id);

    const order = await db.query.orders.findFirst({
      where: eq(orders.id, orderId),
    });

    if (!order) {
      return NextResponse.json({ error: "Order tidak dijumpai" }, { status: 404 });
    }

    // Only admin or the owning affiliate can access
    const isOwner = order.affiliateId === parseInt(session.user.id || "0");
    if (session.user.role !== "admin" && !isOwner) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    let token = order.feedbackToken;
    if (!token) {
      token = crypto.randomBytes(24).toString("hex");
      await db
        .update(orders)
        .set({ feedbackToken: token })
        .where(eq(orders.id, orderId));
    }

    return NextResponse.json({ token });
  } catch (error) {
    console.error("Error getting feedback token:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
