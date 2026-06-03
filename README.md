# Pastel Tetris 🟪🟦🟩

A modern, pastel-themed Tetris built with **Next.js + Prisma + Neon**, ready to
deploy on **Vercel**.

- 🎮 Full guideline Tetris — SRS rotation & wall kicks, 7-bag randomizer, hold,
  ghost piece, next queue, T-spins, combos, back-to-back, soft/hard drop.
- 🎨 Modern pastel UI with a **light/dark** toggle (no flash on load).
- 🔊 Synthesized sound effects + optional background music (Web Audio — no audio
  files), with a mute toggle.
- 🧑‍🤝‍🧑 **Multiplayer 1v1** via public lobbies: pick a duration (1m / 3m / 5m),
  most points before the clock runs out wins. Real-time via **Pusher** (with a
  polling fallback).
- 🏆 **Separate top-10 leaderboards** for single-player and multiplayer, written
  automatically at the end of each game. Your username is remembered per session.

## Tech

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · Prisma 7
(Neon serverless driver adapter) · Pusher Channels · Zustand · Framer Motion ·
Vitest. The game board renders on `<canvas>`; the framework-agnostic engine
lives in [src/lib/engine/](src/lib/engine/) and is unit-tested.

## Prerequisites

- Node 20+ and npm.
- A **Neon** Postgres database (free tier is fine). You need two connection
  strings: the **pooled** one (`-pooler` host) and the **direct** one.
- _(Optional but recommended)_ A free **Pusher Channels** app for instant
  real-time updates. Without it, multiplayer still works via ~1.5s polling.

## Local development

```bash
npm install
cp .env.example .env          # then fill in the values (see below)
npm run db:push               # create the tables in your Neon database
npm run db:seed               # optional: add a few demo leaderboard rows
npm run dev                   # http://localhost:3000
```

### Environment variables (`.env`)

| Variable | Required | Notes |
| --- | --- | --- |
| `DATABASE_URL` | ✅ | Neon **pooled** connection (the `-pooler` host). |
| `DIRECT_URL` | ✅ | Neon **direct** (non-pooled) connection — used by `prisma db push`. |
| `NEXT_PUBLIC_PUSHER_KEY` | – | Pusher app key (public). |
| `NEXT_PUBLIC_PUSHER_CLUSTER` | – | Pusher cluster, e.g. `us2`. |
| `PUSHER_APP_ID` | – | Pusher app id (server). |
| `PUSHER_SECRET` | – | Pusher secret (server). |
| `CRON_SECRET` | – | Guards the optional `/api/lobbies/cleanup` endpoint. |

> If you use the **Neon × Vercel** integration, the direct URL may be provided as
> `DATABASE_URL_UNPOOLED` / `POSTGRES_URL_NON_POOLING` — `prisma.config.ts`
> already falls back to those names.

## Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Start the dev server. |
| `npm run build` | `prisma generate && prisma db push && next build` (used by Vercel). |
| `npm run db:push` | Sync the Prisma schema to the database. |
| `npm run db:seed` | Seed demo leaderboard scores. |
| `npm run db:studio` | Open Prisma Studio. |
| `npm run test` | Run the engine unit tests (Vitest). |
| `npm run lint` | Lint. |

## Deploy to Vercel

1. Push this repo to GitHub and **Import** it in Vercel.
2. Add the environment variables above in **Project → Settings → Environment
   Variables** (or connect the Neon integration for the DB ones).
3. Deploy. The build command (`npm run build`) runs `prisma generate`, then
   `prisma db push` to create/update the tables, then `next build`.

That's it — no separate migration step. The game timing is server-authoritative
and matches finalize lazily, so no background workers are required.

### Optional: stale-lobby cron

Correctness doesn't need it (abandoned lobbies are hidden from the list and
expired matches finalize on read), but on a Vercel **Pro** plan you can schedule
cleanup by adding a `vercel.json`:

```json
{ "crons": [{ "path": "/api/lobbies/cleanup", "schedule": "*/10 * * * *" }] }
```

Set `CRON_SECRET` so the endpoint is protected.

## Controls

`←/→` move · `↓` soft drop · `Space` hard drop · `↑` or `X` rotate CW · `Z`
rotate CCW · `C` or `Shift` hold · `P` / `Esc` pause.
