import test from 'node:test';import assert from 'node:assert/strict';import {build} from 'esbuild';import {DatabaseSync} from 'node:sqlite';import {readFileSync,readdirSync} from 'node:fs';import {XMLValidator} from 'fast-xml-parser';
await build({entryPoints:['worker/editorial.ts','worker/syndication.ts','worker/translations.ts','worker/site-search.ts'],bundle:true,platform:'node',format:'esm',outdir:'.sites-runtime/crawl'});
const {editorialPublic}=await import('../.sites-runtime/crawl/editorial.js');const {syndication}=await import('../.sites-runtime/crawl/syndication.js');const {translatedPage}=await import('../.sites-runtime/crawl/translations.js');
function setup(){const db=new DatabaseSync(':memory:');for(const f of readdirSync('drizzle').filter(x=>x.endsWith('.sql')).sort())db.exec(readFileSync('drizzle/'+f,'utf8'));return {db,env:{DB:{prepare(sql){let args=[];return {bind(...v){args=v;return this;},async all(){return {results:db.prepare(sql).all(...args)};},async first(){return db.prepare(sql).get(...args);}};}}}};}
const origin='https://mrblindbandit.net';
test('sitemap and first-party feeds reflect publication, index and translation state',async()=>{const {db,env}=setup(),now=Date.now();for(const [slug,status,date,metadata]of [['live','published',now-1000,'{}'],['draft','draft',now-1000,'{}'],['future','scheduled',now+60000,'{}'],['hidden','published',now-1000,'{"noindex":true}']])db.prepare('INSERT INTO site_articles (id,slug,title,body,excerpt,author,category,tags,status,publish_at,metadata,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)').run(slug,slug,'Title & '+slug,'Body','Excerpt','Mr. Blindbandit','News','',status,date,metadata,now-1000,now-1000);db.prepare('INSERT INTO label_settings(key,value) VALUES(?,?)').run('translation:one',JSON.stringify({id:'one',language:'es',source:'/music/',title:'Música <segura>',description:'Música e historias',body:'Texto <script>alert(1)</script>',status:'published',updatedAt:now-1000}));const r=await editorialPublic(new Request(origin+'/sitemap.xml'),env),xml=await r.text();assert.equal(XMLValidator.validate(xml),true);for(const path of ['/biography/','/story/','/journal/articles/live/','/es/music/'])assert.ok(xml.includes(origin+path));for(const path of ['/portal/','/journal/articles/draft/','/journal/articles/future/','/journal/articles/hidden/'])assert.ok(!xml.includes(origin+path));for(const path of ['/feeds/news.xml','/feeds/news.atom','/feeds/music.xml']){const r=await syndication(new Request(origin+path),env),text=await r.text();assert.equal(r.status,200);assert.equal(XMLValidator.validate(text),true);if(path.includes('news')){assert.ok(text.includes('/journal/articles/live/'));assert.ok(!text.includes('/journal/articles/draft/'));assert.ok(!text.includes('/journal/articles/future/'));assert.ok(!text.includes('/journal/articles/hidden/'));}assert.equal(await(await syndication(new Request(origin+path,{method:'HEAD'}),env)).text(),'');}const page=await(await translatedPage(new Request(origin+'/es/music/'),env)).text();assert.ok(page.includes('lang="es"'));assert.ok(page.includes('&lt;script&gt;'));assert.ok(!page.includes('<script>alert(1)</script>'));assert.equal(await(await editorialPublic(new Request(origin+'/robots.txt',{method:'HEAD'}),env)).text(),'');});

test('article image metadata escapes text and related links disappear when destinations are unpublished',async()=>{
 const {db,env}=setup(),now=Date.now()-1000;
 for(const [slug,metadata] of [['source',{image:origin+'/assets/portrait.jpg',imageAlt:'Portrait " safely described',imageCaption:'Photo <credit>',socialImage:origin+'/assets/social.jpg',related:['/music/','/journal/articles/target/']}],['target',{}]])db.prepare('INSERT INTO site_articles(id,slug,title,body,excerpt,author,category,tags,status,publish_at,metadata,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)').run(slug,slug,'Title '+slug,'Original body','Excerpt','Artist','News','','published',now,JSON.stringify(metadata),now,now);
 let html=await(await editorialPublic(new Request(origin+'/journal/articles/source/'),env)).text();assert.ok(html.includes('property="og:image" content="'+origin+'/assets/social.jpg"'));assert.ok(html.includes('Portrait &quot; safely described'));assert.ok(html.includes('Photo &lt;credit&gt;'));assert.ok(html.includes('href="/journal/articles/target/"'));assert.ok(html.includes('"image":["'+origin+'/assets/portrait.jpg"]'));
 db.prepare("UPDATE site_articles SET status='draft' WHERE id='target'").run();html=await(await editorialPublic(new Request(origin+'/journal/articles/source/'),env)).text();assert.ok(!html.includes('href="/journal/articles/target/"'));
});

test('featured news and article navigation omit private editorial notes',async()=>{
 const {db,env}=setup(),now=Date.now()-10000;for(const [i,slug]of ['older','featured','newer'].entries())db.prepare('INSERT INTO site_articles(id,slug,title,body,excerpt,author,category,tags,status,publish_at,metadata,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)').run(slug,slug,'Article '+slug,'Article body','Excerpt','Artist','News','','published',now+i*1000,JSON.stringify({featured:slug==='featured',privateNotes:'SECRET EDITORIAL NOTE'}),now,now);
 const page=await(await editorialPublic(new Request(origin+'/journal/articles/featured/'),env)).text();assert.ok(page.includes('Previous: Article older'));assert.ok(page.includes('Next: Article newer'));assert.ok(!page.includes('SECRET EDITORIAL NOTE'));
 const news=await(await editorialPublic(new Request(origin+'/news/'),env)).text();assert.ok(news.indexOf('href="/journal/articles/featured/"')<news.indexOf('href="/journal/articles/newer/"'));assert.ok(!news.includes('SECRET EDITORIAL NOTE'));
});

const {siteSearch}=await import('../.sites-runtime/crawl/site-search.js');
test('public search finds published content and excludes drafts and private editorial notes',async()=>{
 const {db,env}=setup(),now=Date.now();for(const status of ['published','draft'])db.prepare('INSERT INTO site_articles(id,slug,title,body,excerpt,author,category,tags,status,publish_at,metadata,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)').run(status,status,'Searchneedle '+status,'Public body','Excerpt','Artist','News','',status,now-1000,JSON.stringify({privateNotes:'Secretneedle'}),now,now);
 const html=await(await siteSearch(new Request(origin+'/search/?q=Searchneedle'),env)).text();assert.ok(html.includes('/journal/articles/published/'));assert.ok(!html.includes('/journal/articles/draft/'));assert.ok(html.includes('noindex,nofollow'));
 const secret=await(await siteSearch(new Request(origin+'/search/?q=Secretneedle'),env)).text();assert.ok(!secret.includes('/journal/articles/published/'));
 const sitemap=await(await editorialPublic(new Request(origin+'/sitemap.xml'),env)).text();assert.ok(sitemap.includes(origin+'/release-checklist/'));assert.ok(!sitemap.includes('/portal/personal-notes/'));
});

test('article aliases redirect to the latest published address and do not disclose drafts',async()=>{
 const {db,env}=setup(),now=Date.now();db.prepare('INSERT INTO site_articles(id,slug,title,body,excerpt,author,category,tags,status,publish_at,metadata,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)').run('alias-test','latest-address','Title','Body','Excerpt','Artist','News','','published',now-1000,'{}',now,now);db.prepare('INSERT INTO label_settings(key,value) VALUES(?,?)').run('article-alias:previous-address',JSON.stringify({articleId:'alias-test'}));
 const redirect=await editorialPublic(new Request(origin+'/journal/articles/previous-address/'),env);assert.equal(redirect.status,301);assert.equal(redirect.headers.get('location'),'/journal/articles/latest-address/');db.prepare("UPDATE site_articles SET status='draft' WHERE id='alias-test'").run();assert.equal((await editorialPublic(new Request(origin+'/journal/articles/previous-address/'),env)).status,404);
});

test('Filipino and Cebuano render complete bundled biographies with reciprocal language metadata',async()=>{
 const {env}=setup();
 for(const [lang,title] of [['fil','Sino si Mr. Blindbandit?'],['ceb','Kinsa si Mr. Blindbandit?']]){
  const r=await translatedPage(new Request(origin+'/'+lang+'/biography/'),env),html=await r.text();
  assert.equal(r.status,200);assert.equal(r.headers.get('content-language'),lang);assert.ok(html.includes(title));
  assert.ok(html.includes('Florida School for the Deaf and the Blind'));assert.ok(html.includes('Oktubre 8, 2024'));
  assert.ok(html.includes('hreflang="fil" href="'+origin+'/fil/biography/'));assert.ok(html.includes('hreflang="ceb" href="'+origin+'/ceb/biography/'));
  assert.ok(!html.includes('<script>alert'));assert.equal((html.match(/<h1>/g)||[]).length,1);
  const head=await translatedPage(new Request(origin+'/'+lang+'/biography/',{method:'HEAD'}),env);assert.equal(await head.text(),'');
  const normalized=await translatedPage(new Request(origin+'/'+lang+'/biography'),env);assert.equal(normalized.status,301);
 }
});
test('archiving a bundled translation removes it from routing and sitemap instead of exposing the static fallback',async()=>{
 const {db,env}=setup();db.prepare('INSERT INTO label_settings(key,value) VALUES(?,?)').run('translation:archived',JSON.stringify({id:'archived',source:'/biography/',language:'ceb',status:'archived'}));
 assert.equal((await translatedPage(new Request(origin+'/ceb/biography/'),env)).status,404);
 const xml=await(await editorialPublic(new Request(origin+'/sitemap.xml'),env)).text();assert.ok(!xml.includes(origin+'/ceb/biography/'));assert.ok(xml.includes(origin+'/fil/biography/'));
});
