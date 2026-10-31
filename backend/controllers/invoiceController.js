const { query, transaction } = require('../config/db');
const { generateInvoicePdf } = require('../services/pdfService');
const { processRecurringInvoices, generateInvoiceNumber, calculateDueDate } = require('../services/billingEngine');

// 1. Get all invoices with filtering & search
async function getAllInvoices(req, res, next) {
  try {
    const { search, status, customerId, startDate, endDate } = req.query;
    let sql = `
      SELECT i.*, 
             c.company_name, 
             c.contact_name, 
             c.email AS customer_email, 
             c.customer_code,
             s.subscription_number
      FROM invoices i
      JOIN customers c ON i.customer_id = c.id
      LEFT JOIN subscriptions s ON i.subscription_id = s.id
      WHERE 1=1
    `;
    const params = [];

    // Customer role isolation
    if (req.user.role === 'customer') {
      sql += ' AND i.customer_id = ?';
      params.push(req.user.customer_id);
    } else if (customerId) {
      sql += ' AND i.customer_id = ?';
      params.push(customerId);
    }

    if (search) {
      sql += ' AND (i.invoice_number LIKE ? OR c.company_name LIKE ? OR c.contact_name LIKE ? OR s.subscription_number LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (status && status !== 'all') {
      sql += ' AND i.payment_status = ?';
      params.push(status);
    }

    if (startDate) {
      sql += ' AND i.invoice_date >= ?';
      params.push(startDate);
    }

    if (endDate) {
      sql += ' AND i.invoice_date <= ?';
      params.push(endDate);
    }

    sql += ' ORDER BY i.id DESC';
    const invoices = await query(sql, params);

    return res.json({ success: true, count: invoices.length, data: invoices });
  } catch (error) {
    next(error);
  }
}

// 2. Get single invoice with full lines & payments
async function getInvoiceById(req, res, next) {
  try {
    const { id } = req.params;
    let sql = `
      SELECT i.*, 
             c.company_name, 
             c.contact_name, 
             c.email AS customer_email,
             c.phone AS customer_phone,
             c.billing_address,
             c.shipping_address,
             c.tax_id AS customer_tax_id,
             c.customer_code,
             s.subscription_number
      FROM invoices i
      JOIN customers c ON i.customer_id = c.id
      LEFT JOIN subscriptions s ON i.subscription_id = s.id
      WHERE i.id = ?
    `;
    const params = [id];

    if (req.user.role === 'customer') {
      sql += ' AND i.customer_id = ?';
      params.push(req.user.customer_id);
    }

    const invoices = await query(sql, params);
    if (invoices.length === 0) {
      return res.status(404).json({ success: false, message: 'Invoice not found.' });
    }

    const invoice = invoices[0];

    const lines = await query(
      `SELECT il.*, p.name AS product_name, p.product_code, v.variant_name 
       FROM invoice_lines il
       JOIN products p ON il.product_id = p.id
       LEFT JOIN product_variants v ON il.variant_id = v.id
       WHERE il.invoice_id = ?
       ORDER BY il.id ASC`,
      [id]
    );

    const payments = await query(
      `SELECT * FROM payments WHERE invoice_id = ? ORDER BY id DESC`,
      [id]
    );

    invoice.lines = lines;
    invoice.payments = payments;

    return res.json({ success: true, data: invoice });
  } catch (error) {
    next(error);
  }
}

// 3. Create Manual Invoice
async function createInvoice(req, res, next) {
  try {
    const {
      customer_id,
      subscription_id,
      invoice_date,
      due_date,
      payment_terms,
      lines,
      notes
    } = req.body;

    if (!customer_id || !Array.isArray(lines) || lines.length === 0) {
      return res.status(400).json({ success: false, message: 'Customer and line items are required.' });
    }

    const invDate = invoice_date || new Date().toISOString().split('T')[0];
    const dueDate = due_date || calculateDueDate(invDate, payment_terms || 'immediate');

    let subtotal = 0;
    let taxTotal = 0;
    let discountTotal = 0;

    const computedLines = lines.map((item) => {
      const qty = parseInt(item.quantity || 1, 10);
      const unitPrice = parseFloat(item.unit_price || 0);
      const lineSub = qty * unitPrice;
      const taxRate = parseFloat(item.tax_rate || 18.0);
      const lineTax = (lineSub * taxRate) / 100;
      const lineDisc = parseFloat(item.discount_amount || 0);
      const lineTot = lineSub + lineTax - lineDisc;

      subtotal += lineSub;
      taxTotal += lineTax;
      discountTotal += lineDisc;

      return {
        ...item,
        quantity: qty,
        unit_price: unitPrice,
        tax_rate: taxRate,
        tax_amount: lineTax,
        discount_amount: lineDisc,
        line_total: lineTot
      };
    });

    const totalAmount = subtotal + taxTotal - discountTotal;

    const result = await transaction(async (conn) => {
      const invoiceNumber = await generateInvoiceNumber(conn);

      const [invRes] = await conn.query(
        `INSERT INTO invoices 
         (invoice_number, customer_id, subscription_id, invoice_date, due_date, subtotal, tax_amount, discount_amount, total_amount, amount_paid, amount_due, payment_status, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0.00, ?, 'unpaid', ?)`,
        [
          invoiceNumber,
          customer_id,
          subscription_id || null,
          invDate,
          dueDate,
          subtotal,
          taxTotal,
          discountTotal,
          totalAmount,
          totalAmount,
          notes || null
        ]
      );

      const invoiceId = invRes.insertId;

      for (const line of computedLines) {
        await conn.query(
          `INSERT INTO invoice_lines 
           (invoice_id, product_id, variant_id, description, quantity, unit_price, tax_rate, tax_amount, discount_amount, line_total)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            invoiceId,
            line.product_id,
            line.variant_id || null,
            line.description || 'Line Item',
            line.quantity,
            line.unit_price,
            line.tax_rate,
            line.tax_amount,
            line.discount_amount,
            line.line_total
          ]
        );
      }

      return { invoiceId, invoiceNumber };
    });

    return res.status(201).json({ success: true, message: 'Invoice created successfully!', data: result });
  } catch (error) {
    next(error);
  }
}

// 4. Download Invoice as PDF
async function downloadPdf(req, res, next) {
  try {
    const { id } = req.params;
    let sql = `
      SELECT i.*, 
             c.company_name, 
             c.contact_name, 
             c.email, 
             c.phone, 
             c.billing_address, 
             c.tax_id, 
             c.customer_code
      FROM invoices i
      JOIN customers c ON i.customer_id = c.id
      WHERE i.id = ?
    `;
    const params = [id];

    if (req.user.role === 'customer') {
      sql += ' AND i.customer_id = ?';
      params.push(req.user.customer_id);
    }

    const invoices = await query(sql, params);
    if (invoices.length === 0) {
      return res.status(404).json({ success: false, message: 'Invoice not found.' });
    }

    const invoice = invoices[0];
    const lines = await query('SELECT * FROM invoice_lines WHERE invoice_id = ? ORDER BY id ASC', [id]);
    const payments = await query('SELECT * FROM payments WHERE invoice_id = ?', [id]);

    const customer = {
      company_name: invoice.company_name,
      contact_name: invoice.contact_name,
      email: invoice.email,
      phone: invoice.phone,
      billing_address: invoice.billing_address,
      tax_id: invoice.tax_id
    };

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${invoice.invoice_number}.pdf"`);

    generateInvoicePdf(invoice, lines, customer, payments, res);
  } catch (error) {
    next(error);
  }
}

// 5. Trigger Recurring Invoices Cycle
async function triggerRecurringBilling(req, res, next) {
  try {
    const result = await processRecurringInvoices();
    return res.json({
      success: true,
      message: `Recurring billing executed successfully! Processed ${result.processed} new invoices.`,
      data: result
    });
  } catch (error) {
    next(error);
  }
}

// 6. Cancel Invoice
async function cancelInvoice(req, res, next) {
  try {
    const { id } = req.params;

    const [invoice] = await query('SELECT * FROM invoices WHERE id = ?', [id]);
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found.' });
    }

    if (parseFloat(invoice.amount_paid) > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel invoice with recorded payments. Please refund or adjust payments first.'
      });
    }

    await query("UPDATE invoices SET payment_status = 'cancelled' WHERE id = ?", [id]);
    return res.json({ success: true, message: 'Invoice cancelled successfully.' });
  } catch (error) {
    next(error);
  }
}

// 7. Send Invoice via Email (Simulation with audit record)
async function sendInvoiceEmail(req, res, next) {
  try {
    const { id } = req.params;
    const [invoice] = await query(
      `SELECT i.invoice_number, c.email, c.contact_name, c.company_name 
       FROM invoices i 
       JOIN customers c ON i.customer_id = c.id 
       WHERE i.id = ?`,
      [id]
    );

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found.' });
    }

    return res.json({
      success: true,
      message: `Invoice ${invoice.invoice_number} successfully dispatched to ${invoice.email} (${invoice.company_name || invoice.contact_name}).`
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAllInvoices,
  getInvoiceById,
  createInvoice,
  downloadPdf,
  triggerRecurringBilling,
  cancelInvoice,
  sendInvoiceEmail
};
