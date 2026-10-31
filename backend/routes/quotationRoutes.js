const express = require('express');
const router = express.Router();
const quotationController = require('../controllers/quotationController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

router.use(authenticateToken);

router.get('/', quotationController.getAllQuotations);
router.get('/:id', quotationController.getQuotationById);
router.post('/', authorizeRoles('admin', 'staff'), quotationController.createQuotation);
router.put('/:id', authorizeRoles('admin', 'staff'), quotationController.updateQuotation);
router.post('/:id/convert', authorizeRoles('admin', 'staff'), quotationController.convertToSubscription);
router.post('/:id/respond', quotationController.respondToQuotation); // Customer can accept/reject

module.exports = router;
