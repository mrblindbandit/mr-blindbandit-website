import {createClerkClient} from '@clerk/backend';
import {portalAuth} from '../portal-auth';
import {ApiError,q,hash,random,equal,setting,setSetting,audit,limit,origins,type Env} from './core';
export type Actor={id:string;name:string;email:string;role:string;provider:string;sourceSession:string;sessionId?:string;kind?:string;verifiedAt:number};
async function member(env:Env,id:string){return q(env,'SELECT m.id,m.role,m.status,u.name,u.email FROM label_members m JOIN label_user u ON m.id=u.id WHERE m.id=?',id).first();}
async function active(env:Env,m:any){if(!m||m.status!=='active')throw new ApiError(403,'ACCOUNT_DISABLED','This account does not have active portal access.');if(m.role!=='owner'&&(await q(env,"SELECT value FROM label_settings WHERE key='portal_lockdown'").first())?.value==='1')throw new ApiError(403,'PORTAL_LOCKED','The portal is temporarily locked.');return m;}
async function sourceActive(env:Env,provider:string,id:string,userId:string){if(provider==='owner')return true;if(provider==='label'){const s=await q(env,'SELECT id FROM label_session WHERE id=? AND user_id=? AND expires_at>?',id,userId,Date.now()).first();return !!s;}if(provider==='clerk'){if(!env.CLERK_SECRET_KEY)return false;const client=createClerkClient({secretKey:env.CLERK_SECRET_KEY});try{const session=await client.sessions.getSession(id);return session.status==='active'&&session.expireAt>Date.now();}catch{return false;}}return false;}
export async function upstream(request:Request,env:Env):Promise<Actor>{
 const publishableKey=env.CLERK_PUBLISHABLE_KEY||env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
 if(publishableKey&&env.CLERK_SECRET_KEY){const client=createClerkClient({publishableKey,secretKey:env.CLERK_SECRET_KEY});const state=await client.authenticateRequest(request,{authorizedParties:origins});if(state.isSignedIn){const auth=state.toAuth();const user=await client.users.getUser(auth.userId);const email=user.emailAddresses.find(v=>v.id===user.primaryEmailAddressId&&v.verification?.status==='verified')?.emailAddress.toLowerCase();if(!email)throw new ApiError(403,'EMAIL_UNVERIFIED','Verify your email first.');const lookup=email===env.COMMUNITY_MODERATOR_EMAIL?.toLowerCase()?'business@mrblindbandit.net':email;const row=await q(env,'SELECT id FROM label_user WHERE lower(email)=?',lookup).first();const m=await active(env,row&&await member(env,row.id));return {...m,provider:'clerk',sourceSession:auth.sessionId,verifiedAt:auth.has({reverification:{level:'first_factor',afterMinutes:5}})?Date.now():0};}}
 const session=await portalAuth(env as any,'https://mrblindbandit.net').api.getSession({headers:request.headers});if(!session?.user)throw new ApiError(401,'AUTH_REQUIRED','Sign in to your account.');
 const m=await active(env,await member(env,session.user.id));let verifiedAt=0;
 const cookie=request.headers.get('cookie')?.match(/(?:^|;\s*)bb_stepup=([^;]+)/)?.[1];
 if(cookie){const proof=await q(env,'SELECT created_at FROM security_proofs WHERE id=? AND user_id=? AND session_key=? AND expires_at>?',await hash(cookie),m.id,session.session.id,Date.now()).first();verifiedAt=proof?.created_at||0;}
 return {...m,provider:'label',sourceSession:session.session.id,verifiedAt};
}
export async function authenticate(request:Request,env:Env):Promise<Actor>{
 const auth=request.headers.get('authorization')||'';
 if(!auth.startsWith('Bearer bb_'))return upstream(request,env);
 const row=await q(env,'SELECT * FROM platform_sessions WHERE token_hash=? AND revoked_at IS NULL AND expires_at>?',await hash(auth.slice(7)),Date.now()).first();
 if(!row)throw new ApiError(401,'SESSION_EXPIRED','Sign in again. Your session has expired or was revoked.');
 const m=await active(env,await member(env,row.user_id));
 if(row.kind==='owner'&&(!await setting(env,'owner_mobile_enabled',false)||m.role!=='owner'))throw new ApiError(401,'OWNER_ACCESS_DISABLED','Mobile owner access is disabled.');
 if(!await sourceActive(env,row.provider,row.source_session,m.id))throw new ApiError(401,'SESSION_REVOKED','Sign in again. The original session was revoked.');
 await q(env,'UPDATE platform_sessions SET last_used_at=? WHERE id=? AND revoked_at IS NULL',Date.now(),row.id).run();
 return {...m,provider:row.provider,sourceSession:row.source_session,sessionId:row.id,kind:row.kind,verifiedAt:row.verified_at};
}
export function owner(a:Actor){if(a.role!=='owner'||(a.sessionId&&a.kind!=='owner'))throw new ApiError(403,'OWNER_REQUIRED','Owner access is required.');}
export function recent(a:Actor){if(a.verifiedAt<Date.now()-5*60000)throw new ApiError(403,'REAUTH_REQUIRED','Verify your identity again before this action.');}
export async function issue(env:Env,a:Actor,data:any,requestId:string,kind='user'){
 const id=crypto.randomUUID(),token='bb_'+random(),refresh='bbr_'+random(),now=Date.now();
 const ttl=15*60000,refreshTtl=kind==='owner'?24*3600000:7*24*3600000;
 await env.DB.batch([q(env,'INSERT INTO platform_sessions(id,user_id,token_hash,refresh_hash,kind,provider,source_session,device_name,platform,app_version,created_at,last_used_at,verified_at,expires_at,refresh_expires_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',id,a.id,await hash(token),await hash(refresh),kind,a.provider,a.sourceSession,data.device_name,data.platform,data.app_version,now,now,a.verifiedAt,now+ttl,now+refreshTtl),audit(env,a.id,'session.created',id,requestId)]);
 return {session_id:id,access_token:token,refresh_token:refresh,token_type:'Bearer',expires_at:now+ttl,refresh_expires_at:now+refreshTtl,role:a.role};
}
export async function refresh(env:Env,data:any,requestId:string){
 const row=await q(env,'SELECT * FROM platform_sessions WHERE refresh_hash=? AND revoked_at IS NULL AND refresh_expires_at>?',await hash(data.refresh_token),Date.now()).first();
 if(!row)throw new ApiError(401,'REFRESH_EXPIRED','Sign in again.');
 const m=await active(env,await member(env,row.user_id));
 if(row.kind==='owner'&&(!await setting(env,'owner_mobile_enabled',false)||m.role!=='owner'))throw new ApiError(401,'OWNER_ACCESS_DISABLED','Mobile owner access is disabled.');
 if(!await sourceActive(env,row.provider,row.source_session,row.user_id))throw new ApiError(401,'SESSION_REVOKED','The original session was revoked.');
 const token='bb_'+random(),refreshToken='bbr_'+random(),now=Date.now();
 const changed=await q(env,'UPDATE platform_sessions SET token_hash=?,refresh_hash=?,expires_at=?,last_used_at=? WHERE id=? AND refresh_hash=? AND revoked_at IS NULL RETURNING id',await hash(token),await hash(refreshToken),now+15*60000,now,row.id,await hash(data.refresh_token)).first();
 if(!changed)throw new ApiError(401,'REFRESH_REUSED','This refresh credential has already been used.');
 await audit(env,m.id,'session.refreshed',row.id,requestId).run();
 return {session_id:row.id,access_token:token,refresh_token:refreshToken,token_type:'Bearer',expires_at:now+15*60000,refresh_expires_at:row.refresh_expires_at,role:m.role};
}
export async function bootstrap(env:Env,data:any,requestId:string){
 if(!await setting(env,'owner_mobile_enabled',false))throw new ApiError(403,'OWNER_ACCESS_DISABLED','Enable mobile owner access from your website Control Center.');
 const digest=await setting(env,'owner_master_digest','');
 if(!digest||!await equal(await hash(data.master_secret),digest)){await audit(env,'anonymous','owner.bootstrap','',requestId,'denied').run();throw new ApiError(401,'OWNER_AUTH_FAILED','Owner credentials were not accepted.');}
 const row=await q(env,"SELECT m.id FROM label_members m JOIN label_user u ON u.id=m.id WHERE m.role='owner' AND m.status='active' AND u.email='business@mrblindbandit.net'").first();
 const m=await active(env,row&&await member(env,row.id));const a={...m,provider:'owner',sourceSession:'master',verifiedAt:Date.now()};
 return issue(env,a,data,requestId,'owner');
}
export async function reauthenticate(env:Env,a:Actor,data:any,requestId:string){
 if(a.provider==='owner'){const digest=await setting(env,'owner_master_digest','');if(!digest||!await equal(await hash(data.master_secret||''),digest))throw new ApiError(401,'OWNER_AUTH_FAILED','Owner credentials were not accepted.');}
 else if(a.provider==='clerk'){
  // Clerk first-factor / MFA reverification within the last 5 minutes satisfies step-up.
  if(a.verifiedAt<Date.now()-5*60000)throw new ApiError(403,'REAUTH_REQUIRED','Re-verify in Clerk (open /account or complete Clerk MFA), then retry this action.');
 }else if(a.verifiedAt<Date.now()-5*60000){
  throw new ApiError(403,'REAUTH_REQUIRED','Sign in again with your production Clerk account. Legacy authenticator codes and email verification codes are retired.');
 }
 if(a.sessionId)await q(env,'UPDATE platform_sessions SET verified_at=? WHERE id=? AND revoked_at IS NULL',Date.now(),a.sessionId).run();
 await audit(env,a.id,'session.reauthenticated',a.sessionId||a.sourceSession,requestId).run();
 return {verified:true,valid_until:Date.now()+5*60000,method:a.provider==='clerk'?'clerk':'session'};
}

/** Clerk-only social actor for /mobile — no label portal membership required. */
export type SocialActor={id:string;clerkUserId:string;email:string;name:string;provider:'clerk';sessionId:string;verifiedAt:number};

export async function socialAuthenticate(request:Request,env:Env):Promise<SocialActor>{
  const publishableKey=env.CLERK_PUBLISHABLE_KEY||env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  if(!publishableKey||!env.CLERK_SECRET_KEY)throw new ApiError(503,'CLERK_NOT_CONFIGURED','Clerk authentication is not configured.');
  const client=createClerkClient({publishableKey,secretKey:env.CLERK_SECRET_KEY});
  const state=await client.authenticateRequest(request,{authorizedParties:origins});
  if(!state.isSignedIn)throw new ApiError(401,'AUTH_REQUIRED','Sign in with Clerk to continue.');
  const auth=state.toAuth();
  const user=await client.users.getUser(auth.userId);
  const email=user.emailAddresses.find(v=>v.id===user.primaryEmailAddressId&&v.verification?.status==='verified')?.emailAddress.toLowerCase();
  if(!email)throw new ApiError(403,'EMAIL_UNVERIFIED','Verify your email before using Blindbandit Mobile.');
  const name=[user.firstName,user.lastName].filter(Boolean).join(' ')||user.username||email.split('@')[0];
  return {
    id:'clerk:'+auth.userId,
    clerkUserId:auth.userId,
    email,
    name,
    provider:'clerk',
    sessionId:auth.sessionId,
    verifiedAt:auth.has({reverification:{level:'first_factor',afterMinutes:5}})?Date.now():0
  };
}
