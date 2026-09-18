# Mr. Blindbandit — full website source export

This archive contains all 593 tracked files from the site's source repository: frontend, backend, assets, build scripts, dependency lockfile, tests, database schemas and migrations. It is an editable source export, not a full production-data backup or a deployment bundle.

## Where to edit
- public/: browser JavaScript, styles, images, and generated HTML pages.
- scripts/ and data/: page generators and content. The build runs scripts/portal.py when Python is available, so update the relevant generator/content for lasting HTML changes; edits to generated HTML alone can be overwritten.
- app/, components/, hooks/, lib/: React pages and supporting frontend code.
- worker/: backend routes, authorization, API handlers, and business logic. Entry point: worker/index.ts.
- db/ and drizzle/: database schemas, migrations and migration metadata.
- services/media-worker/: separate media worker runner source; its external execution service is not included.
- docs/: existing implementation and integration documentation.

## Editing and local verification
Use Node.js 22.13 or newer and npm. Existing install/build helper scripts target Linux (or WSL) with Bash, Python 3, GNU timeout, flock, curl and sha256sum.
From the project directory:
    npm run install:ci
    npm run dev
    npm run build
    npm test

These commands are the existing project commands; the export was checked for completeness and ZIP integrity, but was not rebuilt or locally runtime-tested for this handoff. Connected features require their configured services and environment. Local D1/R2 data is separate from production.

The original README contains historical deployment instructions. The current application uses the Vinext/Cloudflare Worker configuration in vite.config.ts, worker/index.ts and .openai/hosting.json; do not treat it as a static-only site.

## Keep these intact
Keep the folder structure, package-lock.json, .openai/hosting.json and its existing project_id. Preserve server authorization and the private-page protection build step. Add new database migrations rather than changing previously applied migrations. Do not add production secrets to source files or browser code.

## Bring the edits back
1. Edit the files in mr-blindbandit/.
2. Include a short CHANGELOG describing changes and tests performed.
3. ZIP the complete edited mr-blindbandit/ folder, including .openai/hosting.json. Exclude node_modules, .git, .sites-runtime, .wrangler, build output and secret environment files.
4. Upload the ZIP to ChatGPT and ask to apply it to the existing Mr. Blindbandit site, review differences against the current source, test and publish.

The export manifest records the baseline source commit and file hashes. Compare against the current site when importing, so newer changes made after this export are not overwritten. Importing requires access to the original Sites project. Uploading this ZIP by itself does not publish anything.

## Not included
Production database rows (accounts, messages, posts and other saved records); hosted R2 uploads; runtime environment values/API secrets; external service accounts and their data; dependencies installed by npm; Git history; production build output. Existing integrations are represented by their source code and documentation. The iOS/Android app repositories are separate and are not part of this website export.
