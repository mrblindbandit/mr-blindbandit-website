# Nine editorial checklist improvements — 2026-09-09

Implemented nine unfinished items from the expanded document, section 21:

1. Duplicate an article as a new draft, with a unique URL and reset canonical/featured state.
2. Private editorial notes in the article editor; excluded from public pages and metadata CSV exports.
3. Filters for exact category/author, tag text and updated-date range, alongside existing status/search and pagination.
4. Bulk unpublish to Draft or archive, up to 20 selected articles, explicit confirmation and stale-selection protection. No bulk publish bypass.
5. Bulk category/tag replacement with the same confirmation and concurrency checks.
6. Download metadata CSV for up to 1,000 articles, authenticated and with spreadsheet-formula escaping.
7. Featured article setting that orders featured entries first on News. It does not alter the homepage.
8. Previous/next navigation among currently public articles, ordered by publication time and slug.
9. Last-saved time and last-editor information in the private editor/list; new edits record the authenticated editor.

Bulk operations preserve prior article snapshots in revision history and record audit events. The two-step update/history sequence does not claim transaction-wide atomicity across a storage failure; article selection/update itself is an atomic SQL statement guarded by all selected revisions.

Validation: 28 automated tests passed. Coverage includes duplicate draft state, filtering, atomic multi-record update selection, stale conflict rejection, revision creation, private export access, notes excluded from public rendering/export, featured ordering and previous/next links, plus existing account/security/community/crawl checks.

These are nine implemented checklist items; the entire master plan is not complete. Remaining larger capabilities include full-site scheduled backups, configured external AI and OAuth providers, a media upload manager, and provider-dependent integrations.
