# Per-Variant Stock Management — Design Spec
**Date:** 2026-05-14  
**Project:** Sakab Sibs  
**Status:** Approved

---

## Problem Statement

A product can have multiple color/style variants (e.g. Red, Blue, Black).  
When Red sells out, the admin has **only one stock toggle** — for the whole product.  
Turning the product off-stock hides Red, Blue, AND Black from the store.  
There is no way to mark only Red as out of stock.

This single missing capability cascades into 16 issues across the entire flow:
- Admin UI has no per-variant stock control anywhere (product list, edit form, restock page)
- Store shows wrong CTA (WhatsApp vs "I'm Interested") based on product-level stock only
- Demand signals are product-wide — admin can't tell which specific color customers want
- Product thumbnails, prices, and OOS badges are wrong for variant products

---

## Design Approach

**Approach B — Subdocument `_id`-based**

Each Mongoose subdocument in an array gets a stable `_id`. We expose it as `id` in the JSON response and use it as a key for variant-level stock and demand API endpoints. This is robust to variant reordering.

**Rule:** `product.inStock` is the global master switch. A variant is available only when BOTH `product.inStock === true` AND `variant.inStock !== false`.

---

## Changes By Layer

### 1. Data Model — `backend/src/models/Product.js`

Extract variant inline object into a named `variantSchema` so it can have its own `toJSON`.

Add two new fields to variant:
- `inStock: { type: Boolean, default: true }` — per-variant stock flag
- `demandCount: { type: Number, default: 0 }` — per-variant customer demand count

Add `toJSON` to `variantSchema`:
```js
variantSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    return ret;
  },
});
```

**Backward compat:** Existing documents in MongoDB have no `inStock`/`demandCount` on variants. All code must treat `variant.inStock !== false` (undefined → in stock) and `variant.demandCount ?? 0`.

---

### 2. Backend Validator — `backend/src/validators/product.validator.js`

**Fix B2 (critical bug):** `images` field currently requires `min(1)` even for variant products.  
Change to `z.array(z.string()).default([])` and add `superRefine`:
```js
.superRefine((data, ctx) => {
  if (!data.variants?.length && !data.images?.length) {
    ctx.addIssue({ path: ['images'], code: 'custom',
      message: 'At least one image is required when no variants are added' });
  }
});
```

Add to variant validator schema (fixes U5):
```js
inStock:     z.boolean().default(true),
demandCount: z.coerce.number().default(0),
```

Add new validator for variant stock toggle:
```js
export const toggleVariantStockSchema = z.object({ inStock: z.boolean() });
```

---

### 3. Backend Service — `backend/src/services/product.service.js`

Add two new service functions:

```js
// Toggle a single variant's stock
export const toggleVariantStock = (productId, variantId, inStock) =>
  Product.findOneAndUpdate(
    { _id: productId, 'variants._id': variantId },
    { $set: { 'variants.$.inStock': inStock } },
    { new: true }
  );

// Register demand on a specific variant
export const registerVariantDemand = (productId, variantId) =>
  Product.findOneAndUpdate(
    { _id: productId, 'variants._id': variantId },
    { $inc: { 'variants.$.demandCount': 1 } },
    { new: true }
  );
```

Update `listProducts` to support `anyOutOfStock` param (for restock page):
```js
// When anyOutOfStock=true, query products that have ANY oos component
if (anyOutOfStock) {
  query.$or = [{ inStock: false }, { 'variants.inStock': false }];
}
```

---

### 4. Backend Routes — `backend/src/routes/product.routes.js`

Add two new routes:
```
PATCH /:id/variants/:variantId/stock  → requireAuth → validate(toggleVariantStockSchema) → toggleVariantStockController
POST  /:id/variants/:variantId/demand → registerVariantDemandController
```

---

### 5. Backend Controller — `backend/src/controllers/product.controller.js`

Add two new controllers:
```js
export const toggleVariantStockController = asyncHandler(async (req, res) => {
  const product = await productService.toggleVariantStock(
    req.params.id, req.params.variantId, req.body.inStock
  );
  if (!product) return sendError(res, 'Product or variant not found', 404);
  sendSuccess(res, product);
});

export const registerVariantDemandController = asyncHandler(async (req, res) => {
  const product = await productService.registerVariantDemand(
    req.params.id, req.params.variantId
  );
  if (!product) return sendError(res, 'Product or variant not found', 404);
  const variant = product.variants.find(v => v._id.toString() === req.params.variantId);
  sendSuccess(res, { demandCount: variant?.demandCount ?? 0 });
});
```

---

### 6. Frontend API + Hooks — `frontend/src/features/products/`

**`api.js`** — add two new functions:
```js
export const toggleVariantStock = async (productId, variantId, inStock) => {
  const { data } = await apiClient.patch(`/products/${productId}/variants/${variantId}/stock`, { inStock });
  return data.data;
};

export const registerVariantDemand = async (productId, variantId) => {
  const { data } = await apiClient.post(`/products/${productId}/variants/${variantId}/demand`);
  return data.data;
};
```

**`hooks.js`** — add two new hooks:
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
    mutationFn: ({ productId, variantId }) => api.registerVariantDemand(productId, variantId),
  });
```

---

### 7. Admin: VariantModal (in `ProductForm.jsx`) — CORE FIX

Add `inStock` field to `variantSchema` Zod (frontend):
```js
inStock: z.boolean().default(true),
```

Add stock toggle to `VariantModal` UI:
```
┌──────────────────────────────────┐
│ Add / Edit Variant               │
│ Color Name  [_________________]  │
│ Price (₹)   [_________________]  │
│ Photos      [ Upload... ]        │
│                                  │
│ ○──  Set as default              │
│ ○──  In Stock         ← NEW      │
│                                  │
│ [Save Variant]  [Cancel]         │
└──────────────────────────────────┘
```
Default value for `inStock` in `EMPTY_DRAFT` is `true`.

Update variant list row in ProductForm to show stock badge next to each variant:
- `inStock: true` → small green dot + "In Stock"
- `inStock: false` → small red/muted dot + "Out of Stock"

---

### 8. Admin: ProductsPage

**Thumbnail fix (B1):** Replace `product.images[0]` with a shared `getProductThumbnail(product)` helper (same logic as store ProductCard — uses default variant's first image if variants exist).

**Price fix (U3):** Show effective price using `getEffectivePrice(product)` helper:
```js
const getEffectivePrice = (product) => {
  if (!product.variants?.length) return product.price;
  const def = product.variants.find(v => v.isDefault) ?? product.variants[0];
  return def?.price ?? product.price;
};
```

**Stock column (U2):** For variant products, keep the master switch but add a sub-label showing the per-variant count:
```
[toggle] 2 / 3 in stock   ← when a variant product
[toggle]                  ← when a no-variant product
```

---

### 9. Admin: RestockPage

**Query change:** Use `anyOutOfStock: true` instead of `{ inStock: false }`.

**Display for variant products** — expand the product card into sub-rows for each OOS variant:
```
┌──────────────────────────────────────────────────────────────┐
│ [thumb]  Gold Bangle Set                                      │
│          Bangles · BAN101                                     │
├───────────────────────────────────────────────────────────────┤
│     ● Gold        5 requests  [Restock]                      │
│     ● Rose Gold   2 requests  [Restock]                      │
└───────────────────────────────────────────────────────────────┘
```
Only show OOS variants in sub-rows. `[Restock]` calls `PATCH .../variants/:variantId/stock`.

**For no-variant products:** unchanged — single product-level Restock button.

**Stat strip:** "Out of Stock" counts OOS items (each OOS variant + each OOS no-variant product = 1 item). "Total Signals" sums all demand across product and variant levels.

---

### 10. Admin: DashboardPage

Change the demand-count query from `{ inStock: false }` to `{ anyOutOfStock: true }` to include products with OOS variants.

---

### 11. Store: ProductDetailPage

**Availability helper:**
```js
const isCurrentlyAvailable = !hasVariants
  ? product.inStock
  : product.inStock && (variants[selectedVariant]?.inStock !== false);
```

**CTA:** Replace `product.inStock ? <WhatsApp> : <I'm Interested>` with `isCurrentlyAvailable ? <WhatsApp> : <I'm Interested>`.

**Status row:** Show selected variant's effective stock, not product-level.

**Demand:** When has variants, call `useRegisterVariantDemand` with `variantId`. localStorage key: `demanded_${product.id}_${variantId}` (so each variant is tracked independently — fixes B6).

**Variant pills:** Add OOS indicator — strikethrough color name + "sold out" sub-label on OOS variants. Still tappable (so user can register demand).

---

### 12. Store: ProductCard

**Price (B3):** Use `getEffectivePrice(product)` helper (same as admin). Show "from ₹X" when a variant product has differing prices.

**Stock Out badge (U1):** Replace `!product.inStock` with:
```js
const isOOS = !product.inStock ||
  (product.variants?.length > 0 &&
   product.variants.every(v => v.inStock === false));
```

---

### 13. Store: CatalogPage

**Sort by price (B4):** Sort using `getEffectivePrice(product)` instead of `product.price`.

---

## Shared Helpers

Two helper functions used in multiple places — define in `frontend/src/lib/utils.js`:

```js
// Returns the thumbnail URL for a product (respects variants)
export const getProductThumbnail = (product) => {
  if (product.variants?.length > 0) {
    const def = product.variants.find(v => v.isDefault) ?? product.variants[0];
    return def?.images?.[0] ?? '';
  }
  return product.images?.[0] ?? '';
};

// Returns the display price for a product (uses default variant price if applicable)
export const getEffectivePrice = (product) => {
  if (!product.variants?.length) return product.price;
  const def = product.variants.find(v => v.isDefault) ?? product.variants[0];
  return def?.price ?? product.price;
};
```

---

## Issue Coverage

| # | Issue | Fix in |
|---|-------|--------|
| B1 | Admin list thumbnail wrong | §8 |
| B2 | Backend validator rejects variant products | §2 |
| B3 | ProductCard shows wrong price | §12 |
| B4 | Sort by price broken for variants | §13 |
| B5 | ProductDetail CTA ignores variant stock | §11 |
| B6 | hasDemanded key is product-wide | §11 |
| F1 | No `inStock` on variant model | §1 |
| F2 | No `demandCount` on variant model | §1 |
| F3 | No variant stock API endpoint | §4 |
| F4 | No variant demand API endpoint | §4 |
| F5 | VariantModal has no stock toggle | §7 |
| F6 | Variant rows don't show stock state | §7 |
| F7 | RestockPage misses OOS variants | §9 |
| F8 | Restock button is product-wide | §9 |
| F9 | Variant pills have no OOS indicator | §11 |
| F10 | Status row ignores variant stock | §11 |
| U1 | ProductCard OOS badge wrong | §12 |
| U2 | Admin list stock switch misleading | §8 |
| U3 | Admin list price wrong | §8 |
| U4 | Dashboard demand count misses variants | §10 |
| U5 | Backend strips inStock/demandCount | §2 |
| U6 | Variant `_id` not exposed as `id` | §1 |

---

## Files Changed

| File | Type |
|------|------|
| `backend/src/models/Product.js` | Schema |
| `backend/src/validators/product.validator.js` | Validator |
| `backend/src/services/product.service.js` | Service |
| `backend/src/controllers/product.controller.js` | Controller |
| `backend/src/routes/product.routes.js` | Routes |
| `frontend/src/features/products/api.js` | API |
| `frontend/src/features/products/hooks.js` | Hooks |
| `frontend/src/components/admin/ProductForm.jsx` | Admin UI |
| `frontend/src/pages/admin/ProductsPage.jsx` | Admin UI |
| `frontend/src/pages/admin/RestockPage.jsx` | Admin UI |
| `frontend/src/pages/admin/DashboardPage.jsx` | Admin UI |
| `frontend/src/pages/store/ProductDetailPage.jsx` | Store UI |
| `frontend/src/components/store/ProductCard.jsx` | Store UI |
| `frontend/src/pages/store/CatalogPage.jsx` | Store UI |
| `frontend/src/lib/utils.js` | Shared |
