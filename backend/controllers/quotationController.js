const { query, transaction } = require('../config/db');
const { calculateNextBillingDate } = require('../services/billingEngine');

async function generateQuotationNumber(conn) {
  const year = new Date().getFullYear();
  const [rows] = await conn.query(
    'SELECT quotation_number FROM quotations WHERE quotation_number LIKE ? ORDER BY id DESC LIMIT 1',
    [`QT-${year}-%`]
  );
  let nextSeq = 1;
  if (rows.length > 0) {
    const parts = rows[0].quotation_number.split('-');
    const currentSeq = parseInt(parts[2], 10);
    if (!isNaN(currentSeq)) nextSeq = currentSeq + 1;
  }
  return `QT-${year}-${String(nextSeq).padStart(4, '0')}`;
}

// 1. Get all quotations
async function getAllQuotations(req, res, next) {
  try {
    const { search, status, customerId } = req.query;
    let sql = `
      SELECT q.*, 
             c.company_name, 
             c.contact_name, 
             c.email AS customer_email,
             c.customer_code,
             u.name AS created_by_name
      FROM quotations q
      JOIN customers c ON q.customer_id = c.id
      LEFT JOIN users u ON q.created_by = u.id
      WHERE 1=1
    `;
    const params = [];

    // Customer isolation check
    if (req.user.role === 'customer') {
      sql += ' AND q.customer_id = ?';
      params.push(req.user.customer_id);
    } else if (customerId) {
      sql += ' AND q.customer_id = ?';
      params.push(customerId);
    }

    if (search) {
      sql += ' AND (q.quotation_number LIKE ? OR c.company_name LIKE ? OR c.contact_name LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (status && status !== 'all') {
      sql += ' AND q.status = ?';
      params.push(status);
    }

    sql += ' ORDER BY q.id DESC';
    const quotations = await query(sql, params);

    return res.json({ success: true, count: quotations.length, data: quotations });
  } catch (error) {
    next(error);
  }
}

// 2. Get single quotation with line items
async function getQuotationById(req, res, next) {
  try {
    const { id } = req.params;
    let sql = `
      SELECT q.*, 
             c.company_name, 
             c.contact_name, 
             c.email AS customer_email,
             c.phone AS customer_phone,
             c.billing_address,
             c.tax_id AS customer_tax_id,
             c.customer_code,
             u.name AS created_by_name
      FROM quotations q
      JOIN customers c ON q.customer_id = c.id
      LEFT JOIN users u ON q.created_by = u.id
      WHERE q.id = ?
    `;
    const params = [id];

    if (req.user.role === 'customer') {
      sql += ' AND q.customer_id = ?';
      params.push(req.user.customer_id);
    }

    const quotations = await query(sql, params);
    if (quotations.length === 0) {
      return res.status(404).json({ success: false, message: 'Quotation not found.' });
    }

    const quotation = quotations[0];

    const lines = await query(
      `SELECT ql.*, 
              p.name AS product_name, 
              p.product_code,
              v.variant_name, 
              sp.name AS plan_name,
              sp.billing_frequency
       FROM quotation_lines ql
       JOIN products p ON ql.product_id = p.id
       LEFT JOIN product_variants v ON ql.variant_id = v.id
       LEFT JOIN subscription_plans sp ON ql.plan_id = sp.id
       WHERE ql.quotation_id = ?
       ORDER BY ql.id ASC`,
      [id]
    );

    quotation.lines = lines;
    return res.json({ success: true, data: quotation });
  } catch (error) {
    next(error);
  }
}

// 3. Create Quotation with lines
async function createQuotation(req, res, next) {
  try {
    const {
      customer_id,
      quotation_date,
      validity_days,
      lines,
      notes,
      status
    } = req.body;

    if (!customer_id || !Array.isArray(lines) || lines.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Customer and at least one product line item are required.'
      });
    }

    const qDate = quotation_date || new Date().toISOString().split('T')[0];
    const days = parseInt(validity_days || 30, 10);
    const expDate = new Date(new Date(qDate).getTime() + days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Calculate totals
    let subtotal = 0;
    let taxTotal = 0;
    let discountTotal = 0;

    const computedLines = lines.map((item) => {
      const qty = parseInt(item.quantity || 1, 10);
      const unitPrice = parseFloat(item.unit_price || 0);
      const lineSubtotal = qty * unitPrice;
      const taxRate = parseFloat(item.tax_rate || 18.0);
      const lineTax = (lineSubtotal * taxRate) / 100;
      const lineDiscount = parseFloat(item.discount_amount || 0);
      const lineTotal = lineSubtotal + lineTax - lineDiscount;

      subtotal += lineSubtotal;
      taxTotal += lineTax;
      discountTotal += lineDiscount;

      return {
        ...item,
        quantity: qty,
        unit_price: unitPrice,
        tax_rate: taxRate,
        tax_amount: lineTax,
        discount_amount: lineDiscount,
        line_total: lineTotal
      };
    });

    const totalAmount = subtotal + taxTotal - discountTotal;

    const result = await transaction(async (conn) => {
      const quotationNumber = await generateQuotationNumber(conn);

      const [qRes] = await conn.query(
        `INSERT INTO quotations 
         (quotation_number, customer_id, quotation_date, expiry_date, subtotal, tax_amount, discount_amount, total_amount, status, notes, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          quotationNumber,
          customer_id,
          qDate,
          expDate,
          subtotal,
          taxTotal,
          discountTotal,
          totalAmount,
          status || 'draft',
          notes || null,
          req.user.id
        ]
      );

      const quotationId = qRes.insertId;

      for (const line of computedLines) {
        await conn.query(
          `INSERT INTO quotation_lines 
           (quotation_id, product_id, variant_id, plan_id, description, quantity, unit_price, tax_rate, tax_amount, discount_amount, line_total)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            quotationId,
            line.product_id,
            line.variant_id || null,
            line.plan_id || null,
            line.description || 'Subscription Line Item',
            line.quantity,
            line.unit_price,
            line.tax_rate,
            line.tax_amount,
            line.discount_amount,
            line.line_total
          ]
        );
      }

      return { quotationId, quotationNumber };
    });

    return res.status(201).json({
      success: true,
      message: 'Quotation created successfully!',
      data: result
    });
  } catch (error) {
    next(error);
  }
}

// 4. Update Quotation
async function updateQuotation(req, res, next) {
  try {
    const { id } = req.params;
    const { quotation_date, expiry_date, lines, notes, status } = req.body;

    const [existing] = await query('SELECT * FROM quotations WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Quotation not found.' });
    }

    if (existing.status === 'converted') {
      return res.status(400).json({ success: false, message: 'Cannot edit an already converted quotation.' });
    }

    await transaction(async (conn) => {
      let subtotal = existing.subtotal;
      let taxTotal = existing.tax_amount;
      let discountTotal = existing.discount_amount;
      let totalAmount = existing.total_amount;

      if (Array.isArray(lines) && lines.length > 0) {
        subtotal = 0;
        taxTotal = 0;
        discountTotal = 0;

        await conn.query('DELETE FROM quotation_lines WHERE quotation_id = ?', [id]);

        for (const item of lines) {
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

          await conn.query(
            `INSERT INTO quotation_lines 
             (quotation_id, product_id, variant_id, plan_id, description, quantity, unit_price, tax_rate, tax_amount, discount_amount, line_total)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              id,
              item.product_id,
              item.variant_id || null,
              item.plan_id || null,
              item.description || 'Subscription Line Item',
              qty,
              unitPrice,
              taxRate,
              lineTax,
              lineDisc,
              lineTot
            ]
          );
        }

        totalAmount = subtotal + taxTotal - discountTotal;
      }

      await conn.query(
        `UPDATE quotations 
         SET quotation_date = COALESCE(?, quotation_date),
             expiry_date = COALESCE(?, expiry_date),
             subtotal = ?,
             tax_amount = ?,
             discount_amount = ?,
             total_amount = ?,
             notes = COALESCE(?, notes),
             status = COALESCE(?, status)
         WHERE id = ?`,
        [quotation_date, expiry_date, subtotal, taxTotal, discountTotal, totalAmount, notes, status, id]
      );
    });

    return res.json({ success: true, message: 'Quotation updated successfully!' });
  } catch (error) {
    next(error);
  }
}

// 5. Convert Quotation to Subscription (1-Click Seamless Transition)
async function convertToSubscription(req, res, next) {
  try {
    const { id } = req.params;
    const { payment_terms, start_date } = req.body;

    const [quotation] = await query('SELECT * FROM quotations WHERE id = ?', [id]);
    if (!quotation) {
      return res.status(404).json({ success: false, message: 'Quotation not found.' });
    }

    if (quotation.status === 'converted') {
      return res.status(400).json({
        success: false,
        message: `Quotation has already been converted into subscription ID: ${quotation.converted_subscription_id}`
      });
    }

    const lines = await query('SELECT * FROM quotation_lines WHERE quotation_id = ?', [id]);
    if (lines.length === 0) {
      return res.status(400).json({ success: false, message: 'Quotation has no line items.' });
    }

    // Determine plan: take from first line item or default active plan
    let planId = lines[0].plan_id;
    if (!planId) {
      const [fallbackPlan] = await query('SELECT id FROM subscription_plans WHERE product_id = ? AND status = "active" LIMIT 1', [lines[0].product_id]);
      planId = fallbackPlan ? fallbackPlan.id : 1;
    }

    const [plan] = await query('SELECT * FROM subscription_plans WHERE id = ?', [planId]);
    const frequency = plan ? plan.billing_frequency : 'monthly';

    const startDate = start_date || new Date().toISOString().split('T')[0];
    const expiryDate = new Date(new Date(startDate).setFullYear(new Date(startDate).getFullYear() + 1))
      .toISOString().split('T')[0];
    const nextBillingDate = calculateNextBillingDate(startDate, frequency);

    const subscription = await transaction(async (conn) => {
      // Generate subscription number: SUB-YYYY-XXXX
      const year = new Date().getFullYear();
      const [subRows] = await conn.query(
        'SELECT subscription_number FROM subscriptions WHERE subscription_number LIKE ? ORDER BY id DESC LIMIT 1',
        [`SUB-${year}-%`]
      );
      let nextSeq = 1;
      if (subRows.length > 0) {
        const parts = subRows[0].subscription_number.split('-');
        const currentSeq = parseInt(parts[2], 10);
        if (!isNaN(currentSeq)) nextSeq = currentSeq + 1;
      }
      const subNumber = `SUB-${year}-${String(nextSeq).padStart(4, '0')}`;

      // Insert subscription
      const [subRes] = await conn.query(
        `INSERT INTO subscriptions 
         (subscription_number, customer_id, plan_id, start_date, expiry_date, payment_terms, billing_frequency, 
          next_billing_date, subtotal, tax_amount, discount_amount, total_amount, status, auto_close, early_closure_allowed, pause_allowed, renewal_allowed, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'confirmed', ?, ?, ?, ?, ?)`,
        [
          subNumber,
          quotation.customer_id,
          planId,
          startDate,
          expiryDate,
          payment_terms || 'immediate',
          frequency,
          nextBillingDate,
          quotation.subtotal,
          quotation.tax_amount,
          quotation.discount_amount,
          quotation.total_amount,
          plan ? plan.auto_close : 0,
          plan ? plan.early_closure_allowed : 1,
          plan ? plan.pause_allowed : 1,
          plan ? plan.renewal_allowed : 1,
          `Converted from quotation ${quotation.quotation_number}. ${quotation.notes || ''}`
        ]
      );

      const subId = subRes.insertId;

      // Copy lines to subscription_lines
      for (const line of lines) {
        await conn.query(
          `INSERT INTO subscription_lines 
           (subscription_id, product_id, variant_id, description, quantity, unit_price, tax_rate, tax_amount, discount_amount, line_total)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            subId,
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

      // Update quotation to converted status
      await conn.query(
        "UPDATE quotations SET status = 'converted', converted_subscription_id = ? WHERE id = ?",
        [subId, id]
      );

      return { subId, subNumber };
    });

    return res.json({
      success: true,
      message: `Quotation ${quotation.quotation_number} converted into Subscription ${subscription.subNumber} successfully!`,
      data: subscription
    });
  } catch (error) {
    next(error);
  }
}

// 6. Customer Action: Accept or Reject Quotation
async function respondToQuotation(req, res, next) {
  try {
    const { id } = req.params;
    const { action } = req.body; // 'accept' or 'reject'

    if (!['accept', 'reject'].includes(action)) {
      return res.status(400).json({ success: false, message: 'Action must be accept or reject.' });
    }

    const [quotation] = await query('SELECT * FROM quotations WHERE id = ?', [id]);
    if (!quotation) {
      return res.status(404).json({ success: false, message: 'Quotation not found.' });
    }

    if (req.user.role === 'customer' && quotation.customer_id !== req.user.customer_id) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const newStatus = action === 'accept' ? 'accepted' : 'rejected';
    await query('UPDATE quotations SET status = ? WHERE id = ?', [newStatus, id]);

    return res.json({
      success: true,
      message: `Quotation has been marked as ${newStatus}.`
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAllQuotations,
  getQuotationById,
  createQuotation,
  updateQuotation,
  convertToSubscription,
  respondToQuotation
};
