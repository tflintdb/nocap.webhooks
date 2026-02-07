export interface Listener {
  id: string
  name: string | null
  apiKey: string
  webhookUrl: string
  createdAt: string
  requestCount: number
}

export interface WebhookRequest {
  id: string
  method: string
  path: string
  headers: Record<string, string>
  body: string | null
  queryParams: Record<string, string> | null
  ipAddress: string | null
  userAgent: string | null
  receivedAt: string
}
