import {q,id,response,audit,hash} from './editorial-common';
import {verified} from './security';
import baseModules from '../data/workspace.json';
import extraModules from '../data/workspace-extra.json';
import dailyModules from '../data/workspace-daily.json';
const modules=[...baseModules,...extraModules,...dailyModules];
export async function locked(env:any){return (await q(env,"SELECT value FROM label_settings WHERE key='portal_lockdown'").first())?.value==='1';}
const columns=['id','slug','title','body','excerpt','author','category','tags','status','publish_at','metadata','revision','created_at','updated_at'];
async function snapshot(env:any,a:any){
 const records=await q(env,'SELECT * FROM site_articles ORDER BY id LIMIT 51').all();if(records.results.length>50)throw Error('This snapshot tool supports up to 50 articles. Use a database export for a larger catalog.');
 const existing=await q(env,"SELECT key FROM label_settings WHERE key LIKE 'content_backup:%' LIMIT 21").all();if(existing.results.length>=20)throw Error('Twenty snapshots are retained. Delete an unneeded snapshot before creating another.');
 const key=id(),createdAt=Date.now(),body=JSON.stringify({version:1,createdAt,articles:records.results});if(new TextEncoder().encode(body).length>4000000)throw Error('Snapshot exceeds the 4 MB limit.');
 await env.BUCKET.put('private/content-backups/'+key,body,{httpMetadata:{contentType:'application/json'}});
 const meta={id:key,createdAt,count:records.results.length,digest:await hash(body)};
 await env.DB.batch([q(env,'INSERT INTO label_settings (key,value) VALUES (?,?)','content_backup:'+key,JSON.stringify(meta)),audit(env,a.id,'content.backup_created',key)]);return meta;
}
async function readSnapshot(env:any,key:string){const row=await q(env,'SELECT value FROM label_settings WHERE key=?','content_backup:'+key).first();if(!row)throw Error('Snapshot not found.');const blob=await env.BUCKET.get('private/content-backups/'+key);if(!blob)throw Error('Snapshot file is unavailable.');const body=await new Response(blob.body).text(),meta=JSON.parse(row.value);if(body.length>4000000||await hash(body)!==meta.digest)throw Error('Snapshot integrity check failed.');const data=JSON.parse(body);if(data.version!==1||!Array.isArray(data.articles)||data.articles.length>50)throw Error('Unsupported snapshot.');return {meta,data,body};}
export async function operations(request:Request,env:any,a:any,input:any){
 const u=new URL(request.url),kind=u.pathname.slice('/api/portal/operations/'.length),write=request.method!=='GET',manage=['owner','admin'].includes(a.role);
 if(!['GET','POST','PATCH','DELETE'].includes(request.method))return response({error:'Method not allowed.'},405);
 if(kind==='announcements'&&!write){const rows=await q(env,"SELECT value FROM label_settings WHERE key LIKE 'announcement:%' ORDER BY key LIMIT 201").all();let records=rows.results.map((r:any)=>JSON.parse(r.value));if(!manage)records=records.filter((r:any)=>r.status==='published'&&(r.audience==='all'||r.audience===(a.role==='client'?'clients':'staff')));return response({records:records.sort((x:any,y:any)=>y.updatedAt-x.updatedAt).slice(0,200)});}
 if(!manage)return response({error:'Administrator access required.'},403);
 try{
 if(kind==='announcements'&&['POST','PATCH'].includes(request.method)){
  if(typeof input.title!=='string'||!input.title.trim()||input.title.length>160||typeof input.body!=='string'||!input.body.trim()||input.body.length>6000||!['all','staff','clients'].includes(input.audience)||!['draft','published','archived'].includes(input.status))return response({error:'Complete the title, message, audience and publication status.'},400);
  const key=input.id||id();if(!/^[a-f0-9-]{36}$/.test(key))return response({error:'Invalid announcement.'},400);const old=await q(env,'SELECT value FROM label_settings WHERE key=?','announcement:'+key).first();if(input.id&&!old||old&&JSON.parse(old.value).revision!==input.revision)return response({error:'This announcement changed. Reload before saving.'},409);
  if(!old&&(await q(env,"SELECT COUNT(*) AS n FROM label_settings WHERE key LIKE 'announcement:%'").first()).n>=200)return response({error:'The announcement limit is 200 records.'},400);
  const record={id:key,title:input.title.trim(),body:input.body.trim(),audience:input.audience,status:input.status,revision:(old?JSON.parse(old.value).revision:0)+1,updatedAt:Date.now(),author:a.name};
  const saved=old?await q(env,'UPDATE label_settings SET value=? WHERE key=? AND value=? RETURNING key',JSON.stringify(record),'announcement:'+key,old.value).first():await q(env,'INSERT INTO label_settings (key,value) VALUES (?,?) RETURNING key','announcement:'+key,JSON.stringify(record)).first();if(!saved)return response({error:'Announcement changed; reload before saving.'},409);await audit(env,a.id,'announcement.'+record.status,key).run();return response({record},old?200:201);
 }
 if(kind==='community'){
  if(!write){const rows=await q(env,"SELECT id,title,board,body,created_at,hidden FROM community_posts WHERE author_id=? ORDER BY created_at DESC LIMIT 100",'portal:'+a.id).all();return response({posts:rows.results});}
  if(request.method==='POST'){
   if(typeof input.title!=='string'||!input.title.trim()||input.title.length>120||typeof input.body!=='string'||!input.body.trim()||input.body.length>3000||!['general','music','creators','announcements'].includes(input.board))return response({error:'Enter a title, message and valid board.'},400);
   const post=id();await env.DB.batch([q(env,'INSERT INTO community_posts (id,author_id,display_name,board,title,body,created_at,hidden) VALUES (?,?,?,?,?,?,?,0)',post,'portal:'+a.id,'Blindbandit Records',input.board,input.title.trim(),input.body.trim(),Date.now()),audit(env,a.id,'community.post_published',post)]);return response({id:post},201);
  }
  if(request.method==='DELETE'){const r=await q(env,'UPDATE community_posts SET hidden=1 WHERE id=? AND author_id=? RETURNING id',input.id,'portal:'+a.id).first();if(!r)return response({error:'Post not found.'},404);await audit(env,a.id,'community.post_removed',input.id).run();return response({ok:true});}
 }
 if(kind==='readiness'&&!write){const rows=await q(env,"SELECT module,status,COUNT(*) AS count FROM label_workspace_records WHERE archived=0 GROUP BY module,status").all();const overdue=await q(env,"SELECT module,COUNT(*) AS count FROM label_workspace_records WHERE archived=0 AND due_date<>'' AND due_date<? AND status NOT IN ('Complete','Closed','Resolved','Approved','Ready','Eligible','Accepted','Expired') GROUP BY module",new Date().toISOString().slice(0,10)).all();return response({modules:modules.filter(m=>m.group==='Rights & delivery').map(m=>({slug:m.slug,title:m.title,statuses:rows.results.filter((r:any)=>r.module===m.slug),overdue:overdue.results.find((r:any)=>r.module===m.slug)?.count||0}))});}
 if(!['lockdown','backups'].includes(kind))return response({error:'Endpoint unavailable.'},404);
 if(a.role!=='owner')return response({error:'Owner access required.'},403);
 if(write&&!await verified(request,env,a,true))return response({error:'Verify your identity to continue.',verificationRequired:true},403);
 if(kind==='lockdown'){
  if(!write)return response({locked:await locked(env)});
  if(request.method!=='POST'||typeof input.enabled!=='boolean'||input.confirmation!==(input.enabled?'LOCK PORTAL':'UNLOCK PORTAL'))return response({error:'Type the exact confirmation phrase.'},400);
  const statements=[q(env,"INSERT INTO label_settings (key,value) VALUES ('portal_lockdown',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value",input.enabled?'1':'0'),audit(env,a.id,input.enabled?'security.lockdown_enabled':'security.lockdown_disabled',a.id)];
  if(input.enabled)statements.push(q(env,"DELETE FROM label_session WHERE user_id IN (SELECT id FROM label_members WHERE role<>'owner')"),q(env,"DELETE FROM security_proofs WHERE user_id IN (SELECT id FROM label_members WHERE role<>'owner')"));await env.DB.batch(statements);return response({locked:input.enabled});
 }
 if(kind==='backups'){
  const key=u.searchParams.get('id');if(!write&&key){const saved=await readSnapshot(env,key);return new Response(saved.body,{headers:{'content-type':'application/json','content-disposition':'attachment; filename="blindbandit-articles-'+saved.meta.id+'.json"','cache-control':'private, no-store','x-robots-tag':'noindex, nofollow'}});}
  if(!write){const rows=await q(env,"SELECT value FROM label_settings WHERE key LIKE 'content_backup:%'").all();return response({records:rows.results.map((r:any)=>JSON.parse(r.value)).sort((x:any,y:any)=>y.createdAt-x.createdAt)});}
  if(request.method==='DELETE'){if(input.confirmation!=='DELETE SNAPSHOT')return response({error:'Type DELETE SNAPSHOT.'},400);await readSnapshot(env,input.id);await env.BUCKET.delete('private/content-backups/'+input.id);await env.DB.batch([q(env,'DELETE FROM label_settings WHERE key=?','content_backup:'+input.id),audit(env,a.id,'content.backup_deleted',input.id)]);return response({ok:true});}
  if(request.method==='POST'&&input.action==='create')return response({record:await snapshot(env,a)},201);
  if(request.method==='POST'&&input.action==='restore'){
   if(input.confirmation!=='RESTORE AS DRAFT')return response({error:'Type RESTORE AS DRAFT.'},400);
   const saved=await readSnapshot(env,input.id),article=saved.data.articles.find((r:any)=>r.id===input.articleId);if(!article)return response({error:'Article not found in this snapshot.'},404);
   // Keep the live article intact: recover a separate draft with its own slug and ID.
   const newId=id(),now=Date.now(),copy={...article,id:newId,slug:article.slug.slice(0,100)+'-restored-'+newId.slice(0,8),status:'draft',publish_at:null,revision:1,created_at:now,updated_at:now};
   await env.DB.batch([q(env,'INSERT INTO site_articles ('+columns.join(',')+') VALUES ('+columns.map(()=>'?').join(',')+')',...columns.map(c=>copy[c]??null)),audit(env,a.id,'content.article_restored_as_draft',newId)]);return response({id:newId,message:'Restored as a separate draft. Review it in Publishing studio before publishing.'},201);
  }
 }
 return response({error:'Method not allowed.'},405);
 }catch(e){console.error('Portal operation failed',e);return response({error:e instanceof Error?e.message:'Operation unavailable.'},400);}
}
