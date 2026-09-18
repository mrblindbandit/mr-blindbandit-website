import {portalForPlatform} from '../portal';
import {platformVerification} from '../security';
import {ApiError,audit,type Env} from './core';
import type {Actor} from './auth';

/** Closed route mappings call the existing authorization and validation code. */
export async function legacy(c:{request:Request;env:Env;a:Actor;data:any;rid:string;url:URL},path:string,method=c.request.method){
  const url=new URL('/api/portal/'+path,'https://mrblindbandit.net');
  url.search=c.url.search;
  const headers=new Headers({'origin':'https://mrblindbandit.net','content-type':'application/json'});
  const ip=c.request.headers.get('cf-connecting-ip');if(ip)headers.set('cf-connecting-ip',ip);
  const request=new Request(url,{method,headers,body:method==='GET'?undefined:JSON.stringify(c.data)});
  const pending:Promise<unknown>[]=[];
  const identity={...c.a,sessionKey:c.a.sessionId||c.a.sourceSession,recovery:false,[platformVerification]:c.a.verifiedAt};
  const response=await portalForPlatform(request,c.env as any,{waitUntil:(p:Promise<unknown>)=>pending.push(p)},identity);
  await Promise.allSettled(pending);
  const data=await response.json() as any;
  if(!response.ok)throw new ApiError(response.status,response.status===403?'PERMISSION_OR_VERIFICATION_REQUIRED':response.status===409?'REVISION_CONFLICT':'REQUEST_REJECTED',response.status>=500?'The existing portal service is unavailable.':'The portal rejected this request. Check your permissions, verification, fields, and record revision.');
  if(method!=='GET')await audit(c.env,c.a.id,'label.api_write',path,c.rid).run();
  return data;
}
