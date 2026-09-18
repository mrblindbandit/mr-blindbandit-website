import Stripe from 'stripe';

const ORIGINS=new Set(['https://mrblindbandit.net','https://www.mrblindbandit.net','https://mr-blind-bandit.mrblindbandit.chatgpt.site','https://portal.mrblindbandit.net']);
const PURPOSE='blindbandit-support-v1';
const COOKIE='__Host-bb-stripe';
type Env={STRIPE_SECRET_KEY?:string;STRIPE_PUBLISHABLE_KEY?:string;DB:any};
const reply=(data:unknown,status=200,extra:Record<string,string>={})=>new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json','cache-control':'private, no-store','referrer-policy':'no-referrer','x-robots-tag':'noindex, nofollow',...extra}});
export const stripeClient=(env:any)=>{if(!env.STRIPE_SECRET_KEY)throw Error('Stripe is not configured.');return new Stripe(env.STRIPE_SECRET_KEY,{apiVersion:'2026-07-29.dahlia',httpClient:Stripe.createFetchHttpClient(),maxNetworkRetries:1,timeout:15000});};
const client=stripeClient;
export function supportAmount(value:unknown):number {
 if(typeof value!=='string'||!/^\d{1,3}(?:\.\d{1,2})?$/.test(value))throw Error('Enter a USD amount from $2 to $500, with up to two decimal places.');
 const [dollars,cents='']=value.split('.');const amount=Number(dollars)*100+Number(cents.padEnd(2,'0'));
 if(amount<200||amount>50000)throw Error('Choose a support amount between $2 and $500 USD.');return amount;
}
async function hash(value:string){return [...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)))].map(x=>x.toString(16).padStart(2,'0')).join('');}
async function limit(env:Env,request:Request,kind:string,max:number){const ip=request.headers.get('cf-connecting-ip')||'unknown',window=Math.floor(Date.now()/3600000);const key='stripe:'+kind+':'+await hash(ip);const row=await env.DB.prepare('INSERT INTO community_limits (key,window,hits) VALUES (?,?,1) ON CONFLICT(key) DO UPDATE SET window=excluded.window,hits=CASE WHEN community_limits.window=excluded.window THEN community_limits.hits+1 ELSE 1 END WHERE community_limits.window<>excluded.window OR community_limits.hits<? RETURNING hits').bind(key,window,max).first();return !!row;}
async function signature(value:string,secret:string){const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);return [...new Uint8Array(await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(value)))].map(x=>x.toString(16).padStart(2,'0')).join('');}
async function signedCookie(id:string,secret:string){const value=id+'.'+(Math.floor(Date.now()/1000)+86400);return COOKIE+'='+value+'.'+await signature(value,secret)+'; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=86400';}
async function receiptId(request:Request,secret:string){const raw=request.headers.get('cookie')?.split(';').map(x=>x.trim()).find(x=>x.startsWith(COOKIE+'='))?.slice(COOKIE.length+1)||'';const parts=raw.split('.');if(parts.length!==3||!/^cs_live_[A-Za-z0-9]+$/.test(parts[0])||!/^[0-9]+$/.test(parts[1])||Number(parts[1])<Date.now()/1000||Number(parts[1])>Date.now()/1000+86460)return null;const expected=await signature(parts[0]+'.'+parts[1],secret);if(parts[2].length!==expected.length)return null;let diff=0;for(let i=0;i<expected.length;i++)diff|=expected.charCodeAt(i)^parts[2].charCodeAt(i);return diff?null:parts[0];}
async function input(request:Request){const reader=request.body?.getReader();if(!reader)throw Error('Empty request.');const chunks:Uint8Array[]=[];let size=0;while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>2048){await reader.cancel();throw Error('Request too large.');}chunks.push(value);}return JSON.parse(await new Blob(chunks as BlobPart[]).text());}
export async function publicPayments(request:Request,env:Env,makeClient:any=client):Promise<Response>{
 const u=new URL(request.url);if(!ORIGINS.has(u.origin))return reply({error:'Use the official website.'},403);
 if(!env.STRIPE_SECRET_KEY)return reply({error:'Card support is temporarily unavailable. PayPal and Wise remain available.'},503);
 if(u.pathname==='/api/payments/checkout'){
  if(request.method!=='POST')return reply({error:'Method not allowed.'},405);
  if(request.headers.get('origin')!==u.origin||!request.headers.get('content-type')?.includes('application/json'))return reply({error:'Start checkout from this website.'},403);
  let data,amount;try{data=await input(request);amount=supportAmount(data.amount);if(!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(data.attempt||''))throw Error('Refresh the page and try again.');if(data.agree!==true)throw Error('Please accept the support terms before continuing.');}catch(e){return reply({error:(e as Error).message},400);}
  try{
   if(!await limit(env,request,'checkout',12))return reply({error:'Too many checkout attempts. Please try later.'},429);
   const stripe=makeClient(env),account=await stripe.accounts.retrieve();if(!account.charges_enabled)return reply({error:'Card payments are not yet enabled on this Stripe account. Please use PayPal or Wise for now.'},503);
   const s=await stripe.checkout.sessions.create({mode:'payment',locale:'auto',integration_identifier:'blindbandit_support_mrbdpqvx',line_items:[{quantity:1,price_data:{currency:'usd',unit_amount:amount,product_data:{name:'Support Mr. Blindbandit',description:'Voluntary one-time support. No product, subscription, royalty rights or charitable tax deduction is promised.'}}}],metadata:{purpose:PURPOSE,site:'mrblindbandit.net',policy_version:'2026-09-14'},payment_intent_data:{metadata:{purpose:PURPOSE,site:'mrblindbandit.net'}},success_url:u.origin+'/support/payment/',cancel_url:u.origin+'/support/card/?cancelled=1',custom_text:{submit:{message:'One-time voluntary support in USD. Review your total before paying. Support terms: https://mrblindbandit.net/payments/terms/'}}},{idempotencyKey:'bb-support-'+data.attempt});
   if(!s.livemode||!s.url||new URL(s.url).hostname!=='checkout.stripe.com')throw Error('Unexpected checkout response.');
   return reply({url:s.url},200,{'set-cookie':await signedCookie(s.id,env.STRIPE_SECRET_KEY)});
  }catch{return reply({error:'Stripe could not open checkout. Your card has not been entered on this site. Please retry or use another support method.'},502);}
 }
 if(u.pathname==='/api/payments/receipt'){
  if(request.method!=='GET')return reply({error:'Method not allowed.'},405);
  const id=await receiptId(request,env.STRIPE_SECRET_KEY);if(!id)return reply({error:'No recent checkout was found in this browser. Check your Stripe confirmation or contact support.'},404);
  try{if(!await limit(env,request,'receipt',90))return reply({error:'Please wait before checking again.'},429);const s=await makeClient(env).checkout.sessions.retrieve(id);if(!s.livemode||s.metadata?.purpose!==PURPOSE)return reply({error:'Checkout not found.'},404);return reply({status:s.payment_status,checkoutStatus:s.status,amount:s.amount_total,currency:s.currency,reference:s.id,created:s.created});}catch{return reply({error:'Payment status could not be checked. Do not pay again until you have checked your confirmation or contacted support.'},502);}
 }
 return reply({error:'Not found.'},404);
}
export async function stripeOverview(request:Request,env:Env,actor:any,makeClient:any=client){
 if(!['owner','admin'].includes(actor?.role))return reply({error:'Administrator access required.'},403);
 if(request.method!=='GET')return reply({error:'Use the Stripe Dashboard for account or payment changes.'},405);
 if(!env.STRIPE_SECRET_KEY)return reply({error:'Stripe server secret is not configured.'},503);
 const cursor=new URL(request.url).searchParams.get('after');if(cursor&&!/^cs_(live|test)_[A-Za-z0-9]+$/.test(cursor))return reply({error:'Invalid page cursor.'},400);
 try{
  const stripe=makeClient(env);const [account,balance,sessions]=await Promise.all([stripe.accounts.retrieve(),stripe.balance.retrieve(),stripe.checkout.sessions.list({limit:50,...(cursor?{starting_after:cursor}:{})})]);
  return reply({connected:true,live:balance.livemode,chargesEnabled:account.charges_enabled,payoutsEnabled:account.payouts_enabled,country:account.country,currency:account.default_currency,available:balance.available.map((x:any)=>({amount:x.amount,currency:x.currency})),pending:balance.pending.map((x:any)=>({amount:x.amount,currency:x.currency})),payments:sessions.data.filter((s:any)=>s.metadata?.purpose===PURPOSE).map((s:any)=>({id:s.id,amount:s.amount_total,currency:s.currency,status:s.payment_status,checkoutStatus:s.status,created:s.created})),next:sessions.has_more?sessions.data.at(-1)?.id:null});
 }catch{return reply({error:'Stripe could not verify this connection. Check key permissions and account status in Stripe.'},502);}
}
