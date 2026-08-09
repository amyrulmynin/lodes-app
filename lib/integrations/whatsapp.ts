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
    console.log('WhatsApp API not configured, skipping notification');
    return;
  }

  const message = `
🍰 *ORDER BARU LODES*

📦 *Dessert:* ${orderData.dessertName}
📊 *Kuantiti:* ${orderData.quantity}
💰 *Jumlah:* RM ${orderData.totalPrice}

👤 *Customer:*
Nama: ${orderData.customerName}
Telefon: ${orderData.customerPhone}
${orderData.customerAddress ? `Alamat: ${orderData.customerAddress}` : ''}

👥 *Affiliate:* ${orderData.affiliateName}
${orderData.notes ? `\n📝 *Nota:* ${orderData.notes}` : ''}

Terima kasih! 🙏
  `.trim();

  try {
    const response = await fetch(process.env.WHATSAPP_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.WHATSAPP_API_TOKEN}`,
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
    console.error('Error sending WhatsApp notification:', error);
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
    console.log('WhatsApp API not configured, skipping review notification');
    return;
  }

  const stars = '?'.repeat(reviewData.rating) + '?'.repeat(5 - reviewData.rating);

  const message = `
? *REVIEW BARU LODES*

?? *Customer:* ${reviewData.customerName}
${reviewData.customerPhone ? `?? *WhatsApp:* ${reviewData.customerPhone}` : ''}
${reviewData.dessertName ? `?? *Dessert:* ${reviewData.dessertName}` : ''}
${reviewData.source === 'manual' ? '?? *Sumber:* Manual (link statik)' : '?? *Sumber:* Order'}

*Rating:* ${stars} (${reviewData.rating}/5)
${reviewData.comment ? `\n?? *Komen:* ${reviewData.comment}` : ''}

Semak di Admin > Reviews.
  `.trim();

  try {
    const response = await fetch(process.env.WHATSAPP_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.WHATSAPP_API_TOKEN}`,
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
    console.error('Error sending review notification:', error);
    throw error;
  }
}
