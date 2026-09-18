"""Deployment gate for generated public markup, crawl files and internal links."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit,unquote
import xml.etree.ElementTree as ET
import json
root=Path(__file__).resolve().parents[1];public=root/'public'
private=set(json.loads((root/'data/private-routes.json').read_text()))
class Page(HTMLParser):
 def __init__(self):super().__init__();self.links=[];self.h1=0;self.title=False;self.canonical='';self.robots='';self.assets=[]
 def handle_starttag(self,tag,attrs):
  a=dict(attrs)
  if tag=='a':self.links.append(a.get('href',''))
  if tag=='h1':self.h1+=1
  if tag=='title':self.title=True
  if tag=='link' and a.get('rel')=='canonical':self.canonical=a.get('href','')
  if tag=='meta' and a.get('name')=='robots':self.robots=a.get('content','')
  if tag in ['script','img'] and a.get('src','').startswith('/'):self.assets.append(a['src'])
errors=[];count=0
for f in public.rglob('index.html'):
 route='/' if f.parent==public else '/'+str(f.parent.relative_to(public))+'/'
 if route in private or route.startswith(('/support/payment/','/portal/','/owner/','/community/account/','/community/dashboard/','/community/moderation/')):continue
 count+=1;markup=f.read_text();p=Page();p.feed(markup)
 head=markup.split('</head>',1)[0]
 publisher='<meta name="google-adsense-account" content="ca-pub-7238428274233485">'
 loader='<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7238428274233485" crossorigin="anonymous"></script>'
 if head.count(publisher)!=1:errors.append(f'{route}: needs exactly one AdSense account meta tag in head')
 if loader in markup:errors.append(f'{route}: AdSense loader must wait for consent and advertising activation')
 if not p.title or p.h1!=1:errors.append(f'{route}: needs a title and one H1 (found {p.h1})')
 if p.canonical!='https://mrblindbandit.net'+route:errors.append(f'{route}: unexpected canonical {p.canonical}')
 if 'noindex' in p.robots:errors.append(f'{route}: unexpected noindex')
 for href in p.links+p.assets:
  u=urlsplit(href)
  if u.scheme or u.netloc or not u.path.startswith('/'):continue
  path=unquote(u.path)
  if path.startswith(('/api/','/signin-with-chatgpt','/signout-with-chatgpt','/callback','/feeds/')):continue
  target=public/path.lstrip('/')
  if not target.exists():errors.append(f'{route}: missing internal target {path}')
xml=ET.parse(public/'sitemap.xml');urls=[e.text for e in xml.findall('.//{*}loc')]
if len(urls)!=len(set(urls)):errors.append('Sitemap contains duplicate URLs')
for url in urls:
 if not url.startswith('https://mrblindbandit.net/') or '/portal/' in url or '/owner/' in url:errors.append('Invalid sitemap URL: '+url)
robots=(public/'robots.txt').read_text()
if 'Sitemap: https://mrblindbandit.net/sitemap.xml' not in robots or 'Disallow: /\n' in robots:errors.append('Invalid robots policy')
if (public/'ads.txt').read_text().strip()!='google.com, pub-7238428274233485, DIRECT, f08c47fec0942fa0':errors.append('Publisher ads.txt differs from authorized value')
if errors:raise SystemExit('\n'.join(sorted(set(errors))))
print(f'Public deployment checks passed: {count} pages, {len(urls)} sitemap URLs, links and publisher file.')
