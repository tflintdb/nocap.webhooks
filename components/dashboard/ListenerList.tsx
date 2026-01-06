'use client'

import { useCallback, useState } from 'react'
import { usePolling } from '@/hooks/usePolling'
import { ListenerCard } from './ListenerCard'
import { CreateListenerDialog } from './CreateListenerDialog'
import { Button } from '@/components/ui/button'

interface Listener {
  id: string
  name: string | null
  apiKey: string
  webhookUrl: string
  createdAt: string
  requestCount: number
}

export function ListenerList() {
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  const fetchListeners = useCallback(async () => {
    const response = await fetch('/api/listeners')
    if (!response.ok) throw new Error('Failed to fetch listeners')
    const data = await response.json()
    return data.listeners as Listener[]
  }, [])

  const { data: listeners, loading, refetch } = usePolling(fetchListeners, 5000)

  const handleListenerCreated = () => {
    setShowCreateDialog(false)
    refetch()
  }

  const handleListenerDeleted = () => {
    refetch()
  }

  if (loading && !listeners) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Loading listeners...</p>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <Button onClick={() => setShowCreateDialog(true)}>
          Create New Listener
        </Button>
      </div>

      {listeners && listeners.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <p className="text-gray-500 mb-4">No webhook listeners yet</p>
          <Button onClick={() => setShowCreateDialog(true)}>
            Create your first listener
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {listeners?.map((listener) => (
            <ListenerCard
              key={listener.id}
              listener={listener}
              onDeleted={handleListenerDeleted}
            />
          ))}
        </div>
      )}

      <CreateListenerDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onCreated={handleListenerCreated}
      />
    </div>
  )
}
