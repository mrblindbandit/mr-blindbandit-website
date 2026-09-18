(()=>{
 const money=new Intl.NumberFormat(undefined,{style:'currency',currency:'USD'});
 const number=n=>new Intl.NumberFormat(undefined,{maximumFractionDigits:4}).format(n);
 const text=(form,value)=>{const out=form.querySelector('output');out.textContent=value;form.dataset.result=value;form.querySelectorAll('[data-tool-copy],[data-tool-download],[data-tool-print]').forEach(b=>b.disabled=!value);};
 const values=form=>Object.fromEntries(new FormData(form));
 const save=(key,value)=>{try{localStorage.setItem('bb-tool-'+key,JSON.stringify(value));}catch{}}
 const download=(name,body)=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([body],{type:'text/plain;charset=utf-8'}));a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);};
 const zones=['Asia/Manila','America/New_York','America/Los_Angeles','Europe/London','UTC'];
 const zonedInstant=(local,zone)=>{const wanted=Date.parse(local+':00Z');let guess=new Date(wanted),fmt=new Intl.DateTimeFormat('en-CA',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'});for(let i=0;i<3;i++){const p=Object.fromEntries(fmt.formatToParts(guess).filter(x=>x.type!=='literal').map(x=>[x.type,x.value]));const shown=Date.UTC(+p.year,+p.month-1,+p.day,+p.hour,+p.minute,+p.second);guess=new Date(guess.valueOf()+wanted-shown);}return guess;};
 document.querySelectorAll('[data-everyday-tool]').forEach(form=>{
  const kind=form.dataset.everydayTool;
  if(['daily-planner','checklist-maker'].includes(kind)){try{const old=JSON.parse(localStorage.getItem('bb-tool-'+kind)||'null');if(old)for(const [name,value] of Object.entries(old)){const field=form.elements.namedItem(name);if(field)field.value=value;}}catch{}}
  if(kind==='daily-planner'&&!form.elements.date.value)form.elements.date.value=new Date().toISOString().slice(0,10);
  form.addEventListener('submit',e=>{e.preventDefault();if(!form.reportValidity())return;const v=values(form);let result='';
   if(kind==='daily-planner'){result=[v.date,'TODAY’S PRIORITIES',v.priorities||'None entered','SCHEDULE',v.schedule||'None entered','NOTES',v.notes||'None entered'].join('\n\n');save(kind,v);}
   if(kind==='time-zone-planner'){const instant=zonedInstant(v.datetime,v.zone);result=zones.map(z=>new Intl.DateTimeFormat(undefined,{dateStyle:'full',timeStyle:'long',timeZone:z}).format(instant)+' — '+z).join('\n');}
   if(kind==='tip-calculator'){const amount=+v.amount,tip=amount*(+v.tip/100),total=amount+tip,people=Math.max(1,+v.people);result='Tip: '+money.format(tip)+'\nTotal: '+money.format(total)+'\nPer person: '+money.format(total/people);}
   if(kind==='percentage-calculator'){const a=+v.a,b=+v.b;if(v.mode==='of')result=number(a)+'% of '+number(b)+' = '+number(a*b/100);if(v.mode==='change')result=a===0?'A percentage change cannot start from zero.':'Change: '+number((b-a)/Math.abs(a)*100)+'%';if(v.mode==='discount')result='Price after discount: '+money.format(a*(1-b/100));}
   if(kind==='unit-converter'){const x=+v.value,map={'km-mi':[.621371,' miles'],'mi-km':[1.609344,' kilometers'],'kg-lb':[2.204623,' pounds'],'lb-kg':[.453592,' kilograms']};if(map[v.kind])result=number(x*map[v.kind][0])+map[v.kind][1];if(v.kind==='c-f')result=number(x*9/5+32)+' °F';if(v.kind==='f-c')result=number((x-32)*5/9)+' °C';}
   if(kind==='date-calculator'){const start=new Date(v.start+'T00:00:00');if(v.mode==='between'){const end=new Date(v.end+'T00:00:00');result=Number.isNaN(end.valueOf())?'Enter the ending date as YYYY-MM-DD.':number(Math.abs(end-start)/86400000)+' days between the dates.';}else{const days=Number(v.end);if(!Number.isFinite(days))result='Enter a valid number of days.';else{start.setDate(start.getDate()+days);result='Result: '+new Intl.DateTimeFormat(undefined,{dateStyle:'full'}).format(start);}}}
   if(kind==='password-generator'){let chars='abcdefghijklmnopqrstuvwxyz';if(v.upper)chars+='ABCDEFGHIJKLMNOPQRSTUVWXYZ';if(v.numbers)chars+='0123456789';if(v.symbols)chars+='!@#$%^&*_-+=?';const bytes=crypto.getRandomValues(new Uint32Array(+v.length));result=[...bytes].map(n=>chars[n%chars.length]).join('');}
   if(kind==='text-toolkit'){const raw=v.text;if(v.action==='count')result='Words: '+(raw.trim()?raw.trim().split(/\s+/).length:0)+'\nCharacters: '+raw.length+'\nCharacters without spaces: '+raw.replace(/\s/g,'').length;else if(v.action==='spaces')result=raw.replace(/[ \t]+/g,' ').replace(/\n{3,}/g,'\n\n').trim();else if(v.action==='lower')result=raw.toLowerCase();else if(v.action==='upper')result=raw.toUpperCase();else result=raw.toLowerCase().replace(/\b\p{L}/gu,c=>c.toUpperCase());}
   if(kind==='file-name-cleaner'){const dot=v.filename.lastIndexOf('.'),ext=dot>0?v.filename.slice(dot).toLowerCase().replace(/[^.a-z0-9]/g,''):'',base=(dot>0?v.filename.slice(0,dot):v.filename).normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,v.style==='underscore'?'_':'-').replace(/^[-_]+|[-_]+$/g,'');result=(base||'file')+ext;}
   if(kind==='checklist-maker'){const items=(v.items||'').split('\n').map(s=>s.trim()).filter(Boolean);result=v.title+'\n\n'+items.map(i=>'☐ '+i).join('\n');save(kind,v);}
   text(form,result);
  });
  form.addEventListener('reset',()=>setTimeout(()=>text(form,'')));
  form.querySelector('[data-tool-copy]')?.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(form.dataset.result||'');text(form,(form.dataset.result||'')+'\n\nCopied to clipboard.');}catch{text(form,(form.dataset.result||'')+'\n\nSelect and copy the result manually.');}});
  form.querySelector('[data-tool-download]')?.addEventListener('click',()=>download(kind+'.txt',form.dataset.result||''));
  form.querySelector('[data-tool-print]')?.addEventListener('click',()=>window.print());
 });
})();
