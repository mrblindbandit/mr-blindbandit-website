import {modules} from './workspace';

const PRIORITY=[
  'roster-intake','artist-onboarding','release-plans','campaign-plans','press-outreach',
  'approval-queue','legal-holds','budgets','asset-register','knowledge-base',
  'decision-log','risk-register','label-calendar'
];

const out=(value:unknown,status=200)=>new Response(JSON.stringify(value),{status,headers:{'content-type':'application/json','cache-control':'private, no-store','x-robots-tag':'noindex, nofollow'}});

/** Synthesized label OS digest — no new tables; reads existing workspace, tasks, contracts, audit. */
export async function portalDashboard(request:Request,env:any,actor:any){
  if(request.method!=='GET')return out({error:'Method not allowed.'},405);
  const q=(sql:string,...args:any[])=>env.DB.prepare(sql).bind(...args);
  const today=new Date().toISOString().slice(0,10);
  const accessible=modules.filter(m=>m.roles.includes(actor.role));
  const prioritySlugs=PRIORITY.filter(s=>accessible.some(m=>m.slug===s));
  const priority=[];
  for(const slug of prioritySlugs){
    const m=accessible.find(x=>x.slug===slug)!;
    const rows=await q('SELECT status,due_date FROM label_workspace_records WHERE module=? AND archived=0 LIMIT 500',slug).all();
    const list=rows.results||[];
    const overdue=list.filter((r:any)=>r.due_date&&r.due_date<today&&!/complete|closed|ready|released|approved|published/i.test(r.status)).length;
    const inReview=list.filter((r:any)=>/review|pending|proposed|active setup|documents/i.test(r.status)).length;
    priority.push({slug,title:m.title,group:m.group,total:list.length,overdue,inReview});
  }
  const taskFilter=actor.role==='client'?' WHERE client_id=?':'';
  const taskArgs=actor.role==='client'?[actor.id]:[];
  const openTasks=await q("SELECT COUNT(*) AS n FROM label_tasks"+taskFilter+(taskFilter?' AND':' WHERE')+" status!='complete'",...taskArgs).first();
  const sharedContracts=actor.role==='client'||['owner','admin','manager'].includes(actor.role)
    ?await q("SELECT COUNT(*) AS n FROM label_contracts"+(actor.role==='client'?' WHERE client_id=? AND status=?':' WHERE status=?'),...(actor.role==='client'?[actor.id,'shared']:['shared'])).first()
    :{n:0};
  const dueSoon=await q("SELECT id,module,title,status,owner,due_date FROM label_workspace_records WHERE archived=0 AND due_date!='' AND due_date<=? ORDER BY due_date ASC LIMIT 12",new Date(Date.now()+14*86400000).toISOString().slice(0,10)).all();
  const dueAccessible=(dueSoon.results||[]).filter((r:any)=>accessible.some(m=>m.slug===r.module)).slice(0,8);
  let activity:any[]=[];
  if(['owner','admin'].includes(actor.role)){
    const rows=await q('SELECT a.action,a.created_at,a.target_id,u.name AS actor_name FROM label_audit a LEFT JOIN label_user u ON u.id=a.actor_id ORDER BY a.created_at DESC LIMIT 12').all();
    activity=rows.results||[];
  }
  const notifications:any[]=[];
  if((openTasks?.n||0)>0)notifications.push({id:'tasks-open',kind:'tasks',title:`${openTasks.n} open project task${openTasks.n===1?'':'s'}`,path:'/portal/tasks/',priority:'normal'});
  if((sharedContracts?.n||0)>0)notifications.push({id:'contracts-shared',kind:'contracts',title:`${sharedContracts.n} contract${sharedContracts.n===1?'':'s'} awaiting review`,path:'/portal/contracts/',priority:'high'});
  for(const r of dueAccessible){
    const overdue=r.due_date<today;
    notifications.push({id:'due-'+r.id,kind:'deadline',title:`${overdue?'Overdue':'Due soon'}: ${r.title}`,path:`/portal/${r.module}/?record=${r.id}`,priority:overdue?'high':'normal',dueDate:r.due_date,module:r.module});
  }
  for(const p of priority.filter(x=>x.overdue>0).slice(0,4)){
    notifications.push({id:'mod-overdue-'+p.slug,kind:'workspace',title:`${p.overdue} overdue in ${p.title}`,path:`/portal/${p.slug}/`,priority:'high'});
  }
  if(['owner','admin'].includes(actor.role)){
    notifications.push({id:'social-admin',kind:'social',title:'Open Blindbandit Mobile Social Admin for moderation',path:'/mobile/admin/',priority:'normal'});
    notifications.push({id:'community-bridge',kind:'social',title:'Manage community account invitations',path:'/portal/community-accounts/',priority:'normal'});
  }
  return out({
    generatedAt:Date.now(),
    priority,
    dueSoon:dueAccessible,
    activity,
    notifications:notifications.slice(0,24),
    bridges:{
      mobile:'/mobile/',
      socialAdmin:'/mobile/admin/',
      communityAccounts:'/portal/community-accounts/',
      advertising:'/portal/advertising/',
      activity:'/portal/activity/'
    }
  });
}
