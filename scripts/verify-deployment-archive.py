"""Enforce Worker-only HTML routing in a packaged build, including synced outputs.

Run after the Sites packager. Never ship static HTML that bypasses Worker
host routing, authorization, translations, or publication-state checks.
"""
import sys,tarfile,tempfile,os
from pathlib import Path
archive=Path(sys.argv[1]).resolve()
fd,temp=tempfile.mkstemp(suffix='.tar',dir=archive.parent);os.close(fd)
removed=[]
try:
 with tarfile.open(archive) as src,tarfile.open(temp,'w') as dst:
  for member in src.getmembers():
   name=member.name.removeprefix('./')
   if name.startswith('dist/client/') and (name.endswith(('.html','.html.gz','.html.br')) or name in {'dist/client/'+f+s for f in ['robots.txt','sitemap.xml'] for s in ['', '.gz','.br']}):
    removed.append(name);continue
   dst.addfile(member,src.extractfile(member) if member.isfile() else None)
 with tarfile.open(temp) as result:
  names={m.name.removeprefix('./') for m in result.getmembers()}
  assert 'dist/server/index.js' in names,'Missing Worker entrypoint'
  assert not any(n.startswith('dist/client/') and n.endswith(('.html','.html.gz','.html.br')) for n in names)
 os.replace(temp,archive)
 print('Verified Worker-only routing; removed',len(removed),'static route artifacts.')
finally:
 if os.path.exists(temp):os.unlink(temp)
