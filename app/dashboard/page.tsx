import { Suspense } from 'react'
import { DashboardShell } from '@/components/dashboard/DashboardShell'

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50" />}>
      <DashboardShell />
    </Suspense>
  )
}
