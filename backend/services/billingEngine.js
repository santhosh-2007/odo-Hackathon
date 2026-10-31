const { transaction, query } = require('../config/db');

/**
 * Calculates next billing date based on start date and frequency
 */
function calculateNextBillingDate(baseDate, frequency) {
  const d = new Date(baseDate);
  switch (frequency) {
    case 'daily':
      d.setDate(d.getDate() + 1);
      break;
    case 'weekly':
      d.setDate(d.getDate() + 7);
      break;
    case 'yearly':
      d.setFullYear(d.getFullYear() + 1);
      break;
    case 'monthly':
    default:
      d.setMonth(d.getMonth() + 1);
      break;
  }
  return d.toISOString().split('T')[0];
}

/**
 * Calculates due date based on invoice date and payment terms
 */
function calculateDueDate(invoiceDate, terms) {
  const d = new Date(invoiceDate);
  switch (terms) {
    case 'net_15':
      d.setDate(d.getDate() + 15);
      break;
    case 'net_30':
      d.setDate(d.getDate() + 30);
      break;
    case 'net_60':
      d.setDate(d.getDate() + 60);
      break;
    case 'immediate':
    default:
      // immediate: same day or 3 days grace
      break;
  }
  return d.toISOString().split('T')[0];
}

/**
 * Generates the next sequential invoice number (e.g. INV-2026-0005)
 */
async function generateInvoiceNumber(conn) {
  const year = new Date().getFullYear();
  const [rows] = await conn.query(
    'SELECT invoice_number FROM invoices WHERE invoice_number LIKE ? ORDER BY id DESC LIMIT 1',
    [`INV-${year}-%`]
  );

  let nextSeq = 1;
  if (rows && rows.length > 0) {
    const parts = rows[0].invoice_number.split('-');
    const currentSeq = parseInt(parts[2], 10);
    if (!isNaN(currentSeq)) {
      nextSeq = currentSeq + 1;
    }
  }
  return `INV-${year}-${String(nextSeq).padStart(4, '0')}`;
}

/**
 * Recurring Invoice Generation Engine
 * Scans active subscriptions where next_billing_date <= today
 * Generates an invoice with duplicate prevention and updates next_billing_date
 */
async function processRecurringInvoices() {
  const today = new Date().toISOString().split('T')[0];

  // Find active subscriptions due for billing
  const dueSubscriptions = await query(
    `SELECT s.*, c.contact_name, c.company_name, c.email 
     FROM subscriptions s
     JOIN customers c ON s.customer_id = c.id
     WHERE s.status = 'active' 
       AND s.next_billing_date <= ?
     ORDER BY s.id ASC`,
    [today]
  );

  const results = {
    processed: 0,
    generatedInvoices: [],
    skippedDuplicates: 0,
    autoClosedSubscriptions: []
  };

  for (const sub of dueSubscriptions) {
    await transaction(async (conn) => {
      const periodStart = sub.next_billing_date;
      const periodEnd = calculateNextBillingDate(periodStart, sub.billing_frequency);

      // 1. Idempotency & Duplicate Check
      const [existingInvoice] = await conn.query(
        'SELECT id, invoice_number FROM invoices WHERE subscription_id = ? AND billing_period_start = ?',
        [sub.id, periodStart]
      );

      if (existingInvoice.length > 0) {
        results.skippedDuplicates++;
        // Advance billing date if stuck
        const advancedDate = calculateNextBillingDate(sub.next_billing_date, sub.billing_frequency);
        await conn.query('UPDATE subscriptions SET next_billing_date = ? WHERE id = ?', [advancedDate, sub.id]);
        return;
      }

      // 2. Fetch subscription line items
      const [lines] = await conn.query(
        'SELECT * FROM subscription_lines WHERE subscription_id = ?',
        [sub.id]
      );

      if (lines.length === 0) {
        return;
      }

      // 3. Create Invoice
      const invoiceNumber = await generateInvoiceNumber(conn);
      const invoiceDate = today;
      const dueDate = calculateDueDate(invoiceDate, sub.payment_terms);

      const [invResult] = await conn.query(
        `INSERT INTO invoices 
         (invoice_number, customer_id, subscription_id, billing_period_start, billing_period_end, 
          invoice_date, due_date, subtotal, tax_amount, discount_amount, total_amount, amount_paid, amount_due, payment_status, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0.00, ?, 'unpaid', ?)`,
        [
          invoiceNumber,
          sub.customer_id,
          sub.id,
          periodStart,
          periodEnd,
          invoiceDate,
          dueDate,
          sub.subtotal,
          sub.tax_amount,
          sub.discount_amount,
          sub.total_amount,
          sub.total_amount, // initially amount_due = total_amount
          `Recurring invoice for subscription ${sub.subscription_number} (${sub.billing_frequency}). Period: ${periodStart} to ${periodEnd}`
        ]
      );

      const invoiceId = invResult.insertId;

      // 4. Copy lines to invoice_lines
      for (const line of lines) {
        await conn.query(
          `INSERT INTO invoice_lines 
           (invoice_id, product_id, variant_id, description, quantity, unit_price, tax_rate, tax_amount, discount_amount, line_total)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            invoiceId,
            line.product_id,
            line.variant_id,
            line.description,
            line.quantity,
            line.unit_price,
            line.tax_rate,
            line.tax_amount,
            line.discount_amount,
            line.line_total
          ]
        );
      }

      // 5. Advance next billing date
      const nextDate = calculateNextBillingDate(sub.next_billing_date, sub.billing_frequency);
      let newStatus = sub.status;

      // Check auto close if expiry reached
      if (sub.auto_close && sub.expiry_date && nextDate > sub.expiry_date) {
        newStatus = 'closed';
        results.autoClosedSubscriptions.push(sub.subscription_number);
      }

      await conn.query(
        'UPDATE subscriptions SET next_billing_date = ?, status = ? WHERE id = ?',
        [nextDate, newStatus, sub.id]
      );

      results.processed++;
      results.generatedInvoices.push({
        invoiceId,
        invoiceNumber,
        subscriptionNumber: sub.subscription_number,
        customerName: sub.company_name || sub.contact_name,
        totalAmount: sub.total_amount,
        dueDate
      });
    });
  }

  // Update overdue status on unpaid invoices whose due_date < today
  await query(
    `UPDATE invoices 
     SET payment_status = 'overdue' 
     WHERE payment_status IN ('unpaid', 'partial') 
       AND due_date < ?`,
    [today]
  );

  return results;
}

module.exports = {
  calculateNextBillingDate,
  calculateDueDate,
  generateInvoiceNumber,
  processRecurringInvoices
};
