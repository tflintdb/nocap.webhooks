import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { generateApiKey } from '@/lib/auth'
import { getBaseUrl } from '@/lib/utils'

const createListenerSchema = z.object({
  name: z.string().optional()
})

// GET /api/listeners - List all listeners
export async function GET() {
  try {
    const listeners = await prisma.webhookListener.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { requests: true }
        }
      }
    })

    const baseUrl = getBaseUrl()

    const listenersWithUrls = listeners.map(listener => ({
      id: listener.id,
      name: listener.name,
      apiKey: listener.apiKey,
      webhookUrl: `${baseUrl}/api/webhook/${listener.id}`,
      createdAt: listener.createdAt,
      requestCount: listener._count.requests
    }))

    return NextResponse.json({ listeners: listenersWithUrls })
  } catch (error) {
    console.error('Error fetching listeners:', error)
    return NextResponse.json(
      { error: 'Failed to fetch listeners' },
      { status: 500 }
    )
  }
}

// POST /api/listeners - Create new listener
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name } = createListenerSchema.parse(body)

    const apiKey = generateApiKey()

    const listener = await prisma.webhookListener.create({
      data: {
        name,
        apiKey
      }
    })

    const baseUrl = getBaseUrl()

    return NextResponse.json({
      id: listener.id,
      name: listener.name,
      apiKey: listener.apiKey,
      webhookUrl: `${baseUrl}/api/webhook/${listener.id}`,
      createdAt: listener.createdAt
    }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error('Error creating listener:', error)
    return NextResponse.json(
      { error: 'Failed to create listener' },
      { status: 500 }
    )
  }
}
