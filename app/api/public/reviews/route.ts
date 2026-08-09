import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { reviews } from "@/db/schema";
import { desc } from "drizzle-orm";

// GET /api/public/reviews - public testimonials (visible only, 4-5 stars)
export async function GET(request: NextRequest) {
  try {
    const all = await db.query.reviews.findMany({
      with: { dessert: true },
      orderBy: desc(reviews.createdAt),
    });

    const visible = all.filter((r) => r.isVisible === 1).slice(0, 12);

    return NextResponse.json(
      visible.map((r) => ({
        id: r.id,
        customerName: r.customerName,
        rating: r.rating,
        comment: r.comment,
        dessertName: r.dessert?.name || "Dessert",
        createdAt: r.createdAt,
      }))
    );
  } catch (error) {
    console.error("Error fetching public reviews:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
