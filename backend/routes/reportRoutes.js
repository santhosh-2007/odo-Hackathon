const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

router.use(authenticateToken);
router.use(authorizeRoles('admin', 'staff'));

router.get('/:type', reportController.getReportData);
router.get('/:type/csv', reportController.exportReportCsv);

module.exports = router;
