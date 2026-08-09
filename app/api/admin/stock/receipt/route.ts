import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { analyseImage } from "@/lib/integrations/ai";

// POST /api/admin/stock/receipt - AI reads a purchase receipt image
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { image } = body; // base64 data URL

    if (!image || !image.startsWith("data:image")) {
      return NextResponse.json(
        { error: "Gambar resit diperlukan" },
        { status: 400 }
      );
    }

    const prompt = `Anda ialah pembantu yang membaca resit pembelian. Analisis gambar resit ini dan ekstrak maklumat dalam format JSON yang sah sahaja (tanpa markdown, tanpa penjelasan):

{
  "store": "nama kedai",
  "date": "tarikh jika ada",
  "items": [
    { "name": "nama item", "quantity": 1, "unit": "pcs", "price": 0.00 }
  ],
  "total": 0.00
}

Peraturan:
- Hanya return JSON sahaja
- quantity mestilah nombor
- price dalam RM (nombor)
- unit: gunakan "kg", "g", "L", "ml", atau "pcs"
- Jika tidak pasti, buat anggaran munasabah`;

    const result = await analyseImage(image, prompt);

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 502 });
    }

    // Parse JSON from AI response (strip markdown fences if present)
    let text = result.content!.trim();
    text = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      return NextResponse.json(
        { error: "AI tidak dapat membaca resit dengan jelas", raw: text },
        { status: 422 }
      );
    }

    return NextResponse.json({ success: true, receipt: parsed });
  } catch (error) {
    console.error("Receipt OCR error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
