# Priorities 1–19: completed release scope — 8 September 2026

User requested immediate publication of completed work before the entire master plan is finished. Smart links were excluded.

1. Added mandatory owner/admin email verification, 10-minute codes, five attempts, session-bound 12-hour proof, fresh verification for sensitive account/routing changes, eight one-use recovery codes and sign-out-all. Existing password/IP rate limiting remains. Passkeys, TOTP and a separate trusted-device program are not implemented. Email delivery in production still requires verification by the recipient.
2. Added paginated/searchable inbox, threaded outbound replies, internal notes/forwards to authorized administrators, assignment, department, tags, follow-up date, priority, unread/star, all requested lifecycle states, bulk status, guarded files, confirmation before permanent deletion and audit records. Incoming email replies are not imported automatically.
3. Sender receipts include reference, category/time, contact, privacy/accessibility, signature and legal/confidentiality wording. Stored submissions survive notification failure. Provider acceptance is logged separately from delivery.
4. Separate owner notifications include excerpt, source/reference and an authenticated portal link; configurable owner destination. Sender receipts never contain admin links.
5. Department routing settings and honest mailbox readiness inventory added. External mailbox aliases and SPF/DKIM/DMARC changes are not created or verified by this release. Existing .com Resend sender and .net public reply address preserved.
6. Article publishing studio persists draft/edit/preview/publish/schedule/archive/trash/restore/delete, revisions, authors/categories/tags/excerpts and metadata. Public articles render safely as text with headings. Scheduling is evaluated on requests. Featured-image upload and rich-text editing are not implemented.
7. Full supplied third-person biography published with artist-supplied provenance.
8. Complete supplied English story published at /story/ with distinct canonical metadata.
9. Homepage identity introduction links biography, story, music and news.
10. Private documents remain server-protected/noindex; normalized public document URLs redirect to canonical paths. Portal role and second-factor checks apply to data and document routes.
11. Dynamic sitemap reflects published/due articles and metadata noindex/canonical settings. Article/metadata modification times are included; static-page modification dates are omitted rather than invented.
12. Root robots allows public crawling and references sitemap. It is not an authorization mechanism.
13. SEO command center edits public title/description/canonical/index state and reports missing/duplicate metadata, unresolved links and orphan candidates. Search Console links are provided; live GSC metrics and additional schema/social-image editing remain pending.
14. Real publisher ads.txt retained. Advertising loader is inert pending verified consent-service activation. No AdSense approval claim is made.
15. Device-local privacy manager accepts all/rejects nonessential/individual categories; media requires opt-in; preferences last 180 days and can be withdrawn. This is not a Google-certified CMP. Google CMP activation and advertising re-enable remain pending.
16. Privacy/cookie notices updated for actual submission records, email processing, security verification, retention and preferences. No fixed legal-compliance guarantee.
17. Copyright reporting guidance connects to the private inbox with reference, evidence links, review notes and resolution states. No third-party ownership or registered agent claims added.
18. Fifteen department choices route contact forms into the protected inbox. Approved public address/phones/contact remain. Unverified aliases are not presented as working contacts.
19. RSS/Atom source administration, bounded XML parsing, HTTPS hostname restrictions, redirect rejection, cached excerpts/source links, deduplication, review approval, pause/resume and success/error/HTTP status. Refresh occurs on reading-room visits or admin action after the interval, not a background cron. No source feeds are invented. Images and arbitrary destination-page placement remain pending.

Verification: 15 portal/community integration tests passed, including mandatory verification, single-use recovery/reset, client isolation, private documents, inbox deletion/replies, stale article revisions and submission retention on email failure. RSS parsing, generated routes and production package checked before deployment. Browser visual QA and actual inbox delivery were not confirmed in this release.
