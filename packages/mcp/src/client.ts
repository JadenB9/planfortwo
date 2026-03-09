/**
 * HTTP client for calling the PlanForTwo Hono API.
 * Handles authentication via API key and weddingId injection.
 */

const API_URL = process.env.PLANFORTWO_API_URL ?? 'http://localhost:3001'
const API_KEY = process.env.PLANFORTWO_API_KEY ?? ''

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: Record<string, unknown>
  query?: Record<string, string | number | boolean | undefined>
}

export class ApiClient {
  private baseUrl: string
  private apiKey: string
  private weddingId: string | null = null

  constructor() {
    this.baseUrl = API_URL.replace(/\/$/, '')
    this.apiKey = API_KEY

    if (!this.apiKey) {
      console.error('[MCP] Warning: PLANFORTWO_API_KEY is not set')
    }
  }

  setWeddingId(id: string): void {
    this.weddingId = id
  }

  getWeddingId(): string | null {
    return this.weddingId
  }

  async request<T = Record<string, unknown>>(
    path: string,
    options: RequestOptions = {},
  ): Promise<T> {
    const { method = 'GET', body, query } = options

    const url = new URL(`${this.baseUrl}${path}`)

    // Inject weddingId into query params if available and not already present
    const queryParams = { ...query }
    if (this.weddingId && !queryParams['weddingId']) {
      queryParams['weddingId'] = this.weddingId
    }

    for (const [key, value] of Object.entries(queryParams)) {
      if (value !== undefined) {
        url.searchParams.set(key, String(value))
      }
    }

    const headers: Record<string, string> = {
      'X-API-Key': this.apiKey,
      'Content-Type': 'application/json',
    }

    // For POST/PUT/PATCH with body, inject weddingId into body too
    let requestBody: string | undefined
    if (body && ['POST', 'PUT', 'PATCH'].includes(method)) {
      const bodyWithWedding = { ...body }
      if (this.weddingId && !bodyWithWedding['weddingId']) {
        bodyWithWedding['weddingId'] = this.weddingId
      }
      requestBody = JSON.stringify(bodyWithWedding)
    }

    const response = await fetch(url.toString(), {
      method,
      headers,
      body: requestBody,
    })

    const data = (await response.json()) as T & { error?: string }

    if (!response.ok) {
      const errorMsg = data.error ?? `API error ${response.status}`
      throw new Error(errorMsg)
    }

    return data
  }

  // Convenience methods
  async get<T = Record<string, unknown>>(
    path: string,
    query?: Record<string, string | number | boolean | undefined>,
  ): Promise<T> {
    return this.request<T>(path, { method: 'GET', query })
  }

  async post<T = Record<string, unknown>>(
    path: string,
    body?: Record<string, unknown>,
    query?: Record<string, string | number | boolean | undefined>,
  ): Promise<T> {
    return this.request<T>(path, { method: 'POST', body, query })
  }

  async put<T = Record<string, unknown>>(path: string, body?: Record<string, unknown>): Promise<T> {
    return this.request<T>(path, { method: 'PUT', body })
  }

  async patch<T = Record<string, unknown>>(
    path: string,
    body?: Record<string, unknown>,
  ): Promise<T> {
    return this.request<T>(path, { method: 'PATCH', body })
  }

  async del<T = Record<string, unknown>>(path: string): Promise<T> {
    return this.request<T>(path, { method: 'DELETE' })
  }
}
