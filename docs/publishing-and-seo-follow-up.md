# Publishing and SEO follow-up — 2026-09-09

Five additional improvements under master-plan priorities 6 and 13:

1. Featured image URLs, required descriptive alt text, visible credits/captions, separate social images, Open Graph/Twitter image metadata and Article schema images. Images must already be hosted publicly on the official domain; this update does not add image uploads.
2. Up to six related public pages per article. Saving rejects private, missing and self links; public rendering removes targets that are no longer published.
3. Server-side article search across title, excerpt, author, category and tags, status filters and 50-item pagination.
4. Publication checks and an accessible preview with word count, reading time, search excerpt, image and content. Missing required content and invalid image descriptions block publication. Scheduled publishing requires a future time. Search truncation, noindex, canonical and related-reading hints are advisory. Revision loading also restores the article's image and SEO metadata into the editor.
5. SEO reports include published/due articles, their canonical and indexability state, social images and direct editor links; duplicate-description reporting supplements existing title and link checks. The report explicitly states its 500-article limit.

Validation: 22 automated tests pass, covering role isolation, unsafe image URLs, related private-page rejection, search filtering, publication checks, escaped captions and alt text, image schema/social metadata, disappearance of unpublished related destinations, and existing crawl/portal behavior. JavaScript syntax check passed.

Not claimed: five entirely completed top-level priorities, guaranteed Google indexing or approval, external image uploads, or real customer email delivery. These are five implemented improvements within the existing priority work.
