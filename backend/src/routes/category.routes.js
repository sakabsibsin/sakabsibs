import { Router } from 'express';
import { listCategories, createCategory, updateCategory, deleteCategory } from '../controllers/category.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createCategorySchema } from '../validators/category.validator.js';

const cache = (_req, res, next) => {
  res.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=60');
  next();
};

const router = Router();
router.get('/', cache, listCategories);
router.post('/', requireAuth, validate(createCategorySchema), createCategory);
router.put('/:id', requireAuth, updateCategory);
router.delete('/:id', requireAuth, deleteCategory);
export default router;
