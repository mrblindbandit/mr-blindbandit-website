import {invitedCommunity} from './account-admin';
import {clerkIdentity} from './clerk-auth';
export interface CommunityEnv {DB:any; COMMUNITY_MODERATOR_EMAIL?:string; CLERK_ADMIN_EMAIL?:string; CLERK_PUBLISHABLE_KEY?:string; NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?:string; CLERK_SECRET_KEY?:string; ASSETS:any; BUCKET?:any;}
const boards=['general','music','creators','announcements'];
const choices=['Ambient worlds','Hip-hop & beats','Creative process','Collaborations'];
const reply=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'}});
class InputError extends Error{constructor(message:string,public status=400){super(message);}}
function clean(v:unknown,max:number,min=1){if(typeof v!=='string'||v.trim().length<min||v.trim().length>max)throw new InputError(`Please use between ${min} and ${max} characters.`);return v.trim();}
async function person(request:Request,env:CommunityEnv){const clerk=await clerkIdentity(request,env as any).catch(()=>null);if(clerk)return {id:'clerk:'+clerk.clerkUserId,email:clerk.email,moderator:[env.COMMUNITY_MODERATOR_EMAIL,env.CLERK_ADMIN_EMAIL].some(value=>value?.toLowerCase()===clerk.email)};if(env.CLERK_SECRET_KEY)return null;const id=request.headers.get('oai-authenticated-user-id'),email=request.headers.get('oai-authenticated-user-email');return id&&email?{id,email,moderator:!!env.COMMUNITY_MODERATOR_EMAIL&&email.toLowerCase()===env.COMMUNITY_MODERATOR_EMAIL.toLowerCase()}:null;}
async function consume(db:any,key:string,limit:number,seconds:number){const window=Math.floor(Date.now()/1000/seconds);const row=await db.prepare('INSERT INTO community_limits (key,window,hits) VALUES (?,?,1) ON CONFLICT(key) DO UPDATE SET window=excluded.window,hits=CASE WHEN community_limits.window=excluded.window THEN community_limits.hits+1 ELSE 1 END WHERE community_limits.window<>excluded.window OR community_limits.hits<? RETURNING hits').bind(key,window,limit).first();if(!row)throw new InputError('Please wait before posting again.',429);}
export async function community(request:Request,env:CommunityEnv){
 const url=new URL(request.url),path=url.pathname.replace(/\/$/,''),db=env.DB;let user=await person(request,env);
 try{
 if(db&&user)user=await invitedCommunity(request,env,user);
 if(path==='/api/community/me'&&request.method==='GET'){const profile=user&&db?await db.prepare('SELECT display_name FROM community_profiles WHERE user_id=?').bind(user.id).first():null;return reply({signedIn:!!user,moderator:!!user?.moderator,displayName:profile?.display_name||''});}
 if(!db)throw new InputError('The community is temporarily unavailable. Please try again.',503);
 let data:any={};
 if(request.method!=='GET'){
  if(!user)throw new InputError('Sign in with Clerk to participate.',401);
  if(request.headers.get('origin')!==url.origin)throw new InputError('Please submit from this website.',403);
  if(!request.headers.get('content-type')?.includes('application/json'))throw new InputError('Send a JSON request.',415);
  const raw=await request.text();if(raw.length>12000)throw new InputError('Your message is too long.',413);
  try{data=JSON.parse(raw);}catch{throw new InputError('Invalid request.');}
 }
 if(path==='/api/community/profile'&&request.method==='POST'){const name=clean(data.displayName,40);await db.prepare('INSERT INTO community_profiles (user_id,display_name,created_at) VALUES (?,?,?) ON CONFLICT(user_id) DO UPDATE SET display_name=excluded.display_name').bind(user!.id,name,Date.now()).run();return reply({ok:true,displayName:name});}
 if(path==='/api/community/dashboard'&&request.method==='GET'){if(!user)throw new InputError('Sign in to view your dashboard.',401);const p=await db.prepare('SELECT id,title,board,created_at,hidden FROM community_posts WHERE author_id=? ORDER BY created_at DESC LIMIT 100').bind(user.id).all();const c=await db.prepare('SELECT c.id,c.post_id,c.body,c.created_at,p.title FROM community_comments c JOIN community_posts p ON p.id=c.post_id WHERE c.author_id=? AND p.hidden=0 ORDER BY c.created_at DESC LIMIT 100').bind(user.id).all();return reply({posts:p.results||[],comments:c.results||[]});}
 const publicPost=(p:any)=>({id:p.id,displayName:p.display_name,board:p.board,title:p.title,body:p.body,createdAt:p.created_at,comments:p.comments||0,canDelete:!!user&&(user.id===p.author_id||user.moderator)});
 if(path==='/api/community/posts'&&request.method==='GET'){
  const board=url.searchParams.get('board')||'',cursor=Number(url.searchParams.get('before'))||Date.now()+1;
  const found=await db.prepare('SELECT p.*, (SELECT COUNT(*) FROM community_comments c WHERE c.post_id=p.id) AS comments FROM community_posts p WHERE p.hidden=0 AND (?=\'\' OR p.board=?) AND p.created_at<? ORDER BY p.created_at DESC LIMIT 21').bind(board,board,cursor).all();
  const rows=found.results||[];return reply({posts:rows.slice(0,20).map(publicPost),next:rows.length>20?rows[19].created_at:null});
 }
 if(path==='/api/community/posts'&&request.method==='POST'){
  const name=clean(data.displayName,40),title=clean(data.title,120),body=clean(data.body,3000),board=clean(data.board,30);
  if(!boards.includes(board)||board==='announcements'&&!user!.moderator)throw new InputError('Choose a community board.',403);
  await consume(db,'posts-minute:'+user!.id,3,60);await consume(db,'posts-day:'+user!.id,30,86400);
  const id=crypto.randomUUID();await db.prepare('INSERT INTO community_posts (id,author_id,display_name,board,title,body,created_at,hidden) VALUES (?,?,?,?,?,?,?,0)').bind(id,user!.id,name,board,title,body,Date.now()).run();return reply({id},201);
 }
 const match=path.match(/^\/api\/community\/posts\/([a-f0-9-]+)(?:\/(comments|report))?$/);
 if(match){
  const id=match[1],action=match[2],post=await db.prepare('SELECT * FROM community_posts WHERE id=? AND hidden=0').bind(id).first();if(!post)throw new InputError('This discussion is no longer available.',404);
  if(request.method==='GET'&&!action){const comments=await db.prepare('SELECT * FROM community_comments WHERE post_id=? ORDER BY created_at LIMIT 200').bind(id).all();return reply({post:publicPost(post),comments:(comments.results||[]).map((c:any)=>({id:c.id,displayName:c.display_name,body:c.body,createdAt:c.created_at,canDelete:!!user&&(c.author_id===user.id||user.moderator)}))});}
  if(request.method==='DELETE'&&!action){if(post.author_id!==user!.id&&!user!.moderator)throw new InputError('You can only remove your own posts.',403);await db.prepare('UPDATE community_posts SET hidden=1 WHERE id=?').bind(id).run();return reply({ok:true});}
  if(request.method==='POST'&&action==='comments'){const name=clean(data.displayName,40),body=clean(data.body,2000);await consume(db,'comments-minute:'+user!.id,5,60);await consume(db,'comments-day:'+user!.id,100,86400);const cid=crypto.randomUUID();await db.prepare('INSERT INTO community_comments (id,post_id,author_id,display_name,body,created_at) VALUES (?,?,?,?,?,?)').bind(cid,id,user!.id,name,body,Date.now()).run();return reply({id:cid},201);}
  if(request.method==='POST'&&action==='report'){const reason=clean(data.reason,500);await consume(db,'reports:'+user!.id,10,86400);await db.prepare('INSERT INTO community_reports (id,post_id,reporter_id,reason,created_at) VALUES (?,?,?,?,?)').bind(crypto.randomUUID(),id,user!.id,reason,Date.now()).run();return reply({ok:true});}
 }
 const cm=path.match(/^\/api\/community\/comments\/([a-f0-9-]+)$/);
 if(cm&&request.method==='DELETE'){const c=await db.prepare('SELECT author_id FROM community_comments WHERE id=?').bind(cm[1]).first();if(!c)throw new InputError('Comment not found.',404);if(c.author_id!==user!.id&&!user!.moderator)throw new InputError('You can only remove your own comments.',403);await db.prepare('DELETE FROM community_comments WHERE id=?').bind(cm[1]).run();return reply({ok:true});}
 if(path==='/api/community/poll'){
  if(request.method==='POST'){const choice=clean(data.choice,50);if(!choices.includes(choice))throw new InputError('Choose a listed option.');await consume(db,'vote:'+user!.id,10,60);await db.prepare('INSERT INTO community_votes (poll_id,user_id,choice) VALUES (\'next-conversation\',?,?) ON CONFLICT(poll_id,user_id) DO UPDATE SET choice=excluded.choice').bind(user!.id,choice).run();}
  if(request.method==='POST'||request.method==='GET'){const counts=await db.prepare('SELECT choice,COUNT(*) AS count FROM community_votes WHERE poll_id=\'next-conversation\' GROUP BY choice').all();const own=user?await db.prepare('SELECT choice FROM community_votes WHERE poll_id=\'next-conversation\' AND user_id=?').bind(user.id).first():null;return reply({choices,counts:counts.results||[],choice:own?.choice||null});}
 }
 if(path==='/api/community/reports'&&request.method==='GET'){if(!user?.moderator)throw new InputError('Moderator access required.',403);const rows=await db.prepare('SELECT r.id,r.post_id,r.reason,r.created_at,p.title,p.hidden FROM community_reports r JOIN community_posts p ON p.id=r.post_id ORDER BY r.created_at DESC LIMIT 100').all();return reply({reports:rows.results||[]});}
 return reply({error:'Not found.'},404);
 }catch(e){if(e instanceof InputError)return reply({error:e.message},e.status);console.error('Community storage operation failed',e);return reply({error:'The community could not complete that request. Your text is still here; please try again.'},503);}
}
