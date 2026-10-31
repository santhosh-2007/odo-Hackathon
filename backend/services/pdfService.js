const PDFDocument = require('pdfkit');

function formatCurrency(amount) {
  const num = parseFloat(amount || 0);
  return 'INR ' + num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function generateInvoicePdf(invoice, lines, customer, payments, res) {
  const doc = new PDFDocument({ margin: 40, size: 'A4', bufferPages: true });

  // Handle stream errors
  doc.on('error', (err) => {
    console.error('PDFKit error:', err);
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: 'PDF generation failed.' });
    }
  });

  // Stream output to HTTP response
  doc.pipe(res);

  // Header Banner: Dark Navy Blue (#0F172A)
  doc.rect(0, 0, doc.page.width, 95).fill('#0F172A');

  // Company Name / Logo text
  doc.fillColor('#FFFFFF')
     .fontSize(20)
     .font('Helvetica-Bold')
     .text('BRIGHTLOOP SOFTWARE', 40, 26);

  doc.fontSize(9)
     .font('Helvetica')
     .fillColor('#CBD5E1')
     .text('Enterprise SaaS & Subscription Cloud Platform', 40, 52)
     .text('GSTIN: 07AABCB9921M1Z1  |  support@brightloop.com  |  www.brightloop.com', 40, 66);

  // Invoice Title & Status Badge
  doc.fillColor('#0F172A')
     .fontSize(18)
     .font('Helvetica-Bold')
     .text('TAX INVOICE', 40, 115);

  const status = (invoice.payment_status || 'unpaid').toUpperCase();
  let badgeColor = '#EF4444'; // Red
  if (status === 'PAID') badgeColor = '#10B981'; // Green
  else if (status === 'PARTIAL') badgeColor = '#F59E0B'; // Amber
  else if (status === 'UNPAID') badgeColor = '#3B82F6'; // Blue

  doc.rect(415, 113, 140, 26).fillAndStroke(badgeColor, badgeColor);
  doc.fillColor('#FFFFFF')
     .fontSize(10)
     .font('Helvetica-Bold')
     .text(status, 415, 120, { width: 140, align: 'center' });

  // Invoice Details Block (Left)
  doc.fillColor('#334155').fontSize(9.5).font('Helvetica');
  doc.text(`Invoice Number: `, 40, 150, { continued: true }).font('Helvetica-Bold').text(String(invoice.invoice_number || ''));
  doc.font('Helvetica').text(`Invoice Date: `, 40, 165, { continued: true }).font('Helvetica-Bold').text(String(invoice.invoice_date || ''));
  doc.font('Helvetica').text(`Due Date: `, 40, 180, { continued: true }).font('Helvetica-Bold').text(String(invoice.due_date || ''));

  if (invoice.subscription_number) {
    doc.font('Helvetica').text(`Subscription Ref: `, 40, 195, { continued: true })
       .font('Helvetica-Bold').text(String(invoice.subscription_number));
  }

  if (invoice.billing_period_start && invoice.billing_period_end) {
    doc.font('Helvetica').text(`Billing Period: `, 40, 210, { continued: true })
       .font('Helvetica-Bold').text(`${invoice.billing_period_start} to ${invoice.billing_period_end}`);
  }

  // Billed To Block (Right)
  doc.font('Helvetica-Bold').fontSize(10).fillColor('#0F172A').text('BILLED TO:', 320, 150);
  doc.font('Helvetica-Bold').fontSize(9.5).fillColor('#1E293B').text(customer.company_name || customer.contact_name || 'Valued Customer', 320, 165);
  doc.font('Helvetica').fontSize(9).fillColor('#64748B')
     .text(`Attn: ${customer.contact_name || 'N/A'}`, 320, 180)
     .text(`Email: ${customer.email || 'N/A'}`, 320, 193)
     .text(`Phone: ${customer.phone || 'N/A'}`, 320, 206)
     .text(`GSTIN / Tax ID: ${customer.tax_id || 'N/A'}`, 320, 219);

  if (customer.billing_address) {
    doc.text(customer.billing_address, 320, 232, { width: 235 });
  }

  // Table Header
  const tableTop = 275;
  const pageWidth = doc.page.width - 80;
  doc.rect(40, tableTop, pageWidth, 22).fill('#F1F5F9');
  doc.fillColor('#0F172A').fontSize(8.5).font('Helvetica-Bold');
  doc.text('#', 48, tableTop + 6);
  doc.text('Description / Service Item', 75, tableTop + 6);
  doc.text('Qty', 270, tableTop + 6, { width: 35, align: 'right' });
  doc.text('Unit Price', 315, tableTop + 6, { width: 65, align: 'right' });
  doc.text('Tax (GST)', 390, tableTop + 6, { width: 55, align: 'right' });
  doc.text('Total', 455, tableTop + 6, { width: 90, align: 'right' });

  // Table Lines
  let y = tableTop + 26;
  doc.font('Helvetica').fontSize(8.5);

  const safeLines = Array.isArray(lines) && lines.length > 0 ? lines : [
    { description: 'Cloud Subscription Plan', quantity: 1, unit_price: invoice.subtotal || 0, tax_rate: 18, tax_amount: invoice.tax_amount || 0, line_total: invoice.total_amount || 0 }
  ];

  safeLines.forEach((line, idx) => {
    doc.fillColor('#1E293B');
    doc.text(String(idx + 1), 48, y);
    doc.text(line.description || 'Subscription Line Item', 75, y, { width: 190 });
    doc.text(String(line.quantity || 1), 270, y, { width: 35, align: 'right' });
    doc.text(formatCurrency(line.unit_price), 315, y, { width: 65, align: 'right' });
    doc.text(formatCurrency(line.tax_amount), 390, y, { width: 55, align: 'right' });
    doc.text(formatCurrency(line.line_total), 455, y, { width: 90, align: 'right' });

    y += 20;
    // Horizontal separator
    doc.strokeColor('#E2E8F0').lineWidth(0.5).moveTo(40, y).lineTo(555, y).stroke();
    y += 5;
  });

  // Totals Summary Box
  y = Math.max(y + 10, 420);
  const totalsX = 310;
  const totalsWidth = 245;
  const totalsHeight = parseFloat(invoice.discount_amount) > 0 ? 125 : 108;

  doc.rect(totalsX, y, totalsWidth, totalsHeight).fill('#F8FAFC');
  doc.strokeColor('#CBD5E1').lineWidth(0.75).rect(totalsX, y, totalsWidth, totalsHeight).stroke();

  let totY = y + 10;
  doc.font('Helvetica').fontSize(8.5).fillColor('#475569');
  doc.text('Subtotal:', totalsX + 12, totY);
  doc.text(formatCurrency(invoice.subtotal), totalsX + 100, totY, { width: 130, align: 'right' });

  totY += 16;
  doc.text('Tax Amount (GST):', totalsX + 12, totY);
  doc.text(formatCurrency(invoice.tax_amount), totalsX + 100, totY, { width: 130, align: 'right' });

  if (parseFloat(invoice.discount_amount) > 0) {
    totY += 16;
    doc.font('Helvetica').fillColor('#059669');
    doc.text('Discount Applied:', totalsX + 12, totY);
    doc.text('- ' + formatCurrency(invoice.discount_amount), totalsX + 100, totY, { width: 130, align: 'right' });
  }

  totY += 18;
  doc.font('Helvetica-Bold').fontSize(10).fillColor('#0F172A');
  doc.text('Total Amount:', totalsX + 12, totY);
  doc.text(formatCurrency(invoice.total_amount), totalsX + 100, totY, { width: 130, align: 'right' });

  totY += 18;
  doc.font('Helvetica').fontSize(8.5).fillColor('#059669');
  doc.text('Paid Amount:', totalsX + 12, totY);
  doc.text(formatCurrency(invoice.amount_paid), totalsX + 100, totY, { width: 130, align: 'right' });

  totY += 16;
  doc.font('Helvetica-Bold').fontSize(9).fillColor('#DC2626');
  doc.text('Balance Due:', totalsX + 12, totY);
  doc.text(formatCurrency(invoice.amount_due), totalsX + 100, totY, { width: 130, align: 'right' });

  // Bank & Payment Instructions (Left box)
  doc.font('Helvetica-Bold').fontSize(9).fillColor('#0F172A').text('BANK & REMITTANCE DETAILS', 40, y + 5);
  doc.font('Helvetica').fontSize(8).fillColor('#475569')
     .text('Beneficiary: Brightloop Software Private Limited', 40, y + 22)
     .text('Bank: HDFC Bank Limited (Cyber City Branch)', 40, y + 35)
     .text('Account Number: 50200088992211 (Current Account)', 40, y + 48)
     .text('IFSC Code: HDFC0001234', 40, y + 61)
     .text('UPI ID: brightloop@hdfcbank', 40, y + 74);

  if (invoice.notes) {
    doc.font('Helvetica-Oblique').fontSize(8).fillColor('#64748B')
       .text(`Notes: ${invoice.notes}`, 40, y + 92, { width: 250 });
  }

  // Footer Banner
  doc.fontSize(7.5).font('Helvetica').fillColor('#94A3B8')
     .text('Thank you for your business. This is a computer-generated tax invoice issued by Brightloop Software Private Limited and requires no physical signature.', 40, 785, { align: 'center', width: doc.page.width - 80 });

  doc.end();
}

module.exports = {
  generateInvoicePdf
};
