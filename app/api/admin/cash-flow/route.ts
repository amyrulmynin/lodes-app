import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { cashFlow } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  try {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const allCashFlow = await db.query.cashFlow.findMany({
      orderBy: desc(cashFlow.createdAt),
    });

    return NextResponse.json(allCashFlow);
  } catch (error) {
    console.error("Error fetching cash flow:", error);
    return NextResponse.json({ error: "Failed to fetch cash flow" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { type, category, description, amount, referenceId, referenceType, flowDate } = body;

    if (!type || !category || !description || !amount) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const newEntry = await db.insert(cashFlow).values({
      type,
      category,
      description,
      amount,
      referenceId: referenceId || null,
      referenceType: referenceType || null,
      flowDate: flowDate ? new Date(flowDate) : new Date(),
    }).returning();

    return NextResponse.json(newEntry[0], { status: 201 });
  } catch (error) {
    console.error("Error creating cash flow entry:", error);
    return NextResponse.json({ error: "Failed to create cash flow entry" }, { status: 500 });
  }
}
