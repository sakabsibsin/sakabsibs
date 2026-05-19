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
  // One-way auto-sync only: if every variant is explicitly OOS, force master offline too.
  // Never force it back ON — respect whatever the admin set on the master switch.
  let finalBody = body;
  if (Array.isArray(body.variants) && body.variants.length > 0) {
    if (body.variants.every((v) => v.inStock === false)) {
      finalBody = { ...body, inStock: false };
    }
  }
  return Product.findByIdAndUpdate(id, finalBody, { new: true, runValidators: true });
};

export const deleteProduct = (id) => Product.findByIdAndDelete(id);

export const toggleStock = (id, inStock) =>
  Product.findByIdAndUpdate(
    id,
    inStock
      // Restore whole product: master ON, all variants ON, demand reset
      ? { inStock: true, demandCount: 0, 'variants.$[].inStock': true, 'variants.$[].demandCount': 0 }
      // Take whole product offline: master OFF, all variants OFF too
      : { inStock: false, 'variants.$[].inStock': false },
    { new: true }
  );

export const registerDemand = (id) =>
  Product.findByIdAndUpdate(id, { $inc: { demandCount: 1 } }, { new: true });

export const toggleVariantStock = async (productId, variantId, inStock) => {
  const updateFields = inStock
    ? { 'variants.$.inStock': true, 'variants.$.demandCount': 0 }
    : { 'variants.$.inStock': false };

  const product = await Product.findOneAndUpdate(
    { _id: productId, 'variants._id': variantId },
    { $set: updateFields },
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
