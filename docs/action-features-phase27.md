# Four usable features — inventory phase deferred

User requested active features instead of inventory/reporting. The unfinished report implementation was removed.

- /portal/reply-templates/: administrators create, search, edit and delete up to 100 shared text templates; saved templates appear in inbox replies. Insertion does not send email.
- /portal/personal-notes/: each account can create, search, edit and delete up to 100 private notes; storage is bound to the authenticated account and uses revision checks against conflicting saves.
- /search/: server-rendered public search of page text and the latest 500 published articles, up to 50 results. Drafts, future articles, private portal pages and editorial notes are excluded. Search result queries are noindex.
- /release-checklist/: twelve interactive preparation steps with browser-local persistence, reset confirmation and a text download; links to the actual submission form. No automatic submission or acceptance.

Progress toward master-plan sections 22–23 (inbox and personal workspace) and public navigation. No inventory/reporting pages added. No schema migrations or new paid integrations.
