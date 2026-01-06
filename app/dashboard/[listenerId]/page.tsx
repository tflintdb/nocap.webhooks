import { Header } from '@/components/layout/Header'
import { RequestList } from '@/components/dashboard/RequestList'

export default async function ListenerDetailPage({
  params
}: {
  params: Promise<{ listenerId: string }>
}) {
  const { listenerId } = await params

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <RequestList listenerId={listenerId} />
      </main>
    </div>
  )
}
