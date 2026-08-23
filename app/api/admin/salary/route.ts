import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { founderSalaries } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  try {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const allSalaries = await db.query.founderSalaries.findMany({
      orderBy: desc(founderSalaries.createdAt),
    });

    return NextResponse.json(allSalaries);
  } catch (error) {
    console.error("Error fetching salaries:", error);
    return NextResponse.json({ error: "Failed to fetch salaries" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { founderName, amount, salaryMonth, paidAt, notes } = body;

    if (!founderName || !amount || !salaryMonth) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const newSalary = await db.insert(founderSalaries).values({
      founderName,
      amount,
      salaryMonth,
      paidAt: paidAt ? new Date(paidAt) : new Date(),
      notes: notes || null,
    }).returning();

    return NextResponse.json(newSalary[0], { status: 201 });
  } catch (error) {
    console.error("Error creating salary:", error);
    return NextResponse.json({ error: "Failed to create salary" }, { status: 500 });
  }
}
