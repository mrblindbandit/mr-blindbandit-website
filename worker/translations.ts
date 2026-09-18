import bundled from '../data/localized-pages.json';
import {q,id,str,response,esc,audit} from './editorial-common';
import {articleBody} from './article-tools';
import {sitePages} from './site-pages';
const names:Record<string,string>={es:'Español',fil:'Filipino',ceb:'Cebuano'};
const excluded=/^\/(portal|owner|es|fil|ceb)(\/|$)|^\/community\/(account|dashboard|moderation)\//;
const sourceAllowed=(p:string)=>!!sitePages[p]&&!excluded.test(p);
export async function translations(env:any){
 const saved=(await q(env,"SELECT value FROM label_settings WHERE key LIKE 'translation:%'").all()).results.map((r:any)=>JSON.parse(r.value));
 // An explicit draft or archive overrides its bundled version too.
 return [...bundled.filter(b=>!saved.some((r:any)=>r.language===b.language&&r.source===b.source)),...saved];
}
export function translationPath(r:any){return '/'+r.language+(r.source==='/'?'/':r.source);}
export async function translationAPI(request:Request,env:any,a:any,d:any){
 if(!['owner','admin'].includes(a.role))return response({error:'Administrator access required.'},403);
 try{
  if(request.method==='GET')return response({translations:await translations(env),sources:Object.keys(sitePages).filter(sourceAllowed)});
  if(request.method!=='POST')return response({error:'Method not allowed.'},405);
  if(!Object.hasOwn(names,d.language)||!sourceAllowed(d.source))throw Error('Choose a supported language and public English source page.');
  if(!['draft','review','published','archived'].includes(d.status))throw Error('Choose a valid translation state.');
  if(d.status==='published'&&!d.reviewed)throw Error('Review the translation and confirm its accuracy before publication.');
  const key=d.id?str(d.id,100):id();
  const existing=await q(env,'SELECT value FROM label_settings WHERE key=?','translation:'+key).first();
  const base=bundled.find(b=>b.id===key);
  if(d.id&&!existing&&!base)throw Error('Translation not found.');
  if(base&&(d.source!==base.source||d.language!==base.language))throw Error('Keep the source and language of this bundled translation. Create a new translation for another page.');
  const other=(await translations(env)).find((r:any)=>r.id!==key&&r.language===d.language&&r.source===d.source);
  if(other)throw Error('A translation for this page and language already exists.');
  const previous=existing?JSON.parse(existing.value):base;
  if(previous&&d.revision!==previous.revision)return response({error:'Translation changed. Reload before saving.'},409);
  const record={id:key,source:d.source,language:d.language,title:str(d.title,160),description:str(d.description,320),body:str(d.body,100000),status:d.status,reviewed:!!d.reviewed,updatedAt:Date.now(),revision:(previous?.revision||0)+1};
  let changed;
  if(existing)changed=await q(env,'UPDATE label_settings SET value=? WHERE key=? AND value=? RETURNING key',JSON.stringify(record),'translation:'+key,existing.value).first();
  else changed=await q(env,'INSERT INTO label_settings (key,value) VALUES (?,?) ON CONFLICT(key) DO NOTHING RETURNING key','translation:'+key,JSON.stringify(record)).first();
  if(!changed)return response({error:'Translation changed. Reload before saving.'},409);
  await audit(env,a.id,'translation.saved:'+record.status,key).run();return response({ok:true,id:key});
 }catch(e){return response({error:e instanceof Error?e.message:'Translation could not be saved.'},400);}
}
export async function translatedPage(request:Request,env:any){
 const u=new URL(request.url),path=u.pathname;
 if(!/^\/(es|fil|ceb)(\/|$)/.test(path))return null;
 const normalized=path.replace(/\/index\.html$/,'/').replace(/\/$/,'')+'/';
 const all=await translations(env),r=all.find((x:any)=>translationPath(x)===normalized);
 if(!r)return null;
 if(r.status!=='published')return new Response('Page not found',{status:404,headers:{'x-robots-tag':'noindex','cache-control':'no-store'}});
 if(normalized!==path)return new Response(null,{status:301,headers:{location:normalized+u.search}});
 const origin='https://mrblindbandit.net',canonical=origin+path;
 const sourceLabel={es:'Leer la página original en inglés',fil:'Basahin ang orihinal na pahina sa Ingles',ceb:'Basaha ang orihinal nga panid sa Iningles'}[r.language]||'English';
 let html=sitePages['/'+r.language+'/']||sitePages['/es/']||sitePages['/'];
 html=html.replace(/<html lang="[^"]*"/,'<html lang="'+r.language+'"').replace(/<main\b[^>]*id="main"[^>]*>[\s\S]*?<\/main>/,'<main id="main" tabindex="-1"><article class="shell policy-body"><h1>'+esc(r.title)+'</h1><p>'+esc(r.description)+'</p>'+articleBody(r.body)+'<p><a href="'+esc(r.source)+'" hreflang="en" lang="'+r.language+'">'+esc(sourceLabel)+'</a></p></article></main>').replace(/<title>[\s\S]*?<\/title>/,'<title>'+esc(r.title)+'</title>');
 html=html.replace(/<link rel="(?:canonical|alternate)"[^>]*>|<meta (?:name="(?:description|twitter:title|twitter:description)"|property="og:[^"]*")[^>]*>|<script type="application\/ld\+json">[\s\S]*?<\/script>/g,'');
 const variants=all.filter((x:any)=>x.source===r.source&&x.status==='published');
 const alternate='<link rel="alternate" hreflang="en" href="'+origin+esc(r.source)+'"><link rel="alternate" hreflang="x-default" href="'+origin+esc(r.source)+'">'+variants.map((x:any)=>'<link rel="alternate" hreflang="'+x.language+'" href="'+origin+translationPath(x)+'">').join('');
 const schema={'@context':'https://schema.org','@type':'WebPage',name:r.title,description:r.description,url:canonical,inLanguage:r.language};
 html=html.replace('</head>','<meta name="description" content="'+esc(r.description)+'"><meta property="og:title" content="'+esc(r.title)+'"><meta property="og:description" content="'+esc(r.description)+'"><meta property="og:url" content="'+canonical+'"><meta name="twitter:title" content="'+esc(r.title)+'"><meta name="twitter:description" content="'+esc(r.description)+'"><link rel="canonical" href="'+canonical+'">'+alternate+'<script type="application/ld+json">'+JSON.stringify(schema).replaceAll('<','\\u003c')+'</script></head>');
 html=html.replace(/(<a\b[^>]*href=")[^"]*("[^>]*data-language=")(en|es|fil|ceb)("[^>]*>)/g,(m,p1,p2,l,p3)=>p1+(l==='en'?r.source:variants.find((x:any)=>x.language===l)?'/'+l+r.source:'/'+l+'/')+p2+l+p3);
 return new Response(request.method==='HEAD'?null:html,{headers:{'content-type':'text/html; charset=utf-8','content-language':r.language,'x-content-type-options':'nosniff','cache-control':'public, max-age=0, must-revalidate'}});
}
