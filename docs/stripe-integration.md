# Stripe support integration

Production keys are managed through Sites runtime settings. STRIPE_SECRET_KEY
is secret; STRIPE_PUBLISHABLE_KEY is stored for future browser integrations.
Hosted Checkout does not require Stripe.js or exposing a publishable key.

## Shipped flows

- One-time voluntary support: USD 2–500, suggested/custom amounts, explicit
  acceptance, server validation, origin checks, rate limiting and idempotency.
- Stripe-hosted checkout with eligible dynamic payment methods; no raw card
  credentials pass through the website.
- Signed, HttpOnly, Secure, SameSite=Lax checkout-reference cookie lasting one
  day. The result endpoint retrieves Stripe status; redirects are not proof.
- Owner/admin-only Stripe account readiness, whole-account available/pending
  balances and site-tagged support checkout activity, pagination and CSV export.
- Payment help, support terms and updated public privacy notice.

## Intentional boundaries

No real payment is created merely by deployment. Visitors authorize payments
inside Stripe. No live charge was made during implementation. Mocked tests
exercise amount validation, origin restrictions, cookie integrity, session
parameters and private authorization; they do not prove account readiness.

No recurring prices, subscriptions, billable add-ons, tax collection, refunds,
payouts, royalty allocation, public donor list or goods fulfillment are enabled.
Refunds and payout management link to Stripe's own authenticated Dashboard.
Support does not grant goods or entitlements, so no webhook-based fulfillment
is installed. Before adding entitlements or asynchronous automated workflows,
configure signed webhooks and idempotent event handling.

Stripe charges_enabled is checked before each new checkout. The key's actual
permissions and account restrictions are visible when the administrator opens
the payments page. Public status responses never include customer details.
API version: 2026-07-29.dahlia; stripe-node: 22.4.0.

Prefer replacing the full live secret with a restricted key after verifying
permissions for account/balance reads and Checkout Session creation/reads.
