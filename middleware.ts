import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifySession } from '@/lib/auth'
import { checkRateLimit } from '@/lib/rate-limit'
import { getClientIp } from '@/lib/utils'

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname

  // Public routes - webhook reception (apply rate limiting only)
  if (path.startsWith('/api/webhook/')) {
    const ip = getClientIp(request) || 'unknown'
    const rateLimitKey = `webhook:${ip}`

    if (!checkRateLimit(rateLimitKey)) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429 }
      )
    }

    return NextResponse.next()
  }

  // Auth routes - public
  if (path.startsWith('/api/auth') || path === '/login') {
    return NextResponse.next()
  }

  // API routes - require session OR API key
  if (path.startsWith('/api/')) {
    // Check for API key first
    const apiKey = request.headers.get('x-api-key')
    if (apiKey && apiKey.startsWith('wh_')) {
      // API key will be validated in the route handler
      return NextResponse.next()
    }

    // Check for session
    const token = request.cookies.get('webhook-session')?.value
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const session = await verifySession(token)
    if (!session || !session.authenticated) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    return NextResponse.next()
  }

  // UI routes - require session
  if (path.startsWith('/dashboard')) {
    const token = request.cookies.get('webhook-session')?.value

    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    const session = await verifySession(token)
    if (!session || !session.authenticated) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/api/:path*',
    '/dashboard/:path*',
    '/login',
  ],
}
