const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

const { testConnection } = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const { processRecurringInvoices } = require('./services/billingEngine');

// Import Route Handlers
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const planRoutes = require('./routes/planRoutes');
const quotationRoutes = require('./routes/quotationRoutes');
const subscriptionRoutes = require('./routes/subscriptionRoutes');
const invoiceRoutes = require('./routes/invoiceRoutes');
const taxRoutes = require('./routes/taxRoutes');
const discountRoutes = require('./routes/discountRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const customerRoutes = require('./routes/customerRoutes');
const staffRoutes = require('./routes/staffRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const reportRoutes = require('./routes/reportRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Health Check Endpoint
app.get('/api/health', async (req, res) => {
  const dbStatus = await testConnection();
  return res.json({
    status: 'online',
    system: 'Brightloop Software Subscription Management System API',
    version: '1.0.0',
    database: dbStatus ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/plans', planRoutes);
app.use('/api/quotations', quotationRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/taxes', taxRoutes);
app.use('/api/discounts', discountRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportRoutes);

// Centralized Error Handling Middleware
app.use(errorHandler);

// Server Startup
async function startServer() {
  try {
    const isDbConnected = await testConnection();
    if (!isDbConnected) {
      console.warn('⚠️  Warning: MySQL connection could not be established immediately. Check DB_HOST and DB_PORT in .env.');
    } else {
      console.log('✅ Connected to MySQL database brightloop_sms on port ' + (process.env.DB_PORT || '3307'));
      
      // Automatic recurring billing engine startup run
      try {
        const billingResult = await processRecurringInvoices();
        if (billingResult.processed > 0) {
          console.log(`⚡ Recurring Billing Engine: Generated ${billingResult.processed} due recurring invoice(s).`);
        }
      } catch (billErr) {
        console.error('Initial billing run check warning:', billErr.message);
      }
    }

    app.listen(PORT, () => {
      console.log(`🚀 Brightloop Software Backend running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
  }
}

startServer();

module.exports = app;
