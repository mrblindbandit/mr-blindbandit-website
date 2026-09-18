import {q,hash,response,id,audit} from './editorial-common';
const alphabet='ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
export function encode32(bytes:Uint8Array){let bits=0,value=0,out='';for(const b of bytes){value=(value<<8)|b;bits+=8;while(bits>=5){out+=alphabet[(value>>>(bits-5))&31];bits-=5;}}if(bits)out+=alphabet[(value<<(5-bits))&31];return out;}
function decode32(s:string){let bits=0,value=0;const out=[];for(const c of s){value=(value<<5)|alphabet.indexOf(c);bits+=5;if(bits>=8){out.push((value>>>(bits-8))&255);bits-=8;}}return new Uint8Array(out);}
export async function totp(secret:string,counter:number){const data=new Uint8Array(8);new DataView(data.buffer).setBigUint64(0,BigInt(counter));const k=await crypto.subtle.importKey('raw',decode32(secret),{name:'HMAC',hash:'SHA-1'},false,['sign']);const b=new Uint8Array(await crypto.subtle.sign('HMAC',k,data)),offset=b[19]&15;return String(((b[offset]&127)*16777216+b[offset+1]*65536+b[offset+2]*256+b[offset+3])%1000000).padStart(6,'0');}
async function key(env:any){return crypto.subtle.importKey('raw',await crypto.subtle.digest('SHA-256',new TextEncoder().encode('totp-encryption:'+env.PORTAL_AUTH_SECRET)),{name:'AES-GCM'},false,['encrypt','decrypt']);}
async function seal(env:any,user:string,secret:string){const iv=crypto.getRandomValues(new Uint8Array(12)),bytes=new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:new TextEncoder().encode(user)},await key(env),new TextEncoder().encode(secret)));return {iv:Array.from(iv),cipher:Array.from(bytes)};}
async function open(env:any,user:string,data:any){return new TextDecoder().decode(await crypto.subtle.decrypt({name:'AES-GCM',iv:new Uint8Array(data.iv),additionalData:new TextEncoder().encode(user)},await key(env),new Uint8Array(data.cipher)));}
/** Legacy TOTP rows may still exist in D1; enrollment and verification are retired in favor of Clerk MFA. */
export async function authenticatorEnabled(env:any,user:string){return false;}
async function limited(env:any,user:string){return true;}
export async function consumeTOTP(env:any,user:string,code:any){return false;}
export async function authenticatorAction(request:Request,env:any,a:any,d:any,fresh:boolean){
 const clerkNotice={enabled:false,retired:true,message:'Google Authenticator (TOTP) inside the label portal is retired. Use multi-factor authentication on your production Clerk account.',clerk_account:'https://mrblindbandit.net/account',clerk_sign_in:'https://mrblindbandit.net/sign-in?redirect_url=%2Fportal%2F'};
 if(request.method==='GET')return response(clerkNotice);
 return response({error:clerkNotice.message,code:'CLERK_MFA_REQUIRED',...clerkNotice},410);
}
