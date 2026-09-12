# RobloAI

An AI platform for Roblox creators: chat-driven Luau scripting, GUI/scene
editing, marketplace asset import, and live Studio playtests, streamed as a
live thinking + step-card trace, backed by a token-metered billing system,
a Roblox OAuth login, and an MCP server compatible with Claude Code, Claude
Desktop, and other MCP clients.

## Quick start (zero credentials)

The app is designed to run fully without any external accounts — every
integration below falls back to a real, demoable path instead of an error:

- **Auth** falls back to a "Continue as Dev User" mock login (dev-mode
  only — disabled whenever `NODE_ENV=production`).
- **AI chat** falls back to a scripted mock model streaming a canned
  multi-step trace, at the same wire protocol a real model's response uses.
- **Billing** falls back to a mock Stripe client that applies a real
  balance/plan change server-side instead of charging a card.
- **Roblox Studio tools** fall back to deterministic mock results when no
  plugin is paired; marketplace search still hits Roblox's real public
  Catalog API with no credentials required.

Steps:

1. Start Postgres. Either:
   - Local cluster already on this machine: `pg_ctlcluster 16 main start`, or
   - Docker: `docker compose up -d`
2. `cp .env.example .env` and fill in `DATABASE_URL` (see `.env.example` for
   the default local connection string), `AUTH_SECRET`, and `ENCRYPTION_KEY`
   (`openssl rand -base64 32` for both secrets).
3. `npm install`
4. `npm run db:migrate` — applies the Prisma schema.
5. `npm run db:seed` — creates a seeded Pro-tier dev user with a sample
   chat session and two weeks of usage history, so the dashboard and chat
   UI have something to show immediately.
6. `npm run dev` — visit `http://localhost:3000`, click **Sign in with
   Roblox**, then **Continue as Dev User**.

## Adding real credentials

Every external integration reads from environment variables documented in
`.env.example` and activates automatically once set — no code changes
needed:

- **Roblox OAuth**: `ROBLOX_CLIENT_ID` / `ROBLOX_CLIENT_SECRET` from the
  [Creator Dashboard](https://create.roblox.com/dashboard/credentials)
  OAuth tab. Redirect URI: `http://localhost:3000/api/auth/callback/roblox`.
- **Anthropic**: `ANTHROPIC_API_KEY`. Free/Pro/Ultra plans map to Claude
  Haiku 4.5 / Sonnet 5 / Opus 5 respectively (see `lib/tokens/pricing.ts`).
- **Stripe**: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`,
  `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, and one `STRIPE_PRICE_*` per plan/pack.
- **Roblox Studio plugin**: no env var needed on the web app side — see
  `plugin/README.md` for pairing.

## Stack

Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · shadcn/ui ·
Framer Motion · Prisma 7 + Postgres (via the `pg` driver adapter) · Auth.js
v5 (custom Roblox OAuth provider) · Vercel AI SDK v7 + `@ai-sdk/anthropic` ·
Stripe · Recharts · `@modelcontextprotocol/sdk`.

## Architecture

```
Next.js app (chat UI, marketing, billing, dashboard, settings)
        │
        ├── app/api/chat            streams a UIMessage trace (text,
        │                           reasoning, tool calls, a custom
        │                           data-tokenUsage part) via lib/ai/*
        │
        ├── lib/ai/tool-registry.ts one Tool per name — the single
        │       │                   surface shared by chat, MCP, and the
        │       │                   plugin dispatcher
        │       ▼
        ├── lib/bridge/client.ts    routes a tool call to a paired Studio
        │       │                   plugin if connected, else mock
        │       ▼
        ├── app/api/bridge/*        pairing-code auth; BridgeCommand rows
        │       ▲                   are the queue (persisted, not
        │       │                   in-memory — API routes are stateless)
        │       │
        │  plugin/src/Main.server.lua   long-polls, dispatches, executes
        │                               against real Studio services
        │
        └── server/mcp-server.ts    stdio MCP server exposing the exact
                                     same tool-registry to Claude Code /
                                     Claude Desktop / any MCP client
```

Token billing (`lib/tokens/*`) reserves a conservative unit estimate
before streaming, reconciles against actual usage after (Anthropic's
`outputTokenDetails.reasoningTokens` keeps thinking tokens from being
double-billed), and lazily resets/rolls over the monthly cycle on the
first request after it ends — there's no cron job.

## Project layout

- `app/` — `(marketing)` public site, `(chat)` chat UI, `(dashboard)`
  billing/usage, `settings/` (account + Studio plugin pairing), `signin/`,
  `api/*` route handlers.
- `components/` — `marketing/`, `chat/`, `billing/`, `dashboard/`,
  `settings/`, `layout/`, `ui/` (shadcn primitives).
- `lib/` — `auth/`, `ai/` (provider, system prompt, tool registry, mock
  model, request context), `tokens/` (pricing, reserve, reconcile, cycle),
  `billing/` (Stripe wrapper, webhooks, plan/pack price lookup), `bridge/`
  (pairing, queue, client), `marketplace/` (Roblox Catalog client + mock
  fixtures), `luau/` (heuristic validator), `chat/` (server actions),
  `db/` (Prisma client).
- `prisma/` — `schema.prisma`, `seed.ts`, migrations.
- `plugin/` — the Roblox Studio plugin (Luau) — see its own README for
  install/pairing steps and documented platform limitations.
- `server/` — standalone MCP server entry point (`npm run mcp:server`,
  stdio transport).

## Verification

- `npm run lint` / `npx tsc --noEmit` — both clean.
- `npm run build` — production build succeeds; every route compiles.
- Sign in with the dev-mode login, start a chat, confirm the thinking
  block, step cards, and an expandable diff render and the token balance
  updates live.
- Visit `/dashboard`, `/dashboard/billing` (try a mock plan upgrade or
  token-pack purchase), and `/dashboard/history`.
- Visit `/settings/plugin`, generate a pairing code, and confirm
  `POST /api/bridge/{code}/poll` transitions it to "Connected" (the
  real plugin does this automatically once paired inside Studio).
- `npm run mcp:server` and send a `tools/call` JSON-RPC request over
  stdin — `search_marketplace` hits Roblox's live Catalog API with no
  credentials required.
