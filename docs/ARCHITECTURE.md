# Architecture — Blindbandit Website

## Production host: ChatGPT Sites

The **canonical production deployment** is on **ChatGPT Sites** (OpenAI Sites), custom domain:

**https://mrblindbandit.net**

Sites provides the managed Worker runtime, static asset hosting, **D1** database binding, and **R2** object binding configured via `.openai/hosting.json`. Operators set secrets in the Sites project (see `HOSTING_SECRETS.md`). This is **not** a separate “self-managed Cloudflare dashboard” deployment — even though the Sites runtime is Worker-compatible.

GitHub Pages (`https://mrblindbandit.github.io/`) is a **static mirror** of `public/` only.

```text
                    ┌──────────────────────────┐
   Browsers / Apps  │  ChatGPT Sites project   │
  ─────────────────►│  mrblindbandit.net       │
                    │  • Worker (this repo)    │
                    │  • Static public/        │
                    │  • D1 (drizzle)          │
                    │  • R2 bucket             │
                    │  • Sites secrets vault   │
                    └────────────┬─────────────┘
                                 │
              ┌──────────────────┼──────────────────┐
              ▼                  ▼                  ▼
           Clerk              LiveKit         FCM / APNs / VAPID
         (identity)          (realtime)         (push)
```

## Request classes

1. **Public static** — HTML/CSS/JS under `public/` (marketing, tools, legal shells)
2. **Private HTML** — compiled into `worker/private-pages.ts`, returned only after auth
3. **Platform API** — `/api/v1/*` and `/v1/*` JSON (social, LiveKit, push, portal)
4. **Portal APIs** — label OS endpoints (`worker/portal*.ts`)

## Auth models

| Model | Used by | Mechanism |
|---|---|---|
| `public` | Feeds, health, VAPID public key | None |
| `social` | Blindbandit Mobile | Verified **Clerk** session (Google / email) |
| `user` / `owner` | Label portal / mobile API sessions | Portal session or `Bearer bb_…` |
| `worker` | Media worker | Shared bearer |

## Data

- **D1** — relational state (profiles, posts, devices, moderation, portal tables)
- **R2** — media / object storage
- Migrations live in `drizzle/0000`–`0008` (+ future additive files)
- Critical social pair: **`0007_social_mobile_platform`**, **`0008_social_admin_moderation`**

## Key modules (`worker/`)

| Path | Responsibility |
|---|---|
| `worker/index.ts` | Worker entry / routing |
| `worker/clerk-auth.ts` | Clerk verification helpers |
| `worker/platform/api.ts` | `/api/v1` surface |
| `worker/platform/social.ts` | Social graph, posts, messages, calls |
| `worker/platform/social-admin.ts` | Ban/suspend/moderation |
| `worker/platform/livekit.ts` | Token minting / status |
| `worker/platform/notifications.ts` | Push fan-out |
| `worker/portal*.ts` | Label OS |
| `worker/private-pages.ts` | Auth-gated HTML |

## Client surfaces

| Path | Role |
|---|---|
| `/` + marketing trees | Public brand site |
| `/mobile/*` | Social product SPA |
| `/mobile/admin/` | Social Admin |
| `/portal/*` | Internal Label OS |
| Native apps | `mr-blindbandit-mobile` → same Sites API |

## Trust boundaries

- Secrets only in **ChatGPT Sites** secret storage — never in git
- Private portal documents must not ship in public static archives (`protect-private-pages.mjs`)
- Admin actions server-enforced; UI is not the security boundary
- GitHub Pages has **no** D1/Clerk/LiveKit — do not treat it as production

## Verify after deploy (Sites)

```http
GET /api/v1/system/health
GET /api/v1/livekit/status
GET /api/v1/push/web/vapid-public-key
```

Then open `/mobile/admin/` with a moderator Clerk account.
