const PDFDocument = require('pdfkit');

function generateInvoicePdf(invoice, lines, customer, payments, res) {
  const doc = new PDFDocument({ margin: 50, size: 'A4' });

  // Stream output to HTTP response
  doc.pipe(res);

  // Header Banner: Dark Navy Blue (#0F172A)
  doc.rect(0, 0, doc.page.width, 100).fill('#0F172A');

  // Company Name / Logo text
  doc.fillColor('#FFFFFF')
     .fontSize(22)
     .font('Helvetica-Bold')
     .text('BRIGHTLOOP SOFTWARE', 50, 32);

  doc.fontSize(10)
     .font('Helvetica')
     .text('Enterprise SaaS & Subscription Cloud Platform', 50, 60)
     .text('GSTIN: 07AABCB9921M1Z1 | support@brightloop.com | www.brightloop.com', 50, 74);

  // Invoice Title & Status Badge
  doc.fillColor('#0F172A')
     .fontSize(20)
     .font('Helvetica-Bold')
     .text('TAX INVOICE', 50, 120);

  const status = (invoice.payment_status || 'unpaid').toUpperCase();
  let badgeColor = '#EF4444'; // Red
  if (status === 'PAID') badgeColor = '#10B981'; // Green
  else if (status === 'PARTIAL') badgeColor = '#F59E0B'; // Amber
  else if (status === 'UNPAID') badgeColor = '#3B82F6'; // Blue

  doc.rect(420, 118, 125, 26).fillAndStroke(badgeColor, badgeColor);
  doc.fillColor('#FFFFFF')
     .fontSize(11)
     .font('Helvetica-Bold')
     .text(status, 420, 125, { width: 125, align: 'center' });

  // Invoice Details Block
  doc.fillColor('#334155').fontSize(10).font('Helvetica');
  doc.text(`Invoice No: `, 50, 155, { continued: true }).font('Helvetica-Bold').text(invoice.invoice_number);
  doc.font('Helvetica').text(`Invoice Date: `, 50, 170, { continued: true }).font('Helvetica-Bold').text(invoice.invoice_date);
  doc.font('Helvetica').text(`Due Date: `, 50, 185, { continued: true }).font('Helvetica-Bold').text(invoice.due_date);

  if (invoice.billing_period_start && invoice.billing_period_end) {
    doc.font('Helvetica').text(`Billing Period: `, 50, 200, { continued: true })
       .font('Helvetica-Bold').text(`${invoice.billing_period_start} to ${invoice.billing_period_end}`);
  }

  // Billed To Block
  doc.font('Helvetica-Bold').fontSize(11).fillColor('#0F172A').text('BILLED TO:', 330, 155);
  doc.font('Helvetica-Bold').fontSize(10).fillColor('#1E293B').text(customer.company_name || customer.contact_name, 330, 170);
  doc.font('Helvetica').fontSize(9).fillColor('#64748B')
     .text(`Attn: ${customer.contact_name}`, 330, 185)
     .text(`Email: ${customer.email}`, 330, 198)
     .text(`Phone: ${customer.phone || 'N/A'}`, 330, 211)
     .text(`Tax / GSTIN: ${customer.tax_id || 'N/A'}`, 330, 224)
     .text(customer.billing_address || '', 330, 237, { width: 215 });

  // Table Header
  const tableTop = 290;
  doc.rect(50, tableTop, 495, 24).fill('#F1F5F9');
  doc.fillColor('#0F172A').fontSize(9).font('Helvetica-Bold');
  doc.text('#', 60, tableTop + 7);
  doc.text('Description', 90, tableTop + 7);
  doc.text('Qty', 310, tableTop + 7, { width: 30, align: 'right' });
  doc.text('Unit Price', 350, tableTop + 7, { width: 60, align: 'right' });
  doc.text('Tax', 420, tableTop + 7, { width: 40, align: 'right' });
  doc.text('Total (INR)', 470, tableTop + 7, { width: 65, align: 'right' });

  // Table Lines
  let y = tableTop + 30;
  doc.font('Helvetica').fontSize(9);

  lines.forEach((line, idx) => {
    doc.fillColor('#1E293B');
    doc.text(String(idx + 1), 60, y);
    doc.text(line.description || 'Subscription Line Item', 90, y, { width: 210 });
    doc.text(String(line.quantity), 310, y, { width: 30, align: 'right' });
    doc.text(`₹${parseFloat(line.unit_price).toFixed(2)}`, 350, y, { width: 60, align: 'right' });
    doc.text(`₹${parseFloat(line.tax_amount || 0).toFixed(2)}`, 420, y, { width: 40, align: 'right' });
    doc.text(`₹${parseFloat(line.line_total).toFixed(2)}`, 470, y, { width: 65, align: 'right' });

    y += 24;
    // Horizontal separator
    doc.strokeColor('#E2E8F0').lineWidth(0.5).moveTo(50, y).lineTo(545, y).stroke();
    y += 6;
  });

  // Totals Summary Box
  y += 10;
  const totalsX = 330;
  doc.rect(totalsX, y, 215, 115).fill('#F8FAFC');
  doc.strokeColor('#CBD5E1').lineWidth(1).rect(totalsX, y, 215, 115).stroke();

  doc.font('Helvetica').fontSize(9).fillColor('#475569');
  doc.text('Subtotal:', totalsX + 15, y + 12);
  doc.text(`₹${parseFloat(invoice.subtotal).toFixed(2)}`, totalsX + 110, y + 12, { width: 90, align: 'right' });

  doc.text('Tax (GST):', totalsX + 15, y + 28);
  doc.text(`₹${parseFloat(invoice.tax_amount).toFixed(2)}`, totalsX + 110, y + 28, { width: 90, align: 'right' });

  if (parseFloat(invoice.discount_amount) > 0) {
    doc.text('Discount Applied:', totalsX + 15, y + 44);
    doc.text(`- ₹${parseFloat(invoice.discount_amount).toFixed(2)}`, totalsX + 110, y + 44, { width: 90, align: 'right' });
  }

  doc.font('Helvetica-Bold').fontSize(11).fillColor('#0F172A');
  doc.text('Total Amount:', totalsX + 15, y + 62);
  doc.text(`₹${parseFloat(invoice.total_amount).toFixed(2)}`, totalsX + 110, y + 62, { width: 90, align: 'right' });

  doc.font('Helvetica').fontSize(9).fillColor('#059669');
  doc.text('Paid Amount:', totalsX + 15, y + 80);
  doc.text(`₹${parseFloat(invoice.amount_paid).toFixed(2)}`, totalsX + 110, y + 80, { width: 90, align: 'right' });

  doc.font('Helvetica-Bold').fontSize(10).fillColor('#DC2626');
  doc.text('Balance Due:', totalsX + 15, y + 96);
  doc.text(`₹${parseFloat(invoice.amount_due).toFixed(2)}`, totalsX + 110, y + 96, { width: 90, align: 'right' });

  // Payment instructions / Bank details
  doc.font('Helvetica-Bold').fontSize(9).fillColor('#0F172A').text('BANK & PAYMENT DETAILS', 50, y + 15);
  doc.font('Helvetica').fontSize(8.5).fillColor('#475569')
     .text('Account Name: Brightloop Software Private Limited', 50, y + 30)
     .text('Account Number: 50200088992211 (Current)', 50, y + 42)
     .text('IFSC Code: HDFC0001234 (Cyber City Branch)', 50, y + 54)
     .text('UPI ID: brightloop@hdfcbank', 50, y + 66);

  // Footer
  doc.fontSize(8).fillColor('#94A3B8')
     .text('Thank you for choosing Brightloop Software. This is a computer-generated tax invoice and requires no physical signature.', 50, 780, { align: 'center', width: 495 });

  doc.end();
}

module.exports = {
  generateInvoicePdf
};
