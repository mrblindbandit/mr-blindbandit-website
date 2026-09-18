# AI_CHANGELOG.md — Blindbandit Website

Machine-readable history of **AI-assisted** changes to this repository and related Blindbandit web work. Update this file when agents make substantial changes.

## 2026-09-18

### Packaging & GitHub
- Full site packaged (~7.6 MB zip) including drizzle **0007** / **0008**
- Private→**public** GitHub repo `mrblindbandit/mr-blindbandit-website`
- Static deploy to `mrblindbandit/mrblindbandit.github.io` → https://mrblindbandit.github.io/
- Zip uploaded to Google Drive (`Blindbandit/` folder) after quota fix
- Professional README, LICENSE, SECURITY, CONTRIBUTING, CODE_OF_CONDUCT, CODEOWNERS, issue/PR templates
- `docs/ARCHITECTURE.md`, `docs/openapi.json` snapshot, screenshots under `docs/screenshots/`
- Hosting language corrected to **ChatGPT Sites** (not Cloudflare-as-host)
- CI + Pages workflow YAML added under `.github/workflows/` (and mirrored in `docs/github-workflows/`)

### Product / platform
- Blindbandit Mobile `/mobile` social network (profiles, posts, messaging/calling hooks, monetization, verification)
- Social Admin + Label Portal controls (ban/suspend/moderate bridges)
- Push APIs (web VAPID + FCM/APNs wiring) and LiveKit token endpoints
- Legal master package merge into public + mobile policies
- Bulk expansion of thin HTML shells (~155 → 0 thin pages)
- Clerk production framing for portal; legacy 2FA auth direction deprecated for social

### Ops notes still often pending
- `FCM_SERVICE_ACCOUNT_JSON` on Sites secrets
- Apple APNs (`APNS_*`) when Apple Developer available
- D1 apply **0007** then **0008** on Sites if not already applied

## Earlier (2026-09 and prior AI-assisted phases)

See `CHANGELOG.md` for portal deepen, legal merge, media tools, SEO, accessibility, and priority phases documented in `docs/*`.

---

*Agents: append dated sections; never paste secret values.*
