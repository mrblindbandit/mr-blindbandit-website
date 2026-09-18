import {advertising} from './advertising';
import {stripeOverview} from './payments';
import {personalTools} from './personal-tools';
import {accountAdmin} from './account-admin';
import {portalTools} from './portal-tools';
import {operations,locked} from './operations';
import {translationAPI} from './translations';
import {feeds} from './feeds';
import {security,verified} from './security';
import {editorialAPI,articleHTML} from './editorial';
import {inbox} from './editorial-inbox';
import {portalAuth,portalProviders,sendPortalMail,type PortalEnv} from './portal-auth';
import {privatePages} from './private-pages';
import {workspace,modules} from './workspace';
import {portalDashboard} from './portal-dashboard';
import {clerkIdentity} from './clerk-auth';
const OWNER_EMAIL='business@mrblindbandit.net';
const roles=['owner','admin','manager','accountant','client'];
class PortalError extends Error{constructor(message:string,public status=400){super(message);}}
const json=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json','cache-control':'private, no-store','x-content-type-options':'nosniff','referrer-policy':'no-referrer'}});
const text=(x:unknown,max=200,required=true)=>{if(typeof x!=='string'||x.trim().length>max||(required&&!x.trim()))throw new PortalError('Complete the required fields within the length limits.');return x.trim();};
const mail=(x:unknown)=>{const value=text(x,254).toLowerCase();if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))throw new PortalError('Enter a valid email address.');return value;};
const uid=()=>crypto.randomUUID();
const digest=async(s:string)=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s))),b=>b.toString(16).padStart(2,'0')).join('');
async function limit(env:PortalEnv,key:string,max=30,period=60000){const window=Math.floor(Date.now()/period);const result=await env.DB.prepare('INSERT INTO community_limits (key,window,hits) VALUES (?,?,1) ON CONFLICT(key) DO UPDATE SET window=excluded.window,hits=CASE WHEN community_limits.window=excluded.window THEN community_limits.hits+1 ELSE 1 END WHERE community_limits.window<>excluded.window OR community_limits.hits<? RETURNING hits').bind('portal:'+key,window,max).first();if(!result)throw new PortalError('Too many attempts. Please try again later.',429);}
async function body(request:Request,max=20000){const reader=request.body?.getReader();if(!reader)throw new PortalError('Empty request.');const chunks:Uint8Array[]=[];let size=0;while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>max){await reader.cancel();throw new PortalError('Request is too large.',413);}chunks.push(value);}return new Blob(chunks as BlobPart[]);}
async function data(request:Request){if(!request.headers.get('content-type')?.includes('application/json'))throw new PortalError('Use JSON.',415);try{return JSON.parse(await(await body(request)).text());}catch(e){if(e instanceof PortalError)throw e;throw new PortalError('Invalid JSON.');}}
const query=(env:PortalEnv,sql:string,...values:any[])=>env.DB.prepare(sql).bind(...values);
const audit=(env:PortalEnv,actor:string,action:string,target:string)=>query(env,'INSERT INTO label_audit (id,actor_id,action,target_id,created_at) VALUES (?,?,?,?,?)',uid(),actor,action,target,Date.now());
const canManage=(a:any)=>['owner','admin'].includes(a.role);
const canFinance=(a:any)=>['owner','admin','accountant'].includes(a.role);
const canProjects=(a:any)=>['owner','admin','manager'].includes(a.role);
function requirePermission(ok:boolean){if(!ok)throw new PortalError('You do not have access to this action.',403);}
async function member(env:PortalEnv,id:string){return query(env,'SELECT m.*,u.name,u.email,u.email_verified FROM label_members m JOIN label_user u ON u.id=m.id WHERE m.id=?',id).first();}
const platformActors=new WeakMap<Request,any>();
export async function portalForPlatform(request:Request,env:PortalEnv,ctx:any,identity:any){platformActors.set(request,identity);try{return await portal(request,env,ctx);}finally{platformActors.delete(request);}}
async function actor(request:Request,env:PortalEnv){
 const platformIdentity=platformActors.get(request);if(platformIdentity)return platformIdentity;
 const clerk=await clerkIdentity(request,env).catch(()=>null);
 if(clerk){
  if(clerk.email===env.CLERK_ADMIN_EMAIL?.toLowerCase()){
   const now=Date.now();let admin=await query(env,'SELECT id FROM label_user WHERE lower(email)=?',clerk.email).first();
   if(!admin){const adminId=uid();await query(env,'INSERT INTO label_user (id,name,email,email_verified,created_at,updated_at) VALUES (?,?,?,?,?,?)',adminId,'K Heck Financial',clerk.email,1,now,now).run();admin={id:adminId};}
   await query(env,"INSERT INTO label_members (id,role,status,artist_name,notes,created_at) VALUES (?,'admin','active','','Production Clerk administrator',?) ON CONFLICT(id) DO UPDATE SET role='admin',status='active'",admin.id,now).run();
  }
  const lookupEmail=clerk.email===env.COMMUNITY_MODERATOR_EMAIL?.toLowerCase()?OWNER_EMAIL:clerk.email;
  const u=await query(env,'SELECT id FROM label_user WHERE lower(email)=?',lookupEmail).first();
  const m=u&&await member(env,u.id);
  if(!m||m.status!=='active')throw new PortalError('This Clerk email has not been invited to the label portal.',403);
  if(m.role!=='owner'&&await locked(env))throw new PortalError('The owner has temporarily locked the label portal. Please contact account support.',403);
  await query(env,"INSERT INTO label_account (id,account_id,provider_id,user_id,created_at,updated_at) VALUES (?,?,?,?,?,?) ON CONFLICT(provider_id,account_id) DO UPDATE SET user_id=excluded.user_id,updated_at=excluded.updated_at",uid(),clerk.clerkUserId,'clerk',m.id,Date.now(),Date.now()).run();
  return {...m,recovery:false,authProvider:'clerk',sessionKey:'clerk:'+clerk.clerkUserId};
 }
 const session=await portalAuth(env,new URL(request.url).origin).api.getSession({headers:request.headers});
 if(session?.user){const m=await member(env,session.user.id);if(m?.status==='active'&&m.role!=='owner'&&await locked(env))throw new PortalError('The owner has temporarily locked the label portal. Please contact account support.',403);if(m?.status==='active')return {...m,recovery:false,sessionKey:session.session.id};throw new PortalError('This label account is suspended or has not been invited.',403);}
 const owner=request.headers.get('oai-authenticated-user-id')&&request.headers.get('oai-authenticated-user-email')?.toLowerCase()===env.COMMUNITY_MODERATOR_EMAIL?.toLowerCase();
 if(owner){const u=await query(env,'SELECT id FROM label_user WHERE email=?',OWNER_EMAIL).first();const m=u&&await member(env,u.id);if(m?.role==='owner'&&m.status==='active')return {...m,recovery:true,sessionKey:'owner:'+request.headers.get('oai-authenticated-user-id')};}
 throw new PortalError('Sign in to your label account.',401);
}
export async function portalPage(request:Request,env:PortalEnv):Promise<Response|null>{
 let path:string;try{path=decodeURIComponent(new URL(request.url).pathname).replace(/\\/g,'/').replace(/\/+/g,'/');}catch{return new Response('Not found',{status:404});}
 path=path.replace(/\/index\.html$/,'/').replace(/\.html$/,'').replace(/\/$/,'');
 if(path==='/community/moderation'){const clerk=await clerkIdentity(request,env).catch(()=>null),owner=!!clerk&&[env.COMMUNITY_MODERATOR_EMAIL,env.CLERK_ADMIN_EMAIL].some(value=>value?.toLowerCase()===clerk.email);const headers={'cache-control':'private, no-store','x-robots-tag':'noindex, nofollow','content-type':'text/html; charset=utf-8','vary':'Cookie'};return owner?new Response(privatePages[path],{headers}):new Response('Not found',{status:404,headers});}
 const ownerPath=path==='/owner'||path.startsWith('/owner/');
 if(!ownerPath&&path!=='/portal'&&!path.startsWith('/portal/'))return null;
 if(['/portal/login','/portal/reset','/portal/privacy'].includes(path))return null;
 const headers={'cache-control':'private, no-store, max-age=0','x-robots-tag':'noindex, nofollow','referrer-policy':'no-referrer','vary':'Cookie'};
 let a:any;try{a=await actor(request,env);}catch(e){
  if(e instanceof PortalError&&e.status===401){if(ownerPath)return new Response('Not found',{status:404,headers});return new Response(null,{status:303,headers:{...headers,location:'/portal/login/'}});}
  return new Response('This page is unavailable for this account.',{status:403,headers});
 }
 if(ownerPath){if(!canManage(a))return new Response('Not found',{status:404,headers});return new Response(null,{status:303,headers:{...headers,location:'/portal/inbox/'}});}
 // Viewing the workspace only requires an authenticated, active account.
 // High-risk writes request verification inline at the action itself, so a
 // failed or expired OTP can never trap a signed-in user outside the portal.
 const page=path.slice('/portal'.length).replace(/^\//,'');const module=modules.find(m=>m.slug===page);if(module&&!module.roles.includes(a.role))return new Response('This workspace is unavailable for this role.',{status:403,headers});
 if(['advertising','reply-templates','team','inbox','activity','publishing','seo','departments','feeds','bookings','licensing','sponsorships','partnerships','translations','community-publishing','readiness','account-sessions','community-accounts'].includes(page)&&!canManage(a)||page==='clients'&&a.role==='client'||page==='contracts'&&a.role!=='client'&&!canProjects(a))return new Response('This page is unavailable for this account.',{status:403,headers});
 if(['compliance-handbook','payments','payment-activity'].includes(page)&&!['owner','admin'].includes(a.role))return new Response('Administrator access required.',{status:403,headers});
 if(['lockdown','content-backups'].includes(page)&&a.role!=='owner')return new Response('Owner access required.',{status:403,headers});
 return privatePages[path]?new Response(privatePages[path],{headers:{...headers,'content-type':'text/html; charset=utf-8'}}):new Response('Not found',{status:404,headers});
}
async function client(env:PortalEnv,id:string){const c=await member(env,id);if(!c||c.role!=='client')throw new PortalError('Client not found.',404);return c;}
async function selectedClient(request:Request,env:PortalEnv,a:any,input?:any){if(a.role==='client'){if(input?.clientId&&input.clientId!==a.id)throw new PortalError('Client not found.',404);return a.id;}const id=text(input?.clientId||new URL(request.url).searchParams.get('clientId')||'',100);await client(env,id);return id;}
async function createMember(env:PortalEnv,origin:string,name:string,email:string,role:string,artistName=''){
 let existing=await query(env,'SELECT id FROM label_user WHERE email=?',email).first();
 if(!existing){await portalAuth(env,origin).api.signUpEmail({body:{email,name,password:uid()+uid()}});existing=await query(env,'SELECT id FROM label_user WHERE email=?',email).first();}
 if(!existing)throw new PortalError('Could not create this account.',503);
 const current=await member(env,existing.id);if(current)throw new PortalError('This email already has a label account. Use resend invitation.',409);
 await query(env,'INSERT INTO label_members (id,role,status,artist_name,notes,created_at) VALUES (?,?,?,?,?,?)',existing.id,role,'active',artistName,'',Date.now()).run();return {id:existing.id,email,name};
}
async function invite(env:PortalEnv,origin:string,user:any){let delivery='failed';try{await portalAuth(env,origin,true,status=>{delivery=status;}).api.requestPasswordReset({body:{email:user.email,redirectTo:origin+'/portal/reset/'}});return delivery;}catch{return 'failed';}}
function money(value:unknown){const s=text(value,20);if(!/^-?\d{1,10}(\.\d{1,2})?$/.test(s))throw new PortalError('Enter an amount with at most two decimal places.');const negative=s.startsWith('-'),parts=s.replace('-','').split('.');const n=Number(parts[0])*100+Number((parts[1]||'').padEnd(2,'0'));if(!Number.isSafeInteger(n)||!n)throw new PortalError('Enter a nonzero amount.');return negative?-n:n;}
function date(value:unknown,required=false){const v=text(value||'',10,required);if(v&&(!/^\d{4}-\d{2}-\d{2}$/.test(v)||!Number.isFinite(Date.parse(v))||new Date(v).toISOString().slice(0,10)!==v))throw new PortalError('Enter a valid date.');return v;}
export async function portal(request:Request,env:PortalEnv,ctx:any):Promise<Response>{
 try{
  if(!env.DB||!env.PORTAL_AUTH_SECRET)throw new PortalError('The label portal is being configured. Please try again shortly.',503);
  const url=new URL(request.url),path=url.pathname,method=request.method;
  if(!['GET','POST','PATCH','DELETE'].includes(method))throw new PortalError('Method not allowed.',405);
  // Only the fixed owner invitation can be provisioned by the single-purpose deployment secret.
  if(path==='/api/portal/bootstrap'&&method==='POST'){
   const supplied=request.headers.get('authorization')||'';
   requirePermission(!!env.PORTAL_SETUP_TOKEN&&await digest(supplied)===await digest('Bearer '+env.PORTAL_SETUP_TOKEN));
   const used=await query(env,"SELECT value FROM label_settings WHERE key='owner_bootstrap'").first();if(used)return json({ok:true,message:'Owner account already provisioned.'});
   let u=await query(env,'SELECT id,email,name FROM label_user WHERE email=?',OWNER_EMAIL).first();
   if(!u)u=await createMember(env,url.origin,'Kaeleb Savon Heck',OWNER_EMAIL,'owner','Mr. Blindbandit');
   requirePermission((await member(env,u.id))?.role==='owner');
   await env.DB.batch([query(env,"INSERT INTO label_settings (key,value) VALUES ('owner_bootstrap',?) ON CONFLICT(key) DO NOTHING",u.id),audit(env,u.id,'owner.provisioned',u.id)]);
   const delivery=await invite(env,url.origin,u);return json({ok:true,accountCreated:true,invitation:delivery});
  }
  // Deployment-owner recovery: fixed recipient, a temporary secret and one issuance.
  // The secret is removed from runtime immediately after the owner receives the link.
  if(path==='/api/portal/owner/setup-link'&&method==='POST'){
   const supplied=request.headers.get('authorization')||'';
   requirePermission(!!env.PORTAL_OWNER_LINK_SECRET&&await digest(supplied)===await digest('Bearer '+env.PORTAL_OWNER_LINK_SECRET));
   const u=await query(env,'SELECT id,email,name FROM label_user WHERE email=?',OWNER_EMAIL).first();
   const m=u&&await member(env,u.id);requirePermission(m?.role==='owner'&&m.status==='active');
   const used=await query(env,"SELECT value FROM label_settings WHERE key='owner_setup_link_issued'").first();if(used)throw new PortalError('The owner setup link has already been issued.',409);
   const claim=uid();await query(env,"INSERT INTO label_settings (key,value) VALUES ('owner_setup_link_issued',?)",claim).run();
   let resetUrl='';try{await portalAuth(env,url.origin,true,undefined,value=>{resetUrl=value;}).api.requestPasswordReset({body:{email:OWNER_EMAIL,redirectTo:url.origin+'/portal/reset/'}});if(!resetUrl)throw new Error('No setup link generated');}
   catch{await query(env,"DELETE FROM label_settings WHERE key='owner_setup_link_issued' AND value=?",claim).run();throw new PortalError('Could not create the setup link.',503);}
   await env.DB.batch([query(env,"UPDATE label_settings SET value=? WHERE key='owner_setup_link_issued' AND value=?",u.id,claim),audit(env,u.id,'owner.setup_link_issued',u.id)]);
   return json({email:OWNER_EMAIL,resetUrl,expiresInSeconds:3600});
  }
  // Only OAuth callbacks bypass our same-origin form guard. Better Auth validates
  // provider state, the signed state cookie, PKCE and the provider response.
  const callback=path.match(/^\/api\/label-auth\/callback\/(google|apple)$/);
  if(callback){const provider=callback[1] as 'google'|'apple';if(!portalProviders(env)[provider])throw new PortalError('This sign-in method is not configured.',404);if(url.origin!=='https://mrblindbandit.net')throw new PortalError('Use the official website to sign in.',400);if(method!=='GET'&&(method!=='POST'||provider!=='apple'))throw new PortalError('Method not allowed.',405);if(method==='POST'){const value=await body(request);request=new Request(request.url,{method,headers:request.headers,body:await value.text()});}const r=await portalAuth(env,url.origin).handler(request);const h=new Headers(r.headers);h.set('cache-control','private, no-store');h.set('referrer-policy','no-referrer');h.set('x-robots-tag','noindex, nofollow');return new Response(r.body,{status:r.status,headers:h});}
  if(method!=='GET'){if(request.headers.get('origin')!==url.origin)throw new PortalError('Submit from this website.',403);await limit(env,await digest(request.headers.get('cf-connecting-ip')||'unknown'),60);}
  if(path==='/api/portal/providers'&&method==='GET')return json({providers:portalProviders(env),origin:'https://mrblindbandit.net'});
  if(path.startsWith('/api/label-auth/')){
   const allowed=['sign-in/email','sign-in/social','link-social','sign-out','request-password-reset','reset-password','change-password','list-sessions','revoke-session','revoke-other-sessions','get-session'];
   const route=path.slice('/api/label-auth/'.length);if(['change-password','link-social','revoke-session','revoke-other-sessions'].includes(route)){const a=await actor(request,env);if(!await verified(request,env,a,true))return json({error:'Verify your identity to continue.',verificationRequired:true},403);}if(!allowed.includes(route))throw new PortalError('Endpoint not available.',404);
   if(method==='GET'&&!['get-session','list-sessions'].includes(route))throw new PortalError('Method not allowed.',405);
   if(method==='POST'){
    const input=await data(request);if(route==='sign-in/email'&&(typeof input.password!=='string'||input.password.length>128))throw new PortalError('Invalid sign-in details.');await limit(env,'auth-ip:'+await digest(request.headers.get('cf-connecting-ip')||'unknown'),15,3600000);
    if(input.email)await limit(env,'auth-email:'+await digest(mail(input.email)),8,3600000);
    if(route==='request-password-reset'){
     const email=mail(input.email);const pending=portalAuth(env,url.origin).api.requestPasswordReset({body:{email,redirectTo:url.origin+'/portal/reset/'}}).catch(()=>{});ctx.waitUntil(pending);
     return json({message:'If this email has a label account, a reset link will be requested. Contact the label if it does not arrive.'});
    }
    if(route==='sign-in/social'||route==='link-social'){
     if(url.origin!=='https://mrblindbandit.net')throw new PortalError('Open mrblindbandit.net to use social sign-in.');
     if(!['google','apple'].includes(input.provider)||!portalProviders(env)[input.provider as 'google'|'apple'])throw new PortalError('This sign-in method is not configured.',404);
     if(route==='link-social'){const a=await actor(request,env);requirePermission(!a.recovery);}
     // Fixed destinations and scopes: do not accept client-supplied tokens or redirects.
     request=new Request(request.url,{method,headers:request.headers,body:JSON.stringify({provider:input.provider,callbackURL:url.origin+(route==='link-social'?'/portal/security/':'/portal/'),errorCallbackURL:url.origin+'/portal/login/',disableRedirect:true})});
    }else request=new Request(request.url,{method,headers:request.headers,body:JSON.stringify(input)});
   }
   const response=await portalAuth(env,url.origin).handler(request);const headers=new Headers(response.headers);headers.set('cache-control','private, no-store');headers.set('referrer-policy','no-referrer');return new Response(response.body,{status:response.status,headers});
  }
  if(path==='/api/portal/me'&&method==='GET'){try{const a=await actor(request,env);return json({user:{id:a.id,name:a.name,email:a.email,role:a.role,artistName:a.artist_name,recovery:a.recovery,authProvider:a.authProvider||'legacy',needsVerification:!await verified(request,env,a),needsPasswordSetup:a.role==='owner'&&a.recovery&&!a.email_verified&&!(await query(env,"SELECT value FROM label_settings WHERE key='owner_password_initialized'").first())},permissions:{accounts:canManage(a),finance:canFinance(a),projects:canProjects(a)}});}catch(e){if(e instanceof PortalError&&e.status===401)return json({user:null});throw e;}}
  const a=await actor(request,env);
  if(path.startsWith('/api/portal/security/'))return security(request,env,a,method==='GET'?null:await data(request));
  if(!await verified(request,env,a))return json({error:'Administrator email verification required.',verificationRequired:true},403);
  if(method!=='GET'&&(/^\/api\/portal\/(members|departments|owner)($|\/)/.test(path))&&!await verified(request,env,a,true))return json({error:'Verify your identity to continue.',verificationRequired:true},403);
  if(/^\/api\/portal\/(publishing|seo|departments)(\/|$)/.test(path))return editorialAPI(request,env,a,method==='GET'?null:await data(request));
  if(path==='/api/portal/social'&&method==='GET'){const rows=await query(env,"SELECT provider_id FROM label_account WHERE user_id=? AND provider_id IN ('google','apple')",a.id).all();return json({providers:portalProviders(env),connected:rows.results.map((x:any)=>x.provider_id)});}
  if(method!=='GET')await limit(env,'user:'+a.id,40);
  if(path==='/api/portal/mail/test'&&method==='POST'){
   requirePermission(a.role==='owner');requirePermission(!!env.COMMUNITY_MODERATOR_EMAIL);
   await limit(env,'owner-welcome-test:'+a.id,2,3600000);
   const result=await sendPortalMail(env,{id:a.id,name:a.name,email:env.COMMUNITY_MODERATOR_EMAIL!},'https://mrblindbandit.net/portal/','owner_welcome');
   await audit(env,a.id,'email.owner_test',a.id).run();
   return json({status:'accepted',recipient:env.COMMUNITY_MODERATOR_EMAIL,providerId:result.providerId});
  }
  if(path==='/api/portal/advertising')return advertising(request,env,a,method==='GET'?null:await data(request));
  if(path==='/api/portal/payments')return stripeOverview(request,env as any,a);
  if(path.startsWith('/api/portal/personal-tools/'))return personalTools(request,env,a,method==='GET'?null:await data(request));
  if(path.startsWith('/api/portal/account-admin/'))return accountAdmin(request,env,a,method==='GET'?null:await data(request));
  if(path==='/api/portal/tools/search'||path==='/api/portal/tools/shortcuts')return portalTools(request,env,a,method==='GET'?null:await data(request));
  if(path.startsWith('/api/portal/operations/'))return operations(request,env,a,method==='GET'?null:await data(request));
  if(path==='/api/portal/translations')return translationAPI(request,env,a,method==='GET'?null:await data(request));
  if(path.startsWith('/api/portal/feeds'))return feeds(request,env,a,method==='GET'?null:await data(request));
  if(path==='/api/portal/inbox'||path.startsWith('/api/portal/inbox/'))return inbox(request,env,a,method==='GET'?null:await data(request));
  if(path.startsWith('/api/portal/workspace/'))return workspace(request,env,a,method==='GET'?null:await data(request));
  if(path==='/api/portal/owner/password'&&method==='POST'){
   requirePermission(a.role==='owner'&&a.recovery&&a.email===OWNER_EMAIL);
   const initialized=await query(env,"SELECT value FROM label_settings WHERE key='owner_password_initialized'").first();
   requirePermission(!initialized&&!a.email_verified);
   const d=await data(request);if(typeof d.newPassword!=='string'||d.newPassword.length<12||d.newPassword.length>128)throw new PortalError('Choose a password between 12 and 128 characters.');
   const context=await portalAuth(env,url.origin).$context,hash=await context.password.hash(d.newPassword);
   // The claim is unique: concurrent setup attempts cannot overwrite one another.
   await env.DB.batch([query(env,"INSERT INTO label_settings (key,value) VALUES ('owner_password_initialized',?)",a.id),query(env,"UPDATE label_account SET password=?,updated_at=? WHERE user_id=? AND provider_id='credential'",hash,Date.now(),a.id),query(env,'DELETE FROM label_session WHERE user_id=?',a.id),audit(env,a.id,'owner.password_initialized',a.id)]);
   return json({ok:true,message:'Your label password is ready. Sign in with your business email and the password you chose.'});
  }
  if(path==='/api/portal/dashboard'&&method==='GET')return portalDashboard(request,env,a);
  if(path==='/api/portal/summary'&&method==='GET'){
   const filter=a.role==='client'?' WHERE client_id=?':'',args=a.role==='client'?[a.id]:[];
   const earnings=await query(env,'SELECT currency,status,SUM(amount) AS amount,COUNT(*) AS entries FROM label_earnings'+filter+' GROUP BY currency,status',...args).all();
   const tasks=await query(env,'SELECT status,COUNT(*) AS count FROM label_tasks'+filter+' GROUP BY status',...args).all();
   const contracts=await query(env,'SELECT status,COUNT(*) AS count FROM label_contracts'+filter+' GROUP BY status',...args).all();
   const clients=a.role==='client'?null:await query(env,"SELECT COUNT(*) AS count FROM label_members WHERE role='client' AND status='active'").first();
   return json({earnings:earnings.results,tasks:tasks.results,contracts:contracts.results,clients:clients?.count??null});
  }
  if(path==='/api/portal/members'&&method==='GET'){
   requirePermission(a.role!=='client');const rows=await query(env,"SELECT m.id,u.name,u.email,m.role,m.status,m.artist_name,m.created_at FROM label_members m JOIN label_user u ON u.id=m.id "+(canManage(a)?'':"WHERE m.role='client' ")+'ORDER BY m.created_at DESC LIMIT 500').all();return json({members:rows.results});
  }
  if(path==='/api/portal/members'&&method==='POST'){
   requirePermission(canManage(a));const d=await data(request),role=text(d.role,20);requirePermission(['client','manager','accountant',...(a.role==='owner'?['admin']:[])].includes(role));const email=mail(d.email);requirePermission(email!==OWNER_EMAIL);const u=await createMember(env,url.origin,text(d.name,120),email,role,text(d.artistName||'',120,false));await audit(env,a.id,'member.created:'+role,u.id).run();return json({id:u.id,invitation:await invite(env,url.origin,u)},201);
  }
  const memberRoute=path.match(/^\/api\/portal\/members\/([a-f0-9-]+)(\/invite)?$/);
  if(memberRoute){requirePermission(canManage(a));const m=await member(env,memberRoute[1]);if(!m)throw new PortalError('Account not found.',404);
   if(memberRoute[2]&&method==='POST'){requirePermission(m.role!=='owner'||a.role==='owner');await limit(env,'invite:'+m.id,3,3600000);return json({invitation:await invite(env,url.origin,m)});}
   if(method==='PATCH'){requirePermission(m.role!=='owner'&&m.id!==a.id&&(a.role==='owner'||m.role!=='admin'));const d=await data(request),role=text(d.role,20),status=text(d.status,20);requirePermission(['client','manager','accountant',...(a.role==='owner'?['admin']:[])].includes(role));if(!['active','suspended'].includes(status))throw new PortalError('Invalid account status.');
    // Records remain attached to this identity; the current role controls access.
    if(role!==m.role&&d.confirmRole!==role)throw new PortalError('Confirm the new access role before saving.');
    await env.DB.batch([query(env,'UPDATE label_members SET role=?,status=? WHERE id=?',role,status,m.id),query(env,'DELETE FROM label_session WHERE user_id=?',m.id),query(env,'DELETE FROM security_proofs WHERE user_id=?',m.id),audit(env,a.id,'member.updated:'+role+':'+status,m.id)]);return json({ok:true});}
  }
  if(path==='/api/portal/profile'&&method==='PATCH'){const d=await data(request);await env.DB.batch([query(env,'UPDATE label_user SET name=?,updated_at=? WHERE id=?',text(d.name,120),Date.now(),a.id),query(env,'UPDATE label_members SET artist_name=? WHERE id=?',text(d.artistName||'',120,false),a.id),audit(env,a.id,'profile.updated',a.id)]);return json({ok:true});}
  if(path==='/api/portal/earnings'&&method==='GET'){
   const id=a.role==='client'?a.id:url.searchParams.get('clientId');if(id&&a.role!=='client')await client(env,id);const rows=await query(env,'SELECT e.*,u.name AS client_name FROM label_earnings e JOIN label_user u ON u.id=e.client_id'+(id?' WHERE e.client_id=?':'')+' ORDER BY e.created_at DESC LIMIT 1000',...(id?[id]:[])).all();return json({earnings:rows.results});
  }
  if(path==='/api/portal/earnings'&&method==='POST'){requirePermission(canFinance(a));const d=await data(request),id=await selectedClient(request,env,a,d),currency=text(d.currency,3).toUpperCase();if(!['USD','PHP','EUR','GBP','CAD','AUD'].includes(currency))throw new PortalError('Choose a supported currency.');const status=text(d.status,20);if(!['reported','payable','paid','adjustment'].includes(status))throw new PortalError('Choose a valid status.');const amount=money(d.amount);if(amount<0&&status!=='adjustment')throw new PortalError('Negative values must be adjustments.');const record=uid();await env.DB.batch([query(env,'INSERT INTO label_earnings (id,client_id,description,source,period,currency,amount,status,reference,created_by,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)',record,id,text(d.description,200),text(d.source,120),text(d.period,60),currency,amount,status,text(d.reference||'',200,false),a.id,Date.now()),audit(env,a.id,'earnings.created',record)]);return json({id:record},201);}
  if(path==='/api/portal/contracts'&&method==='GET'){const id=a.role==='client'?a.id:url.searchParams.get('clientId');requirePermission(a.role==='client'||canProjects(a));if(id&&a.role!=='client')await client(env,id);const rows=await query(env,'SELECT c.id,c.client_id,c.title,c.file_name,c.status,c.reviewed_at,c.created_at,u.name AS client_name FROM label_contracts c JOIN label_user u ON u.id=c.client_id'+(id?' WHERE c.client_id=?':'')+' ORDER BY c.created_at DESC LIMIT 500',...(id?[id]:[])).all();return json({contracts:rows.results});}
  if(path==='/api/portal/contracts'&&method==='POST'){
   requirePermission(canProjects(a));const blob=await body(request,11*1024*1024),fd=await new Response(blob,{headers:{'content-type':request.headers.get('content-type')||''}}).formData();const d=Object.fromEntries(fd),id=await selectedClient(request,env,a,d),title=text(d.title,200),file=fd.get('file');if(!file||typeof file==='string'||file.size>10*1024*1024||!file.size||!/\.pdf$/i.test(file.name))throw new PortalError('Upload a PDF up to 10 MB.');if(await file.slice(0,5).text()!=='%PDF-')throw new PortalError('The file is not a PDF.');const record=uid(),key='label/contracts/'+record;
   await env.BUCKET.put(key,file.stream(),{httpMetadata:{contentType:'application/pdf'}});try{await env.DB.batch([query(env,'INSERT INTO label_contracts (id,client_id,title,storage_key,file_name,status,created_by,created_at) VALUES (?,?,?,?,?,?,?,?)',record,id,title,key,file.name,'shared',a.id,Date.now()),audit(env,a.id,'contract.shared',record)]);}catch(e){await env.BUCKET.delete(key);throw e;}return json({id:record},201);
  }
  const contractRoute=path.match(/^\/api\/portal\/contracts\/([a-f0-9-]+)(\/file|\/review)?$/);
  if(contractRoute){const c=await query(env,'SELECT * FROM label_contracts WHERE id=?',contractRoute[1]).first();if(!c||a.role==='client'&&c.client_id!==a.id)throw new PortalError('Contract not found.',404);requirePermission(a.role==='client'||canProjects(a));
   if(contractRoute[2]==='/file'&&method==='GET'){const file=await env.BUCKET.get(c.storage_key);if(!file)throw new PortalError('File unavailable.',404);return new Response(file.body,{headers:{'content-type':'application/pdf','content-disposition':'attachment; filename="'+c.file_name.replace(/[^a-zA-Z0-9._-]/g,'_')+'"','cache-control':'private, no-store','x-content-type-options':'nosniff'}});}
   if(contractRoute[2]==='/review'&&method==='POST'){requirePermission(a.role==='client'&&a.id===c.client_id);await env.DB.batch([query(env,"UPDATE label_contracts SET status='reviewed',reviewed_at=? WHERE id=? AND reviewed_at IS NULL",Date.now(),c.id),audit(env,a.id,'contract.reviewed',c.id)]);return json({ok:true});}
  }
  if(path==='/api/portal/messages'&&method==='GET'){const id=await selectedClient(request,env,a);const rows=await query(env,'SELECT m.id,m.client_id,m.sender_id,m.body,m.created_at,u.name AS sender_name FROM label_messages m JOIN label_user u ON u.id=m.sender_id WHERE m.client_id=? ORDER BY m.created_at DESC LIMIT 200',id).all();return json({messages:rows.results.reverse()});}
  if(path==='/api/portal/messages'&&method==='POST'){const d=await data(request),id=await selectedClient(request,env,a,d),record=uid();await env.DB.batch([query(env,'INSERT INTO label_messages (id,client_id,sender_id,body,created_at) VALUES (?,?,?,?,?)',record,id,a.id,text(d.body,5000),Date.now()),audit(env,a.id,'message.sent',id)]);return json({id:record},201);}
  if(path==='/api/portal/tasks'&&method==='GET'){const id=a.role==='client'?a.id:url.searchParams.get('clientId');if(id&&a.role!=='client')await client(env,id);const rows=await query(env,'SELECT t.*,u.name AS client_name FROM label_tasks t JOIN label_user u ON u.id=t.client_id'+(id?' WHERE t.client_id=?':'')+' ORDER BY t.created_at DESC LIMIT 500',...(id?[id]:[])).all();return json({tasks:rows.results});}
  if(path==='/api/portal/tasks'&&method==='POST'){requirePermission(canProjects(a));const d=await data(request),id=await selectedClient(request,env,a,d),record=uid();await env.DB.batch([query(env,'INSERT INTO label_tasks (id,client_id,title,details,due_date,status,created_by,created_at) VALUES (?,?,?,?,?,?,?,?)',record,id,text(d.title,200),text(d.details||'',3000,false),date(d.dueDate),'open',a.id,Date.now()),audit(env,a.id,'task.created',record)]);return json({id:record},201);}
  const taskRoute=path.match(/^\/api\/portal\/tasks\/([a-f0-9-]+)$/);
  if(taskRoute&&method==='PATCH'){const t=await query(env,'SELECT * FROM label_tasks WHERE id=?',taskRoute[1]).first();if(!t||a.role==='client'&&t.client_id!==a.id)throw new PortalError('Task not found.',404);requirePermission(a.role==='client'||canProjects(a));const d=await data(request);if(!['open','in_progress','complete'].includes(d.status))throw new PortalError('Choose a valid status.');await env.DB.batch([query(env,'UPDATE label_tasks SET status=? WHERE id=?',d.status,t.id),audit(env,a.id,'task.status:'+d.status,t.id)]);return json({ok:true});}
  if(path==='/api/portal/audit'&&method==='GET'){requirePermission(canManage(a));const rows=await query(env,'SELECT a.*,u.name AS actor_name FROM label_audit a LEFT JOIN label_user u ON u.id=a.actor_id ORDER BY a.created_at DESC LIMIT 200').all();return json({events:rows.results});}
  if(path==='/api/portal/mail'&&method==='GET'){requirePermission(canManage(a));const rows=await query(env,'SELECT m.id,m.kind,m.status,m.created_at,u.email FROM label_mail m JOIN label_user u ON u.id=m.user_id ORDER BY m.created_at DESC LIMIT 100').all();return json({mail:rows.results.map((row:any)=>({...row,email:row.kind==='owner_welcome'?env.COMMUNITY_MODERATOR_EMAIL:row.email}))});}
  if(path==='/api/portal/inbox'&&method==='GET'){requirePermission(canManage(a));const rows=await query(env,'SELECT id,kind,name,email,details,file_name,created_at FROM site_requests ORDER BY created_at DESC LIMIT 100').all();return json({requests:rows.results});}
  const inboxFile=path.match(/^\/api\/portal\/inbox\/([a-f0-9-]+)\/file$/);
  if(inboxFile&&method==='GET'){requirePermission(canManage(a));const row=await query(env,'SELECT storage_key,file_name FROM site_requests WHERE id=?',inboxFile[1]).first();const file=row?.storage_key&&await env.BUCKET.get(row.storage_key);if(!file)throw new PortalError('File not found.',404);return new Response(file.body,{headers:{'content-type':'application/octet-stream','content-disposition':'attachment; filename="'+row.file_name.replace(/[^a-zA-Z0-9._-]/g,'_')+'"','cache-control':'private, no-store'}});}
  throw new PortalError('Endpoint not found.',404);
 }catch(e){if(e instanceof PortalError)return json({error:e.message},e.status);console.error('Label portal request failed',e instanceof Error?e.name:'unknown');return json({error:'This action could not be completed. Your input is still here; please try again.'},503);}
}
