# Webhook Tester

A webhook testing application similar to webhook.site, allowing you to create multiple webhook listeners, view incoming requests in real-time, and access webhook data via API for e2e testing.

## Features

- Create multiple webhook listeners with unique URLs
- Real-time dashboard showing webhook requests (auto-refreshes every 3 seconds)
- View detailed request information (headers, body, query params, metadata)
- API access with API keys for programmatic use (e2e tests)
- Simple password authentication for UI access
- Rate limiting on webhook endpoints
- Auto-cleanup of old requests (keeps last 1000 per listener)

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT sessions (UI) + API keys (programmatic)
- **Styling**: Tailwind CSS
- **Deployment**: Vercel

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL database (or use Vercel Postgres)
- npm or yarn

### Local Development

1. **Clone and install dependencies**

```bash
npm install
```

2. **Setup environment variables**

Copy `.env.example` to `.env.local` and update the values:

```bash
cp .env.example .env.local
```

Required environment variables:

```env
# Database (use your local PostgreSQL or Vercel Postgres)
POSTGRES_PRISMA_URL="postgresql://user:password@localhost:5432/webhooks"
POSTGRES_URL_NON_POOLING="postgresql://user:password@localhost:5432/webhooks"

# Authentication
ADMIN_PASSWORD="your-secure-password"
SESSION_SECRET="your-32-char-random-string"

# Application
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

3. **Setup database**

If using local PostgreSQL, create the database:

```bash
createdb webhooks
```

Run Prisma migrations:

```bash
npm run db:migrate
```

4. **Start development server**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

5. **Login**

Navigate to `/login` and enter the password you set in `ADMIN_PASSWORD`.

## Usage

### Creating a Webhook Listener

1. Go to the dashboard
2. Click "Create New Listener"
3. Optionally give it a name
4. Copy the webhook URL

### Sending Webhooks

Send any HTTP request to your webhook URL:

```bash
# POST request
curl -X POST http://localhost:3000/api/webhook/YOUR_LISTENER_ID \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'

# GET request with query params
curl http://localhost:3000/api/webhook/YOUR_LISTENER_ID?foo=bar

# PUT request
curl -X PUT http://localhost:3000/api/webhook/YOUR_LISTENER_ID \
  -H "Content-Type: application/json" \
  -d '{"update": "data"}'
```

### Using the API for E2E Tests

Each listener has an API key that can be used for programmatic access:

```javascript
// Fetch requests for a listener
const response = await fetch(
  `http://localhost:3000/api/listeners/${listenerId}/requests`,
  {
    headers: {
      'X-API-Key': 'wh_your_api_key_here'
    }
  }
)

const { requests } = await response.json()

// Use in your e2e tests
expect(requests).toHaveLength(1)
expect(requests[0].body).toContain('expected data')
```

## API Reference

### Authentication

**POST /api/auth/login**
- Body: `{ "password": "string" }`
- Sets session cookie

**POST /api/auth/logout**
- Clears session cookie

### Webhook Listeners

**GET /api/listeners**
- Lists all webhook listeners
- Auth: Session or API key

**POST /api/listeners**
- Creates a new listener
- Body: `{ "name": "string" }` (optional)
- Returns: Listener object with API key
- Auth: Session or API key

**GET /api/listeners/:id**
- Gets listener details
- Auth: Session or API key

**DELETE /api/listeners/:id**
- Deletes a listener (cascade deletes requests)
- Auth: Session or API key

**GET /api/listeners/:id/requests**
- Gets requests for a listener
- Query params: `limit` (default 50, max 100), `offset`
- Auth: Session or API key

### Webhook Reception

**ALL /api/webhook/:listenerId**
- Receives webhooks (GET, POST, PUT, PATCH, DELETE)
- No authentication required
- CORS enabled
- Rate limited per IP

## Deployment to Vercel

### Option 1: Using Vercel CLI

1. **Install Vercel CLI**

```bash
npm install -g vercel
```

2. **Deploy**

```bash
vercel
```

3. **Setup Vercel Postgres**

```bash
vercel postgres create
```

4. **Link database to project**

The Vercel CLI will guide you through linking the database.

5. **Set environment variables**

```bash
vercel env add ADMIN_PASSWORD
vercel env add SESSION_SECRET
```

6. **Run migrations**

```bash
vercel env pull .env.local
npm run db:migrate
```

### Option 2: Using Vercel Dashboard

1. Go to [vercel.com](https://vercel.com)
2. Import your Git repository
3. Add Vercel Postgres from the Storage tab
4. Set environment variables:
   - `ADMIN_PASSWORD`
   - `SESSION_SECRET`
   - Database URLs are automatically set by Vercel
5. Deploy

After deployment, run migrations:

```bash
# Connect to your project
vercel link

# Pull env vars
vercel env pull .env.local

# Run migrations
npm run db:migrate
```

## Project Structure

```
.
├── app/
│   ├── api/
│   │   ├── auth/              # Authentication endpoints
│   │   ├── listeners/         # Listener management
│   │   └── webhook/           # Webhook reception
│   ├── dashboard/             # Dashboard pages
│   ├── login/                 # Login page
│   └── layout.tsx
├── components/
│   ├── dashboard/             # Dashboard components
│   ├── layout/                # Layout components
│   └── ui/                    # Reusable UI components
├── hooks/
│   └── usePolling.ts          # Polling hook for real-time updates
├── lib/
│   ├── prisma.ts              # Prisma client
│   ├── auth.ts                # Authentication utilities
│   ├── rate-limit.ts          # Rate limiting
│   └── utils.ts               # Utility functions
├── prisma/
│   └── schema.prisma          # Database schema
└── middleware.ts              # Route protection middleware
```

## Database Schema

### WebhookListener
- `id`: Unique identifier (used in webhook URL)
- `name`: Optional friendly name
- `apiKey`: API key for programmatic access
- `createdAt`, `updatedAt`: Timestamps

### WebhookRequest
- `id`: Unique identifier
- `listenerId`: Foreign key to WebhookListener
- `method`: HTTP method
- `path`: Request path with query string
- `headers`: Request headers (JSON)
- `body`: Request body (string)
- `queryParams`: Parsed query parameters (JSON)
- `ipAddress`: Client IP address
- `userAgent`: Client user agent
- `receivedAt`: Timestamp

## Configuration

### Rate Limiting

Configure rate limiting via environment variables:

```env
RATE_LIMIT_WINDOW_MS="60000"      # 1 minute window
RATE_LIMIT_MAX_REQUESTS="100"     # 100 requests per window
```

### Request Retention

Configure how many requests to keep per listener:

```env
MAX_REQUESTS_PER_LISTENER="1000"  # Keep last 1000 requests
```

## Development

### Database Management

```bash
# View data in Prisma Studio
npm run db:studio

# Create a new migration
npm run db:migrate

# Generate Prisma client after schema changes
npm run db:generate
```

### Code Quality

```bash
# Lint code
npm run lint

# Type check
npx tsc --noEmit
```

## Troubleshooting

### Database Connection Issues

If you get connection errors:

1. Check your database is running
2. Verify connection string in `.env.local`
3. Ensure database exists: `createdb webhooks`
4. Run migrations: `npm run db:migrate`

### Port Already in Use

If port 3000 is in use, specify a different port:

```bash
PORT=3001 npm run dev
```

### Authentication Issues

If you can't log in:

1. Check `ADMIN_PASSWORD` in `.env.local`
2. Clear cookies and try again
3. Check console for errors

## Security Considerations

- Change `ADMIN_PASSWORD` and `SESSION_SECRET` in production
- Use strong, random values for secrets
- Keep API keys secure
- Consider adding additional authentication for sensitive use cases
- Rate limiting is enabled by default on webhook endpoints

## License

MIT

## Support

For issues and questions, please open an issue on GitHub.
