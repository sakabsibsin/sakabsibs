import { Product } from '../models/Product.js';
import { generateProductCode } from '../utils/codeGenerator.js';

export const listProducts = async ({
  category, inStock, featured, search,
  limit = 20, offset = 0, anyOutOfStock,
} = {}) => {
  const query = {};
  if (category) query.category = category;

  if (anyOutOfStock) {
    query.$or = [{ inStock: false }, { 'variants.inStock': false }];
  } else if (inStock !== undefined) {
    query.inStock = inStock;
  }

  if (featured !== undefined) query.featured = featured;
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { productCode: { $regex: search, $options: 'i' } },
      { material: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];
  }
  const [products, total] = await Promise.all([
    Product.find(query).sort({ createdAt: -1 }).skip(offset).limit(limit),
    Product.countDocuments(query),
  ]);
  return { products, total, hasMore: offset + products.length < total };
};

export const getFeaturedProducts = () =>
  Product.find({ featured: true, inStock: true }).sort({ createdAt: -1 }).limit(12);

export const getProduct = (id) => Product.findById(id);

export const getProductStats = async () => {
  const [total, inStockCount, featuredCount, categoryAgg] = await Promise.all([
    Product.countDocuments(),
    Product.countDocuments({ inStock: true }),
    Product.countDocuments({ featured: true }),
    Product.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }]),
  ]);
  return {
    total,
    inStock: inStockCount,
    outOfStock: total - inStockCount,
    featured: featuredCount,
    categories: categoryAgg.map((c) => ({ category: c._id, count: c.count })),
  };
};

export const createProduct = async (body) => {
  for (let attempt = 0; attempt < 3; attempt++) {
    const productCode = await generateProductCode(body.category);
    try {
      return await Product.create({ ...body, productCode });
    } catch (err) {
      if (err.code === 11000 && attempt < 2) continue;
      throw err;
    }
  }
};

export const updateProduct = async (id, body) => {
  let finalBody = body;
  if (Array.isArray(body.variants) && body.variants.length > 0) {
    const allOos = body.variants.every((v) => v.inStock === false);
    const anyInStock = body.variants.some((v) => v.inStock !== false);
    if (allOos) finalBody = { ...body, inStock: false };
    else if (anyInStock) finalBody = { ...body, inStock: true };
  }
  return Product.findByIdAndUpdate(id, finalBody, { new: true, runValidators: true });
};

export const deleteProduct = (id) => Product.findByIdAndDelete(id);

export const toggleStock = (id, inStock) =>
  Product.findByIdAndUpdate(id, { inStock }, { new: true });

export const registerDemand = (id) =>
  Product.findByIdAndUpdate(id, { $inc: { demandCount: 1 } }, { new: true });

export const toggleVariantStock = async (productId, variantId, inStock) => {
  const product = await Product.findOneAndUpdate(
    { _id: productId, 'variants._id': variantId },
    { $set: { 'variants.$.inStock': inStock } },
    { new: true }
  );
  if (!product) return null;

  // Auto-sync product-level inStock from variant states
  const allOos    = product.variants.every((v) => v.inStock === false);
  const anyInStock = product.variants.some((v) => v.inStock !== false);
  if (allOos && product.inStock !== false)
    return Product.findByIdAndUpdate(productId, { inStock: false }, { new: true });
  if (anyInStock && !product.inStock)
    return Product.findByIdAndUpdate(productId, { inStock: true }, { new: true });
  return product;
};

export const registerVariantDemand = (productId, variantId) =>
  Product.findOneAndUpdate(
    { _id: productId, 'variants._id': variantId },
    { $inc: { 'variants.$.demandCount': 1 } },
    { new: true }
  );
