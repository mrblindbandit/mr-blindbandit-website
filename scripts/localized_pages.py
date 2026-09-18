"""Localized public shells. Content is served from reviewed settings or bundled copy."""
import json,html

def enhance(root,output,pages):
 records=json.loads((root/'data/localized-pages.json').read_text())
 names={'en':'English','es':'Español','fil':'Filipino','ceb':'Cebuano'}
 for r in records:
  lang=r['language'];source=r['source'];path='/'+lang+source
  labels=(['Lumaktaw sa nilalaman','Pangunahing pahina','Talambuhay','Makipag-ugnayan','Suporta','Wika','Patakaran sa privacy (Ingles)','Copyright (Ingles)','Mga tuntunin (Ingles)','Accessibility (Ingles)'] if lang=='fil' else ['Laktaw ngadto sa sulod','Pangunang panid','Talambuhay','Pakigkontak','Suporta','Pinulongan','Patakaran sa privacy (Iningles)','Copyright (Iningles)','Mga lagda (Iningles)','Accessibility (Iningles)'])
  nav=' · '.join('<a href="/'+lang+p+'">'+html.escape(t)+'</a>' for p,t in zip(['/','/biography/','/contact/','/support/'],labels[1:5]))
  language=' · '.join('<a href="'+('/' if l=='en' else '/'+l+'/')+'" lang="'+l+'" data-language="'+l+'">'+n+'</a>' for l,n in names.items())
  s='<!doctype html><html lang="'+lang+'"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+html.escape(r['title'])+'</title><meta name="description" content="'+html.escape(r['description'],quote=True)+'"><link rel="canonical" href="https://mrblindbandit.net'+path+'"><link rel="stylesheet" href="/styles.css"><link rel="icon" href="/assets/blindbandit-records-gold.jpeg"></head><body class="localized-page"><a class="skip" href="#main">'+labels[0]+'</a><header class="shell"><a class="wordmark" href="/'+lang+'/">Mr. Blindbandit</a><nav>'+nav+'</nav><nav class="language-choice" aria-label="'+labels[5]+'">'+language+'</nav></header><main id="main" tabindex="-1"><article class="shell policy-body"><h1>'+html.escape(r['title'])+'</h1><p>'+html.escape(r['description'])+'</p><p>'+html.escape(r['body']).replace('\n\n','</p><p>')+'</p></article></main><footer class="shell">'+nav+'<p>'+' · '.join('<a href="'+p+'" lang="en">'+t+'</a>' for p,t in zip(['/privacy/','/copyright/','/terms/','/accessibility/'],labels[6:]))+'</p><p>© 2026 Mr. Blindbandit · Blindbandit Records</p></footer><script src="/languages.js?v=phase29" defer></script></body></html>'
  target=output/path.strip('/')/'index.html';target.parent.mkdir(parents=True,exist_ok=True);target.write_text(s)
  pages.append((r['title'],path))
