'use client'

import { useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import { usePolling } from '@/hooks/usePolling'
import { RequestDetails } from './RequestDetails'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface WebhookRequest {
  id: string
  method: string
  path: string
  headers: Record<string, string>
  body: string | null
  queryParams: Record<string, string> | null
  ipAddress: string | null
  userAgent: string | null
  receivedAt: string
}

interface RequestListProps {
  listenerId: string
}

export function RequestList({ listenerId }: RequestListProps) {
  const router = useRouter()
  const [selectedRequest, setSelectedRequest] = useState<WebhookRequest | null>(null)

  const fetchRequests = useCallback(async () => {
    const response = await fetch(`/api/listeners/${listenerId}/requests?limit=50`)
    if (!response.ok) throw new Error('Failed to fetch requests')
    const data = await response.json()
    return data.requests as WebhookRequest[]
  }, [listenerId])

  const { data: requests, loading } = usePolling(fetchRequests, 3000)

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET':
        return 'bg-blue-100 text-blue-800'
      case 'POST':
        return 'bg-green-100 text-green-800'
      case 'PUT':
        return 'bg-yellow-100 text-yellow-800'
      case 'PATCH':
        return 'bg-orange-100 text-orange-800'
      case 'DELETE':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading && !requests) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Loading requests...</p>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Webhook Requests
          </h1>
          <p className="mt-2 text-gray-600">
            {requests?.length || 0} requests received
          </p>
        </div>
        <Button variant="outline" onClick={() => router.push('/dashboard')}>
          Back to Listeners
        </Button>
      </div>

      {requests && requests.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <p className="text-gray-500 mb-2">No requests received yet</p>
          <p className="text-sm text-gray-400">
            Send a request to your webhook URL to see it here
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="divide-y divide-gray-200">
            {requests?.map((request) => (
              <div
                key={request.id}
                className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => setSelectedRequest(request)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge className={getMethodColor(request.method)}>
                      {request.method}
                    </Badge>
                    <span className="font-mono text-sm text-gray-900">
                      {request.path}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(request.receivedAt).toLocaleString()}
                  </div>
                </div>

                {request.ipAddress && (
                  <div className="mt-2 text-xs text-gray-500">
                    From {request.ipAddress}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedRequest && (
        <RequestDetails
          request={selectedRequest}
          onClose={() => setSelectedRequest(null)}
        />
      )}
    </div>
  )
}
