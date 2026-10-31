const express = require('express');
const router = express.Router();
const planController = require('../controllers/planController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

router.use(authenticateToken);

router.get('/preview-billing-date', planController.previewBillingDate);
router.get('/', planController.getAllPlans);
router.get('/:id', planController.getPlanById);

// Admin can create/update/delete plans; Staff can view
router.post('/', authorizeRoles('admin', 'staff'), planController.createPlan);
router.put('/:id', authorizeRoles('admin', 'staff'), planController.updatePlan);
router.delete('/:id', authorizeRoles('admin'), planController.deletePlan);

module.exports = router;
