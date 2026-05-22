import { Product } from '../models/Product.js';
import { generateProductCode } from '../utils/codeGenerator.js';
import { deleteFromCloudinary } from './upload.service.js';

// Extracts the Cloudinary public_id from a full Cloudinary URL.
// Returns null for non-Cloudinary URLs (e.g. picsum seed data).
const extractPublicId = (url) => {
  if (!url || !url.includes('cloudinary.com')) return null;
  const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[^.]+)?$/);
  return match ? match[1] : null;
};

// Maps the public `sort` token to a Mongoose sort spec. `createdAt: -1` is
// appended as a stable tiebreaker so paginated pages don't shuffle when two
// products share the primary sort key.
const SORT_SPECS = {
  featured:   { featured: -1, createdAt: -1 },
  price_asc:  { price: 1,  createdAt: -1 },
  price_desc: { price: -1, createdAt: -1 },
};
const resolveSort = (sort) => SORT_SPECS[sort] ?? { createdAt: -1 };

export const listProducts = async ({
  category, inStock, featured, search, sort,
  limit = 20, offset = 0, anyOutOfStock,
} = {}) => {
  const query = {};
  if (category) query.category = category;
  if (featured !== undefined) query.featured = featured;

  // Each clause that uses $or must live in its own slot under $and, otherwise
  // a second $or assignment silently overwrites the first. This bit the
  // Restock page (anyOutOfStock + search) — searches were returning in-stock
  // products because the search $or replaced the OOS $or.
  const andClauses = [];
  if (anyOutOfStock) {
    andClauses.push({ $or: [{ inStock: false }, { 'variants.inStock': false }] });
  } else if (inStock !== undefined) {
    andClauses.push({ inStock });
  }
  if (search) {
    // Escape regex special characters so a customer searching for "(a+)+$"
    // doesn't trigger catastrophic backtracking (ReDoS). Also cap length to
    // prevent absurdly long pattern compilation.
    const safe = search.toString().slice(0, 100).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    andClauses.push({
      $or: [
        { name: { $regex: safe, $options: 'i' } },
        { productCode: { $regex: safe, $options: 'i' } },
        { material: { $regex: safe, $options: 'i' } },
        { description: { $regex: safe, $options: 'i' } },
        // Match variant color so admins can find an OOS variant by its name.
        { 'variants.color': { $regex: safe, $options: 'i' } },
      ],
    });
  }
  if (andClauses.length) query.$and = andClauses;

  const [products, total] = await Promise.all([
    Product.find(query).sort(resolveSort(sort)).skip(offset).limit(limit),
    Product.countDocuments(query),
  ]);
  return { products, total, hasMore: offset + products.length < total };
};

export const getFeaturedProducts = () =>
  Product.find({ featured: true, inStock: true }).sort({ createdAt: -1 }).limit(12);

export const getProduct = (id) => Product.findById(id);

// Aggregate sum of demand counts across every OOS product/variant in the
// collection — used by the Restock page header so the "Signals" count
// reflects ALL pending interest, not just whatever's loaded on screen.
// One pipeline call, runs in a single round-trip; doesn't pull product
// documents back to Node.
export const getRestockStats = async () => {
  const result = await Product.aggregate([
    { $match: { $or: [{ inStock: false }, { 'variants.inStock': false }] } },
    {
      $project: {
        productDemand: {
          $cond: [{ $eq: ['$inStock', false] }, { $ifNull: ['$demandCount', 0] }, 0],
        },
        variantDemand: {
          $sum: {
            $map: {
              input: {
                $filter: {
                  input: { $ifNull: ['$variants', []] },
                  as: 'v',
                  cond: { $eq: ['$$v.inStock', false] },
                },
              },
              as: 'v',
              in: { $ifNull: ['$$v.demandCount', 0] },
            },
          },
        },
      },
    },
    {
      $group: {
        _id: null,
        totalSignals: { $sum: { $add: ['$productDemand', '$variantDemand'] } },
        outOfStockCount: { $sum: 1 },
      },
    },
  ]);
  return result[0] ?? { totalSignals: 0, outOfStockCount: 0 };
};

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
  // Master inStock mirrors variants: if all variants are OOS, master must also be OOS
  let finalBody = body;
  if (Array.isArray(body.variants) && body.variants.length > 0) {
    finalBody = { ...body, inStock: body.variants.some((v) => v.inStock !== false) };
  }
  for (let attempt = 0; attempt < 3; attempt++) {
    const productCode = await generateProductCode(finalBody.category);
    try {
      return await Product.create({ ...finalBody, productCode });
    } catch (err) {
      if (err.code === 11000 && attempt < 2) continue;
      throw err;
    }
  }
};

export const updateProduct = async (id, body) => {
  const existing = await Product.findById(id);
  if (!existing) return null;

  // Build the set of images that will exist after this save.
  // Only consider a field "changed" if it was explicitly included in the body —
  // a partial update that omits `images` should not trigger deletions for that field.
  const incomingBaseImages  = body.images    !== undefined ? body.images    : existing.images;
  const incomingVariantImages = body.variants !== undefined
    ? body.variants.flatMap((v) => v.images ?? [])
    : existing.variants.flatMap((v) => v.images);

  const incomingSet = new Set([...incomingBaseImages, ...incomingVariantImages]);

  const existingUrls = [
    ...existing.images,
    ...existing.variants.flatMap((v) => v.images),
  ];
  const removedUrls   = existingUrls.filter((url) => !incomingSet.has(url));
  const publicIds     = removedUrls.map(extractPublicId).filter(Boolean);
  if (publicIds.length > 0) {
    await Promise.allSettled(publicIds.map(deleteFromCloudinary));
  }

  let finalBody = body;
  if (Array.isArray(body.variants) && body.variants.length > 0) {
    // Master always mirrors variant states: any variant in stock → master on, all OOS → master off
    finalBody = { ...body, inStock: body.variants.some((v) => v.inStock !== false) };
  }
  return Product.findByIdAndUpdate(id, finalBody, { new: true, runValidators: true });
};

export const deleteProduct = async (id) => {
  const product = await Product.findById(id);
  if (!product) return null;

  const urls = [
    ...product.images,
    ...product.variants.flatMap((v) => v.images),
  ];
  const publicIds = urls.map(extractPublicId).filter(Boolean);
  if (publicIds.length > 0) {
    await Promise.allSettled(publicIds.map(deleteFromCloudinary));
  }

  await product.deleteOne();
  return product;
};

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
