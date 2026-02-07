'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { Listener } from '@/lib/types'

interface ListenerSidebarProps {
  listeners: Listener[]
  selectedId: string | null
  onSelect: (id: string) => void
  onCreateClick: () => void
  onDeleted: () => void
  loading: boolean
}

export function ListenerSidebar({
  listeners,
  selectedId,
  onSelect,
  onCreateClick,
  onDeleted,
  loading,
}: ListenerSidebarProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDelete = async (e: React.MouseEvent, listenerId: string) => {
    e.stopPropagation()
    if (!confirm('Are you sure you want to delete this listener?')) return

    setDeletingId(listenerId)
    try {
      const response = await fetch(`/api/listeners/${listenerId}`, {
        method: 'DELETE',
      })
      if (response.ok) {
        onDeleted()
      }
    } catch (error) {
      console.error('Failed to delete listener:', error)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <aside className="w-72 border-r border-gray-200 bg-white flex flex-col shrink-0">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
            Listeners
          </h2>
          <Button size="sm" onClick={onCreateClick}>
            + New
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {loading && listeners.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">Loading...</p>
        ) : listeners.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-gray-400 mb-3">No listeners yet</p>
            <Button size="sm" variant="outline" onClick={onCreateClick}>
              Create your first listener
            </Button>
          </div>
        ) : (
          listeners.map((listener) => (
            <button
              key={listener.id}
              onClick={() => onSelect(listener.id)}
              className={cn(
                'w-full text-left px-3 py-3 rounded-md transition-colors group',
                selectedId === listener.id
                  ? 'bg-gray-900 text-white'
                  : 'hover:bg-gray-100 text-gray-700'
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium truncate">
                  {listener.name || 'Unnamed Listener'}
                </span>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Badge
                    variant={selectedId === listener.id ? 'secondary' : 'default'}
                    className="text-xs"
                  >
                    {listener.requestCount}
                  </Badge>
                  <button
                    onClick={(e) => handleDelete(e, listener.id)}
                    disabled={deletingId === listener.id}
                    className={cn(
                      'opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded',
                      selectedId === listener.id
                        ? 'hover:bg-gray-700 text-gray-300 hover:text-white'
                        : 'hover:bg-gray-200 text-gray-400 hover:text-red-600',
                      deletingId === listener.id && 'opacity-100'
                    )}
                    title="Delete listener"
                  >
                    {deletingId === listener.id ? (
                      <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    ) : (
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
              <span
                className={cn(
                  'text-xs font-mono truncate block mt-0.5',
                  selectedId === listener.id ? 'text-gray-400' : 'text-gray-400'
                )}
              >
                {listener.id}
              </span>
            </button>
          ))
        )}
      </div>
    </aside>
  )
}
