import {ApiError,q,uuid,audit,page,type Env} from './core';
import {notifyAndDeliver} from './notifications';
import {mintLiveKitToken} from './livekit';
import {assertCanPost,assertCanMessage,assertCanCall,assertNotBanned} from './social-admin';

export type SocialActor={id:string;clerkUserId:string;email:string;name:string;profileId?:string;handle?:string;verified?:boolean;isArtist?:boolean};

const OWNER_EMAIL='kheckfinancial@gmail.com';
const ARTIST_HANDLE='mrblindbandit';
const HANDLE_RE=/^[a-z0-9_]{3,30}$/;

function publicProfile(row:any){
  if(!row)return null;
  return {
    id:row.id,
    handle:row.handle,
    display_name:row.display_name,
    bio:row.bio,
    avatar_url:row.avatar_url,
    cover_url:row.cover_url,
    location:row.location,
    website:row.website,
    verified:!!row.verified,
    is_artist:!!row.is_artist,
    monetization_status:row.monetization_status,
    created_at:row.created_at
  };
}

export async function ensureSeedArtist(env:Env){
  const existing=await q(env,'SELECT id FROM social_profiles WHERE handle=?',ARTIST_HANDLE).first();
  if(existing)return existing.id;
  const now=Date.now();
  await q(env,"INSERT INTO social_profiles(id,clerk_user_id,email,handle,display_name,bio,avatar_url,cover_url,location,website,verified,verified_at,is_artist,monetization_status,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,1,?,1,'approved',?,?)",
    'profile_mr_blindbandit','seed:kheckfinancial',OWNER_EMAIL,ARTIST_HANDLE,'Mr. Blindbandit',
    'Blind artist, producer, and founder of Blindbandit Records. Official verified artist profile on Blindbandit Mobile.',
    '/assets/mobile-artist.jpg','/assets/mobile-cover.jpg','Davao del Norte, Philippines','https://mrblindbandit.net',now,now,now).run();
  return 'profile_mr_blindbandit';
}

export async function getOrCreateProfile(env:Env,actor:SocialActor,data?:any){
  await ensureSeedArtist(env);
  let row=await q(env,'SELECT * FROM social_profiles WHERE clerk_user_id=? OR lower(email)=?',actor.clerkUserId,actor.email.toLowerCase()).first();
  if(row){
    // Link seed artist when owner signs in with Clerk
    if(actor.email.toLowerCase()===OWNER_EMAIL&&row.handle===ARTIST_HANDLE&&row.clerk_user_id.startsWith('seed:')){
      await q(env,'UPDATE social_profiles SET clerk_user_id=?,email=?,updated_at=? WHERE id=?',actor.clerkUserId,actor.email.toLowerCase(),Date.now(),row.id).run();
      row={...row,clerk_user_id:actor.clerkUserId,email:actor.email.toLowerCase()};
    }
    await assertNotBanned(env,row.id).catch(e=>{if(e instanceof ApiError && (e.code==='ACCOUNT_BANNED'||e.code==='ACCOUNT_SUSPENDED'))throw e;return null;});
    return row;
  }
  const handle=(data?.handle||actor.email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g,'_').slice(0,24)||('user_'+uuid().slice(0,8))).toLowerCase();
  if(!HANDLE_RE.test(handle))throw new ApiError(400,'INVALID_HANDLE','Handle must be 3–30 lowercase letters, numbers, or underscores.');
  const taken=await q(env,'SELECT id FROM social_profiles WHERE handle=?',handle).first();
  if(taken)throw new ApiError(409,'HANDLE_TAKEN','That handle is already in use. Choose another.');
  const id=uuid(),now=Date.now();
  const display=data?.display_name||actor.name||handle;
  const verified=actor.email.toLowerCase()===OWNER_EMAIL?1:0;
  await q(env,'INSERT INTO social_profiles(id,clerk_user_id,email,handle,display_name,bio,avatar_url,cover_url,location,website,verified,verified_at,is_artist,monetization_status,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
    id,actor.clerkUserId,actor.email.toLowerCase(),handle,display,data?.bio||'','/assets/app-icon-gold-black-v1.jpg','/assets/empty-state-castle-aurora-v1.jpg','','',verified,verified?now:null,verified?1:0,'none',now,now).run();
  if(verified){
    // Migrate seed posts ownership if any leftover
    await q(env,"UPDATE social_posts SET author_id=? WHERE author_id='profile_mr_blindbandit'",id).run().catch(()=>{});
  }
  return q(env,'SELECT * FROM social_profiles WHERE id=?',id).first();
}

export async function requireProfile(env:Env,actor:SocialActor){
  const row=await q(env,'SELECT * FROM social_profiles WHERE clerk_user_id=? OR lower(email)=?',actor.clerkUserId,actor.email.toLowerCase()).first();
  if(!row)throw new ApiError(404,'PROFILE_REQUIRED','Create a Blindbandit Mobile profile first.');
  return row;
}

export async function updateProfile(env:Env,actor:SocialActor,data:any,rid:string){
  const me=await requireProfile(env,actor);
  const fields:string[]=[];const values:any[]=[];
  for(const key of ['display_name','bio','avatar_url','cover_url','location','website'] as const){
    if(typeof data[key]==='string'){fields.push(key+'=?');values.push(data[key].trim().slice(0,key==='bio'?2000:500));}
  }
  if(typeof data.handle==='string'&&data.handle!==me.handle){
    const handle=data.handle.toLowerCase().trim();
    if(!HANDLE_RE.test(handle))throw new ApiError(400,'INVALID_HANDLE','Handle must be 3–30 lowercase letters, numbers, or underscores.');
    if(await q(env,'SELECT id FROM social_profiles WHERE handle=? AND id<>?',handle,me.id).first())throw new ApiError(409,'HANDLE_TAKEN','That handle is already in use.');
    fields.push('handle=?');values.push(handle);
  }
  if(!fields.length)return publicProfile(me);
  values.push(Date.now(),me.id);
  await env.DB.batch([q(env,'UPDATE social_profiles SET '+fields.join(',')+',updated_at=? WHERE id=?',...values),audit(env,me.id,'social.profile_updated',me.id,rid)]);
  return publicProfile(await q(env,'SELECT * FROM social_profiles WHERE id=?',me.id).first());
}

export async function getProfileByHandle(env:Env,handle:string){
  await ensureSeedArtist(env);
  const row=await q(env,'SELECT * FROM social_profiles WHERE handle=?',handle.toLowerCase()).first();
  if(!row)throw new ApiError(404,'NOT_FOUND','Profile not found.');
  const followers=(await q(env,'SELECT COUNT(*) AS n FROM social_follows WHERE following_id=?',row.id).first()).n;
  const following=(await q(env,'SELECT COUNT(*) AS n FROM social_follows WHERE follower_id=?',row.id).first()).n;
  const posts=(await q(env,'SELECT COUNT(*) AS n FROM social_posts WHERE author_id=? AND deleted_at IS NULL',row.id).first()).n;
  return {...publicProfile(row),followers,following,posts};
}

export async function createPost(env:Env,actor:SocialActor,data:any,rid:string){
  const me=await getOrCreateProfile(env,actor);
  await assertCanPost(env,me.id);
  const body=(data.body||'').trim();
  if(body.length<1||body.length>4000)throw new ApiError(400,'INVALID_INPUT','Post body must be 1–4000 characters.');
  const id=uuid(),now=Date.now();
  const media=JSON.stringify(Array.isArray(data.media)?data.media.slice(0,8):[]);
  await env.DB.batch([
    q(env,"INSERT INTO social_posts(id,author_id,body,media_json,visibility,created_at,updated_at) VALUES(?,?,?,?,'public',?,?)",id,me.id,body,media,now,now),
    audit(env,me.id,'social.post_created',id,rid)
  ]);
  return {id,author_id:me.id,body,created_at:now};
}

export async function listFeed(env:Env,url:URL,viewer?:SocialActor){
  await ensureSeedArtist(env);
  const p=page(url);
  const mode=url.searchParams.get('mode')||'public';
  let rows:any[];
  if(mode==='following'&&viewer){
    const me=await q(env,'SELECT id FROM social_profiles WHERE clerk_user_id=?',viewer.clerkUserId).first();
    if(!me)rows=[];
    else rows=(await q(env,"SELECT p.*,pr.handle,pr.display_name,pr.avatar_url,pr.verified FROM social_posts p JOIN social_profiles pr ON pr.id=p.author_id JOIN social_follows f ON f.following_id=p.author_id WHERE f.follower_id=? AND p.deleted_at IS NULL AND IFNULL(p.hidden,0)=0 AND p.visibility='public' ORDER BY p.created_at DESC LIMIT ? OFFSET ?",me.id,p.limit,p.offset).all()).results;
  }else{
    rows=(await q(env,"SELECT p.*,pr.handle,pr.display_name,pr.avatar_url,pr.verified FROM social_posts p JOIN social_profiles pr ON pr.id=p.author_id WHERE p.deleted_at IS NULL AND IFNULL(p.hidden,0)=0 AND p.visibility='public' ORDER BY p.created_at DESC LIMIT ? OFFSET ?",p.limit,p.offset).all()).results;
  }
  return {items:(rows||[]).map((r:any)=>({id:r.id,body:r.body,media:JSON.parse(r.media_json||'[]'),created_at:r.created_at,author:{id:r.author_id,handle:r.handle,display_name:r.display_name,avatar_url:r.avatar_url,verified:!!r.verified}})),...p};
}

export async function listProfilePosts(env:Env,handle:string,url:URL){
  const profile=await getProfileByHandle(env,handle);
  const p=page(url);
  const rows=(await q(env,'SELECT id,body,media_json,created_at FROM social_posts WHERE author_id=? AND deleted_at IS NULL AND IFNULL(hidden,0)=0 ORDER BY created_at DESC LIMIT ? OFFSET ?',profile.id,p.limit,p.offset).all()).results;
  return {profile,items:(rows||[]).map((r:any)=>({id:r.id,body:r.body,media:JSON.parse(r.media_json||'[]'),created_at:r.created_at})),...p};
}

export async function deletePost(env:Env,actor:SocialActor,postId:string,rid:string){
  const me=await requireProfile(env,actor);
  const post=await q(env,'SELECT * FROM social_posts WHERE id=? AND deleted_at IS NULL',postId).first();
  if(!post)throw new ApiError(404,'NOT_FOUND','Post not found.');
  if(post.author_id!==me.id&&actor.email.toLowerCase()!==OWNER_EMAIL)throw new ApiError(403,'FORBIDDEN','You can only delete your own posts.');
  await env.DB.batch([q(env,'UPDATE social_posts SET deleted_at=? WHERE id=?',Date.now(),postId),audit(env,me.id,'social.post_deleted',postId,rid)]);
  return {deleted:true};
}

export async function follow(env:Env,actor:SocialActor,handle:string,rid:string){
  const me=await getOrCreateProfile(env,actor);
  const target=await q(env,'SELECT * FROM social_profiles WHERE handle=?',handle.toLowerCase()).first();
  if(!target)throw new ApiError(404,'NOT_FOUND','Profile not found.');
  if(target.id===me.id)throw new ApiError(400,'INVALID_INPUT','You cannot follow yourself.');
  await env.DB.batch([
    q(env,'INSERT INTO social_follows(follower_id,following_id,created_at) VALUES(?,?,?) ON CONFLICT(follower_id,following_id) DO NOTHING',me.id,target.id,Date.now()),
    audit(env,me.id,'social.followed',target.id,rid)
  ]);
  try{await notifyAndDeliver(env,me.id,{user_id:target.id,title:'New follower',body:me.display_name+' followed you',category:'community',deep_link:'/mobile/u/'+me.handle},rid);}catch{}
  return {following:true};
}

export async function unfollow(env:Env,actor:SocialActor,handle:string,rid:string){
  const me=await requireProfile(env,actor);
  const target=await q(env,'SELECT id FROM social_profiles WHERE handle=?',handle.toLowerCase()).first();
  if(!target)throw new ApiError(404,'NOT_FOUND','Profile not found.');
  await q(env,'DELETE FROM social_follows WHERE follower_id=? AND following_id=?',me.id,target.id).run();
  return {following:false};
}

function pairIds(a:string,b:string){return a<b?[a,b]:[b,a];}

export async function getOrCreateConversation(env:Env,meId:string,otherId:string){
  const [a,b]=pairIds(meId,otherId);
  let row=await q(env,'SELECT * FROM social_conversations WHERE participant_a=? AND participant_b=?',a,b).first();
  if(row)return row;
  const id=uuid(),now=Date.now();
  await q(env,'INSERT INTO social_conversations(id,participant_a,participant_b,updated_at,created_at) VALUES(?,?,?,?,?)',id,a,b,now,now).run();
  return q(env,'SELECT * FROM social_conversations WHERE id=?',id).first();
}

export async function sendMessage(env:Env,actor:SocialActor,data:any,rid:string){
  const me=await getOrCreateProfile(env,actor);
  await assertCanMessage(env,me.id);
  const other=await q(env,'SELECT * FROM social_profiles WHERE handle=?',(data.handle||'').toLowerCase()).first();
  if(!other)throw new ApiError(404,'NOT_FOUND','Recipient not found.');
  const body=(data.body||'').trim();
  if(body.length<1||body.length>4000)throw new ApiError(400,'INVALID_INPUT','Message must be 1–4000 characters.');
  const conv=await getOrCreateConversation(env,me.id,other.id);
  const id=uuid(),now=Date.now();
  await env.DB.batch([
    q(env,'INSERT INTO social_messages(id,conversation_id,sender_id,body,created_at) VALUES(?,?,?,?,?)',id,conv.id,me.id,body,now),
    q(env,'UPDATE social_conversations SET updated_at=? WHERE id=?',now,conv.id),
    audit(env,me.id,'social.message_sent',id,rid)
  ]);
  try{await notifyAndDeliver(env,me.id,{user_id:other.id,title:'New message',body:me.display_name+': '+body.slice(0,120),category:'message',deep_link:'/mobile/messages/?c='+conv.id},rid);}catch{}
  return {id,conversation_id:conv.id,created_at:now};
}

export async function listConversations(env:Env,actor:SocialActor,url:URL){
  const me=await requireProfile(env,actor);
  const p=page(url);
  const rows=(await q(env,'SELECT * FROM social_conversations WHERE participant_a=? OR participant_b=? ORDER BY updated_at DESC LIMIT ? OFFSET ?',me.id,me.id,p.limit,p.offset).all()).results||[];
  const items=[];
  for(const c of rows){
    const otherId=c.participant_a===me.id?c.participant_b:c.participant_a;
    const other=await q(env,'SELECT handle,display_name,avatar_url,verified FROM social_profiles WHERE id=?',otherId).first();
    const last=await q(env,'SELECT body,created_at,sender_id FROM social_messages WHERE conversation_id=? ORDER BY created_at DESC LIMIT 1',c.id).first();
    items.push({id:c.id,updated_at:c.updated_at,other:other||null,last_message:last||null});
  }
  return {items,...p};
}

export async function listMessages(env:Env,actor:SocialActor,conversationId:string,url:URL){
  const me=await requireProfile(env,actor);
  const conv=await q(env,'SELECT * FROM social_conversations WHERE id=?',conversationId).first();
  if(!conv||(conv.participant_a!==me.id&&conv.participant_b!==me.id))throw new ApiError(404,'NOT_FOUND','Conversation not found.');
  const p=page(url);
  const rows=(await q(env,'SELECT id,sender_id,body,created_at,read_at FROM social_messages WHERE conversation_id=? ORDER BY created_at DESC LIMIT ? OFFSET ?',conversationId,p.limit,p.offset).all()).results;
  return {items:rows||[],...p};
}

export async function startCall(env:Env,actor:SocialActor,data:any,rid:string){
  const me=await getOrCreateProfile(env,actor);
  await assertCanCall(env,me.id);
  const other=await q(env,'SELECT * FROM social_profiles WHERE handle=?',(data.handle||'').toLowerCase()).first();
  if(!other)throw new ApiError(404,'NOT_FOUND','Callee not found.');
  const kind=data.kind==='video'?'video':'voice';
  const id=uuid(),room='call_'+id.replace(/-/g,'').slice(0,20),now=Date.now();
  await env.DB.batch([
    q(env,"INSERT INTO social_calls(id,room_name,caller_id,callee_id,kind,status,created_at) VALUES(?,?,?,?,?,'ringing',?)",id,room,me.id,other.id,kind,now),
    audit(env,me.id,'social.call_started',id,rid)
  ]);
  const token=await mintLiveKitToken(env,{identity:me.id,name:me.display_name,room,canPublish:true,canSubscribe:true,ttlSeconds:7200});
  try{await notifyAndDeliver(env,me.id,{user_id:other.id,title:kind==='video'?'Incoming video call':'Incoming voice call',body:me.display_name+' is calling',category:'message',deep_link:'/mobile/calls/?id='+id},rid);}catch{}
  return {id,room,kind,status:'ringing',livekit:token};
}

export async function joinCall(env:Env,actor:SocialActor,callId:string){
  const me=await requireProfile(env,actor);
  await assertCanCall(env,me.id);
  const call=await q(env,'SELECT * FROM social_calls WHERE id=?',callId).first();
  if(!call)throw new ApiError(404,'NOT_FOUND','Call not found.');
  if(call.caller_id!==me.id&&call.callee_id!==me.id)throw new ApiError(403,'FORBIDDEN','Not a participant.');
  if(call.status==='ended')throw new ApiError(409,'CALL_ENDED','This call has ended.');
  await q(env,"UPDATE social_calls SET status='active' WHERE id=? AND status='ringing'",callId).run();
  const token=await mintLiveKitToken(env,{identity:me.id,name:me.display_name,room:call.room_name,canPublish:true,canSubscribe:true,ttlSeconds:7200});
  return {id:call.id,room:call.room_name,kind:call.kind,status:'active',livekit:token};
}

export async function endCall(env:Env,actor:SocialActor,callId:string,rid:string){
  const me=await requireProfile(env,actor);
  const call=await q(env,'SELECT * FROM social_calls WHERE id=?',callId).first();
  if(!call||(call.caller_id!==me.id&&call.callee_id!==me.id))throw new ApiError(404,'NOT_FOUND','Call not found.');
  await env.DB.batch([q(env,"UPDATE social_calls SET status='ended',ended_at=? WHERE id=?",Date.now(),callId),audit(env,me.id,'social.call_ended',callId,rid)]);
  return {ended:true};
}

export async function applyVerification(env:Env,actor:SocialActor,data:any,rid:string){
  const me=await getOrCreateProfile(env,actor);
  const pending=await q(env,"SELECT id FROM social_verification WHERE profile_id=? AND status='pending'",me.id).first();
  if(pending)throw new ApiError(409,'ALREADY_PENDING','You already have a pending verification application.');
  const id=uuid(),now=Date.now();
  await env.DB.batch([
    q(env,"INSERT INTO social_verification(id,profile_id,status,evidence,created_at) VALUES(?,?,?,?,?)",id,me.id,'pending',(data.evidence||'').slice(0,4000),now),
    audit(env,me.id,'social.verification_applied',id,rid)
  ]);
  return {id,status:'pending'};
}

export async function reviewVerification(env:Env,actor:SocialActor,appId:string,data:any,rid:string){
  if(actor.email.toLowerCase()!==OWNER_EMAIL&&actor.email.toLowerCase()!=='business@mrblindbandit.net')throw new ApiError(403,'OWNER_REQUIRED','Only the operator can review verification.');
  const app=await q(env,'SELECT * FROM social_verification WHERE id=?',appId).first();
  if(!app)throw new ApiError(404,'NOT_FOUND','Application not found.');
  const status=data.approve?'approved':'rejected';
  const now=Date.now();
  const statements=[q(env,'UPDATE social_verification SET status=?,reviewer_note=?,reviewed_at=? WHERE id=?',status,(data.note||'').slice(0,1000),now,appId)];
  if(data.approve)statements.push(q(env,'UPDATE social_profiles SET verified=1,verified_at=?,updated_at=? WHERE id=?',now,now,app.profile_id));
  statements.push(audit(env,actor.clerkUserId,'social.verification_reviewed',appId,rid,status));
  await env.DB.batch(statements);
  return {id:appId,status};
}

export async function applyMonetization(env:Env,actor:SocialActor,data:any,rid:string){
  const me=await getOrCreateProfile(env,actor);
  const id=uuid(),now=Date.now();
  await env.DB.batch([
    q(env,"INSERT INTO social_monetization(id,profile_id,status,payout_email,notes,created_at,updated_at) VALUES(?,?,?,?,?,?,?) ON CONFLICT(profile_id) DO UPDATE SET status='applied',payout_email=excluded.payout_email,notes=excluded.notes,updated_at=excluded.updated_at",id,me.id,'applied',(data.payout_email||actor.email).slice(0,200),(data.notes||'').slice(0,2000),now,now),
    q(env,"UPDATE social_profiles SET monetization_status='applied',updated_at=? WHERE id=?",now,me.id),
    audit(env,me.id,'social.monetization_applied',me.id,rid)
  ]);
  return {status:'applied'};
}

export async function createAd(env:Env,actor:SocialActor,data:any,rid:string){
  const me=await getOrCreateProfile(env,actor);
  const id=uuid(),now=Date.now();
  await env.DB.batch([
    q(env,"INSERT INTO social_ads(id,advertiser_id,title,body,target_url,status,budget_cents,created_at,updated_at) VALUES(?,?,?,?,?,'pending_review',?,?,?)",id,me.id,(data.title||'').slice(0,120),(data.body||'').slice(0,1000),(data.target_url||'').slice(0,500),Math.max(0,Number(data.budget_cents)||0),now,now),
    audit(env,me.id,'social.ad_created',id,rid)
  ]);
  return {id,status:'pending_review'};
}

export async function listAds(env:Env,url:URL){
  const p=page(url);
  const rows=(await q(env,"SELECT id,title,body,target_url,status,created_at FROM social_ads WHERE status='active' ORDER BY created_at DESC LIMIT ? OFFSET ?",p.limit,p.offset).all()).results;
  return {items:rows||[],...p};
}

export async function explore(env:Env,url:URL){
  await ensureSeedArtist(env);
  const p=page(url);
  const qtext=(url.searchParams.get('q')||'').trim().toLowerCase();
  let profiles:any[];
  if(qtext){
    profiles=(await q(env,"SELECT id,handle,display_name,avatar_url,verified,is_artist,bio FROM social_profiles WHERE lower(handle) LIKE ? OR lower(display_name) LIKE ? ORDER BY verified DESC,display_name LIMIT ? OFFSET ?",'%'+qtext+'%','%'+qtext+'%',p.limit,p.offset).all()).results;
  }else{
    profiles=(await q(env,'SELECT id,handle,display_name,avatar_url,verified,is_artist,bio FROM social_profiles ORDER BY verified DESC,created_at DESC LIMIT ? OFFSET ?',p.limit,p.offset).all()).results;
  }
  return {items:(profiles||[]).map((r:any)=>({...r,verified:!!r.verified,is_artist:!!r.is_artist})),...p};
}

export function spotifyArtistCatalog(){
  return {
    artist_url:'https://open.spotify.com/artist/04HZ4GubB66CqMpJrHysy3',
    artist_id:'04HZ4GubB66CqMpJrHysy3',
    embed_artist:'https://open.spotify.com/embed/artist/04HZ4GubB66CqMpJrHysy3?utm_source=generator',
    // Public Spotify embed iframes provide playable previews in-browser
    featured:[
      {title:'Mr. Blindbandit on Spotify',embed:'https://open.spotify.com/embed/artist/04HZ4GubB66CqMpJrHysy3?utm_source=generator&theme=0'},
    ],
    note:'Playable previews are provided by Spotify embeds. Full streaming requires a Spotify account where applicable.'
  };
}

