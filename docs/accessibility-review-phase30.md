# Accessibility remediation — 10 September 2026

Target: WCAG 2.2 AA (https://www.w3.org/TR/WCAG22/). Conformance is NOT established. This review is a bounded code and browser review, not a full WCAG audit, legal certification or guarantee of passing third-party scanners.

## Changes
- Focusable main landmarks on all 172 generated public/private documents; keyboard skip links now transfer focus instead of only scrolling.
- Private workspace skip-navigation link and focusable, named scrollable table regions.
- Native validation summaries with links to invalid fields, associated error descriptions, aria-invalid and focused alerts. Public and private API form errors use the same summary pattern; values stay in place.
- Email/name input-purpose hints and one-time-code autocomplete without blocking paste or password managers.
- Focus restoration when private content replaces its initiating control; native security and privacy dialogs retain Escape behavior.
- Mobile menu Escape/aria-controls and improved music dock focus. Player minimization hides its controls from the keyboard; the dock and consent notice use document flow to avoid obscuring focused content.
- Stronger control borders, legal-page focus colors, touch targets, responsive form/layout sizing, and text wrapping.
- Private motion, text and high-contrast controls. Reduced-motion and forced-colors rules preserved. Public clock has a hide/show control.
- Page navigation reloads when layout or required scripts differ, preserving the right page styling and functionality. Language alternates update with same-layout navigation.
- Deployment gate for generated document landmarks, names, labels, text alternatives, unique IDs and tab-order attributes.

## Verified
- Source gate: 172 generated documents have document language, one H1, one focusable main, no duplicate IDs, no positive tabindex, image alt attributes, iframe titles, button names and labeled non-hidden form controls. This checks attribute presence/structure, not the quality of every alternative or every runtime state.
- Public homepage skip-link activation: document.activeElement became MAIN#main.
- Privacy dialog: named dialog; Escape closes; focus returns to initiating control.
- Empty public music submission: linked error summary, focus on summary and aria-describedby associations; no submission sent.
- Synthetic owner account invitation: linked errors; values retained; verification opens a named native modal; code input exposes autocomplete=one-time-code; Escape closes and returns to a focused form alert. No real account, email, credentials or records were used.
- 320-pixel iframe viewports (305 CSS pixels after scrollbar) for home, privacy, owner team and client earnings: root clientWidth/scrollWidth both 305; owner/client main content does not overflow; wide record tables scroll within labeled, keyboard-focusable containers.
- Representative contrast calculations: body 13.21:1 (#d1dccf/#111310); primary button 9.79:1 (#f8f9ee/#25472f); legal 17.93:1 (#171717/#ffffff); field border 5.32:1 (#899581/#1b1f17). These are selected color pairs, not a complete rendered contrast audit.
- Browser access used the isolated local preview. Synthetic fixtures were removed before the release build; production access checks remain in place.

## Still needed before any full compliance claim
- Real VoiceOver/Safari and NVDA/Firefox or Chrome coverage, including all owner/admin/client workflows and screen-reader announcement quality. Browser accessibility snapshots do not substitute for assistive-technology testing.
- Full WCAG A/AA success-criterion review: all states, text spacing, 200% text and 400% zoom, keyboard focus order/traps, pointer targets, errors, legal/financial confirmations and authentication/re-authentication/session timing.
- Full rendered contrast sweep (including hover/focus/error/high-contrast states), media/caption/audio-description evaluation and third-party player review.
- Accessibility of uploaded PDF contracts, artwork alternatives, embedded media and future community/editorial content must be evaluated individually.
- No axe or Lighthouse claim: the regression gate is a custom semantic check, not either product.
