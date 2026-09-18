import {q,response,str,audit} from './editorial-common';
import {verified} from './security';
const key='advertising-settings';
const defaults={revision:0,enabled:false,bodySlot:'',endSlot:'',footerSlot:'',disabledPages:[]};
export const adPageAllowed=(path:string)=>/^\/(music|videos|news)\/$/.test(path)||/^\/journal\/articles\/[a-z0-9-]+\/$/.test(path);
async function settings(env:any){const row=await q(env,'SELECT value FROM label_settings WHERE key=?',key).first();return {row,value:row?{...defaults,...JSON.parse(row.value)}:defaults};}
export async function advertising(request:Request,env:any,a?:any,d?:any){const u=new URL(request.url),isPublic=u.pathname==='/api/advertising';
 if(isPublic){const path=u.searchParams.get('path')||'';if(!adPageAllowed(path))return response({active:false});const {value}=await settings(env);return response({active:value.enabled&&env.ADS_CMP_READY==='true'&&!value.disabledPages.includes(path),publisher:'ca-pub-7238428274233485',bodySlot:value.bodySlot,endSlot:value.endSlot,footerSlot:value.footerSlot});}
 if(!a||!['owner','admin'].includes(a.role))return response({error:'Administrator access required.'},403);
 const {row,value}=await settings(env);
 if(request.method==='GET')return response({...value,cmpReady:env.ADS_CMP_READY==='true',publisher:'ca-pub-7238428274233485'});
 if(request.method!=='POST')return response({error:'Method not allowed.'},405);
 if(a.role!=='owner')return response({error:'Only the owner can change advertising settings.'},403);
 if(!await verified(request,env,a,true))return response({error:'Verify your identity to continue.',verificationRequired:true},403);
 if(d.revision!==value.revision)return response({error:'Settings changed. Refresh before saving.'},409);
 try{const next={revision:value.revision+1,enabled:!!d.enabled,bodySlot:str(d.bodySlot||'',20,false),endSlot:str(d.endSlot||'',20,false),footerSlot:str(d.footerSlot||'',20,false),disabledPages:d.disabledPages};
 if([next.bodySlot,next.endSlot,next.footerSlot].some(s=>s&&!/^\d{1,20}$/.test(s)))throw Error('Use the numeric ad-unit slot IDs from your own AdSense account.');
 if(!Array.isArray(next.disabledPages)||next.disabledPages.length>100||next.disabledPages.some((p:any)=>typeof p!=='string'||!adPageAllowed(p)))throw Error('List up to 100 supported public page paths.');
 if(next.enabled&&env.ADS_CMP_READY!=='true')throw Error('Advertising remains off until the consent-platform integration is verified in the deployment environment. You can save your slot IDs with advertising disabled.');
 if(next.enabled&&!next.bodySlot&&!next.endSlot&&!next.footerSlot)throw Error('Enter at least one real ad-unit slot ID.');
 const raw=JSON.stringify(next),changed=row?await q(env,'UPDATE label_settings SET value=? WHERE key=? AND value=? RETURNING key',raw,key,row.value).first():await q(env,'INSERT INTO label_settings(key,value) VALUES(?,?) ON CONFLICT(key) DO NOTHING RETURNING key',key,raw).first();if(!changed)return response({error:'Settings changed. Refresh before saving.'},409);await audit(env,a.id,'advertising.settings_saved',key).run();return response({ok:true});
 }catch(e){return response({error:(e as Error).message},400);}
}
