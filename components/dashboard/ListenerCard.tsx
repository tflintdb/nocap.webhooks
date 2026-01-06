'use client'

import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CopyButton } from './CopyButton'
import { useState } from 'react'

interface Listener {
  id: string
  name: string | null
  apiKey: string
  webhookUrl: string
  createdAt: string
  requestCount: number
}

interface ListenerCardProps {
  listener: Listener
  onDeleted: () => void
}

export function ListenerCard({ listener, onDeleted }: ListenerCardProps) {
  const router = useRouter()
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this listener?')) {
      return
    }

    setDeleting(true)
    try {
      const response = await fetch(`/api/listeners/${listener.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        onDeleted()
      }
    } catch (error) {
      console.error('Failed to delete listener:', error)
    } finally {
      setDeleting(false)
    }
  }

  const handleView = () => {
    router.push(`/dashboard/${listener.id}`)
  }

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">
              {listener.name || 'Unnamed Listener'}
            </CardTitle>
            <CardDescription className="mt-1">
              <span className="text-xs font-mono">{listener.id}</span>
            </CardDescription>
          </div>
          <Badge>{listener.requestCount} requests</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-xs font-medium text-gray-500">
            Webhook URL
          </label>
          <div className="flex gap-2 mt-1">
            <input
              type="text"
              value={listener.webhookUrl}
              readOnly
              className="flex-1 text-xs font-mono bg-gray-50 border border-gray-200 rounded px-2 py-1"
            />
            <CopyButton text={listener.webhookUrl} />
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-gray-500">
            API Key
          </label>
          <div className="flex gap-2 mt-1">
            <input
              type="text"
              value={listener.apiKey}
              readOnly
              className="flex-1 text-xs font-mono bg-gray-50 border border-gray-200 rounded px-2 py-1"
            />
            <CopyButton text={listener.apiKey} />
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={handleView}
          >
            View Requests
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
