# Top 30 priorities and Phase 1 / Phase 2 audit

Reviewed September 9, 2026 against Master Plan v5 and the repository. “Implemented” means the described site functionality exists; it does not certify external service approval, legal compliance, email delivery, or search rankings.

**22 implemented; 7 partial; 1 expressly deferred.**

| Priority | Status | Evidence or remaining work |
|---|---|---|
| 1 Owner security | Partial | Mandatory email/TOTP/recovery verification, fresh-action checks, rate limits, sessions, remembered browsers, new-session and exhausted-code alerts implemented. Passkeys remain unconfigured. Remembered browsers do not bypass MFA. |
| 2 Professional submissions inbox | Implemented | Threads, replies, internal forwards, notes, status, assignment, tags, follow-up, bulk actions, search, pagination, trash and audited deletion. |
| 3 Professional sender email | Implemented | Branded HTML/plain text, reference, date, signature, privacy links, clickable public email/phones/map. Provider acceptance tracked; actual inbox delivery not certified. |
| 4 Internal submission notifications | Implemented | Separate branded notice, authenticated inbox link and configurable destination. |
| 5 Departmental domain email | Partial | Fifteen aliases published/prepared; .com transactional sender configured. Mailbox routing and SPF/DKIM/DMARC status cannot be independently certified through current account tools. |
| 6 Article publishing | Implemented | CRUD, preview, scheduling, revisions, images, metadata, related links, archive/trash and confirmation; renamed URLs now preserve redirects. |
| 7 Canonical biography | Implemented | Full supplied biography and prominent cross-links. |
| 8 Full Philippines story | Implemented | Original first-person source preserved, canonical page and expanded related navigation. No unsupported biography facts added. |
| 9 Homepage identity | Implemented | Clear identity in the hero, biography/story and core links. |
| 10 Crawl cleanup | Implemented | Worker-routed public content, protected private routes, source link/canonical/H1 checks and runtime crawl tests. Live audit results are recorded separately. |
| 11 Automatic sitemap | Implemented | Public route/article/translation generation, exclusions, XML validation in deployment. |
| 12 Root robots | Implemented | Public crawling and sitemap reference; private routes protected by authentication. |
| 13 SEO command center | Partial | Metadata controls and diagnostics plus real dated GSC snapshot. Continuous GSC synchronization and configurable page-level schema editing remain. |
| 14 AdSense readiness | Partial | Policies, identity, contact, crawlability, genuine ads.txt and gated ad architecture. Certified consent-platform integration and Google approval remain external. |
| 15 Cookie preferences | Implemented | Category choices, accept/reject/manage, persistent preferences link and optional-media gating. This is not itself a Google-certified CMP. |
| 16 Privacy policy | Implemented | Policies describe actual forms/accounts/security, notes, templates, browser preferences and contact routes. No legal certification claimed. |
| 17 Copyright policy | Implemented | Ownership/third-party boundaries, licensing contact and internal notice workflow. |
| 18 Contact hub | Implemented | Departments, public contact information, forms and appropriate inbox handling. |
| 19 RSS importer | Partial | HTTPS validation, sanitization, cache, dedupe, approval and refresh controls; expanded image/per-page placement and automatic scheduling remain. |
| 20 Native feeds | Implemented | RSS/Atom news and music feeds, linked in metadata, published-only data and XML checks. |
| 21 Language picker | Implemented | Remembered choices, reviewed translation manager, language URLs and hreflang; no automatic legal translation. |
| 22 Release smart links | Deferred | Explicit user instruction. |
| 23 Press/EPK | Implemented | Three bio lengths, portrait, approved logo, public downloads and press contact. |
| 24 Business pipelines | Implemented | Dedicated forms and protected queues, notes, templates, assignment and follow-up. |
| 25 Distribution-readiness start | Implemented | Existing validation/export/checklist tools meet the requested initial readiness scope. No new inventory expansion; no direct platform delivery claim. |
| 26 Content ID readiness start | Implemented | Existing rights/evidence/splits/territory/dispute workflows. No direct Content ID access claim. |
| 27 Expanded permissions | Partial | Owner/admin/manager/accountant/client, protected role changes, audit and lockdown. Editor/support/marketing/read-only/custom roles remain. |
| 28 Backups/recovery | Partial | Article revisions and owner-managed private article snapshots exist. Scheduled full database/media backups remain. |
| 29 Ad placements | Implemented | Owner settings for body/end/footer slots, page exclusions, safe page allowlist, reserved layout and consent/deployment gating. Ads stay off until integration and real slot IDs are ready. |
| 30 Phased delivery | Implemented | Versioned deployments, validation, changelogs and this explicit remaining-work record. |

## Phase sign-off

**Phase 1:** Core security, inbox, transactional email, publishing, biography/story and crawl infrastructure implemented. Full sign-off remains open for optional passkeys, independent email-domain/delivery verification, and the SEO command center's remaining advanced controls.

**Phase 2:** Site-side departmental contact, privacy/cookie/copyright/terms/accessibility content and advertising architecture implemented. Full sign-off remains open for mailbox/DNS verification and certified consent-platform integration. Google alone decides AdSense approval.

No inventory/reporting expansion and no smart-link work in this release. The source policy and story documents remain preserved. Future work should close the partial items rather than inflate the completed count.
