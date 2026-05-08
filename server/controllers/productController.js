const Product = require('../models/Product');
const Category = require('../models/Category');

const listProducts = async (req, res) => {
  try {
    const { category, inStock, featured, search, limit = 20, offset = 0 } = req.query;

    const filter = {};
    if (category) filter.category = category;
    if (inStock !== undefined) filter.inStock = inStock === 'true';
    if (featured !== undefined) filter.featured = featured === 'true';
    if (search && search.trim()) {
      const re = { $regex: search.trim(), $options: 'i' };
      filter.$or = [{ name: re }, { productCode: re }, { material: re }];
    }

    const limitN = Math.min(parseInt(limit) || 20, 200);
    const offsetN = parseInt(offset) || 0;

    const [products, total] = await Promise.all([
      Product.find(filter).sort({ createdAt: -1 }).skip(offsetN).limit(limitN),
      Product.countDocuments(filter),
    ]);

    res.json({ products, total, hasMore: offsetN + products.length < total });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getFeaturedProducts = async (req, res) => {
  try {
    const products = await Product.find({ featured: true }).sort({ createdAt: -1 }).limit(12);
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getProductStats = async (req, res) => {
  try {
    const [total, inStock, featured, catAgg] = await Promise.all([
      Product.countDocuments(),
      Product.countDocuments({ inStock: true }),
      Product.countDocuments({ featured: true }),
      Product.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }]),
    ]);

    res.json({
      total,
      inStock,
      outOfStock: total - inStock,
      featured,
      categories: catAgg.map((c) => ({ category: c._id, count: c.count })),
    });
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
      name, description, price, images, material,
      category, inStock, featured, productCode,
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
