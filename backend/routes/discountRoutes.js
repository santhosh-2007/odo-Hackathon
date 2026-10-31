const express = require('express');
const router = express.Router();
const discountController = require('../controllers/discountController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

router.use(authenticateToken);

router.get('/', discountController.getAllDiscounts);
router.post('/validate', discountController.validateDiscountCode);

// Admin-only management
router.post('/', authorizeRoles('admin'), discountController.createDiscount);
router.put('/:id', authorizeRoles('admin'), discountController.updateDiscount);
router.delete('/:id', authorizeRoles('admin'), discountController.deleteDiscount);

module.exports = router;
