import {ApiError,q,uuid,page,type Env} from './core';
import {notifyAndDeliver} from './notifications';
export type SocialAdminActor={email:string;clerkUserId:string;name?:string};
type SocialActor=SocialAdminActor;

const OWNER_EMAILS=new Set(['kheckfinancial@gmail.com','business@mrblindbandit.net']);

export function isSocialAdminEmail(email:string,env:Env){
  const e=(email||'').toLowerCase();
  if(OWNER_EMAILS.has(e))return true;
  const mods=[env.COMMUNITY_MODERATOR_EMAIL,env.CLERK_ADMIN_EMAIL].filter(Boolean).map((v:string)=>v.toLowerCase());
  return mods.includes(e);
}

export function assertSocialAdmin(actor:SocialActor,env:Env){
  if(!isSocialAdminEmail(actor.email,env))throw new ApiError(403,'ADMIN_REQUIRED','Moderator or operator access is required.');
}

async function adminAudit(env:Env,actor:SocialActor,action:string,targetType:string,targetId:string,payload:any,rid:string){
  await q(env,'INSERT INTO social_admin_audit(id,actor_email,actor_clerk_id,action,target_type,target_id,payload,request_id,created_at) VALUES(?,?,?,?,?,?,?,?,?)',
    uuid(),actor.email.toLowerCase(),actor.clerkUserId,action,targetType,targetId,JSON.stringify(payload||{}),rid,Date.now()).run();
}

export async function getModeration(env:Env,profileId:string){
  const row=await q(env,'SELECT * FROM social_moderation WHERE profile_id=?',profileId).first();
  return row||{profile_id:profileId,status:'active',ban_reason:'',suspended_until:null,mute_posts:0,mute_messages:0,calls_disabled:0,shadow_restricted:0,rate_limit_multiplier:1,feature_flags:'{}'};
}

/** Throws if profile cannot use the product (ban / active suspension). */
export async function assertNotBanned(env:Env,profileId:string){
  const m=await getModeration(env,profileId);
  if(m.status==='banned')throw new ApiError(403,'ACCOUNT_BANNED','This account has been permanently banned.'+(m.ban_reason?' Reason: '+m.ban_reason:''));
  if(m.status==='suspended'&&m.suspended_until&&m.suspended_until>Date.now())throw new ApiError(403,'ACCOUNT_SUSPENDED','This account is suspended until '+new Date(m.suspended_until).toISOString()+'.'+(m.ban_reason?' Reason: '+m.ban_reason:''));
  // Auto-clear expired suspension on read path
  if(m.status==='suspended'&&m.suspended_until&&m.suspended_until<=Date.now()){
    await q(env,"UPDATE social_moderation SET status='active',suspended_until=NULL,updated_at=? WHERE profile_id=?",Date.now(),profileId).run();
  }
  return m;
}

export async function assertCanPost(env:Env,profileId:string){
  const m=await assertNotBanned(env,profileId);
  if(m.mute_posts||m.shadow_restricted)throw new ApiError(403,'POSTING_RESTRICTED','Posting is restricted on this account.');
  return m;
}

export async function assertCanMessage(env:Env,profileId:string){
  const m=await assertNotBanned(env,profileId);
  if(m.mute_messages)throw new ApiError(403,'MESSAGING_RESTRICTED','Messaging is restricted on this account.');
  return m;
}

export async function assertCanCall(env:Env,profileId:string){
  const m=await assertNotBanned(env,profileId);
  if(m.calls_disabled)throw new ApiError(403,'CALLS_DISABLED','Calling is disabled for this account.');
  return m;
}

async function upsertModeration(env:Env,profileId:string,patch:Record<string,any>,actor:SocialActor){
  const cur=await getModeration(env,profileId);
  const next={...cur,...patch,profile_id:profileId,updated_at:Date.now(),updated_by:actor.email.toLowerCase()};
  await q(env,`INSERT INTO social_moderation(profile_id,status,ban_reason,suspended_until,mute_posts,mute_messages,calls_disabled,shadow_restricted,rate_limit_multiplier,feature_flags,updated_at,updated_by)
    VALUES(?,?,?,?,?,?,?,?,?,?,?,?)
    ON CONFLICT(profile_id) DO UPDATE SET status=excluded.status,ban_reason=excluded.ban_reason,suspended_until=excluded.suspended_until,mute_posts=excluded.mute_posts,mute_messages=excluded.mute_messages,calls_disabled=excluded.calls_disabled,shadow_restricted=excluded.shadow_restricted,rate_limit_multiplier=excluded.rate_limit_multiplier,feature_flags=excluded.feature_flags,updated_at=excluded.updated_at,updated_by=excluded.updated_by`,
    next.profile_id,next.status,next.ban_reason||'',next.suspended_until??null,next.mute_posts?1:0,next.mute_messages?1:0,next.calls_disabled?1:0,next.shadow_restricted?1:0,Math.max(1,Number(next.rate_limit_multiplier)||1),typeof next.feature_flags==='string'?next.feature_flags:JSON.stringify(next.feature_flags||{}),next.updated_at,next.updated_by).run();
  return getModeration(env,profileId);
}

export async function searchUsers(env:Env,url:URL){
  const p=page(url);
  const qtext=(url.searchParams.get('q')||'').trim().toLowerCase();
  const status=url.searchParams.get('status')||'';
  let rows:any[];
  if(qtext){
    rows=(await q(env,`SELECT p.*, m.status AS mod_status, m.ban_reason, m.suspended_until, m.mute_posts, m.calls_disabled, m.shadow_restricted
      FROM social_profiles p LEFT JOIN social_moderation m ON m.profile_id=p.id
      WHERE lower(p.handle) LIKE ? OR lower(p.email) LIKE ? OR lower(p.display_name) LIKE ? OR p.id=?
      ORDER BY p.created_at DESC LIMIT ? OFFSET ?`,'%'+qtext+'%','%'+qtext+'%','%'+qtext+'%',qtext,p.limit,p.offset).all()).results;
  }else if(status){
    rows=(await q(env,`SELECT p.*, m.status AS mod_status, m.ban_reason, m.suspended_until, m.mute_posts, m.calls_disabled, m.shadow_restricted
      FROM social_profiles p JOIN social_moderation m ON m.profile_id=p.id WHERE m.status=?
      ORDER BY m.updated_at DESC LIMIT ? OFFSET ?`,status,p.limit,p.offset).all()).results;
  }else{
    rows=(await q(env,`SELECT p.*, m.status AS mod_status, m.ban_reason, m.suspended_until, m.mute_posts, m.calls_disabled, m.shadow_restricted
      FROM social_profiles p LEFT JOIN social_moderation m ON m.profile_id=p.id
      ORDER BY p.created_at DESC LIMIT ? OFFSET ?`,p.limit,p.offset).all()).results;
  }
  return {items:(rows||[]).map((r:any)=>({
    id:r.id,handle:r.handle,email:r.email,display_name:r.display_name,verified:!!r.verified,is_artist:!!r.is_artist,
    monetization_status:r.monetization_status,created_at:r.created_at,
    moderation:{status:r.mod_status||'active',ban_reason:r.ban_reason||'',suspended_until:r.suspended_until||null,mute_posts:!!r.mute_posts,calls_disabled:!!r.calls_disabled,shadow_restricted:!!r.shadow_restricted}
  })),...p};
}

export async function banUser(env:Env,actor:SocialActor,profileId:string,data:any,rid:string){
  const profile=await q(env,'SELECT id,handle FROM social_profiles WHERE id=?',profileId).first();
  if(!profile)throw new ApiError(404,'NOT_FOUND','Profile not found.');
  if(profile.handle==='mrblindbandit')throw new ApiError(403,'PROTECTED_ACCOUNT','The official artist account cannot be banned from this panel.');
  const mod=await upsertModeration(env,profileId,{status:'banned',ban_reason:(data.reason||'Banned by moderator').slice(0,1000),suspended_until:null},actor);
  await adminAudit(env,actor,'user.ban','profile',profileId,{reason:data.reason},rid);
  // End active calls
  await q(env,"UPDATE social_calls SET status='ended',ended_at=? WHERE (caller_id=? OR callee_id=?) AND status IN ('ringing','active')",Date.now(),profileId,profileId).run();
  return {profile_id:profileId,moderation:mod};
}

export async function suspendUser(env:Env,actor:SocialActor,profileId:string,data:any,rid:string){
  const profile=await q(env,'SELECT id FROM social_profiles WHERE id=?',profileId).first();
  if(!profile)throw new ApiError(404,'NOT_FOUND','Profile not found.');
  const until=Number(data.until)|| (Date.now()+7*86400000);
  if(until<=Date.now())throw new ApiError(400,'INVALID_UNTIL','Suspension end must be in the future.');
  const mod=await upsertModeration(env,profileId,{status:'suspended',ban_reason:(data.reason||'Suspended').slice(0,1000),suspended_until:until},actor);
  await adminAudit(env,actor,'user.suspend','profile',profileId,{reason:data.reason,until},rid);
  return {profile_id:profileId,moderation:mod};
}

export async function reinstateUser(env:Env,actor:SocialActor,profileId:string,rid:string){
  const mod=await upsertModeration(env,profileId,{status:'active',ban_reason:'',suspended_until:null},actor);
  await adminAudit(env,actor,'user.reinstate','profile',profileId,{},rid);
  return {profile_id:profileId,moderation:mod};
}

export async function setRestrictions(env:Env,actor:SocialActor,profileId:string,data:any,rid:string){
  const patch:any={};
  if(typeof data.mute_posts==='boolean')patch.mute_posts=data.mute_posts;
  if(typeof data.mute_messages==='boolean')patch.mute_messages=data.mute_messages;
  if(typeof data.calls_disabled==='boolean')patch.calls_disabled=data.calls_disabled;
  if(typeof data.shadow_restricted==='boolean')patch.shadow_restricted=data.shadow_restricted;
  if(typeof data.rate_limit_multiplier==='number')patch.rate_limit_multiplier=Math.min(20,Math.max(1,Math.floor(data.rate_limit_multiplier)));
  if(data.feature_flags&&typeof data.feature_flags==='object')patch.feature_flags=JSON.stringify(data.feature_flags);
  const mod=await upsertModeration(env,profileId,patch,actor);
  await adminAudit(env,actor,'user.restrictions','profile',profileId,data,rid);
  return {profile_id:profileId,moderation:mod};
}

export async function forceVerify(env:Env,actor:SocialActor,profileId:string,approve:boolean,rid:string){
  const profile=await q(env,'SELECT id FROM social_profiles WHERE id=?',profileId).first();
  if(!profile)throw new ApiError(404,'NOT_FOUND','Profile not found.');
  const now=Date.now();
  if(approve){
    await q(env,'UPDATE social_profiles SET verified=1,verified_at=?,updated_at=? WHERE id=?',now,now,profileId).run();
    await q(env,"UPDATE social_verification SET status='approved',reviewed_at=?,reviewer_note=? WHERE profile_id=? AND status='pending'",now,'Force-verified by admin',profileId).run();
  }else{
    await q(env,'UPDATE social_profiles SET verified=0,verified_at=NULL,updated_at=? WHERE id=?',now,profileId).run();
  }
  await adminAudit(env,actor,approve?'user.force_verify':'user.revoke_verify','profile',profileId,{},rid);
  return {profile_id:profileId,verified:approve};
}

export async function hidePost(env:Env,actor:SocialActor,postId:string,hide:boolean,rid:string){
  const post=await q(env,'SELECT id FROM social_posts WHERE id=?',postId).first();
  if(!post)throw new ApiError(404,'NOT_FOUND','Post not found.');
  if(hide)await q(env,'UPDATE social_posts SET hidden=1,deleted_at=COALESCE(deleted_at,?) WHERE id=?',Date.now(),postId).run();
  else await q(env,'UPDATE social_posts SET hidden=0,deleted_at=NULL WHERE id=?',postId).run();
  await adminAudit(env,actor,hide?'post.hide':'post.unhide','post',postId,{},rid);
  return {id:postId,hidden:hide};
}

export async function deletePostAdmin(env:Env,actor:SocialActor,postId:string,rid:string){
  const post=await q(env,'SELECT id FROM social_posts WHERE id=?',postId).first();
  if(!post)throw new ApiError(404,'NOT_FOUND','Post not found.');
  await q(env,'UPDATE social_posts SET deleted_at=?,hidden=1 WHERE id=?',Date.now(),postId).run();
  await adminAudit(env,actor,'post.delete','post',postId,{},rid);
  return {deleted:true,id:postId};
}

export async function listReports(env:Env,url:URL){
  const p=page(url);
  const status=url.searchParams.get('status')||'open';
  const rows=(await q(env,'SELECT * FROM social_reports WHERE (?=\'\' OR status=?) ORDER BY created_at DESC LIMIT ? OFFSET ?',status,status,p.limit,p.offset).all()).results;
  return {items:rows||[],...p};
}

export async function createReport(env:Env,reporterId:string,data:any){
  const id=uuid();
  await q(env,"INSERT INTO social_reports(id,reporter_id,target_type,target_id,reason,details,status,created_at) VALUES(?,?,?,?,?,?,'open',?)",
    id,reporterId,(data.target_type||'post').slice(0,40),(data.target_id||'').slice(0,100),(data.reason||'').slice(0,200),(data.details||'').slice(0,2000),Date.now()).run();
  return {id,status:'open'};
}

export async function resolveReport(env:Env,actor:SocialActor,reportId:string,data:any,rid:string){
  const row=await q(env,'SELECT * FROM social_reports WHERE id=?',reportId).first();
  if(!row)throw new ApiError(404,'NOT_FOUND','Report not found.');
  const status=data.status==='escalated'?'escalated':data.status==='dismissed'?'dismissed':'resolved';
  await q(env,'UPDATE social_reports SET status=?,resolver_id=?,resolver_note=?,resolved_at=? WHERE id=?',status,actor.clerkUserId,(data.note||'').slice(0,1000),Date.now(),reportId).run();
  await adminAudit(env,actor,'report.'+status,'report',reportId,{note:data.note},rid);
  return {id:reportId,status};
}

export async function listVerificationQueue(env:Env,url:URL){
  const p=page(url);
  const status=url.searchParams.get('status')||'pending';
  const rows=(await q(env,`SELECT v.*, p.handle, p.display_name, p.email FROM social_verification v JOIN social_profiles p ON p.id=v.profile_id WHERE v.status=? ORDER BY v.created_at ASC LIMIT ? OFFSET ?`,status,p.limit,p.offset).all()).results;
  return {items:rows||[],...p};
}

export async function listAdminAudit(env:Env,url:URL){
  const p=page(url);
  const rows=(await q(env,'SELECT * FROM social_admin_audit ORDER BY created_at DESC LIMIT ? OFFSET ?',p.limit,p.offset).all()).results;
  return {items:rows||[],...p};
}

export async function inspectDevices(env:Env,profileId:string){
  const devices=(await q(env,'SELECT id,installation_id,platform,app_version,language,enabled,created_at,updated_at FROM platform_devices WHERE user_id=? ORDER BY updated_at DESC',profileId).all()).results||[];
  const web=(await q(env,'SELECT id,substr(endpoint,1,48) AS endpoint_prefix,user_agent,enabled,created_at,updated_at FROM web_push_subscriptions WHERE user_id=? ORDER BY updated_at DESC',profileId).all()).results||[];
  return {devices,web_push:web,note:'Raw push tokens are never returned. Use revoke to disable.'};
}

export async function revokeAllTokens(env:Env,actor:SocialActor,profileId:string,rid:string){
  await env.DB.batch([
    q(env,'UPDATE platform_devices SET enabled=0,updated_at=? WHERE user_id=?',Date.now(),profileId),
    q(env,'UPDATE web_push_subscriptions SET enabled=0,updated_at=? WHERE user_id=?',Date.now(),profileId)
  ]);
  await adminAudit(env,actor,'push.revoke_all','profile',profileId,{},rid);
  return {revoked:true};
}

export async function forceDisconnectCalls(env:Env,actor:SocialActor,profileId:string,rid:string){
  const r=await q(env,"UPDATE social_calls SET status='ended',ended_at=? WHERE (caller_id=? OR callee_id=?) AND status IN ('ringing','active')",Date.now(),profileId,profileId).run();
  await adminAudit(env,actor,'calls.force_disconnect','profile',profileId,{},rid);
  return {ended:true};
}

export async function reviewMonetization(env:Env,actor:SocialActor,profileId:string,data:any,rid:string){
  const status=data.approve?'approved':data.status||'rejected';
  await q(env,'UPDATE social_monetization SET status=?,updated_at=? WHERE profile_id=?',status,Date.now(),profileId).run();
  await q(env,'UPDATE social_profiles SET monetization_status=?,updated_at=? WHERE id=?',status,Date.now(),profileId).run();
  await adminAudit(env,actor,'monetization.review','profile',profileId,{status},rid);
  return {profile_id:profileId,status};
}

export async function reviewAd(env:Env,actor:SocialActor,adId:string,data:any,rid:string){
  const status=data.approve?'active':data.status||'rejected';
  await q(env,'UPDATE social_ads SET status=?,updated_at=? WHERE id=?',status,Date.now(),adId).run();
  await adminAudit(env,actor,'ad.review','ad',adId,{status},rid);
  return {id:adId,status};
}

export async function listPendingAds(env:Env,url:URL){
  const p=page(url);
  const rows=(await q(env,"SELECT * FROM social_ads WHERE status IN ('pending_review','draft') ORDER BY created_at DESC LIMIT ? OFFSET ?",p.limit,p.offset).all()).results;
  return {items:rows||[],...p};
}

export async function broadcast(env:Env,actor:SocialActor,data:any,rid:string){
  const id=uuid(),now=Date.now();
  const title=(data.title||'').slice(0,120),body=(data.body||'').slice(0,2000);
  if(!title||!body)throw new ApiError(400,'INVALID_INPUT','Title and body are required.');
  const deep=data.deep_link||'/mobile/';
  await q(env,'INSERT INTO social_announcements(id,title,body,audience,deep_link,created_by,created_at,published_at) VALUES(?,?,?,?,?,?,?,?)',
    id,title,body,data.audience||'all',deep,actor.email.toLowerCase(),now,now).run();
  // Fan-out in-app notifications to recent active profiles (capped)
  const targets=(await q(env,"SELECT id FROM social_profiles ORDER BY updated_at DESC LIMIT 200").all()).results||[];
  let sent=0;
  for(const t of targets){
    try{await notifyAndDeliver(env,actor.clerkUserId,{user_id:t.id,title,body,category:'announcement',deep_link:deep},rid);}catch{}
    sent++;
  }
  await adminAudit(env,actor,'broadcast.create','announcement',id,{audience:data.audience||'all',recipients:sent},rid);
  return {id,recipients_attempted:sent};
}

export async function adminOverview(env:Env){
  const profiles=(await q(env,'SELECT COUNT(*) AS n FROM social_profiles').first()).n;
  const posts=(await q(env,"SELECT COUNT(*) AS n FROM social_posts WHERE deleted_at IS NULL").first()).n;
  const openReports=(await q(env,"SELECT COUNT(*) AS n FROM social_reports WHERE status='open'").first()).n;
  const pendingVerify=(await q(env,"SELECT COUNT(*) AS n FROM social_verification WHERE status='pending'").first()).n;
  const banned=(await q(env,"SELECT COUNT(*) AS n FROM social_moderation WHERE status='banned'").first()).n;
  const suspended=(await q(env,"SELECT COUNT(*) AS n FROM social_moderation WHERE status='suspended'").first()).n;
  const pendingAds=(await q(env,"SELECT COUNT(*) AS n FROM social_ads WHERE status='pending_review'").first()).n;
  return {profiles,posts,open_reports:openReports,pending_verification:pendingVerify,banned,suspended,pending_ads:pendingAds,livekit_configured:!!(env.LIVEKIT_API_KEY&&env.LIVEKIT_API_SECRET),vapid_configured:!!(env.VAPID_PUBLIC_KEY||env.WEBPUSH_PUBLIC_KEY)};
}
