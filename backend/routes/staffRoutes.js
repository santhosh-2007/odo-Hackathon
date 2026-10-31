const express = require('express');
const router = express.Router();
const staffController = require('../controllers/staffController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

router.use(authenticateToken);
router.use(authorizeRoles('admin')); // Strictly Admin-only!

router.get('/', staffController.getAllStaff);
router.post('/', staffController.createStaff);
router.put('/:id', staffController.updateStaff);
router.delete('/:id', staffController.deactivateStaff);

module.exports = router;
