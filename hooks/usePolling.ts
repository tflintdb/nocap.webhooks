'use client'

import { useEffect, useState, useCallback, useRef } from 'react'

export function usePolling<T>(
  fetchFn: () => Promise<T>,
  interval: number = 3000
) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const poll = useCallback(async () => {
    try {
      const result = await fetchFn()
      setData(result)
      setError(null)
      setLoading(false)
    } catch (err) {
      setError(err as Error)
      setLoading(false)
    }
  }, [fetchFn])

  useEffect(() => {
    // Initial fetch
    poll()

    // Setup polling
    intervalRef.current = setInterval(poll, interval)

    // Pause polling when tab is not visible
    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
          intervalRef.current = null
        }
      } else {
        poll()
        intervalRef.current = setInterval(poll, interval)
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [poll, interval])

  return { data, loading, error, refetch: poll }
}
