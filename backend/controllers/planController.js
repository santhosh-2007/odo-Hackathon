const { query } = require('../config/db');
const { calculateNextBillingDate } = require('../services/billingEngine');

// 1. Get all plans
async function getAllPlans(req, res, next) {
  try {
    const { search, frequency, status, productId } = req.query;
    let sql = `
      SELECT sp.*, 
             p.name AS product_name, 
             p.product_code,
             v.variant_name,
             v.sku AS variant_sku
      FROM subscription_plans sp
      JOIN products p ON sp.product_id = p.id
      LEFT JOIN product_variants v ON sp.variant_id = v.id
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      sql += ' AND (sp.name LIKE ? OR sp.plan_code LIKE ? OR sp.description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (frequency && frequency !== 'all') {
      sql += ' AND sp.billing_frequency = ?';
      params.push(frequency);
    }

    if (status && status !== 'all') {
      sql += ' AND sp.status = ?';
      params.push(status);
    }

    if (productId) {
      sql += ' AND sp.product_id = ?';
      params.push(productId);
    }

    sql += ' ORDER BY sp.id DESC';
    const plans = await query(sql, params);

    return res.json({ success: true, count: plans.length, data: plans });
  } catch (error) {
    next(error);
  }
}

// 2. Get single plan
async function getPlanById(req, res, next) {
  try {
    const { id } = req.params;
    const plans = await query(
      `SELECT sp.*, p.name AS product_name, v.variant_name 
       FROM subscription_plans sp
       JOIN products p ON sp.product_id = p.id
       LEFT JOIN product_variants v ON sp.variant_id = v.id
       WHERE sp.id = ?`,
      [id]
    );

    if (plans.length === 0) {
      return res.status(404).json({ success: false, message: 'Subscription plan not found.' });
    }

    return res.json({ success: true, data: plans[0] });
  } catch (error) {
    next(error);
  }
}

// 3. Create plan
async function createPlan(req, res, next) {
  try {
    const {
      plan_code,
      name,
      product_id,
      variant_id,
      price,
      billing_frequency,
      min_quantity,
      start_date,
      end_date,
      auto_close,
      early_closure_allowed,
      pause_allowed,
      renewal_allowed,
      description,
      status
    } = req.body;

    if (!name || !product_id || price === undefined || !billing_frequency) {
      return res.status(400).json({
        success: false,
        message: 'Plan name, product, price, and billing frequency are required.'
      });
    }

    const code = plan_code || `PLAN-${billing_frequency.toUpperCase()}-${Date.now().toString().slice(-4)}`;
    const startDate = start_date || new Date().toISOString().split('T')[0];

    const [resPlan] = await query(
      `INSERT INTO subscription_plans 
       (plan_code, name, product_id, variant_id, price, billing_frequency, min_quantity, start_date, end_date, 
        auto_close, early_closure_allowed, pause_allowed, renewal_allowed, description, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        code,
        name,
        product_id,
        variant_id || null,
        price,
        billing_frequency,
        min_quantity || 1,
        startDate,
        end_date || null,
        auto_close ? 1 : 0,
        early_closure_allowed !== false ? 1 : 0,
        pause_allowed !== false ? 1 : 0,
        renewal_allowed !== false ? 1 : 0,
        description || null,
        status || 'active'
      ]
    );

    return res.status(201).json({
      success: true,
      message: 'Subscription plan created successfully!',
      planId: resPlan.insertId
    });
  } catch (error) {
    next(error);
  }
}

// 4. Update plan
async function updatePlan(req, res, next) {
  try {
    const { id } = req.params;
    const {
      name,
      variant_id,
      price,
      billing_frequency,
      min_quantity,
      start_date,
      end_date,
      auto_close,
      early_closure_allowed,
      pause_allowed,
      renewal_allowed,
      description,
      status
    } = req.body;

    await query(
      `UPDATE subscription_plans 
       SET name = COALESCE(?, name),
           variant_id = COALESCE(?, variant_id),
           price = COALESCE(?, price),
           billing_frequency = COALESCE(?, billing_frequency),
           min_quantity = COALESCE(?, min_quantity),
           start_date = COALESCE(?, start_date),
           end_date = ?,
           auto_close = COALESCE(?, auto_close),
           early_closure_allowed = COALESCE(?, early_closure_allowed),
           pause_allowed = COALESCE(?, pause_allowed),
           renewal_allowed = COALESCE(?, renewal_allowed),
           description = COALESCE(?, description),
           status = COALESCE(?, status)
       WHERE id = ?`,
      [
        name,
        variant_id,
        price,
        billing_frequency,
        min_quantity,
        start_date,
        end_date,
        auto_close,
        early_closure_allowed,
        pause_allowed,
        renewal_allowed,
        description,
        status,
        id
      ]
    );

    return res.json({ success: true, message: 'Plan updated successfully!' });
  } catch (error) {
    next(error);
  }
}

// 5. Delete or Archive Plan
async function deletePlan(req, res, next) {
  try {
    const { id } = req.params;

    // Check if any active subscriptions use this plan
    const [subs] = await query('SELECT COUNT(*) AS count FROM subscriptions WHERE plan_id = ?', [id]);
    if (subs.count > 0) {
      await query("UPDATE subscription_plans SET status = 'archived' WHERE id = ?", [id]);
      return res.json({
        success: true,
        message: 'Plan has subscriptions associated with it and cannot be deleted. It has been marked as archived instead.'
      });
    }

    await query('DELETE FROM subscription_plans WHERE id = ?', [id]);
    return res.json({ success: true, message: 'Plan deleted permanently.' });
  } catch (error) {
    next(error);
  }
}

// 6. Preview next billing date for UI helper
function previewBillingDate(req, res) {
  const { startDate, frequency } = req.query;
  const base = startDate || new Date().toISOString().split('T')[0];
  const nextDate = calculateNextBillingDate(base, frequency || 'monthly');
  return res.json({ success: true, startDate: base, frequency, nextBillingDate: nextDate });
}

module.exports = {
  getAllPlans,
  getPlanById,
  createPlan,
  updatePlan,
  deletePlan,
  previewBillingDate
};
