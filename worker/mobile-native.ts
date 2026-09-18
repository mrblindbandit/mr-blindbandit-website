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
    : await q(env,'SELECT id,handle,display_name,avatar_url,verified FROM social_profiles WHERE lower(handle)=? LIMIT 1',raw.replace(/^@/,'')).first();
  if(!row)throw new ApiError(404,'RECIPIENT_NOT_FOUND','No Blindbandit user was found for that email address or username.');
  return row;
}

/** Native mobile conveniences layered on the existing Clerk-only social API.
 * These routes intentionally accept either an exact email address or a Blindbandit handle,
 * then delegate to the established social message/call functions so permissions, audit,
 * persistence, push notifications, and LiveKit token minting remain centralized.
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
      return json({...result,recipient:{handle:target.handle,display_name:target.display_name}} ,201);
    }

    if(path==='/v1/mobile-native/calls'&&request.method==='POST'){
      const data=await input(request,8*1024);fields(data,['recipient','kind']);
      const target=await recipient(env,data.recipient);
      const kind=data.kind==='video'?'video':'voice';
      const result=await social.startCall(env,actor,{handle:target.handle,kind},rid);
      return json({...result,recipient:{handle:target.handle,display_name:target.display_name}},201);
    }

    throw new ApiError(404,'NOT_FOUND','Mobile-native route not found.');
  }catch(error){
    if(error instanceof ApiError)return json({error:{code:error.code,message:error.message},request_id:rid},error.status);
    console.error('mobile-native',rid,error);
    return json({error:{code:'INTERNAL_ERROR',message:'The request could not be completed.'},request_id:rid},500);
  }
}
