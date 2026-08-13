import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { desc } from "drizzle-orm";

// GET /api/admin/customers - distinct past customers (name + phone) for reuse
export async function GET() {
  try {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const all = await db.query.orders.findMany({
      columns: { customerName: true, customerPhone: true, customerAddress: true },
      orderBy: desc(orders.submittedAt),
    });

    // Deduplicate by phone (keep most recent name/address)
    const map = new Map<string, { name: string; phone: string; address: string | null }>();
    for (const o of all) {
      const phone = (o.customerPhone || "").trim();
      if (!phone) continue;
      if (!map.has(phone)) {
        map.set(phone, {
          name: o.customerName,
          phone,
          address: o.customerAddress,
        });
      }
    }

    return NextResponse.json(Array.from(map.values()));
  } catch (error) {
    console.error("Error fetching customers:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
