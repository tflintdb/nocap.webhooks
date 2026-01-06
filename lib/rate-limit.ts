interface RateLimitEntry {
  count: number
  resetAt: number
}

const rateLimitMap = new Map<string, RateLimitEntry>()

export function checkRateLimit(identifier: string): boolean {
  const now = Date.now()
  const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10)
  const maxRequests = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10)

  const limit = rateLimitMap.get(identifier)

  // No existing entry or expired - create new one
  if (!limit || now > limit.resetAt) {
    rateLimitMap.set(identifier, {
      count: 1,
      resetAt: now + windowMs
    })

    // Cleanup old entries periodically (simple cleanup strategy)
    if (rateLimitMap.size > 10000) {
      cleanupExpiredEntries()
    }

    return true
  }

  // Check if over limit
  if (limit.count >= maxRequests) {
    return false
  }

  // Increment counter
  limit.count++
  return true
}

function cleanupExpiredEntries(): void {
  const now = Date.now()
  const keysToDelete: string[] = []

  rateLimitMap.forEach((value, key) => {
    if (now > value.resetAt) {
      keysToDelete.push(key)
    }
  })

  keysToDelete.forEach(key => rateLimitMap.delete(key))
}

export function getRateLimitStatus(identifier: string): {
  allowed: boolean
  remaining: number
  resetAt: number
} {
  const now = Date.now()
  const maxRequests = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10)
  const limit = rateLimitMap.get(identifier)

  if (!limit || now > limit.resetAt) {
    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetAt: now + parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10)
    }
  }

  const remaining = Math.max(0, maxRequests - limit.count)

  return {
    allowed: limit.count < maxRequests,
    remaining,
    resetAt: limit.resetAt
  }
}
