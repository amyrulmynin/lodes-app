// Emoji written as unicode escapes so they survive any file encoding.
const E = {
  star: "⭐",
  cake: "\u{1F370}",
  box: "\u{1F4E6}",
  chart: "\u{1F4CA}",
  money: "\u{1F4B0}",
  person: "\u{1F464}",
  people: "\u{1F465}",
  phone: "\u{1F4F1}",
  memo: "\u{1F4DD}",
  cart: "\u{1F6D2}",
  speech: "\u{1F4AC}",
  pray: "\u{1F64F}",
};

export async function sendWhatsAppNotification(orderData: {
  customerName: string;
  customerPhone: string;
  dessertName: string;
  quantity: number;
  totalPrice: string;
  affiliateName: string;
  customerAddress?: string;
  notes?: string;
}) {
  if (!process.env.WHATSAPP_API_URL || !process.env.WHATSAPP_API_TOKEN) {
    console.log("WhatsApp API not configured, skipping notification");
    return;
  }

  const message = `
${E.cake} *ORDER BARU LODES*

${E.box} *Dessert:* ${orderData.dessertName}
${E.chart} *Kuantiti:* ${orderData.quantity}
${E.money} *Jumlah:* RM ${orderData.totalPrice}

${E.person} *Customer:*
Nama: ${orderData.customerName}
Telefon: ${orderData.customerPhone}
${orderData.customerAddress ? `Alamat: ${orderData.customerAddress}` : ""}

${E.people} *Affiliate:* ${orderData.affiliateName}
${orderData.notes ? `\n${E.memo} *Nota:* ${orderData.notes}` : ""}

Terima kasih! ${E.pray}
  `.trim();

  try {
    const response = await fetch(process.env.WHATSAPP_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.WHATSAPP_API_TOKEN}`,
      },
      body: JSON.stringify({
        to: process.env.WHATSAPP_PHONE_NUMBER,
        message: message,
      }),
    });

    if (!response.ok) {
      throw new Error(`WhatsApp API error: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error sending WhatsApp notification:", error);
    throw error;
  }
}

// Notify admin when a new customer review is submitted
export async function sendReviewNotification(reviewData: {
  customerName: string;
  customerPhone?: string | null;
  rating: number;
  comment?: string | null;
  dessertName?: string;
  source?: string;
}) {
  if (!process.env.WHATSAPP_API_URL || !process.env.WHATSAPP_API_TOKEN) {
    console.log("WhatsApp API not configured, skipping review notification");
    return;
  }

  const stars = E.star.repeat(reviewData.rating);

  const message = `
${E.star} *REVIEW BARU LODES*

${E.person} *Customer:* ${reviewData.customerName}
${reviewData.customerPhone ? `${E.phone} *WhatsApp:* ${reviewData.customerPhone}` : ""}
${reviewData.dessertName ? `${E.cake} *Dessert:* ${reviewData.dessertName}` : ""}
${reviewData.source === "manual" ? `${E.memo} *Sumber:* Manual (link statik)` : `${E.cart} *Sumber:* Order`}

*Rating:* ${stars} (${reviewData.rating}/5)
${reviewData.comment ? `\n${E.speech} *Komen:* ${reviewData.comment}` : ""}

Semak di Admin > Reviews.
  `.trim();

  try {
    const response = await fetch(process.env.WHATSAPP_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.WHATSAPP_API_TOKEN}`,
      },
      body: JSON.stringify({
        to: process.env.WHATSAPP_PHONE_NUMBER,
        message: message,
      }),
    });

    if (!response.ok) {
      throw new Error(`WhatsApp API error: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error sending review notification:", error);
    throw error;
  }
}
