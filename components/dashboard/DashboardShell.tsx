'use client'

import { useCallback, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { usePolling } from '@/hooks/usePolling'
import { Header } from '@/components/layout/Header'
import { ListenerSidebar } from './ListenerSidebar'
import { ListenerDetailPanel } from './ListenerDetailPanel'
import { CreateListenerDialog } from './CreateListenerDialog'
import type { Listener } from '@/lib/types'

export function DashboardShell() {
  const searchParams = useSearchParams()
  const initialListenerId = searchParams.get('listener')
  const [selectedListenerId, setSelectedListenerId] = useState<string | null>(initialListenerId)
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  const fetchListeners = useCallback(async () => {
    const response = await fetch('/api/listeners')
    if (!response.ok) throw new Error('Failed to fetch listeners')
    const data = await response.json()
    return data.listeners as Listener[]
  }, [])

  const { data: listeners, loading, refetch } = usePolling(fetchListeners, 5000)

  const selectedListener = listeners?.find((l) => l.id === selectedListenerId) ?? null

  const handleListenerCreated = () => {
    setShowCreateDialog(false)
    refetch()
  }

  const handleListenerDeleted = () => {
    refetch()
    // Clear selection if the deleted listener was selected
    if (selectedListenerId && !listeners?.find((l) => l.id === selectedListenerId)) {
      setSelectedListenerId(null)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <ListenerSidebar
          listeners={listeners ?? []}
          selectedId={selectedListenerId}
          onSelect={setSelectedListenerId}
          onCreateClick={() => setShowCreateDialog(true)}
          onDeleted={handleListenerDeleted}
          loading={loading}
        />

        <main className="flex-1 overflow-auto">
          {selectedListener ? (
            <ListenerDetailPanel key={selectedListener.id} listener={selectedListener} />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">
              <div className="text-center">
                <p className="text-lg">Select a listener to view requests</p>
                <p className="text-sm mt-1">Or create a new one to get started</p>
              </div>
            </div>
          )}
        </main>
      </div>

      <CreateListenerDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onCreated={handleListenerCreated}
      />
    </div>
  )
}
