import {ApiError,q,uuid,hash,encrypt,decrypt,audit,type Env} from './core';
import {credentials} from './integrations';

const b64=(v:Uint8Array)=>btoa(String.fromCharCode(...v)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
const b64urlToBytes=(s:string)=>{const pad='='.repeat((4-(s.length%4))%4);const raw=atob((s+pad).replace(/-/g,'+').replace(/_/g,'/'));return Uint8Array.from(raw,c=>c.charCodeAt(0));};

async function jwt(header:any,payload:any,pem:string,kind:'ES256'|'RS256'){
  const alg=kind==='ES256'?{name:'ECDSA',namedCurve:'P-256'}:{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'};
  const raw=Uint8Array.from(atob(pem.replace(/-----[^-]+-----/g,'').replace(/\s/g,'')),c=>c.charCodeAt(0));
  const key=await crypto.subtle.importKey('pkcs8',raw,alg,false,['sign']);
  const text=b64(new TextEncoder().encode(JSON.stringify(header)))+'.'+b64(new TextEncoder().encode(JSON.stringify(payload)));
  const signature=await crypto.subtle.sign(kind==='ES256'?{name:'ECDSA',hash:'SHA-256'}:{name:'RSASSA-PKCS1-v1_5'},key,new TextEncoder().encode(text));
  return text+'.'+b64(new Uint8Array(signature));
}

export function deepLink(value:string){
  let url:URL;
  try{url=new URL(value,'https://mrblindbandit.net');}catch{throw new ApiError(400,'INVALID_LINK','Enter a website link.');}
  if(url.origin!=='https://mrblindbandit.net'||url.username||url.password)throw new ApiError(400,'INVALID_LINK','Use a link on mrblindbandit.net.');
  return url.href;
}

/** Register iOS APNs or Android FCM device token (apps + owner test). */
export async function register(env:Env,a:any,data:any,rid:string){
  const old=await q(env,'SELECT id FROM platform_devices WHERE user_id=? AND installation_id=?',a.id,data.installation_id).first();
  const id=old?.id||uuid(),tokenHash=await hash(data.token);
  const used=await q(env,'SELECT id,user_id FROM platform_devices WHERE token_hash=?',tokenHash).first();
  if(used&&used.id!==id)throw new ApiError(409,'DEVICE_ALREADY_REGISTERED','Unregister this installation from its previous account before pairing again.');
  if(!old&&(await q(env,'SELECT COUNT(*) AS n FROM platform_devices WHERE user_id=?',a.id).first()).n>=20)throw new ApiError(409,'DEVICE_LIMIT','Remove an old device before adding another.');
  if(data.platform==='ios'&&!/^[a-f0-9]{64,200}$/i.test(data.token))throw new ApiError(400,'INVALID_TOKEN','Enter a valid APNs device token.');
  if(data.platform==='android'&&data.token.length<32)throw new ApiError(400,'INVALID_TOKEN','Enter a valid FCM registration token.');
  const cipher=await encrypt(env,data.token,'push:'+id),now=Date.now();
  await env.DB.batch([
    q(env,'INSERT INTO platform_devices(id,user_id,installation_id,platform,token_cipher,token_hash,app_version,language,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?) ON CONFLICT(user_id,installation_id) DO UPDATE SET platform=excluded.platform,token_cipher=excluded.token_cipher,token_hash=excluded.token_hash,app_version=excluded.app_version,language=excluded.language,enabled=1,updated_at=excluded.updated_at',id,a.id,data.installation_id,data.platform,cipher,tokenHash,data.app_version,data.language,now,now),
    audit(env,a.id,'device.registered',id,rid)
  ]);
  return {id,registered:true,platform:data.platform};
}

export async function unregister(env:Env,a:any,data:any,rid:string){
  if(data.device_id){
    const row=await q(env,'DELETE FROM platform_devices WHERE id=? AND user_id=? RETURNING id',data.device_id,a.id).first();
    if(!row)throw new ApiError(404,'DEVICE_NOT_FOUND','Device not found.');
    await audit(env,a.id,'device.unregistered',data.device_id,rid).run();
    return {deleted:true};
  }
  if(data.installation_id){
    const row=await q(env,'DELETE FROM platform_devices WHERE installation_id=? AND user_id=? RETURNING id',data.installation_id,a.id).first();
    if(!row)throw new ApiError(404,'DEVICE_NOT_FOUND','Installation not found.');
    await audit(env,a.id,'device.unregistered',row.id,rid).run();
    return {deleted:true};
  }
  throw new ApiError(400,'INVALID_INPUT','Provide device_id or installation_id.');
}

/** Register a Web Push subscription (browser Push API). */
export async function registerWebPush(env:Env,a:any,data:any,rid:string){
  if(!data.endpoint||!data.keys?.p256dh||!data.keys?.auth)throw new ApiError(400,'INVALID_SUBSCRIPTION','Provide endpoint and keys.p256dh / keys.auth.');
  try{new URL(data.endpoint);}catch{throw new ApiError(400,'INVALID_ENDPOINT','Endpoint must be a valid HTTPS URL.');}
  const endpointHash=await hash(data.endpoint);
  const existing=await q(env,'SELECT id,user_id FROM web_push_subscriptions WHERE endpoint_hash=?',endpointHash).first();
  if(existing&&existing.user_id!==a.id)throw new ApiError(409,'SUBSCRIPTION_IN_USE','This browser subscription is linked to another account.');
  const id=existing?.id||uuid(),now=Date.now();
  const ua=(data.user_agent||'').slice(0,400);
  await env.DB.batch([
    q(env,'INSERT INTO web_push_subscriptions(id,user_id,endpoint_hash,endpoint,p256dh,auth,user_agent,enabled,created_at,updated_at) VALUES(?,?,?,?,?,?,?,1,?,?) ON CONFLICT(endpoint_hash) DO UPDATE SET user_id=excluded.user_id,endpoint=excluded.endpoint,p256dh=excluded.p256dh,auth=excluded.auth,user_agent=excluded.user_agent,enabled=1,updated_at=excluded.updated_at',id,a.id,endpointHash,data.endpoint,data.keys.p256dh,data.keys.auth,ua,now,now),
    audit(env,a.id,'webpush.registered',id,rid)
  ]);
  return {id,registered:true,platform:'web'};
}

export async function unregisterWebPush(env:Env,a:any,data:any,rid:string){
  if(data.endpoint){
    const row=await q(env,'DELETE FROM web_push_subscriptions WHERE endpoint_hash=? AND user_id=? RETURNING id',await hash(data.endpoint),a.id).first();
    if(!row)throw new ApiError(404,'SUBSCRIPTION_NOT_FOUND','Subscription not found.');
    await audit(env,a.id,'webpush.unregistered',row.id,rid).run();
    return {deleted:true};
  }
  if(data.subscription_id){
    const row=await q(env,'DELETE FROM web_push_subscriptions WHERE id=? AND user_id=? RETURNING id',data.subscription_id,a.id).first();
    if(!row)throw new ApiError(404,'SUBSCRIPTION_NOT_FOUND','Subscription not found.');
    await audit(env,a.id,'webpush.unregistered',data.subscription_id,rid).run();
    return {deleted:true};
  }
  throw new ApiError(400,'INVALID_INPUT','Provide endpoint or subscription_id.');
}

export async function listTopics(env:Env){
  return {items:(await q(env,'SELECT id,name,description,created_at FROM push_topics ORDER BY name').all()).results};
}

export async function listTopicSubscriptions(env:Env,userId:string){
  return {items:(await q(env,'SELECT t.id,t.name,t.description,s.created_at AS subscribed_at FROM push_topic_subscriptions s JOIN push_topics t ON t.id=s.topic_id WHERE s.user_id=? ORDER BY t.name',userId).all()).results};
}

export async function subscribeTopic(env:Env,a:any,topicName:string,rid:string){
  const topic=await q(env,'SELECT id,name FROM push_topics WHERE name=?',topicName).first();
  if(!topic)throw new ApiError(404,'TOPIC_NOT_FOUND','Unknown notification topic.');
  await env.DB.batch([
    q(env,'INSERT INTO push_topic_subscriptions(user_id,topic_id,created_at) VALUES(?,?,?) ON CONFLICT(user_id,topic_id) DO NOTHING',a.id,topic.id,Date.now()),
    audit(env,a.id,'topic.subscribed',topic.id,rid)
  ]);
  return {subscribed:true,topic:topic.name};
}

export async function unsubscribeTopic(env:Env,a:any,topicName:string,rid:string){
  const topic=await q(env,'SELECT id FROM push_topics WHERE name=?',topicName).first();
  if(!topic)throw new ApiError(404,'TOPIC_NOT_FOUND','Unknown notification topic.');
  await env.DB.batch([
    q(env,'DELETE FROM push_topic_subscriptions WHERE user_id=? AND topic_id=?',a.id,topic.id),
    audit(env,a.id,'topic.unsubscribed',topic.id,rid)
  ]);
  return {subscribed:false,topic:topicName};
}

async function deliverApnsFcm(env:Env,device:any,notification:any,environment:string){
  const token=await decrypt(env,device.token_cipher,'push:'+device.id);
  const provider=device.platform==='ios'?'apns':'fcm';
  const c=await credentials(env,provider,environment);
  if(!c)return {status:'not_configured',code:'NOT_CONFIGURED'};
  const now=Math.floor(Date.now()/1000);let response:Response;
  if(provider==='apns'){
    const signed=await jwt({alg:'ES256',kid:c.key_id},{iss:c.team_id,iat:now},c.private_key,'ES256');
    response=await fetch('https://'+(environment==='development'?'api.sandbox.push.apple.com':'api.push.apple.com')+'/3/device/'+encodeURIComponent(token),{method:'POST',headers:{authorization:'bearer '+signed,'apns-topic':c.bundle_id,'apns-push-type':'alert','apns-priority':'10','apns-expiration':String(now+3600),'content-type':'application/json'},body:JSON.stringify({aps:{alert:{title:notification.title,body:notification.body},sound:'default'},notification_id:notification.id,deep_link:notification.deep_link}),redirect:'error',signal:AbortSignal.timeout(15000)});
    if(response.ok){await response.body?.cancel();return {status:'sent',code:'ACCEPTED'};}
    const body:any=await response.json().catch(()=>({}));
    return {status:response.status===410?'invalid_token':'rejected',code:['Unregistered','BadDeviceToken','DeviceTokenNotForTopic','ExpiredProviderToken','InvalidProviderToken'].includes(body.reason)?body.reason:'APNS_'+response.status};
  }
  const account=JSON.parse(c.service_account_json);
  const assertion=await jwt({alg:'RS256',typ:'JWT'},{iss:account.client_email,scope:'https://www.googleapis.com/auth/firebase.messaging',aud:'https://oauth2.googleapis.com/token',iat:now,exp:now+3600},account.private_key,'RS256');
  const oauth=await fetch('https://oauth2.googleapis.com/token',{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body:new URLSearchParams({grant_type:'urn:ietf:params:oauth:grant-type:jwt-bearer',assertion}),redirect:'error',signal:AbortSignal.timeout(12000)});
  if(!oauth.ok){await oauth.body?.cancel();return {status:'provider_failure',code:'FCM_AUTH_FAILED'};}
  const auth:any=await oauth.json();
  if(typeof auth.access_token!=='string')return {status:'provider_failure',code:'FCM_AUTH_FAILED'};
  response=await fetch('https://fcm.googleapis.com/v1/projects/'+encodeURIComponent(c.project_id)+'/messages:send',{method:'POST',headers:{authorization:'Bearer '+auth.access_token,'content-type':'application/json'},body:JSON.stringify({message:{token,notification:{title:notification.title,body:notification.body},data:{notification_id:notification.id,deep_link:notification.deep_link}}}),redirect:'error',signal:AbortSignal.timeout(15000)});
  if(response.ok){await response.body?.cancel();return {status:'sent',code:'ACCEPTED'};}
  const result:any=await response.json().catch(()=>({}));
  const invalid=result.error?.details?.some((d:any)=>d.errorCode==='UNREGISTERED');
  return {status:invalid?'invalid_token':'rejected',code:invalid?'UNREGISTERED':'FCM_'+response.status};
}

/** Minimal Web Push (RFC 8291/8292) using VAPID — requires VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY / VAPID_SUBJECT. */
async function deliverWebPush(env:Env,sub:any,notification:any){
  const publicKey=env.VAPID_PUBLIC_KEY||env.WEBPUSH_PUBLIC_KEY;
  const privateKey=env.VAPID_PRIVATE_KEY||env.WEBPUSH_PRIVATE_KEY;
  const subject=env.VAPID_SUBJECT||env.WEBPUSH_CONTACT||'mailto:business@mrblindbandit.net';
  if(!publicKey||!privateKey)return {status:'not_configured',code:'VAPID_NOT_CONFIGURED'};
  // Prefer Integration Vault webpush credentials when present
  const vault=await credentials(env,'webpush','production').catch(()=>null);
  const vapidPub=vault?.public_key||publicKey;
  const vapidPriv=vault?.private_key||privateKey;
  const contact=vault?.contact||subject;
  try{
    const audience=new URL(sub.endpoint).origin;
    const now=Math.floor(Date.now()/1000);
    // Import VAPID private key (PKCS8 PEM or raw base64url)
    let signingKey:CryptoKey;
    if(vapidPriv.includes('PRIVATE KEY')){
      const raw=Uint8Array.from(atob(vapidPriv.replace(/-----[^-]+-----/g,'').replace(/\s/g,'')),c=>c.charCodeAt(0));
      signingKey=await crypto.subtle.importKey('pkcs8',raw,{name:'ECDSA',namedCurve:'P-256'},false,['sign']);
    }else{
      const raw=b64urlToBytes(vapidPriv);
      signingKey=await crypto.subtle.importKey('pkcs8',raw,{name:'ECDSA',namedCurve:'P-256'},false,['sign']).catch(async()=>{
        return crypto.subtle.importKey('raw',raw,{name:'ECDSA',namedCurve:'P-256'},false,['sign']);
      });
    }
    const header={alg:'ES256',typ:'JWT'};
    const payload={aud:audience,exp:now+12*3600,sub:contact};
    const unsigned=b64(new TextEncoder().encode(JSON.stringify(header)))+'.'+b64(new TextEncoder().encode(JSON.stringify(payload)));
    const sig=new Uint8Array(await crypto.subtle.sign({name:'ECDSA',hash:'SHA-256'},signingKey,new TextEncoder().encode(unsigned)));
    const vapidJwt=unsigned+'.'+b64(sig);
    const body=JSON.stringify({title:notification.title,body:notification.body,deep_link:notification.deep_link,notification_id:notification.id});
    const response=await fetch(sub.endpoint,{
      method:'POST',
      headers:{
        authorization:'vapid t='+vapidJwt+', k='+vapidPub,
        ttl:'60',
        'content-type':'application/octet-stream',
        'content-encoding':'aes128gcm',
        urgency:'high'
      },
      // Note: full RFC8291 encryption requires user agent crypto libraries; scaffold sends JWT-auth payload.
      // Production should wrap body with aes128gcm using p256dh/auth. Apps still receive FCM/APNs paths.
      body:new TextEncoder().encode(body),
      redirect:'error',
      signal:AbortSignal.timeout(15000)
    });
    if(response.ok||response.status===201||response.status===204){await response.body?.cancel();return {status:'sent',code:'ACCEPTED'};}
    if(response.status===404||response.status===410){await response.body?.cancel();return {status:'invalid_token',code:'GONE'};}
    await response.body?.cancel();
    return {status:'rejected',code:'WEBPUSH_'+response.status};
  }catch{
    return {status:'provider_failure',code:'WEBPUSH_FAILED'};
  }
}

export async function notify(env:Env,a:any,data:any,rid:string){
  const target=data.user_id||a.id;
  const label=await q(env,"SELECT id FROM label_members WHERE id=? AND status='active'",target).first();
  const social=label?null:await q(env,'SELECT id FROM social_profiles WHERE id=?',target).first();
  if(!label&&!social)throw new ApiError(404,'USER_NOT_FOUND','Account not found.');
  const id=uuid(),now=Date.now();
  const record={id,user_id:target,title:data.title,body:data.body,category:data.category,deep_link:deepLink(data.deep_link||'/mobile/')};
  await env.DB.batch([
    q(env,'INSERT INTO platform_notifications(id,user_id,title,body,category,deep_link,created_at) VALUES(?,?,?,?,?,?,?)',id,target,record.title,record.body,record.category,record.deep_link,now),
    audit(env,a.id,'notification.created',id,rid)
  ]);
  return record;
}

/** Create in-app notification and fan-out to all registered devices + web push for the target user. */
export async function notifyAndDeliver(env:Env,actorId:string,data:{user_id:string;title:string;body:string;category:string;deep_link?:string},rid:string,environment='production'){
  const a={id:actorId};
  const n=await notify(env,a,data,rid);
  const devices=(await q(env,'SELECT * FROM platform_devices WHERE user_id=? AND enabled=1',data.user_id).all()).results||[];
  const webs=(await q(env,'SELECT * FROM web_push_subscriptions WHERE user_id=? AND enabled=1',data.user_id).all()).results||[];
  const results:any[]=[];
  for(const device of devices){
    const deliveryId=uuid(),now=Date.now();
    await q(env,"INSERT INTO platform_deliveries(id,notification_id,device_id,status,created_at,updated_at) VALUES(?,?,?,'queued',?,?)",deliveryId,n.id,device.id,now,now).run();
    let result;try{result=await deliverApnsFcm(env,device,n,environment);}catch{result={status:'provider_failure',code:'DELIVERY_FAILED'};}
    const statements=[q(env,'UPDATE platform_deliveries SET status=?,provider_code=?,updated_at=? WHERE id=?',result.status,result.code,Date.now(),deliveryId)];
    if(result.status==='invalid_token')statements.push(q(env,'UPDATE platform_devices SET enabled=0 WHERE id=?',device.id));
    await env.DB.batch(statements);
    results.push({channel:device.platform,device_id:device.id,...result});
  }
  for(const sub of webs){
    const deliveryId=uuid(),now=Date.now();
    await q(env,"INSERT INTO platform_deliveries(id,notification_id,device_id,status,created_at,updated_at) VALUES(?,?,?,'queued',?,?)",deliveryId,n.id,sub.id,now,now).run();
    let result;try{result=await deliverWebPush(env,sub,n);}catch{result={status:'provider_failure',code:'WEBPUSH_FAILED'};}
    const statements=[q(env,'UPDATE platform_deliveries SET status=?,provider_code=?,updated_at=? WHERE id=?',result.status,result.code,Date.now(),deliveryId)];
    if(result.status==='invalid_token')statements.push(q(env,'UPDATE web_push_subscriptions SET enabled=0 WHERE id=?',sub.id));
    await env.DB.batch(statements);
    results.push({channel:'web',subscription_id:sub.id,...result});
  }
  return {notification:n,deliveries:results};
}

export async function pushTest(env:Env,a:any,data:any,rid:string){
  if(data.subscription_id){
    const sub=await q(env,'SELECT * FROM web_push_subscriptions WHERE id=? AND user_id=? AND enabled=1',data.subscription_id,a.id).first();
    if(!sub)throw new ApiError(404,'SUBSCRIPTION_NOT_FOUND','Select one of your own web push subscriptions.');
    const n=await notify(env,a,{title:'Blindbandit web push test',body:'Your browser received a test notification.',category:'system',deep_link:'/mobile/'},rid);
    const id=uuid(),now=Date.now();
    await q(env,"INSERT INTO platform_deliveries(id,notification_id,device_id,status,created_at,updated_at) VALUES(?,?,?,'queued',?,?)",id,n.id,sub.id,now,now).run();
    let result;try{result=await deliverWebPush(env,sub,n);}catch{result={status:'provider_failure',code:'WEBPUSH_FAILED'};}
    const statements=[q(env,'UPDATE platform_deliveries SET status=?,provider_code=?,updated_at=? WHERE id=?',result.status,result.code,Date.now(),id),audit(env,a.id,'push.test',sub.id,rid,result.status)];
    if(result.status==='invalid_token')statements.push(q(env,'UPDATE web_push_subscriptions SET enabled=0 WHERE id=?',sub.id));
    await env.DB.batch(statements);
    return {id,notification_id:n.id,status:result.status,provider_code:result.code,channel:'web'};
  }
  const device=await q(env,'SELECT * FROM platform_devices WHERE id=? AND user_id=? AND enabled=1',data.device_id,a.id).first();
  if(!device)throw new ApiError(404,'DEVICE_NOT_FOUND','Select one of your own registered devices.');
  const n=await notify(env,a,{title:'Blindbandit push test',body:'Your device received a test notification.',category:'system',deep_link:'/mobile/'},rid);
  const id=uuid(),now=Date.now();
  await q(env,"INSERT INTO platform_deliveries(id,notification_id,device_id,status,created_at,updated_at) VALUES(?,?,?,'queued',?,?)",id,n.id,device.id,now,now).run();
  let result;try{result=await deliverApnsFcm(env,device,n,data.environment);}catch{result={status:'provider_failure',code:'DELIVERY_FAILED'};}
  const statements=[q(env,'UPDATE platform_deliveries SET status=?,provider_code=?,updated_at=? WHERE id=?',result.status,result.code,Date.now(),id),audit(env,a.id,'push.test',device.id,rid,result.status)];
  if(result.status==='invalid_token')statements.push(q(env,'UPDATE platform_devices SET enabled=0 WHERE id=?',device.id));
  await env.DB.batch(statements);
  return {id,notification_id:n.id,status:result.status,provider_code:result.code,receipt_confirmed:false,channel:device.platform};
}

export function vapidPublicConfig(env:Env){
  const key=env.VAPID_PUBLIC_KEY||env.WEBPUSH_PUBLIC_KEY||'';
  return {vapid_public_key:key,configured:!!key,subject:env.VAPID_SUBJECT||'mailto:business@mrblindbandit.net'};
}
