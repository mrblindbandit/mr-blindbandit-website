import {validateWorkspace} from './workspace-validation';
import baseModules from '../data/workspace.json';
import extraModules from '../data/workspace-extra.json';
import dailyModules from '../data/workspace-daily.json';
export const modules=[...baseModules,...extraModules,...dailyModules];
const validDate=(v:string)=>/^\d{4}-\d{2}-\d{2}$/.test(v)&&Number.isFinite(Date.parse(v+'T00:00:00Z'))&&new Date(v+'T00:00:00Z').toISOString().slice(0,10)===v;
const out=(value:any,status=200)=>new Response(JSON.stringify(value),{status,headers:{'content-type':'application/json','cache-control':'private, no-store','x-robots-tag':'noindex, nofollow'}});
export async function workspace(request:Request,env:any,actor:any,input:any){
 const url=new URL(request.url),match=url.pathname.match(/^\/api\/portal\/workspace\/([a-z-]+)(?:\/([a-f0-9-]+))?$/);
 if(!match)return out({error:'Page not found.'},404);
 const module=modules.find(m=>m.slug===match[1]);if(!module)return out({error:'Page not found.'},404);
 if(!module.roles.includes(actor.role))return out({error:'Your role does not have access to this workspace.'},403);
 const id=match[2],q=(sql:string,...args:any[])=>env.DB.prepare(sql).bind(...args);
 if(request.method==='GET'){
  const rows=await q('SELECT * FROM label_workspace_records WHERE module=? AND archived=? ORDER BY updated_at DESC LIMIT 501',module.slug,url.searchParams.get('archived')==='1'?1:0).all();
  return out({records:rows.results.slice(0,500).map((r:any)=>({...r,details:JSON.parse(r.details),checklist:JSON.parse(r.checklist)})),hasMore:rows.results.length>500});
 }
 if(request.method==='POST'&&id||!['POST','PATCH'].includes(request.method)||request.method==='PATCH'&&!id)return out({error:'Method not allowed.'},405);
 let existing:any=null;if(id){existing=await q('SELECT * FROM label_workspace_records WHERE id=? AND module=?',id,module.slug).first();if(!existing)return out({error:'Record not found.'},404);if(input.revision!==existing.revision)return out({error:'Someone updated this record. Refresh before saving your changes.'},409);}
 const txt=(v:any,max=200)=>typeof v==='string'&&v.trim().length<=max?v.trim():null;
 const title=txt(input.title),owner=txt(input.owner||'',120),due=txt(input.dueDate||'',10);
 if(!title||owner===null||due===null||due&&!validDate(due)||!module.statuses.includes(input.status))return out({error:'Check the title, status, owner and due date.'},400);
 const details:any={};for(const f of module.fields){const value=txt(input.details?.[f.key]||'',f.type==='textarea'?6000:500);if(value===null)return out({error:'A field exceeds its length limit.'},400);if(value&&f.type==='url'){try{if(!['https:','http:'].includes(new URL(value).protocol))throw Error();}catch{return out({error:'Use a complete https:// or http:// reference link.'},400);}}if(value&&f.type==='money'&&!/^\d{1,10}(\.\d{1,2})?$/.test(value))return out({error:'Enter a nonnegative amount with at most two decimal places.'},400);if(value&&f.type==='date'&&!validDate(value))return out({error:'Use a valid date.'},400);details[f.key]=value;}
 if(!Array.isArray(input.checklist)||input.checklist.length!==module.checklist.length||input.checklist.some((v:any)=>typeof v!=='boolean'))return out({error:'Invalid checklist.'},400);
 const validation=validateWorkspace(module.slug,details,input.status,input.checklist);if(validation)return out({error:validation},400);
 const recordId=id||crypto.randomUUID(),now=Date.now(),archived=input.archived===true?1:0;
 const statement=id?q('UPDATE label_workspace_records SET title=?,status=?,owner=?,due_date=?,details=?,checklist=?,archived=?,revision=revision+1,updated_by=?,updated_at=? WHERE id=? AND revision=? RETURNING id',title,input.status,owner,due,JSON.stringify(details),JSON.stringify(input.checklist),archived,actor.id,now,id,input.revision):q('INSERT INTO label_workspace_records (id,module,title,status,owner,due_date,details,checklist,archived,revision,created_by,updated_by,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,1,?,?,?,?) RETURNING id',recordId,module.slug,title,input.status,owner,due,JSON.stringify(details),JSON.stringify(input.checklist),archived,actor.id,actor.id,now,now);
 const result=await statement.first();if(!result)return out({error:'This record changed. Refresh and try again.'},409);
 await q('INSERT INTO label_audit (id,actor_id,action,target_id,created_at) VALUES (?,?,?,?,?)',crypto.randomUUID(),actor.id,'workspace.'+module.slug+'.'+(archived?'archived':id?'updated':'created'),recordId,now).run();
 return out({id:recordId,revision:(existing?.revision||0)+1},id?200:201);
}
