import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/listeners/[id]/requests - Get requests for a listener
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)

    const limit = Math.min(
      parseInt(searchParams.get('limit') || '50', 10),
      100
    )
    const offset = parseInt(searchParams.get('offset') || '0', 10)

    // Check if listener exists
    const listener = await prisma.webhookListener.findUnique({
      where: { id }
    })

    if (!listener) {
      return NextResponse.json(
        { error: 'Listener not found' },
        { status: 404 }
      )
    }

    // Get requests
    const [requests, total] = await Promise.all([
      prisma.webhookRequest.findMany({
        where: { listenerId: id },
        orderBy: { receivedAt: 'desc' },
        take: limit,
        skip: offset
      }),
      prisma.webhookRequest.count({
        where: { listenerId: id }
      })
    ])

    return NextResponse.json({
      requests,
      total,
      hasMore: offset + limit < total
    })
  } catch (error) {
    console.error('Error fetching requests:', error)
    return NextResponse.json(
      { error: 'Failed to fetch requests' },
      { status: 500 }
    )
  }
}
