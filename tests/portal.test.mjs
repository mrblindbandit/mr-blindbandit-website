import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync,readdirSync} from 'node:fs';
import {build} from 'esbuild';
await build({entryPoints:['worker/portal.ts'],bundle:true,platform:'node',format:'esm',packages:'external',outfile:'.sites-runtime/portal-test.mjs'});
const {portal,portalPage}=await import('../.sites-runtime/portal-test.mjs');
function setup(){const sql=new DatabaseSync(':memory:');for(const f of readdirSync('drizzle').filter(f=>f.endsWith('.sql')).sort())sql.exec(readFileSync('drizzle/'+f,'utf8'));const DB={prepare(statement){const bound=(params=[])=>({bind(...v){return bound(v);},async first(){return sql.prepare(statement).get(...params)||null;},async all(){return {results:sql.prepare(statement).all(...params)};},async raw(){const stmt=sql.prepare(statement);stmt.setReturnArrays(true);return stmt.all(...params);},async run(){return {meta:sql.prepare(statement).run(...params),success:true};}});return bound();},async batch(statements){sql.exec('BEGIN');try{const values=[];for(const s of statements)values.push(await s.all());sql.exec('COMMIT');return values;}catch(e){sql.exec('ROLLBACK');throw e;}}};const files=new Map();const env={DB,BUCKET:{async put(k,s){files.set(k,await new Response(s).arrayBuffer());},async get(k){return files.has(k)?{body:files.get(k)}:null;},async delete(k){files.delete(k);}},PORTAL_AUTH_SECRET:'a-test-only-secret-that-is-longer-than-thirty-two-characters',PORTAL_SETUP_TOKEN:'test-setup-token',RESEND_API_KEY:'test-not-a-real-key',COMMUNITY_MODERATOR_EMAIL:'owner@example.com'};return {env,sql,files};}
const origin='https://mrblindbandit.net',emails=[],verificationEmails=[],securityEmails=[];let failEmail=false;
const realFetch=globalThis.fetch;globalThis.fetch=async(url,options)=>{assert.equal(url,'https://api.resend.com/emails');if(failEmail)return Response.json({message:'unverified domain'},{status:403});const payload=JSON.parse(options.body);if(payload.subject==='Your administrator verification code')verificationEmails.push(payload);else if(['New verified administrator session','Administrator verification attempts blocked'].includes(payload.subject))securityEmails.push(payload);else emails.push(payload);return Response.json({id:'test-email-'+emails.length});};
const pass='A unique test password 2030!';
async function call(env,path,method='GET',input,headers={}){const h={origin,'cf-connecting-ip':'192.0.2.'+Math.floor(Math.random()*200),...headers};if(input&&!(input instanceof FormData))h['content-type']='application/json';const pending=[];const response=await portal(new Request(origin+'/api/'+path,{method,headers:h,body:input instanceof FormData?input:input?JSON.stringify(input):undefined}),env,{waitUntil(p){pending.push(p);}});await Promise.all(pending);let body;const type=response.headers.get('content-type')||'';const raw=await response.text();if(type.includes('json')&&raw)body=JSON.parse(raw);else body=raw;return {status:response.status,body,cookies:response.headers.getSetCookie(),headers:response.headers};}
const owner={'oai-authenticated-user-id':'verified-owner','oai-authenticated-user-email':'owner@example.com'};
function token(email){return /#token=([^\s]+)/.exec(email.text)?.[1];}
async function verifyAdmin(env,headers){const sent=await call(env,'portal/security/send','POST',{},headers);assert.equal(sent.status,200,JSON.stringify(sent.body));const code=/Your code is: (\d{6})/.exec(verificationEmails.at(-1).text)[1];const verified=await call(env,'portal/security/verify','POST',{code},headers);assert.equal(verified.status,200);headers.cookie=[headers.cookie,...verified.cookies.map(c=>c.split(';')[0])].filter(Boolean).join('; ');return headers;}
async function bootstrap(env){delete owner.cookie;const r=await call(env,'portal/bootstrap','POST',{}, {authorization:'Bearer test-setup-token'});assert.equal(r.status,200,JSON.stringify(r.body));if(!failEmail)await verifyAdmin(env,owner);return r;}
async function activate(env,email){const t=token(emails.findLast(x=>x.to[0]===email));assert.ok(t);const r=await call(env,'label-auth/reset-password','POST',{token:decodeURIComponent(t),newPassword:pass});assert.equal(r.status,200,JSON.stringify(r.body));const login=await call(env,'label-auth/sign-in/email','POST',{email,password:pass});assert.equal(login.status,200,JSON.stringify(login.body));assert.ok(login.cookies.some(c=>c.includes('HttpOnly')&&c.includes('Secure')));const headers={cookie:login.cookies.map(c=>c.split(';')[0]).join('; ')};const me=await call(env,'portal/me','GET',null,headers);if(me.body.user.needsVerification)await verifyAdmin(env,headers);return headers;}
test('owner bootstrap, real password flow, single-use reset and private client isolation',async()=>{
 const {env,sql,files}=setup();assert.equal((await call(env,'portal/bootstrap','POST',{})).status,403);await bootstrap(env);assert.equal(emails.at(-1).to[0],'business@mrblindbandit.net');assert.ok(emails.at(-1).html.includes('©'));assert.ok(emails.at(-1).html.includes('/assets/blindbandit-records-gold.jpeg'));assert.equal((await call(env,'portal/bootstrap','POST',{}, {authorization:'Bearer test-setup-token'})).body.message,'Owner account already provisioned.');
 const ownerHeaders=await activate(env,'business@mrblindbandit.net');assert.equal((await call(env,'portal/me','GET',null,ownerHeaders)).body.user.role,'owner');assert.equal((await call(env,'label-auth/reset-password','POST',{token:token(emails.at(-1)),newPassword:pass})).status,400);
 assert.equal((await call(env,'label-auth/sign-up/email','POST',{email:'attacker@example.com',name:'X',password:pass})).status,404);
 const made=[];for(const [name,email]of [['First','first@example.com'],['Second','second@example.com']]){const r=await call(env,'portal/members','POST',{name,email,role:'client',artistName:name},ownerHeaders);assert.equal(r.status,201,JSON.stringify(r.body));made.push({id:r.body.id,headers:await activate(env,email)});}
 assert.equal((await call(env,'portal/members','GET',null,made[0].headers)).status,403);
 assert.equal((await call(env,'portal/members','POST',{name:'Bad',email:'bad@example.com',role:'owner'},ownerHeaders)).status,403);
 const r=await call(env,'portal/earnings','POST',{clientId:made[0].id,description:'Test release',source:'Statement',period:'2026-09',currency:'USD',amount:'123.45',status:'reported',reference:'REF-1'},ownerHeaders);assert.equal(r.status,201,JSON.stringify(r.body));assert.equal((await call(env,'portal/earnings','GET',null,made[0].headers)).body.earnings[0].amount,12345);assert.equal((await call(env,'portal/earnings?clientId='+made[0].id,'GET',null,made[1].headers)).body.earnings.length,0);
 assert.equal((await call(env,'portal/messages','POST',{clientId:made[1].id,body:'Cross account attack'},made[0].headers)).status,404);
 assert.equal((await call(env,'portal/messages','POST',{clientId:made[0].id,body:'Private reply'},ownerHeaders)).status,201);assert.equal((await call(env,'portal/messages','GET',null,made[1].headers)).body.messages.length,0);
 const fd=new FormData();fd.set('clientId',made[0].id);fd.set('title','Agreement');fd.set('file',new File(['%PDF-1.4\nTest PDF'],'agreement.pdf',{type:'application/pdf'}));const contract=await call(env,'portal/contracts','POST',fd,ownerHeaders);assert.equal(contract.status,201,JSON.stringify(contract.body));const id=contract.body.id;assert.equal(files.size,1);assert.equal((await call(env,'portal/contracts/'+id+'/file','GET',null,made[1].headers)).status,404);assert.equal((await call(env,'portal/contracts/'+id+'/file','GET',null,made[0].headers)).status,200);assert.equal((await call(env,'portal/contracts/'+id+'/review','POST',{},ownerHeaders)).status,403);assert.equal((await call(env,'portal/contracts/'+id+'/review','POST',{},made[0].headers)).status,200);
 const task=await call(env,'portal/tasks','POST',{clientId:made[0].id,title:'Deliver stems',details:'WAV files',dueDate:'2026-10-01'},ownerHeaders);assert.equal(task.status,201);assert.equal((await call(env,'portal/tasks/'+task.body.id,'PATCH',{status:'complete'},made[1].headers)).status,404);assert.equal((await call(env,'portal/tasks/'+task.body.id,'PATCH',{status:'complete'},made[0].headers)).status,200);
 assert.equal((await call(env,'portal/profile','PATCH',{name:'Bad',artistName:''},{...made[0].headers,origin:'https://evil.example'})).status,403);
 assert.equal((await call(env,'portal/members/'+made[0].id,'PATCH',{role:'client',status:'suspended'},ownerHeaders)).status,200);assert.equal((await call(env,'portal/earnings','GET',null,made[0].headers)).status,401);
 const account=sql.prepare('SELECT password FROM label_account LIMIT 1').get();assert.ok(account.password&&!account.password.includes(pass));assert.ok((await call(env,'portal/audit','GET',null,ownerHeaders)).body.events.length>5);
});
test('failed email persists account and status without pretending to deliver',async()=>{const {env}=setup();failEmail=true;try{const r=await bootstrap(env);assert.equal(r.body.invitation,'failed');const me=await call(env,'portal/me','GET',null,owner);assert.equal(me.body.user.role,'owner');assert.equal(me.body.user.recovery,true);const mail=await call(env,'portal/mail','GET',null,owner);assert.equal(mail.status,403); // Failed delivery does not bypass the administrator challenge.
 assert.equal(env.DB!==null,true);assert.equal((await call(env,'portal/me','GET',null,{'oai-authenticated-user-id':'fan','oai-authenticated-user-email':'fan@example.com'})).body.user,null);}finally{failEmail=false;}});

test('private page documents require authentication and matching roles, including direct HTML URLs',async()=>{
 const {env}=setup();await bootstrap(env);
 for(const path of ['/owner/inbox/','/owner/inbox/index.html','/owner/%69nbox/']){
  const r=await portalPage(new Request(origin+path),env);assert.equal(r.status,404);assert.match(r.headers.get('cache-control'),/no-store/);
 }
 for(const path of ['/portal/','/portal/inbox/','/portal/inbox/index.html','/portal/team','/portal/%69nbox/']){
  const r=await portalPage(new Request(origin+path),env);assert.equal(r.status,303);assert.equal(r.headers.get('location'),'/portal/login/');
 }
 assert.equal(await portalPage(new Request(origin+'/portal/login/'),env),null);
 const c=await call(env,'portal/members','POST',{name:'Private Client',email:'private@example.com',role:'client'},owner);assert.equal(c.status,201);const ch=await activate(env,'private@example.com');
 for(const path of ['/portal/inbox/','/portal/team/index.html','/portal/activity/','/portal/clients/'])assert.equal((await portalPage(new Request(origin+path,{headers:ch}),env)).status,403);
 const earningsPage=await portalPage(new Request(origin+'/portal/earnings/',{headers:ch}),env);assert.equal(earningsPage.status,200);assert.match(earningsPage.headers.get('cache-control'),/no-store/);assert.match(await earningsPage.text(),/data-label-portal/);
 const oldOwner=await portalPage(new Request(origin+'/owner/inbox/',{headers:owner}),env);assert.equal(oldOwner.status,303);assert.equal(oldOwner.headers.get('location'),'/portal/inbox/');
 const inboxPage=await portalPage(new Request(origin+'/portal/inbox/',{headers:owner}),env);assert.equal(inboxPage.status,200);assert.match(await inboxPage.text(),/Submission inbox/);
});
test('only the verified owner can set the initial label password without email, once',async()=>{
 const {env}=setup();failEmail=true;try{await bootstrap(env);}finally{failEmail=false;}
 await verifyAdmin(env,owner);
 assert.equal((await call(env,'portal/me','GET',null,owner)).body.user.needsPasswordSetup,true);
 assert.equal((await call(env,'portal/owner/password','POST',{newPassword:pass})).status,401);
 assert.equal((await call(env,'portal/owner/password','POST',{newPassword:pass},{...owner,origin:'https://evil.example'})).status,403);
 assert.equal((await call(env,'portal/owner/password','POST',{newPassword:'short'},owner)).status,400);
 const done=await call(env,'portal/owner/password','POST',{newPassword:pass},owner);assert.equal(done.status,200,JSON.stringify(done.body));
 assert.equal((await call(env,'portal/me','GET',null,owner)).body.user.needsPasswordSetup,false);
 assert.equal((await call(env,'portal/owner/password','POST',{newPassword:'Another unique password!'},owner)).status,403);
 const login=await call(env,'label-auth/sign-in/email','POST',{email:'business@mrblindbandit.net',password:pass});assert.equal(login.status,200,JSON.stringify(login.body));
 const cookie={cookie:login.cookies.map(c=>c.split(';')[0]).join('; ')};assert.equal((await call(env,'portal/me','GET',null,cookie)).body.user.role,'owner');
});

test('social providers stay hidden until configured and linking requires a label session',async()=>{
 const {env,sql}=setup();await bootstrap(env);
 assert.deepEqual((await call(env,'portal/providers')).body.providers,{google:false,apple:false});
 assert.equal((await call(env,'label-auth/sign-in/social','POST',{provider:'google'})).status,404);
 env.GOOGLE_CLIENT_ID='test-client.apps.googleusercontent.com';env.GOOGLE_CLIENT_SECRET='test-client-secret';
 assert.deepEqual((await call(env,'portal/providers')).body.providers,{google:true,apple:false});
 assert.equal((await call(env,'label-auth/link-social','POST',{provider:'google'})).status,401);
 assert.equal((await call(env,'label-auth/link-social','POST',{provider:'google'},owner)).status,403);
 assert.equal((await call(env,'label-auth/sign-in/social','POST',{provider:'google'},{origin:'https://evil.example'})).status,403);
 const started=await call(env,'label-auth/sign-in/social','POST',{provider:'google',callbackURL:'https://evil.example/',idToken:{token:'forged'}});
 assert.equal(started.status,200,JSON.stringify(started.body));const redirect=new URL(started.body.url);assert.equal(redirect.hostname,'accounts.google.com');assert.equal(redirect.searchParams.get('redirect_uri'),origin+'/api/label-auth/callback/google');assert.ok(redirect.searchParams.get('state'));
 const missingState=await call(env,'label-auth/callback/google');assert.equal(missingState.status,302);assert.match(missingState.headers.get('location'),/state_not_found/);assert.equal(sql.prepare('SELECT COUNT(*) AS n FROM label_session').get().n,0);
 const headers=await activate(env,'business@mrblindbandit.net');const linked=await call(env,'label-auth/link-social','POST',{provider:'google'},headers);assert.equal(linked.status,200,JSON.stringify(linked.body));assert.equal(new URL(linked.body.url).hostname,'accounts.google.com');
 env.APPLE_CLIENT_ID='net.mrblindbandit.portal';env.APPLE_CLIENT_SECRET='not-a-valid-jwt';assert.equal((await call(env,'portal/providers')).body.providers.apple,false);
});

test('unactivated accounts receive a fresh invitation and unknown emails are not disclosed',async()=>{
 const {env}=setup();await bootstrap(env);const before=emails.length;
 const requested=await call(env,'label-auth/request-password-reset','POST',{email:'business@mrblindbandit.net'});assert.equal(requested.status,200);assert.equal(emails.length,before+1);assert.equal(emails.at(-1).subject,'Your Blindbandit Records portal invitation');
 const unknown=await call(env,'label-auth/request-password-reset','POST',{email:'unknown@example.com'});assert.deepEqual(unknown.body,requested.body);assert.equal(emails.length,before+1);
 await activate(env,'business@mrblindbandit.net');
});

test('deployment owner can issue only one fixed-account password link with a temporary secret',async()=>{
 const {env}=setup();await bootstrap(env);const before=emails.length;
 assert.equal((await call(env,'portal/owner/setup-link','POST',{})).status,403);
 env.PORTAL_OWNER_LINK_SECRET='a-temporary-test-only-owner-link-secret';
 assert.equal((await call(env,'portal/owner/setup-link','POST',{}, {authorization:'Bearer wrong'})).status,403);
 const headers={authorization:'Bearer '+env.PORTAL_OWNER_LINK_SECRET};const result=await call(env,'portal/owner/setup-link','POST',{email:'attacker@example.com'},headers);
 assert.equal(result.status,200,JSON.stringify(result.body));assert.equal(result.body.email,'business@mrblindbandit.net');assert.equal(result.body.expiresInSeconds,3600);assert.equal(emails.length,before);
 assert.equal((await call(env,'portal/owner/setup-link','POST',{},headers)).status,409);
 const token=new URLSearchParams(new URL(result.body.resetUrl).hash.slice(1)).get('token');const reset=await call(env,'label-auth/reset-password','POST',{token,newPassword:pass});assert.equal(reset.status,200);assert.equal((await call(env,'label-auth/reset-password','POST',{token,newPassword:pass})).status,400);
 delete env.PORTAL_OWNER_LINK_SECRET;assert.equal((await call(env,'portal/owner/setup-link','POST',{},headers)).status,403);
});

test('82 internal workspaces persist edits, archive records, reject conflicts and enforce roles',async()=>{
 const {env,sql}=setup();await bootstrap(env);const modules=[...JSON.parse(readFileSync('data/workspace.json','utf8')),...JSON.parse(readFileSync('data/workspace-extra.json','utf8'))];assert.equal(modules.length,82);
 for(const m of modules){const page=await portalPage(new Request(origin+'/portal/'+m.slug+'/'),env);assert.equal(page.status,303);const privatePage=await portalPage(new Request(origin+'/portal/'+m.slug+'/',{headers:owner}),env);assert.equal(privatePage.status,200);assert.match(await privatePage.text(),/workspace.js/);}
 const path='portal/workspace/release-plans',body={title:'Test launch',status:'Draft',owner:'Label team',dueDate:'2026-10-01',details:{},checklist:Array(5).fill(false)};
 assert.equal((await call(env,path)).status,401);assert.equal((await call(env,path,'POST',body,{...owner,origin:'https://evil.example'})).status,403);
 assert.equal((await call(env,path,'POST',{...body,dueDate:'2026-02-30'},owner)).status,400);
 const created=await call(env,path,'POST',body,owner);assert.equal(created.status,201,JSON.stringify(created.body));const id=created.body.id;
 let rows=(await call(env,path,'GET',null,owner)).body.records;assert.equal(rows[0].title,body.title);
 const edit={...body,title:'Updated launch',status:'In review',revision:1,checklist:[true,false,false,false,false]};assert.equal((await call(env,path+'/'+id,'PATCH',edit,owner)).status,200);assert.equal((await call(env,path+'/'+id,'PATCH',edit,owner)).status,409);
 assert.equal((await call(env,'portal/workspace/metadata/'+id,'PATCH',{...edit,revision:2},owner)).status,404);
 assert.equal((await call(env,path+'/'+id,'PATCH',{...edit,revision:2,archived:true},owner)).status,200);assert.equal((await call(env,path,'GET',null,owner)).body.records.length,0);assert.equal((await call(env,path+'?archived=1','GET',null,owner)).body.records.length,1);
 const headers=await activate(env,'business@mrblindbandit.net');const ownerId=(await call(env,'portal/me','GET',null,headers)).body.user.id;
 for(const [role,releaseStatus,financeStatus]of [['client',403,403],['manager',200,403],['accountant',403,200]]){sql.prepare('UPDATE label_members SET role=? WHERE id=?').run(role,ownerId);assert.equal((await call(env,path,'GET',null,headers)).status,releaseStatus);assert.equal((await call(env,'portal/workspace/budgets','GET',null,headers)).status,financeStatus);assert.equal((await portalPage(new Request(origin+'/portal/release-plans/',{headers}),env)).status,releaseStatus);}
});

test('verified .com sender, professional notices and owner-only test recipient',async()=>{
 const {env}=setup();await bootstrap(env);
 const invitation=emails.at(-1);assert.equal(invitation.from,'Blindbandit Records <accounts@mrblindbandit.com>');assert.equal(invitation.reply_to,'business@mrblindbandit.net');assert.match(invitation.html,/Create your password/);assert.match(invitation.text,/Confidentiality notice/);assert.match(invitation.text,/Legal notice/);assert.match(invitation.text,/expires in one hour/);
 assert.equal((await call(env,'portal/mail/test','POST',{})).status,401);
 assert.equal((await call(env,'portal/mail/test','POST',{}, {...owner,origin:'https://evil.example'})).status,403);
 const welcome=await call(env,'portal/mail/test','POST',{email:'attacker@example.com'},owner);assert.equal(welcome.status,200,JSON.stringify(welcome.body));assert.equal(welcome.body.recipient,'owner@example.com');assert.deepEqual(emails.at(-1).to,['owner@example.com']);assert.match(emails.at(-1).subject,/Welcome to your/);assert.ok(!emails.at(-1).text.includes('#token='));assert.match(emails.at(-1).text,/does not grant access or change your password/);
 assert.equal((await call(env,'portal/mail','GET',null,owner)).body.mail.find(x=>x.kind==='owner_welcome').email,'owner@example.com');
});

test('administrator challenge gates records, preserves the intended page, rejects reuse, and recovery codes work once',async()=>{const {env}=setup();await bootstrap(env);const raw={...owner};delete raw.cookie;assert.equal((await call(env,'portal/inbox','GET',null,raw)).status,403);assert.equal((await portalPage(new Request(origin+'/portal/inbox/?thread=abc',{headers:raw}),env)).status,200);const code=/Your code is: (\d{6})/.exec(verificationEmails.at(-1).text)[1];assert.equal((await call(env,'portal/security/verify','POST',{code},raw)).status,400);const recovery=await call(env,'portal/security/recovery','POST',{},owner);assert.equal(recovery.body.codes.length,8);assert.equal((await call(env,'portal/security/verify','POST',{code:recovery.body.codes[0],recovery:true},raw)).status,200);assert.equal((await call(env,'portal/security/verify','POST',{code:recovery.body.codes[0],recovery:true},raw)).status,400);});
test('inbox threads persist replies, enforce trash confirmation, and publishing rejects stale revisions',async()=>{const {env,sql}=setup();await bootstrap(env);const key=crypto.randomUUID();sql.prepare('INSERT INTO site_requests(id,kind,name,email,details,created_at) VALUES (?,?,?,?,?,?)').run(key,'inquiry','Sender','sender@example.com','{"category":"copyright","message":"Please review"}',Date.now());assert.equal((await call(env,'portal/inbox/'+key,'GET',null,owner)).body.request.email,'sender@example.com');const reply=await call(env,'portal/inbox/'+key+'/message','POST',{kind:'reply',body:'Thank you. We will review your report.'},owner);assert.equal(reply.body.delivery,'accepted');assert.ok(!emails.at(-1).text.includes('/portal/'));assert.equal((await call(env,'portal/inbox/'+key,'DELETE',{confirm:key},owner)).status,400);assert.equal((await call(env,'portal/inbox/'+key,'PATCH',{status:'trash',priority:'normal'},owner)).status,200);assert.equal((await call(env,'portal/inbox/'+key,'DELETE',{confirm:key},owner)).status,200);const draft={slug:'test-article',title:'Test <script>',body:'Safe body\n\n## A heading',excerpt:'An excerpt',author:'Mr. Blindbandit',category:'News',tags:'',status:'draft',metadata:{}};const created=await call(env,'portal/publishing','POST',draft,owner);assert.equal(created.status,200,JSON.stringify(created.body));const path='portal/publishing/'+created.body.id;assert.equal((await call(env,path,'PATCH',{...draft,status:'published',revision:1},owner)).status,400);assert.equal((await call(env,path,'PATCH',{...draft,status:'published',revision:1,previewConfirmed:true},owner)).status,200);assert.equal((await call(env,path,'PATCH',{...draft,revision:1},owner)).status,409);assert.equal((await call(env,path,'GET',null,owner)).body.revisions.length,1);});

test('security sessions can only be revoked by their owner after verification',async()=>{const {env,sql}=setup();await bootstrap(env);const own=await activate(env,'business@mrblindbandit.net');const user=(await call(env,'portal/me','GET',null,own)).body.user;const sessions=await call(env,'portal/security/sessions','GET',null,own);assert.equal(sessions.status,200);assert.ok(sessions.body.sessions.some(s=>s.current));const current=sessions.body.sessions.find(s=>s.current);assert.equal((await call(env,'portal/security/session','POST',{id:current.id},own)).status,400);assert.equal((await call(env,'portal/security/session','POST',{id:'not-owned'},own)).status,404);assert.equal((await call(env,'portal/security/status','GET',null,own)).body.verified,true);const codes=await call(env,'portal/security/recovery','POST',{},own);assert.equal(codes.body.codes.length,8);for(const code of codes.body.codes)assert.equal(sql.prepare('SELECT COUNT(*) AS n FROM security_recovery WHERE digest=?').get(code).n,0);});
test('translation publishing requires review and enforces revision checks',async()=>{const {env}=setup();await bootstrap(env);const draft={source:'/music/',language:'es',title:'Música',description:'Lanzamientos oficiales de Mr. Blindbandit.',body:'Descubre la música de Mr. Blindbandit.',status:'published',reviewed:false};assert.equal((await call(env,'portal/translations','POST',draft,owner)).status,400);const created=await call(env,'portal/translations','POST',{...draft,status:'draft'},owner);assert.equal(created.status,200,JSON.stringify(created.body));const record=(await call(env,'portal/translations','GET',null,owner)).body.translations.find(x=>x.id===created.body.id);assert.ok(record);assert.equal((await call(env,'portal/translations','POST',{...draft,id:record.id,revision:record.revision,reviewed:true},owner)).status,200);assert.equal((await call(env,'portal/translations','POST',{...draft,id:record.id,revision:record.revision,reviewed:true},owner)).status,409);});

test('announcements isolate audiences; dashboard posts publish; owner snapshots and lockdown preserve recovery',async()=>{
 const {env,sql,files}=setup();await bootstrap(env);
 const client=await call(env,'portal/members','POST',{name:'Announcement Client',email:'announcements@example.com',role:'client'},owner);assert.equal(client.status,201);const ch=await activate(env,'announcements@example.com');
 for(const audience of ['all','staff','clients'])assert.equal((await call(env,'portal/operations/announcements','POST',{title:audience,body:'Private update',audience,status:'published'},owner)).status,201);
 assert.deepEqual((await call(env,'portal/operations/announcements','GET',null,ch)).body.records.map(r=>r.audience).sort(),['all','clients']);
 assert.equal((await call(env,'portal/operations/announcements','POST',{title:'Attack',body:'No',audience:'all',status:'published'},ch)).status,403);
 const ann=(await call(env,'portal/operations/announcements','GET',null,owner)).body.records[0];assert.equal((await call(env,'portal/operations/announcements','PATCH',{...ann,revision:0},owner)).status,409);
 const post=await call(env,'portal/operations/community','POST',{title:'Official update',body:'New music soon',board:'announcements'},owner);assert.equal(post.status,201);assert.equal(sql.prepare('SELECT hidden FROM community_posts WHERE id=?').get(post.body.id).hidden,0);assert.equal((await call(env,'portal/operations/community','POST',{title:'No',body:'No',board:'announcements'},ch)).status,403);
 const draft={slug:'snapshot-test',title:'Snapshot test',body:'Original text',excerpt:'Excerpt',author:'Mr. Blindbandit',category:'News',tags:'',status:'draft',metadata:{}};const article=await call(env,'portal/publishing','POST',draft,owner);assert.equal(article.status,200);
 const backup=await call(env,'portal/operations/backups','POST',{action:'create'},owner);assert.equal(backup.status,201,JSON.stringify(backup.body));const key=backup.body.record.id;
 assert.equal((await call(env,'portal/operations/backups?id='+key,'GET',null,ch)).status,403);
 assert.equal((await call(env,'portal/operations/backups?id='+key,'GET')).status,401);
 const contents=await call(env,'portal/operations/backups?id='+key,'GET',null,owner);assert.equal(contents.body.articles.length,1);assert.ok(!JSON.stringify(contents.body).includes('password'));
 const restored=await call(env,'portal/operations/backups','POST',{action:'restore',id:key,articleId:article.body.id,confirmation:'RESTORE AS DRAFT'},owner);assert.equal(restored.status,201,JSON.stringify(restored.body));assert.notEqual(restored.body.id,article.body.id);assert.equal(sql.prepare('SELECT status FROM site_articles WHERE id=?').get(restored.body.id).status,'draft');assert.equal(sql.prepare('SELECT COUNT(*) AS n FROM site_articles').get().n,2);
 files.set('private/content-backups/'+key,new TextEncoder().encode('tampered').buffer);assert.equal((await call(env,'portal/operations/backups?id='+key,'GET',null,owner)).status,400);
 assert.equal((await call(env,'portal/operations/lockdown','POST',{enabled:true,confirmation:'wrong'},owner)).status,400);
 assert.equal((await call(env,'portal/operations/lockdown','POST',{enabled:true,confirmation:'LOCK PORTAL'},owner)).status,200);
 assert.equal(sql.prepare('SELECT COUNT(*) AS n FROM label_session WHERE user_id=?').get(client.body.id).n,0);
 const login=await call(env,'label-auth/sign-in/email','POST',{email:'announcements@example.com',password:pass});const fresh={cookie:login.cookies.map(c=>c.split(';')[0]).join('; ')};assert.equal((await call(env,'portal/me','GET',null,fresh)).status,403);
 assert.equal((await call(env,'portal/me','GET',null,owner)).body.user.role,'owner');assert.equal((await call(env,'portal/operations/lockdown','POST',{enabled:false,confirmation:'UNLOCK PORTAL'},owner)).status,200);assert.equal((await call(env,'portal/me','GET',null,fresh)).body.user.role,'client');
 for(const page of ['community-publishing','readiness','lockdown','content-backups','access-reviews','incident-log','data-requests'])assert.equal((await portalPage(new Request(origin+'/portal/'+page+'/',{headers:fresh}),env)).status,403);
});

test('rights records reject invalid shares, identifiers and unsupported eligibility',async()=>{
 const {env}=setup();await bootstrap(env);const modules=[...JSON.parse(readFileSync('data/workspace.json','utf8')),...JSON.parse(readFileSync('data/workspace-extra.json','utf8'))];
 async function save(slug,status,details){const m=modules.find(m=>m.slug===slug);return call(env,'portal/workspace/'+slug,'POST',{title:'Review record',owner:'Owner',dueDate:'',status,details,checklist:m.checklist.map(()=>true)},owner);}
 const split={work:'Track 1',rightsType:'master',shares:'Artist | 60\nLabel | 40',evidence:'Contract 1'};assert.equal((await save('ownership-splits','Approved',{...split,shares:'Artist | 70\nLabel | 40'})).status,400);assert.equal((await save('ownership-splits','Approved',split)).status,201);
 assert.equal((await save('content-id-review','Eligible',{work:'Track 1',exclusive:'no',evidence:'Contract',audio:'File',provider:'Partner',claimant:'ID'})).status,400);
 assert.equal((await save('delivery-catalog','Draft',{upc:'012345678906'})).status,400);assert.equal((await save('delivery-catalog','Draft',{isrc:'USABC2600001',upc:'012345678905'})).status,201);
 assert.equal((await save('territory-rights','Approved',{work:'Track',territories:'WORLD',start:'2026-01-01',end:'2025-01-01',evidence:'Contract'})).status,400);
 const readiness=await call(env,'portal/operations/readiness','GET',null,owner);assert.equal(readiness.body.modules.length,7);assert.equal(readiness.body.modules.find(m=>m.slug==='ownership-splits').statuses[0].count,1);
});

test('publishing adds safe image metadata, useful checks, search and dynamic SEO reporting',async()=>{
 const {env}=setup();await bootstrap(env);
 const draft={slug:'image-news',title:'Image news',body:'A new release story with original writing.',excerpt:'Original music news.',author:'Mr. Blindbandit',category:'Releases',tags:'ambient',status:'draft',metadata:{image:'https://mrblindbandit.net/assets/portrait.jpg',imageAlt:'Mr. Blindbandit portrait',imageCaption:'Official artist photo',socialImage:'https://mrblindbandit.net/assets/portrait.jpg',related:['/music/','/biography/']}};
 const invalid=await call(env,'portal/publishing/check','POST',{...draft,metadata:{...draft.metadata,imageAlt:''}},owner);assert.equal(invalid.body.canPublish,false);
 assert.equal((await call(env,'portal/publishing/check','POST',{...draft,status:'scheduled',publishAt:'2020-01-01'},owner)).body.canPublish,false);
 assert.equal((await call(env,'portal/publishing','POST',{...draft,metadata:{image:'javascript:alert(1)'}},owner)).status,400);
 assert.equal((await call(env,'portal/publishing','POST',{...draft,metadata:{related:['/portal/inbox/']}},owner)).status,400);
 const created=await call(env,'portal/publishing','POST',draft,owner);assert.equal(created.status,200,JSON.stringify(created.body));
 assert.equal((await call(env,'portal/publishing?q=ambient&status=draft','GET',null,owner)).body.total,1);
 assert.equal((await call(env,'portal/publishing?q=nonexistent','GET',null,owner)).body.total,0);
 assert.equal((await call(env,'portal/publishing/'+created.body.id,'PATCH',{...draft,status:'published',previewConfirmed:true,revision:1},owner)).status,200);
 const seo=await call(env,'portal/seo','GET',null,owner);assert.ok(seo.body.pages.some(p=>p.articleId===created.body.id&&p.socialImage===draft.metadata.image));
 const saved=await call(env,'portal/publishing/'+created.body.id,'GET',null,owner);assert.equal(JSON.parse(saved.body.article.metadata).imageAlt,draft.metadata.imageAlt);
});

test('writing suggestions preserve title, avoid existing slugs and require administrator access',async()=>{
 const {env,sql}=setup();await bootstrap(env);const body='A new ambient release is coming soon. This article introduces the recording.';
 const draft={slug:'a-new-ambient-release',title:'A new ambient release',body,excerpt:'Release notes',author:'Mr. Blindbandit',category:'Music',status:'draft',metadata:{}};assert.equal((await call(env,'portal/publishing','POST',draft,owner)).status,200);
 const result=await call(env,'portal/publishing/suggest','POST',{title:draft.title,body},owner);assert.equal(result.status,200);assert.equal(result.body.title,draft.title);assert.equal(result.body.slug,'a-new-ambient-release-2');assert.equal(sql.prepare('SELECT COUNT(*) AS n FROM site_articles').get().n,1);
 assert.equal((await call(env,'portal/publishing/suggest','POST',{body},{})).status,401);assert.equal((await call(env,'portal/publishing/suggest','POST',{body:'short'},owner)).status,400);
 const client=await call(env,'portal/members','POST',{name:'Guide Client',email:'guide@example.com',role:'client'},owner);assert.equal(client.status,201);const ch=await activate(env,'guide@example.com');assert.equal((await call(env,'portal/publishing/suggest','POST',{body},ch)).status,403);
 assert.equal((await portalPage(new Request(origin+'/portal/guide/',{headers:ch}),env)).status,200);assert.equal((await portalPage(new Request(origin+'/portal/guide/'),env)).status,303);
});

test('portal search and saved shortcuts respect account and role boundaries',async()=>{
 const {env,sql}=setup();await bootstrap(env);const ids=[];for(const [name,email]of [['Search One','searchone@example.com'],['Search Two','searchtwo@example.com']]){const r=await call(env,'portal/members','POST',{name,email,role:'client'},owner);ids.push({id:r.body.id,headers:await activate(env,email)});}
 for(const c of ids)assert.equal((await call(env,'portal/tasks','POST',{clientId:c.id,title:'Unique client task',details:'Private details',dueDate:''},owner)).status,201);
 assert.equal((await call(env,'portal/tools/search?q=Unique','GET',null,ids[0].headers)).body.results.length,1);assert.equal((await call(env,'portal/tools/search?q=Unique','GET',null,owner)).body.results.length,2);
 assert.equal((await call(env,'portal/tools/search?q=Unique')).status,401);
 const ch=ids[0].headers;assert.equal((await call(env,'portal/tools/shortcuts','POST',{paths:['/portal/inbox/'],revision:0},ch)).status,400);
 assert.equal((await call(env,'portal/tools/shortcuts','POST',{paths:['/portal/tasks/'],revision:0},ch)).status,200);
 assert.deepEqual((await call(env,'portal/tools/shortcuts','GET',null,ch)).body.paths,['/portal/tasks/']);assert.deepEqual((await call(env,'portal/tools/shortcuts','GET',null,ids[1].headers)).body.paths,[]);
 assert.equal((await call(env,'portal/tools/shortcuts','POST',{paths:[],revision:0},ch)).status,409);
 for(const page of ['search','shortcuts']){assert.equal((await portalPage(new Request(origin+'/portal/'+page+'/'),env)).status,303);assert.equal((await portalPage(new Request(origin+'/portal/'+page+'/',{headers:ch}),env)).status,200);}
});

await build({entryPoints:['worker/authenticator.ts','worker/account-admin.ts'],bundle:true,platform:'node',format:'esm',outdir:'.sites-runtime/account-tests'});
const {totp,encode32}=await import('../.sites-runtime/account-tests/authenticator.js');
const {invitedCommunity}=await import('../.sites-runtime/account-tests/account-admin.js');
test('authenticator matches standard vectors, encrypts secrets and rejects repeated codes',async()=>{
 const known=encode32(new TextEncoder().encode('12345678901234567890'));assert.equal(await totp(known,0),'755224');assert.equal(await totp(known,1),'287082');
 const {env,sql}=setup();await bootstrap(env);const begun=await call(env,'portal/security/authenticator','POST',{action:'begin'},owner);assert.equal(begun.status,200);const secret=begun.body.secret;assert.match(secret,/^[A-Z2-7]{32}$/);assert.ok(!sql.prepare("SELECT value FROM label_settings WHERE key LIKE 'totp_pending:%'").get().value.includes(secret));
 assert.equal((await call(env,'portal/security/authenticator','POST',{action:'enable',code:'bad'},owner)).status,400);
 const counter=Math.floor(Date.now()/30000),code=await totp(secret,counter);assert.equal((await call(env,'portal/security/authenticator','POST',{action:'enable',code},owner)).status,200);
 assert.equal((await call(env,'portal/security/status','GET',null,owner)).body.authenticator,true);
 const unverified={...owner};delete unverified.cookie;assert.equal((await call(env,'portal/security/verify','POST',{code,authenticator:true},unverified)).status,400);
 const next=await totp(secret,counter+1);assert.equal((await call(env,'portal/security/verify','POST',{code:next,authenticator:true},unverified)).status,200);assert.equal((await call(env,'portal/security/verify','POST',{code:next,authenticator:true},unverified)).status,400);
 assert.equal((await call(env,'portal/security/authenticator','POST',{action:'disable',code:next},owner)).status,400);
});
test('community invitations claim only the matching verified identity and do not grant label access',async()=>{
 const {env,sql}=setup();await bootstrap(env);const r=await call(env,'portal/account-admin/community-accounts','POST',{name:'Invited Fan',email:'invitedfan@example.com'},owner);assert.equal(r.status,201,JSON.stringify(r.body));assert.equal(r.body.delivery,'accepted');assert.equal(sql.prepare("SELECT COUNT(*) AS n FROM label_user WHERE email='invitedfan@example.com'").get().n,0);
 const headers={'oai-authenticated-user-id':'invited-fan-id','oai-authenticated-user-email':'invitedfan@example.com'},person={id:'invited-fan-id',moderator:false};assert.equal((await invitedCommunity(new Request(origin,{headers}),env,person)).id,person.id);assert.equal(sql.prepare('SELECT display_name FROM community_profiles WHERE user_id=?').get(person.id).display_name,'Invited Fan');assert.equal((await call(env,'portal/me','GET',null,headers)).body.user,null);
 const account=(await call(env,'portal/account-admin/community-accounts','GET',null,owner)).body.accounts[0];assert.equal((await call(env,'portal/account-admin/community-accounts','PATCH',{key:account.key,status:'suspended'},owner)).status,200);assert.equal(await invitedCommunity(new Request(origin,{headers}),env,person),null);
 assert.equal((await call(env,'portal/account-admin/sessions','GET',null,headers)).status,401);
 for(const page of ['authenticator','account-sessions','community-accounts'])assert.equal((await portalPage(new Request(origin+'/portal/'+page+'/'),env)).status,303);
 const sessions=await call(env,'portal/account-admin/sessions','GET',null,owner);assert.equal(sessions.status,200);
});

test('editorial duplication, filters, bulk updates and exports preserve publication controls',async()=>{
 const {env}=setup();await bootstrap(env);const records=[];
 for(const slug of ['bulk-one','bulk-two']){const r=await call(env,'portal/publishing','POST',{slug,title:slug,body:'Original content',excerpt:'Article excerpt',author:'Author One',category:'Music',tags:'ambient',status:'draft',metadata:{privateNotes:'Private review only',featured:true}},owner);assert.equal(r.status,200);records.push({id:r.body.id,revision:1});}
 const copy=await call(env,'portal/publishing/duplicate','POST',{id:records[0].id},owner);assert.equal(copy.status,201);const duplicate=(await call(env,'portal/publishing/'+copy.body.id,'GET',null,owner)).body.article;assert.equal(duplicate.status,'draft');assert.equal(JSON.parse(duplicate.metadata).featured,false);
 assert.equal((await call(env,'portal/publishing?category=Music&author=Author%20One&tag=ambient','GET',null,owner)).body.total,3);
 assert.equal((await call(env,'portal/publishing?category=Other','GET',null,owner)).body.total,0);
 assert.equal((await call(env,'portal/publishing/bulk','POST',{records,action:'taxonomy',category:'Updates',tags:'news',confirm:'UPDATE SELECTED'},owner)).body.updated,2);
 assert.equal((await call(env,'portal/publishing/bulk','POST',{records,action:'archived',confirm:'UPDATE SELECTED'},owner)).status,409);
 assert.equal((await call(env,'portal/publishing/bulk','POST',{records:records.map(r=>({...r,revision:2})),action:'archived',confirm:'UPDATE SELECTED'},owner)).body.updated,2);
 const saved=(await call(env,'portal/publishing/'+records[0].id,'GET',null,owner)).body;assert.equal(saved.article.status,'archived');assert.equal(saved.revisions.length,2);assert.equal(JSON.parse(saved.article.metadata).lastEditor,'Kaeleb Savon Heck');
 const exported=await call(env,'portal/publishing/export','GET',null,owner);assert.equal(exported.status,200);assert.ok(exported.body.includes('Updates'));assert.ok(!exported.body.includes('Private review only'));assert.equal((await call(env,'portal/publishing/export')).status,401);
});

test('sensitive actions request inline verification before mutation and role changes revoke access proofs',async()=>{
 const {env,sql}=setup();await bootstrap(env);
 sql.prepare('UPDATE security_proofs SET created_at=?').run(Date.now()-16*60000);
 const blocked=await call(env,'portal/members','POST',{name:'New staff',email:'staff@example.com',role:'admin'},owner);
 assert.equal(blocked.status,403);assert.equal(blocked.body.verificationRequired,true);assert.equal(sql.prepare("SELECT COUNT(*) AS n FROM label_user WHERE email='staff@example.com'").get().n,0);
 sql.prepare('UPDATE security_proofs SET created_at=?').run(Date.now());
 const added=await call(env,'portal/members','POST',{name:'New staff',email:'staff@example.com',role:'admin'},owner);assert.equal(added.status,201);
 const signed=await activate(env,'staff@example.com');
 assert.equal((await call(env,'portal/members/'+added.body.id,'PATCH',{role:'client',status:'active'},owner)).status,400);
 assert.equal((await call(env,'portal/members/'+added.body.id,'PATCH',{role:'client',confirmRole:'client',status:'active'},owner)).status,200);
 assert.equal((await call(env,'portal/members','GET',null,signed)).status,401);
 assert.equal(sql.prepare('SELECT COUNT(*) AS n FROM security_proofs WHERE user_id=?').get(added.body.id).n,0);
 const login=await call(env,'label-auth/sign-in/email','POST',{email:'staff@example.com',password:pass});const h={cookie:login.cookies.map(c=>c.split(';')[0]).join('; ')};
 assert.equal((await call(env,'portal/members','GET',null,h)).status,403);
 assert.equal((await call(env,'portal/members/'+added.body.id,'PATCH',{role:'manager',confirmRole:'manager',status:'active'},owner)).status,200);
 const ownerId=(await call(env,'portal/me','GET',null,owner)).body.user.id;
 assert.equal((await call(env,'portal/members/'+ownerId,'PATCH',{role:'client',confirmRole:'client',status:'active'},owner)).status,403);
});

test('publication checks render safe formatting and identify duplicate titles and unavailable internal links',async()=>{
 const {env}=setup();await bootstrap(env);
 const article={title:'Distinct story',slug:'distinct-story',body:'## Heading\n\n> A quote\n\n- One\n- Two\n\n[Music](/music/) and [missing](/missing-page/) and [unsafe](javascript:alert)\n\n<script>alert(1)</script>\n\n---',excerpt:'A short story',author:'Artist',category:'News',status:'draft',metadata:{authorBio:'Artist biography'}};
 assert.equal((await call(env,'portal/publishing','POST',article,owner)).status,200);
 const result=await call(env,'portal/publishing/check','POST',article,owner);assert.equal(result.status,200);
 assert.ok(result.body.warnings.some(x=>x.includes('already uses this title')));assert.ok(result.body.warnings.some(x=>x.includes('/missing-page/')));
 assert.match(result.body.renderedBody,/<blockquote>/);assert.match(result.body.renderedBody,/<ul><li>One/);assert.match(result.body.renderedBody,/<a href="\/music\/">/);assert.ok(!result.body.renderedBody.includes('<script>'));assert.ok(!result.body.renderedBody.includes('href="javascript:'));assert.equal(result.body.schema['@type'],'Article');
});

test('personal notes stay account-bound and reply templates are administrator-only with conflict protection',async()=>{
 const {env}=setup();await bootstrap(env);
 const made=await call(env,'portal/members','POST',{name:'Client Notes',email:'notes@example.com',role:'client'},owner);assert.equal(made.status,201);const client=await activate(env,'notes@example.com');
 const saved=await call(env,'portal/personal-tools/personal-notes','POST',{title:'Private thought',body:'Only my account',revision:0},client);assert.equal(saved.status,200);
 assert.equal((await call(env,'portal/personal-tools/personal-notes','GET',null,owner)).body.items.length,0);
 assert.equal((await call(env,'portal/personal-tools/personal-notes','GET',null,client)).body.items[0].body,'Only my account');
 assert.equal((await call(env,'portal/personal-tools/personal-notes','DELETE',{id:saved.body.id,revision:0,confirm:'DELETE'},client)).status,409);
 assert.equal((await call(env,'portal/personal-tools/reply-templates','GET',null,client)).status,403);
 assert.equal((await call(env,'portal/personal-tools/reply-templates','POST',{title:'Demo reply',body:'Please send a private listening link.',revision:0},owner)).status,200);
 const templates=(await call(env,'portal/personal-tools/reply-templates','GET',null,owner)).body;assert.equal(templates.items[0].title,'Demo reply');
 assert.equal((await call(env,'portal/personal-tools/reply-templates','POST',{title:'Overwrite',body:'No',revision:0},owner)).status,409);
 assert.equal((await call(env,'portal/personal-tools/personal-notes','DELETE',{id:saved.body.id,revision:1,confirm:'DELETE'},client)).status,200);
});

test('ad placements require owner, fresh verification, real slots and the deployment consent gate',async()=>{
 const {env}=setup();await bootstrap(env);const before=await call(env,'portal/advertising','GET',null,owner);assert.equal(before.body.enabled,false);assert.equal(before.body.cmpReady,false);
 const settings={revision:0,enabled:true,bodySlot:'123456',endSlot:'',footerSlot:'',disabledPages:[]};assert.equal((await call(env,'portal/advertising','POST',settings,owner)).status,400);
 assert.equal((await call(env,'portal/advertising','POST',{...settings,enabled:false},owner)).status,200);
 const current=await call(env,'portal/advertising','GET',null,owner);assert.equal(current.body.bodySlot,'123456');assert.equal(current.body.enabled,false);
 assert.equal((await call(env,'portal/advertising','POST',{...settings,revision:1,enabled:false,disabledPages:['/portal/']},owner)).status,400);
});

test('remembered browser labels are account-bound and never replace two-step verification',async()=>{
 const {env,sql}=setup();await bootstrap(env);const d=await call(env,'portal/security/devices','GET',null,owner);assert.equal(d.body.devices.length,1);assert.ok(d.body.devices[0].current);assert.ok(securityEmails.at(-1).text.includes('new administrator session'));
 const device=d.body.devices[0];assert.equal((await call(env,'portal/security/devices','POST',{id:device.id,action:'rename',name:'My iPhone'},owner)).status,200);
 assert.equal((await call(env,'portal/security/devices','GET',null,owner)).body.devices[0].name,'My iPhone');
 sql.prepare('DELETE FROM security_proofs').run();assert.equal((await call(env,'portal/members','GET',null,owner)).status,403);
});

test('renaming an article reserves the old slug and stores an identity-based alias',async()=>{
 const {env,sql}=setup();await bootstrap(env);const d={title:'Rename test',slug:'old-name',body:'Article body',excerpt:'An excerpt',author:'Artist',category:'News',status:'draft',metadata:{}};
 const created=await call(env,'portal/publishing','POST',d,owner);assert.equal(created.status,200);const r=await call(env,'portal/publishing/'+created.body.id,'GET',null,owner);
 assert.equal((await call(env,'portal/publishing/'+created.body.id,'PATCH',{...d,slug:'new-name',revision:r.body.article.revision},owner)).status,200);
 assert.equal(JSON.parse(sql.prepare('SELECT value FROM label_settings WHERE key=?').get('article-alias:old-name').value).articleId,created.body.id);
 assert.equal((await call(env,'portal/publishing','POST',d,owner)).status,400);
});

test('exhausted email verification sends one security warning and never grants access',async()=>{
 const {env,sql}=setup();await bootstrap(env);sql.prepare('DELETE FROM security_proofs').run();sql.prepare('DELETE FROM security_challenges').run();const sent=await call(env,'portal/security/send','POST',{},owner);assert.equal(sent.status,200);const correct=/Your code is: (\d{6})/.exec(verificationEmails.at(-1).text)[1],wrong=correct==='000000'?'999999':'000000';const before=securityEmails.length;
 for(let i=0;i<6;i++)assert.equal((await call(env,'portal/security/verify','POST',{code:wrong},owner)).status,400);
 assert.equal(securityEmails.length,before+1);assert.equal(securityEmails.at(-1).subject,'Administrator verification attempts blocked');assert.equal((await call(env,'portal/members','GET',null,owner)).status,403);
});
