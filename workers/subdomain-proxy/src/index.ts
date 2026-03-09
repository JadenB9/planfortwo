const RESERVED = new Set(['www', 'app', 'api', 'mail', 'admin'])

export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url)
    const match = url.hostname.match(/^([a-z0-9-]+)\.planfortwo\.com$/)

    // Pass through reserved subdomains and non-matching hosts
    if (!match || RESERVED.has(match[1])) {
      return fetch(request)
    }

    // Rewrite to app.planfortwo.com, preserve original host for middleware
    const newUrl = new URL(request.url)
    newUrl.hostname = 'app.planfortwo.com'

    const newRequest = new Request(newUrl.toString(), {
      method: request.method,
      headers: request.headers,
      body: request.body,
      redirect: 'manual',
    })
    newRequest.headers.set('X-Forwarded-Host', url.hostname)

    return fetch(newRequest)
  },
}
