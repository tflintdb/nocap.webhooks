import { ListenerList } from '@/components/dashboard/ListenerList'
import { Header } from '@/components/layout/Header'

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Webhook Listeners
          </h1>
          <p className="mt-2 text-gray-600">
            Create and manage webhook endpoints for testing
          </p>
        </div>

        <ListenerList />
      </main>
    </div>
  )
}
