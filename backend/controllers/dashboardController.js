const { query } = require('../config/db');

// 1. Admin Dashboard Statistics & Charts
async function getAdminDashboard(req, res, next) {
  try {
    const { range } = req.query; // '30d', '90d', '1y', 'all'

    // Summary Metric Cards (Aggregated straight from MySQL)
    const [customerCount] = await query("SELECT COUNT(*) AS total FROM customers WHERE status = 'active'");
    const [productCount] = await query("SELECT COUNT(*) AS total FROM products WHERE status = 'active'");
    const [planCount] = await query("SELECT COUNT(*) AS total FROM subscription_plans WHERE status = 'active'");
    const [activeSubCount] = await query("SELECT COUNT(*) AS total FROM subscriptions WHERE status = 'active'");
    const [totalInvoiceCount] = await query("SELECT COUNT(*) AS total FROM invoices WHERE payment_status != 'cancelled'");

    // Revenue = sum of completed payments
    const [revenueRes] = await query("SELECT COALESCE(SUM(amount), 0) AS total FROM payments WHERE status = 'completed'");
    // Outstanding = sum of amount_due on unpaid, partial, overdue invoices
    const [outstandingRes] = await query("SELECT COALESCE(SUM(amount_due), 0) AS total FROM invoices WHERE payment_status IN ('unpaid', 'partial', 'overdue')");
    // Overdue count and amount
    const [overdueRes] = await query("SELECT COUNT(*) AS count, COALESCE(SUM(amount_due), 0) AS total FROM invoices WHERE payment_status = 'overdue'");

    // Total Invoiced Amount
    const [invoicedRes] = await query("SELECT COALESCE(SUM(total_amount), 0) AS total FROM invoices WHERE payment_status != 'cancelled'");

    // 1. Monthly Revenue Chart (last 6-12 months)
    const monthlyRevenue = await query(`
      SELECT 
        DATE_FORMAT(payment_date, '%b %Y') AS month_label,
        DATE_FORMAT(payment_date, '%Y-%m') AS sort_key,
        COALESCE(SUM(amount), 0) AS revenue,
        COUNT(id) AS payment_count
      FROM payments
      WHERE status = 'completed'
      GROUP BY sort_key, month_label
      ORDER BY sort_key ASC
      LIMIT 12
    `);

    // 2. Subscription Growth Chart (created per month)
    const subscriptionGrowth = await query(`
      SELECT 
        DATE_FORMAT(start_date, '%b %Y') AS month_label,
        DATE_FORMAT(start_date, '%Y-%m') AS sort_key,
        COUNT(id) AS new_subscriptions,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) AS active_subscriptions
      FROM subscriptions
      GROUP BY sort_key, month_label
      ORDER BY sort_key ASC
      LIMIT 12
    `);

    // 3. Payment Status Breakdown Chart
    const paymentStatusDistribution = await query(`
      SELECT 
        payment_status,
        COUNT(*) AS count,
        COALESCE(SUM(total_amount), 0) AS total_amount,
        COALESCE(SUM(amount_due), 0) AS total_due
      FROM invoices
      WHERE payment_status != 'cancelled'
      GROUP BY payment_status
    `);

    // 4. Active vs Paused vs Closed Subscriptions
    const subscriptionStatusBreakdown = await query(`
      SELECT 
        status, 
        COUNT(*) AS count,
        COALESCE(SUM(total_amount), 0) AS mrr_value
      FROM subscriptions
      GROUP BY status
    `);

    // 5. Monthly Billing Overview (Invoiced vs Collected by month)
    const billingOverview = await query(`
      SELECT 
        DATE_FORMAT(i.invoice_date, '%b %Y') AS month_label,
        DATE_FORMAT(i.invoice_date, '%Y-%m') AS sort_key,
        COALESCE(SUM(i.total_amount), 0) AS invoiced,
        COALESCE(SUM(i.amount_paid), 0) AS collected,
        COALESCE(SUM(i.amount_due), 0) AS balance_due
      FROM invoices i
      WHERE i.payment_status != 'cancelled'
      GROUP BY sort_key, month_label
      ORDER BY sort_key ASC
      LIMIT 6
    `);

    // Recent 5 Invoices
    const recentInvoices = await query(`
      SELECT i.id, i.invoice_number, i.invoice_date, i.total_amount, i.amount_due, i.payment_status,
             c.company_name, c.contact_name
      FROM invoices i
      JOIN customers c ON i.customer_id = c.id
      ORDER BY i.id DESC
      LIMIT 5
    `);

    // Recent 5 Subscriptions
    const recentSubscriptions = await query(`
      SELECT s.id, s.subscription_number, s.start_date, s.next_billing_date, s.total_amount, s.status,
             c.company_name, sp.name AS plan_name
      FROM subscriptions s
      JOIN customers c ON s.customer_id = c.id
      JOIN subscription_plans sp ON s.plan_id = sp.id
      ORDER BY s.id DESC
      LIMIT 5
    `);

    return res.json({
      success: true,
      summary: {
        totalCustomers: customerCount.total,
        totalProducts: productCount.total,
        totalPlans: planCount.total,
        activeSubscriptions: activeSubCount.total,
        totalInvoices: totalInvoiceCount.total,
        totalRevenue: parseFloat(revenueRes.total),
        invoicedRevenue: parseFloat(invoicedRes.total),
        outstandingPayments: parseFloat(outstandingRes.total),
        overdueCount: overdueRes.count,
        overdueAmount: parseFloat(overdueRes.total)
      },
      charts: {
        monthlyRevenue,
        subscriptionGrowth,
        paymentStatusDistribution,
        subscriptionStatusBreakdown,
        billingOverview
      },
      recent: {
        invoices: recentInvoices,
        subscriptions: recentSubscriptions
      }
    });
  } catch (error) {
    next(error);
  }
}

// 2. Staff Dashboard Statistics
async function getStaffDashboard(req, res, next) {
  try {
    const [custRes] = await query("SELECT COUNT(*) AS total FROM customers WHERE status = 'active'");
    const [activeSubRes] = await query("SELECT COUNT(*) AS total FROM subscriptions WHERE status = 'active'");
    const [pendingQuotations] = await query("SELECT COUNT(*) AS total FROM quotations WHERE status IN ('draft', 'sent')");
    const [unpaidInvoices] = await query("SELECT COUNT(*) AS count, COALESCE(SUM(amount_due), 0) AS total FROM invoices WHERE payment_status IN ('unpaid', 'partial', 'overdue')");

    const upcomingRenewals = await query(`
      SELECT s.id, s.subscription_number, s.next_billing_date, s.expiry_date, s.total_amount,
             c.company_name, c.contact_name, sp.name AS plan_name
      FROM subscriptions s
      JOIN customers c ON s.customer_id = c.id
      JOIN subscription_plans sp ON s.plan_id = sp.id
      WHERE s.status = 'active'
      ORDER BY s.next_billing_date ASC
      LIMIT 6
    `);

    return res.json({
      success: true,
      summary: {
        totalCustomers: custRes.total,
        activeSubscriptions: activeSubRes.total,
        pendingQuotations: pendingQuotations.total,
        unpaidInvoicesCount: unpaidInvoices.count,
        unpaidInvoicesAmount: parseFloat(unpaidInvoices.total)
      },
      upcomingRenewals
    });
  } catch (error) {
    next(error);
  }
}

// 3. Customer Portal Dashboard
async function getCustomerPortalStats(req, res, next) {
  try {
    const customerId = req.user.customer_id;
    if (!customerId) {
      return res.status(403).json({ success: false, message: 'Customer account record not found.' });
    }

    const [activeSubs] = await query("SELECT COUNT(*) AS total FROM subscriptions WHERE customer_id = ? AND status = 'active'", [customerId]);
    const [invoicesCount] = await query("SELECT COUNT(*) AS total FROM invoices WHERE customer_id = ?", [customerId]);
    const [outstandingRes] = await query("SELECT COALESCE(SUM(amount_due), 0) AS total FROM invoices WHERE customer_id = ? AND payment_status IN ('unpaid', 'partial', 'overdue')", [customerId]);
    const [paidRes] = await query("SELECT COALESCE(SUM(amount), 0) AS total FROM payments WHERE customer_id = ? AND status = 'completed'", [customerId]);

    const myActiveSubscriptions = await query(`
      SELECT s.*, sp.name AS plan_name, p.name AS product_name
      FROM subscriptions s
      JOIN subscription_plans sp ON s.plan_id = sp.id
      JOIN products p ON sp.product_id = p.id
      WHERE s.customer_id = ? AND s.status IN ('active', 'paused', 'confirmed')
      ORDER BY s.id DESC
    `, [customerId]);

    const myRecentInvoices = await query(`
      SELECT * FROM invoices WHERE customer_id = ? ORDER BY id DESC LIMIT 5
    `, [customerId]);

    return res.json({
      success: true,
      summary: {
        activeSubscriptions: activeSubs.total,
        totalInvoices: invoicesCount.total,
        totalOutstanding: parseFloat(outstandingRes.total),
        totalPaid: parseFloat(paidRes.total)
      },
      subscriptions: myActiveSubscriptions,
      recentInvoices: myRecentInvoices
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAdminDashboard,
  getStaffDashboard,
  getCustomerPortalStats
};
