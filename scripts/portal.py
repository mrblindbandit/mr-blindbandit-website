"""Build all public pages plus the private label workspace. Run this generator last."""
from accounts import *
portal_pages=[('Overview',''),('Sign in','login'),('Set or reset password','reset'),('Clients','clients'),('Team & access','team'),('Earnings','earnings'),('Contracts','contracts'),('Messages','messages'),('Tasks','tasks'),('Submission inbox','inbox'),('Activity & email','activity'),('Account & security','security'),('API reference','api'),('Portal privacy','privacy'),('Publishing studio','publishing'),('SEO command center','seo'),('Departments & email','departments'),('RSS feeds','feeds'),('Booking pipeline','bookings'),('Licensing pipeline','licensing'),('Sponsorship pipeline','sponsorships'),('Partnership pipeline','partnerships'),('Translation manager','translations')]
workspace_modules=json.loads((ROOT/'data/workspace.json').read_text())+json.loads((ROOT/'data/workspace-extra.json').read_text())+json.loads((ROOT/'data/workspace-daily.json').read_text())
portal_pages += [('Label announcements','announcements'),('Community publishing','community-publishing'),('Rights & delivery readiness','readiness'),('Emergency lockdown','lockdown'),('Article snapshots','content-backups'),('Portal guide','guide'),('Portal search','search'),('My shortcuts','shortcuts'),('Account sessions','account-sessions'),('Community accounts','community-accounts')]
portal_pages += [('Notifications center','notifications')]
portal_pages += [('Advertising placements','advertising'),('Saved reply templates','reply-templates'),('My private notes','personal-notes')]
portal_pages += [('Stripe payments','payments'),('Support payment activity','payment-activity')]
portal_pages += [(m['title'],m['slug']) for m in workspace_modules]
(D/'workspace-config.js').write_text('window.LabelWorkspaceModules = '+json.dumps(workspace_modules)+';')
for title,slug in portal_pages:
 route='/portal/'+(slug+'/' if slug else '')
 markup='<section class="shell label-workspace"><div class="portal-heading"><div><p class="eyebrow">BLINDBANDIT RECORDS / LABEL PORTAL</p><h1>'+title+'</h1></div><a class="text-link" href="/community/" data-full-navigation>Fan community ↗</a></div><div data-label-portal data-view="'+(slug or 'overview')+'"><p role="status">Loading your workspace…</p></div><noscript><p>The private workspace requires JavaScript to sign in and load your records. For help, email business@mrblindbandit.net.</p></noscript></section>'
 layout(route,title+' · Label portal','Private accounts and label management for Blindbandit Records.',markup)
 p=D/route.strip('/')/'index.html';s=p.read_text();s=s.replace('<meta name="description"','<meta name="robots" content="noindex,nofollow"><meta name="referrer" content="no-referrer"><meta name="description"',1)
 head=s.split('</head>')[0].replace('<script src="/app.js" defer></script>','')+'</head>'
 s=head+'<body class="label-page"><a class="skip" href="#main">Skip to workspace</a><header class="portal-site-header"><a class="portal-brand" href="/portal/" data-full-navigation>BLINDBANDIT RECORDS<span>Private label workspace</span></a><a href="https://mrblindbandit.net/" data-full-navigation>Artist website ↗</a></header><main id="main">'+markup.replace('href="/community/"','href="https://mrblindbandit.net/community/"')+'</main><footer class="portal-site-footer"><a href="/portal/privacy/" data-full-navigation>Portal privacy</a><a href="mailto:business@mrblindbandit.net">Account support</a><p>© 2026 Blindbandit Records. All rights reserved.</p></footer><script src="/workspace-config.js" defer></script><script src="/workspace.js" defer></script><script src="/editorial.js?v=phase30" defer></script><script src="/operations.js" defer></script><script src="/ad-settings.js" defer></script><script src="/personal-tools.js" defer></script><script src="/portal.js?v=phase30" defer></script></body></html>'
 p.write_text(s);pages.append((title+' · Label portal',route))
for p in D.rglob('index.html'):
 s=p.read_text().replace('<script src="/app.js" defer></script>','<script src="/app.js?v=phase30" defer></script><script src="/operations.js" defer></script><script src="/ad-settings.js" defer></script><script src="/personal-tools.js" defer></script><script src="/portal.js?v=phase30" defer></script>')
 s=s.replace('<div class="footer-links">','<div class="footer-links"><a href="/portal/login/" data-full-navigation>Account sign-in</a>')
 if p==D/'label/index.html':s=s.replace('</main>',section('<h2>YOUR LABEL WORKSPACE</h2><p>Client statements, contract documents, messages, and project tasks.</p>'+button('Open the label portal','/portal/'))+'</main>')
 s=re.sub(r'<a[^>]*href="/(owner/inbox|community/moderation)/"[^>]*>.*?</a>','',s)
 s=re.sub(r'<a\b[^>]*href="/portal/[^"]*"[^>]*>',lambda m:m[0] if 'data-full-navigation' in m[0] else m[0][:-1]+' data-full-navigation>',s)
 p.write_text(s)
p=D/'privacy/index.html';s=p.read_text();p.write_text(s.replace('</main>',section(prose('LABEL PORTAL ACCOUNTS',['The private label portal uses separate email and password accounts, session cookies, and private records. Read the <a href="/portal/privacy/">label portal privacy notice</a> for details about earnings, contracts, messages, and account emails.']))+'</main>'))
from public_refresh import refresh
refresh(ROOT,D,layout,pages,cards,own,player)
from priority_public import enhance
enhance(ROOT,D,layout,pages)
from phase_expansion import expand_public
expand_public(D,layout,pages)
from useful_tools import add_useful_tools
add_useful_tools(D,layout,pages)
from everyday_tools import add_everyday_tools
add_everyday_tools(D,layout,pages)
from audio_converter import add_audio_converter
add_audio_converter(D,layout,pages)
from media_tools import add_media_tools
add_media_tools(D,layout,pages)
from legal_expansion import add_legal_expansion
add_legal_expansion(D,layout,pages)
from publish_essays import publish_essays
publish_essays(ROOT,D,layout,pages)
from compliance_package import add_compliance
add_compliance(D,layout,pages,portal_pages)
from payment_pages import add_payment_pages
add_payment_pages(D,layout,pages)
from localized_pages import enhance as localize
localize(ROOT,D,pages)
(ROOT/'data/pages.json').write_text(json.dumps([{'title':n,'path':u} for n,u in pages if not u.startswith('/owner/') and (not u.startswith('/portal/') or u in ['/portal/login/','/portal/privacy/'])],indent=2))
print('Full website:',len(pages),'pages, including label portal')
# Device-local presentation conveniences; never alter policy effective dates.
for document in D.rglob('index.html'):
 markup=document.read_text()
 route='/' if document==D/'index.html' else '/'+str(document.parent.relative_to(D))+'/'
 for asset in ['app','forms','consent','experience','workspace']:markup=re.sub(r'src="/'+asset+r'\.js(?:\?[^"]*)?"', 'src="/'+asset+'.js?v=phase30"',markup)
 markup=markup.replace('<main id="main">','<main id="main" tabindex="-1">')
 markup=markup.replace('</body>','<script src="/accessibility.js?v=phase33" defer></script></body>')
 if not any('/'+prefix+'/' in str(document) for prefix in ['portal','owner','fil','ceb']):markup=markup.replace('</body>','<script src="/advertising.js" defer></script></body>')
 logo='<img class="brand-logo" src="/assets/blindbandit-records-gold.jpeg" alt="Mr. Blindbandit — Blindbandit Records" width="360" height="196" decoding="async">'
 markup=re.sub(r'(<a\b[^>]*class="(?:wordmark|portal-brand)"[^>]*>).*?</a>',lambda m:m[1]+logo+'</a>',markup,flags=re.S)
 markup=markup.replace('<footer class="portal-site-footer">','<footer class="portal-site-footer"><a href="/portal/" aria-label="Label portal home">'+logo+'</a>')
 markup=markup.replace('/assets/favicon.svg','/assets/blindbandit-records-gold.jpeg')
 markup=markup.replace('href="/styles.css"','href="/styles.css?v=phase33"').replace('href="/public-modern.css"','href="/public-modern.css?v=phase34"')

 # Preserve the verification tag. The advertising module loads the SDK only
 # after consent and the server activation gate; never load it unconditionally.
 adsense_meta='<meta name="google-adsense-account" content="ca-pub-7238428274233485">'
 adsense_loader='<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7238428274233485" crossorigin="anonymous"></script>'
 markup=re.sub(r'<meta name="google-adsense-account"[^>]*>','',markup)
 markup=re.sub(r'<script(?: async)?[^>]*(?:src|data-src)="https://pagead2\.googlesyndication\.com/pagead/js/adsbygoogle\.js\?client=ca-pub-7238428274233485"[^>]*></script>','',markup)
 if not route.startswith(('/portal/','/owner/','/community/account/','/community/dashboard/','/community/moderation/')):
  markup=markup.replace('</head>',adsense_meta+'</head>',1)
  def trust_links(match):
   footer=match[0]
   if 'href="/safety/"' not in footer:
    if '<a href="/accessibility/">' in footer:footer=footer.replace('<a href="/accessibility/">','<a href="/safety/">Child safety</a><a href="/advertising-disclosure/">Advertising disclosure</a><a href="/accessibility/">',1)
    elif '<a href="/privacy/">Privacy</a>' in footer:footer=footer.replace('<a href="/privacy/">Privacy</a>','<a href="/privacy/">Privacy</a><a href="/safety/">Child safety</a><a href="/advertising-disclosure/">Advertising</a>',1)
   return footer
  markup=re.sub(r'<footer\b.*?</footer>',trust_links,markup,flags=re.S)

 markup=re.sub(r'(<footer\b.*?</footer>)',lambda m:re.sub(r'© (\d{4})',r'© <span data-current-year>\1</span>',m[0]),markup,flags=re.S)
 markup=markup.replace('</body>','<script src="/experience.js" defer></script></body>')
 document.write_text(markup)
from seo import optimize
optimize(ROOT, D)
# Private documents must never be deployed as static assets: Cloudflare can serve
# an existing asset before invoking the application Worker and its access checks.
private_routes=['/owner/inbox/','/community/moderation/']+['/portal/'+(slug+'/' if slug else '') for _,slug in portal_pages if slug not in ['login','reset','privacy']]
private_html={route.rstrip('/'): (D/route.strip('/')/'index.html').read_text() for route in private_routes}
(ROOT/'worker/private-pages.ts').write_text('// Generated by scripts/portal.py. Served only after server authorization.\nexport const privatePages: Record<string,string> = '+json.dumps(private_html,ensure_ascii=False)+';\n')
(ROOT/'data/private-routes.json').write_text(json.dumps(private_routes,indent=2)+'\n')
# All documents pass through the Worker, including hostname-based portal routing.
documents={('/' if p==D/'index.html' else '/'+str(p.parent.relative_to(D))+'/'):p.read_text() for p in D.rglob('index.html')}
(ROOT/'worker/site-pages.ts').write_text('// Generated public and sign-in documents; private documents are guarded separately.\nexport const sitePages: Record<string,string> = '+json.dumps({r:s for r,s in documents.items() if r not in private_routes},ensure_ascii=False)+';\n')
from compliance_inventory import build as compliance_inventory
compliance_inventory()
