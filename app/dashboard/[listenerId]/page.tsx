import { redirect } from 'next/navigation'

export default async function ListenerDetailPage({
  params,
}: {
  params: Promise<{ listenerId: string }>
}) {
  const { listenerId } = await params
  redirect(`/dashboard?listener=${listenerId}`)
}
