import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const affiliateId = parseInt(params.id);

    const affiliate = await db.query.users.findFirst({
      where: eq(users.id, affiliateId),
    });

    if (!affiliate || affiliate.role !== "affiliate") {
      return NextResponse.json(
        { error: "Affiliate not found" },
        { status: 404 }
      );
    }

    const { password, commissionBalance, ...safeData } = affiliate;

    return NextResponse.json(safeData);
  } catch (error) {
    console.error("Error fetching affiliate:", error);
    return NextResponse.json(
      { error: "Failed to fetch affiliate" },
      { status: 500 }
    );
  }
}
