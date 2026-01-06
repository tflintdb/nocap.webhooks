'use client'

import { useState } from 'react'
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

interface RequestDetailsProps {
  request: WebhookRequest
  onClose: () => void
}

export function RequestDetails({ request, onClose }: RequestDetailsProps) {
  const [activeTab, setActiveTab] = useState<'headers' | 'body' | 'query' | 'meta'>('body')

  const formatJson = (obj: any) => {
    if (!obj) return 'null'
    try {
      return JSON.stringify(obj, null, 2)
    } catch {
      return String(obj)
    }
  }

  const tabs = [
    { id: 'body' as const, label: 'Body' },
    { id: 'headers' as const, label: 'Headers' },
    { id: 'query' as const, label: 'Query Params' },
    { id: 'meta' as const, label: 'Metadata' }
  ]

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Request Details</h2>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>

          <div className="flex items-center gap-3">
            <Badge>{request.method}</Badge>
            <span className="font-mono text-sm">{request.path}</span>
          </div>

          <div className="mt-2 text-sm text-gray-500">
            {new Date(request.receivedAt).toLocaleString()}
          </div>
        </div>

        <div className="border-b border-gray-200">
          <div className="flex gap-1 p-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === tab.id
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-auto p-6">
          {activeTab === 'body' && (
            <div>
              {request.body ? (
                <pre className="bg-gray-50 p-4 rounded-md overflow-auto text-sm font-mono">
                  {request.body}
                </pre>
              ) : (
                <p className="text-gray-500">No body content</p>
              )}
            </div>
          )}

          {activeTab === 'headers' && (
            <div>
              <pre className="bg-gray-50 p-4 rounded-md overflow-auto text-sm font-mono">
                {formatJson(request.headers)}
              </pre>
            </div>
          )}

          {activeTab === 'query' && (
            <div>
              {request.queryParams && Object.keys(request.queryParams).length > 0 ? (
                <pre className="bg-gray-50 p-4 rounded-md overflow-auto text-sm font-mono">
                  {formatJson(request.queryParams)}
                </pre>
              ) : (
                <p className="text-gray-500">No query parameters</p>
              )}
            </div>
          )}

          {activeTab === 'meta' && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Request ID</label>
                <p className="mt-1 font-mono text-sm">{request.id}</p>
              </div>

              {request.ipAddress && (
                <div>
                  <label className="text-sm font-medium text-gray-700">IP Address</label>
                  <p className="mt-1 text-sm">{request.ipAddress}</p>
                </div>
              )}

              {request.userAgent && (
                <div>
                  <label className="text-sm font-medium text-gray-700">User Agent</label>
                  <p className="mt-1 text-sm break-all">{request.userAgent}</p>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-gray-700">Received At</label>
                <p className="mt-1 text-sm">
                  {new Date(request.receivedAt).toISOString()}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
