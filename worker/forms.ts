import {submissionNotices} from './editorial-common';
import type {CommunityEnv} from './community';
const json=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json','cache-control':'no-store','x-content-type-options':'nosniff'}});
class FormError extends Error{constructor(message:string,public status=400){super(message);}}
const trim=(v:unknown,max:number,required=true)=>{if(typeof v!=='string'||v.trim().length>max||required&&!v.trim())throw new FormError('Please complete the required fields within the length limits.');return v.trim();};
async function digest(value:string){return [...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)))].map(n=>n.toString(16).padStart(2,'0')).join('');}
async function limit(db:any,key:string){const window=Math.floor(Date.now()/3600000);const row=await db.prepare('INSERT INTO community_limits (key,window,hits) VALUES (?,?,1) ON CONFLICT(key) DO UPDATE SET window=excluded.window,hits=CASE WHEN community_limits.window=excluded.window THEN community_limits.hits+1 ELSE 1 END WHERE community_limits.window<>excluded.window OR community_limits.hits<8 RETURNING hits').bind(key,window).first();if(!row)throw new FormError('Too many recent submissions. Please try again later.',429);}
export async function forms(request:Request,env:CommunityEnv,ctx?:any){let uploaded:string|null=null;try{
 const url=new URL(request.url),path=url.pathname;const email=request.headers.get('oai-authenticated-user-email'),moderator=!!email&&!!request.headers.get('oai-authenticated-user-id')&&email.toLowerCase()===env.COMMUNITY_MODERATOR_EMAIL?.toLowerCase();
 if(!env.DB)throw new FormError('Forms are temporarily unavailable. Please try again.',503);
 if(path.startsWith('/api/inbox'))return json({error:'Use the protected label inbox.'},410);
 if(request.method!=='POST')throw new FormError('Method not allowed.',405);
 if(request.headers.get('origin')!==url.origin)throw new FormError('Please submit from this website.',403);
 const kind=path.split('/').filter(Boolean).pop();if(!['submission','signup','inquiry'].includes(kind!))throw new FormError('Form not found.',404);
 const max=11*1024*1024;const reader=request.body?.getReader();if(!reader)throw new FormError('Empty submission.');let bytes=0;const chunks:Uint8Array[]=[];while(true){const {done,value}=await reader.read();if(done)break;bytes+=value.length;if(bytes>max){await reader.cancel();throw new FormError('Use an audio file smaller than 10 MB, or share a listening link.',413);}chunks.push(value);}
 let data:Record<string,any>,file:File|undefined;const contentType=request.headers.get('content-type')||'';
 if(contentType.includes('multipart/form-data')){const buffered=new Response(new Blob(chunks as BlobPart[]),{headers:{'content-type':contentType}});const fd=await buffered.formData();data=Object.fromEntries(fd);const f=fd.get('audio');if(f&&typeof f!=='string'&&f.size)file=f as File;}
 else if(contentType.includes('application/json')){if(bytes>16000)throw new FormError('The form is too long.',413);try{data=JSON.parse(await new Blob(chunks as BlobPart[]).text());}catch{throw new FormError('Invalid form data.');}}
 else throw new FormError('Unsupported form format.',415);
 if(data.website)return json({ok:true,message:'Received.'});
 const name=trim(data.name||'',120,kind!=='signup'),contact=trim(data.email,254).toLowerCase();if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact))throw new FormError('Enter a valid email address.');
 if(data.consent!==true&&data.consent!=='on')throw new FormError('Please confirm the consent checkbox.');
 const ip=request.headers.get('cf-connecting-ip')||'unknown';await limit(env.DB,'forms:'+await digest(ip+':'+new Date().toISOString().slice(0,10)));
 let details:Record<string,string>={};const id=kind==='signup'?await digest('signup:'+contact):crypto.randomUUID();
 if(kind==='submission'){
  details={title:trim(data.title,160),genre:trim(data.genre,100),link:trim(data.link||'',1500,false),message:trim(data.message||'',3000,false)};
  if(details.link){let u;try{u=new URL(details.link);}catch{throw new FormError('Use a complete listening URL.');}if(u.protocol!=='https:'&&u.protocol!=='http:')throw new FormError('Use an http or https listening link.');}
  if(!details.link&&!file)throw new FormError('Add a listening link or an audio file.');
  if(file){if(file.size>10*1024*1024||!(/\.(mp3|wav)$/i.test(file.name)))throw new FormError('Upload an MP3 or WAV smaller than 10 MB.');
   const signature=new Uint8Array(await file.slice(0,12).arrayBuffer());
   const ascii=(from:number,to:number)=>String.fromCharCode(...signature.slice(from,to));
   const wav=ascii(0,4)==='RIFF'&&ascii(8,12)==='WAVE';
   const mp3=ascii(0,3)==='ID3'||signature.length>=2&&signature[0]===255&&(signature[1]&224)===224&&(signature[1]&6)!==0&&(signature[1]&24)!==8;
   if(/\.wav$/i.test(file.name)?!wav:!mp3)throw new FormError('The file contents do not match an MP3 or WAV. Export a valid audio file or share a listening link.');
   if(!env.BUCKET)throw new FormError('Uploads are temporarily unavailable. Use a listening link instead.',503);uploaded='submissions/'+id;await env.BUCKET.put(uploaded,file.stream(),{httpMetadata:{contentType:'application/octet-stream'}});}
 }else if(kind==='inquiry')details={category:trim(data.category,100),message:trim(data.message,4000),reference:trim(data.reference||'',1500,false)};
 else details={interests:trim(data.interests||'Artist and label updates',200,false),consent:'Agreed to receive occasional artist and label updates'};
 if(kind==='inquiry'){
  for(const field of ['request_type','urgency','protected_work','contact_details','signature'])if(data[field])details[field]=trim(data[field],field==='protected_work'?2000:field==='contact_details'?1000:200);
  if(details.category==='Copyright notice'){
   if(!details.protected_work||!details.contact_details||!details.signature||!details.reference||data.good_faith!=='on'||data.accuracy!=='on')throw new FormError('Complete the work, location, contact, signature and copyright declarations.');
   try{const ref=new URL(details.reference);if(!['http:','https:'].includes(ref.protocol))throw Error();}catch{throw new FormError('Provide the exact http or https URL of the disputed material.');}
   details.good_faith='Declared good-faith belief of unauthorized use';details.accuracy='Declared accuracy and authority under penalty of perjury';
  }
 }
 details.policyVersion='2026-09-13';details.source=path;details.consent=details.consent||'Confirmed form consent';details.consentAt=new Date().toISOString();
 const createdAt=Date.now();
 const saved=await env.DB.prepare('INSERT OR IGNORE INTO site_requests (id,kind,name,email,details,storage_key,file_name,created_at) VALUES (?,?,?,?,?,?,?,?)').bind(id,kind,name,contact,JSON.stringify(details),uploaded,file?.name||null,createdAt).run();
 uploaded=null; // Storage committed: email failure must never delete an accepted upload.
 if(saved.meta?.changes!==0){await env.DB.prepare('INSERT INTO inbox_threads (id,department,updated_at) VALUES (?,?,?) ON CONFLICT(id) DO NOTHING').bind(id,details.category||kind,createdAt).run();const notices=submissionNotices(env,{id,kind,name,email:contact,details:JSON.stringify(details),created_at:createdAt}).catch(()=>console.error('Submission notification failed'));if(ctx)ctx.waitUntil(notices);else await notices;}
 return json({ok:true,reference:id,message:kind==='signup'?"You’re on the list. Thank you for connecting.":'Your '+(kind==='submission'?'music submission':'inquiry')+' has been received.'},201);
 }catch(e){if(uploaded&&env.BUCKET){try{await env.BUCKET.delete(uploaded);}catch{}}if(e instanceof FormError)return json({error:e.message},e.status);console.error('Form storage failed',e);return json({error:'We could not save your form. Your information is still here; please try again.'},503);}}
