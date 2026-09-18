import {q,response} from './editorial-common';
import baseModules from '../data/workspace.json';
import extraModules from '../data/workspace-extra.json';
import dailyModules from '../data/workspace-daily.json';
const modules=[...baseModules,...extraModules,...dailyModules];
export function destinations(a:any){return [{path:'/portal/',title:'Overview'},{path:'/portal/earnings/',title:'Earnings'},{path:'/portal/messages/',title:'Messages'},{path:'/portal/tasks/',title:'Tasks'},{path:'/portal/notifications/',title:'Notifications center'},{path:'/portal/security/',title:'Account & security'},{path:'/portal/announcements/',title:'Label announcements'},{path:'/portal/personal-notes/',title:'My private notes'},{path:'/portal/guide/',title:'Portal guide'},...(['owner','admin'].includes(a.role)?[{path:'/portal/reply-templates/',title:'Saved reply templates'},{path:'/portal/account-sessions/',title:'Account sessions'},{path:'/portal/community-accounts/',title:'Community accounts'},{path:'/portal/inbox/',title:'Submission inbox'},{path:'/portal/publishing/',title:'Publishing studio'},{path:'/portal/community-publishing/',title:'Community publishing'},{path:'/portal/team/',title:'Team & access'},{path:'/portal/seo/',title:'SEO command center'}]:[]),...modules.filter(m=>m.roles.includes(a.role)).map(m=>({path:'/portal/'+m.slug+'/',title:m.title}))];}
export async function portalTools(request:Request,env:any,a:any,d:any){const u=new URL(request.url),kind=u.pathname.split('/').pop(),allowed=destinations(a);
 if(kind==='shortcuts'){
 const key='shortcuts:'+a.id,row=await q(env,'SELECT value FROM label_settings WHERE key=?',key).first(),saved=row?JSON.parse(row.value):{paths:[],revision:0};
 if(request.method==='GET')return response({available:allowed,paths:saved.paths.filter((p:string)=>allowed.some(x=>x.path===p)),revision:saved.revision});
 if(request.method!=='POST')return response({error:'Method not allowed.'},405);
 if(!Array.isArray(d.paths)||d.paths.length>20||d.paths.some((p:any)=>!allowed.some(x=>x.path===p)))return response({error:'Choose up to 20 pages available to your role.'},400);
 if(d.revision!==saved.revision)return response({error:'Shortcuts changed on another device. Reload before saving.'},409);
 const value=JSON.stringify({paths:[...new Set(d.paths)],revision:saved.revision+1});const result=row?await q(env,'UPDATE label_settings SET value=? WHERE key=? AND value=? RETURNING key',value,key,row.value).first():await q(env,'INSERT INTO label_settings(key,value) VALUES(?,?) ON CONFLICT(key) DO NOTHING RETURNING key',key,value).first();return result?response({ok:true}):response({error:'Shortcuts changed. Reload and try again.'},409);
 }
 if(kind==='search'&&request.method==='GET'){
 const term=(u.searchParams.get('q')||'').trim().slice(0,150);if(term.length<2)return response({results:[],message:'Enter at least two characters.'});const results:any[]=allowed.filter(p=>p.title.toLowerCase().includes(term.toLowerCase())).map(p=>({...p,kind:'Page'}));
 const slugs=modules.filter(m=>m.roles.includes(a.role)).map(m=>m.slug);
 if(slugs.length){const rows=await q(env,'SELECT id,module,title,status FROM label_workspace_records WHERE archived=0 AND module IN ('+slugs.map(()=>'?').join(',')+") AND instr(lower(title||' '||owner||' '||details),lower(?))>0 ORDER BY updated_at DESC LIMIT 40",...slugs,term).all();for(const r of rows.results)results.push({title:r.title,path:'/portal/'+r.module+'/?record='+r.id,kind:'Workspace record',status:r.status});}
 const tasks=await q(env,"SELECT id,title,status FROM label_tasks WHERE (?<> 'client' OR client_id=?) AND instr(lower(title||' '||details),lower(?))>0 ORDER BY created_at DESC LIMIT 20",a.role,a.id,term).all();for(const r of tasks.results)results.push({title:r.title,path:'/portal/tasks/',kind:'Task',status:r.status});
 if(['owner','admin'].includes(a.role)){const rows=await q(env,"SELECT id,title,status FROM site_articles WHERE instr(lower(title||' '||excerpt),lower(?))>0 ORDER BY updated_at DESC LIMIT 20",term).all();for(const r of rows.results)results.push({title:r.title,path:'/portal/publishing/?article='+r.id,kind:'Article',status:r.status});}
 return response({results,message:'Up to 40 workspace records, 20 tasks and 20 articles, plus matching pages. Archived workspace records are excluded.'});
 }return response({error:'Endpoint unavailable.'},404);
}
