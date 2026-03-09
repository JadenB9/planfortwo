# PlanForTwo MCP Server Design

## Overview

Local MCP (Model Context Protocol) server that lets Claude Code manage the PlanForTwo wedding planning app through natural language commands.

## Architecture

- **Transport**: stdio (local child process, zero network latency)
- **Package**: `packages/mcp/` in monorepo
- **SDK**: `@modelcontextprotocol/sdk` (TypeScript)
- **Auth**: API key in `X-API-Key` header, bypasses Clerk JWT in auth middleware
- **Backend**: Calls existing Hono API over HTTP (localhost:3001 dev, Railway prod)

## Role Modes

Controlled by `MCP_MODE` env var:

- `reader` — Query-only tools (list, get, stats, export)
- `admin` — Full CRUD access (create, update, delete, send)

## Tool Design

~45 high-level, workflow-oriented tools (not raw CRUD). Each tool may combine multiple API calls internally.

| Category   | Reader Tools                              | Admin Tools                                               |
| ---------- | ----------------------------------------- | --------------------------------------------------------- |
| Wedding    | get_wedding, get_dashboard                | update_wedding                                            |
| Guests     | search_guests, get_guest_stats            | add_guest, update_guest, delete_guest, bulk_import_guests |
| Households | list_households                           | create_household, update_household, delete_household      |
| RSVP       | get_rsvp_dashboard                        | send_rsvp_invites                                         |
| Checklist  | search_tasks                              | create_task, update_task, complete_task, delete_task      |
| Budget     | list_budget_items, get_budget_analytics   | add_expense, update_expense, delete_expense               |
| Events     | list_events                               | create_event, update_event, delete_event, manage_timeline |
| Seating    | get_seating_chart                         | manage_tables, assign_seats                               |
| Vendors    | list_vendors                              | manage_vendor                                             |
| Website    | get_website_config, get_website_analytics | update_website, publish_website                           |
| Email      | list_emails                               | send_email                                                |
| Ceremony   | get_ceremony                              | manage_ceremony                                           |
| Music      | list_playlists                            | manage_playlists                                          |
| Registry   | list_registry                             | manage_registry                                           |
| Activity   | get_recent_activity                       | —                                                         |

## Auth Flow

```
Claude Code → MCP server (stdio, local process)
  → HTTP call to Hono API with X-API-Key header
  → auth middleware checks API key → sets clerkUserId from MCP_CLERK_USER_ID env
  → all downstream middleware (resolveUser, resolveWedding, requireFeature) works unchanged
```

## Registration

```bash
claude mcp add --transport stdio \
  --env PLANFORTWO_API_URL=http://localhost:3001 \
  --env PLANFORTWO_API_KEY=<key> \
  --env MCP_MODE=admin \
  planfortwo -- npx tsx packages/mcp/src/index.ts
```

## Security

- API key only on local machine in `~/.claude.json`
- Not deployed, not exposed to internet
- Wedding site users never touch MCP server
- API key can be revoked/rotated anytime
