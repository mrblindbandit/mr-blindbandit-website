"""Limited semantic regression gate, not a WCAG conformance certification."""
from html.parser import HTMLParser
from pathlib import Path
from collections import Counter
class Node:
 def __init__(self,tag='',attrs=(),parent=None):self.tag=tag;self.a=dict(attrs);self.parent=parent;self.text=''
class Page(HTMLParser):
 def __init__(self):super().__init__();self.root=Node();self.stack=[self.root];self.nodes=[]
 def handle_starttag(self,tag,attrs):
  n=Node(tag,attrs,self.stack[-1]);self.nodes.append(n)
  if tag not in ['area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr']:self.stack.append(n)
 def handle_endtag(self,tag):
  for i in range(len(self.stack)-1,0,-1):
   if self.stack[i].tag==tag:self.stack=self.stack[:i];break
 def handle_data(self,data):
  for n in self.stack:n.text+=data
errors=[];pages=list(Path('public').rglob('index.html'))
for f in pages:
 p=Page();p.feed(f.read_text());nodes=p.nodes;ids={n.a['id']:n for n in nodes if n.a.get('id')}
 def name(n):return n.a.get('aria-label') or ' '.join(ids[i].text for i in n.a.get('aria-labelledby','').split() if i in ids) or n.text.strip() or (n.a.get('alt') if n.tag=='img' else '')
 def fail(msg):errors.append(str(f)+': '+msg)
 if not any(n.tag=='html' and n.a.get('lang') for n in nodes):fail('missing document language')
 if len([n for n in nodes if n.tag=='main'])!=1:fail('expected one main landmark')
 if len([n for n in nodes if n.tag=='h1'])!=1:fail('expected one H1')
 main=next((n for n in nodes if n.tag=='main'),None)
 if not main or main.a.get('id')!='main' or main.a.get('tabindex')!='-1':fail('main must receive skip-link focus')
 for ident,count in Counter(n.a['id'] for n in nodes if n.a.get('id')).items():
  if count>1:fail('duplicate id '+ident)
 for n in nodes:
  if n.tag=='img' and 'alt' not in n.a:fail('image missing alt '+n.a.get('src',''))
  if n.tag=='iframe' and not n.a.get('title'):fail('iframe missing title')
  if n.tag=='button' and not name(n):fail('button missing accessible name')
  if n.a.get('tabindex','').isdigit() and int(n.a['tabindex'])>0:fail('positive tabindex')
  if n.tag in ['input','select','textarea'] and n.a.get('type') not in ['hidden','submit','button','reset']:
   parent=n.parent;wrapped=False
   while parent:
    if parent.tag=='label' and parent.text.strip():wrapped=True
    parent=parent.parent
   explicit=any(x.tag=='label' and x.a.get('for')==n.a.get('id') and n.a.get('id') for x in nodes)
   if not(wrapped or explicit or n.a.get('aria-label') or n.a.get('aria-labelledby')):fail('unlabeled '+n.tag+' '+n.a.get('name',''))
if errors:raise SystemExit('\n'.join(errors))
print(f'Accessibility source gate passed: {len(pages)} public/private documents; landmarks, labels, alternatives, names and tab order attributes. This is not full WCAG testing.')
