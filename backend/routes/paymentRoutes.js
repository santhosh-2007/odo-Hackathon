const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

router.use(authenticateToken);

router.get('/', paymentController.getAllPayments);
router.get('/:id', paymentController.getPaymentById);

// Admin & Staff can record payments
router.post('/', authorizeRoles('admin', 'staff'), paymentController.recordPayment);

module.exports = router;
