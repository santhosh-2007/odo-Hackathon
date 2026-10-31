const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

router.use(authenticateToken);

// Admin & Staff can view list and create
router.get('/', authorizeRoles('admin', 'staff'), customerController.getAllCustomers);
router.post('/', authorizeRoles('admin', 'staff'), customerController.createCustomer);

// Customers can view their own details; Admin & Staff can view any
router.get('/:id', customerController.getCustomerById);
router.put('/:id', authorizeRoles('admin', 'staff'), customerController.updateCustomer);
router.delete('/:id', authorizeRoles('admin'), customerController.deactivateCustomer);

module.exports = router;
