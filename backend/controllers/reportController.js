const { query } = require('../config/db');

// Helper to format CSV row
function toCsvRow(arr) {
  return arr.map(val => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  }).join(',');
}

// 1. Get Report Data
async function getReportData(req, res, next) {
  try {
    const { type } = req.params;
    const { startDate, endDate, status, search } = req.query;

    let data = [];
    let summary = {};

    switch (type) {
      // 1. Total Revenue Report (Collected Payments)
      case 'total-revenue': {
        let sql = `
          SELECT p.payment_number, p.payment_date, p.payment_method, p.amount, p.transaction_reference,
                 i.invoice_number, i.total_amount AS invoice_total,
                 c.company_name, c.contact_name, c.customer_code
          FROM payments p
          JOIN invoices i ON p.invoice_id = i.id
          JOIN customers c ON p.customer_id = c.id
          WHERE p.status = 'completed'
        `;
        const params = [];
        if (startDate) { sql += ' AND p.payment_date >= ?'; params.push(startDate); }
        if (endDate) { sql += ' AND p.payment_date <= ?'; params.push(endDate); }
        if (search) {
          sql += ' AND (p.payment_number LIKE ? OR c.company_name LIKE ? OR p.transaction_reference LIKE ?)';
          params.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }
        sql += ' ORDER BY p.payment_date DESC';
        data = await query(sql, params);

        const totalAmount = data.reduce((acc, row) => acc + parseFloat(row.amount || 0), 0);
        summary = { totalRevenueCollected: totalAmount, transactionCount: data.length };
        break;
      }

      // 2. Monthly Revenue Report
      case 'monthly-revenue': {
        let sql = `
          SELECT 
            DATE_FORMAT(payment_date, '%Y-%m') AS month_key,
            DATE_FORMAT(payment_date, '%M %Y') AS month_name,
            COUNT(id) AS total_transactions,
            COALESCE(SUM(amount), 0) AS total_revenue,
            COALESCE(AVG(amount), 0) AS average_ticket
          FROM payments
          WHERE status = 'completed'
        `;
        const params = [];
        if (startDate) { sql += ' AND payment_date >= ?'; params.push(startDate); }
        if (endDate) { sql += ' AND payment_date <= ?'; params.push(endDate); }
        sql += ' GROUP BY month_key, month_name ORDER BY month_key DESC';
        data = await query(sql, params);

        const totalRev = data.reduce((acc, row) => acc + parseFloat(row.total_revenue || 0), 0);
        summary = { totalCollected: totalRev, monthsCount: data.length };
        break;
      }

      // 3. Active Subscription Report
      case 'active-subscriptions': {
        let sql = `
          SELECT s.subscription_number, s.start_date, s.expiry_date, s.billing_frequency,
                 s.next_billing_date, s.total_amount, s.payment_terms,
                 c.company_name, c.contact_name, c.email,
                 sp.name AS plan_name, p.name AS product_name
          FROM subscriptions s
          JOIN customers c ON s.customer_id = c.id
          JOIN subscription_plans sp ON s.plan_id = sp.id
          JOIN products p ON sp.product_id = p.id
          WHERE s.status = 'active'
        `;
        const params = [];
        if (search) {
          sql += ' AND (s.subscription_number LIKE ? OR c.company_name LIKE ? OR sp.name LIKE ?)';
          params.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }
        sql += ' ORDER BY s.id DESC';
        data = await query(sql, params);

        const totalMRR = data.reduce((acc, row) => acc + parseFloat(row.total_amount || 0), 0);
        summary = { activeCount: data.length, totalCommittedRevenue: totalMRR };
        break;
      }

      // 4. Closed Subscription Report
      case 'closed-subscriptions': {
        let sql = `
          SELECT s.subscription_number, s.start_date, s.expiry_date, s.total_amount, s.notes,
                 c.company_name, c.contact_name,
                 sp.name AS plan_name
          FROM subscriptions s
          JOIN customers c ON s.customer_id = c.id
          JOIN subscription_plans sp ON s.plan_id = sp.id
          WHERE s.status = 'closed'
        `;
        const params = [];
        if (search) {
          sql += ' AND (s.subscription_number LIKE ? OR c.company_name LIKE ?)';
          params.push(`%${search}%`, `%${search}%`);
        }
        sql += ' ORDER BY s.id DESC';
        data = await query(sql, params);
        summary = { totalClosed: data.length };
        break;
      }

      // 5. Outstanding Invoice Report
      case 'outstanding-invoices': {
        let sql = `
          SELECT i.invoice_number, i.invoice_date, i.due_date, i.total_amount, i.amount_paid, i.amount_due, i.payment_status,
                 DATEDIFF(CURRENT_DATE, i.due_date) AS days_aging,
                 c.company_name, c.contact_name, c.email, c.phone
          FROM invoices i
          JOIN customers c ON i.customer_id = c.id
          WHERE i.payment_status IN ('unpaid', 'partial', 'overdue')
        `;
        const params = [];
        if (search) {
          sql += ' AND (i.invoice_number LIKE ? OR c.company_name LIKE ?)';
          params.push(`%${search}%`, `%${search}%`);
        }
        sql += ' ORDER BY i.due_date ASC';
        data = await query(sql, params);

        const totalDue = data.reduce((acc, row) => acc + parseFloat(row.amount_due || 0), 0);
        summary = { outstandingInvoicesCount: data.length, totalOutstandingAmount: totalDue };
        break;
      }

      // 6. Overdue Invoice Report
      case 'overdue-invoices': {
        const today = new Date().toISOString().split('T')[0];
        let sql = `
          SELECT i.invoice_number, i.invoice_date, i.due_date, i.total_amount, i.amount_paid, i.amount_due,
                 DATEDIFF(CURRENT_DATE, i.due_date) AS days_overdue,
                 c.company_name, c.contact_name, c.email, c.phone
          FROM invoices i
          JOIN customers c ON i.customer_id = c.id
          WHERE i.payment_status IN ('overdue', 'unpaid', 'partial')
            AND i.due_date < ?
        `;
        const params = [today];
        if (search) {
          sql += ' AND (i.invoice_number LIKE ? OR c.company_name LIKE ?)';
          params.push(`%${search}%`, `%${search}%`);
        }
        sql += ' ORDER BY days_overdue DESC';
        data = await query(sql, params);

        const totalOverdue = data.reduce((acc, row) => acc + parseFloat(row.amount_due || 0), 0);
        summary = { overdueCount: data.length, totalOverdueAmount: totalOverdue };
        break;
      }

      // 7. Payment History Report
      case 'payment-history': {
        let sql = `
          SELECT p.payment_number, p.payment_date, p.payment_method, p.amount, p.transaction_reference, p.status, p.notes,
                 i.invoice_number, c.company_name, c.contact_name
          FROM payments p
          JOIN invoices i ON p.invoice_id = i.id
          JOIN customers c ON p.customer_id = c.id
          WHERE 1=1
        `;
        const params = [];
        if (startDate) { sql += ' AND p.payment_date >= ?'; params.push(startDate); }
        if (endDate) { sql += ' AND p.payment_date <= ?'; params.push(endDate); }
        if (search) {
          sql += ' AND (p.payment_number LIKE ? OR i.invoice_number LIKE ? OR c.company_name LIKE ?)';
          params.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }
        sql += ' ORDER BY p.id DESC';
        data = await query(sql, params);

        const totalPaid = data.reduce((acc, row) => acc + parseFloat(row.amount || 0), 0);
        summary = { totalPaymentsCount: data.length, totalAmount: totalPaid };
        break;
      }

      // 8. Customer Subscription Report
      case 'customer-subscriptions': {
        let sql = `
          SELECT c.customer_code, c.company_name, c.contact_name, c.email, c.phone,
                 COUNT(DISTINCT s.id) AS total_subscriptions,
                 SUM(CASE WHEN s.status = 'active' THEN 1 ELSE 0 END) AS active_subscriptions,
                 COALESCE(SUM(p.amount), 0) AS lifetime_paid,
                 (SELECT COALESCE(SUM(amount_due), 0) FROM invoices WHERE customer_id = c.id AND payment_status IN ('unpaid', 'partial', 'overdue')) AS total_outstanding
          FROM customers c
          LEFT JOIN subscriptions s ON c.id = s.customer_id
          LEFT JOIN payments p ON c.id = p.customer_id AND p.status = 'completed'
          WHERE 1=1
        `;
        const params = [];
        if (search) {
          sql += ' AND (c.company_name LIKE ? OR c.contact_name LIKE ? OR c.customer_code LIKE ?)';
          params.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }
        sql += ' GROUP BY c.id ORDER BY lifetime_paid DESC';
        data = await query(sql, params);
        summary = { totalCustomersCount: data.length };
        break;
      }

      default:
        return res.status(404).json({ success: false, message: 'Invalid report type requested.' });
    }

    return res.json({
      success: true,
      reportType: type,
      summary,
      count: data.length,
      data
    });
  } catch (error) {
    next(error);
  }
}

// 2. Export Report as CSV
async function exportReportCsv(req, res, next) {
  try {
    const { type } = req.params;
    // Re-use data query
    req.params.type = type;

    // Fetch data using internal call
    const fakeRes = {
      json: (payload) => payload,
      status: () => fakeRes
    };

    let reportResult;
    await getReportData(req, {
      json: (d) => { reportResult = d; },
      status: () => fakeRes
    }, next);

    if (!reportResult || !reportResult.data || reportResult.data.length === 0) {
      return res.status(404).send('No data available to export.');
    }

    const rows = reportResult.data;
    const headers = Object.keys(rows[0]);
    let csv = toCsvRow(headers) + '\r\n';

    rows.forEach(r => {
      const values = headers.map(h => r[h]);
      csv += toCsvRow(values) + '\r\n';
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="Brightloop_${type}_${Date.now()}.csv"`);
    return res.send(csv);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getReportData,
  exportReportCsv
};
