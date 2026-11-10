# Stage this onto Sites revision 2edfaaa only

- Live source revision at patch time: `2edfaaa98872ac18be5fbf2dcf9cd8c4e98f6a95`
- Full snapshot sha256: `e2d5a9763e75b3bc62bc02640c9ff87f61dc2db20ff339b9c94340d0dc003536`
- Do not deploy GitHub `e045f9067dd7aa24aa72157cedeb5cd56c4a9025`.
- Do not deploy this pull request. Stage the patch through Sites.

Artifact: `release/2edfaaa/mobile-release.patch`
Base and patched sha256 for each file: `release/2edfaaa/HASHES.json`

`patch -p0` from the snapshot root. It applies only these seven files:

- `worker/platform/livekit.ts` — voice grants microphone only; no screen-share on answer
- `worker/platform/rtc-provider.ts` — explicit `rtc_provider` is accepted and frozen; `PUT /v1/social/admin/call-rtc` accepts `{provider}`
- `worker/platform/social.ts` — passes call kind into the token; returns `title` / `from_name`; public feed stays `p.visibility='public'`; following feed stays `IN ('public','followers')`; open reports are excluded
- `worker/platform/profile-urls.ts` and `profiles.ts` — `/assets` and `/v1` photo paths become `https://mrblindbandit.net...`
- `worker/platform/social-admin.ts` — suspend `until` and restriction flags accept numeric strings
- `worker/platform/bites-feed.ts` — `canSeeBite` allows only exact `public` or authorized `followers`; public feed stays `p.visibility='public'`; home feed is the author or a follower and `p.visibility IN ('public','followers')`; open reports are excluded

Null, empty, unknown, private, draft, and reported visibility stay hidden. There is no `row.visibility||'public'`, no `IFNULL(p.visibility,'public')`, and no visibility `NOT IN` filter.

`worker/platform/social.ts` in the 2edfaaa manifest is sha256 `101242015016dbe2d3a6b24d73ab84e1cd66cbfe0ad27be525b65f679407c20a` (74595 bytes). The current live file is 21 bytes longer and hashes to `22929ff5d893c4962995183f73e3e0cb6398eed8bfab9a637ba1c66f23e61c60`. The difference is outside this patch. The other six files still match the 2edfaaa manifest. Recompute the social.ts patched sha256 after applying to the 74595-byte file.

Messages stay on `POST /v1/social/messages`. No Agora Chat or RTM. No session wipe. No live call was placed. This patch was not deployed.

Local check: `node --test tests/production-2edfaaa-release.test.mjs`
