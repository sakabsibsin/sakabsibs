# Per-Variant Stock Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add per-variant stock control so admins can mark individual color/style variants as out of stock without taking the entire product offline.

**Architecture:** Add `inStock` + `demandCount` fields to the variant subdocument; expose variant `_id` as `id` in JSON; add two new API endpoints (variant stock toggle, variant demand); update every admin and store UI that touches stock or demand to be variant-aware.

**Tech Stack:** Express.js + Mongoose (backend), React 19 + TanStack Query v5 + React Hook Form + Zod (frontend), Tailwind CSS v3, Framer Motion.

---

## Files Modified / Created

| File | Action | What changes |
|------|--------|--------------|
| `backend/src/models/Product.js` | Modify | Extract variant into named schema, add `inStock`+`demandCount`, add `toJSON` |
| `backend/src/validators/product.validator.js` | Modify | Fix images min(1) bug, add variant fields, add `toggleVariantStockSchema` |
| `backend/src/services/product.service.js` | Modify | Add 2 new service fns, update `listProducts` for `anyOutOfStock` param |
| `backend/src/controllers/product.controller.js` | Modify | Add 2 new controllers, update `listProducts` controller |
| `backend/src/routes/product.routes.js` | Modify | Register 2 new routes |
| `frontend/src/lib/utils.js` | Modify | Add `getProductThumbnail` + `getEffectivePrice` helpers |
| `frontend/src/features/products/api.js` | Modify | Add `toggleVariantStock` + `registerVariantDemand` API fns |
| `frontend/src/features/products/hooks.js` | Modify | Add `useToggleVariantStock` + `useRegisterVariantDemand` hooks |
| `frontend/src/components/admin/ProductForm.jsx` | Modify | Add `inStock` to VariantModal + variant list stock badges |
| `frontend/src/pages/admin/ProductsPage.jsx` | Modify | Fix thumbnail, fix price, add variant stock hint |
| `frontend/src/pages/admin/RestockPage.jsx` | Modify | Variant-aware display + per-variant Restock buttons |
| `frontend/src/pages/admin/DashboardPage.jsx` | Modify | Update demand count query |
| `frontend/src/pages/store/ProductDetailPage.jsx` | Modify | Variant-aware CTA, status row, demand, pill OOS indicator |
| `frontend/src/components/store/ProductCard.jsx` | Modify | Fix price display, fix OOS badge logic |
| `frontend/src/pages/store/CatalogPage.jsx` | Modify | Fix sort-by-price for variant products |

---

## Task 1: Update Product Model

**Files:**
- Modify: `backend/src/models/Product.js`

- [ ] **Step 1: Replace the inline variant object with a named `variantSchema`**

Open `backend/src/models/Product.js`. Replace the entire file with:

```js
import mongoose from 'mongoose';

const variantSchema = new mongoose.Schema({
  color:       { type: String, required: true },
  price:       { type: Number, required: true },
  images:      [{ type: String }],
  isDefault:   { type: Boolean, default: false },
  inStock:     { type: Boolean, default: true },
  demandCount: { type: Number, default: 0 },
});

variantSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    return ret;
  },
});

const productSchema = new mongoose.Schema(
  {
    name:        { type: String, required: true },
    description: { type: String, required: true },
    price:       { type: Number, required: true },
    images:      [String],
    material:    { type: String, default: '' },
    category:    { type: String, required: true },
    productCode: { type: String, unique: true },
    inStock:     { type: Boolean, default: true },
    featured:    { type: Boolean, default: false },
    demandCount: { type: Number, default: 0 },
    variants:    [variantSchema],
  },
  { timestamps: true }
);

productSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export const Product = mongoose.model('Product', productSchema);
```

- [ ] **Step 2: Verify the server starts without errors**

```
npm run dev:backend
```
Expected: `Server running on port 8080` with no Mongoose schema errors.

- [ ] **Step 3: Verify variant `id` is exposed in API responses**

```
curl http://localhost:8080/api/products?limit=1
```
Find a product that has variants in the response. Each variant object should now have an `id` field (string) in addition to `color`, `price`, etc. If no variant products exist yet, skip this check — it will be verified after Task 8.

- [ ] **Step 4: Commit**

```
git add backend/src/models/Product.js
git commit -m "feat: add inStock and demandCount to variant schema, expose variant id"
```

---

## Task 2: Update Backend Validator

**Files:**
- Modify: `backend/src/validators/product.validator.js`

- [ ] **Step 1: Replace the entire file**

```js
import { z } from 'zod';

const variantSchema = z.object({
  color:       z.string().min(1, 'Color is required'),
  price:       z.coerce.number().min(0),
  images:      z.array(z.string()).optional().default([]),
  isDefault:   z.boolean().default(false),
  inStock:     z.boolean().default(true),
  demandCount: z.coerce.number().default(0),
});

export const createProductSchema = z.object({
  name:        z.string().min(1, 'Name is required'),
  description: z.string().min(1, 'Description is required'),
  price:       z.coerce.number().min(0, 'Price must be non-negative'),
  images:      z.array(z.string()).default([]),
  material:    z.string().optional().default(''),
  category:    z.string().min(1, 'Category is required'),
  inStock:     z.boolean().default(true),
  featured:    z.boolean().default(false),
  variants:    z.array(variantSchema).optional().default([]),
}).superRefine((data, ctx) => {
  if (!data.variants?.length && !data.images?.length) {
    ctx.addIssue({
      path: ['images'],
      code: z.ZodIssueCode.custom,
      message: 'At least one image is required when no variants are added',
    });
  }
});

export const updateProductSchema = createProductSchema.partial();

export const toggleStockSchema = z.object({
  inStock: z.boolean(),
});

export const toggleVariantStockSchema = z.object({
  inStock: z.boolean(),
});
```

- [ ] **Step 2: Verify the backend still starts**

```
npm run dev:backend
```
Expected: server starts cleanly.

- [ ] **Step 3: Verify variant product creation works (manual test)**

With the backend running, try creating a product with variants and no base images via the admin UI (Tasks 8+ cover the UI; for now just confirm the validator no longer rejects empty `images` when variants are present). You can do a quick API test:

```
curl -s -X POST http://localhost:8080/api/products \
  -H "Content-Type: application/json" \
  -H "Cookie: sakabsibs_token=<your-admin-token>" \
  -d '{"name":"Test","description":"Test","price":100,"category":"Bangles","images":[],"variants":[{"color":"Gold","price":200,"images":["https://example.com/img.jpg"],"isDefault":true}]}'
```
Expected: `201` with the created product, NOT a validation error about images.

- [ ] **Step 4: Commit**

```
git add backend/src/validators/product.validator.js
git commit -m "fix: allow empty base images when variants exist, add variant inStock/demandCount to validator"
```

---

## Task 3: Update Backend Service

**Files:**
- Modify: `backend/src/services/product.service.js`

- [ ] **Step 1: Replace the entire file**

```js
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

export const updateProduct = (id, body) =>
  Product.findByIdAndUpdate(id, body, { new: true, runValidators: true });

export const deleteProduct = (id) => Product.findByIdAndDelete(id);

export const toggleStock = (id, inStock) =>
  Product.findByIdAndUpdate(id, { inStock }, { new: true });

export const registerDemand = (id) =>
  Product.findByIdAndUpdate(id, { $inc: { demandCount: 1 } }, { new: true });

export const toggleVariantStock = (productId, variantId, inStock) =>
  Product.findOneAndUpdate(
    { _id: productId, 'variants._id': variantId },
    { $set: { 'variants.$.inStock': inStock } },
    { new: true }
  );

export const registerVariantDemand = (productId, variantId) =>
  Product.findOneAndUpdate(
    { _id: productId, 'variants._id': variantId },
    { $inc: { 'variants.$.demandCount': 1 } },
    { new: true }
  );
```

**Note on `anyOutOfStock` + `search` conflict:** The current code has an issue where `search` will overwrite the `$or` set by `anyOutOfStock` because both use `query.$or`. Since `anyOutOfStock` is used only by the restock page (no search), and `search` is used by the catalog/admin pages (no `anyOutOfStock`), these will never be used together in practice. The code above is intentionally simple.

- [ ] **Step 2: Verify server starts**

```
npm run dev:backend
```
Expected: starts cleanly, no import errors.

- [ ] **Step 3: Commit**

```
git add backend/src/services/product.service.js
git commit -m "feat: add toggleVariantStock and registerVariantDemand service methods, support anyOutOfStock query"
```

---

## Task 4: Update Backend Controller

**Files:**
- Modify: `backend/src/controllers/product.controller.js`

- [ ] **Step 1: Replace the entire file**

```js
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import * as productService from '../services/product.service.js';

export const listProducts = asyncHandler(async (req, res) => {
  const { category, inStock, featured, search, limit, offset, anyOutOfStock } = req.query;
  const result = await productService.listProducts({
    category,
    inStock: inStock !== undefined ? inStock === 'true' : undefined,
    featured: featured !== undefined ? featured === 'true' : undefined,
    search,
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
```

- [ ] **Step 2: Commit**

```
git add backend/src/controllers/product.controller.js
git commit -m "feat: add toggleVariantStock and registerVariantDemand controllers"
```

---

## Task 5: Update Backend Routes

**Files:**
- Modify: `backend/src/routes/product.routes.js`

- [ ] **Step 1: Replace the entire file**

```js
import { Router } from 'express';
import {
  listProducts, getFeaturedProducts, getProductStats,
  getProduct, createProduct, updateProduct, deleteProduct,
  toggleProductStock, registerDemand,
  toggleVariantStock, registerVariantDemand,
} from '../controllers/product.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  createProductSchema, updateProductSchema,
  toggleStockSchema, toggleVariantStockSchema,
} from '../validators/product.validator.js';

const cache = (_req, res, next) => {
  res.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=60');
  next();
};

const router = Router();
router.get('/',          cache, listProducts);
router.get('/featured',  cache, getFeaturedProducts);
router.get('/stats',     requireAuth, getProductStats);
router.get('/:id',       cache, getProduct);
router.post('/',         requireAuth, validate(createProductSchema), createProduct);
router.put('/:id',       requireAuth, validate(updateProductSchema), updateProduct);
router.delete('/:id',    requireAuth, deleteProduct);
router.patch('/:id/stock',           requireAuth, validate(toggleStockSchema), toggleProductStock);
router.post('/:id/demand',           registerDemand);
router.patch('/:id/variants/:variantId/stock',  requireAuth, validate(toggleVariantStockSchema), toggleVariantStock);
router.post('/:id/variants/:variantId/demand',  registerVariantDemand);
export default router;
```

- [ ] **Step 2: Test both new endpoints with curl**

First, get a product ID and variant ID from the DB (replace with real values):

```bash
# Test variant stock toggle (requires auth cookie)
curl -s -X PATCH "http://localhost:8080/api/products/PRODUCT_ID/variants/VARIANT_ID/stock" \
  -H "Content-Type: application/json" \
  -H "Cookie: sakabsibs_token=TOKEN" \
  -d '{"inStock": false}'
```
Expected: `200` with updated product where the variant's `inStock` is `false`.

```bash
# Test variant demand (public)
curl -s -X POST "http://localhost:8080/api/products/PRODUCT_ID/variants/VARIANT_ID/demand"
```
Expected: `200` with `{ demandCount: 1 }`.

- [ ] **Step 3: Commit**

```
git add backend/src/routes/product.routes.js
git commit -m "feat: register variant stock and demand routes"
```

---

## Task 6: Add Shared Frontend Helpers

**Files:**
- Modify: `frontend/src/lib/utils.js`

- [ ] **Step 1: Add two helper functions to `utils.js`**

Read the current `utils.js` first to find where to add. Append these two exports at the end of the file:

```js
/**
 * Returns the display thumbnail URL for a product.
 * Uses the default variant's first image when variants exist.
 */
export const getProductThumbnail = (product) => {
  if (product.variants?.length > 0) {
    const def = product.variants.find((v) => v.isDefault) ?? product.variants[0];
    return def?.images?.[0] ?? '';
  }
  return product.images?.[0] ?? '';
};

/**
 * Returns the effective display price for a product.
 * Uses the default variant's price when variants exist.
 */
export const getEffectivePrice = (product) => {
  if (!product.variants?.length) return product.price;
  const def = product.variants.find((v) => v.isDefault) ?? product.variants[0];
  return def?.price ?? product.price;
};
```

- [ ] **Step 2: Commit**

```
git add frontend/src/lib/utils.js
git commit -m "feat: add getProductThumbnail and getEffectivePrice helpers to utils"
```

---

## Task 7: Update Frontend API + Hooks

**Files:**
- Modify: `frontend/src/features/products/api.js`
- Modify: `frontend/src/features/products/hooks.js`

- [ ] **Step 1: Add two new functions to `api.js`**

Append to the end of `frontend/src/features/products/api.js`:

```js
export const toggleVariantStock = async (productId, variantId, inStock) => {
  const { data } = await apiClient.patch(
    `/products/${productId}/variants/${variantId}/stock`,
    { inStock }
  );
  return data.data;
};

export const registerVariantDemand = async (productId, variantId) => {
  const { data } = await apiClient.post(
    `/products/${productId}/variants/${variantId}/demand`
  );
  return data.data;
};
```

- [ ] **Step 2: Add two new hooks to `hooks.js`**

Append to the end of `frontend/src/features/products/hooks.js`:

```js
export const useToggleVariantStock = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, variantId, inStock }) =>
      api.toggleVariantStock(productId, variantId, inStock),
    onSuccess: (_data, { productId }) => {
      qc.invalidateQueries({ queryKey: productKeys.detail(productId) });
      qc.invalidateQueries({ queryKey: productKeys.lists() });
    },
  });
};

export const useRegisterVariantDemand = () =>
  useMutation({
    mutationFn: ({ productId, variantId }) =>
      api.registerVariantDemand(productId, variantId),
  });
```

- [ ] **Step 3: Commit**

```
git add frontend/src/features/products/api.js frontend/src/features/products/hooks.js
git commit -m "feat: add toggleVariantStock and registerVariantDemand API functions and hooks"
```

---

## Task 8: Update VariantModal + ProductForm (CORE ADMIN FIX)

**Files:**
- Modify: `frontend/src/components/admin/ProductForm.jsx`

This is the core fix. The `VariantModal` and the variant list rows in `ProductForm` both need variant-level stock control.

- [ ] **Step 1: Update the frontend Zod `variantSchema` (at the top of VariantModal section)**

Find this block (around line 45):
```js
const variantSchema = z.object({
  color: z.string().min(1, 'Color name is required'),
  price: z.coerce.number({ invalid_type_error: 'Enter a valid price' }).min(1, 'Price is required'),
  images: z.array(z.any()).min(1, 'At least one photo is required'),
});
```

Replace with:
```js
const variantSchema = z.object({
  color:   z.string().min(1, 'Color name is required'),
  price:   z.coerce.number({ invalid_type_error: 'Enter a valid price' }).min(1, 'Price is required'),
  images:  z.array(z.any()).min(1, 'At least one photo is required'),
  inStock: z.boolean().default(true),
});
```

- [ ] **Step 2: Update `EMPTY_DRAFT` constant**

Find:
```js
const EMPTY_DRAFT = { color: '', price: '', images: [], isDefault: false };
```
Replace with:
```js
const EMPTY_DRAFT = { color: '', price: '', images: [], isDefault: false, inStock: true };
```

- [ ] **Step 3: Add the `inStock` toggle inside `VariantModal`**

Find the "Set as default" toggle block (around line 131):
```jsx
{/* Set as default */}
<div className="flex items-start gap-3 pt-1">
  <Switch
    checked={draft.isDefault}
    onCheckedChange={(v) => setDraft((d) => ({ ...d, isDefault: v }))}
  />
  <div>
    <p className="text-sm leading-tight">Set as default variant</p>
    <p className="text-[10px] text-muted-foreground/50 mt-0.5 font-light">
      This variant will be shown first in the shop
    </p>
  </div>
</div>
```

Replace with:
```jsx
{/* Set as default */}
<div className="flex items-start gap-3 pt-1">
  <Switch
    checked={draft.isDefault}
    onCheckedChange={(v) => setDraft((d) => ({ ...d, isDefault: v }))}
  />
  <div>
    <p className="text-sm leading-tight">Set as default variant</p>
    <p className="text-[10px] text-muted-foreground/50 mt-0.5 font-light">
      This variant will be shown first in the shop
    </p>
  </div>
</div>

{/* In Stock */}
<div className="flex items-start gap-3 pt-1">
  <Switch
    checked={draft.inStock !== false}
    onCheckedChange={(v) => setDraft((d) => ({ ...d, inStock: v }))}
  />
  <div>
    <p className="text-sm leading-tight">In Stock</p>
    <p className="text-[10px] text-muted-foreground/50 mt-0.5 font-light">
      Turn off if this colour / style is sold out
    </p>
  </div>
</div>
```

- [ ] **Step 4: Update the main product form Zod `schema` to include `inStock` on variants**

Find in the main `schema` definition (around line 25):
```js
variants: z.array(z.object({
  color: z.string().min(1, 'Color is required'),
  price: z.coerce.number().min(0),
  images: z.array(z.any()).optional().default([]),
  isDefault: z.boolean().default(false),
})).optional().default([]),
```

Replace with:
```js
variants: z.array(z.object({
  color:   z.string().min(1, 'Color is required'),
  price:   z.coerce.number().min(0),
  images:  z.array(z.any()).optional().default([]),
  isDefault: z.boolean().default(false),
  inStock: z.boolean().default(true),
})).optional().default([]),
```

- [ ] **Step 5: Update `reset()` call to include `inStock` when loading existing product variants**

Find inside the `useEffect` that resets the form (around line 209):
```js
variants: product.variants ?? [],
```
This already passes the full variant object from the server (which now includes `inStock`), so no change needed here. ✓

- [ ] **Step 6: Update the variant list rows to show a stock badge**

Find the variant list row section (around line 448):
```jsx
<div key={field.id} className="flex items-center justify-between px-3 py-2.5 border border-border/50 bg-muted/10">
  <div className="flex items-center gap-2">
    <span className="text-sm">
      {allVariants?.[index]?.color || <span className="text-muted-foreground/40 italic text-xs">Unnamed</span>}
    </span>
    {allVariants?.[index]?.isDefault && (
      <span className="text-[8px] tracking-[0.1em] uppercase font-medium text-primary/65 border border-primary/22 px-1.5 py-px leading-none">
        Default
      </span>
    )}
  </div>
  <div className="flex items-center gap-0.5">
```

Replace the entire `<div key={field.id} ...>` row (closing at the `</div>` before the next `})`):
```jsx
<div key={field.id} className="flex items-center justify-between px-3 py-2.5 border border-border/50 bg-muted/10">
  <div className="flex items-center gap-2 flex-wrap">
    <span className="text-sm">
      {allVariants?.[index]?.color || <span className="text-muted-foreground/40 italic text-xs">Unnamed</span>}
    </span>
    {allVariants?.[index]?.isDefault && (
      <span className="text-[8px] tracking-[0.1em] uppercase font-medium text-primary/65 border border-primary/22 px-1.5 py-px leading-none">
        Default
      </span>
    )}
    {allVariants?.[index]?.inStock === false ? (
      <span className="text-[8px] tracking-[0.1em] uppercase font-medium text-red-500/70 border border-red-200 px-1.5 py-px leading-none">
        Out of Stock
      </span>
    ) : (
      <span className="text-[8px] tracking-[0.1em] uppercase font-medium text-green-700/60 border border-green-200 px-1.5 py-px leading-none">
        In Stock
      </span>
    )}
  </div>
  <div className="flex items-center gap-0.5">
    <button
      type="button"
      onClick={() => openEditModal(index)}
      className="h-7 w-7 flex items-center justify-center text-muted-foreground/35 hover:text-foreground transition-colors"
      title="Edit variant"
    >
      <Pencil className="h-3.5 w-3.5" />
    </button>
    <button
      type="button"
      onClick={() => removeVariant(index)}
      className="h-7 w-7 flex items-center justify-center text-muted-foreground/35 hover:text-destructive transition-colors"
      title="Remove variant"
    >
      <Trash2 className="h-3.5 w-3.5" />
    </button>
  </div>
</div>
```

- [ ] **Step 7: Verify in browser**

Start the dev server (`npm run dev`). Go to Admin → Edit a product that has variants. Confirm:
1. The VariantModal now has an "In Stock" toggle below "Set as default"
2. Each variant row in the list shows a green "In Stock" or red "Out of Stock" badge
3. Toggling `inStock` to `false` in the modal and saving shows "Out of Stock" badge in the list
4. Saving the whole product form submits the variant's `inStock` value correctly (check Network tab — variants array should include `inStock: false`)

- [ ] **Step 8: Commit**

```
git add frontend/src/components/admin/ProductForm.jsx
git commit -m "feat: add per-variant inStock toggle to VariantModal and stock badges to variant list"
```

---

## Task 9: Update Admin ProductsPage

**Files:**
- Modify: `frontend/src/pages/admin/ProductsPage.jsx`

Three fixes: thumbnail (uses base image instead of variant), price (shows base price instead of variant), and stock column (no variant breakdown hint).

- [ ] **Step 1: Add import for shared helpers**

Find the import block at the top and add `getProductThumbnail` and `getEffectivePrice`:

```js
import { Switch } from "@/components/ui/Switch";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatPrice, cn, getProductThumbnail, getEffectivePrice } from "@/lib/utils";
```

- [ ] **Step 2: Fix thumbnail — replace `product.images[0]` in the table row**

Find (around line 197):
```jsx
{product.images?.[0] ? (
  <img
    src={product.images[0]}
    alt=""
    className="w-full h-full object-cover transition-transform duration-500 ease-luxury group-hover:scale-[1.07]"
    loading="lazy"
  />
) : (
  <div className="w-full h-full bg-muted/40" />
)}
```

Replace with:
```jsx
{getProductThumbnail(product) ? (
  <img
    src={getProductThumbnail(product)}
    alt=""
    className="w-full h-full object-cover transition-transform duration-500 ease-luxury group-hover:scale-[1.07]"
    loading="lazy"
  />
) : (
  <div className="w-full h-full bg-muted/40" />
)}
```

- [ ] **Step 3: Fix price — replace `product.price` in the price column**

Find (around line 230):
```jsx
<span className="text-[13px] font-medium tabular-nums text-foreground/80">
  {formatPrice(product.price)}
</span>
```

Replace with:
```jsx
<span className="text-[13px] font-medium tabular-nums text-foreground/80">
  {formatPrice(getEffectivePrice(product))}
</span>
```

- [ ] **Step 4: Add variant stock hint to the stock column**

Find the stock toggle table cell (around line 236):
```jsx
{/* Stock toggle */}
<td className="px-2 py-3 text-center">
  <Switch
    checked={product.inStock}
    onCheckedChange={() =>
      toggleStock.mutate({
        id: product.id,
        inStock: !product.inStock,
      })
    }
  />
</td>
```

Replace with:
```jsx
{/* Stock toggle */}
<td className="px-2 py-3 text-center">
  <div className="flex flex-col items-center gap-1">
    <Switch
      checked={product.inStock}
      onCheckedChange={() =>
        toggleStock.mutate({
          id: product.id,
          inStock: !product.inStock,
        })
      }
    />
    {product.variants?.length > 0 && (
      <span className="text-[9px] text-muted-foreground/40 tabular-nums leading-none">
        {product.variants.filter((v) => v.inStock !== false).length}/{product.variants.length}
      </span>
    )}
  </div>
</td>
```

This shows `2/3` under the switch when a variant product has 2 of 3 variants in stock.

- [ ] **Step 5: Verify in browser**

Go to Admin → All Products. Check:
1. Variant products show their default variant's image as the thumbnail (not blank/base image)
2. Variant products show the default variant's price
3. Variant products with any OOS variants show `X/Y` under the stock switch

- [ ] **Step 6: Commit**

```
git add frontend/src/pages/admin/ProductsPage.jsx
git commit -m "fix: admin product list — correct thumbnail, price, and stock indicator for variant products"
```

---

## Task 10: Update Admin RestockPage

**Files:**
- Modify: `frontend/src/pages/admin/RestockPage.jsx`

- [ ] **Step 1: Replace the entire file**

```jsx
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/Skeleton';
import { useProducts, useToggleStock, useToggleVariantStock, productKeys } from '@/features/products/hooks';
import { getProductThumbnail, cn } from '@/lib/utils';

const getTotalDemand = (product) => {
  const variantDemand = (product.variants ?? []).reduce((s, v) => s + (v.demandCount ?? 0), 0);
  return (product.demandCount ?? 0) + variantDemand;
};

export const RestockPage = () => {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data, isLoading } = useProducts({ anyOutOfStock: true, limit: 200 });
  const toggleStock = useToggleStock();
  const toggleVariantStock = useToggleVariantStock();

  const allProducts = [...(data?.products ?? [])].sort(
    (a, b) => getTotalDemand(b) - getTotalDemand(a)
  );
  const withDemand = allProducts.filter((p) => getTotalDemand(p) > 0);
  const noDemand   = allProducts.filter((p) => getTotalDemand(p) === 0);

  // Stat strip calculations
  const totalOosItems = allProducts.reduce((count, p) => {
    if (!p.variants?.length) return count + (!p.inStock ? 1 : 0);
    return count + p.variants.filter((v) => v.inStock === false).length +
      (!p.inStock && !p.variants.some((v) => v.inStock === false) ? 1 : 0);
  }, 0);
  const totalWithDemand = allProducts.reduce((count, p) => {
    if (!p.variants?.length) return count + ((p.demandCount ?? 0) > 0 ? 1 : 0);
    return count + p.variants.filter((v) => v.inStock === false && (v.demandCount ?? 0) > 0).length;
  }, 0);
  const totalSignals = allProducts.reduce((sum, p) => {
    const variantDemand = (p.variants ?? []).reduce((s, v) => s + (v.demandCount ?? 0), 0);
    return sum + (p.demandCount ?? 0) + variantDemand;
  }, 0);

  const handleRestockProduct = (product) => {
    toggleStock.mutate(
      { id: product.id, inStock: true },
      {
        onSuccess: () => {
          toast.success(`"${product.name}" is back in stock.`);
          qc.invalidateQueries({ queryKey: productKeys.stats() });
          qc.invalidateQueries({ queryKey: productKeys.lists() });
        },
        onError: () => toast.error('Failed to update stock.'),
      }
    );
  };

  const handleRestockVariant = (product, variant) => {
    toggleVariantStock.mutate(
      { productId: product.id, variantId: variant.id, inStock: true },
      {
        onSuccess: () => {
          toast.success(`"${product.name} — ${variant.color}" is back in stock.`);
          qc.invalidateQueries({ queryKey: productKeys.lists() });
        },
        onError: () => toast.error('Failed to update variant stock.'),
      }
    );
  };

  const renderProductCard = (product, faded = false) => {
    const thumb = getProductThumbnail(product);
    const hasVariants = (product.variants ?? []).length > 0;
    const oosVariants = hasVariants
      ? product.variants.filter((v) => v.inStock === false)
      : [];
    const productLevelOos = !product.inStock && (!hasVariants || oosVariants.length === 0);

    return (
      <div
        key={product.id}
        className={cn(
          'border bg-card',
          faded ? 'border-border/40 opacity-60' : 'border-border'
        )}
      >
        {/* Product header row */}
        <div className={cn(
          'flex items-center gap-4 px-4 py-3.5',
          hasVariants && 'border-b border-border/30'
        )}>
          <div className="h-11 w-11 shrink-0 overflow-hidden" style={{ background: 'hsl(34,40%,94%)' }}>
            {thumb ? (
              <img src={thumb} alt="" className="w-full h-full object-cover" loading="lazy" />
            ) : (
              <div className="w-full h-full bg-muted/50" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className={cn('text-sm font-medium truncate', faded && 'text-foreground/50')}>
              {product.name}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <p className="text-[10px] text-muted-foreground/45">{product.category}</p>
              {product.productCode && (
                <>
                  <span className="text-muted-foreground/25 text-[10px]">·</span>
                  <p className="text-[10px] font-mono text-muted-foreground/40">{product.productCode}</p>
                </>
              )}
            </div>
          </div>

          {/* Product-level restock — shown when no variants OR master switch is off with no OOS variants */}
          {productLevelOos && (
            <div className="flex items-center gap-3 shrink-0">
              {!faded && (
                <div className="text-center w-14">
                  <p className="text-xl font-serif leading-none">{product.demandCount ?? 0}</p>
                  <p className="text-[9px] uppercase tracking-wider text-muted-foreground/35 mt-1">
                    {(product.demandCount ?? 0) === 1 ? 'request' : 'requests'}
                  </p>
                </div>
              )}
              <button
                onClick={() => handleRestockProduct(product)}
                disabled={toggleStock.isPending}
                className={cn(
                  'shrink-0 h-8 px-4 text-[10px] uppercase tracking-wider transition-colors disabled:opacity-40',
                  faded
                    ? 'border border-border/40 text-muted-foreground/40 hover:border-foreground/25 hover:text-foreground hover:bg-muted/30'
                    : 'bg-foreground text-background hover:bg-foreground/85'
                )}
              >
                Restock
              </button>
            </div>
          )}
        </div>

        {/* Variant sub-rows — one per OOS variant */}
        {oosVariants.map((variant) => (
          <div
            key={variant.id}
            className="flex items-center gap-4 px-4 py-3 border-b border-border/20 last:border-b-0 hover:bg-muted/10 transition-colors"
          >
            <div className="w-11 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className={cn('text-sm truncate', faded ? 'text-foreground/40' : 'text-foreground/80')}>
                {variant.color}
              </p>
            </div>
            {!faded && (
              <div className="text-center shrink-0 w-14">
                <p className="text-xl font-serif leading-none">{variant.demandCount ?? 0}</p>
                <p className="text-[9px] uppercase tracking-wider text-muted-foreground/35 mt-1">
                  {(variant.demandCount ?? 0) === 1 ? 'request' : 'requests'}
                </p>
              </div>
            )}
            <button
              onClick={() => handleRestockVariant(product, variant)}
              disabled={toggleVariantStock.isPending}
              className={cn(
                'shrink-0 h-8 px-4 text-[10px] uppercase tracking-wider transition-colors disabled:opacity-40',
                faded
                  ? 'border border-border/40 text-muted-foreground/40 hover:border-foreground/25 hover:text-foreground hover:bg-muted/30'
                  : 'bg-foreground text-background hover:bg-foreground/85'
              )}
            >
              Restock
            </button>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="max-w-2xl pb-16">

      <button
        onClick={() => navigate(-1)}
        className="group inline-flex items-center gap-2 text-[10px] tracking-[0.2em] uppercase font-light text-muted-foreground/40 hover:text-foreground transition-colors mb-8"
      >
        <ArrowLeft className="h-3 w-3 transition-transform group-hover:-translate-x-0.5" />
        Dashboard
      </button>

      <div className="mb-8">
        <h1 className="text-4xl font-serif font-light tracking-wide">Restock Demand</h1>
      </div>

      {/* Stat strip */}
      {!isLoading && allProducts.length > 0 && (
        <div className="grid grid-cols-3 border border-border bg-card mb-10">
          {[
            { value: totalOosItems,    label: 'Out of Stock' },
            { value: totalWithDemand,  label: 'Have Demand'  },
            { value: totalSignals,     label: 'Total Signals'},
          ].map(({ value, label }, i) => (
            <div
              key={label}
              className={cn('flex flex-col items-center justify-center py-5', i < 2 && 'border-r border-border')}
            >
              <p className="text-3xl font-serif mb-1">{value}</p>
              <p className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground/40">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="border border-border bg-card p-5 flex items-center gap-4">
              <Skeleton className="h-11 w-11 shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-28" />
              </div>
              <Skeleton className="h-8 w-24 shrink-0" />
            </div>
          ))}
        </div>
      )}

      {/* Empty */}
      {!isLoading && allProducts.length === 0 && (
        <div className="border border-border bg-card py-24 text-center">
          <CheckCircle2 className="h-10 w-10 text-muted-foreground/15 mx-auto mb-5" />
          <p className="font-serif text-2xl font-light text-muted-foreground/40 mb-2">All clear</p>
          <p className="text-xs text-muted-foreground/30 tracking-wide">Every product is currently in stock.</p>
        </div>
      )}

      {/* Most Wanted */}
      {!isLoading && withDemand.length > 0 && (
        <div className="mb-10">
          <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground/50 mb-4">
            Most Wanted — prioritise these
          </p>
          <div className="space-y-2">
            {withDemand.map((p) => renderProductCard(p, false))}
          </div>
        </div>
      )}

      {/* No demand */}
      {!isLoading && noDemand.length > 0 && (
        <div>
          <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground/35 mb-3">
            Out of Stock · No Customer Requests Yet ({noDemand.length})
          </p>
          <div className="space-y-2">
            {noDemand.map((p) => renderProductCard(p, true))}
          </div>
        </div>
      )}
    </div>
  );
};
```

- [ ] **Step 2: Verify in browser**

Go to Admin → Restock. Check:
1. Products with OOS variants now appear (not just product-level OOS)
2. Variant products show sub-rows for each OOS variant with individual Restock buttons
3. Clicking Restock on a variant sub-row restocks only that variant
4. The stat strip counts OOS items correctly

- [ ] **Step 3: Commit**

```
git add frontend/src/pages/admin/RestockPage.jsx
git commit -m "feat: restock page — per-variant display and individual restock buttons"
```

---

## Task 11: Update Admin DashboardPage

**Files:**
- Modify: `frontend/src/pages/admin/DashboardPage.jsx`

- [ ] **Step 1: Change the demand count query**

Find (around line 18):
```js
const { data: outOfStockData } = useProducts({ inStock: false, limit: 50 });
```

Replace with:
```js
const { data: outOfStockData } = useProducts({ anyOutOfStock: true, limit: 50 });
```

- [ ] **Step 2: Update the demand count calculation to include variant demand**

Find (around line 20):
```js
const demandCount = (outOfStockData?.products ?? [])
  .filter((p) => (p.demandCount ?? 0) > 0).length;
```

Replace with:
```js
const demandCount = (outOfStockData?.products ?? []).filter((p) => {
  const variantDemand = (p.variants ?? []).some((v) => (v.demandCount ?? 0) > 0 && v.inStock === false);
  return (p.demandCount ?? 0) > 0 || variantDemand;
}).length;
```

- [ ] **Step 3: Commit**

```
git add frontend/src/pages/admin/DashboardPage.jsx
git commit -m "fix: dashboard demand count now includes products with OOS variants"
```

---

## Task 12: Update Store ProductDetailPage

**Files:**
- Modify: `frontend/src/pages/store/ProductDetailPage.jsx`

- [ ] **Step 1: Add `useRegisterVariantDemand` to the imports**

Find:
```js
import { useProduct, useRegisterDemand } from '@/features/products/hooks';
```
Replace with:
```js
import { useProduct, useRegisterDemand, useRegisterVariantDemand } from '@/features/products/hooks';
```

- [ ] **Step 2: Add the new hook instance inside the component**

Find inside `ProductDetailPage`:
```js
const registerDemand = useRegisterDemand();
```
Add below it:
```js
const registerVariantDemand = useRegisterVariantDemand();
```

- [ ] **Step 3: Update `hasDemanded` effect to be variant-aware**

Find:
```js
// Read localStorage demand state once product id is known
useEffect(() => {
  if (product?.id) {
    setHasDemanded(!!localStorage.getItem(`demanded_${product.id}`));
  }
}, [product?.id]);
```

Replace with:
```js
// Read localStorage demand state — scoped to variant when applicable
useEffect(() => {
  if (!product?.id) return;
  const pvariants = product.variants ?? [];
  if (pvariants.length > 0 && selectedVariant !== null) {
    const variantId = pvariants[selectedVariant]?.id;
    if (variantId) {
      setHasDemanded(!!localStorage.getItem(`demanded_${product.id}_${variantId}`));
      return;
    }
  }
  setHasDemanded(!!localStorage.getItem(`demanded_${product.id}`));
}, [product?.id, selectedVariant]);
```

- [ ] **Step 4: Update `handleDemand` to call the correct endpoint**

Find:
```js
const handleDemand = () => {
  if (hasDemanded || registerDemand.isPending) return;
  registerDemand.mutate(product.id, {
    onSuccess: () => {
      localStorage.setItem(`demanded_${product.id}`, '1');
      setHasDemanded(true);
    },
  });
};
```

Replace with:
```js
const handleDemand = () => {
  if (hasDemanded || registerDemand.isPending || registerVariantDemand.isPending) return;
  if (hasVariants && selectedVariant !== null && variants[selectedVariant]?.id) {
    const variantId = variants[selectedVariant].id;
    registerVariantDemand.mutate({ productId: product.id, variantId }, {
      onSuccess: () => {
        localStorage.setItem(`demanded_${product.id}_${variantId}`, '1');
        setHasDemanded(true);
      },
    });
  } else {
    registerDemand.mutate(product.id, {
      onSuccess: () => {
        localStorage.setItem(`demanded_${product.id}`, '1');
        setHasDemanded(true);
      },
    });
  }
};
```

- [ ] **Step 5: Add `isCurrentlyAvailable` derived value**

After the existing derived values block (after `const hasMultiple = ...`), add:

```js
const isCurrentlyAvailable = !hasVariants
  ? product.inStock
  : product.inStock && (activeVariant !== null ? activeVariant.inStock !== false : true);
```

Where `activeVariant` is defined as:
```js
const activeVariant = hasVariants && selectedVariant !== null ? variants[selectedVariant] : null;
```

Note: `activeVariant` may already exist or need to be added. Check if it's defined in the file. If not, add it after `const hasMultiple`:
```js
const activeVariant = hasVariants && selectedVariant !== null ? variants[selectedVariant] : null;
```

- [ ] **Step 6: Update the CTA section to use `isCurrentlyAvailable`**

Find:
```jsx
{product.inStock ? (
```

Replace with:
```jsx
{isCurrentlyAvailable ? (
```

Also update the `disabled` check on the demand button (the `isPending` check):

Find:
```jsx
disabled={hasDemanded || registerDemand.isPending}
```
Replace with:
```jsx
disabled={hasDemanded || registerDemand.isPending || registerVariantDemand.isPending}
```

- [ ] **Step 7: Update the Status detail row to reflect variant stock**

Find:
```jsx
<DetailRow
  label="Status"
  value={
    <span className={product.inStock ? 'text-green-700' : 'text-muted-foreground/50'}>
      {product.inStock ? 'In Stock' : 'Out of Stock'}
    </span>
  }
/>
```

Replace with:
```jsx
<DetailRow
  label="Status"
  value={
    <span className={isCurrentlyAvailable ? 'text-green-700' : 'text-muted-foreground/50'}>
      {isCurrentlyAvailable ? 'In Stock' : 'Out of Stock'}
    </span>
  }
/>
```

- [ ] **Step 8: Update variant pills to show OOS indicator**

Find the variant pill button (inside the `variants.map((v, i) => ...` block):
```jsx
<button
  key={i}
  onClick={() => selectVariant(i)}
  className={cn(
    'relative flex-shrink-0 h-9 px-4 border text-xs font-light whitespace-nowrap overflow-hidden transition-colors duration-200',
    selectedVariant === i
      ? 'border-foreground text-foreground'
      : 'border-border text-muted-foreground hover:border-foreground/50 hover:text-foreground'
  )}
>
  {selectedVariant === i && (
    <motion.span
      layoutId="variant-active-bg"
      className="absolute inset-0 bg-muted/30"
      transition={{ type: 'spring', stiffness: 350, damping: 32 }}
    />
  )}
  <span className="relative z-10">{v.color}</span>
</button>
```

Replace with:
```jsx
<button
  key={i}
  onClick={() => selectVariant(i)}
  className={cn(
    'relative flex-shrink-0 h-9 px-4 border text-xs font-light whitespace-nowrap overflow-hidden transition-colors duration-200',
    selectedVariant === i
      ? 'border-foreground text-foreground'
      : 'border-border text-muted-foreground hover:border-foreground/50 hover:text-foreground',
    v.inStock === false && 'opacity-50'
  )}
>
  {selectedVariant === i && (
    <motion.span
      layoutId="variant-active-bg"
      className="absolute inset-0 bg-muted/30"
      transition={{ type: 'spring', stiffness: 350, damping: 32 }}
    />
  )}
  <span className={cn('relative z-10', v.inStock === false && 'line-through decoration-muted-foreground/60')}>
    {v.color}
  </span>
  {v.inStock === false && (
    <span className="relative z-10 ml-1.5 text-[9px] tracking-wider uppercase text-muted-foreground/50">
      sold out
    </span>
  )}
</button>
```

- [ ] **Step 9: Verify in browser**

Go to the store and open a product that has variants. Mark one variant as OOS via admin. Confirm:
1. The OOS variant pill shows strikethrough + "sold out"
2. Tapping the OOS variant shows "Out of Stock" in the Status row
3. The CTA switches to "I'm Interested" button for the OOS variant
4. Tapping "I'm Interested" registers demand on that specific variant (check Network tab)
5. Tapping "I'm Interested" on a DIFFERENT OOS variant registers demand on that variant (different localStorage key)
6. Switching to an in-stock variant shows the WhatsApp button

- [ ] **Step 10: Commit**

```
git add frontend/src/pages/store/ProductDetailPage.jsx
git commit -m "feat: product detail page — variant-aware CTA, status, demand, and OOS pill indicator"
```

---

## Task 13: Update Store ProductCard

**Files:**
- Modify: `frontend/src/components/store/ProductCard.jsx`

- [ ] **Step 1: Add `getEffectivePrice` to the import**

Find:
```js
import { formatPrice } from '@/lib/utils';
```
Replace with:
```js
import { formatPrice, getEffectivePrice } from '@/lib/utils';
```

- [ ] **Step 2: Remove the now-redundant local `getProductThumbnail` function and use the shared one**

Find the local helper at the top of the file:
```js
const getProductThumbnail = (product) => {
  if (product.variants?.length > 0) {
    const defaultVariant = product.variants.find((v) => v.isDefault) ?? product.variants[0];
    return defaultVariant.images?.[0] ?? '';
  }
  return product.images?.[0] ?? '';
};
```
Delete it. Instead, add `getProductThumbnail` to the import from utils:
```js
import { formatPrice, getEffectivePrice, getProductThumbnail } from '@/lib/utils';
```

- [ ] **Step 3: Fix the price display**

Find:
```jsx
<p className="shrink-0 text-sm font-medium text-primary/80">
  {formatPrice(product.price)}
</p>
```
Replace with:
```jsx
<p className="shrink-0 text-sm font-medium text-primary/80">
  {formatPrice(getEffectivePrice(product))}
</p>
```

- [ ] **Step 4: Fix the "Stock Out" badge logic**

Find:
```jsx
{!product.inStock && (
  <div className="absolute bottom-2.5 left-2.5">
    <span className="bg-background/80 text-muted-foreground text-[9px] uppercase font-medium px-2 py-1 leading-none">
      Stock Out
    </span>
  </div>
)}
```
Replace with:
```jsx
{(!product.inStock ||
  (product.variants?.length > 0 &&
    product.variants.every((v) => v.inStock === false))) && (
  <div className="absolute bottom-2.5 left-2.5">
    <span className="bg-background/80 text-muted-foreground text-[9px] uppercase font-medium px-2 py-1 leading-none">
      Stock Out
    </span>
  </div>
)}
```

- [ ] **Step 5: Commit**

```
git add frontend/src/components/store/ProductCard.jsx
git commit -m "fix: product card — correct price and stock badge for variant products"
```

---

## Task 14: Fix Catalog Sort by Price

**Files:**
- Modify: `frontend/src/pages/store/CatalogPage.jsx`

- [ ] **Step 1: Add `getEffectivePrice` to the import**

Find:
```js
import { cn } from '@/lib/utils';
```
Replace with:
```js
import { cn, getEffectivePrice } from '@/lib/utils';
```

- [ ] **Step 2: Fix sort-by-price to use effective price**

Find:
```js
if (sort === 'price_asc') {
  sorted = sorted.sort((a, b) => a.price - b.price);
} else if (sort === 'price_desc') {
  sorted = sorted.sort((a, b) => b.price - a.price);
```
Replace with:
```js
if (sort === 'price_asc') {
  sorted = sorted.sort((a, b) => getEffectivePrice(a) - getEffectivePrice(b));
} else if (sort === 'price_desc') {
  sorted = sorted.sort((a, b) => getEffectivePrice(b) - getEffectivePrice(a));
```

- [ ] **Step 3: Commit**

```
git add frontend/src/pages/store/CatalogPage.jsx
git commit -m "fix: catalog price sort now uses effective variant price"
```

---

## Self-Review

### Spec Coverage Check

| Spec requirement | Task |
|-----------------|------|
| Add `inStock` + `demandCount` to variant schema | Task 1 |
| Expose variant `id` via toJSON | Task 1 |
| Fix `images: min(1)` backend validator bug | Task 2 |
| Add `inStock`/`demandCount` to variant validator | Task 2 |
| `toggleVariantStock` service + MongoDB `$set` | Task 3 |
| `registerVariantDemand` service + MongoDB `$inc` | Task 3 |
| `anyOutOfStock` query param in `listProducts` | Task 3 |
| Two new controllers | Task 4 |
| Two new routes | Task 5 |
| `getProductThumbnail` + `getEffectivePrice` helpers | Task 6 |
| New API functions | Task 7 |
| New hooks | Task 7 |
| VariantModal `inStock` toggle | Task 8 |
| Variant list stock badges | Task 8 |
| Admin list thumbnail fix | Task 9 |
| Admin list price fix | Task 9 |
| Admin list variant stock hint `X/Y` | Task 9 |
| RestockPage variant-aware query + display | Task 10 |
| Per-variant Restock buttons | Task 10 |
| Dashboard demand count includes variants | Task 11 |
| ProductDetail variant-aware CTA | Task 12 |
| ProductDetail variant-aware status row | Task 12 |
| ProductDetail variant-scoped demand + localStorage | Task 12 |
| ProductDetail OOS variant pills | Task 12 |
| ProductCard price fix | Task 13 |
| ProductCard OOS badge fix | Task 13 |
| CatalogPage sort fix | Task 14 |

All 16 bugs/gaps from the spec are covered. ✓

### Type/Name Consistency Check

- `variant.id` — set in Task 1 (toJSON), used in Tasks 10, 12. ✓
- `getProductThumbnail` — defined in Task 6, used in Tasks 9, 10, 13. ✓
- `getEffectivePrice` — defined in Task 6, used in Tasks 9, 13, 14. ✓
- `useToggleVariantStock` — defined in Task 7, used in Task 10. ✓
- `useRegisterVariantDemand` — defined in Task 7, used in Task 12. ✓
- `anyOutOfStock: true` — handled in Task 3 (service), Task 4 (controller), used in Tasks 10, 11. ✓
- `toggleVariantStockSchema` — defined in Task 2, imported in Task 5. ✓
- `activeVariant` — derived in Task 12 Step 5, used in Task 12 Steps 6-8. ✓
- `isCurrentlyAvailable` — derived in Task 12 Step 5, used in Task 12 Steps 6-8. ✓
