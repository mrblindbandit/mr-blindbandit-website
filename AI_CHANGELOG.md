# AI_CHANGELOG.md

> **For other AIs / coding agents:** read this file for the full history of AI-assisted work across Blindbandit GitHub. Also read `AGENTS.md` for hard rules. **Do not commit secrets.**

Primary log for **mr-blindbandit-website**. Companion logs exist in:
- https://github.com/mrblindbandit/mr-blindbandit-mobile/blob/main/AI_CHANGELOG.md
- https://github.com/mrblindbandit/mrblindbandit/blob/main/AI_CHANGELOG.md
- https://github.com/mrblindbandit/mrblindbandit.github.io/blob/main/AI_CHANGELOG.md

---

## 2026-09-18 — Full account day (Grok Bot / mr. blindbandit)

### YouTube (@MrBlindbandit)
- Overnight Studio: long-form + Shorts SEO, cinematic thumbs, playlists, channel keywords/upload defaults, end screens/cards, community poll attempts
- Viral Short rebuilt with Runway cinematic stills + Clairvoyant Castle audio + SFX; uploaded to channel; MP4 emailed to business@mrblindbandit.net

### GitHub account & access
- Signed into GitHub as **mrblindbandit** via Google (`kheckfinancial@gmail.com`) — security key / phone approval / GitHub Mobile device code
- Cursor SCM connected for cloud agents (Cloud Agents limited by plan → direct `gh` / local work used instead)
- Useful GitHub Apps / Marketplace installs attempted; **latest Renovate install blocked by GitHub sudo-mode 2FA (GitHub Mobile)** — pending user approval
- Enabled **vulnerability alerts** + **automated security fixes** on all four Blindbandit repos (website, mobile, bio `mrblindbandit`, `mrblindbandit.github.io`)

### Mobile apps (`mr-blindbandit-mobile`)
- Flagship revamp iOS + Android: Clerk auth (email+Google; Apple off), LiveKit calling/messaging
- Full DMs: attachments, hold-to-send voice notes, sent/delivered/read/typing receipts
- Runway UI SFX (ringtones, call, notif ambient packs) + haptics + branded visuals/loaders
- Privacy policy link to mrblindbandit.net/privacy; store-compliance direction
- PR **#14** flagship/1.5 path; CI fixes (Kotlin 2.4, compileSdk, LiveKit API, lint workaround, iOS LiveKitService fixes)
- Local secrets scaffolding; OAuth callback `blindbandit://oauth-callback` allowlisted in Clerk

### Website (`mr-blindbandit-website`) — ChatGPT Sites production
- Unpacked ChatGPT site zip; **production host = ChatGPT Sites** (`mrblindbandit.net`), not Cloudflare-as-product-host
- Social `/mobile`: profiles, posts, messaging/calling hooks, monetization, verification, artist profile + Spotify tabs
- Label Portal / Social Admin controls (ban/suspend/moderate bridges)
- Platform API `/api/v1`, LiveKit tokens, Web Push VAPID + FCM/APNs wiring
- Drizzle migrations **0007_social_mobile_platform** + **0008_social_admin_moderation**
- Legal master package merge; thin HTML shells expanded (~155 → 0)
- Secrets checklist emailed to business@; FCM service-account + APNs still often pending on Sites
- Public GitHub repo + static Pages mirror **https://mrblindbandit.github.io/** (`mrblindbandit.github.io`)
- Zip on Google Drive after quota fix: My Drive → Blindbandit → `mr-blindbandit-for-chatgpt.zip`

### Repo professionalism (website)
- Full README; LICENSE; SECURITY; CONTRIBUTING; CODE_OF_CONDUCT; CODEOWNERS; issue/PR templates
- `docs/ARCHITECTURE.md`, `docs/openapi.json`, `docs/screenshots/*`
- `AGENTS.md`, `AI_CHANGELOG.md`, `.github/copilot-instructions.md`
- GitHub Actions: `.github/workflows/ci.yml`, `deploy-github-pages.yml`

### Bio / profile repo (`mrblindbandit/mrblindbandit`)
- Professionalization + AGENTS / AI_CHANGELOG (see that repo’s copies)

### Pages repo (`mrblindbandit.github.io`)
- Live static frontend deploy; AGENTS / AI_CHANGELOG; governance pass

---

## How other AIs should use this

1. Read **`AI_CHANGELOG.md`** (this file) for what already shipped.
2. Read **`AGENTS.md`** for constraints (ChatGPT Sites host, no secrets, additive migrations).
3. Prefer extending existing features over rewriting.
4. Append a new dated section here after substantial AI-assisted work.

---

*Last expanded: 2026-09-18 — Grok Bot*


### AGENTS.md authority pass
- Updated all four repos' `AGENTS.md` with broad maintain authority + hard safety rails (no secrets, additive migrations, no legal wipe, ChatGPT Sites host clarity, Pages vs Sites auto-deploy notes).
