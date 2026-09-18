import {q,response,id,str,audit} from './editorial-common';
export async function personalTools(request:Request,env:any,a:any,d:any){
 const kind=new URL(request.url).pathname.split('/').pop();if(!['reply-templates','personal-notes'].includes(kind!))return response({error:'Page not found.'},404);
 if(kind==='reply-templates'&&!['owner','admin'].includes(a.role))return response({error:'Administrator access required.'},403);
 const key=kind==='personal-notes'?'personal-notes:'+a.id:'reply-templates',row=await q(env,'SELECT value FROM label_settings WHERE key=?',key).first(),saved=row?JSON.parse(row.value):{revision:0,items:[]};
 if(request.method==='GET')return response(saved);
 if(!['POST','DELETE'].includes(request.method))return response({error:'Method not allowed.'},405);
 if(d.revision!==saved.revision)return response({error:'This page changed on another device. Refresh before saving.'},409);
 try{
 const items=[...saved.items],index=items.findIndex((x:any)=>x.id===d.id);let record=d.id||id();
 if(d.id&&index<0)return response({error:'Item not found.'},404);
 if(request.method==='DELETE'){if(d.confirm!=='DELETE')return response({error:'Confirm deletion.'},400);items.splice(index,1);}
 else{const item={id:record,title:str(d.title,120),body:str(d.body,6000),updatedAt:Date.now()};if(index>=0)items[index]=item;else{if(items.length>=100)return response({error:'Limit of 100 items reached. Remove an unused item first.'},400);items.unshift(item);}}
 const value=JSON.stringify({revision:saved.revision+1,items});const changed=row?await q(env,'UPDATE label_settings SET value=? WHERE key=? AND value=? RETURNING key',value,key,row.value).first():await q(env,'INSERT INTO label_settings(key,value) VALUES(?,?) ON CONFLICT(key) DO NOTHING RETURNING key',key,value).first();
 if(!changed)return response({error:'Another edit was saved first. Refresh before saving.'},409);
 // Never put personal note contents or titles into the shared activity log.
 await audit(env,a.id,kind+'.'+(request.method==='DELETE'?'deleted':'saved'),record).run();return response({ok:true,id:record});
 }catch{return response({error:'Enter a title (up to 120 characters) and text (up to 6,000 characters).'},400);}
}
