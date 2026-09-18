# Hosting secrets checklist (names only)

Add these as **ChatGPT Sites (OpenAI Sites) project secrets**.
The production host is ChatGPT Sites (`mrblindbandit.net`), not a separate self-managed Cloudflare account.  
**Never commit values** to git, client JS, mobile apps’ committed server keys, or the ChatGPT import zip.

## Clerk (required)

| Secret name | Purpose |
|---|---|
| `CLERK_PUBLISHABLE_KEY` | Also acceptable as `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` |
| `CLERK_SECRET_KEY` | Server only |

## LiveKit — owner server (required for calls)

| Secret name | Purpose |
|---|---|
| `LIVEKIT_URL` | `wss://…` LiveKit Cloud / self-hosted URL |
| `LIVEKIT_API_KEY` | API key |
| `LIVEKIT_API_SECRET` | API secret (server only) |

## Web Push (VAPID)

| Secret name | Purpose |
|---|---|
| `VAPID_PUBLIC_KEY` | Exposed via `/api/v1/push/web/vapid-public-key` |
| `VAPID_PRIVATE_KEY` | Server only (alias `WEBPUSH_PRIVATE_KEY`) |
| `VAPID_SUBJECT` | e.g. `mailto:business@mrblindbandit.net` |

## Android FCM (Firebase) — package `net.mrblindbandit.app`

| Secret name | Purpose |
|---|---|
| `FCM_PROJECT_ID` | Firebase project id |
| `FCM_SERVICE_ACCOUNT_JSON` | Full service-account JSON string for FCM HTTP v1 |

Drop `google-services.json` / service-account files in `/workspace/push-setup/` for ops use — **do not** put service-account JSON in the website zip. Apps embed `google-services.json` in the Android project only.

Integration Vault alternative: provider `fcm` with public `project_id` + secret `service_account_json`.

## iOS APNs

Firebase iOS client config is helpful, but **production APNs delivery requires an Apple Developer APNs Auth Key**.

| Secret name | Purpose |
|---|---|
| `APNS_TEAM_ID` | Apple Team ID |
| `APNS_KEY_ID` | Key ID |
| `APNS_BUNDLE_ID` | iOS bundle id |
| `APNS_PRIVATE_KEY` | `.p8` PKCS8 PEM contents |

Vault alternative: provider `apns`.

## Platform encryption + moderators

| Secret name | Purpose |
|---|---|
| `PLATFORM_VAULT_KEY` | 64-char hex AES-GCM key for device token encryption |
| `COMMUNITY_MODERATOR_EMAIL` | Social Admin allow-list |
| `CLERK_ADMIN_EMAIL` | Additional admin allow-list |

Owner emails `kheckfinancial@gmail.com` and `business@mrblindbandit.net` are also social admins in code.

## Already common on this project

`RESEND_API_KEY`, `PORTAL_EMAIL_FROM`, Stripe keys, D1 `DB`, R2 `BUCKET` (see `.openai/hosting.json`).

## Migrations

Apply additive: `0007_social_mobile_platform`, `0008_social_admin_moderation`.

## Verify

1. Health: `GET /api/v1/system/health`
2. LiveKit: `GET /api/v1/livekit/status` → configured
3. VAPID: `GET /api/v1/push/web/vapid-public-key`
4. After FCM secrets: Android app `POST /api/v1/social/devices` with FCM token
5. Admin: `/mobile/admin/` with moderator Clerk account

## Never ship in zip / client

Clerk `sk_*`, LiveKit API secret, VAPID private key, APNs `.p8`, FCM service-account JSON, `PLATFORM_VAULT_KEY`, `.env*`, `*keys*.txt`.

## Local ops drop folder

Generated/downloaded push credentials may live in `/workspace/push-setup/` on the build machine. They are **not** part of the website export zip. Copy values into Worker secrets using the names above.
