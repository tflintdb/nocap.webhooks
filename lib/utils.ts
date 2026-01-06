import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }

  return 'http://localhost:3000'
}

export function getClientIp(request: Request): string | null {
  // Try various headers that might contain the real IP
  const headers = request.headers

  return (
    headers.get('x-real-ip') ||
    headers.get('x-forwarded-for')?.split(',')[0] ||
    headers.get('cf-connecting-ip') || // Cloudflare
    headers.get('x-client-ip') ||
    null
  )
}

export async function cleanupOldRequests(
  prisma: any,
  listenerId: string
): Promise<void> {
  const maxRequests = parseInt(
    process.env.MAX_REQUESTS_PER_LISTENER || '1000',
    10
  )

  const requestCount = await prisma.webhookRequest.count({
    where: { listenerId }
  })

  if (requestCount > maxRequests) {
    const excessCount = requestCount - maxRequests

    // Get IDs of oldest requests to delete
    const oldestRequests = await prisma.webhookRequest.findMany({
      where: { listenerId },
      orderBy: { receivedAt: 'asc' },
      take: excessCount,
      select: { id: true }
    })

    // Delete them
    await prisma.webhookRequest.deleteMany({
      where: {
        id: {
          in: oldestRequests.map((r: { id: string }) => r.id)
        }
      }
    })
  }
}
