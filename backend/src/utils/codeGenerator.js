import { Product } from '../models/Product.js';
import { Category } from '../models/Category.js';

export const generateProductCode = async (categoryName) => {
  const cat = await Category.findOne({ name: categoryName }).lean();
  const prefix = cat?.codePrefix ?? categoryName.match(/[a-zA-Z]/g)?.slice(0, 2).join('').toUpperCase() ?? 'XX';

  // Escape regex special chars in the prefix even though categories are admin-
  // controlled — defense in depth so a category named "A+" can't break the query.
  const safePrefix = prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // Fetch only the highest-numbered code for this prefix in one sorted query
  const existing = await Product.find({
    productCode: { $regex: `^${safePrefix}\\d+$` },
  }).sort({ productCode: -1 }).select('productCode').lean();

  let nextNum = 101;
  for (const p of existing) {
    if (!p.productCode) continue;
    const num = parseInt(p.productCode.slice(prefix.length), 10);
    if (!isNaN(num) && num >= nextNum) nextNum = num + 1;
  }

  return `${prefix}${nextNum}`;
};
