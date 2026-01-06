import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getBaseUrl } from '@/lib/utils'

// GET /api/listeners/[id] - Get listener details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const listener = await prisma.webhookListener.findUnique({
      where: { id },
      include: {
        _count: {
          select: { requests: true }
        }
      }
    })

    if (!listener) {
      return NextResponse.json(
        { error: 'Listener not found' },
        { status: 404 }
      )
    }

    const baseUrl = getBaseUrl()

    return NextResponse.json({
      id: listener.id,
      name: listener.name,
      apiKey: listener.apiKey,
      webhookUrl: `${baseUrl}/api/webhook/${listener.id}`,
      createdAt: listener.createdAt,
      requestCount: listener._count.requests
    })
  } catch (error) {
    console.error('Error fetching listener:', error)
    return NextResponse.json(
      { error: 'Failed to fetch listener' },
      { status: 500 }
    )
  }
}

// DELETE /api/listeners/[id] - Delete listener
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const listener = await prisma.webhookListener.findUnique({
      where: { id }
    })

    if (!listener) {
      return NextResponse.json(
        { error: 'Listener not found' },
        { status: 404 }
      )
    }

    // Delete listener (will cascade delete requests)
    await prisma.webhookListener.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting listener:', error)
    return NextResponse.json(
      { error: 'Failed to delete listener' },
      { status: 500 }
    )
  }
}
