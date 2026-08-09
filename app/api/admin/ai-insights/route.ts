import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { orders, withdrawals, users, reviews } from "@/db/schema";
import { eq } from "drizzle-orm";
import { askAi } from "@/lib/integrations/ai";

// POST /api/admin/ai-insights - generate business insights from real data
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const customQuestion: string | undefined = body?.question;

    // ===== Gather real business data =====
    const acceptedOrders = await db.query.orders.findMany({
      where: eq(orders.status, "accepted"),
      with: { affiliate: true, dessert: true },
    });
    const pendingOrders = await db.query.orders.findMany({
      where: eq(orders.status, "pending"),
    });
    const allWithdrawals = await db.query.withdrawals.findMany({
      with: { affiliate: true },
    });
    const affiliates = await db.query.users.findMany({
      where: eq(users.role, "affiliate"),
    });
    const allReviews = await db.query.reviews.findMany({
      with: { dessert: true },
    });

    // Aggregate
    const totalRevenue = acceptedOrders.reduce(
      (s, o) => s + parseFloat(o.totalPrice),
      0
    );
    const totalWithdrawn = allWithdrawals
      .filter((w) => w.status === "accepted")
      .reduce((s, w) => s + parseFloat(w.amount), 0);

    // Top desserts
    const dessertMap = new Map<string, { units: number; revenue: number }>();
    for (const o of acceptedOrders) {
      const name = o.dessert?.name || "Unknown";
      const e = dessertMap.get(name) || { units: 0, revenue: 0 };
      e.units += o.quantity;
      e.revenue += parseFloat(o.totalPrice);
      dessertMap.set(name, e);
    }
    const topDesserts = Array.from(dessertMap.entries())
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Top affiliates
    const affMap = new Map<string, { orders: number; revenue: number }>();
    for (const o of acceptedOrders) {
      const name = o.affiliate?.name || "Unknown";
      const e = affMap.get(name) || { orders: 0, revenue: 0 };
      e.orders += 1;
      e.revenue += parseFloat(o.totalPrice);
      affMap.set(name, e);
    }
    const topAffiliates = Array.from(affMap.entries())
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Reviews summary (no PII)
    const avgRating =
      allReviews.length > 0
        ? (
            allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length
          ).toFixed(1)
        : "0";
    const recentComments = allReviews
      .filter((r) => r.comment)
      .slice(0, 15)
      .map((r) => `(${r.rating}/5) ${r.comment}`);

    // ===== Build prompt =====
    const dataSummary = `
DATA BISNES LODES DESSERTS:

KEWANGAN:
- Total revenue (order diterima): RM ${totalRevenue.toFixed(2)}
- Total komisen dibayar (withdrawal): RM ${totalWithdrawn.toFixed(2)}
- Orders diterima: ${acceptedOrders.length}
- Orders pending: ${pendingOrders.length}
- Bilangan affiliate: ${affiliates.length}

TOP DESSERTS (ikut revenue):
${topDesserts.map((d) => `- ${d.name}: ${d.units} unit, RM ${d.revenue.toFixed(2)}`).join("\n") || "(tiada data)"}

TOP AFFILIATES (ikut revenue):
${topAffiliates.map((a) => `- ${a.name}: ${a.orders} order, RM ${a.revenue.toFixed(2)}`).join("\n") || "(tiada data)"}

CUSTOMER REVIEWS:
- Jumlah review: ${allReviews.length}
- Purata rating: ${avgRating}/5
- Komen terkini:
${recentComments.map((c) => `  ${c}`).join("\n") || "  (tiada komen)"}
    `.trim();

    const systemPrompt =
      "Anda ialah Lodes AI Copilot — pembantu analisis bisnes untuk perniagaan dessert. Jawab dalam Bahasa Melayu yang santai dan mudah faham. Berikan analisis yang jelas, praktikal dan actionable. Gunakan format dengan tajuk dan bullet points. Jangan reka data yang tidak diberikan.";

    const userPrompt = customQuestion?.trim()
      ? `${dataSummary}\n\nSOALAN ADMIN: ${customQuestion.trim()}`
      : `${dataSummary}\n\nBerdasarkan data di atas, berikan analisis bisnes ringkas: (1) Prestasi keseluruhan, (2) Apa yang berjalan dengan baik, (3) Risiko atau masalah, (4) 3 cadangan tindakan praktikal untuk minggu ini.`;

    const result = await askAi(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      { maxTokens: 4000, temperature: 0.5 }
    );

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 502 });
    }

    return NextResponse.json({ insight: result.content });
  } catch (error) {
    console.error("Error generating AI insight:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
