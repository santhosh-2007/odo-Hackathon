const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoiceController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

router.use(authenticateToken);

router.get('/', invoiceController.getAllInvoices);
router.get('/:id', invoiceController.getInvoiceById);
router.get('/:id/pdf', invoiceController.downloadPdf);

// Admin & Staff can generate manual invoices, trigger recurring billing, cancel, or email
router.post('/', authorizeRoles('admin', 'staff'), invoiceController.createInvoice);
router.post('/trigger-recurring', authorizeRoles('admin', 'staff'), invoiceController.triggerRecurringBilling);
router.post('/:id/cancel', authorizeRoles('admin', 'staff'), invoiceController.cancelInvoice);
router.post('/:id/send-email', authorizeRoles('admin', 'staff'), invoiceController.sendInvoiceEmail);

module.exports = router;
