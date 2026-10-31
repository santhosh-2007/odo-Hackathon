const bcrypt = require('bcryptjs');
const { query, transaction } = require('../config/db');
const { validatePassword } = require('../middleware/auth');

// 1. Get all customers
async function getAllCustomers(req, res, next) {
  try {
    const { search, status } = req.query;
    let sql = `
      SELECT c.*, 
             u.status AS user_status,
             (SELECT COUNT(*) FROM subscriptions WHERE customer_id = c.id AND status = 'active') AS active_subs_count,
             (SELECT COUNT(*) FROM invoices WHERE customer_id = c.id) AS total_invoices_count,
             (SELECT COALESCE(SUM(amount_due), 0) FROM invoices WHERE customer_id = c.id AND payment_status IN ('unpaid', 'partial', 'overdue')) AS total_outstanding
      FROM customers c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      sql += ' AND (c.company_name LIKE ? OR c.contact_name LIKE ? OR c.email LIKE ? OR c.customer_code LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (status && status !== 'all') {
      sql += ' AND c.status = ?';
      params.push(status);
    }

    sql += ' ORDER BY c.id DESC';
    const customers = await query(sql, params);

    return res.json({ success: true, count: customers.length, data: customers });
  } catch (error) {
    next(error);
  }
}

// 2. Get single customer by ID with full subscriptions & invoices
async function getCustomerById(req, res, next) {
  try {
    const { id } = req.params;

    // Isolation check
    if (req.user.role === 'customer' && parseInt(id) !== parseInt(req.user.customer_id)) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const customers = await query('SELECT * FROM customers WHERE id = ?', [id]);
    if (customers.length === 0) {
      return res.status(404).json({ success: false, message: 'Customer not found.' });
    }

    const customer = customers[0];

    const subscriptions = await query(
      `SELECT s.*, sp.name AS plan_name, p.name AS product_name 
       FROM subscriptions s
       JOIN subscription_plans sp ON s.plan_id = sp.id
       JOIN products p ON sp.product_id = p.id
       WHERE s.customer_id = ? 
       ORDER BY s.id DESC`,
      [id]
    );

    const invoices = await query(
      `SELECT * FROM invoices WHERE customer_id = ? ORDER BY id DESC`,
      [id]
    );

    const payments = await query(
      `SELECT * FROM payments WHERE customer_id = ? ORDER BY id DESC`,
      [id]
    );

    customer.subscriptions = subscriptions;
    customer.invoices = invoices;
    customer.payments = payments;

    return res.json({ success: true, data: customer });
  } catch (error) {
    next(error);
  }
}

// 3. Create Customer (Admin or Staff)
async function createCustomer(req, res, next) {
  try {
    const {
      company_name,
      contact_name,
      email,
      phone,
      billing_address,
      shipping_address,
      tax_id,
      currency,
      password
    } = req.body;

    if (!contact_name || !email) {
      return res.status(400).json({ success: false, message: 'Contact name and email are required.' });
    }

    const existing = await query('SELECT id FROM users WHERE email = ?', [email.toLowerCase().trim()]);
    if (existing.length > 0) {
      return res.status(409).json({ success: false, message: 'User with this email already exists.' });
    }

    const userPassword = password || 'Customer@12345';
    if (!validatePassword(userPassword)) {
      return res.status(400).json({
        success: false,
        message: 'Password must be > 8 characters with 1 uppercase, 1 lowercase, and 1 special character.'
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(userPassword, salt);

    const customer = await transaction(async (conn) => {
      const [userRes] = await conn.query(
        'INSERT INTO users (name, email, password_hash, role, phone, status) VALUES (?, ?, ?, ?, ?, ?)',
        [contact_name, email.toLowerCase().trim(), hash, 'customer', phone || null, 'active']
      );
      const userId = userRes.insertId;

      const customerCode = `CUST-BL-${String(userId).padStart(4, '0')}`;

      const [custRes] = await conn.query(
        `INSERT INTO customers 
         (user_id, customer_code, company_name, contact_name, email, phone, billing_address, shipping_address, tax_id, currency, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')`,
        [
          userId,
          customerCode,
          company_name || `${contact_name}'s Enterprise`,
          contact_name,
          email.toLowerCase().trim(),
          phone || null,
          billing_address || null,
          shipping_address || null,
          tax_id || null,
          currency || 'INR'
        ]
      );

      return { customerId: custRes.insertId, customerCode };
    });

    return res.status(201).json({
      success: true,
      message: 'Customer account created successfully!',
      data: customer
    });
  } catch (error) {
    next(error);
  }
}

// 4. Update Customer Details
async function updateCustomer(req, res, next) {
  try {
    const { id } = req.params;
    const { company_name, contact_name, phone, billing_address, shipping_address, tax_id, currency, status } = req.body;

    await query(
      `UPDATE customers 
       SET company_name = COALESCE(?, company_name),
           contact_name = COALESCE(?, contact_name),
           phone = COALESCE(?, phone),
           billing_address = COALESCE(?, billing_address),
           shipping_address = COALESCE(?, shipping_address),
           tax_id = COALESCE(?, tax_id),
           currency = COALESCE(?, currency),
           status = COALESCE(?, status)
       WHERE id = ?`,
      [company_name, contact_name, phone, billing_address, shipping_address, tax_id, currency, status, id]
    );

    return res.json({ success: true, message: 'Customer details updated successfully!' });
  } catch (error) {
    next(error);
  }
}

// 5. Deactivate Customer
async function deactivateCustomer(req, res, next) {
  try {
    const { id } = req.params;
    await query("UPDATE customers SET status = 'inactive' WHERE id = ?", [id]);
    return res.json({ success: true, message: 'Customer deactivated successfully.' });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAllCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deactivateCustomer
};
