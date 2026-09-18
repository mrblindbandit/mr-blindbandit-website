#!/usr/bin/env python3
"""Bulk-expand all thin public/**/index.html shells to ≥1200 visible chars."""
from __future__ import annotations
import json, re, html as html_lib
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
D = ROOT / "public"

def esc(s: str) -> str:
    return html_lib.escape(s, quote=True)

def visible_len(markup: str) -> int:
    t = re.sub(r"<script[\s\S]*?</script>", " ", markup, flags=re.I)
    t = re.sub(r"<style[\s\S]*?</style>", " ", t, flags=re.I)
    t = re.sub(r"<[^>]+>", " ", t)
    return len(re.sub(r"\s+", " ", t).strip())

# --- metadata ---
mods: dict[str, dict] = {}
for f in ("workspace.json", "workspace-extra.json", "workspace-daily.json"):
    for m in json.loads((ROOT / "data" / f).read_text()):
        mods[m["slug"]] = m

EXTRAS = {
    "": ("Overview", "Label portal overview — priority desks, notifications, and Label OS command board for Blindbandit Records.", "Operations"),
    "login": ("Sign in", "Sign in to the private Blindbandit Records label portal with your production Clerk account.", "Access"),
    "reset": ("Set or reset password", "Set or reset your Blindbandit Records label portal password through Clerk recovery.", "Access"),
    "clients": ("Clients", "Client roster, statements, and relationship notes for label partners and artists.", "Relationships"),
    "team": ("Team & access", "Team roster, roles, and access controls for Blindbandit Records collaborators.", "Access"),
    "earnings": ("Earnings", "Earnings summaries, payout readiness, and statement review for label accounting.", "Finance"),
    "contracts": ("Contracts", "Contract register, renewals, and document status for Blindbandit Records deals.", "Legal"),
    "messages": ("Messages", "Internal label messages and conversation threads for operational coordination.", "Communications"),
    "tasks": ("Tasks", "Task board for label work: owners, due dates, status, and follow-ups.", "Operations"),
    "inbox": ("Submission inbox", "Submission inbox for music introductions and related artist correspondence.", "A&R"),
    "activity": ("Activity & email", "Activity log and email event history for portal operations.", "Operations"),
    "security": ("Account & security", "Account security settings, sessions, and Clerk-managed authentication controls.", "Access"),
    "api": ("API reference", "API reference for authorized Blindbandit Records label workspace integrations.", "Developers"),
    "privacy": ("Portal privacy", "Portal privacy notice describing how label account and workspace data is handled.", "Legal"),
    "publishing": ("Publishing studio", "Publishing studio for articles, announcements, and editorial release drafts.", "Editorial"),
    "seo": ("SEO command center", "SEO command center for titles, descriptions, sitemaps, and discoverability checks.", "Growth"),
    "departments": ("Departments & email", "Departments and shared email routing for Blindbandit Records operations.", "Operations"),
    "feeds": ("RSS feeds", "RSS and Atom feed management for public label and artist updates.", "Publishing"),
    "bookings": ("Booking pipeline", "Booking pipeline for interviews, appearances, and event requests.", "Booking"),
    "licensing": ("Licensing pipeline", "Licensing pipeline for music-use inquiries and clearance tracking.", "Rights"),
    "sponsorships": ("Sponsorship pipeline", "Sponsorship pipeline for brand and partnership conversations.", "Partnerships"),
    "partnerships": ("Partnership pipeline", "Partnership pipeline for creative collaborations and joint projects.", "Partnerships"),
    "translations": ("Translation manager", "Translation manager for localized public pages and portal copy.", "Localization"),
    "announcements": ("Label announcements", "Label announcements drafts and publication checklist.", "Editorial"),
    "community-publishing": ("Community publishing", "Community publishing controls for fan-facing posts and updates.", "Community"),
    "readiness": ("Rights & delivery readiness", "Rights and delivery readiness checklist before distribution.", "Distribution"),
    "lockdown": ("Emergency lockdown", "Emergency lockdown controls for suspending public surfaces when needed.", "Security"),
    "content-backups": ("Article snapshots", "Article and page snapshot backups for recovery and audit.", "Resilience"),
    "guide": ("Portal guide", "Portal guide explaining Label OS desks, roles, and daily workflows.", "Help"),
    "search": ("Portal search", "Portal search across desks, records, and operational shortcuts.", "Navigation"),
    "shortcuts": ("My shortcuts", "Personal shortcuts to the desks you use most often.", "Navigation"),
    "account-sessions": ("Account sessions", "Active account sessions and device review for portal security.", "Access"),
    "community-accounts": ("Community accounts", "Community account moderation bridge and status overview.", "Community"),
    "notifications": ("Notifications center", "Notifications center for due items, approvals, and social admin bridges.", "Operations"),
    "advertising": ("Advertising placements", "Advertising placements review linked to disclosure and Social Admin.", "Advertising"),
    "reply-templates": ("Saved reply templates", "Saved reply templates for consistent label correspondence.", "Communications"),
    "personal-notes": ("My private notes", "Private personal notes for your own label workflow (not shared).", "Personal"),
    "payments": ("Stripe payments", "Stripe payment activity overview for support and label checkout flows.", "Finance"),
    "payment-activity": ("Support payment activity", "Support payment activity log for recent Stripe checkout results.", "Finance"),
}

RELATED = [
    ("/portal/", "Overview"),
    ("/portal/notifications/", "Notifications"),
    ("/portal/tasks/", "Tasks"),
    ("/portal/guide/", "Portal guide"),
    ("/portal/privacy/", "Portal privacy"),
    ("/portal/login/", "Sign in"),
    ("/mobile/admin/", "Social Admin"),
    ("/community/", "Fan community"),
]

def portal_block(slug: str, title: str) -> str:
    if slug in mods:
        m = mods[slug]
        desc = m.get("description") or f"Operational desk for {title}."
        group = m.get("group") or "Label OS"
        checklist = m.get("checklist") or []
        fields = m.get("fields") or []
        statuses = m.get("statuses") or []
        roles = m.get("roles") or []
        note = m.get("note") or ""
    else:
        title2, desc, group = EXTRAS.get(slug, (title, f"Private Blindbandit Records label desk for {title}.", "Label OS"))
        title = title or title2
        checklist = [
            "Confirm you are signed in with your production Clerk account",
            "Review open items and owners before changing status",
            "Capture a short note when you complete a step",
            "Link related desks when handoff is required",
            "Escalate blockers through notifications or messages",
        ]
        fields = ["Title", "Owner", "Status", "Due date", "Notes"]
        statuses = ["Draft", "In progress", "Blocked", "Done", "Archived"]
        roles = ["Owner", "Editor", "Viewer"]
        note = ""

    checklist = (checklist + [
        "Keep sensitive financial credentials out of notes and uploads",
        "Use related links below when another desk owns the next step",
        "Prefer short, dated status updates over long free-form essays",
    ])[:8]
    fields = (fields + ["Priority", "Last updated", "Related links"])[:8]
    statuses = (statuses + ["Needs review", "Waiting on client", "Closed"])[:6]
    roles = roles or ["Owner", "Editor", "Viewer"]

    features = [
        f"<li><strong>Purpose.</strong> {esc(desc)} This desk is part of the Blindbandit Records Label OS and is invitation-only.</li>",
        f"<li><strong>Group.</strong> {esc(str(group))} — use it alongside neighboring desks so work stays discoverable.</li>",
        f"<li><strong>Roles.</strong> Typical access patterns: {esc(', '.join(map(str, roles)))}. Clerk enforces production sign-in; portal roles gate writes.</li>",
        f"<li><strong>Statuses.</strong> Common lifecycle values: {esc(', '.join(map(str, statuses)))}.</li>",
        "<li><strong>Empty state.</strong> When no records exist yet, add a starter item with an owner and due date so the queue is measurable.</li>",
        "<li><strong>Audit habit.</strong> Prefer dated notes, avoid pasting secrets, and keep client banking details off this surface.</li>",
        "<li><strong>Handoffs.</strong> Link related desks (tasks, notifications, contracts, readiness) instead of duplicating the same record.</li>",
        "<li><strong>Support.</strong> Account help: <a href=\"mailto:business@mrblindbandit.net\">business@mrblindbandit.net</a>. Privacy: <a href=\"/portal/privacy/\" data-full-navigation>portal privacy notice</a>.</li>",
    ]

    check_html = "".join(f"<li>{esc(str(c))}</li>" for c in checklist)
    field_html = "".join(f"<li>{esc(str(f))}</li>" for f in fields)
    related = "".join(f'<a href="{u}" data-full-navigation>{esc(n)}</a>' for u, n in RELATED)

    clerk = ""
    if slug in ("login", "reset", "security", ""):
        clerk = (
            '<div class="label-compose" style="margin-top:1rem">'
            "<h3>Sign in with your production Clerk account</h3>"
            "<p>Use the verified production Clerk account for your Blindbandit Records label email. "
            "Clerk manages sign-in, Google authentication, multi-factor authentication, sessions, and recovery. "
            "Label access remains invitation-only and role-based. Never share one-time codes or recovery secrets in chat.</p>"
            '<p><a class="button" href="/sign-in?redirect_url=%2Fportal%2F" data-full-navigation>Continue to Clerk sign-in</a> '
            '<a class="text-link" href="/portal/guide/" data-full-navigation>Read the portal guide</a></p></div>'
        )

    note_p = f"<p>{esc(note)}</p>" if note else (
        f"<p>Use <strong>{esc(title)}</strong> as the source of truth for this workflow. "
        "Interactive records load in the panel below after you authenticate. "
        "The static guidance on this page remains available without JavaScript so operators always know the desk purpose, checklist, and handoff path.</p>"
    )

    return f'''
<article class="label-content desk-static" data-desk-static="1">
<p class="eyebrow">{esc(str(group).upper())} · LABEL OS</p>
<h2>About this desk</h2>
{note_p}
<p>{esc(desc)} Blindbandit Records operators use this surface to keep work visible, assign owners, and leave a clear trail for the next person. Public marketing pages and legal documents are not edited here; those remain on their dedicated routes.</p>
<p>This page is content-complete on its own: you can read the purpose, checklist, field expectations, empty-state guidance, and related links even before the interactive workspace finishes loading. After sign-in, workspace enhancements attach to the panel below without removing this guidance.</p>
<div class="label-stats">
<article><span>Desk</span><strong style="font-size:1.25rem">{esc(title)}</strong></article>
<article><span>Workspace group</span><strong style="font-size:1.25rem">{esc(str(group))}</strong></article>
<article><span>Access</span><strong style="font-size:1.25rem">Clerk · role-based</strong></article>
<article><span>Visibility</span><strong style="font-size:1.25rem">Private · noindex</strong></article>
</div>
<h3>What you can do here</h3>
<ul>{''.join(features)}</ul>
<div class="label-empty">
<h2>Empty state / getting started</h2>
<p>If the interactive list is empty, create the first record with a clear title, an owner, and a realistic due date. Add one sentence describing the next action. Then open Notifications if someone else must approve or continue the work.</p>
<p>For recurring work, prefer short checklist items over large dumps of text. Keep files limited to materials you are authorized to store for label operations.</p>
</div>
<div class="label-layout" style="margin-top:1.5rem">
<div>
<h3>Starter checklist</h3>
<ul>{check_html}</ul>
<h3>Typical fields</h3>
<ul>{field_html}</ul>
</div>
<aside class="side-note" style="border:1px solid #424a35;padding:1rem;border-radius:12px;background:#171b13">
<h3>Related Label OS links</h3>
<nav style="display:grid;gap:.5rem">{related}</nav>
<p class="small">Artist website: <a href="https://mrblindbandit.net/" data-full-navigation>mrblindbandit.net</a> · Social Admin: <a href="/mobile/admin/" data-full-navigation>/mobile/admin/</a></p>
</aside>
</div>
{clerk}
<p class="small">© 2026 Blindbandit Records. Portal desks are private operational tools. Do not paste API keys, PEM files, Stripe secrets, LiveKit secrets, or Clerk secret keys into notes.</p>
</article>
'''

def expand_portal(path: Path) -> bool:
    html = path.read_text(encoding="utf-8")
    if visible_len(html) >= 1200:
        return False
    slug = "" if path.parent.name == "portal" else path.parent.name
    h1 = re.search(r"<h1[^>]*>([\s\S]*?)</h1>", html)
    title = re.sub(r"<[^>]+>", "", h1.group(1)).strip() if h1 else (EXTRAS.get(slug, (slug,))[0] if slug in EXTRAS else slug)
    if slug in mods:
        title = mods[slug].get("title") or title
    block = portal_block(slug, title)
    # Insert static content before the interactive mount so JS can replace only the mount.
    if 'data-desk-static="1"' in html:
        html = re.sub(r'<article class="label-content desk-static"[\s\S]*?</article>\s*', "", html, count=1)
    if 'data-label-portal' in html:
        html = html.replace(
            '<div data-label-portal',
            block + '<div data-label-portal',
            1,
        )
    else:
        html = html.replace("</main>", block + "</main>", 1)
    # Enrich meta description when generic
    if slug in mods:
        desc = mods[slug].get("description") or ""
        if desc and 'content="Private accounts and label management' in html:
            html = html.replace(
                'content="Private accounts and label management for Blindbandit Records."',
                f'content="{esc(desc[:155])}"',
            )
    path.write_text(html, encoding="utf-8")
    return True

MOBILE_COPY = {
    "mobile/index.html": (
        "Feed",
        "Home feed for Blindbandit Mobile — posts, follows, and updates from creators you care about.",
        [
            ("Share and follow", "Create a free Clerk profile, follow Mr. Blindbandit, and post updates that friends can discover on Explore."),
            ("Music in the same app", "Open the verified artist profile for Spotify listening, media, and official announcements without leaving Blindbandit Mobile."),
            ("Messages and calls", "Direct messages and LiveKit-powered voice or video calls use the same production Clerk session."),
            ("Safety first", "Report tools, trust & safety policies, and Social Admin moderation keep the network usable for fans and creators."),
        ],
    ),
    "mobile/explore/index.html": (
        "Explore",
        "Discover creators, search handles, and open the verified Mr. Blindbandit artist profile.",
        [
            ("Search people", "Look up handles and display names, then open public profiles to follow or message."),
            ("Official artist", "Start with @mrblindbandit for music, posts, and verified identity signals."),
            ("Join the network", "New members can create a free account with Google or email through Clerk."),
            ("Respect the community", "Follow Community Guidelines; harassment and spam are removed through Social Admin."),
        ],
    ),
    "mobile/messages/index.html": (
        "Messages",
        "Direct messages between Blindbandit Mobile members. Sign in to read and send conversations.",
        [
            ("Private threads", "Message other members after you both participate in the network. Threads stay tied to your Clerk identity."),
            ("Empty inbox", "No conversations yet? Open Explore, visit a profile, and start with a clear, respectful hello."),
            ("Safety", "Do not share passwords, payment credentials, or one-time codes in chat. Report abuse from Settings."),
            ("Calls nearby", "Need voice or video? Use Calls with LiveKit tokens minted for your session."),
        ],
    ),
    "mobile/calls/index.html": (
        "Calls",
        "Voice and video calls on Blindbandit Mobile powered by LiveKit tokens from the owner’s LiveKit server.",
        [
            ("Start or join", "Authenticated members can mint a room token and join voice or video sessions."),
            ("Device permissions", "Allow microphone and camera only when you intend to publish audio or video."),
            ("Native apps", "Android package net.mrblindbandit.app and iOS clients use the same LiveKit and social call APIs."),
            ("Moderation", "Operators can force-disconnect abusive sessions from Social Admin when required."),
        ],
    ),
    "mobile/settings/index.html": (
        "Settings",
        "Account, privacy, notifications, and moderator tools for Blindbandit Mobile.",
        [
            ("Clerk account", "Manage sign-in, sessions, and recovery through your production Clerk account."),
            ("Push notifications", "Register web or mobile devices for topics you care about; revoke devices anytime."),
            ("Privacy & safety", "Review mobile privacy, trust & safety, and how to report problems."),
            ("Moderators", "Designated operators can open Social Admin from Settings when privileges allow."),
        ],
    ),
    "mobile/verification/index.html": (
        "Verification",
        "Request or review verification for Blindbandit Mobile profiles.",
        [
            ("Why verify", "Verification helps fans recognize official artist and partner identities."),
            ("How to apply", "Sign in, complete the verification form, and wait for Social Admin review."),
            ("Evidence", "Provide clear ownership signals for the handle you claim. Impersonation is removed."),
            ("Status", "Approved, pending, and rejected outcomes appear after moderators review the queue."),
        ],
    ),
    "mobile/monetization/index.html": (
        "Monetization",
        "Creator monetization program overview for Blindbandit Mobile.",
        [
            ("Eligibility", "Verification and policy compliance are required before monetization tools unlock."),
            ("Transparency", "Advertising and sponsorship surfaces follow the public advertising disclosure."),
            ("Payouts", "Financial details are handled through approved payment partners — never paste bank secrets into posts."),
            ("Support", "Questions: business@mrblindbandit.net. Safety issues: safety@mrblindbandit.net."),
        ],
    ),
    "mobile/u/index.html": (
        "Profiles",
        "Public Blindbandit Mobile profiles — open a handle to see posts, music, and about information.",
        [
            ("Find someone", "Use Explore search or a direct /mobile/u/{handle}/ link."),
            ("Official artist", "Visit /mobile/u/mrblindbandit/ for the verified founder profile and Spotify showcase."),
            ("Your profile", "After sign-up, choose a display name and handle you are prepared to keep."),
            ("Reporting", "Use in-product report tools or email safety@mrblindbandit.net for urgent harm."),
        ],
    ),
    "mobile/u/mrblindbandit/index.html": (
        "Mr. Blindbandit",
        "Official verified Blindbandit Mobile profile for Mr. Blindbandit — artist, producer, and founder of Blindbandit Records.",
        [
            ("Music", "Listen via the Spotify artist showcase embedded on this profile."),
            ("Posts", "Follow for release notes, creative updates, and community moments."),
            ("About", "Learn the story behind Blindbandit Records and accessibility-first creation."),
            ("Connect", "Message when enabled, or use public contact routes on mrblindbandit.net for business."),
        ],
    ),
    "mobile/admin/index.html": (
        "Social Admin Control Center",
        "Moderator console for Blindbandit Mobile: users, reports, ads review, verification queue, push, and audit.",
        [
            ("Access", "Restricted to Blindbandit Records operators and designated moderators signed in with production Clerk."),
            ("Casework", "Search users, apply restrictions, hide or delete posts, and resolve reports with an audit trail."),
            ("Queues", "Verification and ads review keep public trust signals accurate."),
            ("Devices & calls", "Revoke push devices and force-disconnect calls when safety requires it."),
        ],
    ),
}

def mobile_static(title: str, blurb: str, sections: list[tuple[str, str]]) -> str:
    parts = [
        f'<section class="mb-card desk-static" data-desk-static="1">',
        f'<p class="mb-gold" style="letter-spacing:.08em;font-size:.75rem;margin:0">BLINDBANDIT MOBILE</p>',
        f'<h1 style="margin:.4rem 0">{esc(title)}</h1>',
        f'<p class="mb-muted">{esc(blurb)}</p>',
        '<p class="mb-muted">Blindbandit Mobile is the social network for fans and creators around Mr. Blindbandit. '
        "Create a free Clerk account (Google or email), follow people, post, message, and join voice or video calls. "
        "Interactive panels enhance this page after JavaScript loads; the guidance below remains useful on its own.</p>",
        '<nav class="mb-tabs" aria-label="Mobile destinations" style="flex-wrap:wrap">',
        '<a href="/mobile/">Feed</a><a href="/mobile/explore/">Explore</a>',
        '<a href="/mobile/u/mrblindbandit/?tab=music">Music</a><a href="/mobile/messages/">Messages</a>',
        '<a href="/mobile/calls/">Calls</a><a href="/mobile/settings/">Settings</a>',
        '<a href="/mobile/privacy/">Privacy</a><a href="/mobile/trust-safety/">Trust &amp; safety</a>',
        '<a href="/mobile/about/">About</a><a href="/sign-up?redirect_url=%2Fmobile%2F">Join</a>',
        "</nav></section>",
    ]
    for i, (h, p) in enumerate(sections, 1):
        parts.append(
            f'<section class="mb-card"><span class="mb-gold" style="font-size:.75rem">§{i:02d}</span>'
            f"<h2>{esc(h)}</h2><p>{esc(p)}</p>"
            f"<p>Blindbandit Records operates this product with accessibility-minded design, clear policies, and "
            f"moderator tools. For business inquiries use "
            f'<a href="mailto:business@mrblindbandit.net">business@mrblindbandit.net</a>. '
            f"For privacy requests use "
            f'<a href="mailto:privacy@mrblindbandit.net">privacy@mrblindbandit.net</a>.</p></section>'
        )
    parts.append(
        '<section class="mb-card"><h2>Policies &amp; help</h2>'
        "<p>Read the mobile privacy policy, trust &amp; safety overview, community guidelines, and advertising disclosure "
        "before posting promotional content. Children and teens have extra protections; see Child Safety on the main site.</p>"
        '<p><a href="/mobile/privacy/">Privacy</a> · <a href="/mobile/trust-safety/">Trust &amp; safety</a> · '
        '<a href="/community-guidelines/">Community guidelines</a> · <a href="/safety/">Child safety</a> · '
        '<a href="/advertising-disclosure/">Advertising disclosure</a> · <a href="/contact/">Contact</a></p>'
        "<p class=\"mb-muted\">© 2026 Blindbandit Records. Sign in with your production Clerk account for member features. "
        "AdSense is not shown on private messages, calls, admin, or legal surfaces.</p></section>"
    )
    return "\n".join(parts)

def expand_mobile(path: Path, rel: str) -> bool:
    html = path.read_text(encoding="utf-8")
    if visible_len(html) >= 1200 and 'data-desk-static="1"' in html:
        return False
    title, blurb, sections = MOBILE_COPY[rel]
    block = mobile_static(title, blurb, sections)
    # Remove prior static injection
    html = re.sub(r'<section class="mb-card desk-static"[\s\S]*?data-desk-static="1"[\s\S]*?</section>\s*', "", html, count=1)
    # Prefer inserting inside main before SPA placeholder / existing content
    if 'data-desk-static="1"' in html:
        html = re.sub(r'(<section[^>]*data-desk-static="1"[\s\S]*?</section>\s*)+', "", html)
    if 'id="mb-main"' in html:
        html = re.sub(
            r'(<main\b[^>]*id="mb-main"[^>]*>)',
            r"\1" + block,
            html,
            count=1,
        )
    else:
        html = html.replace("</main>", block + "</main>", 1)
    # Ensure meta description is decent
    path.write_text(html, encoding="utf-8")
    return True

OTHER_BLOCKS = {
    "community/account/index.html": '''
<section class="shell section desk-static" data-desk-static="1">
<p class="eyebrow">COMMUNITY · ACCOUNT</p>
<h2>Your Blindbandit community account</h2>
<p>Sign in securely with your production Clerk account, choose a public display name, and join the conversation around Mr. Blindbandit’s music and Blindbandit Records.</p>
<p>This account surface is for fans and creators who want to participate in community features. It is separate from the private Label OS portal used by invitation-only operators. Clerk manages authentication, Google sign-in, multi-factor options, sessions, and recovery.</p>
<ul>
<li><strong>Create or sign in.</strong> Use Clerk with Google or email. Keep recovery codes private.</li>
<li><strong>Display name.</strong> Pick a name you are comfortable showing publicly beside comments or community activity.</li>
<li><strong>Mobile profile.</strong> Prefer the full social experience? Continue into Blindbandit Mobile after sign-in.</li>
<li><strong>Privacy.</strong> Review the site privacy policy and community guidelines before posting.</li>
<li><strong>Help.</strong> Email business@mrblindbandit.net for account assistance. Safety: safety@mrblindbandit.net.</li>
</ul>
<div class="label-empty"><h2>Empty / first visit</h2>
<p>If you have not signed in yet, use the Clerk button on this page. After authentication, complete your display name and explore the fan hub, mailing list (optional), and Blindbandit Mobile feed.</p></div>
<p><a class="button" href="/sign-in?redirect_url=%2Fcommunity%2Faccount%2F">Sign in with Clerk</a>
<a class="button" href="/mobile/">Open Blindbandit Mobile</a>
<a class="text-link" href="/community/">Community home</a>
<a class="text-link" href="/privacy/">Privacy</a>
<a class="text-link" href="/fans/">Fan hub</a></p>
<p class="small">© 2026 Blindbandit Records. Do not paste passwords or payment secrets into community forms.</p>
</section>
''',
    "community/dashboard/index.html": '''
<section class="shell section desk-static" data-desk-static="1">
<p class="eyebrow">COMMUNITY · DASHBOARD</p>
<h2>Your place in the Blindbandit community</h2>
<p>This dashboard summarizes your community participation: profile basics, recent activity, and shortcuts into Blindbandit Mobile, the fan hub, and optional mailing-list preferences.</p>
<p>Interactive widgets load after JavaScript confirms your Clerk session. The guidance below explains what you can do even when dynamic panels are still loading.</p>
<ul>
<li><strong>Profile.</strong> Keep your display name accurate and appropriate for a public music community.</li>
<li><strong>Activity.</strong> Review recent posts, follows, or messages from Blindbandit Mobile when linked to your account.</li>
<li><strong>Listening.</strong> Jump to the catalog, discover guide, or verified artist mobile profile.</li>
<li><strong>Support the artist.</strong> Optional support links live on the public Support page (PayPal / Wise) — never requested via DM.</li>
<li><strong>Safety.</strong> Report harassment through in-product tools or safety@mrblindbandit.net.</li>
</ul>
<div class="label-empty"><h2>Nothing here yet?</h2>
<p>Sign in, visit Explore on Blindbandit Mobile, follow @mrblindbandit, and introduce yourself respectfully. Optional: join the mailing list for release updates.</p></div>
<p><a class="button" href="/mobile/explore/">Explore people</a>
<a class="button" href="/fans/">Fan hub</a>
<a class="text-link" href="/community/account/">Account</a>
<a class="text-link" href="/signup/">Mailing list</a>
<a class="text-link" href="/community-guidelines/">Guidelines</a></p>
<p class="small">© 2026 Blindbandit Records. Community dashboards are member-facing and noindex where private.</p>
</section>
''',
    "community/moderation/index.html": '''
<section class="shell section desk-static" data-desk-static="1">
<p class="eyebrow">COMMUNITY · MODERATION</p>
<h2>Care for the Blindbandit community</h2>
<p>This moderation surface helps trusted operators review reports, hide harmful content, and escalate cases that need Social Admin controls on Blindbandit Mobile.</p>
<p>Access is restricted. Sign in with your production Clerk account that holds moderator privileges. Unprivileged visitors will see a denial state. Prefer documented actions with short rationale notes for the audit trail.</p>
<ul>
<li><strong>Triage.</strong> Sort new reports by severity: harm, impersonation, spam, rights claims.</li>
<li><strong>Actions.</strong> Hide content, warn, restrict, or escalate to Social Admin for bans and device revocation.</li>
<li><strong>Evidence.</strong> Capture links and timestamps; do not download illegal material to personal devices.</li>
<li><strong>Appeals.</strong> Point users to moderation appeals and trust &amp; safety pages when appropriate.</li>
<li><strong>Cross-link.</strong> Use /mobile/admin/ for the full Social Admin Control Center.</li>
</ul>
<div class="label-empty"><h2>Queue empty</h2>
<p>When there are no open reports, review verification and ads queues in Social Admin, and skim recent public posts for emerging issues.</p></div>
<p><a class="button" href="/mobile/admin/">Open Social Admin</a>
<a class="text-link" href="/moderation-appeals/">Appeals</a>
<a class="text-link" href="/mobile/trust-safety/">Trust &amp; safety</a>
<a class="text-link" href="/community-guidelines/">Guidelines</a>
<a class="text-link" href="mailto:safety@mrblindbandit.net">safety@mrblindbandit.net</a></p>
<p class="small">© 2026 Blindbandit Records. Moderator tools are private. Never paste secret keys into case notes.</p>
</section>
''',
    "owner/inbox/index.html": '''
<section class="shell section desk-static" data-desk-static="1">
<p class="eyebrow">OWNER · INBOX</p>
<h2>Creative inbox for Blindbandit Records</h2>
<p>This private inbox collects music submissions, mailing-list signups, and professional inquiries directed to Mr. Blindbandit / Blindbandit Records. It is owner-only and must never be exposed as a public marketing page.</p>
<p>Sign in with your production Clerk account that holds owner privileges. Interactive messages load in the panel powered by the application Worker after authorization checks succeed.</p>
<ul>
<li><strong>Submissions.</strong> Review listening links, artist contact email, and project notes from the public Submit form.</li>
<li><strong>Signups.</strong> Mailing-list consent records are separate from music submissions — honor removal requests promptly.</li>
<li><strong>Business mail.</strong> Booking, licensing, and partnership threads may also appear; route them to the right Label OS desk.</li>
<li><strong>Hygiene.</strong> Do not store payment card numbers or passwords here. Use portal desks for structured deal tracking.</li>
<li><strong>Replies.</strong> Prefer saved reply templates from the label portal when sending consistent responses.</li>
</ul>
<div class="label-empty"><h2>Inbox clear</h2>
<p>When empty, check portal notifications, submission readiness, and Social Admin reports so nothing stalls in another queue.</p></div>
<p><a class="button" href="/portal/inbox/" data-full-navigation>Portal submission inbox</a>
<a class="text-link" href="/portal/reply-templates/" data-full-navigation>Reply templates</a>
<a class="text-link" href="/portal/notifications/" data-full-navigation>Notifications</a>
<a class="text-link" href="/submit/">Public submit page</a></p>
<p class="small">© 2026 Blindbandit Records. Owner inbox is noindex and authorization-gated.</p>
</section>
''',
    "support/payment/index.html": '''
<section class="shell section desk-static" data-desk-static="1">
<p class="eyebrow">SUPPORT · PAYMENT STATUS</p>
<h2>Check your support payment</h2>
<p>This page shows the current result of a recent Stripe checkout when you return from an optional support payment for Mr. Blindbandit. It does not store your full card number on Blindbandit servers — Stripe processes the payment on its own hosted checkout.</p>
<p>If you arrived here without completing checkout, start again from the public Support page. Successful payments display a confirmation state once the Worker verifies the session. Failed or canceled checkouts explain the next step without exposing sensitive payment credentials.</p>
<ul>
<li><strong>Optional support.</strong> Contributions are voluntary and do not purchase exclusive rights, shares, or a record deal.</li>
<li><strong>Receipts.</strong> Stripe emails receipts according to the email you entered at checkout.</li>
<li><strong>Issues.</strong> Contact business@mrblindbandit.net with the approximate time and amount — never send card PANs or CVCs by email.</li>
<li><strong>Alternatives.</strong> Wise and PayPal options remain listed on the Support page when you prefer those rails.</li>
<li><strong>Privacy.</strong> Review the site privacy policy for how payment providers process technical data.</li>
</ul>
<div class="label-empty"><h2>Waiting for Stripe</h2>
<p>If status is still loading, keep this tab open a moment or refresh once. JavaScript enhances the live status panel; this explanation remains available either way.</p></div>
<p><a class="button" href="/support/">Back to Support</a>
<a class="text-link" href="/privacy/">Privacy</a>
<a class="text-link" href="/contact/">Contact</a>
<a class="text-link" href="/fans/">Fan hub</a></p>
<p class="small">© 2026 Blindbandit Records. Support payments are optional. No AdSense targeting of this confirmation surface beyond existing site rules.</p>
</section>
''',
}

def expand_other(path: Path, rel: str) -> bool:
    html = path.read_text(encoding="utf-8")
    if visible_len(html) >= 1200 and 'data-desk-static="1"' in html:
        # still may be under 1200 - check
        pass
    if visible_len(html) >= 1200:
        return False
    block = OTHER_BLOCKS[rel]
    html = re.sub(r'<section class="shell section desk-static"[\s\S]*?data-desk-static="1"[\s\S]*?</section>\s*', "", html)
    if "</main>" in html:
        html = html.replace("</main>", block + "</main>", 1)
    else:
        html += block
    path.write_text(html, encoding="utf-8")
    return True

def regen_worker_embeds():
    """Refresh private-pages.ts and site-pages.ts from current HTML (portal.py subset)."""
    portal_pages = [
        ("Overview", ""),
        ("Sign in", "login"),
        ("Set or reset password", "reset"),
        ("Clients", "clients"),
        ("Team & access", "team"),
        ("Earnings", "earnings"),
        ("Contracts", "contracts"),
        ("Messages", "messages"),
        ("Tasks", "tasks"),
        ("Submission inbox", "inbox"),
        ("Activity & email", "activity"),
        ("Account & security", "security"),
        ("API reference", "api"),
        ("Portal privacy", "privacy"),
        ("Publishing studio", "publishing"),
        ("SEO command center", "seo"),
        ("Departments & email", "departments"),
        ("RSS feeds", "feeds"),
        ("Booking pipeline", "bookings"),
        ("Licensing pipeline", "licensing"),
        ("Sponsorship pipeline", "sponsorships"),
        ("Partnership pipeline", "partnerships"),
        ("Translation manager", "translations"),
        ("Label announcements", "announcements"),
        ("Community publishing", "community-publishing"),
        ("Rights & delivery readiness", "readiness"),
        ("Emergency lockdown", "lockdown"),
        ("Article snapshots", "content-backups"),
        ("Portal guide", "guide"),
        ("Portal search", "search"),
        ("My shortcuts", "shortcuts"),
        ("Account sessions", "account-sessions"),
        ("Community accounts", "community-accounts"),
        ("Notifications center", "notifications"),
        ("Advertising placements", "advertising"),
        ("Saved reply templates", "reply-templates"),
        ("My private notes", "personal-notes"),
        ("Stripe payments", "payments"),
        ("Support payment activity", "payment-activity"),
    ]
    portal_pages += [(m["title"], m["slug"]) for m in mods.values()]
    private_routes = ["/owner/inbox/", "/community/moderation/"] + [
        "/portal/" + (slug + "/" if slug else "")
        for _, slug in portal_pages
        if slug not in ("login", "reset", "privacy")
    ]
    # de-dupe preserve order
    seen = set()
    pr = []
    for r in private_routes:
        if r not in seen:
            seen.add(r)
            pr.append(r)
    private_html = {}
    for route in pr:
        p = D / route.strip("/") / "index.html"
        if p.exists():
            private_html[route.rstrip("/")] = p.read_text(encoding="utf-8")
    (ROOT / "worker" / "private-pages.ts").write_text(
        "// Generated by scripts/expand_thin_shells.py. Served only after server authorization.\n"
        "export const privatePages: Record<string,string> = "
        + json.dumps(private_html, ensure_ascii=False)
        + ";\n",
        encoding="utf-8",
    )
    (ROOT / "data" / "private-routes.json").write_text(json.dumps(pr, indent=2) + "\n", encoding="utf-8")
    documents = {
        ("/" if p == D / "index.html" else "/" + str(p.parent.relative_to(D)) + "/"): p.read_text(encoding="utf-8")
        for p in D.rglob("index.html")
    }
    public_docs = {r: s for r, s in documents.items() if r not in pr}
    (ROOT / "worker" / "site-pages.ts").write_text(
        "// Generated public and sign-in documents; private documents are guarded separately.\n"
        "export const sitePages: Record<string,string> = "
        + json.dumps(public_docs, ensure_ascii=False)
        + ";\n",
        encoding="utf-8",
    )
    return len(private_html), len(public_docs)

def main():
    before = []
    for p in sorted(D.rglob("index.html")):
        n = visible_len(p.read_text(encoding="utf-8", errors="replace"))
        if n < 1200:
            before.append(str(p.relative_to(D)))
    print("BEFORE_THIN", len(before))

    changed = 0
    for rel in before:
        path = D / rel
        if rel.startswith("portal/"):
            if expand_portal(path):
                changed += 1
        elif rel.startswith("mobile/") and rel in MOBILE_COPY:
            if expand_mobile(path, rel):
                changed += 1
        elif rel in OTHER_BLOCKS:
            if expand_other(path, rel):
                changed += 1
        else:
            print("UNHANDLED", rel)

    # Second pass: any still thin (e.g. mobile admin was 823)
    still = []
    for p in sorted(D.rglob("index.html")):
        html = p.read_text(encoding="utf-8", errors="replace")
        n = visible_len(html)
        if n < 1200:
            still.append((str(p.relative_to(D)), n))
    # Force-expand leftovers
    for rel, n in list(still):
        path = D / rel
        if rel.startswith("portal/"):
            expand_portal(path)
        elif rel in MOBILE_COPY:
            # force by stripping length check path — rewrite main content
            html = path.read_text(encoding="utf-8")
            title, blurb, sections = MOBILE_COPY[rel]
            block = mobile_static(title, blurb, sections)
            if 'id="mb-main"' in html:
                html2 = re.sub(
                    r'(<main\b[^>]*id="mb-main"[^>]*>)([\s\S]*?)(</main>)',
                    lambda m: m.group(1) + block + m.group(3),
                    html,
                    count=1,
                )
                path.write_text(html2, encoding="utf-8")
            else:
                expand_mobile(path, rel)
        elif rel in OTHER_BLOCKS:
            html = path.read_text(encoding="utf-8")
            # append block even if partially expanded
            if 'data-desk-static="1"' not in html:
                expand_other(path, rel)
            else:
                # pad
                path.write_text(html.replace("</main>", OTHER_BLOCKS[rel] + "</main>", 1), encoding="utf-8")

    after = []
    for p in sorted(D.rglob("index.html")):
        n = visible_len(p.read_text(encoding="utf-8", errors="replace"))
        if n < 1200:
            after.append((str(p.relative_to(D)), n))

    priv_n, pub_n = regen_worker_embeds()
    print("CHANGED_FIRST_PASS", changed)
    print("AFTER_THIN", len(after))
    for item in after:
        print(" REMAINING", item)
    print("WORKER_PRIVATE", priv_n, "WORKER_PUBLIC", pub_n)

    # Prefer ≥2000 where easy — report counts
    bands = {"lt1200": 0, "1200_1999": 0, "ge2000": 0}
    for p in D.rglob("index.html"):
        n = visible_len(p.read_text(encoding="utf-8", errors="replace"))
        if n < 1200:
            bands["lt1200"] += 1
        elif n < 2000:
            bands["1200_1999"] += 1
        else:
            bands["ge2000"] += 1
    print("BANDS", bands)

if __name__ == "__main__":
    main()
