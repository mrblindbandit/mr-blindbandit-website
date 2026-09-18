import {socialAuthenticate} from './platform/auth';
import {ApiError,fields,input,q,str,type Env} from './platform/core';
import * as social from './platform/social';

function json(value:any,status=200){
  return new Response(JSON.stringify(value),{
    status,
    headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}
  });
}

async function recipient(env:Env,value:string){
  const raw=str(value,254).toLowerCase();
  const row=raw.includes('@')
    ? await q(env,'SELECT id,handle,display_name,avatar_url,verified FROM social_profiles WHERE lower(email)=? LIMIT 1',raw).first()
    : await q(env,'SELECT id,handle,display_name,avatar_url,verified FROM social_profiles WHERE lower(handle)=? LIMIT 1',raw.replace(/^@/,'' )).first();
  if(!row)throw new ApiError(404,'RECIPIENT_NOT_FOUND','No Blindbandit user was found for that email address or username.');
  return row;
}

async function deleteAccountData(env:Env,actor:any){
  const profile=await q(env,'SELECT id FROM social_profiles WHERE clerk_user_id=? OR lower(email)=? LIMIT 1',actor.clerkUserId,actor.email.toLowerCase()).first();
  if(!profile)return {deleted:true,profile_found:false};
  const id=profile.id;
  const conversationIds=(await q(env,'SELECT id FROM social_conversations WHERE participant_a=? OR participant_b=?',id,id).all()).results.map((r:any)=>r.id);
  const deviceIds=(await q(env,'SELECT id FROM platform_devices WHERE user_id=?',id).all()).results.map((r:any)=>r.id);
  const statements:any[]=[];
  for(const conversationId of conversationIds)statements.push(q(env,'DELETE FROM social_messages WHERE conversation_id=?',conversationId));
  for(const deviceId of deviceIds)statements.push(q(env,'DELETE FROM platform_deliveries WHERE device_id=?',deviceId));
  statements.push(
    q(env,'DELETE FROM social_conversations WHERE participant_a=? OR participant_b=?',id,id),
    q(env,'DELETE FROM social_calls WHERE caller_id=? OR callee_id=?',id,id),
    q(env,'DELETE FROM social_follows WHERE follower_id=? OR following_id=?',id,id),
    q(env,'DELETE FROM social_posts WHERE author_id=?',id),
    q(env,'DELETE FROM social_verification WHERE profile_id=?',id),
    q(env,'DELETE FROM social_ads WHERE advertiser_id=?',id),
    q(env,'DELETE FROM social_monetization WHERE profile_id=?',id),
    q(env,'DELETE FROM social_moderation WHERE profile_id=?',id),
    q(env,'DELETE FROM social_reports WHERE reporter_id=?',id),
    q(env,'DELETE FROM push_topic_subscriptions WHERE user_id=?',id),
    q(env,'DELETE FROM web_push_subscriptions WHERE user_id=?',id),
    q(env,'DELETE FROM platform_notifications WHERE user_id=?',id),
    q(env,'DELETE FROM platform_devices WHERE user_id=?',id),
    q(env,'DELETE FROM platform_preferences WHERE user_id=?',id),
    q(env,'DELETE FROM platform_favorites WHERE user_id=?',id),
    q(env,'DELETE FROM platform_feedback WHERE user_id=?',id),
    q(env,'DELETE FROM platform_tickets WHERE user_id=?',id),
    q(env,'DELETE FROM social_profiles WHERE id=?',id)
  );
  await env.DB.batch(statements);
  return {deleted:true,profile_found:true};
}

/** Native mobile conveniences layered on the existing Clerk-only social API.
 * These routes accept an exact email address or Blindbandit handle and delegate to the
 * established social message/call functions so permissions, audit, persistence, push,
 * and LiveKit token minting remain centralized. Reusable provider secrets stay server-side.
 */
export async function mobileNativeApi(request:Request,env:Env):Promise<Response|null>{
  const url=new URL(request.url);
  const path=url.pathname.replace(/^\/api/,'');
  if(!path.startsWith('/v1/mobile-native/'))return null;
  if(request.method==='OPTIONS')return new Response(null,{status:204});
  const rid=request.headers.get('x-request-id')||crypto.randomUUID();
  try{
    const actor=await socialAuthenticate(request,env);

    if(path==='/v1/mobile-native/resolve'&&request.method==='GET'){
      const target=await recipient(env,url.searchParams.get('recipient')||'');
      return json({profile:{handle:target.handle,display_name:target.display_name,avatar_url:target.avatar_url,verified:!!target.verified}});
    }

    if(path==='/v1/mobile-native/messages'&&request.method==='POST'){
      const data=await input(request,16*1024);fields(data,['recipient','body']);
      const target=await recipient(env,data.recipient);
      const result=await social.sendMessage(env,actor,{handle:target.handle,body:str(data.body,4000)},rid);
      return json({...result,recipient:{handle:target.handle,display_name:target.display_name}},201);
    }

    if(path==='/v1/mobile-native/calls'&&request.method==='POST'){
      const data=await input(request,8*1024);fields(data,['recipient','kind']);
      const target=await recipient(env,data.recipient);
      const kind=data.kind==='video'?'video':'voice';
      const result=await social.startCall(env,actor,{handle:target.handle,kind},rid);
      return json({...result,recipient:{handle:target.handle,display_name:target.display_name}},201);
    }

    if(path==='/v1/mobile-native/account-data'&&request.method==='DELETE'){
      const data=await input(request,4096);fields(data,['confirmation']);
      if(data.confirmation!=='DELETE MY BLINDBANDIT DATA')throw new ApiError(400,'CONFIRMATION_REQUIRED','Confirm permanent account-data deletion.');
      return json(await deleteAccountData(env,actor));
    }

    throw new ApiError(404,'NOT_FOUND','Mobile-native route not found.');
  }catch(error){
    if(error instanceof ApiError)return json({error:{code:error.code,message:error.message},request_id:rid},error.status);
    console.error('mobile-native',rid,error);
    return json({error:{code:'INTERNAL_ERROR',message:'The request could not be completed.'},request_id:rid},500);
  }
}
