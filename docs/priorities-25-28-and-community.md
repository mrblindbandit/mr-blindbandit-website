# Rights, recovery and community update — 2026-09-08

Implemented from priorities 25–28:

1. Delivery catalog with ISRC format and UPC/EAN checksum validation and readiness checks.
2. Per-work ownership splits, distinct master/composition rights and exact 100% review validation.
3. Territory rights, agreement references and date validation.
4. Delivery history, provider references and internal CSV export through the existing workspace tools.
5. Content ID eligibility review with exclusive-rights and evidence gates.
6. Claims and disputes records with provider IDs, evidence and response tracking.
7. Takedown review records with ownership, scope and reviewer gates.
8. Rights and delivery dashboard showing live status counts and overdue work.
9. Owner emergency lockdown, non-owner session/proof revocation, server-side denial and retained owner unlock path.
10. Private, on-demand article snapshots in object storage with integrity verification, private download, deletion and restoration into a separate draft.

Additional requested work:

- Prominent New post community entry point and focused composer.
- Community publishing inside the label dashboard, including official public announcements and removal of that account’s posts.
- Private label announcements with all-account, staff and client audiences; draft/publish/archive; revision conflict checks; overview highlights.
- Six additional internal pages with persistent records, edit/archive, checklists, filtering and CSV export: client support cases, access reviews, privacy requests, security incidents, release retrospectives and team handovers.

Boundaries:

- Catalog and rights records document human review. No direct distributor deliveries, Content ID submissions, claims or takedowns are sent automatically. Internal CSV is not a provider-certified delivery package.
- Article snapshots cover Publishing studio article records only, up to 50 articles / 4 MB per snapshot and 20 snapshots. They exclude identity data, messages, community posts, media and contracts. No scheduled full-database or full-site disaster recovery is claimed. Restore creates a new draft with a distinct URL, leaving the current article intact.
- Lockdown applies to the private label portal, not public community participation. Owner recovery remains authenticated and administrator verification remains mandatory.
- Private announcements never become public community posts automatically. Public dashboard posts explicitly use the label’s public display name.
- Smart links remain deferred. Google/Apple credentials, Google AdSense approval, certified consent integration and external music-provider partnerships are not changed or claimed complete.

Validation: 20 automated tests pass, including permission boundaries, audience isolation, session revocation and owner recovery, snapshot tamper detection, non-destructive restoration, rights validation, community persistence and dynamic sitemap/feed exclusions. No real customer emails were sent by tests.
