const { query } = require('../config/db');

// 1. Get all tax rules
async function getAllTaxes(req, res, next) {
  try {
    const { status } = req.query;
    let sql = 'SELECT * FROM tax_rules WHERE 1=1';
    const params = [];

    if (status && status !== 'all') {
      sql += ' AND status = ?';
      params.push(status);
    }

    sql += ' ORDER BY percentage ASC';
    const taxes = await query(sql, params);
    return res.json({ success: true, count: taxes.length, data: taxes });
  } catch (error) {
    next(error);
  }
}

// 2. Create tax rule
async function createTax(req, res, next) {
  try {
    const { name, percentage, tax_type, start_date, end_date, status } = req.body;

    if (!name || percentage === undefined) {
      return res.status(400).json({ success: false, message: 'Tax name and percentage are required.' });
    }

    const startDate = start_date || new Date().toISOString().split('T')[0];

    const [resTax] = await query(
      `INSERT INTO tax_rules (name, percentage, tax_type, start_date, end_date, status) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [name, percentage, tax_type || 'exclusive', startDate, end_date || null, status || 'active']
    );

    return res.status(201).json({
      success: true,
      message: 'Tax rule created successfully!',
      taxId: resTax.insertId
    });
  } catch (error) {
    next(error);
  }
}

// 3. Update tax rule
async function updateTax(req, res, next) {
  try {
    const { id } = req.params;
    const { name, percentage, tax_type, start_date, end_date, status } = req.body;

    await query(
      `UPDATE tax_rules 
       SET name = COALESCE(?, name),
           percentage = COALESCE(?, percentage),
           tax_type = COALESCE(?, tax_type),
           start_date = COALESCE(?, start_date),
           end_date = ?,
           status = COALESCE(?, status)
       WHERE id = ?`,
      [name, percentage, tax_type, start_date, end_date, status, id]
    );

    return res.json({ success: true, message: 'Tax rule updated successfully!' });
  } catch (error) {
    next(error);
  }
}

// 4. Delete tax rule
async function deleteTax(req, res, next) {
  try {
    const { id } = req.params;
    await query("UPDATE tax_rules SET status = 'inactive' WHERE id = ?", [id]);
    return res.json({ success: true, message: 'Tax rule deactivated successfully.' });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAllTaxes,
  createTax,
  updateTax,
  deleteTax
};
