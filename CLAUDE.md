# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Project Is

A webhook testing/debugging tool (similar to webhook.site) built with Next.js 14 App Router, TypeScript, Tailwind CSS, and PostgreSQL via Prisma. Users create webhook listeners with unique URLs, send requests to those URLs, and inspect the captured requests through a dashboard.

## Commands

- `npm run dev` — start dev server
- `npm run build` — production build
- `npm run lint` — run Next.js linter
- `npx tsc --noEmit` — type check without emitting
- `npm run db:generate` — regenerate Prisma client after schema changes
- `npm run db:migrate` — run Prisma migrations
- `npm run db:studio` — open Prisma Studio GUI

No test framework is configured.

## Architecture

### Auth Model
Two auth mechanisms enforced in `middleware.ts`:
- **Session (UI)**: JWT in httpOnly cookie (`webhook-session`), 7-day expiry, validated for `/dashboard/*` routes
- **API Key (programmatic)**: `x-api-key` header with `wh_` prefix, validated for `/api/*` routes (except auth/webhook)

Single admin password set via `ADMIN_PASSWORD` env var — no user accounts.

### Dashboard Layout
The dashboard uses a **single-page sidebar layout** (`DashboardShell.tsx`):
- Left sidebar (`ListenerSidebar.tsx`): scrollable listener list with active highlight
- Right panel (`ListenerDetailPanel.tsx`): selected listener's webhook URL, API key, and request list
- Deep links supported via `/dashboard?listener=<id>` query param
- `/dashboard/[listenerId]` redirects to the query param version

### Data Fetching Pattern
All dashboard data uses client-side polling via `hooks/usePolling.ts`:
- Listeners poll every 5s in `DashboardShell`
- Requests poll every 3s in `ListenerDetailPanel`
- Polling auto-pauses when the browser tab is hidden (visibility API)
- Components trigger `refetch()` after mutations

React `key` prop on `ListenerDetailPanel` forces clean remount (and polling restart) when switching listeners.

### Webhook Capture
`/api/webhook/[listenerId]` accepts any HTTP method and stores the full request (headers, body, query params, IP, user agent). Background cleanup via `cleanupOldRequests()` enforces `MAX_REQUESTS_PER_LISTENER` (default 1000).

### Shared Types
`lib/types.ts` defines `Listener` and `WebhookRequest` interfaces used across dashboard components. Always import from here rather than defining inline.

### Styling
- Tailwind CSS with HSL-based CSS custom properties for theming (defined in `app/globals.css`)
- `cn()` utility from `lib/utils.ts` (clsx + tailwind-merge) for conditional class composition
- UI primitives in `components/ui/` use `class-variance-authority` for variants (button, card, input, badge)
- Light/dark mode via `.dark` class on root element

### Environment Variables
Required: `POSTGRES_PRISMA_URL`, `ADMIN_PASSWORD`, `SESSION_SECRET`
Optional: `NEXT_PUBLIC_APP_URL`, `RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX_REQUESTS`, `MAX_REQUESTS_PER_LISTENER`

See `.env.example` for the full list.

## Key Conventions

- Path alias `@/*` maps to project root
- API routes return JSON; errors use `{ error: string }` shape
- Destructive actions (delete) use `window.confirm()` before proceeding
- `CopyButton` component handles clipboard copy with "Copied!" feedback — reuse it rather than reimplementing
- Rate limiting is in-memory (`lib/rate-limit.ts`), applied only to webhook ingestion routes
- Prisma client is a singleton via `lib/prisma.ts` (globalThis pattern for dev hot-reload)
