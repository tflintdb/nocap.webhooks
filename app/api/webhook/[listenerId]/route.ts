import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getClientIp, cleanupOldRequests } from '@/lib/utils'

// Handle all HTTP methods
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ listenerId: string }> }
) {
  return handleWebhook(request, await params, 'GET')
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ listenerId: string }> }
) {
  return handleWebhook(request, await params, 'POST')
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ listenerId: string }> }
) {
  return handleWebhook(request, await params, 'PUT')
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ listenerId: string }> }
) {
  return handleWebhook(request, await params, 'PATCH')
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ listenerId: string }> }
) {
  return handleWebhook(request, await params, 'DELETE')
}

export async function OPTIONS(
  request: NextRequest,
  { params }: { params: Promise<{ listenerId: string }> }
) {
  return new Response(null, {
    status: 204,
    headers: getCorsHeaders()
  })
}

async function handleWebhook(
  request: NextRequest,
  params: { listenerId: string },
  method: string
) {
  try {
    const { listenerId } = params

    // Check if listener exists
    const listener = await prisma.webhookListener.findUnique({
      where: { id: listenerId }
    })

    if (!listener) {
      return NextResponse.json(
        { error: 'Webhook listener not found' },
        { status: 404, headers: getCorsHeaders() }
      )
    }

    // Extract request data
    const url = new URL(request.url)
    const path = url.pathname + url.search

    // Get headers as object
    const headers: Record<string, string> = {}
    request.headers.forEach((value, key) => {
      headers[key] = value
    })

    // Get query params as object
    const queryParams: Record<string, string> = {}
    url.searchParams.forEach((value, key) => {
      queryParams[key] = value
    })

    // Get body (handle different content types)
    let body: string | null = null
    try {
      const contentType = request.headers.get('content-type') || ''

      if (method !== 'GET' && method !== 'DELETE') {
        if (contentType.includes('application/json')) {
          const jsonBody = await request.json()
          body = JSON.stringify(jsonBody)
        } else if (contentType.includes('application/x-www-form-urlencoded')) {
          const formData = await request.formData()
          const formObj: Record<string, string> = {}
          formData.forEach((value, key) => {
            formObj[key] = value.toString()
          })
          body = JSON.stringify(formObj)
        } else {
          body = await request.text()
        }
      }
    } catch (error) {
      // If body parsing fails, just store empty
      body = null
    }

    const ipAddress = getClientIp(request)
    const userAgent = request.headers.get('user-agent')

    // Store webhook request
    const webhookRequest = await prisma.webhookRequest.create({
      data: {
        listenerId,
        method,
        path,
        headers,
        body,
        queryParams: Object.keys(queryParams).length > 0 ? queryParams : null,
        ipAddress,
        userAgent,
      }
    })

    // Cleanup old requests in the background (don't await)
    cleanupOldRequests(prisma, listenerId).catch(console.error)

    return NextResponse.json(
      {
        success: true,
        message: 'Webhook received',
        requestId: webhookRequest.id
      },
      {
        status: 200,
        headers: getCorsHeaders()
      }
    )
  } catch (error) {
    console.error('Error handling webhook:', error)
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 500, headers: getCorsHeaders() }
    )
  }
}

function getCorsHeaders(): HeadersInit {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': '*',
  }
}
