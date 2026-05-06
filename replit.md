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
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — OpenAPI contract (source of truth)
- `lib/db/src/schema/products.ts` — Products table schema
- `artifacts/api-server/src/routes/products.ts` — Products CRUD routes
- `artifacts/jewelry-store/src/` — Frontend React app
  - `pages/home.tsx` — Homepage with hero + featured products
  - `pages/catalog.tsx` — Full product catalog with category filters
  - `pages/product-detail.tsx` — Product detail + WhatsApp order button
  - `pages/admin-dashboard.tsx` — Admin product management
  - `pages/admin-product-form.tsx` — Add/edit product form
  - `components/layout.tsx` — Store & Admin layouts
  - `components/product-card.tsx` — Reusable product card

## Architecture decisions

- API-first: OpenAPI spec gates all code generation; never write raw fetch calls
- `lib/api-zod/src/index.ts` exports only from `./generated/api` (types barrel removed to avoid name conflicts with Orval split mode)
- `orval.config.ts` uses `mode: "single"` for Zod output to avoid barrel file conflicts; `mode: "split"` for React Query client
- WhatsApp ordering: pre-fills a WhatsApp message with the product name using `wa.me` URL
- Fake bracelet seed data loaded into DB on first deploy (8 products across 5 categories)

## Product

- **Storefront**: Homepage with immersive hero, featured products grid; Catalog page with underline-style category filters; Product detail page with image gallery and WhatsApp inquiry button
- **Admin**: Dashboard with stats (total, in-stock, out-of-stock, featured counts); product table with inline stock toggle; Add/edit product forms

## User preferences

- Brand name: Aurum (Latin for gold)
- WhatsApp number placeholder: +1234567890
- Typography: Cormorant Garamond (headers) + Inter (body)
- Aesthetic: pure white background, black typography, subtle gray borders

## Gotchas

- Always re-run codegen after OpenAPI spec changes: `pnpm --filter @workspace/api-spec run codegen`
- The codegen script patches `lib/api-zod/src/index.ts` after orval runs (orval would otherwise regenerate it with wrong exports)
- Seed data uses Unsplash image URLs — may require CORS headers in production

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
