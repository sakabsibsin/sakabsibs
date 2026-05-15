import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import * as categoryService from '../services/category.service.js';
import { Category } from '../models/Category.js';
import { Product } from '../models/Product.js';

export const listCategories = asyncHandler(async (_req, res) => {
  const categories = await categoryService.listCategories();
  sendSuccess(res, categories);
});

export const createCategory = asyncHandler(async (req, res) => {
  const { name, codePrefix } = req.body;
  const category = await categoryService.createCategory(name, codePrefix);
  sendSuccess(res, category, 201);
});

export const updateCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;

  if (!name?.trim()) return sendError(res, 'Category name is required.', 400);

  const category = await Category.findById(id);
  if (!category) return sendError(res, 'Category not found.', 404);

  const oldName = category.name;
  const newName = name.trim();
  const newPrefix = newName.substring(0, 2).toUpperCase();

  if (oldName !== newName) {
    await Product.updateMany({ category: oldName }, { category: newName });
  }

  category.name = newName;
  category.codePrefix = newPrefix;
  await category.save();

  sendSuccess(res, category);
});

export const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) return sendError(res, 'Category not found', 404);

  const productCount = await Product.countDocuments({ category: category.name });
  if (productCount > 0) {
    return sendError(
      res,
      `Cannot delete "${category.name}" — ${productCount} product${productCount > 1 ? 's are' : ' is'} using this category. Reassign them to another category first.`,
      400
    );
  }

  await category.deleteOne();
  sendSuccess(res, { message: 'Category deleted' });
});
