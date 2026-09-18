# Security, readability and eight publishing improvements

Implemented September 9, 2026.

Requested fixes:
- Explicit verification-required API responses open an accessible modal at the point of action. Cancel preserves the form; successful verification retries the rejected request once. Ordinary errors are not automatically retried. Email, enrolled authenticator and recovery-code methods remain available.
- Team & access supports client, manager, accountant and administrator role changes. Owner identity and self-edit protections remain. Only the owner can assign administrator access. Changes require confirmation, retain records, and revoke affected sessions and verification proofs.
- Removed malformed CSS before the root theme rule; restored readable ambient text, control and table colors. Public privacy, copyright, terms and cookies pages use monochrome legal reading surfaces; portal legal text uses the same treatment.

Eight additional improvements from the expanded editorial checklist:
1. Safe text formatting: headings, paragraphs, quotes, ordered/unordered lists, links and horizontal rules, with matching article preview.
2. Optional public author biography on each article (stored with the article; not a shared author-profile database).
3. Article structured-data preview. Saved publication dates and image fields are added by the public renderer.
4. Approximate social card preview using configured sharing image and search text.
5. Per-article Search Console shortcut and ready-to-copy URL. Inspection is performed in Search Console; no automatic indexing claim.
6. Duplicate title warning excluding the article currently being edited.
7. Pre-publication checks for up to 30 internal body links against available public pages and published articles; no external crawling.
8. Public News category/year filters over the latest 100 published articles. These use the canonical News route rather than generating thin archive pages.

Validation: 30 automated tests passed for portal, community and crawling. Email delivery remains mocked in tests; no live inbox delivery claim. Existing dynamic sitemap and robots handling remain protected. Not all master-plan priorities are complete.
