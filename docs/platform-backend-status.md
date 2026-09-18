# Platform backend status and setup

This implementation is not yet a completed production rollout of the 123-point platform plan.

## Implemented source

API v1 routing, safe error envelopes and request IDs, strict request schemas, generated route documentation, Clerk/label session exchange, revocable access and rotating refresh credentials, owner bootstrap and kill switch, AES-GCM Integration Vault, per-environment provider configuration, selected read-only connection tests, APNs/FCM adapters, encrypted device registrations, in-app notification records, owner Control Center, app configuration, preferences, favorites, support and beta records, audit records, and explicit bridges into existing label services.

Private media reservations, uploads, downloads, processing job queue, worker credentials and leases, idempotency, ownership checks, storage quotas, and completion notification records are implemented. A processor must authenticate and poll before jobs are accepted. Expired processing leases fail with PROCESSOR_TIMEOUT. Output files survive an audit failure after the completion transaction commits.

Migrations 0005 and 0006 are additive and generated from db/platform-schema.ts. They have not been applied to production. Existing migrations 0000–0004 are preserved.

## Processor setup

Run services/media-worker/runner.mjs on a separate trusted Linux host with Node and FFmpeg installed, under an unprivileged service account with CPU, disk, memory and network limits. The website Worker itself cannot run FFmpeg. Configure MEDIA_API_BASE with the HTTPS website origin and MEDIA_WORKER_KEY with a random 64-character hexadecimal credential that matches the Background Media Processor entry in Integration Vault. Use protected service environment configuration; never commit these values. Start with `node services/media-worker/runner.mjs` under the host's service manager.

The runner polls every ten seconds when idle, downloads only leased job inputs from the configured API origin, invokes FFmpeg without a shell, limits processing to fifteen minutes, uploads the result, and removes temporary files. Supported operations are audio conversion, clipping, normalization, artwork resizing, art track creation and waveform audiograms. Audio/video output duration is bounded to one hour, uploads and outputs to 250 MB, and account storage to 1 GB. Long-form output requirements need a deliberate quota review.

A configured key alone does not mark the service ready: a successful claim poll within two minutes is required. A single busy worker can cause new submissions to pause until it next polls; provision multiple workers for concurrent throughput. Do not run this development checkout as a durable production processor.

## Verification performed

The full website build passed, including public-link and accessibility source gates and seven crawl tests. Nine platform tests pass, covering authentication, revocation, refresh rotation, owner elevation/kill switch, vault encryption and readback protection, ownership, input validation, CSRF, rate limits, native refresh without browser Origin, and preservation of a committed media output on audit failure. Local FFmpeg smoke tests produced nonempty outputs for audio conversion, clipping, normalization, art tracks and audiograms.

These checks do not establish real-device VoiceOver accessibility, live Clerk/provider connectivity, production push delivery, or complete acceptance of the original plan.

## Remaining before full rollout

- Complete security/ownership tests for media leases, cancellation and concurrent writes, and label service bridges.
- Review and complete the remaining community v1, broadcast/outbox, webhook/event, role/scope, backup/restore, administration and documentation requirements against the original plan. Existing website functionality is not evidence that every requested v1 endpoint is implemented.
- Provision PLATFORM_VAULT_KEY as a secret runtime variable without exposing or overwriting an existing key.
- Take and verify a production database backup, test migration and rollback procedures, then deploy and verify the authenticated acceptance paths.
- Configure an actual processor host before enabling media jobs.
- Enter APNs/FCM credentials in Integration Vault and test on devices; Web Push is not implemented.
- Validate API hostname DNS. The redundant pending music hostname was replaced by api.mrblindbandit.net; /music/ remains. API hostname is pending, not active. Existing main-domain /v1 paths can serve the API once deployed.

Retain production release 55 as the code rollback point. Additive platform tables should remain during a code rollback; do not drop tables containing newly created user data. A code release alone is not a database backup.

## 2026-09-18 Mobile/social update

Migration 0007 adds social + web push tables. Social routes use Clerk (`socialAuthenticate`) without label membership. LiveKit token minting and Web Push/APNs/FCM registration are implemented in source; configure secrets per HOSTING_SECRETS.md. See docs/API.md and CHANGELOG.md.
