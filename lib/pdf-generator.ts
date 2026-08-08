import jsPDF from 'jspdf';

interface WithdrawalData {
  id: number;
  amount: string;
  withdrawalMethod: string;
  bankName?: string | null;
  bankAccount?: string | null;
  accountHolder?: string | null;
  qrCodeUrl?: string | null;
  status: string;
  requestedAt: Date;
  notes?: string | null;
}

interface AffiliateData {
  name: string;
  email: string;
  phone?: string | null;
  commissionBalance: string;
}

export function generateCommissionStatementPDF(
  withdrawal: WithdrawalData,
  affiliate: AffiliateData
) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  const primaryColor: [number, number, number] = [79, 70, 229];
  const lightGray: [number, number, number] = [243, 244, 246];
  const darkGray: [number, number, number] = [55, 65, 81];
  const greenColor: [number, number, number] = [34, 197, 94];
  
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('LODES DESSERTS', pageWidth / 2, 18, { align: 'center' });
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('Commission Statement', pageWidth / 2, 28, { align: 'center' });
  
  let yPos = 55;
  
  doc.setTextColor(...darkGray);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Statement Date: ${new Date().toLocaleDateString('en-MY', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })}`, pageWidth - 20, yPos, { align: 'right' });
  
  yPos += 5;
  doc.text(`Withdrawal ID: #${withdrawal.id}`, pageWidth - 20, yPos, { align: 'right' });
  
  yPos = 55;
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text('AFFILIATE INFORMATION', 20, yPos);
  
  yPos += 8;
  doc.setFontSize(11);
  doc.setTextColor(...darkGray);
  doc.setFont('helvetica', 'bold');
  doc.text(affiliate.name, 20, yPos);
  
  yPos += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(affiliate.email, 20, yPos);
  
  if (affiliate.phone) {
    yPos += 5;
    doc.text(affiliate.phone, 20, yPos);
  }
  
  yPos += 20;
  
  doc.setFillColor(...lightGray);
  doc.rect(15, yPos - 8, pageWidth - 30, 35, 'F');
  
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text('WITHDRAWAL DETAILS', 20, yPos);
  
  yPos += 10;
  doc.setFontSize(12);
  doc.setTextColor(...darkGray);
  doc.setFont('helvetica', 'bold');
  doc.text('Withdrawal Amount:', 20, yPos);
  doc.setTextColor(...greenColor);
  doc.setFontSize(16);
  doc.text(`RM ${parseFloat(withdrawal.amount).toFixed(2)}`, pageWidth - 20, yPos, { align: 'right' });
  
  yPos += 10;
  doc.setFontSize(10);
  doc.setTextColor(...darkGray);
  doc.setFont('helvetica', 'normal');
  doc.text('Request Date:', 20, yPos);
  doc.text(new Date(withdrawal.requestedAt).toLocaleDateString('en-MY', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }), pageWidth - 20, yPos, { align: 'right' });
  
  yPos += 20;
  
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  
  if (withdrawal.withdrawalMethod === 'qr') {
    doc.text('PAYMENT METHOD', 20, yPos);
    
    yPos += 8;
    doc.setFontSize(11);
    doc.setTextColor(...darkGray);
    doc.setFont('helvetica', 'bold');
    doc.text('Method:', 20, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text('QR Code E-Wallet', 60, yPos);
    
    yPos += 7;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text('Payment will be made via QR code scan to affiliate e-wallet', 20, yPos);
    
    yPos += 15;
  } else {
    doc.text('BANK ACCOUNT DETAILS', 20, yPos);
    
    yPos += 8;
    doc.setFontSize(11);
    doc.setTextColor(...darkGray);
    doc.setFont('helvetica', 'bold');
    doc.text('Bank:', 20, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(withdrawal.bankName || 'N/A', 60, yPos);
    
    yPos += 7;
    doc.setFont('helvetica', 'bold');
    doc.text('Account No:', 20, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(withdrawal.bankAccount || 'N/A', 60, yPos);
    
    yPos += 7;
    doc.setFont('helvetica', 'bold');
    doc.text('Account Holder:', 20, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(withdrawal.accountHolder || 'N/A', 60, yPos);
    
    yPos += 15;
  }
  
  let statusColor: [number, number, number];
  let statusText: string;
  
  switch (withdrawal.status) {
    case 'accepted':
      statusColor = [34, 197, 94];
      statusText = 'APPROVED';
      break;
    case 'rejected':
      statusColor = [239, 68, 68];
      statusText = 'REJECTED';
      break;
    default:
      statusColor = [234, 179, 8];
      statusText = 'PENDING';
  }
  
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text('STATUS', 20, yPos);
  
  yPos += 8;
  doc.setFillColor(...statusColor);
  doc.roundedRect(20, yPos - 5, 40, 8, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(statusText, 40, yPos, { align: 'center' });
  
  if (withdrawal.notes) {
    yPos += 15;
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.setFont('helvetica', 'normal');
    doc.text('ADMIN NOTES', 20, yPos);
    
    yPos += 8;
    doc.setFontSize(10);
    doc.setTextColor(...darkGray);
    const splitNotes = doc.splitTextToSize(withdrawal.notes, pageWidth - 40);
    doc.text(splitNotes, 20, yPos);
    yPos += splitNotes.length * 5;
  }
  
  yPos += 20;
  doc.setFillColor(...lightGray);
  doc.rect(15, yPos - 8, pageWidth - 30, 25, 'F');
  
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text('CURRENT COMMISSION BALANCE', 20, yPos);
  
  yPos += 10;
  doc.setFontSize(14);
  doc.setTextColor(...primaryColor);
  doc.setFont('helvetica', 'bold');
  doc.text(`RM ${parseFloat(affiliate.commissionBalance).toFixed(2)}`, pageWidth - 20, yPos, { align: 'right' });
  
  const footerY = pageHeight - 25;
  doc.setDrawColor(200, 200, 200);
  doc.line(20, footerY, pageWidth - 20, footerY);
  
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.setFont('helvetica', 'normal');
  doc.text('LODES Desserts - Affiliate Commission Statement', pageWidth / 2, footerY + 8, { align: 'center' });
  doc.text(`Generated on ${new Date().toLocaleString('en-MY')}`, pageWidth / 2, footerY + 13, { align: 'center' });
  doc.text('This is a computer generated document. No signature required.', pageWidth / 2, footerY + 18, { align: 'center' });
  
  const fileName = `Commission_Statement_${withdrawal.id}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
}
