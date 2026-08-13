import jsPDF from 'jspdf';

export interface InvoiceItem {
  name: string;
  price: number;
  quantity: number;
}

export interface InvoiceOrder {
  id: number;
  quantity: number;
  totalPrice: string;
  customerName: string;
  customerPhone: string;
  customerAddress?: string | null;
  notes?: string | null;
  status: string;
  submittedAt: Date | string;
  dessert: {
    name: string;
    price?: string;
  };
  affiliate?: {
    name: string;
    phone?: string | null;
  } | null;
}

export interface ManualInvoiceData {
  invoiceNumber: string;
  invoiceDate: Date | string;
  customerName: string;
  customerPhone: string;
  customerAddress?: string;
  items: InvoiceItem[];
  notes?: string;
  status: string;
}

export interface InvoicePaymentSettings {
  bankName?: string | null;
  accountNumber?: string | null;
  accountHolder?: string | null;
  paymentInstructions?: string | null;
  qrCodeUrl?: string | null;
}

function statusLabel(status: string): { color: [number, number, number]; text: string } {
  switch (status) {
    case 'accepted':
      return { color: [34, 197, 94], text: 'DISAHKAN' };
    case 'rejected':
      return { color: [239, 68, 68], text: 'DITOLAK' };
    case 'paid':
      return { color: [34, 197, 94], text: 'DIBAYAR' };
    default:
      return { color: [234, 179, 8], text: 'MENUNGGU PENGESAHAN' };
  }
}

function buildInvoicePDF(params: {
  invoiceNumber: string;
  invoiceDate: Date;
  customerName: string;
  customerPhone: string;
  customerAddress?: string | null;
  items: InvoiceItem[];
  notes?: string | null;
  status: string;
  affiliate?: { name: string; phone?: string | null } | null;
  paymentSettings?: InvoicePaymentSettings | null;
}) {
  const {
    invoiceNumber,
    invoiceDate,
    customerName,
    customerPhone,
    customerAddress,
    items,
    notes,
    status,
    affiliate,
    paymentSettings,
  } = params;

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const primaryColor: [number, number, number] = [250, 204, 21]; // yellow
  const onPrimaryColor: [number, number, number] = [0, 0, 0]; // black text on yellow
  const lightGray: [number, number, number] = [243, 244, 246];
  const darkGray: [number, number, number] = [55, 65, 81];

  const grandTotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  // ===== Header =====
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 40, 'F');

  doc.setTextColor(...onPrimaryColor);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('LODES DESSERTS', pageWidth / 2, 18, { align: 'center' });

  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.text('INVOICE', pageWidth / 2, 30, { align: 'center' });

  let yPos = 55;

  // ===== Invoice meta (right) =====
  doc.setTextColor(...darkGray);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(invoiceNumber, pageWidth - 20, yPos, { align: 'right' });

  yPos += 5;
  doc.setFont('helvetica', 'normal');
  doc.text(
    `Tarikh: ${invoiceDate.toLocaleDateString('ms-MY', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })}`,
    pageWidth - 20,
    yPos,
    { align: 'right' }
  );

  // Status badge
  yPos += 7;
  const { color: statusColor, text: statusText } = statusLabel(status);
  doc.setFillColor(...statusColor);
  const statusWidth = doc.getTextWidth(statusText) + 10;
  doc.roundedRect(pageWidth - 20 - statusWidth, yPos - 4.5, statusWidth, 7, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text(statusText, pageWidth - 20 - statusWidth / 2, yPos, { align: 'center' });

  // ===== Bill To (left) =====
  yPos = 55;
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.setFont('helvetica', 'normal');
  doc.text('KEPADA (BILL TO)', 20, yPos);

  yPos += 8;
  doc.setFontSize(12);
  doc.setTextColor(...darkGray);
  doc.setFont('helvetica', 'bold');
  doc.text(customerName, 20, yPos);

  yPos += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(customerPhone, 20, yPos);

  if (customerAddress) {
    yPos += 5;
    const splitAddress = doc.splitTextToSize(customerAddress, pageWidth / 2 - 30);
    doc.text(splitAddress, 20, yPos);
    yPos += splitAddress.length * 5;
  }

  // ===== From (seller/agent) =====
  if (affiliate) {
    yPos = 80;
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text('EJEN / AFFILIATE', pageWidth / 2 + 10, yPos);

    yPos += 7;
    doc.setFontSize(10);
    doc.setTextColor(...darkGray);
    doc.setFont('helvetica', 'bold');
    doc.text(affiliate.name, pageWidth / 2 + 10, yPos);

    if (affiliate.phone) {
      yPos += 5;
      doc.setFont('helvetica', 'normal');
      doc.text(affiliate.phone, pageWidth / 2 + 10, yPos);
    }
  }

  yPos = Math.max(yPos + 15, 105);

  // ===== Items table =====
  // Table header
  doc.setFillColor(...primaryColor);
  doc.rect(15, yPos - 6, pageWidth - 30, 10, 'F');
  doc.setTextColor(...onPrimaryColor);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('ITEM', 20, yPos);
  doc.text('HARGA', pageWidth - 100, yPos, { align: 'right' });
  doc.text('KUANTITI', pageWidth - 60, yPos, { align: 'right' });
  doc.text('JUMLAH', pageWidth - 20, yPos, { align: 'right' });

  // Table rows
  yPos += 12;
  doc.setTextColor(...darkGray);
  doc.setFontSize(11);

  // Helper: start a new page when content would run into the footer zone
  const footerReserve = 40; // keep space so footer never overlaps content
  const ensureSpace = (needed: number) => {
    if (yPos + needed > pageHeight - footerReserve) {
      doc.addPage();
      yPos = 25;
    }
  };

  for (const item of items) {
    // New page if running out of space
    if (yPos > pageHeight - 70) {
      doc.addPage();
      yPos = 25;
    }

    const itemNameLines = doc.splitTextToSize(item.name, pageWidth - 130);
    doc.setFont('helvetica', 'normal');
    doc.text(itemNameLines, 20, yPos);
    doc.text(`RM ${item.price.toFixed(2)}`, pageWidth - 100, yPos, { align: 'right' });
    doc.text(String(item.quantity), pageWidth - 60, yPos, { align: 'right' });
    doc.setFont('helvetica', 'bold');
    doc.text(`RM ${(item.price * item.quantity).toFixed(2)}`, pageWidth - 20, yPos, {
      align: 'right',
    });

    yPos += itemNameLines.length * 5 + 8;
  }

  // Divider
  doc.setDrawColor(220, 220, 220);
  doc.line(15, yPos, pageWidth - 15, yPos);

  // ===== Total box =====
  ensureSpace(35);
  yPos += 12;
  doc.setFillColor(0, 0, 0);
  doc.rect(15, yPos - 8, pageWidth - 30, 20, 'F');

  doc.setTextColor(...primaryColor);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('JUMLAH KESELURUHAN', 20, yPos + 3);
  doc.setFontSize(16);
  doc.text(`RM ${grandTotal.toFixed(2)}`, pageWidth - 20, yPos + 3, {
    align: 'right',
  });

  yPos += 25;

  // ===== Notes =====
  if (notes) {
    const splitNotes = doc.splitTextToSize(notes, pageWidth - 40);
    ensureSpace(16 + splitNotes.length * 5);

    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.setFont('helvetica', 'normal');
    doc.text('NOTA', 20, yPos);

    yPos += 6;
    doc.setFontSize(10);
    doc.setTextColor(...darkGray);
    doc.text(splitNotes, 20, yPos);
    yPos += splitNotes.length * 5 + 8;
  }

  // ===== Payment info =====
  const hasPaymentInfo =
    paymentSettings &&
    (paymentSettings.bankName ||
      paymentSettings.accountNumber ||
      paymentSettings.accountHolder ||
      paymentSettings.paymentInstructions);

  if (hasPaymentInfo) {
    // Estimate height of the whole payment block, then break page if needed
    let blockHeight = 22; // header + spacing
    if (paymentSettings.bankName) blockHeight += 6;
    if (paymentSettings.accountNumber) blockHeight += 6;
    if (paymentSettings.accountHolder) blockHeight += 6;
    if (paymentSettings.paymentInstructions) {
      const split = doc.splitTextToSize(
        paymentSettings.paymentInstructions,
        pageWidth - 40
      );
      blockHeight += 4 + split.length * 4.5;
    }
    ensureSpace(blockHeight);

    doc.setFillColor(...lightGray);
    doc.rect(15, yPos - 6, pageWidth - 30, 10, 'F');
    doc.setFontSize(10);
    doc.setTextColor(...darkGray);
    doc.setFont('helvetica', 'bold');
    doc.text('MAKLUMAT PEMBAYARAN', 20, yPos);

    yPos += 12;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    if (paymentSettings.bankName) {
      doc.setFont('helvetica', 'bold');
      doc.text('Bank:', 20, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(paymentSettings.bankName, 60, yPos);
      yPos += 6;
    }
    if (paymentSettings.accountNumber) {
      doc.setFont('helvetica', 'bold');
      doc.text('No. Akaun:', 20, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(paymentSettings.accountNumber, 60, yPos);
      yPos += 6;
    }
    if (paymentSettings.accountHolder) {
      doc.setFont('helvetica', 'bold');
      doc.text('Nama Akaun:', 20, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(paymentSettings.accountHolder, 60, yPos);
      yPos += 6;
    }
    if (paymentSettings.paymentInstructions) {
      yPos += 2;
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      const splitInstructions = doc.splitTextToSize(
        paymentSettings.paymentInstructions,
        pageWidth - 40
      );
      doc.text(splitInstructions, 20, yPos);
      yPos += splitInstructions.length * 4.5;
    }
  }

  // ===== Footer (always below content, never overlapping) =====
  // If content is too close to the fixed footer zone, move footer lower
  // (or onto the current content flow) so it never overlaps.
  const contentBottom = yPos + 10;
  const minFooterY = pageHeight - 25;
  const footerY = Math.max(minFooterY, contentBottom);
  doc.setDrawColor(200, 200, 200);
  doc.line(20, footerY, pageWidth - 20, footerY);

  doc.setFontSize(9);
  doc.setTextColor(120, 120, 120);
  doc.setFont('helvetica', 'normal');
  doc.text('Terima kasih atas pesanan anda!', pageWidth / 2, footerY + 8, {
    align: 'center',
  });

  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text('LODES Desserts - Invoice Rasmi', pageWidth / 2, footerY + 13, {
    align: 'center',
  });
  doc.text(
    'Dokumen ini dijana secara automatik. Tiada tandatangan diperlukan.',
    pageWidth / 2,
    footerY + 18,
    { align: 'center' }
  );

  // ===== Save =====
  const fileName = `Invoice_${invoiceNumber}_${customerName.replace(/\s+/g, '_')}.pdf`;
  doc.save(fileName);
}

export function generateOrderInvoicePDF(
  order: InvoiceOrder,
  paymentSettings?: InvoicePaymentSettings | null
) {
  const unitPrice = order.dessert.price
    ? parseFloat(order.dessert.price)
    : parseFloat(order.totalPrice) / order.quantity;

  buildInvoicePDF({
    invoiceNumber: `INV-${String(order.id).padStart(5, '0')}`,
    invoiceDate: new Date(order.submittedAt),
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    customerAddress: order.customerAddress,
    items: [
      {
        name: order.dessert.name,
        price: unitPrice,
        quantity: order.quantity,
      },
    ],
    notes: order.notes,
    status: order.status,
    affiliate: order.affiliate,
    paymentSettings,
  });
}

export function generateManualInvoicePDF(
  data: ManualInvoiceData,
  paymentSettings?: InvoicePaymentSettings | null
) {
  buildInvoicePDF({
    invoiceNumber: data.invoiceNumber,
    invoiceDate: new Date(data.invoiceDate),
    customerName: data.customerName,
    customerPhone: data.customerPhone,
    customerAddress: data.customerAddress,
    items: data.items,
    notes: data.notes,
    status: data.status,
    affiliate: null,
    paymentSettings,
  });
}
