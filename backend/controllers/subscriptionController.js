const { query, transaction } = require('../config/db');
const { calculateNextBillingDate, calculateDueDate, generateInvoiceNumber } = require('../services/billingEngine');

async function generateSubNumber(conn) {
  const year = new Date().getFullYear();
  const [rows] = await conn.query(
    'SELECT subscription_number FROM subscriptions WHERE subscription_number LIKE ? ORDER BY id DESC LIMIT 1',
    [`SUB-${year}-%`]
  );
  let nextSeq = 1;
  if (rows.length > 0) {
    const parts = rows[0].subscription_number.split('-');
    const currentSeq = parseInt(parts[2], 10);
    if (!isNaN(currentSeq)) nextSeq = currentSeq + 1;
  }
  return `SUB-${year}-${String(nextSeq).padStart(4, '0')}`;
}

// 1. Get all subscriptions
async function getAllSubscriptions(req, res, next) {
  try {
    const { search, status, customerId, planId, frequency } = req.query;
    let sql = `
      SELECT s.*, 
             c.company_name, 
             c.contact_name, 
             c.email AS customer_email,
             c.customer_code,
             sp.name AS plan_name,
             p.name AS product_name
      FROM subscriptions s
      JOIN customers c ON s.customer_id = c.id
      JOIN subscription_plans sp ON s.plan_id = sp.id
      JOIN products p ON sp.product_id = p.id
      WHERE 1=1
    `;
    const params = [];

    // Customer role isolation
    if (req.user.role === 'customer') {
      sql += ' AND s.customer_id = ?';
      params.push(req.user.customer_id);
    } else if (customerId) {
      sql += ' AND s.customer_id = ?';
      params.push(customerId);
    }

    if (search) {
      sql += ' AND (s.subscription_number LIKE ? OR c.company_name LIKE ? OR c.contact_name LIKE ? OR sp.name LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (status && status !== 'all') {
      sql += ' AND s.status = ?';
      params.push(status);
    }

    if (frequency && frequency !== 'all') {
      sql += ' AND s.billing_frequency = ?';
      params.push(frequency);
    }

    if (planId) {
      sql += ' AND s.plan_id = ?';
      params.push(planId);
    }

    sql += ' ORDER BY s.id DESC';
    const subscriptions = await query(sql, params);

    return res.json({ success: true, count: subscriptions.length, data: subscriptions });
  } catch (error) {
    next(error);
  }
}

// 2. Get single subscription with lines & invoice timeline
async function getSubscriptionById(req, res, next) {
  try {
    const { id } = req.params;
    let sql = `
      SELECT s.*, 
             c.company_name, 
             c.contact_name, 
             c.email AS customer_email,
             c.phone AS customer_phone,
             c.billing_address,
             c.customer_code,
             sp.name AS plan_name,
             p.name AS product_name
      FROM subscriptions s
      JOIN customers c ON s.customer_id = c.id
      JOIN subscription_plans sp ON s.plan_id = sp.id
      JOIN products p ON sp.product_id = p.id
      WHERE s.id = ?
    `;
    const params = [id];

    if (req.user.role === 'customer') {
      sql += ' AND s.customer_id = ?';
      params.push(req.user.customer_id);
    }

    const subs = await query(sql, params);
    if (subs.length === 0) {
      return res.status(404).json({ success: false, message: 'Subscription not found.' });
    }

    const subscription = subs[0];

    const lines = await query(
      `SELECT sl.*, p.name AS product_name, v.variant_name 
       FROM subscription_lines sl
       JOIN products p ON sl.product_id = p.id
       LEFT JOIN product_variants v ON sl.variant_id = v.id
       WHERE sl.subscription_id = ?
       ORDER BY sl.id ASC`,
      [id]
    );

    // Associated invoices history
    const invoices = await query(
      `SELECT id, invoice_number, invoice_date, due_date, total_amount, amount_paid, amount_due, payment_status 
       FROM invoices 
       WHERE subscription_id = ? 
       ORDER BY id DESC`,
      [id]
    );

    subscription.lines = lines;
    subscription.invoices = invoices;

    return res.json({ success: true, data: subscription });
  } catch (error) {
    next(error);
  }
}

// 3. Create Subscription directly
async function createSubscription(req, res, next) {
  try {
    const {
      customer_id,
      plan_id,
      start_date,
      expiry_date,
      payment_terms,
      billing_frequency,
      lines,
      notes,
      auto_invoice
    } = req.body;

    if (!customer_id || !plan_id || !Array.isArray(lines) || lines.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Customer, Plan, and at least one line item are required.'
      });
    }

    const [plan] = await query('SELECT * FROM subscription_plans WHERE id = ?', [plan_id]);
    if (!plan) {
      return res.status(404).json({ success: false, message: 'Selected subscription plan not found.' });
    }

    const frequency = billing_frequency || plan.billing_frequency;
    const startDate = start_date || new Date().toISOString().split('T')[0];
    const expDate = expiry_date || new Date(new Date(startDate).setFullYear(new Date(startDate).getFullYear() + 1))
      .toISOString().split('T')[0];
    const nextBillingDate = calculateNextBillingDate(startDate, frequency);

    // Compute lines & totals
    let subtotal = 0;
    let taxTotal = 0;
    let discountTotal = 0;

    const computedLines = lines.map((item) => {
      const qty = parseInt(item.quantity || 1, 10);
      const unitPrice = parseFloat(item.unit_price || plan.price);
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
      const subNumber = await generateSubNumber(conn);

      const [subRes] = await conn.query(
        `INSERT INTO subscriptions 
         (subscription_number, customer_id, plan_id, start_date, expiry_date, payment_terms, billing_frequency, 
          next_billing_date, subtotal, tax_amount, discount_amount, total_amount, status, auto_close, early_closure_allowed, pause_allowed, renewal_allowed, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft', ?, ?, ?, ?, ?)`,
        [
          subNumber,
          customer_id,
          plan_id,
          startDate,
          expDate,
          payment_terms || 'immediate',
          frequency,
          nextBillingDate,
          subtotal,
          taxTotal,
          discountTotal,
          totalAmount,
          plan.auto_close,
          plan.early_closure_allowed,
          plan.pause_allowed,
          plan.renewal_allowed,
          notes || null
        ]
      );

      const subId = subRes.insertId;

      for (const line of computedLines) {
        await conn.query(
          `INSERT INTO subscription_lines 
           (subscription_id, product_id, variant_id, description, quantity, unit_price, tax_rate, tax_amount, discount_amount, line_total)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            subId,
            line.product_id,
            line.variant_id || null,
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

      return { subId, subNumber };
    });

    return res.status(201).json({
      success: true,
      message: 'Subscription created successfully!',
      data: result
    });
  } catch (error) {
    next(error);
  }
}

// 4. Update Subscription
async function updateSubscription(req, res, next) {
  try {
    const { id } = req.params;
    const { payment_terms, billing_frequency, next_billing_date, expiry_date, notes } = req.body;

    const [existing] = await query('SELECT * FROM subscriptions WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Subscription not found.' });
    }

    if (existing.status === 'closed') {
      return res.status(400).json({ success: false, message: 'Cannot edit a closed subscription. Use Renew instead.' });
    }

    await query(
      `UPDATE subscriptions 
       SET payment_terms = COALESCE(?, payment_terms),
           billing_frequency = COALESCE(?, billing_frequency),
           next_billing_date = COALESCE(?, next_billing_date),
           expiry_date = COALESCE(?, expiry_date),
           notes = COALESCE(?, notes)
       WHERE id = ?`,
      [payment_terms, billing_frequency, next_billing_date, expiry_date, notes, id]
    );

    return res.json({ success: true, message: 'Subscription updated successfully!' });
  } catch (error) {
    next(error);
  }
}

// 5. Subscription Status Transitions: Confirm, Activate, Pause, Resume, Renew, Close
async function transitionStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { action } = req.body; // 'confirm', 'activate', 'pause', 'resume', 'renew', 'close'

    const [sub] = await query('SELECT * FROM subscriptions WHERE id = ?', [id]);
    if (!sub) {
      return res.status(404).json({ success: false, message: 'Subscription not found.' });
    }

    const today = new Date().toISOString().split('T')[0];

    switch (action) {
      case 'confirm': {
        if (!['draft', 'quotation'].includes(sub.status)) {
          return res.status(400).json({ success: false, message: `Cannot confirm subscription in '${sub.status}' state.` });
        }
        await query("UPDATE subscriptions SET status = 'confirmed' WHERE id = ?", [id]);
        return res.json({ success: true, message: 'Subscription confirmed successfully!' });
      }

      case 'activate': {
        if (!['draft', 'confirmed'].includes(sub.status)) {
          return res.status(400).json({ success: false, message: `Cannot activate subscription in '${sub.status}' state.` });
        }

        // Activate and generate first invoice if needed
        let invoiceCreated = null;
        await transaction(async (conn) => {
          await conn.query("UPDATE subscriptions SET status = 'active' WHERE id = ?", [id]);

          // Check if an initial invoice for period already exists
          const [existingInv] = await conn.query(
            'SELECT id FROM invoices WHERE subscription_id = ? AND billing_period_start = ?',
            [id, sub.start_date]
          );

          if (existingInv.length === 0) {
            const periodEnd = calculateNextBillingDate(sub.start_date, sub.billing_frequency);
            const invNumber = await generateInvoiceNumber(conn);
            const dueDate = calculateDueDate(today, sub.payment_terms);

            const [invRes] = await conn.query(
              `INSERT INTO invoices 
               (invoice_number, customer_id, subscription_id, billing_period_start, billing_period_end, 
                invoice_date, due_date, subtotal, tax_amount, discount_amount, total_amount, amount_paid, amount_due, payment_status, notes)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0.00, ?, 'unpaid', ?)`,
              [
                invNumber,
                sub.customer_id,
                sub.id,
                sub.start_date,
                periodEnd,
                today,
                dueDate,
                sub.subtotal,
                sub.tax_amount,
                sub.discount_amount,
                sub.total_amount,
                sub.total_amount,
                `Initial invoice upon subscription activation for ${sub.subscription_number}.`
              ]
            );

            const invId = invRes.insertId;
            const [lines] = await conn.query('SELECT * FROM subscription_lines WHERE subscription_id = ?', [id]);
            for (const line of lines) {
              await conn.query(
                `INSERT INTO invoice_lines 
                 (invoice_id, product_id, variant_id, description, quantity, unit_price, tax_rate, tax_amount, discount_amount, line_total)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [invId, line.product_id, line.variant_id, line.description, line.quantity, line.unit_price, line.tax_rate, line.tax_amount, line.discount_amount, line.line_total]
              );
            }
            invoiceCreated = invNumber;
          }
        });

        return res.json({
          success: true,
          message: invoiceCreated 
            ? `Subscription activated! Initial invoice ${invoiceCreated} generated.` 
            : 'Subscription activated!'
        });
      }

      case 'pause': {
        if (sub.status !== 'active') {
          return res.status(400).json({ success: false, message: 'Only active subscriptions can be paused.' });
        }
        if (!sub.pause_allowed) {
          return res.status(400).json({ success: false, message: 'Pausing is not allowed under this plan rules.' });
        }
        await query("UPDATE subscriptions SET status = 'paused' WHERE id = ?", [id]);
        return res.json({ success: true, message: 'Subscription has been paused.' });
      }

      case 'resume': {
        if (sub.status !== 'paused') {
          return res.status(400).json({ success: false, message: 'Only paused subscriptions can be resumed.' });
        }
        // Recalculate next billing date from today
        const nextBilling = calculateNextBillingDate(today, sub.billing_frequency);
        await query("UPDATE subscriptions SET status = 'active', next_billing_date = ? WHERE id = ?", [nextBilling, id]);
        return res.json({ success: true, message: `Subscription resumed! Next billing date scheduled for ${nextBilling}.` });
      }

      case 'renew': {
        if (!sub.renewal_allowed) {
          return res.status(400).json({ success: false, message: 'Renewal is not permitted for this subscription plan.' });
        }
        // Extend expiry date by 1 year from current expiry or today
        const baseExpiry = new Date(sub.expiry_date) > new Date() ? new Date(sub.expiry_date) : new Date();
        baseExpiry.setFullYear(baseExpiry.getFullYear() + 1);
        const newExpiry = baseExpiry.toISOString().split('T')[0];
        const nextBilling = calculateNextBillingDate(today, sub.billing_frequency);

        await query(
          "UPDATE subscriptions SET status = 'active', expiry_date = ?, next_billing_date = ? WHERE id = ?",
          [newExpiry, nextBilling, id]
        );

        return res.json({
          success: true,
          message: `Subscription renewed successfully through ${newExpiry}!`
        });
      }

      case 'close': {
        if (sub.status === 'closed') {
          return res.status(400).json({ success: false, message: 'Subscription is already closed.' });
        }

        const isBeforeExpiry = new Date(sub.expiry_date) > new Date();
        if (isBeforeExpiry && !sub.early_closure_allowed) {
          return res.status(400).json({
            success: false,
            message: 'Early closure is strictly prohibited under this subscription plan terms before the expiry date.'
          });
        }

        await query("UPDATE subscriptions SET status = 'closed' WHERE id = ?", [id]);
        return res.json({ success: true, message: 'Subscription closed successfully.' });
      }

      default:
        return res.status(400).json({ success: false, message: 'Unknown status transition action.' });
    }
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAllSubscriptions,
  getSubscriptionById,
  createSubscription,
  updateSubscription,
  transitionStatus
};
