import {q,esc} from './editorial-common';
import {publicRoutes,applyMetadata} from './editorial';
import {sitePages} from './site-pages';
export async function siteSearch(request:Request,env:any){
 const u=new URL(request.url);if(u.pathname!=='/search/')return null;
 const term=(u.searchParams.get('q')||'').trim().slice(0,100),words=term.toLowerCase().split(/\s+/).filter(Boolean),results:any[]=[];
 const matches=(text:string)=>words.every(w=>text.toLowerCase().includes(w));
 let limited=false;
 try{if(term.length>=2){
 for(const path of publicRoutes().filter(p=>p!=='/search/')){const html=sitePages[path],title=/<title>(.*?)<\/title>/s.exec(html)?.[1]||path,description=/<meta name="description" content="([^"]*)"/.exec(html)?.[1]||'';const main=(/<main\b[^>]*>([\s\S]*?)<\/main>/.exec(html)?.[1]||'').replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'').replace(/<[^>]+>/g,' ');if(matches(title+' '+description+' '+main))results.push({path,title,description});}
 const articles=(await q(env,"SELECT slug,title,excerpt,body,metadata FROM site_articles WHERE status IN ('published','scheduled') AND publish_at<=? ORDER BY publish_at DESC LIMIT 501",Date.now()).all()).results;limited=articles.length>500;
 for(const r of articles.slice(0,500)){const m=JSON.parse(r.metadata||'{}');if(!m.noindex&&matches(r.title+' '+r.excerpt+' '+r.body))results.push({path:'/journal/articles/'+r.slug+'/',title:r.title,description:r.excerpt});}
 }
 const body='<main id="main" tabindex="-1"><section class="shell section"><h1>Search the site</h1><p>Find music, artist information, public pages and published stories.</p><form method="get" action="/search/" class="label-form"><label>Search words<input name="q" type="search" minlength="2" maxlength="100" value="'+esc(term)+'" required></label><button type="submit">Search</button></form>'+(term.length<2?'<p>Enter at least two characters to search.</p>':'<p role="status">'+results.length+' matches'+(results.length>50?' — showing the first 50':'')+'.</p>'+results.slice(0,50).map(r=>'<article class="label-task"><h2><a href="'+esc(r.path)+'">'+esc(r.title)+'</a></h2><p>'+esc(r.description)+'</p></article>').join('')+(!results.length?'<p>Try fewer words or visit <a href="/explore/">all public pages</a>.</p>':''))+(limited?'<p>Article search covers the latest 500 published articles.</p>':'')+'</section></main>';
 let html=sitePages['/search/'].replace(/<main\b[^>]*>[\s\S]*?<\/main>/,body);html=applyMetadata(html,'/search/',{noindex:!!term});return new Response(request.method==='HEAD'?null:html,{headers:{'content-type':'text/html; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'}});
 }catch{return new Response('Search is temporarily unavailable. Please try again.',{status:503,headers:{'cache-control':'no-store'}});}
}
