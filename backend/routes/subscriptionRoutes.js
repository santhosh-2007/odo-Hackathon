const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscriptionController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

router.use(authenticateToken);

router.get('/', subscriptionController.getAllSubscriptions);
router.get('/:id', subscriptionController.getSubscriptionById);

// Admin & Staff can create, edit, transition status
router.post('/', authorizeRoles('admin', 'staff'), subscriptionController.createSubscription);
router.put('/:id', authorizeRoles('admin', 'staff'), subscriptionController.updateSubscription);
router.post('/:id/transition', authorizeRoles('admin', 'staff'), subscriptionController.transitionStatus);

module.exports = router;
