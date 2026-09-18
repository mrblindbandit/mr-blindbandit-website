# Blindbandit Mobile — iOS & Android push registration

Android package (Firebase): `net.mrblindbandit.app`

## Server endpoints (Clerk session required)

| Method | Path | Body |
|---|---|---|
| POST | `/api/v1/social/devices` | `{ installation_id, platform: "ios"\|"android", token, app_version, language, provider? }` |
| POST | `/api/v1/social/devices/register` | same |
| GET | `/api/v1/social/devices` | list own devices (no raw tokens) |
| DELETE | `/api/v1/social/devices` | `{ installation_id }` or `{ device_id }` |
| GET | `/api/v1/push/web/vapid-public-key` | Web Push public key |
| POST | `/api/v1/push/web/register` | browser PushSubscription |
| GET | `/api/v1/push/topics` | topic catalog |
| POST | `/api/v1/push/topics/{name}/subscribe` | subscribe |
| POST | `/api/v1/notifications/test` | test fan-out to current user |
| POST | `/api/v1/social/admin/notifications/test` | admin test to `{ user_id }` |

## Android (FCM)

1. Add `google-services.json` to the Android app (never commit server service-account JSON to the website zip).
2. Obtain FCM registration token via Firebase Messaging SDK.
3. After Clerk sign-in, POST the token to `/api/v1/social/devices` with `platform:"android"`.
4. Worker delivers via FCM HTTP v1 using `FCM_PROJECT_ID` + `FCM_SERVICE_ACCOUNT_JSON` (or Integration Vault `fcm`).

## iOS (APNs / Firebase)

1. Prefer Firebase iOS config when available; still upload an **Apple Developer APNs Auth Key** to Firebase (and/or Worker `APNS_*` secrets) for production delivery.
2. Register device token with `platform:"ios"` on the same endpoint.
3. Without an APNs key, iOS delivery will not succeed in production even if Firebase project exists.

## Web

Use `/mobile/settings/` → Enable Web Push (`VAPID_*` secrets).

## Secrets (names only)

See `HOSTING_SECRETS.md`: `FCM_PROJECT_ID`, `FCM_SERVICE_ACCOUNT_JSON`, `APNS_TEAM_ID`, `APNS_KEY_ID`, `APNS_BUNDLE_ID`, `APNS_PRIVATE_KEY`, `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`, `PLATFORM_VAULT_KEY`.
