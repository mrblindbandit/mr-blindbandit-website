# Security Policy

## Supported surfaces

| Surface | Status |
|---|---|
| Production site on **ChatGPT Sites** (`https://mrblindbandit.net`) | Supported |
| Platform API (`/api/v1`, `/v1`) | Supported |
| Blindbandit Mobile web (`/mobile`) + Social Admin | Supported |
| Label Portal (`/portal`) | Supported |
| GitHub Pages static mirror (`https://mrblindbandit.github.io/`) | Best-effort (static only) |
| Companion iOS/Android apps (`mr-blindbandit-mobile`) | Report in that repo or here if API-related |

## Reporting a vulnerability

**Please do not open a public GitHub Issue for security bugs.**

Email **business@mrblindbandit.net** with:

1. Description of the issue and potential impact
2. Steps to reproduce (PoC if available)
3. Affected URL(s), API path(s), or app build
4. Your contact details for follow-up

Optional: CC `kheckfinancial@gmail.com` for owner escalation.

We aim to acknowledge reports within **72 hours** and to provide a status update within **7 days**.

## Scope (in)

- Authentication / session issues (Clerk, portal auth)
- Authorization bypass (social vs admin vs portal)
- Injection, XSS, CSRF on production Worker routes
- Insecure direct object references on social/admin APIs
- Secret exposure in client bundles or public repos
- Push token / device registration abuse
- LiveKit token minting abuse

## Scope (out)

- Denial-of-service / volumetric attacks without a novel app bug
- Issues only on the GitHub Pages static mirror that do not affect production
- Social-engineering of individual users
- Vulnerabilities in third-party services (Clerk, LiveKit, ChatGPT Sites platform) — report those upstream; tell us if Blindbandit config worsens them

## Secrets

Never commit or email production secret *values* in Issues/PRs.  
Secret **names** are documented in `HOSTING_SECRETS.md`.

## Safe harbor

Good-faith security research that follows this policy and avoids privacy harm,
data destruction, and service disruption is appreciated. We will not pursue
legal action against researchers who comply.
