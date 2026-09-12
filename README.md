# RobloAI

An AI platform for Roblox creators: chat-driven Luau scripting, GUI/scene
editing, marketplace asset import, and live Studio playtests, backed by a
token-metered billing system and a Roblox OAuth login.

This repo is under active build-out across phases; see
`.claude` session history / commit log for what's landed so far.

## Quick start (zero credentials)

The app is designed to run fully without any external accounts:

- **Auth** falls back to a "Continue as Dev User" mock login.
- **AI chat** falls back to a scripted mock model streaming a canned trace.
- **Billing** falls back to a mock Stripe client (no real charges).
- **Roblox Studio tools** fall back to deterministic mock results when no
  plugin is paired.

Steps:

1. Start Postgres. Either:
   - Local cluster already on this machine: `pg_ctlcluster 16 main start`, or
   - Docker: `docker compose up -d`
2. `cp .env.example .env` and fill in `DATABASE_URL` (see `.env.example` for
   the default local connection string), `AUTH_SECRET`, and `ENCRYPTION_KEY`
   (`openssl rand -base64 32` for both secrets).
3. `npm install`
4. `npm run db:migrate` — applies the Prisma schema.
5. `npm run db:seed` — creates a seeded dev user with a Pro-tier token
   balance so billing UI has something to show immediately.
6. `npm run dev` — visit `http://localhost:3000`.

## Adding real credentials

Every external integration reads from environment variables documented in
`.env.example` and activates automatically once set — no code changes
needed:

- **Roblox OAuth**: `ROBLOX_CLIENT_ID` / `ROBLOX_CLIENT_SECRET` from the
  [Creator Dashboard](https://create.roblox.com/dashboard/credentials)
  OAuth tab. Redirect URI: `http://localhost:3000/api/auth/callback/roblox`.
- **Anthropic**: `ANTHROPIC_API_KEY`.
- **Stripe**: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`,
  `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, and one `STRIPE_PRICE_*` per plan/pack.

## Stack

Next.js (App Router) · TypeScript · Tailwind CSS · shadcn/ui · Prisma +
Postgres · Auth.js v5 (custom Roblox OAuth provider) · Vercel AI SDK +
Anthropic · Stripe · Framer Motion · Recharts.

## Project layout

- `app/` — routes: `(marketing)` public site, `(chat)` chat UI,
  `(dashboard)` billing/usage, `settings/`, `api/*` route handlers.
- `components/` — `marketing/`, `chat/`, `billing/`, `dashboard/`, `ui/`
  (shadcn primitives).
- `lib/` — `auth/`, `ai/`, `tokens/`, `billing/`, `bridge/`, `marketplace/`,
  `mcp/`, `db/`.
- `prisma/` — `schema.prisma`, `seed.ts`, migrations.
- `plugin/` — the Roblox Studio plugin (Luau).
- `server/` — standalone MCP server entry point (stdio transport).
