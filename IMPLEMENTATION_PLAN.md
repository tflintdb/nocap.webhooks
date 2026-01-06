# Webhook.site Clone - Implementation Plan

## Overview
Build a webhook testing application similar to webhook.site that allows creating multiple webhook listeners, viewing incoming requests in real-time, and accessing webhook data via API for e2e testing.

## Tech Stack
- **Framework**: Next.js 14+ (App Router)
- **Database**: Vercel Postgres with Prisma ORM
- **Authentication**: Simple password (UI) + API keys (programmatic)
- **Real-time**: Client-side polling (3-5 second intervals)
- **Styling**: Tailwind CSS + shadcn/ui components
- **Deployment**: Vercel

## Key Features
1. Create/delete multiple webhook listeners (each gets unique URL + API key)
2. Dashboard UI showing all listeners and their webhook requests
3. Real-time updates via polling
4. API endpoints to retrieve webhook data for e2e tests
5. Password-protected UI access
6. Rate limiting on webhook endpoints
7. Auto-cleanup of old requests (keep last 1000 per listener)

## Database Schema

### WebhookListener
- `id` (cuid) - Primary key, also used in webhook URL
- `name` (string, optional) - Friendly name
- `apiKey` (string, unique) - For API authentication
- `createdAt`, `updatedAt`
- Relationship: has many WebhookRequest

### WebhookRequest
- `id` (cuid) - Primary key
- `listenerId` (foreign key) - References WebhookListener
- `method` (string) - HTTP method (GET, POST, etc.)
- `path` (string) - Full path with query params
- `headers` (JSON) - All request headers
- `body` (string) - Request body
- `queryParams` (JSON) - Parsed query parameters
- `ipAddress` (string) - Client IP
- `userAgent` (string) - Client user agent
- `receivedAt` (datetime) - Timestamp
- Indexed on: [listenerId, receivedAt DESC]

## Architecture

### Authentication Strategy
1. **UI Access**: Session-based (JWT cookie)
   - Login with shared password (env var: `ADMIN_PASSWORD`)
   - Middleware protects `/dashboard` routes

2. **API Access**: API key-based
   - Each listener has unique API key
   - Include `X-API-Key` header for programmatic access
   - Validates against listener's `apiKey` field

### API Endpoints

#### Webhook Reception (Public)
- `ALL /api/webhook/[listenerId]` - Receives webhooks (all HTTP methods)
  - No auth required
  - CORS enabled (*)
  - Rate limited per IP
  - Stores request in DB
  - Returns 200 OK

#### Listener Management (Protected)
- `GET /api/listeners` - List all listeners
- `POST /api/listeners` - Create new listener (returns apiKey)
- `GET /api/listeners/[id]` - Get listener details
- `DELETE /api/listeners/[id]` - Delete listener
- `GET /api/listeners/[id]/requests?limit=50&offset=0` - Get requests

#### Authentication
- `POST /api/auth/login` - Login (sets session cookie)
- `POST /api/auth/logout` - Logout (clears cookie)

### Real-time Updates
- Client components use `usePolling` hook
- Fetch data every 3 seconds when component visible
- Pause polling when tab inactive (Page Visibility API)

## Implementation Steps

### Phase 1: Project Setup
1. Initialize Next.js 14 project with TypeScript, Tailwind, App Router
2. Install dependencies: Prisma, jose (JWT), nanoid, zod, shadcn/ui
3. Setup Prisma with Vercel Postgres
4. Create database schema in `prisma/schema.prisma`
5. Run migrations and generate Prisma client
6. Configure environment variables

### Phase 2: Core Backend
7. Create `src/lib/prisma.ts` - Prisma singleton client
8. Create `src/lib/auth.ts` - Session validation, API key utilities
9. Create `src/lib/rate-limit.ts` - In-memory rate limiter
10. Create `src/middleware.ts` - Route protection + rate limiting

### Phase 3: API Routes (Critical Path)
11. `src/app/api/auth/login/route.ts` - Login endpoint
12. `src/app/api/auth/logout/route.ts` - Logout endpoint
13. `src/app/api/webhook/[listenerId]/route.ts` - **CRITICAL** Webhook receiver
    - Handle all HTTP methods
    - Store request in DB with full metadata
    - Trigger cleanup if needed
    - Return 200 OK with CORS headers
14. `src/app/api/listeners/route.ts` - List/Create listeners
15. `src/app/api/listeners/[id]/route.ts` - Get/Delete listener
16. `src/app/api/listeners/[id]/requests/route.ts` - Get requests with pagination

### Phase 4: Frontend Core
17. Setup shadcn/ui: button, card, input, dialog, badge, toast
18. `src/app/login/page.tsx` - Login page
19. `src/components/auth/LoginForm.tsx` - Login form component
20. `src/app/layout.tsx` - Root layout with header
21. `src/app/dashboard/page.tsx` - Main dashboard (Server Component)

### Phase 5: Dashboard Components
22. `src/hooks/usePolling.ts` - Reusable polling hook
23. `src/components/dashboard/ListenerList.tsx` - List listeners with polling
24. `src/components/dashboard/ListenerCard.tsx` - Individual listener card
25. `src/components/dashboard/CreateListenerDialog.tsx` - Create listener modal
26. `src/components/dashboard/CopyButton.tsx` - Copy webhook URL button

### Phase 6: Request Viewer
27. `src/app/dashboard/[listenerId]/page.tsx` - Listener detail page
28. `src/components/dashboard/RequestList.tsx` - List requests with polling
29. `src/components/dashboard/RequestDetails.tsx` - Full request viewer
    - Tabbed UI: Headers | Body | Query Params | Metadata
    - JSON syntax highlighting

### Phase 7: Cleanup & Polish
30. `src/app/api/cron/cleanup/route.ts` - Cleanup old requests (optional cron)
31. `vercel.json` - Deployment config with optional cron job
32. Add error boundaries and loading states
33. Test all flows manually

### Phase 8: Deployment
34. Create Vercel project
35. Setup Vercel Postgres database
36. Configure environment variables
37. Deploy and run migrations
38. Test production webhooks

## Critical Files (in order of creation)

1. `prisma/schema.prisma` - Database schema (MUST CREATE FIRST)
2. `src/lib/prisma.ts` - DB client (needed by all APIs)
3. `src/lib/auth.ts` - Auth utilities (security foundation)
4. `src/app/api/webhook/[listenerId]/route.ts` - Webhook receiver (core feature)
5. `src/middleware.ts` - Route protection (security layer)
6. `src/app/api/listeners/route.ts` - Listener CRUD (needed for UI)
7. `src/app/dashboard/page.tsx` - Main UI entry point
8. `src/hooks/usePolling.ts` - Real-time updates (UX feature)

## Environment Variables

```env
# Database (Vercel Postgres)
POSTGRES_PRISMA_URL="postgres://..."
POSTGRES_URL_NON_POOLING="postgres://..."

# Authentication
ADMIN_PASSWORD="your-secure-password"
SESSION_SECRET="32-char-random-string"

# Application
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Optional
RATE_LIMIT_WINDOW_MS="60000"
RATE_LIMIT_MAX_REQUESTS="100"
MAX_REQUESTS_PER_LISTENER="1000"
```

## Key Technical Decisions

1. **Polling vs WebSockets**: Chose polling for simplicity and Vercel compatibility
2. **Single Password**: Simpler than full user management, suitable for personal/team use
3. **In-memory Rate Limiting**: Fast and simple, acceptable for MVP (can upgrade to Redis later)
4. **API Keys per Listener**: Allows granular access control for e2e tests
5. **Auto-cleanup**: Keep last 1000 requests per listener to manage storage costs
6. **CORS Wide Open**: Webhook endpoints accept requests from any origin (by design)

## Security Measures

- HTTP-only session cookies with encryption (jose/JWT)
- Password validation for UI access
- API key validation for programmatic access
- Rate limiting on webhook endpoints (per IP)
- Input validation with Zod on all API routes
- SQL injection prevention via Prisma ORM
- Request body size limits

## Testing Checklist

- [ ] Create webhook listener via UI
- [ ] Copy webhook URL and send POST with curl
- [ ] Verify request appears in dashboard
- [ ] Confirm polling updates work (wait 3-5 seconds)
- [ ] Test different HTTP methods (GET, POST, PUT, DELETE)
- [ ] Test with JSON body and custom headers
- [ ] Test query parameters are captured
- [ ] Delete listener and verify cascade delete
- [ ] Test API key authentication for programmatic access
- [ ] Test rate limiting (send many requests rapidly)
- [ ] Test login/logout flows
- [ ] Test on mobile viewport

## Success Criteria

✅ Can create multiple webhook listeners
✅ Can send webhooks to unique URLs and see them in dashboard
✅ UI updates automatically via polling (no manual refresh)
✅ Can retrieve webhook data via API using listener's API key
✅ Password protection works for UI access
✅ Rate limiting prevents abuse
✅ Deployed successfully to Vercel
