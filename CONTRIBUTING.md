# Contributing to Blindbandit Website

Thanks for your interest. This is a **production brand + product** repository for Blindbandit Records, hosted on **ChatGPT Sites** (OpenAI Sites).

## Before you start

1. Read `README.md` and `docs/ARCHITECTURE.md`
2. Read `SECURITY.md` — never open public issues for vulns
3. Do **not** commit secrets (see `HOSTING_SECRETS.md` and `.gitignore`)

## Ways to help

- Bug reports (non-security) via GitHub Issues
- Documentation clarity (README, docs/, API notes)
- Accessibility improvements
- Small, focused pull requests

Large product changes (new social features, auth model changes, migrations) should be discussed in an Issue first.

## Development setup

```bash
git clone https://github.com/mrblindbandit/mr-blindbandit-website.git
cd mr-blindbandit-website
npm run install:ci
npm run dev
```

Node.js **≥ 22.13** required.

## Pull request checklist

- [ ] No secrets, PEMs, service-account JSON, or `.env` files
- [ ] `npm run lint` / `npm test` pass when feasible
- [ ] Migrations are **additive** only — never rewrite applied SQL
- [ ] Private portal HTML remains protected by the Worker build step
- [ ] Legal pages not wiped accidentally
- [ ] AdSense not added to legal / auth / admin / messages / calls
- [ ] Docs updated if API or ops steps change
- [ ] Hosting language refers to **ChatGPT Sites** / OpenAI Sites (production host)

## Commit style

Prefer clear, present-tense summaries:

- `Fix social feed pagination empty state`
- `Document ChatGPT Sites secret checklist`
- `Add D1 migration 0009_…` (only when intentional)

## Code owners

See `.github/CODEOWNERS`. Sensitive paths (`worker/`, `drizzle/`, secrets docs) require owner review.

## License

By contributing, you agree your contributions are assigned to / licensed under the repository `LICENSE` (proprietary Blindbandit Records terms) unless otherwise agreed in writing.
