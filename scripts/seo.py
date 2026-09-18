"""Repeatable SEO pass for the authored public pages; called by portal.py."""
import html
import json
import re
from xml.etree import ElementTree as ET

ORIGIN = 'https://mrblindbandit.net'
PRIVATE = ('/portal/', '/owner/', '/community/account/', '/community/dashboard/', '/community/moderation/', '/support/payment/')
CORE = {
    '/': ('Mr. Blindbandit | Official Music, Artist & Blindbandit Records', 'Explore Mr. Blindbandit’s official music, Spotify releases, videos, biography and Blindbandit Records. Meet the artist and join the fan community.'),
    '/music/': ('Mr. Blindbandit Music | Albums, Singles & EPs', 'Discover Mr. Blindbandit’s albums, singles and EPs. Browse the discography and listen through Spotify, Apple Music and official release links.'),
    '/biography/': ('Kaeleb Savon Heck Biography | Mr. Blindbandit', 'Read the artist-supplied biography of Kaeleb Savon Heck, known as Mr. Blindbandit: music, independent creativity, accessibility and Blindbandit Records.'),
    '/story/': ('I Didn’t See the Philippines. I Heard It. | Mr. Blindbandit', 'The complete first-person story by Kaeleb Savon Heck: blindness, music, independent travel, Emma and a new life in the Philippines.'),
    '/label/': ('Blindbandit Records | Independent Record Label', 'Explore Blindbandit Records, founded by Mr. Blindbandit. Discover the artist roster, label story, music releases and demo submission process.'),
    '/submit/': ('Submit Music to Blindbandit Records | Demos & Tracks', 'Submit an original track or private demo to Blindbandit Records. Read the submission guide, share your music and introduce your artist project.'),
    '/collaborators/': ('Mr. Blindbandit Collaborations | UUu Tang Maskman & More', 'Discover Mr. Blindbandit’s collaborators, including UUu Tang Maskman. Explore shared releases, featured artists and links to their music.'),
    '/press/': ('Mr. Blindbandit Press Kit | Biography & Media Contact', 'Find Mr. Blindbandit’s artist biography, press materials and business contact. Request interviews, discuss bookings and reference the official artist website.'),
    '/press/assets/': ('Mr. Blindbandit Press Assets | Artist Bio & Portrait', 'Download the Mr. Blindbandit artist biography, view the official portrait and find website attribution links for media, collaborators and interviews.'),
    '/community/': ('Mr. Blindbandit Fan Community | Music & Conversations', 'Join the Mr. Blindbandit fan community. Discuss music, share creative ideas, reply to fellow listeners and follow official artist announcements.'),
    '/connect/': ('Mr. Blindbandit Official Links | Music, Socials & Contact', 'Find Mr. Blindbandit’s official Spotify, Apple Music, YouTube and social profiles. Contact the artist for music, media and creative projects.'),
    '/audio-converter/': ('Video to Audio Converter | MP3, WAV, FLAC & More', 'Extract high-quality audio from MP4, MOV, MKV, WebM and other videos, or convert MP3, WAV, FLAC, AAC, OGG and Opus locally in your browser.'),
    '/privacy/': ('Privacy Policy | Mr. Blindbandit & Blindbandit Records', 'Read the detailed Mr. Blindbandit privacy policy covering forms, submissions, community accounts, local utilities, advertising, cookies and data rights.'),
    '/safety/': ('Child Safety Policy | Mr. Blindbandit', 'Read the Mr. Blindbandit child safety policy, including age boundaries, prohibited conduct, reporting routes, moderation and privacy safeguards.'),
    '/advertising-disclosure/': ('Advertising & Sponsorship Disclosure | Mr. Blindbandit', 'Learn how advertising, sponsorships, cookies, editorial independence and visitor choices work across the Mr. Blindbandit website.'),
    '/contact/': ('Contact Mr. Blindbandit & Blindbandit Records', 'Find official department contacts for business, music submissions, press, bookings, licensing, privacy, legal, copyright, security and child safety.'),
}
RELATED = [
    (('/music/', '/listen/', '/discover/', '/credits/', '/collaborators/'), ['/music/', '/listen/', '/collaborators/', '/journal/listening-guide/']),
    (('/label/', '/submit/', '/submission-', '/studio/', '/project-brief/'), ['/label/', '/label/artists/', '/submit/', '/submission-guide/']),
    (('/story/', '/biography/', '/timeline/', '/personal-story/', '/accessibility/'), ['/biography/', '/story/', '/timeline/', '/accessibility/']),
    (('/press/', '/booking/', '/licensing/', '/partnerships/', '/contact/'), ['/press/', '/press/assets/', '/booking/', '/contact/forms/']),
    (('/community/', '/signup/'), ['/community/', '/community/music/', '/community/creators/', '/community/guidelines/']),
]

def optimize(root, output):
    pages = {p['path']: p['title'] for p in json.loads((root/'data/pages.json').read_text())}
    pages['/'] = 'Home'
    routes = {}
    for file in sorted(output.rglob('index.html')):
        relative = str(file.relative_to(output))
        route = '/' if relative == 'index.html' else '/' + relative.removesuffix('index.html')
        routes[route] = file
    public = {route: file for route, file in routes.items() if not route.startswith(PRIVATE)}
    # Build the public directory last, after every feature generator has run.
    # Keep private workspace destinations behind their existing sign-in entry.
    directory = output/'explore/index.html'
    picker=''
    if directory.exists():
        groups = {}
        media = {'media-tools','audio-converter','art-track','audiogram','metadata-editor','waveform-image','artwork-resizer','audio-check','audio-clipper','audio-fade','audio-speed','audio-reverse','audio-volume','audio-equalizer','audio-pitch','audio-channels','audio-loop','audio-compressor','audio-silence'}
        legal = {'legal','privacy','terms','copyright','copyright-notice','cookies','safety','advertising-disclosure','media-suite-terms','report-content','security-reporting','submission-terms','community-terms','acceptable-use','privacy-request','cookie-policy','dmca'}
        for route in sorted(public):
            if route == '/explore/': continue
            first=route.strip('/').split('/')[0]
            group = ('Media Hub' if first in media else 'Everyday and creator tools' if first=='tools' else 'Legal, privacy and safety' if first in legal else 'Languages' if first in ('es','fil','ceb') else 'Music and listening' if first in ('music','listen','discover','credits','videos','collaborators') else 'Label and submissions' if first in ('label','submit','submission-guide','submission-faq','studio','project-brief') else 'Community and news' if first in ('community','news','journal','reading-room','feeds','signup') else 'Artist, contact and support')
            title=pages.get(route)
            if not title:
                title=html.unescape(re.search(r'<title>(.*?)</title>', public[route].read_text(), re.S)[1]).split(' | ')[0].split(' — ')[0]
            groups.setdefault(group,[]).append((title,route))
        content='<section class="shell"><h1>All pages</h1><p>Browse every public page, including the Media Hub, artist pages, label resources and policies.</p><label class="directory-search">Find a page<input type="search" id="directory-search" placeholder="Try art track, jobs, privacy…"></label><p id="directory-status" role="status">'+str(sum(map(len,groups.values())))+' public pages</p><div class="directory-grid">'
        for group,entries in groups.items():
            content+='<section class="directory-group"><h2>'+group+'</h2>'+''.join('<a data-directory-item href="'+route+'">'+html.escape(title)+'</a>' for title,route in sorted(entries))+'</section>'
        content+='</div><h2>Your accounts</h2><p><a href="/portal/login/" data-full-navigation>Label portal sign-in</a> · <a href="/community/account/">Community account</a></p></section>'
        markup=directory.read_text()
        markup=re.sub(r'(<main[^>]*>).*?(</main>)',lambda m:m[1]+content+m[2],markup,count=1,flags=re.S)
        directory.write_text(markup)
        picker='<label class="all-pages-picker"><span class="visually-hidden">All pages — selecting a page opens it</span><select data-all-pages aria-label="All pages" aria-describedby="all-pages-hint"><option value="" selected>All pages</option><option value="/explore/">Full page directory</option>'
        for group,entries in groups.items():
            picker+='<optgroup label="'+html.escape(group,quote=True)+'">'+''.join('<option value="'+route+'">'+html.escape(title)+'</option>' for title,route in sorted(entries))+'</optgroup>'
        picker+='<optgroup label="Your accounts"><option value="/portal/login/">Label portal sign-in</option><option value="/community/account/">Community account</option></optgroup></select><span id="all-pages-hint" class="visually-hidden">Selecting a page opens it. Dismiss the picker to stay here.</span></label>'
    profile_links = [
        'https://open.spotify.com/artist/04HZ4GubB66CqMpJrHysy3',
        'https://music.apple.com/us/artist/mr-blindbandit/1622341304',
        'https://www.youtube.com/@MrBlindbandit',
        'https://www.instagram.com/mrblindbandit/',
        'https://www.facebook.com/mrblindbandit',
        'https://www.tiktok.com/@mrblindbandit',
    ]
    for route, file in routes.items():
        markup = file.read_text()
        language = next((l for l in ['es','fil','ceb'] if route.startswith('/'+l+'/')), 'en')
        markup = re.sub(r'<meta name="robots"[^>]*>', '', markup)
        if route not in public:
            markup = markup.replace('</head>', '<meta name="robots" content="noindex,nofollow"></head>')
            file.write_text(markup)
            continue
        if picker:
            markup=re.sub(r'<button\b[^>]*class="menu"[^>]*>.*?</button>',lambda _:picker,markup,count=1,flags=re.S)
            if 'data-all-pages' not in markup:markup=markup.replace('</header>',picker+'</header>',1)
            markup=markup.replace('</body>','<script src="/page-picker.js?v=1" defer></script></body>')
            markup=markup.replace('/app.js?v=phase30','/app.js?v=phase35')
        current_title = html.unescape(re.search(r'<title>(.*?)</title>', markup, re.S)[1])
        current_description = html.unescape(re.search(r'<meta name="description" content="([^"]*)"', markup)[1])
        title, description = CORE.get(route, (current_title.replace('Mr. Blind Bandit', 'Mr. Blindbandit'), current_description))
        markup = re.sub(r'<title>.*?</title>', lambda _: '<title>' + html.escape(title) + '</title>', markup, count=1, flags=re.S)
        # Refresh all managed fields together so generated pages have one value each.
        markup = re.sub(r'<meta (?:name="(?:description|twitter:[^"]+)"|property="og:[^"]+")[^>]*>', '', markup)
        markup = re.sub(r'<link rel="canonical"[^>]*>', '', markup)
        meta = {'description': description, 'robots': 'index,follow,max-image-preview:large', 'twitter:card': 'summary_large_image', 'twitter:title': title, 'twitter:description': description, 'twitter:image': ORIGIN + '/assets/artist.jpg', 'twitter:image:alt': 'Mr. Blindbandit, artist and founder of Blindbandit Records'}
        og = {'og:title': title, 'og:description': description, 'og:url': ORIGIN + route, 'og:site_name': 'Mr. Blindbandit', 'og:type': 'website', 'og:locale': {'es':'es_ES','fil':'fil_PH','ceb':'ceb_PH'}.get(language,'en_US'), 'og:image': ORIGIN + '/assets/artist.jpg', 'og:image:alt': meta['twitter:image:alt'], 'og:image:width': '531', 'og:image:height': '640'}
        head = ''.join('<meta name="' + k + '" content="' + html.escape(v, quote=True) + '">' for k, v in meta.items())
        head += ''.join('<meta property="' + k + '" content="' + html.escape(v, quote=True) + '">' for k, v in og.items())
        head += '<link rel="canonical" href="' + ORIGIN + route + '">'
        site_id, artist_id, label_id = ORIGIN + '/#website', ORIGIN + '/#artist', ORIGIN + '/label/#organization'
        graph = [{'@type': 'WebSite', '@id': site_id, 'name': 'Mr. Blindbandit', 'alternateName': 'Mr. Blind Bandit', 'url': ORIGIN + '/', 'inLanguage': language}, {'@type': 'WebPage', '@id': ORIGIN + route + '#webpage', 'url': ORIGIN + route, 'name': title, 'description': description, 'isPartOf': {'@id': site_id}, 'inLanguage': language}]
        if route in ['/', '/biography/', '/story/', '/connect/', '/press/']:
            graph.append({'@type': 'Person', '@id': artist_id, 'name': 'Kaeleb Savon Heck', 'alternateName': ['Mr. Blindbandit', 'Mr. Blind Bandit'], 'url': ORIGIN + '/biography/', 'image': ORIGIN + '/assets/artist.jpg', 'jobTitle': ['Recording artist', 'Producer', 'Content creator'], 'sameAs': profile_links})
            graph[1]['about'] = {'@id': artist_id}
        if route.startswith('/label/'):
            graph.append({'@type': 'Organization', '@id': label_id, 'name': 'Blindbandit Records', 'url': ORIGIN + '/label/', 'founder': {'@type': 'Person', '@id': artist_id, 'name': 'Kaeleb Savon Heck', 'alternateName': 'Mr. Blindbandit'}})
            graph[1]['about'] = {'@id': label_id}
        crumbs = [('/', 'Home')]
        parts = route.strip('/').split('/')
        for index in range(1, len(parts)):
            parent = '/' + '/'.join(parts[:index]) + '/'
            if parent in public:
                crumbs.append((parent, pages.get(parent, parts[index-1].replace('-', ' ').title())))
        if route != '/':
            name = pages.get(route, title.split(' | ')[0].split(' — ')[0])
            crumbs.append((route, name))
            graph.append({'@type': 'BreadcrumbList', '@id': ORIGIN + route + '#breadcrumbs', 'itemListElement': [{'@type': 'ListItem', 'position': i+1, 'name': name, 'item': ORIGIN + path} for i, (path, name) in enumerate(crumbs)]})
            graph[1]['breadcrumb'] = {'@id': ORIGIN + route + '#breadcrumbs'}
            trail = '<nav class="shell breadcrumbs" aria-label="Breadcrumb"><ol>' + ''.join('<li>' + ('<span aria-current="page">' + html.escape(name) + '</span>' if path == route else '<a href="' + path + '">' + html.escape(name) + '</a>') + '</li>' for path, name in crumbs) + '</ol></nav>'
            markup = markup.replace('<main id="main">', '<main id="main">' + trail)
        if route=='/contact/':
            graph[1]['@type']='ContactPage'
            graph.append({'@type':'Organization','@id':label_id,'name':'Blindbandit Records','url':ORIGIN+'/label/','email':'business@mrblindbandit.net','telephone':['+639626954905','+15409269791'],'address':{'@type':'PostalAddress','streetAddress':'Purok 6-A, Mabuhay, Barangay Capungagan','addressRegion':'Davao del Norte','postalCode':'8113','addressCountry':'PH'},'contactPoint':{'@type':'ContactPoint','contactType':'customer support','email':'business@mrblindbandit.net','telephone':['+639626954905','+15409269791']}})
        head += '<script type="application/ld+json">' + json.dumps({'@context': 'https://schema.org', '@graph': graph}, ensure_ascii=False).replace('<', '\\u003c') + '</script>'
        markup = markup.replace('</head>', head + '</head>')
        candidates = next((links for prefixes, links in RELATED if route.startswith(prefixes)), ['/music/', '/biography/', '/label/', '/community/'])
        links = [path for path in candidates if path != route and path in public]
        related = '<section class="shell related-pages" aria-labelledby="related-title"><h2 id="related-title">Keep exploring</h2><div>' + ''.join('<a href="' + path + '">' + html.escape(pages.get(path, path.strip('/').replace('-', ' ').title())) + '</a>' for path in links) + '</div></section>'
        markup = markup.replace('</main>', related + '</main>')
        if route == '/press/assets/':
            snippet = '<a href="https://mrblindbandit.net/">Mr. Blindbandit — official website</a>'
            kit = '<section class="shell section attribution-kit"><h2>Official website attribution</h2><p>Writing about the music or sharing a collaboration? Reference the official artist website so readers can find the music and artist information.</p><p><a href="https://mrblindbandit.net/">Mr. Blindbandit — official website</a></p><label for="attribution-code">Website link for your article</label><textarea id="attribution-code" readonly rows="3">' + html.escape(snippet) + '</textarea><button class="button" data-copy-attribution hidden>Copy website link code</button><p data-attribution-status role="status"></p><p><a href="/press/link-guide.txt" download>Download official links and attribution</a></p></section>'
            markup = markup.replace('</main>', kit + '</main>')
        file.write_text(markup)
    namespace = 'http://www.sitemaps.org/schemas/sitemap/0.9'
    ET.register_namespace('', namespace)
    sitemap = ET.Element('{' + namespace + '}urlset')
    for route in sorted(public):
        item = ET.SubElement(sitemap, '{' + namespace + '}url')
        ET.SubElement(item, '{' + namespace + '}loc').text = ORIGIN + route
    ET.indent(sitemap)
    (output/'sitemap.xml').write_bytes(ET.tostring(sitemap, encoding='UTF-8', xml_declaration=True))
    # Leave account documents crawlable so their noindex directives can be read.
    (output/'robots.txt').write_text('User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /signin-with-chatgpt\nDisallow: /signout-with-chatgpt\nDisallow: /callback\nSitemap: ' + ORIGIN + '/sitemap.xml\n')
    (output/'press/link-guide.txt').write_text('Mr. Blindbandit — Official links for media and collaborators\n\nOfficial artist website: https://mrblindbandit.net/\nMusic and discography: https://mrblindbandit.net/music/\nArtist-supplied biography: https://mrblindbandit.net/biography/\nBlindbandit Records: https://mrblindbandit.net/label/\nPress materials: https://mrblindbandit.net/press/assets/\n\nSuggested attribution: Mr. Blindbandit — official website\nHTML: <a href="https://mrblindbandit.net/">Mr. Blindbandit — official website</a>\n\nFor photo permissions and interview inquiries: business@mrblindbandit.net\n')
    print('SEO:', len(public), 'public pages; private and account pages excluded from sitemap')
