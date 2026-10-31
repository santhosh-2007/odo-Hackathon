const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

router.use(authenticateToken);

// View products & variants
router.get('/', productController.getAllProducts);
router.get('/:id', productController.getProductById);

// Admin & Staff can manage products
router.post('/', authorizeRoles('admin', 'staff'), productController.createProduct);
router.put('/:id', authorizeRoles('admin', 'staff'), productController.updateProduct);
router.delete('/:id', authorizeRoles('admin'), productController.deleteProduct);

// Variant endpoints
router.post('/:productId/variants', authorizeRoles('admin', 'staff'), productController.addVariant);
router.put('/variants/:variantId', authorizeRoles('admin', 'staff'), productController.updateVariant);
router.delete('/variants/:variantId', authorizeRoles('admin'), productController.deleteVariant);

module.exports = router;
