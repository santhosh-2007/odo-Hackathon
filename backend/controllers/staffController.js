const bcrypt = require('bcryptjs');
const { query, transaction } = require('../config/db');
const { validatePassword } = require('../middleware/auth');

// 1. Get all staff members (Admin only)
async function getAllStaff(req, res, next) {
  try {
    const staff = await query(`
      SELECT s.*, 
             u.name, 
             u.email, 
             u.phone, 
             u.status AS user_status, 
             u.created_at AS joined_date
      FROM staff s
      JOIN users u ON s.user_id = u.id
      ORDER BY s.id DESC
    `);

    return res.json({ success: true, count: staff.length, data: staff });
  } catch (error) {
    next(error);
  }
}

// 2. Create Staff Account (Admin ONLY)
async function createStaff(req, res, next) {
  try {
    const { name, email, password, department, designation, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
    }

    if (!validatePassword(password)) {
      return res.status(400).json({
        success: false,
        message: 'Password must be more than 8 characters, contain at least 1 uppercase letter, 1 lowercase letter, and 1 special character.'
      });
    }

    const existing = await query('SELECT id FROM users WHERE email = ?', [email.toLowerCase().trim()]);
    if (existing.length > 0) {
      return res.status(409).json({ success: false, message: 'User with this email already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    const result = await transaction(async (conn) => {
      const [userRes] = await conn.query(
        'INSERT INTO users (name, email, password_hash, role, phone, status) VALUES (?, ?, ?, ?, ?, ?)',
        [name.trim(), email.toLowerCase().trim(), hash, 'staff', phone || null, 'active']
      );
      const userId = userRes.insertId;

      const employeeCode = `STF-BL-${String(userId).padStart(3, '0')}`;

      const [staffRes] = await conn.query(
        'INSERT INTO staff (user_id, employee_code, department, designation) VALUES (?, ?, ?, ?)',
        [userId, employeeCode, department || 'Customer Operations', designation || 'Subscription Specialist']
      );

      return { staffId: staffRes.insertId, employeeCode };
    });

    return res.status(201).json({
      success: true,
      message: 'Staff account created successfully!',
      data: result
    });
  } catch (error) {
    next(error);
  }
}

// 3. Update Staff Details
async function updateStaff(req, res, next) {
  try {
    const { id } = req.params;
    const { name, phone, department, designation, status } = req.body;

    const [staffMember] = await query('SELECT user_id FROM staff WHERE id = ?', [id]);
    if (!staffMember) {
      return res.status(404).json({ success: false, message: 'Staff record not found.' });
    }

    await transaction(async (conn) => {
      await conn.query(
        'UPDATE staff SET department = COALESCE(?, department), designation = COALESCE(?, designation) WHERE id = ?',
        [department, designation, id]
      );

      if (name || phone || status) {
        await conn.query(
          'UPDATE users SET name = COALESCE(?, name), phone = COALESCE(?, phone), status = COALESCE(?, status) WHERE id = ?',
          [name, phone, status, staffMember.user_id]
        );
      }
    });

    return res.json({ success: true, message: 'Staff member updated successfully!' });
  } catch (error) {
    next(error);
  }
}

// 4. Deactivate Staff Member
async function deactivateStaff(req, res, next) {
  try {
    const { id } = req.params;
    const [staffMember] = await query('SELECT user_id FROM staff WHERE id = ?', [id]);
    if (!staffMember) {
      return res.status(404).json({ success: false, message: 'Staff record not found.' });
    }

    await query("UPDATE users SET status = 'inactive' WHERE id = ?", [staffMember.user_id]);
    return res.json({ success: true, message: 'Staff account deactivated successfully.' });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAllStaff,
  createStaff,
  updateStaff,
  deactivateStaff
};
