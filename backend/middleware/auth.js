const jwt = require('jsonwebtoken');
const { query } = require('../config/db');

// Validation function for password requirements
function validatePassword(password) {
  if (!password || typeof password !== 'string') return false;
  if (password.length <= 8) return false;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  return hasUpperCase && hasLowerCase && hasSpecial;
}

// Middleware to verify JWT token
async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No authorization token provided.'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'brightloop_software_super_secure_jwt_token_key_2026');

    // Fetch user from DB to ensure user is active
    const users = await query('SELECT id, name, email, role, status FROM users WHERE id = ?', [decoded.id]);
    if (!users || users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid session. User no longer exists.'
      });
    }

    const user = users[0];
    if (user.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated. Please contact Brightloop Software support.'
      });
    }

    // Attach customer_id or staff_id if applicable
    let customerId = null;
    let staffId = null;

    if (user.role === 'customer') {
      const custRows = await query('SELECT id, company_name, customer_code FROM customers WHERE user_id = ?', [user.id]);
      if (custRows.length > 0) {
        customerId = custRows[0].id;
        user.customer_id = customerId;
        user.company_name = custRows[0].company_name;
        user.customer_code = custRows[0].customer_code;
      }
    } else if (user.role === 'staff') {
      const staffRows = await query('SELECT id, employee_code, department FROM staff WHERE user_id = ?', [user.id]);
      if (staffRows.length > 0) {
        staffId = staffRows[0].id;
        user.staff_id = staffId;
        user.employee_code = staffRows[0].employee_code;
      }
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token. Please log in again.'
    });
  }
}

// RBAC authorization middleware
function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Access restricted to role(s) [${allowedRoles.join(', ')}]. Current role: ${req.user.role}`
      });
    }

    next();
  };
}

module.exports = {
  validatePassword,
  authenticateToken,
  authorizeRoles
};
