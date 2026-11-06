# Stage this onto Sites revision 2edfaaa only

- Live source revision: `2edfaaa98872ac18be5fbf2dcf9cd8c4e98f6a95`
- Full snapshot sha256: `e2d5a9763e75b3bc62bc02640c9ff87f61dc2db20ff339b9c94340d0dc003536`
- Do not deploy GitHub `e045f9067dd7aa24aa72157cedeb5cd56c4a9025`.

Artifact: `release/2edfaaa/mobile-release.patch`
Base and patched sha256 for each file: `release/2edfaaa/HASHES.json`

`patch -p0` from the snapshot root. It applies only these seven files:

- `worker/platform/livekit.ts` — voice grants microphone only; no screen-share on answer
- `worker/platform/rtc-provider.ts` — explicit `rtc_provider` is accepted and frozen; `PUT /v1/social/admin/call-rtc` accepts `{provider}`
- `worker/platform/social.ts` — passes call kind into the token; returns `title` / `from_name`; shared feed drops private, draft, and open reports
- `worker/platform/profile-urls.ts` and `profiles.ts` — `/assets` and `/v1` photo paths become `https://mrblindbandit.net...`
- `worker/platform/social-admin.ts` — suspend `until` and restriction flags accept numeric strings
- `worker/platform/bites-feed.ts` — signed-in public feed includes `shared`; private, draft, and open reports stay out

Messages stay on `POST /v1/social/messages`. No Agora Chat or RTM. No session wipe. No live call was placed.

Local check: `node --test tests/production-2edfaaa-release.test.mjs` (6 passed).
