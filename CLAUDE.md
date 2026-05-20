# CLAUDE.md — Sakab Sibs Project Reference

This file gives Claude full context on this project. Read it before making any changes.

---

## What This Project Is

**Sakab Sibs** is a social commerce storefront for an Instagram jewelry brand (`@sakab.sibs`).

**Core business model**: Customers browse jewelry, tap "Enquire via WhatsApp", and a pre-filled WhatsApp message goes to the seller's phone. There is NO cart, NO checkout, NO payment processing. The only conversion action is a WhatsApp inquiry.

This is not a traditional ecommerce app. Never add cart/orders/payments unless the owner explicitly requests it.

---

## Tech Stack

| Layer | Choice | Notes |
|-------|--------|-------|
| Frontend | React 19 + Vite | JSX only — no TypeScript |
| Routing | React Router v6 | BrowserRouter, Outlet pattern |
| Styling | Tailwind CSS v3 | NOT v4 — different config |
| Animations | Framer Motion | page transitions, stagger, layoutId, AnimatePresence |
| Data fetching | TanStack React Query v5 | all server state |
| Forms | React Hook Form + Zod | admin forms only |
| Toasts | Sonner | both admin and store |
| Backend | Express.js + ESM JS | `"type": "module"`, NOT TypeScript |
| Database | MongoDB Atlas + Mongoose | |
| Auth | JWT in localStorage | sent via `Authorization: Bearer <token>` header |
| Images | Cloudinary | server-proxied upload — secret never reaches browser |
| Icons | Lucide React | |

---

## Running the Project

```bash
# Both together (from repo root)
npm run dev

# Separately
npm run dev:backend    # Express on :8080
npm run dev:frontend   # Vite on :5173
```

The root `package.json` uses npm workspaces: `["frontend", "backend"]`.

---

## Environment Variables

### backend/.env (never commit)
```
MONGODB_URI=<direct shard connection — NOT mongodb+srv, Windows DNS SRV bug>
JWT_SECRET=<min 32 chars>
CLOUDINARY_CLOUD_NAME=dvprhxg7x
CLOUDINARY_API_KEY=652375355879573
CLOUDINARY_API_SECRET=<secret>
FRONTEND_URL=http://localhost:5173
ADMIN_DEFAULT_PASSWORD=aurum2024
PORT=8080
```

**CRITICAL — MongoDB URI**: Must use direct shard hostnames, not `mongodb+srv://`. Windows Node.js has a DNS SRV bug that causes `querySrv ECONNREFUSED`. The URI format is:
```
mongodb://user:pass@shard-00-00.xxx.mongodb.net:27017,shard-00-01...,shard-00-02.../?replicaSet=atlas-xxx&authSource=admin&tls=true&retryWrites=true&w=majority
```

### frontend/.env (never commit)
```
VITE_API_URL=http://localhost:8080/api
```

---

## Project Structure

```
sakabsibs/
├── backend/src/
│   ├── config/          env.js (Zod-style validation), database.js, cloudinary.js
│   ├── models/          Product.js, Category.js, Setting.js
│   ├── validators/      product.validator.js, category.validator.js, auth.validator.js
│   ├── middleware/      auth.js, validate.js, errorHandler.js, rateLimit.js
│   ├── utils/           apiResponse.js, asyncHandler.js, codeGenerator.js
│   ├── services/        auth.service.js, product.service.js, category.service.js, upload.service.js
│   ├── controllers/     auth, product, category, upload, setting
│   ├── routes/          index.js + per-resource route files
│   └── app.js / server.js
│
└── frontend/src/
    ├── pages/
    │   ├── store/       HomePage, CatalogPage, ProductDetailPage, AboutPage, ContactPage
    │   └── admin/       LoginPage, DashboardPage, ProductsPage, CategoriesPage, SettingsPage, RestockPage
    ├── components/
    │   ├── layout/      Navbar.jsx (store), AdminSidebar.jsx, Footer.jsx
    │   ├── store/       ProductCard, ProductGrid, CategoryFilter, WhatsAppButton
    │   ├── admin/       ProductForm, ImageUpload, Breadcrumb
    │   └── ui/          Button, Switch, Badge, Skeleton, Table, AlertDialog, ...
    ├── features/
    │   ├── products/    api.js + hooks.js (includes useRegisterDemand)
    │   ├── categories/  api.js + hooks.js
    │   └── auth/        api.js + hooks.js
    ├── lib/             api-client.js (Axios), utils.js (cn + formatPrice)
    ├── constants/       config.js (STORE_NAME, PAGE_SIZE, MAX_IMAGES, API_URL)
    └── App.jsx          route definitions + layout + ScrollManager
```

---

## Key Architecture Decisions

### Auth
- JWT stored in **localStorage** (`sakabsibs_token`) — switched from httpOnly cookies because iOS Safari ITP blocks cross-origin cookies between frontend and backend on different domains
- `apiClient.js` attaches `Authorization: Bearer <token>` on every outgoing request via request interceptor
- `useAuthStatus()` hook calls `/auth/me` with `retry: false, throwOnError: false, enabled: !!getToken()` — skips network call entirely when not logged in; safe to call from store pages
- 401 interceptor redirects to `/admin/login` only when already on an admin page, and clears the token from localStorage
- Backend `requireAuth` middleware reads `req.headers.authorization` (Bearer scheme), NOT cookies

### Image Upload
- Browser → `POST /api/upload` (multipart/form-data) → multer buffers in memory → streams to Cloudinary
- `CLOUDINARY_API_SECRET` never reaches the browser
- Frontend uses `fetch()` with `headers: { Authorization: 'Bearer <token>' }` — NOT Axios (Axios requires manual boundary header removal for multipart)
- Returns `{ url }` (Cloudinary `secure_url`)
- **Local preview pattern**: ImageUpload stores `File` objects locally using `URL.createObjectURL()`. Actual Cloudinary upload is deferred until form submit via `uploadFiles()` helper in ProductForm. This avoids orphan uploads on cancel.

### Product Codes
- Auto-generated on product creation: prefix from category + incrementing number (e.g., `BRA101`, `CH102`)
- `codeGenerator.js` has retry loop (up to 3 attempts) for race condition on duplicate key (MongoDB error 11000)

### Variants System
- Products can have multiple variants: each has `color`, `price`, `images: [String]`, `isDefault: Boolean`
- Only one variant can be `isDefault: true` — enforced in admin form (setting a new default zeroes out others)
- On product detail page, default variant is auto-selected on load via `useEffect` on `product?.id`
- When a product has variants, the catalog thumbnail uses the default variant's first image
- When a product has variants, base product images are hidden; variant images are shown instead
- Variant pills use framer-motion `layoutId="variant-active-bg"` spring animation for the active indicator

### Restock Demand System
- Out-of-stock products show "I'm Interested" button instead of WhatsApp CTA
- Tapping it calls `POST /api/products/:id/demand` (public, no auth) — atomically increments `demandCount` via `$inc`
- Spam prevention: `localStorage.setItem(`demanded_${product.id}`, '1')` — same browser can only register once
- Admin RestockPage (`/admin/restock`) shows all products with demand, sorted by `demandCount` desc
- Dashboard has a quick-link rectangle card showing demand count; full listing on RestockPage
- `useRegisterDemand()` hook in `features/products/hooks.js`

### Social Commerce Pattern
- No cart, no checkout, no payment
- Only action: WhatsApp inquiry via modal
- WhatsApp button opens a **modal** that collects full customer details before sending
- Modal fields: Full Name, Phone, Alt. Phone (optional), House Name, Street, Landmark (optional), City, District, State, Pincode
- Body scroll is locked while modal is open (`document.body.style.overflow = 'hidden'`)
- Modal has open animation (slide up + fade in) and close animation (slide down + fade out)
- `onAnimationEnd` guard: `if (e.target !== e.currentTarget) return;` — prevents bubbling from child elements triggering close
- WhatsApp message format (pre-filled):
  ```
  Hello 👋
  I'm interested in this product.

  *Product:* [name]
  *Code:* [code]
  *Price:* [price]

  *Product Link:*
  [url — alone on its own line so WhatsApp makes it clickable]

  *Customer Details*
  Name: [fullName]
  Phone: [phone]
  Alt. Phone: [altPhone] (omitted if empty)

  Address:
  [house], [street]
  Near [landmark] (omitted if empty)
  [City] - [Pincode]
  [District], [State]

  Please share more details 😊
  ```
- Phone number comes from `settings.whatsapp_number` (admin → Settings page)
- Button always renders even if no number configured (falls back to `wa.me/?text=...`)

### Scroll Restoration
- `ScrollManager` component in `App.jsx` uses `useNavigationType()` from react-router
- PUSH navigation: scroll to top
- POP navigation (back button): restore saved `window.scrollY`
- Cleanup function saves scroll position at the exact navigation moment
- ProductDetailPage back button uses `navigate(-1)` (not `<Link>`) to trigger POP correctly

### Performance
- `compression()` middleware on all Express routes (gzip)
- `Cache-Control: public, max-age=300, stale-while-revalidate=60` on all public GET product/category/settings routes
- MongoDB connection pool: `maxPoolSize: 10, serverSelectionTimeoutMS: 5000, socketTimeoutMS: 45000`
- React Query global defaults: `staleTime: 5 * 60 * 1000, gcTime: 10 * 60 * 1000, refetchOnWindowFocus: false`
- Global API rate limit applied to all `/api` routes via `apiRateLimit` middleware

### Category Management
- Categories cannot be deleted if any products reference them — backend checks `Product.countDocuments({ category: category.name })` and returns a specific error with the count
- Categories support inline rename directly in the CategoriesPage table

---

## Product Model

```js
{
  name: String (required),
  description: String (required),
  price: Number (required),
  images: [String],          // Cloudinary URLs (base product images)
  material: String (optional, default ''),
  category: String (required),
  productCode: String (unique, auto-generated),
  inStock: Boolean (default true),
  featured: Boolean (default false),
  demandCount: Number (default 0),   // incremented when out-of-stock customers click "I'm Interested"
  variants: [{                        // optional — if present, overrides base product images
    color: String,
    price: Number,
    images: [String],
    isDefault: Boolean,
  }],
  // timestamps: createdAt, updatedAt
}
```

toJSON transform: adds `id`, removes `_id` and `__v`.

---

## API Routes

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| POST | `/api/auth/login` | No | Rate limited 10/15min |
| POST | `/api/auth/logout` | No | Clears cookie |
| GET | `/api/auth/me` | Yes | `{ authenticated: true }` |
| GET | `/api/products` | No | `{ products, total, hasMore }` — supports `?search=&category=&limit=&page=` |
| GET | `/api/products/featured` | No | Top 12 featured |
| GET | `/api/products/stats` | Yes | `{ total, inStock, outOfStock, featured }` |
| GET | `/api/products/:id` | No | |
| POST | `/api/products` | Yes | |
| PUT | `/api/products/:id` | Yes | |
| DELETE | `/api/products/:id` | Yes | |
| PATCH | `/api/products/:id/stock` | Yes | `{ inStock: boolean }` |
| POST | `/api/products/:id/demand` | No | Increments demandCount via `$inc` — public, no auth |
| GET | `/api/categories` | No | |
| POST | `/api/categories` | Yes | |
| PUT | `/api/categories/:id` | Yes | Rename category |
| DELETE | `/api/categories/:id` | Yes | Blocked if products reference this category |
| GET | `/api/settings` | No | Returns all settings as flat object |
| PUT | `/api/settings/:key` | Yes | |
| POST | `/api/upload` | Yes | multipart/form-data, 10MB max |
| GET | `/api/healthz` | No | |

---

## Design System

### Brand Identity
- Brand name: **Sakab Sibs** (display), `sakabsibs` (technical — localStorage key prefix, cookie name)
- Instagram: `@sakab.sibs`
- Palette: warm cream background × deep burgundy-brown — inspired by their IG aesthetic

### CSS Variables (HSL channels)
```css
--background:   34 42% 97%    /* warm cream */
--foreground:   10 48% 13%    /* deep warm brown */
--primary:       8 52% 20%    /* burgundy-brown (logo color) */
--secondary:    33 38% 92%    /* warm beige */
--muted:        33 30% 93%    /* light warm grey */
--border:       33 22% 86%    /* warm taupe */
```

### Typography
- Serif: Cormorant Garamond — product names, headings, display text
- Sans: Inter — body, labels, UI elements
- Price: sans-serif `font-bold` (NOT serif — ₹ rupee symbol is clearer in sans)
- Labels in metadata/tables: `text-[8px] sm:text-[9px] tracking-[0.4em+] uppercase font-medium text-foreground/20-25`

### Design Language
- Zero border-radius everywhere (sharp corners, no `rounded` classes unless intentional)
- Tailwind v3 — all classes work as expected
- No boxed sections with heavy borders — prefer spacing and hairlines
- Admin uses the same font/color system as the store

### Admin Layout
- Sticky navbar: `h-14` (56px), `sticky top-0 z-40`
- Admin content: `container mx-auto px-4 py-8`
- Table `thead` must use `sticky top-14 z-10` to dock below the navbar

---

## Animation System

### Philosophy
- Simple and smooth — no flashy effects
- Pure opacity fades preferred over translate+opacity combos on store pages
- Stagger reveals for information hierarchy (detail page info column)
- `layoutId` for pill/tab active indicators (CategoryFilter, variant selector)
- `AnimatePresence mode="wait"` for content swaps (price on variant change, gallery images)

### Tailwind Custom Animations (`tailwind.config.js`)
```js
keyframes: {
  'soft-in': {
    from: { opacity: '0', filter: 'blur(4px)' },
    to:   { opacity: '1', filter: 'blur(0px)' },
  },
},
animation: {
  'soft-in': 'soft-in 0.55s cubic-bezier(0.25, 0.1, 0.25, 1) both',
},
```

### Per-Component Patterns

**ProductCard** — `animate-soft-in` class with staggered `animationDelay: ${Math.min(index, 7) * 35}ms`. Image hover: warm glow via `group-hover:scale-[1.04] group-hover:brightness-105 group-hover:saturate-[1.12]`.

**CatalogPage** — page entry: `initial={{ opacity: 0, filter: 'blur(3px)' }} animate={{ opacity: 1, filter: 'blur(0px)' }}`. Result count re-animates on filter change via `key` prop.

**CategoryFilter** — active pill uses `layoutId="cat-active-bg"` spring animation. Active button has `relative overflow-hidden`; motion.span is absolute background; label sits `relative z-10`.

**ProductDetailPage** — page entry: `opacity: 0 → 1` (0.4s). Gallery crossfade: `AnimatePresence mode="wait"` keyed on `${selectedVariant}-${activeImgIndex}`, pure opacity 0.5s. Info column: `motion.div` with `staggerChildren: 0.08, delayChildren: 0.12` — each child (name, price, variants, description, details, CTA) fades in sequentially. Price uses nested `AnimatePresence mode="wait"` keyed on `activePrice` for cross-dissolve on variant change.

**Navbar** — reading progress bar: thin `1.5px` line at bottom of header tracking `scrollY / (documentHeight - windowHeight) * 100`.

**Footer** — columns use `whileInView` pure opacity with 0.12s stagger.

**HomePage** — pure opacity fades, no translate. Featured section and brand strip use `whileInView`.

---

## Store Pages

### Navbar (store)
Links: Home (`/`), Shop (`/products`), About (`/about`), Contact (`/contact`)
Shows "Admin" badge only when `useAuthStatus()` returns `{ authenticated: true }`.

### Admin Sidebar (top navbar style)
Links: Dashboard, Products (dropdown: All Products / Add Product), Categories, Settings, Restock
No Orders, no Customers (removed — not needed for social commerce model).

### Product Detail Page (`/products/:id`)
Layout order: back link → [image gallery | product info column]

Product info column order:
1. Product name (large serif, light)
2. Price (large, bold, sans-serif — cross-dissolves on variant switch)
3. Variant pills (if product has variants) — layoutId spring animation
4. Description (plain text, before details, no label)
5. Detail rows: MATERIAL / CATEGORY / CODE / STATUS (label-left, value-right, no dividers, compact `py-1.5`)
6. CTA: WhatsApp modal button (in stock) OR "I'm Interested" demand button (out of stock)

Back button uses `navigate(-1)` — triggers POP for scroll restoration.

### Admin Products Page (`/admin/products`)
- Search bar (filters on name, code, material)
- Category tabs (horizontal scroll, tab-underline style, no visible scrollbar)
- Table with sticky `thead` at `top-14`
- Columns: IMG | NAME (+ code + featured badge) | PRICE | STOCK | ACTIONS
- Count display: `filtered/total` in header
- `useCategories()` populates the tab chips

### Admin Dashboard Page (`/admin`)
- Stat strip: 4 cards (Total Products, In Stock, Out of Stock, Featured)
- Quick Actions: 4 cards (Add Product, Add Category, Settings, Restock)
- Restock rectangle card at bottom linking to `/admin/restock` with demand count

### Admin Restock Page (`/admin/restock`)
- Route: `/admin/restock`
- Stat strip: 3 numbers (Out of Stock total, Have Demand count, Total Demand Signals)
- Demand leaderboard: product photo (44px), name, category · code, demand count badge, Restock button (toggles stock)
- Below leaderboard: out-of-stock products with zero demand (faded styling)

### Admin Settings Page (`/admin/settings`)
- Sections: WhatsApp Number, Admin Password
- Store Identity and Store Phone sections were removed — do not add them back

---

## Coding Conventions

### Frontend
- All components are `.jsx` (JSX, no TypeScript)
- Named exports only (no default exports for components)
- React Query for all server state — never fetch directly in components
- `formatPrice(price)` from `@/lib/utils` for all price display (formats as ₹X,XXX)
- `cn()` from `@/lib/utils` for conditional classes (clsx + tailwind-merge)
- `useSettings()` from `@/features/auth/hooks` for store settings (whatsapp_number, etc.)
- Axios client at `@/lib/apiClient` — already attaches `Authorization: Bearer` header and has 401 interceptor

### Backend
- ESM modules (`import/export`) — `"type": "module"` in package.json
- `asyncHandler` wrapper on all controller functions — no try/catch in controllers
- `sendSuccess` / `sendError` from `apiResponse.js` for all responses
- Zod validators in `/validators/` — applied via `validate` middleware
- Auth middleware reads `Authorization: Bearer` header and attaches `req.admin`

---

## Things to Never Do

- **Never commit `.env` or `.env.local`** — they contain Cloudinary secrets and DB credentials
- **Never use `mongodb+srv://`** — Windows DNS SRV bug, use direct shard hostnames
- **Never add TypeScript** — the project is intentionally pure JavaScript
- **Never add cart/checkout/payment features** without explicit owner request
- **Never add `rounded` classes** without reason — brand uses zero border-radius
- **Never expose `CLOUDINARY_API_SECRET`** to the browser — upload must go through the backend
- **Never set `Content-Type` manually** on multipart uploads — browser sets it with boundary
- **Never put URL and label on same line** in WhatsApp message — URL must be alone on its own line to be clickable
- **Never use `mongodb+srv://`** on Windows development (DNS SRV lookup fails)
- **Never add Store Identity or Store Phone to admin Settings page** — these sections were intentionally removed
- **Never add `translate` to page fade animations** — store pages use pure opacity only
- **Never use `navigate('...')` with a string on back buttons** — use `navigate(-1)` to preserve scroll restoration

---

## Admin Password

Default: `aurum2024` (set via `ADMIN_DEFAULT_PASSWORD` env var, stored in Settings DB collection)
