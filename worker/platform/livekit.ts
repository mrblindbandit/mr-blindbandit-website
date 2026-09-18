import {ApiError,type Env} from './core';

const b64url=(data:ArrayBuffer|Uint8Array)=>{
  const bytes=data instanceof Uint8Array?data:new Uint8Array(data);
  let s='';for(let i=0;i<bytes.length;i++)s+=String.fromCharCode(bytes[i]);
  return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
};

async function signHs256(secret:string,data:string){
  const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);
  return b64url(await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(data)));
}

/** Mint a LiveKit access token. Secrets: LIVEKIT_API_KEY, LIVEKIT_API_SECRET, optional LIVEKIT_URL. */
export async function mintLiveKitToken(env:Env,opts:{identity:string;name?:string;room:string;canPublish?:boolean;canSubscribe?:boolean;ttlSeconds?:number;roomType?:'voice'|'video'|'data';metadata?:string}){
  const apiKey=env.LIVEKIT_API_KEY;
  const apiSecret=env.LIVEKIT_API_SECRET;
  if(!apiKey||!apiSecret)throw new ApiError(503,'LIVEKIT_NOT_CONFIGURED','LiveKit is not configured. Set LIVEKIT_API_KEY and LIVEKIT_API_SECRET on the Worker.');
  if(!/^[a-zA-Z0-9_\-.:@]{1,128}$/.test(opts.identity))throw new ApiError(400,'INVALID_IDENTITY','Identity must be 1–128 safe characters.');
  if(!/^[a-zA-Z0-9_\-.]{1,128}$/.test(opts.room))throw new ApiError(400,'INVALID_ROOM','Room name must be 1–128 safe characters.');
  const now=Math.floor(Date.now()/1000);
  const ttl=Math.min(Math.max(opts.ttlSeconds||3600,60),86400);
  const header={alg:'HS256',typ:'JWT'};
  const canPub=opts.canPublish!==false && opts.roomType!=='data';
  const video:any={roomJoin:true,room:opts.room,canPublish:canPub,canSubscribe:opts.canSubscribe!==false,canPublishData:true};
  if(opts.roomType==='data'){video.canPublish=false;}
  const payload:any={iss:apiKey,sub:opts.identity,nbf:now-10,exp:now+ttl,video,name:opts.name||opts.identity};
  if(opts.metadata)payload.metadata=String(opts.metadata).slice(0,512);
  const unsigned=b64url(new TextEncoder().encode(JSON.stringify(header)))+'.'+b64url(new TextEncoder().encode(JSON.stringify(payload)));
  const token=unsigned+'.'+await signHs256(apiSecret,unsigned);
  return {
    token,
    identity:opts.identity,
    room:opts.room,
    expires_at:(now+ttl)*1000,
    url:env.LIVEKIT_URL||'',
    room_type:opts.roomType||'video',
    server:'owner-livekit',
    configured:true,
    note:'Token minted for the Worker LIVEKIT_* secrets (owner LiveKit Cloud/server). Never expose LIVEKIT_API_SECRET to clients.'
  };
}

export function livekitPublicStatus(env:Env){
  return {
    configured:!!(env.LIVEKIT_API_KEY&&env.LIVEKIT_API_SECRET),
    url:env.LIVEKIT_URL?String(env.LIVEKIT_URL).replace(/^(wss?:\/\/)[^.]+\./,'$1***.'):'',
    docs:'Set LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET as Worker secrets. Never expose the API secret to browsers.'
  };
}
