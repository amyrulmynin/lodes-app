import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { agents } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  try {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const allAgents = await db.query.agents.findMany({
      orderBy: desc(agents.createdAt),
    });

    return NextResponse.json(allAgents);
  } catch (error) {
    console.error("Error fetching agents:", error);
    return NextResponse.json({ error: "Failed to fetch agents" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, phone, email, address, notes } = body;

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const newAgent = await db.insert(agents).values({
      name,
      phone: phone || null,
      email: email || null,
      address: address || null,
      notes: notes || null,
    }).returning();

    return NextResponse.json(newAgent[0], { status: 201 });
  } catch (error) {
    console.error("Error creating agent:", error);
    return NextResponse.json({ error: "Failed to create agent" }, { status: 500 });
  }
}
