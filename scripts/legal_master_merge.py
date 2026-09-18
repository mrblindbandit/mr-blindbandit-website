"""Merge Blindbandit Legal Master Package into site HTML + owner docs.

- Syncs data/compliance-package.json from the extracted master text
- Writes INTERNAL Parts I–II, XVI–XXVI to docs/legal-master-package/ (owner only)
- Enriches public pages missing Mobile / official addenda (does not wipe existing)
- Enriches /mobile/privacy, trust-safety, about with master-package public crosswalk
- Updates Legal and Trust Center with Mobile links
"""
from __future__ import annotations

import html
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public"
DATA = ROOT / "data"
DOCS = ROOT / "docs" / "legal-master-package"
EXTRACT = Path("/workspace/legal-compliance/compliance-extracted.txt")
if not EXTRACT.exists():
    EXTRACT = DOCS / "compliance-extracted.txt"

EFFECTIVE = "September 13, 2026"
MOBILE_EFFECTIVE = "September 18, 2026"

# Indices match compliance_package.py (0-based paragraph array after sync)
PART_RANGES = {
    "I": (19, 45),
    "II": (45, 72),
    "III": (72, 163),
    "IV": (163, 255),
    "V": (255, 286),
    "VI": (286, 319),
    "VII": (319, 368),
    "VIII": (368, 392),
    "IX": (392, 422),
    "X": (422, 468),
    "XI": (468, 507),
    "XII": (507, 539),
    "XIII": (539, 563),
    "XIV": (563, 615),
    "XV": (615, 629),
    "XVI": (629, 648),
    "XVII": (648, 671),
    "SuppA": (671, 708),
    "SuppB": (708, 747),
    "XVIII": (747, 770),
    "XIX": (770, 805),
    "XX": (805, 826),
    "XXI": (826, 845),
    "XXII": (845, 1055),
    "XXIII": (1055, 1364),
    "XXIV": (1364, 1493),
    "XXV": (1493, 1741),
    "XXVI": (1741, None),
}

INTERNAL_KEYS = ["I", "II", "XVI", "XVII", "XVIII", "XIX", "XX", "XXI", "XXII", "XXIII", "XXIV", "XXV", "XXVI"]

OFFICIAL_ADDENDUM = """<section class="shell legal-expanded" id="official-addendum-2026-09-18">
<h2>Official policy expansion — Blindbandit Records (September 18, 2026)</h2>
<div class="legal-copy">
<p><strong>Operator.</strong> These documents are issued by Kaeleb Savon Heck, professionally known as Mr. Blindbandit, operating Blindbandit Records. Postal address: Purok 6-A, Mabuhay, Barangay Capungagan, Davao del Norte 8113, Philippines. Telephone: +63 962 695 4905 (Philippines) · +1 540 926 9791 (United States). Primary business email: business@mrblindbandit.net. Privacy: privacy@mrblindbandit.net. Legal: legal@mrblindbandit.net. Safety: safety@mrblindbandit.net. Security: security@mrblindbandit.net.</p>
<p><strong>Identity and authentication.</strong> Production sign-in for public community features, Blindbandit Mobile, and the invitation-only label portal is provided through Clerk. Users should sign in with their production Clerk account. Clerk manages credentials, Google sign-in (where enabled), multi-factor authentication, session lifecycle, and recovery. Legacy in-portal Google Authenticator (TOTP) enrollment, portal email verification codes for step-up, and competing Better Auth password-first flows for new public/social access are retired. Authorization decisions remain server-side and role-aware.</p>
<p><strong>Blindbandit Mobile.</strong> The social product at https://mrblindbandit.net/mobile allows any person with a verified Clerk email to create a profile, publish posts, follow others, send direct messages, place LiveKit voice/video calls, register Web Push / APNs / FCM notification tokens, apply for verification, and apply for creator monetization, subject to Trust &amp; Safety and applicable law. The official verified artist profile @mrblindbandit is operated by Blindbandit Records.</p>
<p><strong>Realtime communications.</strong> Voice and video rooms are authorized by short-lived LiveKit access tokens minted on the Cloudflare Worker using the Operator’s LiveKit server credentials. API secrets never ship in browser or app binaries. Banned or call-disabled accounts cannot mint tokens.</p>
<p><strong>Notifications.</strong> Device tokens (iOS APNs, Android FCM) and browser Web Push subscriptions (VAPID) may be stored in encrypted form when the platform vault is configured. Users may unregister devices. Moderators may revoke tokens for abuse response.</p>
<p><strong>Advertising.</strong> Google AdSense (publisher ca-pub-7238428274233485) may appear only on eligible public surfaces subject to Privacy Choices. Ads are not placed on privacy, terms, cookies, trust &amp; safety, community guidelines, copyright, security reporting, authentication, account, payment/checkout, messaging, calls, admin, or other excluded pages.</p>
<p><strong>Moderation and admin.</strong> Designated moderators and operators may ban, suspend, mute, hide content, review verification and ads, inspect redacted device records, force-disconnect calls, broadcast announcements, and record admin audit events through the Social Admin Control Center. Enforcement actions may be logged and preserved as required for security and legal process.</p>
<p><strong>Children.</strong> Services are not directed to children under 13. See the Child Safety Policy at /safety/ and Mobile Trust &amp; Safety.</p>
<p><strong>International transfers, retention, and rights.</strong> Processing may involve Cloudflare, Clerk, LiveKit Cloud, Apple, Google, Spotify embeds, and other subprocessors. Retention follows purpose limitation, legal holds, and security needs. Individuals may exercise applicable privacy rights via privacy@mrblindbandit.net. These documents do not waive non-waivable statutory rights.</p>
<p><strong>Master package.</strong> Public website policies incorporate Parts III–XV and Supplement B of the Blindbandit Legal Master Package (Version 2026.09.13), merged with Blindbandit Mobile addenda. Internal operating procedures remain private to the Operator.</p>
<p><strong>Contact for disputes.</strong> Formal legal notices: legal@mrblindbandit.net with postal copy to the address above. Nothing in these documents creates a recording contract, employment relationship, or license beyond the licenses expressly granted for hosting user content on Blindbandit platforms.</p>
</div></section>"""

PAGE_MOBILE = {
    "safety": (
        "safety-mobile",
        "Blindbandit Mobile child safety — September 18, 2026",
        """
<p>The Child Safety Policy applies to Blindbandit Mobile profiles, posts, messages, calls, verification, monetization, and push notifications at <a href="/mobile/">/mobile/</a>. Children under 13 must not create Mobile accounts, post, message, call, register devices, or submit personal information.</p>
<p>Report Mobile child-safety concerns to <a href="mailto:safety@mrblindbandit.net">safety@mrblindbandit.net</a> with the profile handle, post or message URL or ID if available, and a plain description. Do not download, copy, or forward suspected child sexual abuse imagery. For immediate danger, contact local emergency services first.</p>
<p>Mobile Trust &amp; Safety and Social Admin tools may restrict accounts, preserve necessary records, revoke notification tokens, and disconnect calls when required for child protection. See also <a href="/mobile/trust-safety/">Mobile Trust &amp; Safety</a> and <a href="/moderation-appeals/">Content Reports and Moderation Appeals</a>.</p>
""",
    ),
    "accessibility": (
        "accessibility-mobile",
        "Blindbandit Mobile accessibility — September 18, 2026",
        """
<p>Blindbandit Mobile is covered by the same WCAG 2.2 Level AA development target as the public website. This is a commitment to improvement, not a claim of verified full conformance on every Mobile screen.</p>
<p>Mobile navigation, forms, messaging, calls, and settings should remain operable with keyboard, zoom, and assistive technologies where practical. Report Mobile accessibility barriers to <a href="mailto:accessibility@mrblindbandit.net">accessibility@mrblindbandit.net</a>. Product-specific pages: <a href="/mobile/about/">About Blindbandit Mobile</a>.</p>
""",
    ),
    "moderation-appeals": (
        "appeals-mobile",
        "Blindbandit Mobile reports and appeals — September 18, 2026",
        """
<p>Content reports and moderation appeals cover Blindbandit Mobile posts, profiles, messages (where reviewable), verification decisions, monetization restrictions, call disconnects, and device-token revocations, in addition to classic community boards.</p>
<p>Use <a href="/report-content/">Report content or appeal a decision</a> or email <a href="mailto:safety@mrblindbandit.net">safety@mrblindbandit.net</a> / <a href="mailto:support@mrblindbandit.net">support@mrblindbandit.net</a>. Include the Mobile profile handle, content URL or decision reference, and the outcome requested. Do not attach illegal imagery.</p>
<p>Social Admin enforcement is logged for authorized review. Appeals receive a good-faith review; restoration is not guaranteed where safety, law, or rights require continued restriction. Related: <a href="/mobile/trust-safety/">Trust &amp; Safety</a> · <a href="/community-guidelines/">Community Guidelines</a>.</p>
""",
    ),
    "legal": (
        "legal-mobile",
        "Blindbandit Mobile legal pages — September 18, 2026",
        """
<p>Blindbandit Mobile is part of the mrblindbandit.net service family. Product-specific documents:</p>
<ul>
<li><a href="/mobile/privacy/">Mobile Privacy Policy</a></li>
<li><a href="/mobile/trust-safety/">Mobile Trust &amp; Safety</a></li>
<li><a href="/mobile/about/">About Blindbandit Mobile</a></li>
</ul>
<p>Site-wide Terms, Privacy, Community Guidelines, Child Safety, Cookies, Copyright, Advertising, Security Reporting, Accessibility, Submission Terms, Media Suite Terms, and Moderation Appeals continue to apply unless a Mobile page states a narrower product rule.</p>
""",
    ),
    "contact": (
        "contact-mobile",
        "Blindbandit Mobile contacts — September 18, 2026",
        """
<p>For Blindbandit Mobile account, messaging, calling, push, verification, or monetization questions, use <a href="mailto:support@mrblindbandit.net">support@mrblindbandit.net</a>. Privacy rights: <a href="mailto:privacy@mrblindbandit.net">privacy@mrblindbandit.net</a>. Safety: <a href="mailto:safety@mrblindbandit.net">safety@mrblindbandit.net</a>. Security: <a href="mailto:security@mrblindbandit.net">security@mrblindbandit.net</a>. Legal: <a href="mailto:legal@mrblindbandit.net">legal@mrblindbandit.net</a>.</p>
<p>Open Mobile at <a href="/mobile/">/mobile/</a>. Policies: <a href="/mobile/privacy/">Privacy</a> · <a href="/mobile/trust-safety/">Trust &amp; Safety</a> · <a href="/mobile/about/">About</a>.</p>
""",
    ),
}


def sync_compliance_json() -> list[str]:
    text = EXTRACT.read_text(encoding="utf-8")
    lines = text.split("\n")
    while lines and lines[0] == "":
        lines = lines[1:]
    while lines and lines[-1] == "":
        lines = lines[:-1]
    # Keep trailing empty line style consistent with prior JSON end marker block
    if lines and lines[-1] != "":
        # prior file ended without requiring trailing empties inside array; store as-is
        pass
    out = DATA / "compliance-package.json"
    out.write_text(json.dumps(lines, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Synced compliance-package.json ({len(lines)} paragraphs)")
    return lines


def write_internal_docs(paras: list[str]) -> None:
    DOCS.mkdir(parents=True, exist_ok=True)
    readme = DOCS / "README.md"
    readme.write_text(
        f"""# Blindbandit Legal Master Package (owner docs)

Version 2026.09.13 · Effective reference date {EFFECTIVE} · Mobile addenda {MOBILE_EFFECTIVE}

## Canonical sources

- Original DOCX: `Blindbandit-Legal-Master-Package.docx`
- Extracted text: `compliance-extracted.txt`
- Site JSON (canonical for generators): `../../data/compliance-package.json`

## Public vs internal

**Publish on the public website (Parts III–XV + Supplement B, and Supplement A when paid consumer sales launch):**
Terms, Privacy, Cookies, Copyright, Community Guidelines, Child Safety, Submission Terms, Media Suite Terms, Advertising Disclosure, Accessibility Statement, Security Reporting, plus Moderation Appeals (Supp B). Label Portal supplemental terms/privacy stay behind portal auth.

**Keep OFF the public website (this folder + portal handbook):**
- Part I — Executive audit (INTERNAL / OWNER OPERATIONS)
- Part II — Officer and governance assignments (INTERNAL)
- Part XVI — Email / newsletter implementation standard (internal; public-facing rules already reflected in Privacy marketing sections)
- Part XVII — Vendor governance (internal)
- Parts XVIII–XXI — Internal privacy rights, retention, incident, moderation procedures
- Parts XXII–XXVI — Work checklists, WCAG audit plan, jurisdiction gates, go-live script, research index

## Files

- `internal-operating-procedures.md` — Parts I–II, XVI–XXVI concatenated for owner/admin use
- Public HTML is generated/merged under `public/` and must not contain labels such as `INTERNAL`, `PUBLIC WEBSITE DRAFT`, or `OWNER OPERATIONS`.
""",
        encoding="utf-8",
    )

    chunks = ["# Internal / Owner Operations — Blindbandit Legal Master Package\n",
              f"_Not for public HTML. Version 2026.09.13. Generated for owner use only._\n"]
    for key in INTERNAL_KEYS:
        start, end = PART_RANGES[key]
        end = end if end is not None else len(paras)
        chunks.append(f"\n---\n\n## Range {key} (paragraphs {start}–{end})\n\n")
        for p in paras[start:end]:
            if not p:
                chunks.append("\n")
            else:
                chunks.append(p + "\n\n")
    (DOCS / "internal-operating-procedures.md").write_text("".join(chunks), encoding="utf-8")
    print("Wrote owner internal docs")


def insert_before_main_end(path: Path, block: str, marker: str) -> bool:
    text = path.read_text(encoding="utf-8")
    if marker in text:
        return False
    if "</main>" not in text:
        print(f"WARN: no </main> in {path}")
        return False
    path.write_text(text.replace("</main>", block + "</main>", 1), encoding="utf-8")
    return True


def enrich_missing_public_pages() -> list[str]:
    updated = []
    for slug, (sid, title, body) in PAGE_MOBILE.items():
        path = PUBLIC / slug / "index.html"
        if not path.exists():
            print(f"skip missing {slug}")
            continue
        text = path.read_text(encoding="utf-8")
        changed = False
        if sid not in text and f'id="{sid}"' not in text:
            section = (
                f'<section id="{sid}" class="shell"><h2>{html.escape(title)}</h2>'
                f'<div class="legal-copy">{body}</div></section>'
            )
            if insert_before_main_end(path, section, sid):
                changed = True
                text = path.read_text(encoding="utf-8")
        if "official-addendum-2026-09-18" not in text:
            if insert_before_main_end(path, OFFICIAL_ADDENDUM, "official-addendum-2026-09-18"):
                changed = True
        if changed:
            updated.append(f"/{slug}/")
            print(f"Enriched /{slug}/")
    return updated


def update_legal_hub() -> bool:
    path = PUBLIC / "legal" / "index.html"
    text = path.read_text(encoding="utf-8")
    if "/mobile/privacy/" in text and "Blindbandit Mobile" in text:
        # still ensure list items exist
        pass
    mobile_list = (
        '<li><a href="/mobile/privacy/">Blindbandit Mobile Privacy</a></li>'
        '<li><a href="/mobile/trust-safety/">Blindbandit Mobile Trust &amp; Safety</a></li>'
        '<li><a href="/mobile/about/">About Blindbandit Mobile</a></li>'
    )
    if 'href="/mobile/privacy/"' not in text:
        # insert after moderation-appeals list item if present
        if "/moderation-appeals/" in text:
            text = text.replace(
                '</ul><p><button type="button" data-privacy-choices>',
                mobile_list + '</ul><p><button type="button" data-privacy-choices>',
                1,
            )
        else:
            text = text.replace("</ul>", mobile_list + "</ul>", 1)
        path.write_text(text, encoding="utf-8")
        print("Updated Legal hub with Mobile links")
        return True
    return False


def paras_to_html(paras: list[str], start: int, end: int, limit_sections: int | None = None) -> str:
    """Convert numbered package paragraphs to public HTML (strip INTERNAL/DRAFT labels)."""
    title = "Scope"
    body: list[str] = []
    sections: list[tuple[str, str]] = []
    for text in paras[start + 1 : end]:
        if not text:
            continue
        if text.startswith(("PUBLIC WEBSITE DRAFT", "PRIVATE /", "INTERNAL ", "Effective", "Part ")):
            continue
        if re.match(r"^\d+\. ", text):
            if body:
                sections.append((title, "".join(body)))
            title = re.sub(r"^\d+\. ", "", text)
            body = []
        else:
            body.append("<p>" + html.escape(text) + "</p>")
    if body:
        sections.append((title, "".join(body)))
    if limit_sections is not None:
        sections = sections[:limit_sections]
    out = []
    for name, copy in sections:
        out.append(f"<h3>{html.escape(name)}</h3>{copy}")
    return "".join(out)


def enrich_mobile_pages(paras: list[str]) -> list[str]:
    updated = []
    # Summaries drawn from public Parts (no INTERNAL labels)
    child = paras_to_html(paras, *PART_RANGES["VIII"], limit_sections=6)
    community = paras_to_html(paras, *PART_RANGES["VII"], limit_sections=8)
    access = paras_to_html(paras, *PART_RANGES["XIV"], limit_sections=5)
    terms_snip = paras_to_html(paras, *PART_RANGES["III"], limit_sections=6)
    privacy_snip = paras_to_html(paras, *PART_RANGES["IV"], limit_sections=6)

    privacy_extra = f"""
<section class="mb-card" id="master-package-privacy">
<h2>Master package privacy crosswalk ({EFFECTIVE})</h2>
<p>Blindbandit Mobile is covered by the website <a href="/privacy/">Privacy Policy</a> (Master Package Part IV) in addition to the Mobile-specific terms on this page. The following excerpts summarize how the master package applies to Mobile; the full Privacy Policy controls if there is any conflict on website-wide topics.</p>
{privacy_snip}
<p>Mobile-specific processing for profiles, posts, follows, Clerk authentication, LiveKit calls, Web Push / APNs / FCM, verification, monetization, and Social Admin review is described in the sections above and remains part of this Mobile Privacy Policy.</p>
<p>Related: <a href="/cookies/">Cookies</a> · <a href="/advertising-disclosure/">Advertising</a> · <a href="/security-reporting/">Security reporting</a> · <a href="/legal/">Legal and Trust Center</a>.</p>
</section>
"""

    trust_extra = f"""
<section class="mb-card" id="master-package-safety">
<h2>Master package safety and community crosswalk ({EFFECTIVE})</h2>
<p>Blindbandit Mobile incorporates the public <a href="/community-guidelines/">Community Guidelines</a> (Part VII) and <a href="/safety/">Child Safety Policy</a> (Part VIII), plus <a href="/moderation-appeals/">Content Reports and Moderation Appeals</a> (Supplement B).</p>
<h3>Community rules (summary)</h3>
{community}
<h3>Child safety (summary)</h3>
{child}
<p>Mobile enforcement may include content removal, account suspension or ban, mute, verification denial, monetization restriction, push-token revocation, and LiveKit call disconnect, with audit logging for authorized operators.</p>
</section>
"""

    about_extra = f"""
<section class="mb-card" id="master-package-about">
<h2>Master package terms and accessibility ({EFFECTIVE})</h2>
<p>Use of Blindbandit Mobile is also governed by the website <a href="/terms/">Terms of Service</a> (Part III) and the <a href="/accessibility/">Accessibility Statement</a> (Part XIV). Product rules on this About page and on Trust &amp; Safety refine those documents for Mobile features.</p>
<h3>Terms highlights for Mobile users</h3>
{terms_snip}
<h3>Accessibility commitment</h3>
{access}
<p>Operator: Kaeleb Savon Heck / Mr. Blindbandit / Blindbandit Records. Site: <a href="https://mrblindbandit.net/">mrblindbandit.net</a>. Mobile: <a href="/mobile/">/mobile/</a>.</p>
</section>
"""

    specs = [
        ("privacy", "master-package-privacy", privacy_extra),
        ("trust-safety", "master-package-safety", trust_extra),
        ("about", "master-package-about", about_extra),
    ]
    for slug, marker, block in specs:
        path = PUBLIC / "mobile" / slug / "index.html"
        text = path.read_text(encoding="utf-8")
        if marker in text:
            print(f"mobile/{slug} already has master crosswalk")
            continue
        # Insert before Related documents section if present, else before </main>
        if re.search(r'<section class="mb-card">\s*<h2>Related documents</h2>', text):
            text = re.sub(
                r'(<section class="mb-card">\s*<h2>Related documents</h2>)',
                block + r"\1",
                text,
                count=1,
            )
        elif "Expanded official terms" in text:
            text = re.sub(
                r'(<section class="mb-card">\s*<h2>Expanded official terms[^<]*</h2>)',
                block + r"\1",
                text,
                count=1,
            )
        else:
            text = text.replace("</main>", block + "</main>", 1)
        # Strengthen Related documents links to site-wide master pages
        if 'href="/safety/"' not in text:
            text = text.replace(
                'href="/community-guidelines/"',
                'href="/community-guidelines/"',
                1,
            )
            text = text.replace(
                ">Community Guidelines</a>",
                '>Community Guidelines</a> · <a href="/safety/">Child Safety</a> · <a href="/accessibility/">Accessibility</a> · <a href="/moderation-appeals/">Moderation Appeals</a> · <a href="/legal/">Legal Hub</a>',
                1,
            )
        # Refresh expanded official terms date note to mention master package merge
        text = text.replace(
            "Expanded official terms (September 18, 2026)",
            "Expanded official terms (September 18, 2026 — merged with Legal Master Package 2026.09.13)",
        )
        path.write_text(text, encoding="utf-8")
        updated.append(f"/mobile/{slug}/")
        print(f"Enriched /mobile/{slug}/")
    return updated


def strengthen_existing_official_addenda() -> list[str]:
    """Ensure already-updated pages mention the master package merge without wiping content."""
    updated = []
    needle = "Master package.</strong>"
    for path in PUBLIC.rglob("index.html"):
        if "/portal/" in str(path) or "/owner/" in str(path):
            continue
        text = path.read_text(encoding="utf-8")
        if "official-addendum-2026-09-18" not in text:
            continue
        if needle in text:
            continue
        # Insert master package sentence before Contact for disputes if present
        if "<p><strong>Contact for disputes.</strong>" in text:
            insert = (
                '<p><strong>Master package.</strong> Public website policies incorporate Parts III–XV and '
                "Supplement B of the Blindbandit Legal Master Package (Version 2026.09.13), merged with "
                "Blindbandit Mobile addenda. Internal operating procedures remain private to the Operator.</p>\n"
            )
            text = text.replace(
                "<p><strong>Contact for disputes.</strong>",
                insert + "<p><strong>Contact for disputes.</strong>",
                1,
            )
            path.write_text(text, encoding="utf-8")
            updated.append("/" + str(path.relative_to(PUBLIC).parent).replace("\\", "/") + "/")
    if updated:
        print(f"Strengthened official addenda on {len(updated)} pages")
    return updated


def leak_scan() -> list[str]:
    bad = []
    patterns = [
        "INTERNAL / OWNER",
        "INTERNAL OPERATING PROCEDURE",
        "INTERNAL IMPLEMENTATION",
        "INTERNAL AUDIT",
        "INTERNAL LEGAL",
        "INTERNAL WORK",
        "INTERNAL RESEARCH",
        "PUBLIC WEBSITE DRAFT",
        "DO NOT PUBLISH",
        "OWNER OPERATIONS",
    ]
    for path in PUBLIC.rglob("index.html"):
        if "/portal/" in str(path):
            # handbook may intentionally include internal material behind auth
            continue
        text = path.read_text(encoding="utf-8")
        for pat in patterns:
            if pat in text:
                bad.append(f"{path.relative_to(PUBLIC)}: {pat}")
                break
    return bad


def main() -> None:
    paras = sync_compliance_json()
    # Verify key part markers still align with compliance_package.py
    assert paras[72].startswith("Part III"), paras[72][:80]
    assert paras[163].startswith("Part IV"), paras[163][:80]
    assert paras[747].startswith("Part XVIII"), paras[747][:80]
    write_internal_docs(paras)
    pages = []
    pages += enrich_missing_public_pages()
    update_legal_hub()
    pages += enrich_mobile_pages(paras)
    pages += strengthen_existing_official_addenda()
    leaks = leak_scan()
    if leaks:
        print("LEAK WARNINGS:")
        for L in leaks:
            print(" ", L)
    else:
        print("No INTERNAL/DRAFT labels found on public (non-portal) pages")
    report = {
        "updated_pages": sorted(set(pages)),
        "paras": len(paras),
        "leaks": leaks,
    }
    (DOCS / "merge-report.json").write_text(json.dumps(report, indent=2) + "\n")
    print("Done:", report)


if __name__ == "__main__":
    main()
