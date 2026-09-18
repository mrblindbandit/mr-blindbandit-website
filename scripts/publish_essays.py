"""Publish the three supplied school essays as complete, accessible articles."""
import html,json,re

def publish_essays(root,output,layout,pages):
    essays=json.loads((root/'data/essays.json').read_text())
    cards=[]
    for essay in essays:
        route='/news/essays/'+essay['slug']+'/'
        rendered=[]
        in_sources=False
        for paragraph in essay['paragraphs']:
            if paragraph in ('AI Assistance Disclosure','Works Cited'):
                in_sources=paragraph=='Works Cited'
                rendered.append('<h2>'+html.escape(paragraph)+'</h2>')
                continue
            safe=html.escape(paragraph)
            safe=re.sub(r'(https?://[^\s]+|www\.[^\s]+)',lambda m:'<a href="'+('https://' if m.group(0).startswith('www.') else '')+m.group(0).rstrip('.')+'">'+m.group(0).rstrip('.')+'</a>'+('.' if m.group(0).endswith('.') else ''),safe)
            rendered.append(('<p class="citation-entry">' if in_sources else '<p>')+safe+'</p>')
        meta='<dl class="article-meta"><div><dt>Author</dt><dd>'+html.escape(essay['author'])+'</dd></div><div><dt>School</dt><dd>'+html.escape(essay['school'])+'</dd></div><div><dt>Course</dt><dd>'+html.escape(essay['course'])+'</dd></div><div><dt>Date</dt><dd><time datetime="2026-09-12">'+html.escape(essay['date'])+'</time></dd></div></dl>'
        body='<article class="shell policy-body essay-article"><p class="eyebrow">'+html.escape(essay['kind'])+' / KAELEB SAVON HECK</p><h1>'+html.escape(essay['title'])+'</h1><p class="lede">'+html.escape(essay['description'])+'</p>'+meta+'<div class="essay-text">'+''.join(rendered)+'</div><footer class="article-footer"><p>Published in full from the author’s submitted essay.</p><a href="/news/">More news and writing</a> · <a href="/biography/">About Kaeleb Savon Heck</a></footer></article>'
        layout(route,essay['title'],essay['description'],body)
        if not any(path==route for _,path in pages):pages.append((essay['title'],route))
        cards.append('<article><p class="eyebrow">'+html.escape(essay['kind'])+' · '+html.escape(essay['date'])+'</p><h2><a href="'+route+'">'+html.escape(essay['title'])+'</a></h2><p>'+html.escape(essay['description'])+'</p><a class="text-link" href="'+route+'">Read the complete essay ↗</a></article>')
    news=output/'news/index.html'
    markup=news.read_text()
    block='<section class="shell section" aria-labelledby="student-essays"><div class="section-heading"><div><p class="eyebrow">ESSAYS / IN THE AUTHOR’S WORDS</p><h2 id="student-essays">Three complete essays by Kaeleb Savon Heck</h2></div></div><p>Personal, researched and argumentative writing published in full, including disclosures and Works Cited entries from the submitted documents.</p><div class="cards">'+''.join(cards)+'</div></section>'
    news.write_text(markup.replace('</main>',block+'</main>'))
