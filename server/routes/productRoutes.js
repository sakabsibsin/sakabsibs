const express = require('express');
const router = express.Router();
const {
  listProducts,
  getFeaturedProducts,
  getProductStats,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  toggleProductStock,
} = require('../controllers/productController');

router.get('/products', listProducts);
router.get('/products/featured', getFeaturedProducts);
router.get('/products/stats', getProductStats);
router.get('/products/:id', getProduct);
router.post('/products', createProduct);
router.put('/products/:id', updateProduct);
router.delete('/products/:id', deleteProduct);
router.patch('/products/:id/stock', toggleProductStock);

module.exports = router;
