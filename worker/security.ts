import {rememberBrowser,knownDevices} from './known-devices';
import {authenticatorEnabled,authenticatorAction} from './authenticator';
import {q,id,hash,response,str,audit} from './editorial-common';
export const platformVerification=Symbol('platformVerification');
export async function verified(request:Request,env:any,a:any,recent=false){
 if(!['owner','admin'].includes(a.role))return true;
 if(a[platformVerification]!==undefined)return Number(a[platformVerification])>Date.now()-(recent?5:720)*60000;
 // Clerk sessions satisfy administrator step-up; legacy email/TOTP proofs are retired.
 if(a.authProvider==='clerk'||String(a.sessionKey||'').startsWith('clerk:')||a.provider==='clerk')return true;
 const raw=request.headers.get('cookie')?.match(/(?:^|;\s*)bb_stepup=([^;]+)/)?.[1];
 if(!raw)return false;
 const proof=await q(env,'SELECT created_at FROM security_proofs WHERE id=? AND user_id=? AND session_key=? AND expires_at>?',await hash(raw),a.id,a.sessionKey,Date.now()).first();
 return !!proof&&(!recent||proof.created_at>Date.now()-15*60000);
}
export async function security(request:Request,env:any,a:any,d:any){
 const action=new URL(request.url).pathname.split('/').pop();
 const now=Date.now();
 if(!['owner','admin'].includes(a.role))return response({error:'Administrator verification is not required for this role.'},403);
 try{
  if(action==='devices'){if(!await verified(request,env,a))return response({error:'Sign in with your production Clerk account to continue.',verificationRequired:true,clerk:true},403);return knownDevices(request,env,a,d,await verified(request,env,a,true));}
  if(action==='authenticator')return authenticatorAction(request,env,a,d,await verified(request,env,a,true));
  if(action==='status'&&request.method==='GET')return response({authenticator:false,authenticator_retired:true,clerk_mfa:true,verified:await verified(request,env,a),recent:await verified(request,env,a,true),email:a.role==='owner'?env.COMMUNITY_MODERATOR_EMAIL:a.email,recoveryCodes:0,message:'Use Clerk multi-factor authentication on your production Clerk account. Portal email codes and Google Authenticator enrollment are retired.'});
  if(action==='sessions'&&request.method==='GET'){if(!await verified(request,env,a))return response({error:'Sign in with your production Clerk account to continue.',verificationRequired:true,clerk:true},403);const sessions=(await q(env,'SELECT id,user_agent,ip_address,created_at,expires_at FROM label_session WHERE user_id=? AND expires_at>? ORDER BY created_at DESC',a.id,now).all()).results;const events=(await q(env,"SELECT action,created_at FROM label_audit WHERE actor_id=? AND (action LIKE 'security.%' OR action LIKE 'member.%' OR action LIKE 'owner.%') ORDER BY created_at DESC LIMIT 50",a.id).all()).results;return response({sessions:sessions.map((r:any)=>({...r,current:r.id===a.sessionKey})),events});}
  if(action==='session'&&request.method==='POST'){if(!await verified(request,env,a,true))return response({error:'Sign in with your production Clerk account to continue.',verificationRequired:true,clerk:true},403);const target=str(d.id,150);if(target===a.sessionKey)return response({error:'Use Sign out to end your current session.'},400);const removed=await q(env,'DELETE FROM label_session WHERE id=? AND user_id=? RETURNING id',target,a.id).first();if(!removed)return response({error:'Session not found.'},404);await env.DB.batch([q(env,'DELETE FROM security_proofs WHERE user_id=? AND session_key=?',a.id,target),audit(env,a.id,'security.session_revoked',target)]);return response({ok:true});}
  if(action==='send'&&request.method==='POST')return response({error:'Email verification codes are retired. Re-authenticate with your production Clerk account (complete Clerk MFA if prompted).',code:'CLERK_STEPUP',clerk:'https://mrblindbandit.net/sign-in?redirect_url=%2Fportal%2Fsecurity%2F'},410);
  if(action==='verify'&&request.method==='POST')return response({error:'Email verification codes and authenticator codes are retired. Re-authenticate with your production Clerk account (complete Clerk MFA if prompted), then retry the secure action.',code:'CLERK_STEPUP',clerk:'https://mrblindbandit.net/sign-in?redirect_url=%2Fportal%2Fsecurity%2F'},410);
  if(action==='recovery'&&request.method==='POST')return response({error:'Portal recovery codes are retired. Manage recovery through your production Clerk account at /account.',code:'CLERK_RECOVERY'},410);
  if(action==='revoke'&&request.method==='POST'){if(!await verified(request,env,a,true))return response({error:'Sign in with your production Clerk account to continue.',verificationRequired:true,clerk:true},403);await env.DB.batch([q(env,'DELETE FROM label_session WHERE user_id=?',a.id),q(env,'DELETE FROM security_proofs WHERE user_id=?',a.id),audit(env,a.id,'security.all_sessions_revoked',a.id)]);return response({ok:true});}
  return response({error:'Security action unavailable.'},404);
 }catch{return response({error:'Verification could not complete. Try again later.'},503);}
}
