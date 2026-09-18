# Portal search and shortcuts — 2026-09-09

Two completed internal checklist improvements:

- Portal search finds accessible navigation pages, active workspace records, client tasks and administrator article records. Permissions are enforced server-side. Clients only see their own tasks and no staff workspaces or articles. Results state their per-category limits. Workspace matches link to the record editor when present in the loaded collection.
- My shortcuts stores up to 20 permitted portal pages per account in the database, with revision conflict protection. Saved links remain separate between accounts, follow the account across devices and are filtered against current permissions when read.

Both pages require portal sign-in and retain administrator verification. They are excluded from the public sitemap and static HTML delivery. No schema migration or external provider is required.

Validation: 24 automated tests pass, including anonymous access rejection, client task isolation, prohibited shortcut rejection, per-account persistence, stale-save handling and protected page delivery. Frontend syntax checks passed.
