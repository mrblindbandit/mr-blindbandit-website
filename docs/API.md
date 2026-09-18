# Blindbandit Platform API

Base URLs:

- `https://mrblindbandit.net/v1`
- `https://mrblindbandit.net/api/v1` (alias)
- `https://api.mrblindbandit.net/v1` (documented API host; same Worker)

OpenAPI: [`/openapi.json`](https://mrblindbandit.net/openapi.json) · Human docs: [`/docs`](https://mrblindbandit.net/docs)

Envelope: `{ "success": true, "data": …, "meta": { "request_id", "api_version": "v1" } }`

## Auth models

| Access | How |
|---|---|
| `public` | No auth |
| `user` / `owner` | Label portal session cookie **or** `Authorization: Bearer bb_…` mobile API session (requires active label member) |
| `social` | **Any verified Clerk account** (Google/email). Used by Blindbandit Mobile. Apple Sign In off. |
| `worker` | Media worker bearer credential |

## Social / Mobile (open signup)

| Method | Path | Access | Summary |
|---|---|---|---|
| GET | `/social/health` | public | Liveness + seed ensure |
| GET | `/social/feed` | public | Public feed |
| GET | `/social/explore` | public | Search profiles |
| GET | `/social/profiles/{handle}` | public | Profile |
| GET | `/social/profiles/{handle}/posts` | public | Profile posts |
| GET/POST/PATCH | `/social/me` | social | Ensure/update own profile |
| POST | `/social/posts` | social | Create post |
| DELETE | `/social/posts/{id}` | social | Delete own post |
| POST/DELETE | `/social/profiles/{handle}/follow` | social | Follow/unfollow |
| GET/POST | `/social/messages` | social | Conversations / send |
| GET | `/social/messages/{id}` | social | Thread |
| POST | `/social/calls` | social | Start voice/video (returns LiveKit token) |
| POST | `/social/calls/{id}/join` | social | Join call |
| POST | `/social/calls/{id}/end` | social | End call |
| POST | `/social/verification` | social | Apply verification |
| POST | `/social/monetization` | social | Apply monetization |
| GET/POST | `/social/ads` | public/social | Ads marketplace |
| GET | `/social/spotify` | public | Spotify embed catalog |
| POST | `/social/devices/register` | social | APNs/FCM token for apps |
| POST | `/social/devices/unregister` | social | Unregister device |

## LiveKit

| Method | Path | Access |
|---|---|---|
| GET | `/livekit/status` | public |
| POST | `/livekit/token` | social | Body: `{ room, identity?, name?, can_publish?, can_subscribe?, ttl_seconds? }` |

Worker secrets: `LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`.

## Push / notifications

| Method | Path | Access |
|---|---|---|
| POST | `/push/register` | user (label) | iOS/Android token |
| POST | `/push/unregister` | user | Unregister |
| POST | `/push/web/register` | social | Web Push subscription |
| POST | `/push/web/unregister` | social | Remove subscription |
| GET | `/push/web/vapid-public-key` | public | Browser VAPID key |
| GET | `/push/topics` | public | Topic catalog |
| POST/DELETE | `/push/topics/{name}/subscribe` | social | Topic preference |
| POST | `/notifications/test` | social | Test fan-out |
| GET | `/notifications` | user | In-app list (label sessions) |
| POST | `/push/test` | recent_owner | Owner device test |

## Changelog notes (API)

- **2026-09-18** — Social/Mobile surface, LiveKit minting, Web Push + topic APIs, `/api/v1` alias, `api.mrblindbandit.net` CORS, migration `0007_social_mobile_platform`.


## Social Admin + devices

See CHANGELOG and `docs/PUSH_IOS_ANDROID.md`. Admin UI: `/mobile/admin/`.
Device register: `POST /api/v1/social/devices`.
