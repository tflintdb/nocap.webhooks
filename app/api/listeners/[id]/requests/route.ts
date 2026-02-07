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

// DELETE /api/listeners/[id]/requests - Bulk delete oldest requests
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const count = body?.count

    if (typeof count !== 'number' || !Number.isInteger(count) || count < 1 || count > 50) {
      return NextResponse.json(
        { error: 'count must be an integer between 1 and 50' },
        { status: 400 }
      )
    }

    const listener = await prisma.webhookListener.findUnique({
      where: { id }
    })

    if (!listener) {
      return NextResponse.json(
        { error: 'Listener not found' },
        { status: 404 }
      )
    }

    const oldest = await prisma.webhookRequest.findMany({
      where: { listenerId: id },
      orderBy: { receivedAt: 'asc' },
      take: count,
      select: { id: true }
    })

    if (oldest.length === 0) {
      return NextResponse.json({ deleted: 0 })
    }

    const result = await prisma.webhookRequest.deleteMany({
      where: { id: { in: oldest.map((r) => r.id) } }
    })

    return NextResponse.json({ deleted: result.count })
  } catch (error) {
    console.error('Error bulk deleting requests:', error)
    return NextResponse.json(
      { error: 'Failed to delete requests' },
      { status: 500 }
    )
  }
}
