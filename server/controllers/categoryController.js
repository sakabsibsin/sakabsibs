const Category = require('../models/Category');

const listCategories = async (_req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const createCategory = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'Name is required' });

    const existing = await Category.findOne({ name: name.trim() });
    if (existing) return res.status(409).json({ error: 'Category already exists' });

    const codePrefix = name.trim().substring(0, 2).toUpperCase();
    const category = await Category.create({ name: name.trim(), codePrefix });
    res.status(201).json(category);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) return res.status(404).json({ error: 'Category not found' });
    res.status(204).end();
  } catch {
    res.status(404).json({ error: 'Category not found' });
  }
};

module.exports = { listCategories, createCategory, deleteCategory };
