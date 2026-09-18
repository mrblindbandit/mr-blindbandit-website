"""Reproducible source inventory; never claims browser/vendor configuration coverage."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit
import json,re
ROOT=Path(__file__).resolve().parents[1]
class Page(HTMLParser):
 def __init__(self):super().__init__();self.forms=[];self.scripts=[];self.links=[];self.fields=[];self.embeds=[]
 def handle_starttag(self,tag,attrs):
  a=dict(attrs)
  if tag=='form':self.forms.append({'action':a.get('action'),'native':a.get('data-native-form'),'method':a.get('method','get')})
  if tag in ('input','textarea','select'):self.fields.append({'name':a.get('name'),'type':a.get('type',tag),'required':'required' in a})
  if tag=='script' and a.get('src'):self.scripts.append(a['src'])
  if tag=='iframe':self.embeds.append(a.get('src'))
  if tag=='a' and a.get('href'):self.links.append(a['href'])
def build():
 private=json.loads((ROOT/'data/private-routes.json').read_text());routes=[]
 for file in (ROOT/'public').rglob('index.html'):
  route='/' if file.parent==ROOT/'public' else '/'+str(file.parent.relative_to(ROOT/'public'))+'/'
  p=Page();markup=file.read_text();p.feed(markup)
  routes.append({'route':route,'private':route in private,'title':re.findall(r'<title>(.*?)</title>',markup)[0],'forms':p.forms,'fields':p.fields,'scripts':p.scripts,'embeds':p.embeds,'policyLinks':[x for x in p.links if any(k in x for k in ['privacy','terms','legal','copyright','safety'])],'externalHosts':sorted({urlsplit(x).hostname for x in p.scripts+p.links if x.startswith('https://') and urlsplit(x).hostname})})
 sources=[p for directory in ['worker','public','db'] for p in (ROOT/directory).rglob('*') if p.suffix in ['.ts','.js','.sql'] and p.name not in ['site-pages.ts','private-pages.ts']]
 text='\n'.join(p.read_text() for p in sources)
 keys=sorted(set(re.findall(r'(?:localStorage|sessionStorage)\.(?:getItem|setItem)\([\'\"]([^\'\"]+)',text)))
 tables=sorted(set(re.findall(r'CREATE TABLE(?: IF NOT EXISTS)?\s+["`]?([\w]+)',text,re.I)))
 lock=json.loads((ROOT/'package-lock.json').read_text())
 dependencies=[{'package':k.removeprefix('node_modules/'),'version':v.get('version'),'license':v.get('license','Review required')} for k,v in lock.get('packages',{}).items() if k]
 result={'scope':'Static source inventory only; live cookies, vendor settings, cron jobs and network behavior require separate review.','routes':routes,'storageKeysFoundInSource':keys,'databaseTablesFoundInSource':tables,'lockedDependencies':dependencies,'processingMap':{'publicForms':'site_requests and inbox_threads in D1; optional submission files in R2; transactional delivery via configured email provider','community':'D1 community records, Clerk authentication','portal':'D1 label records, R2 documents; server-side role checks','mediaTools':'Browser memory and local file exports; CDN delivery of FFmpeg runtime','complianceTrackers':'D1 label_workspace_records with module role checks and label_audit history'}}
 (ROOT/'docs/compliance-source-inventory.json').write_text(json.dumps(result,indent=2)+'\n')
 print('Compliance inventory:',len(routes),'routes;',len(dependencies),'locked dependencies; source evidence only.')
if __name__=='__main__':build()
