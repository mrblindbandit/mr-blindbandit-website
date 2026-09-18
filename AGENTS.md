# AGENTS.md — Blindbandit Website

Instructions for coding agents (Cursor, ChatGPT, Copilot, Claude, etc.) working in this repository.

## For other AIs

**Start here for work history:** [`AI_CHANGELOG.md`](./AI_CHANGELOG.md) — full day log of AI-assisted changes across Blindbandit GitHub.

## What this repo is

Full source for **Blindbandit Records** web platform:

- Public brand site, Label Portal (`/portal`), Blindbandit Mobile social (`/mobile`)
- Worker/API under `worker/` (Platform API `/api/v1`)
- D1 migrations in `drizzle/` (through `0008`)

## Production host (critical)

**ChatGPT Sites (OpenAI Sites)** — custom domain **https://mrblindbandit.net**

Do **not** describe production as “hosted on Cloudflare” as the product host. Sites provides Worker + D1 + R2 + secrets. GitHub Pages (`https://mrblindbandit.github.io/`) is a **static mirror** of `public/` only.

## Related repos

| Repo | Role |
|---|---|
| `mrblindbandit/mr-blindbandit-website` | This repo |
| `mrblindbandit/mrblindbandit.github.io` | Static Pages mirror |
| `mrblindbandit/mr-blindbandit-mobile` | iOS + Android apps |
| `mrblindbandit/mrblindbandit` | GitHub profile README |

## Auth & integrations

- **Clerk**: email + Google on; Apple off for now
- **LiveKit**: realtime voice/video tokens from Worker
- **Push**: VAPID + FCM + APNs (secrets on Sites — see `HOSTING_SECRETS.md` names only)
- Owner/admin emails include `kheckfinancial@gmail.com`, `business@mrblindbandit.net`

## Hard rules

1. Never commit secrets (`.env`, PEMs, service-account JSON, Clerk `sk_`, LiveKit secrets)
2. Migrations are **additive only** — never rewrite applied SQL
3. Do not wipe legal / privacy / trust-safety pages
4. Keep private portal HTML protected (`protect-private-pages` build step)
5. No AdSense on legal, auth, admin, messages, or calls pages
6. Prefer updating `AI_CHANGELOG.md` when you make substantial AI-assisted changes

## Read next

- `README.md` — overview
- `docs/ARCHITECTURE.md` — Sites architecture
- `docs/API.md` + `docs/openapi.json`
- `AI_CHANGELOG.md` — what AI agents already changed
- `SECURITY.md` — vulnerability reporting

## Contact

business@mrblindbandit.net
