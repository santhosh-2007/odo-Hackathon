const express = require('express');
const router = express.Router();
const taxController = require('../controllers/taxController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

router.use(authenticateToken);

router.get('/', taxController.getAllTaxes);

// Admin can configure tax rules
router.post('/', authorizeRoles('admin'), taxController.createTax);
router.put('/:id', authorizeRoles('admin'), taxController.updateTax);
router.delete('/:id', authorizeRoles('admin'), taxController.deleteTax);

module.exports = router;
