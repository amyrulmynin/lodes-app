import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { users, withdrawals } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, parseInt(session.user.id)),
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Calculate total earnings (current balance + accepted withdrawals)
    const acceptedWithdrawals = await db.query.withdrawals.findMany({
      where: eq(withdrawals.affiliateId, parseInt(session.user.id)),
    });

    const totalWithdrawn = acceptedWithdrawals
      .filter(w => w.status === "accepted")
      .reduce((sum, w) => sum + parseFloat(w.amount), 0);

    const totalEarned = parseFloat(user.commissionBalance) + totalWithdrawn;

    const { password, ...userWithoutPassword } = user;

    return NextResponse.json({
      ...userWithoutPassword,
      totalEarned: totalEarned.toFixed(2),
      totalWithdrawn: totalWithdrawn.toFixed(2),
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, phone, bankName, bankAccount } = body;

    const updated = await db
      .update(users)
      .set({
        ...(name && { name }),
        ...(phone !== undefined && { phone }),
        ...(bankName !== undefined && { bankName }),
        ...(bankAccount !== undefined && { bankAccount }),
        updatedAt: new Date(),
      })
      .where(eq(users.id, parseInt(session.user.id)))
      .returning();

    const { password, ...userWithoutPassword } = updated[0];

    return NextResponse.json(userWithoutPassword);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
