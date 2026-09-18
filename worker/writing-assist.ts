import {q,response} from './editorial-common';
export async function writingAssist(env:any,d:any){
 if(typeof d.body!=='string'||d.body.trim().length<20||d.body.length>15000)return response({error:'Enter between 20 and 15,000 characters to suggest article details.'},400);
 const plain=d.body.replace(/^##?\s*/gm,'').replace(/\s+/g,' ').trim();
 const first=plain.split(/(?<=[.!?])\s/)[0];
 const candidate=typeof d.title==='string'&&d.title.trim()?d.title.trim():first;const title=(candidate.length>100?candidate.slice(0,100).replace(/\s+\S*$/,''):candidate).replace(/[.!?]+$/,'')||'Label update';
 let base=title.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,100).replace(/-$/,'')||'label-update';
 let slug=base;for(let n=2;n<=50;n++){const exists=await q(env,'SELECT id FROM site_articles WHERE slug=?',slug).first();if(!exists)break;slug=base+'-'+n;}if(await q(env,'SELECT id FROM site_articles WHERE slug=?',slug).first())slug=base+'-'+crypto.randomUUID().slice(0,8);
 return response({title,slug,excerpt:plain.length>260?plain.slice(0,257).replace(/\s+\S*$/,'')+'…':plain,method:'Text-based suggestions; review before saving. No AI service is used.'});
}
