"""Publish supplied policies; retain operational standards behind portal authorization."""
import html, json, re
from pathlib import Path
from legal_expansion import policy_body

ROOT = Path(__file__).resolve().parents[1]
PARAGRAPHS = json.loads((ROOT / 'data/compliance-package.json').read_text())
PUBLIC = [
 ('terms', 'Website Terms of Service',72,163),
 ('privacy','Privacy Policy',163,255),
 ('cookies','Cookie and Storage Notice',255,286),
 ('copyright','Copyright and DMCA Policy',286,319),
 ('community-guidelines','Community Guidelines',319,368),
 ('safety','Child Safety Policy',368,392),
 ('submission-terms','Music Submission Terms',392,422),
 ('media-suite-terms','Media Suite Terms and Safety Rules',422,468),
 ('advertising-disclosure','Advertising and Sponsorship Disclosure',539,563),
 ('accessibility','Accessibility Statement',563,615),
 ('security-reporting','Security and Vulnerability Reporting',615,629),
 ('moderation-appeals','Content Reports and Moderation Appeals',708,747),
]
PRIVATE = [('terms','Label Portal Supplemental Terms',468,507),
 ('data-privacy','Label Portal Privacy Notice',507,539),
 ('compliance-handbook','Compliance Operating Handbook',747,845)]

def sections(start,end,public=False):
    result=[]; title='Scope'; body=[]
    for text in PARAGRAPHS[start+1:end]:
        if not text or text.startswith(('PUBLIC WEBSITE DRAFT','PRIVATE /','INTERNAL ','Effective','Part ')):continue
        if re.match(r'^\d+\. ',text):
            if body:result.append((title,''.join(body)))
            title=re.sub(r'^\d+\. ','',text);body=[]
        else:body.append('<p>'+html.escape(text)+'</p>')
    if body:result.append((title,''.join(body)))
    if public:
        replacements={
          ('privacy','European advertising consent'): '<p>Optional advertising is disabled by default and is subject to the site’s advertising activation gate and visitor choice. A Google-certified consent platform must be verified before advertising is activated for regions requiring it. The site’s own Privacy Choices dialog is not a certified advertising consent platform. You can reopen Privacy Choices to decline optional advertising and media.</p>',
        }
        # Specific operational claims are deliberately narrower than the supplied draft.
        edits={
          'Security':'<p>The site uses HTTPS, server-side role checks for portal data, rate limits on relevant requests, audit records for administrative changes and provider-managed Clerk authentication. Use available multifactor authentication and protect your devices. No internet service can guarantee complete security. Report suspected vulnerabilities privately to security@mrblindbandit.net.</p>',
          'European advertising consent': replacements[('privacy','European advertising consent')],
          'Do Not Track, Global Privacy Control, and privacy signals':'<p>This site treats Global Privacy Control as a refusal of optional advertising and analytics in its first-party privacy controls. It does not claim control over independently visited third-party websites. Legacy Do Not Track does not change the site’s settings. You can also reject optional processing through Privacy Choices.</p>',
          'European regulations message':'<p>Advertising requires a verified Google-certified consent platform where Google’s regional requirements apply. Until that activation gate is satisfied, advertising stays disabled. Privacy Choices controls optional media and the site’s own advertising preference; it is not a replacement for a certified platform.</p>',
          'DNT and GPC':'<p>Global Privacy Control disables optional advertising and analytics in the site’s privacy controls. Legacy Do Not Track does not change these settings. Directly visited third-party sites manage their own processing.</p>',
          'Target standard':'<p>Our development target is WCAG 2.2 Level AA. This is a commitment to improvement, not a claim of verified full conformance. Production testing with physical devices and screen readers remains necessary, including iOS VoiceOver and Safari.</p>',
          'Ongoing testing':'<p>Accessibility issues are tracked with the affected task, severity, remediation and review evidence. Automated checks do not establish full conformance. Contact the Accessibility Coordinator if you encounter a barrier or need an alternative way to complete a task.</p>',
        }
        result=[(title,edits.get(title,body)) for title,body in result]
        result=[(title,re.sub(r' in Part (?:[IVX]+)', '',body)) for title,body in result]
    return result

def add_compliance(output,layout,pages,portal_pages):
    for slug,title,start,end in PUBLIC:
        route='/'+slug+'/'
        layout(route,title,'Policies and responsibilities for Mr. Blindbandit and Blindbandit Records.',policy_body(title,'Effective September 13, 2026. Contact the appropriate officer with questions.',sections(start,end,True)))
        if not any(p==route for _,p in pages):pages.append((title,route))
    links=''.join('<li><a href="/'+slug+'/">'+html.escape(title)+'</a></li>' for slug,title,_,_ in PUBLIC)
    layout('/legal/','Legal and Trust Center','Policies, accessibility, privacy choices and responsible use.','<section class="shell policy-intro"><h1>Legal and Trust Center</h1><p>Operated by Kaeleb Savon Heck, Mr. Blindbandit / Blindbandit Records.</p><ul>'+links+'</ul><ul><li><a href="/mobile/privacy/">Blindbandit Mobile Privacy</a></li><li><a href="/mobile/trust-safety/">Blindbandit Mobile Trust &amp; Safety</a></li><li><a href="/mobile/about/">About Blindbandit Mobile</a></li></ul><p><button type="button" data-privacy-choices>Privacy Choices</button></p><p><a href="/contact/">Contact directory</a> · <a href="/portal/data-privacy/" data-full-navigation>Private portal notice (sign-in required)</a></p></section>')
    if not any(p=='/legal/' for _,p in pages):pages.append(('Legal and Trust Center','/legal/'))
    # Use the existing durable, rate-limited inquiry inbox, not mail drafts.
    common='<label>Your name<input name="name" autocomplete="name" maxlength="120" required></label><label>Reply email<input name="email" type="email" autocomplete="email" maxlength="254" required></label>'
    contact='<label>Details<textarea name="message" rows="8" maxlength="4000" required></textarea></label><label><input name="consent" type="checkbox" required> I am 13 or older, or an authorized adult submitting this request, and understand the Privacy Policy.</label><p>Do not include passwords, identity documents, payment credentials or copies of illegal content. <a href="/privacy/">Privacy Policy</a></p><button type="submit">Submit securely</button><p role="status" aria-live="polite"></p>'
    reports=[
      ('privacy-request','Privacy rights request','Ask for access, correction, deletion, portability, restriction, consent withdrawal or marketing unsubscribe. We may need proportionate identity verification.','<input type="hidden" name="category" value="Privacy rights"><label>Request type<select name="request_type"><option>Access or copy</option><option>Correction</option><option>Deletion or account closure</option><option>Restriction or objection</option><option>Consent withdrawal</option><option>Marketing unsubscribe</option><option>Authorized representative</option><option>Other privacy question</option></select></label><label>Account or previous request reference (optional)<input name="reference" maxlength="1500"></label>'),
      ('report-content','Report content or appeal a decision','Report a specific item without reproducing harmful material. This is not an emergency service. For immediate danger, contact local emergency services.','<label>Category<select name="category"><option>Community report</option><option>Moderation appeal</option><option>Child safety</option><option>Privacy or doxxing</option><option>Threat or violence</option><option>Fraud or impersonation</option><option>Malware or account security</option><option>Illegal content</option></select></label><label>Exact content URL or decision reference<input name="reference" maxlength="1500" required></label><label>Urgency<select name="urgency"><option>Ordinary review</option><option>Urgent safety concern</option></select></label>'),
      ('copyright-notice','Copyright notice','Send a copyright notice for material on this service. Notices may be shared with the affected contributor as necessary for review.','<input type="hidden" name="category" value="Copyright notice"><label>Protected work or representative list<textarea name="protected_work" maxlength="2000" required></textarea></label><label>Exact URL of disputed material<input name="reference" type="url" maxlength="1500" required></label><label>Postal address and telephone for follow-up<textarea name="contact_details" maxlength="1000" required></textarea></label><label>Physical or electronic signature<input name="signature" maxlength="200" required></label><label><input name="good_faith" type="checkbox" required> I have a good-faith belief that this use is not authorized by the copyright owner, its agent, or law.</label><label><input name="accuracy" type="checkbox" required> The information is accurate and, under penalty of perjury, I am authorized to act for the owner of the right claimed to be infringed.</label>'),
    ]
    for slug,title,description,fields in reports:
        route='/'+slug+'/'
        layout(route,title,description,'<section class="shell policy-intro"><h1>'+title+'</h1><p>'+description+'</p><form class="label-form" data-native-form="inquiry">'+common+fields+contact+'</form><p><a href="/legal/">Legal and Trust Center</a> · <a href="/contact/">Alternative contact methods</a></p></section>')
        pages.append((title,route))
    for slug,target,label in [('privacy','privacy-request','Send a privacy rights request'),('copyright','copyright-notice','Submit a copyright notice'),('moderation-appeals','report-content','Report content or request an appeal'),('community-guidelines','report-content','Report content')]:
        p=output/slug/'index.html';text=p.read_text();p.write_text(text.replace('</main>','<p class="shell"><a class="button" href="/'+target+'/">'+label+'</a></p></main>'))
    # Copy the existing portal shell so public advertising/translation scripts are absent.
    shell=(output/'portal/index.html').read_text()
    for slug,title,start,end in PRIVATE:
        content=policy_body(title,'Private portal document · September 13, 2026.',sections(start,end))
        if slug=='compliance-handbook':
            content='<section class="shell"><h1>Compliance Operating Handbook</h1><p>Internal procedures and implementation targets. Items here are not evidence of completed filings, certifications, provider configuration or legal review.</p></section>'
            for label,a,b in [('Governance assignments',45,72),('Privacy rights',747,770),('Retention schedule',770,805),('Incident response',805,826),('Moderation',826,845),('Email standard',629,648),('Vendor governance',648,671),('Consumer launch gate',671,708),('Implementation checklist',845,1055),('Accessibility acceptance plan',1055,1364),('Jurisdiction and feature gates',1364,1493),('Go-live checklist',1493,1741)]:
                content+='<section class="shell legal-copy"><h2>'+label+'</h2>'+''.join('<p>'+html.escape(p)+'</p>' for p in PARAGRAPHS[a+1:b] if p)+'</section>'
        route='/portal/'+slug+'/'
        markup=re.sub(r'<main\b[^>]*>.*?</main>','<main id="main">'+content+'</main>',shell,flags=re.S)
        markup=re.sub(r'<title>.*?</title>','<title>'+title+' · Label portal</title>',markup)
        markup=re.sub(r'<link rel="canonical"[^>]*>','<link rel="canonical" href="https://mrblindbandit.net'+route+'">',markup)
        path=output/route.strip('/')/'index.html';path.parent.mkdir(parents=True,exist_ok=True);path.write_text(markup)
        portal_pages.append((title,slug));pages.append((title,route))
    for path in output.rglob('index.html'):
        markup=path.read_text()
        if path.parent.name in {x[0] for x in PUBLIC+PRIVATE}|{'legal','privacy-request','report-content','copyright-notice'}:
            markup=markup.replace('<body>','<body class="public-modern legal-page">').replace('<body class="label-page">','<body class="label-page public-modern legal-page">')
            if 'href="/public-modern.css"' not in markup:markup=markup.replace('</head>','<link rel="stylesheet" href="/public-modern.css"></head>')
        if '/portal/' in str(path):
            markup=markup.replace('<footer class="portal-site-footer">','<footer class="portal-site-footer"><a href="/portal/terms/" data-full-navigation>Portal terms</a><a href="/portal/data-privacy/" data-full-navigation>Portal data privacy</a>')
        else:
            markup=markup.replace('<div class="footer-links">','<div class="footer-links"><a href="/legal/">Legal and Trust Center</a>')
        if path.parent.name in ['media-tools','audio-converter','art-track','audiogram','metadata-editor','waveform-image','artwork-resizer','audio-check','audio-clipper','audio-fade','audio-speed','audio-reverse','audio-volume','audio-equalizer','audio-pitch','audio-channels','audio-loop','audio-compressor','audio-silence']:
            markup=markup.replace('</main>','<aside class="shell"><p>Use only material you have rights to process. Keep your original files. <a href="/media-suite-terms/">Media Suite terms and safety</a> · <a href="/privacy/">Privacy</a></p></aside></main>')
        if path.parent.name=='submit':
            markup=markup.replace('<button type="submit"','<p>By submitting, you accept the <a href="/submission-terms/">Music Submission Terms</a>. Submission is not a record deal or a marketing signup.</p><button type="submit"')
        path.write_text(markup)
