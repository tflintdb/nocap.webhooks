'use client'

import { useCallback, useState } from 'react'
import { usePolling } from '@/hooks/usePolling'
import { RequestDetails } from './RequestDetails'
import { CopyButton } from './CopyButton'
import { Badge } from '@/components/ui/badge'
import type { Listener, WebhookRequest } from '@/lib/types'

interface ListenerDetailPanelProps {
  listener: Listener
}

export function ListenerDetailPanel({ listener }: ListenerDetailPanelProps) {
  const [selectedRequest, setSelectedRequest] = useState<WebhookRequest | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const fetchRequests = useCallback(async () => {
    const response = await fetch(`/api/listeners/${listener.id}/requests?limit=50`)
    if (!response.ok) throw new Error('Failed to fetch requests')
    const data = await response.json()
    return data.requests as WebhookRequest[]
  }, [listener.id])

  const { data: requests, loading, refetch } = usePolling(fetchRequests, 3000)

  const deleteRequest = async (e: React.MouseEvent, requestId: string) => {
    e.stopPropagation()
    if (deletingId) return
    setDeletingId(requestId)
    try {
      const response = await fetch(`/api/listeners/${listener.id}/requests/${requestId}`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('Failed to delete request')
      if (selectedRequest?.id === requestId) setSelectedRequest(null)
      refetch()
    } catch (error) {
      console.error('Error deleting request:', error)
    } finally {
      setDeletingId(null)
    }
  }

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

  return (
    <div className="p-6 space-y-6">
      {/* Listener Info Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">
          {listener.name || 'Unnamed Listener'}
        </h2>
        <p className="text-sm text-gray-400 font-mono mt-1">{listener.id}</p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
        <div>
          <label className="text-xs font-medium text-gray-500">Webhook URL</label>
          <div className="flex gap-2 mt-1">
            <input
              type="text"
              value={listener.webhookUrl}
              readOnly
              className="flex-1 text-sm font-mono bg-gray-50 border border-gray-200 rounded px-3 py-1.5"
            />
            <CopyButton text={listener.webhookUrl} />
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500">API Key</label>
          <div className="flex gap-2 mt-1">
            <input
              type="text"
              value={listener.apiKey}
              readOnly
              className="flex-1 text-sm font-mono bg-gray-50 border border-gray-200 rounded px-3 py-1.5"
            />
            <CopyButton text={listener.apiKey} />
          </div>
        </div>
      </div>

      {/* Requests Section */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900">
          Webhook Requests
          <span className="ml-2 text-sm font-normal text-gray-500">
            {requests?.length || 0} received
          </span>
        </h3>
      </div>

      {loading && !requests ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Loading requests...</p>
        </div>
      ) : requests && requests.length === 0 ? (
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
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-500">
                      {new Date(request.receivedAt).toLocaleString()}
                    </span>
                    <button
                      onClick={(e) => deleteRequest(e, request.id)}
                      disabled={deletingId === request.id}
                      className="text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50"
                      title="Delete request"
                    >
                      {deletingId === request.id ? (
                        <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      )}
                    </button>
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
