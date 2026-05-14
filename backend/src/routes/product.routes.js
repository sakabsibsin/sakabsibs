import { Router } from 'express';
import {
  listProducts, getFeaturedProducts, getProductStats,
  getProduct, createProduct, updateProduct, deleteProduct,
  toggleProductStock, registerDemand,
  toggleVariantStock, registerVariantDemand,
} from '../controllers/product.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  createProductSchema, updateProductSchema,
  toggleStockSchema, toggleVariantStockSchema,
} from '../validators/product.validator.js';

const cache = (_req, res, next) => {
  res.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=60');
  next();
};

const router = Router();
router.get('/',          cache, listProducts);
router.get('/featured',  cache, getFeaturedProducts);
router.get('/stats',     requireAuth, getProductStats);
router.get('/:id',       cache, getProduct);
router.post('/',         requireAuth, validate(createProductSchema), createProduct);
router.put('/:id',       requireAuth, validate(updateProductSchema), updateProduct);
router.delete('/:id',    requireAuth, deleteProduct);
router.patch('/:id/stock',                         requireAuth, validate(toggleStockSchema), toggleProductStock);
router.post('/:id/demand',                         registerDemand);
router.patch('/:id/variants/:variantId/stock',     requireAuth, validate(toggleVariantStockSchema), toggleVariantStock);
router.post('/:id/variants/:variantId/demand',     registerVariantDemand);
export default router;
