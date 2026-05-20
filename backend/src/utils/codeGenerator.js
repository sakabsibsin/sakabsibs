import { Product } from '../models/Product.js';
import { Category } from '../models/Category.js';

export const generateProductCode = async (categoryName) => {
  const cat = await Category.findOne({ name: categoryName }).lean();
  const prefix = cat?.codePrefix ?? categoryName.match(/[a-zA-Z]/g)?.slice(0, 2).join('').toUpperCase() ?? 'XX';

  // Fetch only the highest-numbered code for this prefix in one sorted query
  const existing = await Product.find({
    productCode: { $regex: `^${prefix}\\d+$` },
  }).sort({ productCode: -1 }).select('productCode').lean();

  let nextNum = 101;
  for (const p of existing) {
    if (!p.productCode) continue;
    const num = parseInt(p.productCode.slice(prefix.length), 10);
    if (!isNaN(num) && num >= nextNum) nextNum = num + 1;
  }

  return `${prefix}${nextNum}`;
};
