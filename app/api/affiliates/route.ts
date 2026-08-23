import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { hash } from "bcryptjs";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const affiliates = await db.query.users.findMany({
      where: eq(users.role, "affiliate"),
      orderBy: desc(users.createdAt),
    });

    const sanitizedAffiliates = affiliates.map(({ password, ...rest }) => rest);

    return NextResponse.json(sanitizedAffiliates);
  } catch (error) {
    console.error("Error fetching affiliates:", error);
    return NextResponse.json(
      { error: "Failed to fetch affiliates" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, email, password, phone, bankName, bankAccount } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Nama, email dan password diperlukan" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password mestilah minimum 6 aksara" },
        { status: 400 }
      );
    }

    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email sudah digunakan" },
        { status: 400 }
      );
    }

    const hashedPassword = await hash(password, 10);

    const newAffiliate = await db.insert(users).values({
      email,
      password: hashedPassword,
      name,
      role: "affiliate",
      phone: phone || null,
      bankName: bankName || null,
      bankAccount: bankAccount || null,
      commissionBalance: "0.00",
    }).returning();

    const { password: _, ...affiliateData } = newAffiliate[0];

    return NextResponse.json(affiliateData, { status: 201 });
  } catch (error) {
    console.error("Error creating affiliate:", error);
    return NextResponse.json(
      { error: "Gagal membuat affiliate" },
      { status: 500 }
    );
  }
}
