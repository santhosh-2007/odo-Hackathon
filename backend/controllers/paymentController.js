const { query, transaction } = require('../config/db');

async function generatePaymentNumber(conn) {
  const year = new Date().getFullYear();
  const [rows] = await conn.query(
    'SELECT payment_number FROM payments WHERE payment_number LIKE ? ORDER BY id DESC LIMIT 1',
    [`PAY-${year}-%`]
  );
  let nextSeq = 1;
  if (rows.length > 0) {
    const parts = rows[0].payment_number.split('-');
    const currentSeq = parseInt(parts[2], 10);
    if (!isNaN(currentSeq)) nextSeq = currentSeq + 1;
  }
  return `PAY-${year}-${String(nextSeq).padStart(4, '0')}`;
}

// 1. Get all payments
async function getAllPayments(req, res, next) {
  try {
    const { search, method, customerId, invoiceId, startDate, endDate } = req.query;
    let sql = `
      SELECT p.*, 
             i.invoice_number, 
             i.total_amount AS invoice_total,
             c.company_name, 
             c.contact_name, 
             c.email AS customer_email,
             c.customer_code
      FROM payments p
      JOIN invoices i ON p.invoice_id = i.id
      JOIN customers c ON p.customer_id = c.id
      WHERE 1=1
    `;
    const params = [];

    // Customer role isolation
    if (req.user.role === 'customer') {
      sql += ' AND p.customer_id = ?';
      params.push(req.user.customer_id);
    } else if (customerId) {
      sql += ' AND p.customer_id = ?';
      params.push(customerId);
    }

    if (invoiceId) {
      sql += ' AND p.invoice_id = ?';
      params.push(invoiceId);
    }

    if (method && method !== 'all') {
      sql += ' AND p.payment_method = ?';
      params.push(method);
    }

    if (search) {
      sql += ' AND (p.payment_number LIKE ? OR p.transaction_reference LIKE ? OR i.invoice_number LIKE ? OR c.company_name LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (startDate) {
      sql += ' AND p.payment_date >= ?';
      params.push(startDate);
    }

    if (endDate) {
      sql += ' AND p.payment_date <= ?';
      params.push(endDate);
    }

    sql += ' ORDER BY p.id DESC';
    const payments = await query(sql, params);

    return res.json({ success: true, count: payments.length, data: payments });
  } catch (error) {
    next(error);
  }
}

// 2. Get single payment
async function getPaymentById(req, res, next) {
  try {
    const { id } = req.params;
    let sql = `
      SELECT p.*, 
             i.invoice_number, 
             i.total_amount AS invoice_total,
             i.amount_paid AS invoice_amount_paid,
             i.amount_due AS invoice_amount_due,
             c.company_name, 
             c.contact_name, 
             c.email AS customer_email,
             c.phone AS customer_phone,
             c.customer_code
      FROM payments p
      JOIN invoices i ON p.invoice_id = i.id
      JOIN customers c ON p.customer_id = c.id
      WHERE p.id = ?
    `;
    const params = [id];

    if (req.user.role === 'customer') {
      sql += ' AND p.customer_id = ?';
      params.push(req.user.customer_id);
    }

    const payments = await query(sql, params);
    if (payments.length === 0) {
      return res.status(404).json({ success: false, message: 'Payment record not found.' });
    }

    return res.json({ success: true, data: payments[0] });
  } catch (error) {
    next(error);
  }
}

// 3. Record Payment (With atomic transaction, balance updates, and overpayment prevention)
async function recordPayment(req, res, next) {
  try {
    const {
      invoice_id,
      amount,
      payment_method,
      payment_date,
      transaction_reference,
      notes
    } = req.body;

    if (!invoice_id || !amount || parseFloat(amount) <= 0) {
      return res.status(400).json({ success: false, message: 'Invoice and valid positive payment amount are required.' });
    }

    const payAmount = parseFloat(amount);
    const payDate = payment_date || new Date().toISOString().split('T')[0];

    const result = await transaction(async (conn) => {
      // 1. Lock invoice row for update
      const [invoices] = await conn.query(
        'SELECT * FROM invoices WHERE id = ? FOR UPDATE',
        [invoice_id]
      );

      if (invoices.length === 0) {
        throw new Error('Invoice not found.');
      }

      const inv = invoices[0];

      if (inv.payment_status === 'paid') {
        throw new Error(`Invoice ${inv.invoice_number} is already fully paid.`);
      }

      if (inv.payment_status === 'cancelled') {
        throw new Error(`Cannot record payment against cancelled invoice ${inv.invoice_number}.`);
      }

      const currentDue = parseFloat(inv.amount_due);
      if (payAmount > currentDue + 0.01) { // 1 cent threshold for rounding
        throw new Error(
          `Payment amount ₹${payAmount.toFixed(2)} exceeds remaining balance ₹${currentDue.toFixed(2)}.`
        );
      }

      // 2. Generate Payment Number: PAY-YYYY-XXXX
      const payNumber = await generatePaymentNumber(conn);

      // 3. Insert payment
      const [payRes] = await conn.query(
        `INSERT INTO payments 
         (payment_number, invoice_id, customer_id, payment_method, amount, payment_date, transaction_reference, notes, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'completed')`,
        [
          payNumber,
          inv.id,
          inv.customer_id,
          payment_method || 'bank_transfer',
          payAmount,
          payDate,
          transaction_reference || `TXN-${Date.now().toString().slice(-6)}`,
          notes || null
        ]
      );

      // 4. Update invoice balances and payment_status
      const newPaid = parseFloat(inv.amount_paid) + payAmount;
      const newDue = Math.max(0, parseFloat(inv.total_amount) - newPaid);
      let newStatus = 'partial';

      if (newDue <= 0.009) {
        newStatus = 'paid';
      }

      await conn.query(
        `UPDATE invoices 
         SET amount_paid = ?, amount_due = ?, payment_status = ? 
         WHERE id = ?`,
        [newPaid, newDue, newStatus, inv.id]
      );

      return {
        paymentId: payRes.insertId,
        paymentNumber: payNumber,
        invoiceNumber: inv.invoice_number,
        amount: payAmount,
        remainingDue: newDue,
        invoiceStatus: newStatus
      };
    });

    return res.status(201).json({
      success: true,
      message: `Payment of ₹${payAmount.toFixed(2)} recorded successfully against invoice ${result.invoiceNumber}!`,
      data: result
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
}

module.exports = {
  getAllPayments,
  getPaymentById,
  recordPayment
};
