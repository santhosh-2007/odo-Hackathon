const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { query, transaction } = require('../config/db');
const { validatePassword } = require('../middleware/auth');

function createToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name
    },
    process.env.JWT_SECRET || 'brightloop_software_super_secure_jwt_token_key_2026',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

// 1. Customer Self-Registration
async function register(req, res, next) {
  try {
    const { name, email, password, confirmPassword, company_name, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Passwords do not match.' });
    }

    if (!validatePassword(password)) {
      return res.status(400).json({
        success: false,
        message: 'Password must be more than 8 characters, contain at least 1 uppercase letter, 1 lowercase letter, and 1 special character.'
      });
    }

    // Check unique email
    const existing = await query('SELECT id FROM users WHERE email = ?', [email.toLowerCase().trim()]);
    if (existing.length > 0) {
      return res.status(409).json({ success: false, message: 'An account with this email address already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const result = await transaction(async (conn) => {
      // Insert user
      const [userRes] = await conn.query(
        'INSERT INTO users (name, email, password_hash, role, phone, status) VALUES (?, ?, ?, ?, ?, ?)',
        [name.trim(), email.toLowerCase().trim(), passwordHash, 'customer', phone || null, 'active']
      );
      const userId = userRes.insertId;

      // Auto-generate Customer Code: CUST-BL-XXXX
      const customerCode = `CUST-BL-${String(userId).padStart(4, '0')}`;

      const [custRes] = await conn.query(
        `INSERT INTO customers 
         (user_id, customer_code, company_name, contact_name, email, phone, currency, status) 
         VALUES (?, ?, ?, ?, ?, ?, 'INR', 'active')`,
        [userId, customerCode, company_name || `${name}'s Company`, name, email.toLowerCase().trim(), phone || null]
      );

      return {
        id: userId,
        name: name.trim(),
        email: email.toLowerCase().trim(),
        role: 'customer',
        customer_id: custRes.insertId,
        customer_code: customerCode,
        company_name: company_name || `${name}'s Company`
      };
    });

    const token = createToken(result);

    return res.status(201).json({
      success: true,
      message: 'Registration successful! Welcome to Brightloop Software.',
      token,
      user: result
    });
  } catch (error) {
    next(error);
  }
}

// 2. Login
async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const users = await query(
      'SELECT id, name, email, password_hash, role, phone, status FROM users WHERE email = ?',
      [email.toLowerCase().trim()]
    );

    if (users.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid email or password credentials.' });
    }

    const user = users[0];

    if (user.status !== 'active') {
      return res.status(403).json({ success: false, message: 'Account is deactivated. Contact Brightloop Support.' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password credentials.' });
    }

    // Role-specific detail fetch
    let customerId = null;
    let staffId = null;
    let companyName = null;

    if (user.role === 'customer') {
      const custRows = await query('SELECT id, customer_code, company_name FROM customers WHERE user_id = ?', [user.id]);
      if (custRows.length > 0) {
        customerId = custRows[0].id;
        companyName = custRows[0].company_name;
      }
    } else if (user.role === 'staff') {
      const staffRows = await query('SELECT id, employee_code, department FROM staff WHERE user_id = ?', [user.id]);
      if (staffRows.length > 0) {
        staffId = staffRows[0].id;
      }
    }

    const token = createToken(user);

    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      customer_id: customerId,
      company_name: companyName,
      staff_id: staffId
    };

    return res.json({
      success: true,
      message: `Welcome back, ${user.name}!`,
      token,
      user: safeUser
    });
  } catch (error) {
    next(error);
  }
}

// 3. Get Current User Profile
async function getMe(req, res, next) {
  try {
    const users = await query('SELECT id, name, email, role, phone, status, created_at FROM users WHERE id = ?', [req.user.id]);
    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const user = users[0];
    let extra = {};

    if (user.role === 'customer') {
      const [cust] = await query('SELECT * FROM customers WHERE user_id = ?', [user.id]);
      extra.customer = cust || null;
    } else if (user.role === 'staff') {
      const [stf] = await query('SELECT * FROM staff WHERE user_id = ?', [user.id]);
      extra.staff = stf || null;
    }

    return res.json({
      success: true,
      user: { ...user, ...extra }
    });
  } catch (error) {
    next(error);
  }
}

// 4. Forgot Password (Generates Secure Expiring Reset Token)
async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Please provide an email address.' });
    }

    const users = await query('SELECT id, name, email FROM users WHERE email = ?', [email.toLowerCase().trim()]);
    if (users.length === 0) {
      // Security practice: Return generic success message even if user doesn't exist
      return res.json({
        success: true,
        message: 'If the email exists in our system, a password reset link has been dispatched.'
      });
    }

    const user = users[0];

    // Generate secure random hex token
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    // Expires in 1 hour
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' ');

    await query(
      'INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)',
      [user.id, tokenHash, expiresAt]
    );

    return res.json({
      success: true,
      message: 'Password reset instructions have been generated.',
      // Provided in development/demo response for seamless testing
      resetToken: rawToken,
      expiresAt
    });
  } catch (error) {
    next(error);
  }
}

// 5. Reset Password
async function resetPassword(req, res, next) {
  try {
    const { token, newPassword, confirmPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ success: false, message: 'Token and new password are required.' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Passwords do not match.' });
    }

    if (!validatePassword(newPassword)) {
      return res.status(400).json({
        success: false,
        message: 'Password must be more than 8 characters, contain at least 1 uppercase letter, 1 lowercase letter, and 1 special character.'
      });
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const tokens = await query(
      'SELECT id, user_id, expires_at, used FROM password_reset_tokens WHERE token_hash = ? AND used = 0',
      [tokenHash]
    );

    if (tokens.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid or already used password reset token.' });
    }

    const record = tokens[0];
    if (new Date(record.expires_at) < new Date()) {
      return res.status(400).json({ success: false, message: 'Password reset token has expired. Please request a new one.' });
    }

    const salt = await bcrypt.genSalt(10);
    const newHash = await bcrypt.hash(newPassword, salt);

    await transaction(async (conn) => {
      await conn.query('UPDATE users SET password_hash = ? WHERE id = ?', [newHash, record.user_id]);
      await conn.query('UPDATE password_reset_tokens SET used = 1 WHERE id = ?', [record.id]);
    });

    return res.json({
      success: true,
      message: 'Password has been reset successfully! You may now log in with your new password.'
    });
  } catch (error) {
    next(error);
  }
}

// 6. Update Profile
async function updateProfile(req, res, next) {
  try {
    const { name, phone, company_name, billing_address, shipping_address, tax_id } = req.body;
    const userId = req.user.id;

    await transaction(async (conn) => {
      if (name || phone) {
        await conn.query('UPDATE users SET name = COALESCE(?, name), phone = COALESCE(?, phone) WHERE id = ?', [name, phone, userId]);
      }

      if (req.user.role === 'customer') {
        await conn.query(
          `UPDATE customers 
           SET company_name = COALESCE(?, company_name),
               phone = COALESCE(?, phone),
               billing_address = COALESCE(?, billing_address),
               shipping_address = COALESCE(?, shipping_address),
               tax_id = COALESCE(?, tax_id)
           WHERE user_id = ?`,
          [company_name, phone, billing_address, shipping_address, tax_id, userId]
        );
      }
    });

    return res.json({ success: true, message: 'Profile updated successfully!' });
  } catch (error) {
    next(error);
  }
}

// 7. Change Password (Authenticated)
async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    const userId = req.user.id;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Current password and new password are required.' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'New password and confirmation do not match.' });
    }

    if (!validatePassword(newPassword)) {
      return res.status(400).json({
        success: false,
        message: 'Password must be more than 8 characters, contain at least 1 uppercase letter, 1 lowercase letter, and 1 special character.'
      });
    }

    const [user] = await query('SELECT password_hash FROM users WHERE id = ?', [userId]);
    const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Incorrect current password.' });
    }

    const salt = await bcrypt.genSalt(10);
    const newHash = await bcrypt.hash(newPassword, salt);
    await query('UPDATE users SET password_hash = ? WHERE id = ?', [newHash, userId]);

    return res.json({ success: true, message: 'Password changed successfully!' });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  register,
  login,
  getMe,
  forgotPassword,
  resetPassword,
  updateProfile,
  changePassword
};
