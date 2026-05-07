const Product = require('../models/Product');
const Category = require('../models/Category');

const listProducts = async (req, res) => {
  try {
    const { category, inStock, featured, limit = 100, offset = 0 } = req.query;
    const filter = {};
    if (category) filter.category = category;
    if (inStock !== undefined) filter.inStock = inStock === 'true';
    if (featured !== undefined) filter.featured = featured === 'true';

    const products = await Product.find(filter)
      .sort({ createdAt: 1 })
      .skip(parseInt(offset))
      .limit(parseInt(limit));

    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getFeaturedProducts = async (req, res) => {
  try {
    const products = await Product.find({ featured: true }).sort({ createdAt: 1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getProductStats = async (req, res) => {
  try {
    const all = await Product.find();
    const total = all.length;
    const inStock = all.filter((p) => p.inStock).length;
    const outOfStock = total - inStock;
    const featured = all.filter((p) => p.featured).length;

    const catMap = {};
    for (const p of all) {
      catMap[p.category] = (catMap[p.category] || 0) + 1;
    }
    const categories = Object.entries(catMap).map(([category, count]) => ({
      category,
      count,
    }));

    res.json({ total, inStock, outOfStock, featured, categories });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch {
    res.status(404).json({ error: 'Product not found' });
  }
};

const createProduct = async (req, res) => {
  try {
    const { name, description, price, images, material, category, inStock, featured } = req.body;

    const cat = await Category.findOne({ name: category });
    const prefix = cat?.codePrefix || category.substring(0, 2).toUpperCase();

    const existingWithPrefix = await Product.find({
      productCode: { $regex: `^${prefix}` },
    }).select('productCode');

    let nextNum = 101;
    for (const p of existingWithPrefix) {
      const num = parseInt(p.productCode.slice(prefix.length));
      if (!isNaN(num) && num >= nextNum) nextNum = num + 1;
    }
    const productCode = prefix + nextNum;

    const product = await Product.create({
      name,
      description,
      price,
      images,
      material,
      category,
      inStock,
      featured,
      productCode,
    });

    res.status(201).json(product);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const updateProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.status(204).end();
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const toggleProductStock = async (req, res) => {
  try {
    const { inStock } = req.body;
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { $set: { inStock } },
      { new: true }
    );
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

module.exports = {
  listProducts,
  getFeaturedProducts,
  getProductStats,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  toggleProductStock,
};
