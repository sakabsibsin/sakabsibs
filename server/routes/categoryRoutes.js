const express = require('express');
const router = express.Router();
const {
  listCategories,
  createCategory,
  deleteCategory,
} = require('../controllers/categoryController');

router.get('/categories', listCategories);
router.post('/categories', createCategory);
router.delete('/categories/:id', deleteCategory);

module.exports = router;
