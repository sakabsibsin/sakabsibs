# Aurum Jewelry Store

A luxury minimal mobile-first e-commerce catalog website for an Instagram jewelry brand, featuring a product catalog, product detail pages with WhatsApp ordering, and a full admin dashboard.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080, served at `/api`)
- `pnpm --filter @workspace/jewelry-store run dev` — run the frontend (served at `/`)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, Tailwind CSS, wouter routing, shadcn/ui, Cormorant Garamond + Inter fonts
- API: Express 5
- DB: PostgreSQL + Drizzle ORM (tables: `products`, `categories`, `settings`)
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — OpenAPI contract (source of truth)
- `lib/db/src/schema/` — DB table schemas: products, categories, settings
- `artifacts/api-server/src/routes/` — Express routes (products, categories, settings, storage, health)
- `artifacts/jewelry-store/src/` — Frontend React app
  - `pages/home.tsx` — Homepage with hero + featured products + "View All Products" button
  - `pages/catalog.tsx` — Full product catalog with live category filters from API
  - `pages/product-detail.tsx` — Product detail + WhatsApp order button (₹ price, product code)
  - `pages/admin-dashboard.tsx` — Admin product management (product code column, ₹)
  - `pages/admin-product-form.tsx` — Add/edit product (category dropdown, image upload)
  - `pages/admin-categories.tsx` — Category CRUD (auto code prefix)
  - `pages/admin-settings.tsx` — WhatsApp number setting + message preview
  - `components/layout.tsx` — Store & Admin layouts (mobile hamburger menu for admin)
  - `components/product-card.tsx` — Reusable product card (₹ currency)
  - `components/image-upload.tsx` — Device image upload via presigned GCS URL

## Architecture decisions

- API-first: OpenAPI spec gates all code generation; never write raw fetch calls
- `lib/api-zod/src/index.ts` exports only from `./generated/api` (barrel removed to avoid name conflicts with Orval split mode)
- `orval.config.ts` uses `mode: "single"` for Zod output; `mode: "split"` for React Query client
- Product codes auto-generated on creation: 2-letter category prefix (from `categories.code_prefix`) + sequential number from 101 (e.g. BA101, CH101)
- Image upload: client requests presigned URL from `/api/storage/uploads/request-url`, PUTs file directly to GCS, stores full serving URL `/api/storage/objects/...` in product images array
- WhatsApp message format includes product name, code, ₹ price, and product URL; number fetched from settings table
- Categories stored in `categories` table; catalog filter tabs loaded from API (not hardcoded)

## Product

- **Storefront**: Homepage with immersive hero, featured products grid, "View All Products" button; Catalog with live category filters; Product detail with image gallery, product code, ₹ price, WhatsApp enquiry button
- **Admin**: Dashboard (stats + product table with code/₹/stock toggle); Add/edit product form (category dropdown, device image upload); Categories CRUD page; WhatsApp settings page

## User preferences

- Brand name: Aurum (Latin for gold)
- Currency: ₹ (Indian Rupee), formatted as `en-IN`
- WhatsApp number configurable via Admin → Settings
- Typography: Cormorant Garamond (headers) + Inter (body)
- Aesthetic: pure white background, black typography, subtle gray borders

## Gotchas

- Always re-run codegen after OpenAPI spec changes: `pnpm --filter @workspace/api-spec run codegen`
- The codegen script patches `lib/api-zod/src/index.ts` after orval runs
- DB `push` is interactive; for schema changes with data migration, use raw SQL via executeSql instead
- Seed data uses Unsplash image URLs; uploaded images stored as `/api/storage/objects/...`

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
- See the `object-storage` skill for storage/presigned URL patterns
