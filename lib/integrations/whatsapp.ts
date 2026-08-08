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
