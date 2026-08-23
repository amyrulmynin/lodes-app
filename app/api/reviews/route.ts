import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { reviews } from "@/db/schema";
import { desc } from "drizzle-orm";

// GET /api/reviews - admin: list all reviews with stats
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const allReviews = await db.query.reviews.findMany({
      with: { dessert: true, agent: true },
      orderBy: desc(reviews.createdAt),
    });

    const total = allReviews.length;
    const avgRating =
      total > 0
        ? allReviews.reduce((s, r) => s + r.rating, 0) / total
        : 0;
    const distribution = [5, 4, 3, 2, 1].map((star) => ({
      star,
      count: allReviews.filter((r) => r.rating === star).length,
    }));

    return NextResponse.json({
      reviews: allReviews,
      stats: {
        total,
        avgRating: avgRating.toFixed(1),
        distribution,
        visible: allReviews.filter((r) => r.isVisible === 1).length,
      },
    });
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
