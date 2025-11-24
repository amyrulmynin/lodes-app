import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { desserts } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const allDesserts = await db.query.desserts.findMany({
      where: eq(desserts.isActive, 1),
      orderBy: (desserts, { desc }) => [desc(desserts.createdAt)],
    });

    return NextResponse.json(allDesserts);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch desserts" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, description, price, imageUrl, commissionRate } = body;

    if (!name || !price) {
      return NextResponse.json(
        { error: "Name and price are required" },
        { status: 400 }
      );
    }

    const newDessert = await db.insert(desserts).values({
      name,
      description: description || null,
      price: price.toString(),
      imageUrl: imageUrl || null,
      commissionRate: commissionRate ? commissionRate.toString() : '10.00',
    }).returning();

    return NextResponse.json(newDessert[0], { status: 201 });
  } catch (error) {
    console.error("Error creating dessert:", error);
    return NextResponse.json(
      { error: "Failed to create dessert" },
      { status: 500 }
    );
  }
}
