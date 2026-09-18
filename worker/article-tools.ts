import {safeURL,str} from './editorial-common';
export const officialOrigin='https://mrblindbandit.net';
export function articleMetadata(d:any){
 const image=(v:any)=>{if(!v)return '';const url=safeURL(v);if(new URL(url).origin!==officialOrigin)throw Error('Use an image hosted on mrblindbandit.net.');return url;};
 const m={title:str(d.title||'',160,false),description:str(d.description||'',320,false),canonical:d.canonical?safeURL(d.canonical):'',noindex:!!d.noindex,featured:!!d.featured,authorBio:str(d.authorBio||'',1000,false),privateNotes:str(d.privateNotes||'',3000,false),image:image(d.image),imageAlt:str(d.imageAlt||'',300,false),imageCaption:str(d.imageCaption||'',500,false),socialImage:image(d.socialImage),related:Array.isArray(d.related)?d.related:[]};
 if(m.canonical&&!m.canonical.startsWith(officialOrigin+'/'))throw Error('Canonical URLs must be on the official public domain.');
 if(m.image&&!m.imageAlt)throw Error('Add descriptive alternative text for the featured image.');
 if(m.related.length>6||m.related.some((p:any)=>typeof p!=='string'||!/^\/[a-z0-9\/-]*\/$/.test(p)||p.startsWith('//')))throw Error('Choose up to six public paths, such as /music/.');m.related=[...new Set(m.related)];return m;
}
export function articleChecks(d:any){
 const problems:string[]=[],warnings:string[]=[];let m:any={};try{m=articleMetadata(d.metadata||{});}catch(e){problems.push((e as Error).message);}
 for(const [key,label] of [['title','Title'],['body','Body'],['excerpt','Excerpt'],['author','Author'],['category','Category']])if(typeof d[key]!=='string'||!d[key].trim())problems.push(label+' is required.');
 if(typeof d.slug!=='string'||!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(d.slug))problems.push('Use a lowercase, hyphen-separated URL slug.');
 if(d.status==='scheduled'&&(!d.publishAt||Date.parse(d.publishAt)<=Date.now()||!Number.isFinite(Date.parse(d.publishAt))))problems.push('Scheduled articles need a future publication time.');
 const words=String(d.body||'').trim().split(/\s+/).filter(Boolean).length;
 if((m.title||d.title||'').length>70)warnings.push('The search title may be truncated in search results.');
 if((m.description||d.excerpt||'').length>180)warnings.push('The search description may be truncated in search results.');
 if(!m.image)warnings.push('No featured image selected. A text-only article can still be published.');
 if(!m.related?.length)warnings.push('Add relevant related pages to help readers continue exploring.');
 if(m.noindex)warnings.push('This article is excluded from search indexes and the sitemap.');
 if(m.canonical&&m.canonical!==officialOrigin+'/journal/articles/'+d.slug+'/')warnings.push('The canonical points elsewhere; this article URL will be excluded from the sitemap.');
 return {problems,warnings,words,readingMinutes:Math.max(1,Math.ceil(words/200)),canPublish:!problems.length};
}

// Small text format: raw HTML is always escaped, links use explicit safe schemes.
export function articleBody(text:string){
 const escape=(v:string)=>v.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
 const inline=(v:string)=>{let out='',last=0;for(const m of v.matchAll(/\[([^\]\n]+)\]\(([^\s)]+)\)/g)){out+=escape(v.slice(last,m.index));const url=m[2];const safe=/^https:\/\//.test(url)||(/^\/(?!\/)/.test(url)&&!url.includes('\\'));out+=safe?'<a href="'+escape(url)+'"'+(url.startsWith('https:')?' rel="noopener noreferrer"':'')+'>'+escape(m[1])+'</a>':escape(m[0]);last=m.index!+m[0].length;}return out+escape(v.slice(last));};
 return String(text||'').split(/\n\s*\n/).map(p=>{
 if(p.trim()==='---')return '<hr>';
 if(p.startsWith('## '))return '<h2>'+inline(p.slice(3))+'</h2>';
 if(p.split('\n').every(l=>l.startsWith('> ')))return '<blockquote><p>'+inline(p.replace(/^> /gm,'')).replaceAll('\n','<br>')+'</p></blockquote>';
 if(p.split('\n').every(l=>/^(- |\d+\. )/.test(l))){const tag=p.startsWith('- ')?'ul':'ol';return '<'+tag+'>'+p.split('\n').map(l=>'<li>'+inline(l.replace(/^(- |\d+\. )/,''))+'</li>').join('')+'</'+tag+'>';}
 return '<p>'+inline(p).replaceAll('\n','<br>')+'</p>';
 }).join('');
}
