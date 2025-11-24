import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { withdrawals, users } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let allWithdrawals;

    if (session.user.role === "admin") {
      allWithdrawals = await db.query.withdrawals.findMany({
        with: {
          affiliate: true,
        },
        orderBy: desc(withdrawals.requestedAt),
      });
    } else {
      allWithdrawals = await db.query.withdrawals.findMany({
        where: eq(withdrawals.affiliateId, parseInt(session.user.id)),
        orderBy: desc(withdrawals.requestedAt),
      });
    }

    return NextResponse.json(allWithdrawals);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch withdrawals" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { amount, bankName, bankAccount, accountHolder } = body;

    if (!amount || !bankName || !bankAccount || !accountHolder) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const amountNum = parseFloat(amount);

    if (amountNum < 10) {
      return NextResponse.json(
        { error: "Minimum withdrawal amount is RM10" },
        { status: 400 }
      );
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, parseInt(session.user.id)),
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const balance = parseFloat(user.commissionBalance);

    if (balance < amountNum) {
      return NextResponse.json(
        { error: "Insufficient balance" },
        { status: 400 }
      );
    }

    const newWithdrawal = await db.insert(withdrawals).values({
      affiliateId: parseInt(session.user.id),
      amount: amount.toString(),
      bankName,
      bankAccount,
      accountHolder,
      status: 'pending',
    }).returning();

    return NextResponse.json(newWithdrawal[0], { status: 201 });
  } catch (error) {
    console.error("Error creating withdrawal:", error);
    return NextResponse.json(
      { error: "Failed to create withdrawal" },
      { status: 500 }
    );
  }
}
