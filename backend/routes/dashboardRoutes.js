const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

router.use(authenticateToken);

router.get('/admin', authorizeRoles('admin'), dashboardController.getAdminDashboard);
router.get('/staff', authorizeRoles('admin', 'staff'), dashboardController.getStaffDashboard);
router.get('/customer', authorizeRoles('customer'), dashboardController.getCustomerPortalStats);

module.exports = router;
