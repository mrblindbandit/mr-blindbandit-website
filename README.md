# Blindbandit Records — Website

[![Live production](https://img.shields.io/badge/production-mrblindbandit.net-gold?style=flat-square)](https://mrblindbandit.net)
[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-mrblindbandit.github.io-2088FF?style=flat-square&logo=github)](https://mrblindbandit.github.io/)
[![Visibility](https://img.shields.io/badge/repo-public-brightgreen?style=flat-square)](https://github.com/mrblindbandit/mr-blindbandit-website)
[![Stack](https://img.shields.io/badge/stack-Vinext%20%7C%20Cloudflare%20Worker%20%7C%20D1%20%7C%20R2-0A66C2?style=flat-square)](#architecture)
[![Auth](https://img.shields.io/badge/auth-Clerk-6C47FF?style=flat-square)](#authentication)
[![Realtime](https://img.shields.io/badge/realtime-LiveKit-1FA2FF?style=flat-square)](#communications--livekit)
[![Mobile](https://img.shields.io/badge/companion-iOS%20%26%20Android-111111?style=flat-square)](https://github.com/mrblindbandit/mr-blindbandit-mobile)

> Official web platform for **Mr. Blindbandit / Blindbandit Records** — music label operations, public brand site, accessibility-first creator tools, and the **Blindbandit Mobile** social + communications layer.

**Production:** [https://mrblindbandit.net](https://mrblindbandit.net)  
**Static mirror (GitHub Pages):** [https://mrblindbandit.github.io/](https://mrblindbandit.github.io/)  
**Business contact:** [business@mrblindbandit.net](mailto:business@mrblindbandit.net)  
**Owner / ops:** [kheckfinancial@gmail.com](mailto:kheckfinancial@gmail.com)

---

## Table of contents

1. [Overview](#overview)
2. [Live surfaces](#live-surfaces)
3. [Product features](#product-features)
4. [Architecture](#architecture)
5. [Repository layout](#repository-layout)
6. [Tech stack](#tech-stack)
7. [Authentication](#authentication)
8. [Platform API](#platform-api)
9. [Database migrations](#database-migrations)
10. [Communications (LiveKit)](#communications--livekit)
11. [Push notifications](#push-notifications)
12. [Label portal (Label OS)](#label-portal-label-os)
13. [Blindbandit Mobile (`/mobile`)](#blindbandit-mobile-mobile)
14. [Legal, trust & compliance](#legal-trust--compliance)
15. [SEO, accessibility & brand](#seo-accessibility--brand)
16. [Hosting secrets (names only)](#hosting-secrets-names-only)
17. [Local development](#local-development)
18. [Build, test & deploy](#build-test--deploy)
19. [GitHub Pages vs production](#github-pages-vs-production)
20. [Related repositories](#related-repositories)
21. [Security practices](#security-practices)
22. [Operations checklist](#operations-checklist)
23. [Changelog & docs index](#changelog--docs-index)
24. [Support](#support)

---

## Overview

This repository is the **full source** for the Blindbandit Records website and Worker backend. It powers:

- A **public music / label brand site** (biography, releases, press, tools, localized pages)
- An **internal Label OS** (`/portal`) for roster, releases, campaigns, contracts, compliance, and moderation bridges
- **Blindbandit Mobile** (`/mobile`) — open social network with profiles, posts, messaging, calls, monetization, verification, and Social Admin
- A **versioned Platform API** under `/api/v1` (and `/v1`) for web + native apps
- **Clerk** identity for social/mobile; production secrets on Cloudflare / OpenAI Sites
- **LiveKit** for realtime voice/video
- **Web Push (VAPID) + FCM + APNs** wiring for notifications
- **Cloudflare D1** (SQL) + **R2** (objects) bindings

The companion native apps live in [`mr-blindbandit-mobile`](https://github.com/mrblindbandit/mr-blindbandit-mobile) (iOS + Android flagship with Clerk + LiveKit).

---

## Live surfaces

| Surface | URL | Notes |
|---|---|---|
| Production site | https://mrblindbandit.net | Full Worker + D1 + secrets |
| API (same Worker) | https://mrblindbandit.net/api/v1 | Alias also `/v1` |
| Documented API host | https://api.mrblindbandit.net/v1 | CORS-ready alias |
| OpenAPI | https://mrblindbandit.net/openapi.json | Machine-readable |
| Human API docs | https://mrblindbandit.net/docs | Operator-facing |
| GitHub Pages mirror | https://mrblindbandit.github.io/ | Static `public/` only |
| Mobile social | https://mrblindbandit.net/mobile/ | SPA + APIs |
| Social Admin | https://mrblindbandit.net/mobile/admin/ | Moderator Clerk accounts |
| Label Portal | https://mrblindbandit.net/portal/ | Internal Label OS |
| Privacy | https://mrblindbandit.net/privacy/ | Legal center entry |
| Mobile privacy / T&S | `/mobile/privacy/`, `/mobile/trust-safety/` | Product-specific policies |

---

## Product features

### Public brand & music

- Artist biography, story, timeline, press kit, booking & contact flows
- Music catalog hubs (albums, EPs, singles, listening / mood guides)
- Spotify-oriented showcase data (`data/spotify.json`) and mobile profile music tabs
- Creator and fan guides, FAQ, resources, journal / essays
- Localization samples (`/fil/`, `/ceb/`, `/es/`, language helpers)
- Google AdSense hooks on appropriate marketing pages (never on legal/auth/admin)

### Creator & media tools

Browser media suite under `/media-tools/` and related audio utilities:

- Converters, clipper, compressor, equalizer, fade, loop, pitch, reverse, silence, speed, volume
- Audiogram, waveform image, art-track / artwork resizer, metadata editor
- Everyday planning tools (`/tools/*`) — planners, checklists, calculators, press brief, royalty split helpers

### Community & social

- Public community area + **Blindbandit Mobile** open signup (Clerk Google / email)
- Profiles, posts, follows, explore/feed
- Direct messages, voice/video calls (LiveKit tokens)
- Verification program & monetization / ads marketplace surfaces
- Verified artist profile for Mr. Blindbandit with posts, cover, and music tabs

### Label operations

Deep **Label Portal** desks spanning roster, releases, campaigns, press, legal holds, budgets, royalties, compliance, security, accessibility QA, vendor register, and more — see [Label portal](#label-portal-label-os).

### Trust, safety & legal

- Expanded Terms, Privacy, Cookies, Community Guidelines, Safety, Copyright, Media Suite terms
- Blindbandit **Legal Master Package** merged into public + mobile policies
- Internal operating procedures kept **off** public routes
- Social Admin: ban / suspend / moderate, content controls, device & push inspection hooks, LiveKit force-disconnect patterns

---

## Architecture

```text
┌─────────────────────────────────────────────────────────────┐
│  Clients                                                    │
│  Browser (public + portal + /mobile) · iOS · Android        │
└───────────────────────────┬─────────────────────────────────┘
                            │ HTTPS
┌───────────────────────────▼─────────────────────────────────┐
│  Cloudflare Worker (Vinext / this repo `worker/`)           │
│  • Static public assets                                     │
│  • Private HTML gated after auth                            │
│  • Platform API `/api/v1/*`                                 │
│  • Clerk session verification                               │
│  • LiveKit token minting                                    │
│  • Push fan-out (VAPID / FCM / APNs)                        │
└───────┬───────────────────┬───────────────────┬─────────────┘
        │                   │                   │
   ┌────▼────┐         ┌────▼────┐         ┌────▼────┐
   │ D1 SQL  │         │   R2    │         │ Externals│
   │ drizzle │         │ media   │         │ Clerk    │
   │ 0000–08 │         │ assets  │         │ LiveKit  │
   └─────────┘         └─────────┘         │ Firebase │
                                           │ Resend   │
                                           │ Stripe   │
                                           └──────────┘
```

**Important:** GitHub Pages serves only the static frontend. Auth, D1 writes, LiveKit, and push require the production Worker with secrets configured.

---

## Repository layout

```text
mr-blindbandit-website/
├── app/                    # Next/Vinext app routes (sign-in, account shells)
├── worker/                 # Cloudflare Worker entry + domain modules
│   ├── index.ts
│   ├── clerk-auth.ts
│   ├── portal*.ts
│   ├── platform/           # Social, LiveKit, notifications, admin, API
│   ├── private-pages.ts    # Auth-gated HTML bundles
│   └── site-pages.ts
├── public/                 # Static HTML/CSS/JS (brand, portal, mobile, tools)
│   ├── mobile/             # Social product UI
│   ├── portal/             # Label OS desks
│   ├── assets/             # Brand imagery, release art
│   └── …                   # Marketing, legal, media tools, locales
├── drizzle/                # Additive SQL migrations (0000–0008)
├── db/                     # Drizzle schema modules
├── data/                   # Catalog, compliance package, Spotify, workspace JSON
├── docs/                   # API, push, portal, legal master package, phase notes
├── scripts/                # Build, SEO, portal generation, shell expansion, legal merge
├── components/ · lib/      # UI primitives / utilities
├── services/               # e.g. media worker runner
├── tests/                  # Node test suite
├── HOSTING_SECRETS.md      # Secret NAMES only (never values)
├── CHANGELOG.md
└── .openai/hosting.json    # Sites project bindings (D1, R2)
```

---

## Tech stack

| Layer | Choice |
|---|---|
| Runtime | Cloudflare Worker via Vinext / Vite |
| UI | Static HTML + progressive JS; React/Next pieces in `app/` |
| Auth | **Clerk** (production) for social/mobile; portal Clerk sign-in |
| Database | Cloudflare **D1** + Drizzle ORM |
| Object storage | Cloudflare **R2** |
| Realtime | **LiveKit** |
| Push | Web Push **VAPID**, Android **FCM**, iOS **APNs** |
| Email | Resend (portal / transactional) |
| Payments | Stripe integration docs + portal payment desks |
| Language | TypeScript, Python build/content scripts |
| Node | `>= 22.13.0` (see `package.json` engines) |

---

## Authentication

### Social / Mobile (open signup)

- **Clerk** production project for `mrblindbandit.net`
- Enabled: **Email** + **Google**
- Disabled for now: **Sign in with Apple** (no Apple Developer requirement yet)
- Phone: not required on free Clerk plans
- Mobile OAuth redirect allowlist includes `blindbandit://oauth-callback`
- Social API access: any **verified Clerk** session (`social` auth model)

### Label Portal

- Professional **Clerk production** sign-in (“Sign in with your production Clerk account”)
- Server-enforced roles; invitation / membership checks remain authoritative
- Private portal HTML is compiled into `worker/private-pages.ts` and stripped from static deploy archives so assets cannot bypass Worker guards

### Admin allow-list

Social Admin recognizes moderator emails via secrets / code, including:

- `kheckfinancial@gmail.com`
- `business@mrblindbandit.net`
- plus `COMMUNITY_MODERATOR_EMAIL` / `CLERK_ADMIN_EMAIL` when set

---

## Platform API

Base URLs:

- `https://mrblindbandit.net/api/v1`
- `https://mrblindbandit.net/v1`
- `https://api.mrblindbandit.net/v1`

Envelope shape:

```json
{
  "success": true,
  "data": {},
  "meta": { "request_id": "…", "api_version": "v1" }
}
```

### Auth models

| Access | How |
|---|---|
| `public` | No auth |
| `social` | Verified Clerk (Google/email) — Blindbandit Mobile |
| `user` / `owner` | Label session or `Authorization: Bearer bb_…` |
| `worker` | Media worker bearer |

### Highlight routes

| Area | Examples |
|---|---|
| System | `GET /system/health` |
| Social | feed, profiles, posts, follow, messages, calls, verification, monetization, ads, Spotify |
| LiveKit | `GET /livekit/status`, `POST /livekit/token` |
| Push | VAPID public key, web register, device register/unregister, topics, test notify |
| Portal | dashboard digest, label tools |
| Admin | social moderation endpoints backing `/mobile/admin/` |

Full tables: [`docs/API.md`](docs/API.md).

---

## Database migrations

Apply **additively** in order. Never edit previously applied migration files.

| Migration | Purpose |
|---|---|
| `0000`–`0004` | Core / historical schema |
| `0005_platform_foundation` | Platform foundation |
| `0006_platform_media_jobs` | Media jobs |
| **`0007_social_mobile_platform`** | Social/mobile tables (profiles, posts, devices, …) |
| **`0008_social_admin_moderation`** | Admin/moderation + audit |

After importing this repo to Sites/Cloudflare, apply **0007 then 0008** on D1 so social/admin features can persist data. Saving Worker secrets alone does not create tables.

Generate new migrations (operators only):

```bash
npm run db:generate
```

---

## Communications & LiveKit

Worker secrets:

- `LIVEKIT_URL` — `wss://…`
- `LIVEKIT_API_KEY`
- `LIVEKIT_API_SECRET` (server only)

Capabilities:

- Social call start/join/end with minted room tokens
- Status probe: `GET /api/v1/livekit/status`
- Token mint: `POST /api/v1/livekit/token`
- Native apps use the same owner LiveKit project for voice, video, DMs data channels

---

## Push notifications

| Channel | Secrets / config |
|---|---|
| Web Push | `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` |
| Android FCM | `FCM_PROJECT_ID`, `FCM_SERVICE_ACCOUNT_JSON` (package `net.mrblindbandit.app`) |
| iOS APNs | `APNS_TEAM_ID`, `APNS_KEY_ID`, `APNS_BUNDLE_ID`, `APNS_PRIVATE_KEY` |

Device registration:

- Social apps: `POST /api/v1/social/devices` (and unregister)
- Web: `/api/v1/push/web/register` after reading VAPID public key

See [`docs/PUSH_IOS_ANDROID.md`](docs/PUSH_IOS_ANDROID.md) and [`HOSTING_SECRETS.md`](HOSTING_SECRETS.md).

**Still often pending in ops:** FCM service-account JSON on the Worker, and Apple APNs `.p8` once Apple Developer is available.

---

## Label portal (Label OS)

Internal operating system for Blindbandit Records staff/owners:

- Roster intake, artist onboarding, release plans, campaign plans, press outreach
- Approval queues, legal holds, budgets, asset register, knowledge base
- Royalties, recoupment, contracts, invoices, earnings
- Compliance, privacy casework, security training, incident log
- Community accounts bridge → Social Admin
- Notifications center + dashboard API (`GET /api/portal/dashboard`)

Portal pages are substantial Label OS desks (not empty shells). Sensitive actions are audited and role-gated.

---

## Blindbandit Mobile (`/mobile`)

Public product routes (enhanced by `mobile.js` / `admin.js`):

| Path | Role |
|---|---|
| `/mobile/` | Feed / home |
| `/mobile/explore/` | Discovery |
| `/mobile/messages/` | Messaging |
| `/mobile/calls/` | Calling |
| `/mobile/u/{handle}/` | Profiles (e.g. `/mobile/u/mrblindbandit/`) |
| `/mobile/verification/` | Verification program |
| `/mobile/monetization/` | Creator monetization |
| `/mobile/settings/` | User settings |
| `/mobile/admin/` | Social Admin |
| `/mobile/about/`, `/privacy/`, `/trust-safety/` | Product policies |

Anyone can create a Clerk account and participate (subject to Trust & Safety).

---

## Legal, trust & compliance

- Public legal center: `/legal/`, `/privacy/`, `/terms/`, `/cookies/`, `/safety/`, `/community-guidelines/`
- Mobile-specific policies under `/mobile/*`
- Source package: `docs/legal-master-package/` + `data/compliance-package.json`
- Merge tooling: `scripts/legal_master_merge.py`
- **Internal** procedures stay private — do not publish ops handbooks on public routes

---

## SEO, accessibility & brand

- SEO generation via `scripts/seo.py` — unique titles/descriptions, canonicals, OG/Twitter, JSON-LD, breadcrumbs, public-only sitemap
- `robots.txt` allows public crawl; account/private pages stay noindex
- Accessibility-first posture (screen-reader friendly structure, dedicated `/accessibility/` guides)
- Brand assets: gold Blindbandit Records logo, artist imagery under `public/assets/`
- AdSense: marketing pages only — never legal, auth, messages, calls, or admin

---

## Hosting secrets (names only)

Configure on **Cloudflare Worker / OpenAI Sites**. **Never commit values.**

| Group | Names |
|---|---|
| Clerk | `CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY` |
| LiveKit | `LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET` |
| Web Push | `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` |
| FCM | `FCM_PROJECT_ID`, `FCM_SERVICE_ACCOUNT_JSON` |
| APNs | `APNS_TEAM_ID`, `APNS_KEY_ID`, `APNS_BUNDLE_ID`, `APNS_PRIVATE_KEY` |
| Platform | `PLATFORM_VAULT_KEY`, `COMMUNITY_MODERATOR_EMAIL`, `CLERK_ADMIN_EMAIL` |
| Common | `RESEND_API_KEY`, `PORTAL_EMAIL_FROM`, Stripe keys, D1 `DB`, R2 `BUCKET` |

Full checklist: [`HOSTING_SECRETS.md`](HOSTING_SECRETS.md).

Bindings reference: [`.openai/hosting.json`](.openai/hosting.json).

---

## Local development

```bash
# Requirements: Node.js >= 22.13
git clone https://github.com/mrblindbandit/mr-blindbandit-website.git
cd mr-blindbandit-website

npm run install:ci   # or npm ci / project install helper
npm run dev          # Vite + Wrangler log path
```

Useful scripts:

| Script | Purpose |
|---|---|
| `npm run dev` | Local Vite/Worker dev |
| `npm run build` | Verified production build |
| `npm start` | Vinext start |
| `npm test` | Build + Node tests |
| `npm run lint` | ESLint via sites env |
| `npm run db:generate` | Drizzle generate |

Content / portal rebuild examples:

```bash
python scripts/portal.py
python scripts/seo.py
python scripts/expand_thin_shells.py
```

Copy secret **names** from `HOSTING_SECRETS.md` into your local `.env` / Wrangler secrets — keep `.env*` gitignored.

---

## Build, test & deploy

### Production (Sites / Cloudflare)

1. Import or sync this repository to your Sites project (preserve vault key + moderator settings).
2. Set Worker secrets from `HOSTING_SECRETS.md`.
3. Apply D1 migrations through **0008** (especially **0007** and **0008** if upgrading).
4. Deploy Worker + assets.
5. Verify:
   - `GET /api/v1/system/health`
   - `GET /api/v1/livekit/status`
   - `GET /api/v1/push/web/vapid-public-key`
   - Social Admin at `/mobile/admin/` with a moderator Clerk account

Build must keep running `scripts/protect-private-pages.mjs` so private HTML is absent from public static archives.

### GitHub Pages (static mirror)

The user site [mrblindbandit/mrblindbandit.github.io](https://github.com/mrblindbandit/mrblindbandit.github.io) publishes `public/` to:

**https://mrblindbandit.github.io/**

That mirror is excellent for browsing marketing/mobile shells; it does **not** replace production APIs.

---

## GitHub Pages vs production

| Capability | GitHub Pages | Production Worker |
|---|---|---|
| Static HTML/CSS/JS | ✅ | ✅ |
| Clerk sessions / social write APIs | ❌ | ✅ |
| D1 persistence | ❌ | ✅ |
| LiveKit tokens | ❌ | ✅ |
| Push send | ❌ | ✅ |
| Private portal HTML gating | ❌ | ✅ |

Use Pages for public source transparency and a static preview; use `mrblindbandit.net` for the real product.

---

## Related repositories

| Repo | Role |
|---|---|
| [`mrblindbandit/mr-blindbandit-website`](https://github.com/mrblindbandit/mr-blindbandit-website) | This repo — full website + Worker |
| [`mrblindbandit/mrblindbandit.github.io`](https://github.com/mrblindbandit/mrblindbandit.github.io) | Public GitHub Pages deploy of `public/` |
| [`mrblindbandit/mr-blindbandit-mobile`](https://github.com/mrblindbandit/mr-blindbandit-mobile) | iOS + Android flagship apps (Clerk + LiveKit) |

---

## Security practices

- Secrets never in git, client JS, ChatGPT zip exports, or README values
- `.gitignore` blocks `.env*`, PEMs, `google-services.json`, service accounts, local secret dumps
- Private pages compiled + stripped from static deploy
- Financial / account APIs enforce authorization server-side regardless of UI
- Platform vault key encrypts sensitive device tokens at rest when configured
- Prefer Clerk over legacy email OTP / authenticator flows for new social identity
- Report security issues privately to **business@mrblindbandit.net** (see `/security-reporting/` on production)

---

## Operations checklist

- [ ] Clerk production keys set; Google + Email on; Apple off until ready
- [ ] LiveKit URL + API key/secret set; `/livekit/status` → configured
- [ ] VAPID keys set; browser can fetch public key
- [ ] FCM service account JSON set for Android
- [ ] APNs `.p8` + team/key/bundle set when Apple Developer available
- [ ] D1 migrations applied through `0008`
- [ ] R2 bucket bound
- [ ] Moderator emails can open `/mobile/admin/`
- [ ] Custom domain TLS healthy on `mrblindbandit.net`
- [ ] Mobile apps point at production API base
- [ ] No secrets in the latest export zip / GitHub tree

---

## Changelog & docs index

- [`CHANGELOG.md`](CHANGELOG.md) — release notes (shell expansion, portal deepen, legal merge, social platform, …)
- [`docs/API.md`](docs/API.md) — Platform API
- [`docs/PUSH_IOS_ANDROID.md`](docs/PUSH_IOS_ANDROID.md) — Mobile push
- [`docs/label-portal.md`](docs/label-portal.md) — Portal guide
- [`docs/platform-backend-status.md`](docs/platform-backend-status.md) — Backend status
- [`docs/legal-master-package/`](docs/legal-master-package/) — Legal package + merge report
- [`docs/stripe-integration.md`](docs/stripe-integration.md) — Payments
- Phase / audit notes under `docs/*phase*`, `docs/priorities-*`, `docs/compliance-*`

---

## Support

| Need | Contact |
|---|---|
| Business / label | business@mrblindbandit.net |
| Technical owner | kheckfinancial@gmail.com |
| Public site | https://mrblindbandit.net |
| Source issues | GitHub Issues on this repository |

---

## License & brand

Site content, Blindbandit Records branding, and artist materials are © Blindbandit Records / Mr. Blindbandit unless otherwise noted. Third-party libraries retain their own licenses (see `vendor/`, dependency licenses).

**Do not** publish production secret values in issues, PRs, or forks.

---

*Blindbandit Records — accessibility-first music, label operations, and communications.*
