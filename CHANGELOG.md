# Changelog — Expand all thin HTML shells (2026-09-18, Asia/Manila)

## Summary

Bulk-expanded **all** thin `public/**/index.html` shells so every page has ≥1200 visible characters of readable text (scripts/styles stripped). Prefer ≥2000. Success: **0** thin pages remaining.

## Scope

- **Before:** 155 thin pages (~140 `/portal/*`, ~10 `/mobile/*`, 5 other: community account/dashboard/moderation, owner inbox, support payment)
- **After:** 0 thin pages (307 ≥2000 chars; 1 in 1200–1999 band)
- Portal desks: static Label OS guidance (purpose, checklist, fields, empty state, related links, Clerk sign-in copy on auth surfaces) injected beside `data-label-portal` so HTML is useful without JS; workspace.js enhancements still load
- Mobile SPA routes: standalone nav + section copy inside `#mb-main` while `mobile.js` may enhance after load
- Community / owner / support payment shells expanded similarly
- Regenerated `worker/private-pages.ts` and `worker/site-pages.ts` from expanded HTML
- Legal master package content not wiped; no secrets added
- AdSense rules unchanged (not added to portal private / auth / messages / calls / admin)

## Tooling

- `scripts/expand_thin_shells.py` — template + per-route title/blurb/module map

## Zip

Rebuild `/workspace/site-src/mr-blindbandit-for-chatgpt.zip` without secrets; keep `.openai/hosting.json`.

---

# Changelog — Label OS portal deepen + public landings (2026-09-18, Asia/Manila)

## Summary

Deepened the **internal Blindbandit Records label portal** into a fuller Label OS with priority desk UX, notifications center, Social Admin bridge, and dashboard digest API. Added missing public **/fans/** and **/tools/** landings. Legal pages preserved (no wipe). No new secrets. No destructive migrations (dashboard synthesizes from existing tables).

## Portal modules deepened

- **Priority workspace desks**: roster-intake, artist-onboarding, release-plans, campaign-plans, press-outreach, approval-queue, legal-holds, budgets, asset-register, knowledge-base, decision-log, risk-register, label-calendar — richer empty states, sample patterns, owner/due filters, status badges, related-module links (`public/workspace.js`)
- **Community accounts**: stats, search/status filters, empty state, links to `/mobile/admin/`, `/mobile/`, moderation casework (`public/operations.js`)
- **Notifications center**: new `/portal/notifications/` + nav entry; overview command board
- **Advertising placements**: hero + links to disclosure, asset register, Social Admin ads review
- **Earnings / contracts / tasks**: clearer empty-state guidance
- **API**: `GET /api/portal/dashboard` (`worker/portal-dashboard.ts`) — priority counts, due-soon, activity, synthesized notifications, social bridges
- Clerk production sign-in copy kept professional

## Public pages

- **Expanded (new landings)**: `/fans/`, `/tools/` (professional hubs with branding assets)
- **Mobile SPA**: messages empty state uses branded empty art + explore link
- **Left as intentional SPA shells**: `/portal/*` (except content rendered by JS), `/mobile/*` route shells that load `mobile.js` / `admin.js`, `/owner/inbox/`, `/support/payment/`, community account/dashboard/moderation shells
- Content marketing pages already ≥800 chars visible text were left intact; legal pages not rewritten

## Zip

Rebuild `/workspace/site-src/mr-blindbandit-for-chatgpt.zip` without secrets.

---

# Changelog — Legal Master Package merge (2026-09-18, Asia/Manila)

## Legal Master Package integration

- Synced `data/compliance-package.json` from `Blindbandit-Legal-Master-Package` (2026.09.13).
- Public Parts III–XV + Supplement B remain on `/terms/`, `/privacy/`, `/cookies/`, `/copyright/`, `/community-guidelines/`, `/safety/`, `/submission-terms/`, `/media-suite-terms/`, `/advertising-disclosure/`, `/accessibility/`, `/security-reporting/`, `/moderation-appeals/`, `/legal/`.
- Owner-only Parts I–II and XVI–XXVI stored under `docs/legal-master-package/` (not public HTML).
- Merged Blindbandit Mobile addenda (kept `/mobile/privacy/`, `/mobile/trust-safety/`, `/mobile/about/`) with master-package crosswalks; enriched `/safety/`, `/accessibility/`, `/moderation-appeals/`, `/legal/`, `/contact/`.
- No INTERNAL / PUBLIC WEBSITE DRAFT labels on public pages.

# Changelog — Blindbandit Mobile + Social Admin (2026-09-18, Asia/Manila)

## Summary

Production Blindbandit Mobile social network, **Social Admin Control Center**, Web Push + **FCM/APNs device APIs** (Android package `net.mrblindbandit.app`), LiveKit tokens for the **owner’s LiveKit server**, Clerk-only end-user auth (legacy TOTP / portal email step-up retired), massive legal docs, visual polish, ChatGPT zip **without secrets**.

## Social Admin

- UI: `/mobile/admin/` (noindex; Settings reveals link for moderators)
- APIs: `/api/v1/social/admin/*` — users search, ban/suspend/reinstate, restrictions, verify, hide/delete posts, reports, verification queue, ads review, broadcast, audit, redacted devices, revoke push, force call disconnect, admin push test
- Migration **`0008_social_admin_moderation`**

## Push (iOS / Android / Web)

- `POST/GET/DELETE /api/v1/social/devices` (+ `/register` / `/unregister` aliases)
- Web Push: `/api/v1/push/web/*`, topics, test send
- FCM env: `FCM_PROJECT_ID`, `FCM_SERVICE_ACCOUNT_JSON` (see `docs/PUSH_IOS_ANDROID.md`, `/workspace/push-setup/README.md`)
- iOS: APNs secrets still required for real delivery even when Firebase manages the iOS app

## LiveKit

- `POST /api/v1/livekit/token` — `room_type` voice|video|data, profile identity, ban/ACL
- Secrets: `LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`

## Auth

- Portal: **Sign in with your production Clerk account** (kept + polished)
- TOTP / Google Authenticator enrollment retired; email step-up codes retired
- Social routes: any verified Clerk user can post

## Legal + polish

- Expanded site-wide legal pages + `/mobile/privacy`, `trust-safety`, `about`
- Mobile loaders, branded empty states; AdSense only on eligible pages (not admin/legal/auth/messages/calls)

## Migrations

- `0007_social_mobile_platform`
- `0008_social_admin_moderation`

## Test

1. Apply 0007 + 0008; set `HOSTING_SECRETS.md` names in Worker
2. `/mobile/` + Spotify tab on `@mrblindbandit`
3. Clerk signup → post; moderator → `/mobile/admin/`
4. When Firebase lands: put service account in Worker secrets (not zip); Android registers via `/api/v1/social/devices`
5. Confirm zip has `.openai/hosting.json` and no secret values

## Zip

`/workspace/site-src/mr-blindbandit-for-chatgpt.zip`
