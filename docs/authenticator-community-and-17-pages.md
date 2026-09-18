# Authenticator, community and 17 internal pages — 2026-09-09

This release includes Portal search and My shortcuts from the preceding request, plus 17 further private pages:

1. Google Authenticator — administrator time-based code enrollment using a manual setup key or authenticator deep link; encrypted secrets, confirmation before enabling, account-bound encryption, replay protection and attempt limits. Email and recovery codes remain alternative verification methods. Disabling requires fresh verification and an unused authenticator code. Passkeys are not included.
2. Account sessions — recorded browser, IP, sign-in and expiry details. Owner can review/revoke account sessions; other administrators only their own. No precise geolocation is inferred. ChatGPT sessions are separately managed by ChatGPT.
3. Community accounts — administrators provision named fan invitations, send branded email, and suspend/restore invited profiles. Claim requires ChatGPT sign-in with the invited email. Fan invitations do not create label users, credentials or private portal permissions. Directory limited to 200 invitations. Existing open community sign-in continues.
4–17. Security training, recovery drills, device register, security exceptions, policy reviews, vendor access reviews, retention register, consent requests, release sign-offs, master deliverables, royalty reconciliation, contract renewals, campaign reporting, staff onboarding.

The fourteen record workspaces provide durable records, due dates, review checklists, search/filter, edit/archive and CSV export. They record human actions; they do not configure devices, automatically delete retained data, sign contracts, transfer royalties or execute external workflows.

Authentication settings remain owner/admin-only. Authenticator setup must be completed by the person using their own app; no real owner authenticator was enrolled by deployment.

Validation: 26 automated tests passed, including standard HOTP/TOTP vectors, encrypted-secret storage, enrollment, replay rejection, identity-bound community invitation claim, absence of label permission grants, suspension, sessions access, and existing search/portal/crawl behavior. Tests mock email delivery; no actual customer invitations were sent during testing.
