# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.

## Artifacts

- `artifacts/api-server` (Express): shared backend for the public site and admin dashboard. Routes at `/api/*`. Clerk middleware (`@clerk/express`) wired in `src/app.ts`; Clerk OAuth proxy mounted before body parsers.
- `artifacts/restaurant` (React + Vite): public Avenue Hospitality landing at `/`. Auto-rotating banners, 9 outlets, gallery, and a 3D flippable menu page. Falls back to local `src/assets/*` images when API content is missing.
- `artifacts/dashboard` (React + Vite): Clerk-protected admin at `/dashboard/`. CRUD for banners, outlets, menu items, gallery, and site info using shared OpenAPI-generated hooks. Uses `@workspace/object-storage-web` `ObjectUploader` for image uploads (button labeled "Upload Image").
- `artifacts/mockup-sandbox` (Vite): component design sandbox.

## Auth

- Clerk provider lives in `artifacts/dashboard/src/App.tsx`. Publishable key resolved at runtime via `publishableKeyFromHost` from `@clerk/react/internal`.
- Required env vars: `VITE_CLERK_PUBLISHABLE_KEY`, `CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, plus `SESSION_SECRET`.
- `setupClerkWhitelabelAuth` already wired so the OAuth proxy at `/api/__clerk` works in development.

## Conventions

- Restaurant pages use generated React Query hooks (`useListMenuItems`, `useGetOutletBySlug`, etc.) from `@workspace/api-client-react`. Never use `customFetch` directly in pages.
- Fallback data in `artifacts/restaurant/src/lib/assets.ts` is typed against the generated `Outlet` / `GalleryImage` types so it satisfies the same shape as API responses.
- Image URLs: `getImageUrl(path)` returns `/api/storage{path}` for API-uploaded assets and the imported asset URL for local fallbacks.
