const { query, transaction } = require('../config/db');

// 1. Get all discounts
async function getAllDiscounts(req, res, next) {
  try {
    const { status, search } = req.query;
    let sql = `
      SELECT d.*, 
             p.name AS product_name, 
             sp.name AS plan_name 
      FROM discounts d
      LEFT JOIN products p ON d.applicable_product_id = p.id
      LEFT JOIN subscription_plans sp ON d.applicable_plan_id = sp.id
      WHERE 1=1
    `;
    const params = [];

    if (status && status !== 'all') {
      sql += ' AND d.status = ?';
      params.push(status);
    }

    if (search) {
      sql += ' AND (d.code LIKE ? OR d.name LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    sql += ' ORDER BY d.id DESC';
    const discounts = await query(sql, params);
    return res.json({ success: true, count: discounts.length, data: discounts });
  } catch (error) {
    next(error);
  }
}

// 2. Validate Discount Code (Reusable calculation engine)
async function validateDiscountCode(req, res, next) {
  try {
    const { code, purchase_amount, quantity, product_id, plan_id, customer_id } = req.body;

    if (!code) {
      return res.status(400).json({ success: false, message: 'Discount code is required.' });
    }

    const today = new Date().toISOString().split('T')[0];

    const [discount] = await query(
      'SELECT * FROM discounts WHERE code = ? AND status = "active"',
      [code.toUpperCase().trim()]
    );

    if (!discount) {
      return res.status(404).json({ success: false, message: 'Invalid or inactive discount code.' });
    }

    // Check date validity
    if (discount.start_date && today < discount.start_date) {
      return res.status(400).json({ success: false, message: 'This discount offer has not started yet.' });
    }

    if (discount.end_date && today > discount.end_date) {
      return res.status(400).json({ success: false, message: 'This discount code has expired.' });
    }

    // Check usage limit
    if (discount.current_usage_count >= discount.max_usage_count) {
      return res.status(400).json({
        success: false,
        message: 'This discount code has reached its maximum permissible usage limit.'
      });
    }

    const amount = parseFloat(purchase_amount || 0);
    const qty = parseInt(quantity || 1, 10);

    // Minimum purchase amount check
    if (amount < parseFloat(discount.min_purchase_amount)) {
      return res.status(400).json({
        success: false,
        message: `Minimum purchase amount of ₹${parseFloat(discount.min_purchase_amount).toFixed(2)} required for this discount.`
      });
    }

    // Minimum quantity check
    if (qty < discount.min_quantity) {
      return res.status(400).json({
        success: false,
        message: `Minimum purchase quantity of ${discount.min_quantity} required for this discount.`
      });
    }

    // Applicable product / plan checks
    if (discount.applicable_product_id && product_id && parseInt(discount.applicable_product_id) !== parseInt(product_id)) {
      return res.status(400).json({ success: false, message: 'This coupon is not applicable to the selected product.' });
    }

    if (discount.applicable_plan_id && plan_id && parseInt(discount.applicable_plan_id) !== parseInt(plan_id)) {
      return res.status(400).json({ success: false, message: 'This coupon is not applicable to the selected plan.' });
    }

    // Calculate savings
    let calculatedSavings = 0;
    if (discount.discount_type === 'percentage') {
      calculatedSavings = (amount * parseFloat(discount.discount_value)) / 100;
    } else {
      calculatedSavings = Math.min(amount, parseFloat(discount.discount_value));
    }

    return res.json({
      success: true,
      message: `Discount '${discount.code}' applied! You save ₹${calculatedSavings.toFixed(2)}.`,
      data: {
        discount_id: discount.id,
        code: discount.code,
        name: discount.name,
        discount_type: discount.discount_type,
        discount_value: discount.discount_value,
        calculated_savings: calculatedSavings
      }
    });
  } catch (error) {
    next(error);
  }
}

// 3. Create Discount (Admin only)
async function createDiscount(req, res, next) {
  try {
    const {
      code,
      name,
      discount_type,
      discount_value,
      min_purchase_amount,
      min_quantity,
      applicable_product_id,
      applicable_plan_id,
      start_date,
      end_date,
      max_usage_count,
      status
    } = req.body;

    if (!code || !name || discount_value === undefined) {
      return res.status(400).json({ success: false, message: 'Code, name, and discount value are required.' });
    }

    const startDate = start_date || new Date().toISOString().split('T')[0];

    const [resDisc] = await query(
      `INSERT INTO discounts 
       (code, name, discount_type, discount_value, min_purchase_amount, min_quantity, 
        applicable_product_id, applicable_plan_id, start_date, end_date, max_usage_count, current_usage_count, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)`,
      [
        code.toUpperCase().trim(),
        name,
        discount_type || 'percentage',
        discount_value,
        min_purchase_amount || 0,
        min_quantity || 1,
        applicable_product_id || null,
        applicable_plan_id || null,
        startDate,
        end_date || null,
        max_usage_count || 100,
        status || 'active'
      ]
    );

    return res.status(201).json({
      success: true,
      message: 'Discount rule created successfully!',
      discountId: resDisc.insertId
    });
  } catch (error) {
    next(error);
  }
}

// 4. Update Discount (Admin only)
async function updateDiscount(req, res, next) {
  try {
    const { id } = req.params;
    const {
      name,
      discount_type,
      discount_value,
      min_purchase_amount,
      min_quantity,
      applicable_product_id,
      applicable_plan_id,
      start_date,
      end_date,
      max_usage_count,
      status
    } = req.body;

    await query(
      `UPDATE discounts 
       SET name = COALESCE(?, name),
           discount_type = COALESCE(?, discount_type),
           discount_value = COALESCE(?, discount_value),
           min_purchase_amount = COALESCE(?, min_purchase_amount),
           min_quantity = COALESCE(?, min_quantity),
           applicable_product_id = ?,
           applicable_plan_id = ?,
           start_date = COALESCE(?, start_date),
           end_date = ?,
           max_usage_count = COALESCE(?, max_usage_count),
           status = COALESCE(?, status)
       WHERE id = ?`,
      [
        name,
        discount_type,
        discount_value,
        min_purchase_amount,
        min_quantity,
        applicable_product_id,
        applicable_plan_id,
        start_date,
        end_date,
        max_usage_count,
        status,
        id
      ]
    );

    return res.json({ success: true, message: 'Discount rule updated successfully!' });
  } catch (error) {
    next(error);
  }
}

// 5. Delete or Deactivate Discount
async function deleteDiscount(req, res, next) {
  try {
    const { id } = req.params;
    await query("UPDATE discounts SET status = 'inactive' WHERE id = ?", [id]);
    return res.json({ success: true, message: 'Discount rule deactivated successfully.' });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAllDiscounts,
  validateDiscountCode,
  createDiscount,
  updateDiscount,
  deleteDiscount
};
