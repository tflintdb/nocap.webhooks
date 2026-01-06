import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { nanoid } from 'nanoid'

const SESSION_SECRET = new TextEncoder().encode(
  process.env.SESSION_SECRET || 'default-secret-key-please-change-in-production'
)
const SESSION_COOKIE_NAME = 'webhook-session'

export interface SessionPayload {
  authenticated: boolean
  expiresAt: Date
}

export async function createSession(): Promise<string> {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

  const session = await new SignJWT({ authenticated: true })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresAt)
    .sign(SESSION_SECRET)

  return session
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const verified = await jwtVerify(token, SESSION_SECRET)
    return verified.payload as unknown as SessionPayload
  } catch (error) {
    return null
  }
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value

  if (!token) {
    return null
  }

  return verifySession(token)
}

export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies()
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    expires: expiresAt,
    sameSite: 'lax',
    path: '/',
  })
}

export async function deleteSessionCookie(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE_NAME)
}

export function generateApiKey(): string {
  return `wh_${nanoid(32)}`
}

export function validatePassword(password: string): boolean {
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123'
  return password === adminPassword
}
