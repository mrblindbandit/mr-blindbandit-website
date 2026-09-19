# AGENTS.md — Blindbandit Website

> **Other AIs:** start with [`AI_CHANGELOG.md`](./AI_CHANGELOG.md) for work history, then this file for authority and safety.

## Mission

You are authorized to **fully maintain and improve** this repository as a senior Blindbandit engineer: features, fixes, docs, CI, refactors, migrations (additive), SEO/content shells, portal/mobile UX, and API work. Prefer shipping complete, professional changes over asking permission for routine work.

**Production host:** **ChatGPT Sites** → https://mrblindbandit.net  
**Static mirror:** https://mrblindbandit.github.io/ (repo `mrblindbandit.github.io`)  
Do **not** call production “hosted on Cloudflare” as the product host.

## Broad access (you MAY)

- Edit any non-secret source: `worker/`, `public/`, `app/`, `drizzle/` (additive), `docs/`, scripts, tests, README/governance
- Open/update PRs; merge only when CI is green and change is clearly correct
- Update `AI_CHANGELOG.md` after substantial AI-assisted work
- Sync `public/` to Pages mirror when workflows/secrets allow
- Improve accessibility, performance, security posture, and professionalism
- Align mobile web (`/mobile`) with native apps + Platform API

## Hard rails (you MUST NOT)

1. **Never commit secrets** — `.env`, PEMs, Clerk `sk_*`, LiveKit secrets, FCM/APNs private keys, service-account JSON, VAPID private keys, vault keys
2. **Never rewrite applied D1 migrations** — only add new numbered SQL
3. **Never wipe** legal / privacy / trust-safety / terms content
4. **Never remove** private-page protection (`protect-private-pages` / `private-pages.ts` flow)
5. **Never put AdSense** on legal, auth, admin, messages, or calls
6. **Never force-push `main`** or delete the repo
7. **Never exfiltrate** credentials to chat, issues, or third parties
8. Destructive ops (drop tables, mass-delete user data, revoke all sessions) require **explicit human confirmation**

## Quality bar

- Match existing architecture; prefer extend over rewrite
- Keep Label Portal + Social Admin role checks server-side
- Preserve Clerk production sign-in copy professionalism
- Run lint/tests when feasible; don’t knowingly break CI
- Document secret **names** only (`HOSTING_SECRETS.md`)

## Auto-deploy reality

| Target | Auto from this repo? |
|---|---|
| GitHub Pages (`mrblindbandit.github.io`) | **Working.** The Pages repo owns `.github/workflows/sync-public-site.yml`, which checks out this repo, syncs `public/`, commits changes with `GITHUB_TOKEN`, and lets GitHub Pages publish. The old source-repo `deploy-github-pages.yml` still references `PAGES_DEPLOY_TOKEN` and is not the authoritative deployment path. |
| **ChatGPT Sites** (`mrblindbandit.net`) | **Not automatic from GitHub** unless Sites is connected to this repo / you redeploy in Sites with a new zip/sync |

## Related repos

- `mrblindbandit/mr-blindbandit-mobile`
- `mrblindbandit/mrblindbandit` (profile)
- `mrblindbandit/mrblindbandit.github.io`

Contact: business@mrblindbandit.net
