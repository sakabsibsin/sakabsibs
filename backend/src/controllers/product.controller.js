import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import * as productService from '../services/product.service.js';

export const listProducts = asyncHandler(async (req, res) => {
  const { category, inStock, featured, search, sort, limit, offset, anyOutOfStock } = req.query;
  const result = await productService.listProducts({
    category,
    inStock: inStock !== undefined ? inStock === 'true' : undefined,
    featured: featured !== undefined ? featured === 'true' : undefined,
    search,
    sort,
    limit: limit ? parseInt(limit, 10) : undefined,
    offset: offset ? parseInt(offset, 10) : undefined,
    anyOutOfStock: anyOutOfStock === 'true',
  });
  sendSuccess(res, result);
});

export const getFeaturedProducts = asyncHandler(async (_req, res) => {
  const products = await productService.getFeaturedProducts();
  sendSuccess(res, products);
});

export const getProductStats = asyncHandler(async (_req, res) => {
  const stats = await productService.getProductStats();
  sendSuccess(res, stats);
});

export const getProduct = asyncHandler(async (req, res) => {
  const product = await productService.getProduct(req.params.id);
  if (!product) return sendError(res, 'Product not found', 404);
  sendSuccess(res, product);
});

export const createProduct = asyncHandler(async (req, res) => {
  const product = await productService.createProduct(req.body);
  sendSuccess(res, product, 201);
});

export const updateProduct = asyncHandler(async (req, res) => {
  const product = await productService.updateProduct(req.params.id, req.body);
  if (!product) return sendError(res, 'Product not found', 404);
  sendSuccess(res, product);
});

export const deleteProduct = asyncHandler(async (req, res) => {
  const product = await productService.deleteProduct(req.params.id);
  if (!product) return sendError(res, 'Product not found', 404);
  sendSuccess(res, { message: 'Product deleted' });
});

export const toggleProductStock = asyncHandler(async (req, res) => {
  const product = await productService.toggleStock(req.params.id, req.body.inStock);
  if (!product) return sendError(res, 'Product not found', 404);
  sendSuccess(res, product);
});

export const registerDemand = asyncHandler(async (req, res) => {
  const product = await productService.registerDemand(req.params.id);
  if (!product) return sendError(res, 'Product not found', 404);
  sendSuccess(res, { demandCount: product.demandCount });
});

export const toggleVariantStock = asyncHandler(async (req, res) => {
  const product = await productService.toggleVariantStock(
    req.params.id, req.params.variantId, req.body.inStock
  );
  if (!product) return sendError(res, 'Product or variant not found', 404);
  sendSuccess(res, product);
});

export const registerVariantDemand = asyncHandler(async (req, res) => {
  const product = await productService.registerVariantDemand(
    req.params.id, req.params.variantId
  );
  if (!product) return sendError(res, 'Product or variant not found', 404);
  const variant = product.variants.find(
    (v) => v._id.toString() === req.params.variantId
  );
  sendSuccess(res, { demandCount: variant?.demandCount ?? 0 });
});
