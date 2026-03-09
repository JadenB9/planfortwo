#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { ApiClient } from './client.js'
import { registerWeddingTools } from './tools/wedding.js'
import { registerGuestTools } from './tools/guests.js'
import { registerChecklistTools } from './tools/checklist.js'
import { registerBudgetTools } from './tools/budget.js'
import { registerWebsiteTools } from './tools/website.js'
import { registerEventsTools } from './tools/events.js'
import { registerSeatingTools } from './tools/seating.js'
import { registerVendorTools } from './tools/vendors.js'
import { registerCeremonyTools } from './tools/ceremony.js'
import { registerMusicTools } from './tools/music.js'
import { registerRegistryTools } from './tools/registry.js'
import { registerCommunicationTools } from './tools/communication.js'

const mode = process.env.MCP_MODE ?? 'reader'

if (mode !== 'reader' && mode !== 'admin') {
  console.error(`[MCP] Invalid MCP_MODE: "${mode}". Must be "reader" or "admin".`)
  process.exit(1)
}

const client = new ApiClient()

const server = new McpServer({
  name: 'planfortwo',
  version: '1.0.0',
})

// Fetch weddingId on first tool call
let weddingIdResolved = false

async function ensureWeddingId(): Promise<void> {
  if (weddingIdResolved) return

  try {
    const result = await client.get<{ data: { wedding: { id: string } } }>('/weddings/mine')
    const weddingId = result.data?.wedding?.id
    if (weddingId) {
      client.setWeddingId(weddingId)
      console.error(`[MCP] Resolved weddingId: ${weddingId}`)
    }
  } catch (err) {
    console.error('[MCP] Failed to resolve weddingId:', err)
  }

  weddingIdResolved = true
}

// Wrap the client to auto-resolve weddingId
const originalRequest = client.request.bind(client)
client.request = async function <T>(...args: Parameters<typeof originalRequest>): Promise<T> {
  await ensureWeddingId()
  return originalRequest<T>(...args) as Promise<T>
}

// Register all tool groups
registerWeddingTools(server, client, mode)
registerGuestTools(server, client, mode)
registerChecklistTools(server, client, mode)
registerBudgetTools(server, client, mode)
registerWebsiteTools(server, client, mode)
registerEventsTools(server, client, mode)
registerSeatingTools(server, client, mode)
registerVendorTools(server, client, mode)
registerCeremonyTools(server, client, mode)
registerMusicTools(server, client, mode)
registerRegistryTools(server, client, mode)
registerCommunicationTools(server, client, mode)

console.error(`[MCP] PlanForTwo MCP server starting in "${mode}" mode`)
console.error(`[MCP] API: ${process.env.PLANFORTWO_API_URL ?? 'http://localhost:3001'}`)

const transport = new StdioServerTransport()
await server.connect(transport)
