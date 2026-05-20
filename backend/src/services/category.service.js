import { Category } from '../models/Category.js';

export const listCategories = () => Category.find().sort({ name: 1 });

export const createCategory = (name, codePrefix) =>
  Category.create({ name, codePrefix: codePrefix.toUpperCase() });
