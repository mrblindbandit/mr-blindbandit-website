# Legal, privacy and accessibility package — September 13, 2026

Source: the operator-supplied Master Legal Compliance Accessibility Package.
The original package is preserved in data/compliance-package.json. Prior public
policies remain in Git history at 4389012ce43eebd578d0fe34827bbdef3fb7ab1a.

## Implemented in this release

- Twelve public policies expanded from the supplied package, with factual
  consent/security language narrowed to the implemented behavior.
- Legal and Trust Center; persistent Privacy Choices; public copyright notice,
  privacy request and content report/appeal forms using the existing protected
  inbox and durable database. Copyright declarations are validated server-side.
- Private portal terms and privacy notice; owner/admin-only operating handbook
  containing governance, rights, retention, incident, moderation, email/vendor,
  jurisdiction, accessibility and launch procedures from the supplied package.
- Nine owner/admin compliance workspaces using existing durable records,
  status boards, owners, dates, export, revision conflict checks and audit logs.
  Terminal statuses require completed checklists and recorded evidence.
- Versioned consent, expiration, rejection, withdrawal and GPC advertising
  opt-out. Analytics remains off. The unconditional AdSense loader is removed;
  verification metadata and ads.txt remain. SDK activation still requires both
  visitor permission and the existing ADS_CMP_READY/server settings gate.
- Worker response headers, including private cache/referrer protections already
  present, nosniff, permissions restrictions, limited framing/object/base CSP
  and one-day HTTPS HSTS without includeSubDomains/preload.
- MP3/WAV upload signature checks in addition to size/extension restrictions.
- Correct Clerk wording, hidden non-focusable anti-spam field, linked dialog
  trigger/region, readable legal page styling, submission/media policy links.
- Reproducible route/forms/storage-key/database/dependency source inventory.

## Remaining work — not certified or automatically completed

The package is not fully completed by this release. This is engineering and
operational support, not a legal opinion or accessibility certification.

- NPC applicability assessment, registration/exemption filings and notification
  system setup; DMCA registration, fees and renewals; applicable jurisdiction
  advice. No filings have been made or registration status claimed.
- Google-certified CMP setup and regional network/consent validation in the
  actual AdSense account. The custom preference dialog is not a certified CMP.
- Physical iOS/macOS VoiceOver, desktop screen reader, zoom/reflow and complete
  task coverage. Existing source checks cannot establish WCAG conformance.
- Actual mailbox delivery/routing, DNS authentication review, provider contracts,
  international-transfer evidence, backup lifecycle and vendor-held exports.
- Mandatory admin MFA/provider session policy review. This release preserves
  existing Clerk sign-in and does not silently change account access settings.
- Retention is a documented review workflow, not an automatic purge. Saved legal
  holds record instructions; they do not automatically stop external deletion.
  Complete scoped legal/contract review before enabling destructive jobs.
- Marketing suppression/double opt-in and unsubscribe delivery automation must
  be implemented before bulk promotional campaigns. The privacy-request form
  accepts unsubscribe requests for manual handling; it does not claim instant
  provider suppression.
- Exact FFmpeg core build flags, linked-codec obligations and source distribution
  review. Existing client/core notices are preserved; no blanket license claim.
- Full resource CSP requires actual provider/network inventory beyond the
  limited policies implemented here. Static source inventory is not a browser
  cookie or network trace.
- Paid services, payments, electronic signatures, cloud media/AI processing and
  child-directed features remain subject to their separate launch gates.

The handbook and trackers support the remaining work without claiming that
checking a record performs a filing, removes content, sends a notice or deletes
data at a provider.
