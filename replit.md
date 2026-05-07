# Aurum Jewelry Store

A luxury minimal mobile-first e-commerce catalog website for an Instagram jewelry brand, featuring a product catalog, product detail pages with WhatsApp ordering, and a full admin dashboard.

## Run & Operate

**Replit workflows (pnpm monorepo):**
- `artifacts/api-server: API Server` — Express+MongoDB server on port 8080 (`/api`)
- `artifacts/jewelry-store: web` — React+Vite frontend on port 23096 (`/`)

**Standalone MERN (npm workspaces):**
- `npm install && npm run dev` from root — starts both server and client via concurrently

**Seeding:**
- `cd server && node seed.js` — seeds MongoDB with 6 categories + 15 products + WhatsApp setting

**Required env:**
- `MONGODB_URI` — MongoDB Atlas connection string (set in `server/.env` or as env var)
- `DEFAULT_OBJECT_STORAGE_BUCKET_ID` — Replit object storage (for image uploads)

## Stack

- Root: npm workspaces (`server`, `client`), Node.js 24
- **Backend** (`server/`): Express 4, Mongoose 8, CommonJS, dotenv
- **Frontend** (`artifacts/jewelry-store/`): React + Vite, Tailwind CSS, wouter routing, shadcn/ui, TanStack Query, Cormorant Garamond + Inter fonts
- **DB**: MongoDB Atlas (Mongoose)
- No TypeScript on server; TypeScript on client

## Where things live

- `server/server.js` — Express entry point, mounts /api routes
- `server/config/db.js` — Mongoose connection (reads MONGODB_URI from env/dotenv)
- `server/.env` — Local secrets (MONGODB_URI, not committed)
- `server/models/` — Mongoose models: Product, Category, Setting
- `server/controllers/` — productController, categoryController, settingController, storageController, authController
- `server/routes/` — product, category, setting, storage, auth routes
- `server/seed.js` — MongoDB seed script
- `artifacts/jewelry-store/src/` — Frontend React app
  - `lib/api-hooks.ts` — Local React Query hooks replacing @workspace/api-client-react
  - `pages/home.tsx` — Homepage with hero + featured products
  - `pages/catalog.tsx` — Full product catalog with live category filters from API
  - `pages/product-detail.tsx` — Product detail + WhatsApp order button (₹ price, product code)
  - `pages/admin-dashboard.tsx` — Admin product management
  - `pages/admin-product-form.tsx` — Add/edit product (category dropdown, image upload)
  - `pages/admin-categories.tsx` — Category CRUD (auto code prefix)
  - `pages/admin-settings.tsx` — WhatsApp number setting + message preview
  - `components/layout.tsx` — Store & Admin layouts
  - `components/product-card.tsx` — Reusable product card (₹ currency)
  - `components/image-upload.tsx` — Device image upload via presigned GCS URL

## Architecture decisions

- All product/category IDs are MongoDB ObjectId strings (not numeric)
- Product codes auto-generated on creation: 2-letter category prefix + sequential from 101 (e.g. BA101)
- `artifacts/jewelry-store/src/lib/api-hooks.ts` is the single source of API types + React Query hooks
- Image upload: client requests presigned URL from `/api/storage/uploads/request-url`, PUTs to GCS, stores URL in images array
- WhatsApp message format includes product name, code, ₹ price, and product URL; number fetched from settings
- MONGODB_URI loaded via `dotenv` using `__dirname`-relative path so it works regardless of CWD
- pnpm-workspace.yaml includes `server` and `client` so pnpm manages their node_modules correctly

## Product

- **Storefront**: Homepage with immersive hero, featured products grid; Catalog with live category filters; Product detail with image gallery, product code, ₹ price, WhatsApp enquiry button
- **Admin**: Dashboard (stats + product table with code/₹/stock toggle); Add/edit product form; Categories CRUD; WhatsApp settings page; Login with password (`aurum2024`)

## User preferences

- Brand name: Aurum (Latin for gold)
- Currency: ₹ (Indian Rupee), formatted as `en-IN`
- WhatsApp number configurable via Admin → Settings
- Typography: Cormorant Garamond (headers) + Inter (body)
- Aesthetic: pure white background, black typography, subtle gray borders

## Gotchas

- `server/.env` must contain `MONGODB_URI` for local dev; the path is loaded with `require('path').join(__dirname, '.env')`
- After API changes, update `artifacts/jewelry-store/src/lib/api-hooks.ts` (no codegen needed — it's handwritten)
- DB IDs are strings (MongoDB ObjectId); never cast to Number
- `client/` directory mirrors the jewelry-store frontend but is the standalone npm workspace version
- `artifacts/jewelry-store` is what Replit workflows serve (the pnpm workspace version)
