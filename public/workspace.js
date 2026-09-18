(()=>{
const modules=window.LabelWorkspaceModules||[],esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const allowed=a=>modules.filter(m=>m.roles.includes(a.role));
const statusClass=s=>{const x=String(s||'').toLowerCase();if(/complete|ready|approved|published|closed|resolved|renewed|paid|accepted|verified|passed/.test(x))return 'ok';if(/hold|paused|blocked|declined|expired|rejected|overdue|urgent|escalated|banned|suspended/.test(x))return 'bad';if(/review|pending|progress|proposed|active|investigat|negotiat|running|scheduled|assigned|follow/.test(x))return 'warn';return 'neutral';};
const badge=s=>`<span class="label-tag status-${statusClass(s)}">${esc(String(s).replaceAll('_',' '))}</span>`;

const SAMPLES={
 'roster-intake':[{title:'New artist · intake packet',owner:'A&R / Manager',status:'Invited',details:{artist:'Artist name',contact:'manager@example.com',start:'',catalog:'Singles / EP overview',goals:'First release milestones and onboarding goals'},hint:'Collect contacts and goals — never store passwords or tax IDs.'}],
 'artist-onboarding':[{title:'Client account setup',owner:'Label ops',status:'Draft',details:{f0:'Artist',f1:'artist@example.com',f2:'',f3:'Assigned manager',f4:'Onboarding checklist notes'},hint:'Create the portal client account after contact details are confirmed.'}],
 'release-plans':[{title:'Single release plan',owner:'Release lead',status:'Draft',details:{f0:'Artist',f1:'Single',f2:'',f3:'Distributor',f4:'Launch objective and channel plan'},hint:'Confirm master ownership before scheduling distribution.'}],
 'campaign-plans':[{title:'Launch campaign brief',owner:'Marketing',status:'Draft',details:{f0:'Release title',f1:'Core audience',f2:'',f3:'Primary channel',f4:'Campaign objective, assets, and success measure'},hint:'One measurable objective per campaign.'}],
 'press-outreach':[{title:'Press pitch · outlet shortlist',owner:'Press',status:'Draft',details:{f0:'Outlet',f1:'editor@example.com',f2:'Release',f3:'',f4:'Personalized pitch draft'},hint:'Send pitches from your email service; record responses here.'}],
 'approval-queue':[{title:'Artwork / copy approval',owner:'Approver',status:'In review',details:{f0:'Project',f1:'Reviewer name',f2:'',f3:'https://',f4:'What needs a decision and by when'},hint:'Record the decision — this does not notify externally.'}],
 'legal-holds':[{title:'Scoped preservation hold',owner:'Compliance',status:'Proposed',details:{scope:'Systems and record categories in scope',reason:'Matter reference / authority',start:'',review:'',release:'Release authority when hold ends'},hint:'Saving a hold records instructions; configure vendors separately.'}],
 'budgets':[{title:'Release marketing budget',owner:'Finance',status:'Draft',details:{f0:'Project',f1:'USD',f2:'0.00',f3:'Budget owner',f4:'Line-item breakdown'},hint:'Planning only — does not authorize payment.'}],
 'asset-register':[{title:'Approved cover art v1',owner:'Creative',status:'Draft',details:{f0:'Project',f1:'Cover artwork',f2:'https://',f3:'v1',f4:'Usage and permission notes'},hint:'Link approved storage; archive superseded versions.'}],
 'knowledge-base':[{title:'How we run release checklists',owner:'Ops',status:'Draft',details:{f0:'Release operations',f1:'Document owner',f2:'',f3:'https://',f4:'Step-by-step working instructions'},hint:'Keep instructions concrete and reviewable.'}],
 'decision-log':[{title:'Release date decision',owner:'Leadership',status:'Draft',details:{f0:'Project',f1:'',f2:'Decision maker',f3:'',f4:'Options considered and rationale'},hint:'Separate decisions from ideas.'}],
 'risk-register':[{title:'Delivery / rights risk',owner:'Risk owner',status:'Draft',details:{f0:'Project',f1:'Owner',f2:'Impact summary',f3:'',f4:'Risk description and mitigation'},hint:'Do not store secrets or exploit details.'}],
 'label-calendar':[{title:'Weekly label standup',owner:'Ops',status:'Draft',details:{f0:'Meeting',f1:'',f2:'Time and timezone',f3:'Participants',f4:'Agenda'},hint:'Send calendar invites in your email/calendar app.'}]
};

const RELATED={
 'roster-intake':[['artist-onboarding','Artist onboarding'],['clients/','Client directory'],['community-accounts/','Community accounts']],
 'artist-onboarding':[['roster-intake','Roster intake'],['contracts/','Contracts'],['team/','Team & access']],
 'release-plans':[['campaign-plans','Campaign plans'],['track-register','Track register'],['approval-queue','Approval queue']],
 'campaign-plans':[['press-outreach','Press outreach'],['content-calendar','Content calendar'],['advertising/','Advertising']],
 'press-outreach':[['press-campaigns','Press campaigns'],['campaign-plans','Campaign plans']],
 'approval-queue':[['legal-holds','Legal holds'],['release-signoffs','Release sign-offs'],['contracts/','Contracts']],
 'legal-holds':[['approval-queue','Approval queue'],['retention-reviews','Retention reviews'],['compliance-handbook/','Compliance handbook']],
 'budgets':[['expense-register','Expense register'],['earnings/','Earnings ledger'],['payment-requests','Payment requests']],
 'asset-register':[['artwork','Artwork approvals'],['asset-delivery','Asset delivery'],['content-calendar','Content calendar']],
 'knowledge-base':[['decision-log','Decision log'],['workflow-templates','Workflow templates'],['guide/','Portal guide']],
 'decision-log':[['risk-register','Risk register'],['knowledge-base','Knowledge base'],['meeting-notes','Meeting notes']],
 'risk-register':[['decision-log','Decision log'],['business-continuity','Business continuity'],['incident-log','Security incidents']],
 'label-calendar':[['tasks/','Tasks'],['meeting-actions','Meeting actions'],['important-dates','Important dates']]
};

function navigation(a,view){const list=allowed(a);return list.length?`<div class="workspace-navigation"><h2>Label departments</h2>${[...new Set(list.map(m=>m.group))].map(group=>`<details ${list.some(m=>m.group===group&&m.slug===view)?'open':''}><summary>${esc(group)}</summary>${list.filter(m=>m.group===group).map(m=>`<a href="/portal/${m.slug}/" ${m.slug===view?'aria-current="page"':''}>${esc(m.title)}</a>`).join('')}</details>`).join('')}</div>`:'';}
function directory(a){const list=allowed(a);const priority=list.filter(m=>SAMPLES[m.slug]);return list.length?`<section class="workspace-directory"><p class="eyebrow">YOUR LABEL, ORGANIZED</p><h2>Explore your departments</h2><p>Plan releases, coordinate people, and keep decisions in one private workspace.</p>${priority.length?`<div class="portal-priority-strip"><h3>Priority desks</h3><div class="portal-chip-row">${priority.map(m=>`<a class="portal-chip" href="/portal/${m.slug}/">${esc(m.title)}</a>`).join('')}</div></div>`:''}<div class="workspace-departments">${[...new Set(list.map(m=>m.group))].map((g,i)=>`<article><span class="workspace-number">0${i+1}</span><h3>${esc(g)}</h3>${list.filter(m=>m.group===g).map(m=>`<a href="/portal/${m.slug}/">${esc(m.title)} <span aria-hidden="true">↗</span></a>`).join('')}</article>`).join('')}</div></section>`:'';}

async function render(view,panel,a,api){
 const m=allowed(a).find(m=>m.slug===view);if(!m)throw Error('This workspace is unavailable for your role.');
 let records=[],archived=false,query='',status='',ownerFilter='',dueOnly=false,board=false,selected=null;
 const endpoint='portal/workspace/'+m.slug;
 const samples=SAMPLES[m.slug]||[];
 const related=RELATED[m.slug]||[];
 panel.innerHTML=`<section class="workspace-hero"><p class="eyebrow">BLINDBANDIT RECORDS / ${esc(m.group)}</p><h2>${esc(m.title)}</h2><p>${esc(m.description)}</p><div class="workspace-actions"><button class="button" data-new>New record</button><a href="#workspace-guide">Workflow guide</a>${related.length?related.map(([path,label])=>`<a href="/portal/${path}" data-full-navigation>${esc(label)}</a>`).join(''):''}</div></section><div data-stats class="label-stats"></div><div class="workspace-toolbar"><label>Search records<input type="search" data-search placeholder="Title, owner, or details"></label><label>Status<select data-filter><option value="">All statuses</option>${m.statuses.map(s=>`<option>${esc(s)}</option>`).join('')}</select></label><label>Owner<input type="search" data-owner-filter placeholder="Filter by owner"></label><label>Collection<select data-collection><option value="active">Active records</option><option value="archive">Archived records</option></select></label><label class="workspace-check"><input type="checkbox" data-due-only> Due / overdue only</label><button data-layout aria-pressed="false">Board view</button><button data-export>Export CSV</button></div><p data-feedback role="status" aria-live="polite"></p><div data-records></div><section data-editor hidden class="workspace-editor"></section><details id="workspace-guide" class="workspace-guide"><summary>How to use ${esc(m.title.toLowerCase())}</summary><p>${esc(m.description)}</p><ol>${m.checklist.map(s=>`<li>${esc(s)}</li>`).join('')}</ol><p>${esc(m.note)}</p><p>Give each record a clear title, assign a responsible person, and set a due date. Use In review when a decision is needed and Complete when the work is finished. Archive older records to keep the active view focused.</p></details>`;
 const el=s=>panel.querySelector(s),feedback=t=>el('[data-feedback]').textContent=t;
 const filtered=()=>{const today=new Date().toISOString().slice(0,10);return records.filter(r=>{
  if(status&&r.status!==status)return false;
  if(ownerFilter&&!(r.owner||'').toLowerCase().includes(ownerFilter))return false;
  if(dueOnly&&!(r.due_date&&r.due_date<=today))return false;
  if(query&&![r.title,r.owner,...Object.values(r.details)].join(' ').toLowerCase().includes(query))return false;
  return true;
 });};
 function draw(){
  const today=new Date().toISOString().slice(0,10),open=records.filter(r=>!/complete|closed|ready|approved|published/i.test(r.status));
  const overdue=open.filter(r=>r.due_date&&r.due_date<today).length;
  el('[data-stats]').innerHTML=[['Records',records.length],['In progress',open.length],['Past due',overdue],['Statuses',m.statuses.length]].map(([l,n])=>`<article><span>${l}</span><strong>${n}</strong></article>`).join('');
  const rows=filtered();
  const card=r=>{const late=r.due_date&&r.due_date<today&&!/complete|closed|ready|approved/i.test(r.status);return `<article class="workspace-record${late?' is-overdue':''}"><div class="label-section-bar">${badge(r.status)}<span class="small">${r.checklist.filter(Boolean).length}/${m.checklist.length} steps</span></div><h3><button data-edit="${r.id}">${esc(r.title)}</button></h3><p>${esc(r.owner)||'Unassigned'} · ${r.due_date?(late?'<strong class="overdue-label">Overdue </strong>':'Due ')+esc(r.due_date):'No due date'}</p><progress value="${r.checklist.filter(Boolean).length}" max="${m.checklist.length}" aria-label="Checklist progress for ${esc(r.title)}"></progress><p class="small">Updated ${esc(new Date(r.updated_at).toLocaleDateString())}</p></article>`;};
  const emptyHtml=!records.length&&!archived
   ?`<div class="label-empty portal-empty-rich"><img src="/assets/empty-state-castle-aurora-v1.jpg" alt="" width="280" height="160" decoding="async"><h3>Ready for your first ${esc(m.title.toLowerCase())} record</h3><p>Create a blank record or start from a sample pattern. Samples stay on this device until you save.</p>${samples.length?`<div class="portal-sample-grid">${samples.map((s,i)=>`<article><h4>${esc(s.title)}</h4><p>${esc(s.hint||'')}</p><button type="button" class="button" data-sample="${i}">Use sample pattern</button></article>`).join('')}</div>`:''}<p><button type="button" class="button" data-new-empty>Create blank record</button></p></div>`
   :`<div class="label-empty"><h3>${records.length?'No matching records':archived?'Your archive is empty':'Ready for your first record'}</h3><p>${records.length?'Try another search, owner, or status.':archived?'Archived work will appear here.':'Create a record to start tracking this workflow.'}</p></div>`;
  el('[data-records]').innerHTML=!rows.length?emptyHtml:board?`<div class="workspace-board">${m.statuses.map(s=>`<section><h3>${esc(s)} <span class="small">${rows.filter(r=>r.status===s).length}</span></h3>${rows.filter(r=>r.status===s).map(card).join('')||'<p class="small">No records</p>'}</section>`).join('')}</div>`:`<div class="workspace-record-grid">${rows.map(card).join('')}</div>`;
  el('[data-records]').querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>edit(records.find(r=>r.id===b.dataset.edit)));
  el('[data-records]').querySelectorAll('[data-sample]').forEach(b=>b.onclick=()=>edit(null,samples[+b.dataset.sample]));
  el('[data-records]').querySelectorAll('[data-new-empty]').forEach(b=>b.onclick=()=>edit());
 }
 async function refresh(){const d=await api(endpoint+(archived?'?archived=1':''));records=d.records;draw();if(d.hasMore)feedback('Showing the 500 most recently updated records. Export covers this collection only.');}
 function edit(r=null,sample=null){
  selected=r;const editor=el('[data-editor]');editor.hidden=false;
  const seed=sample?{title:sample.title,status:sample.status||m.statuses[0],owner:sample.owner||'',due_date:'',details:sample.details||{},checklist:m.checklist.map(()=>false),revision:undefined}:r;
  const input=(label,key,type='text',value='',required=false)=>`<label>${esc(label)}<input name="${key}" type="${type==='money'?'text':type}" ${type==='money'?'inputmode="decimal"':''} value="${esc(value)}" maxlength="${key==='title'?200:key==='owner'?120:500}" ${required?'required':''}></label>`;
  editor.innerHTML=`<div class="label-section-bar"><h3 tabindex="-1">${r?'Edit record':sample?'Create from sample':'Create record'}</h3><button type="button" data-close>Close editor</button></div><form class="label-form"><div class="workspace-form-grid">${input('Record title','title','text',seed?.title||'',true)}<label>Status<select name="status">${m.statuses.map(s=>`<option ${seed?.status===s?'selected':''}>${esc(s)}</option>`).join('')}</select></label>${input('Responsible person or team','owner','text',seed?.owner||'')}${input('Due date','dueDate','date',seed?.due_date||'')}${m.fields.map(f=>f.type==='textarea'?`<label class="workspace-wide">${esc(f.label)}<textarea name="${f.key}" rows="5" maxlength="6000">${esc(seed?.details?.[f.key]||'')}</textarea></label>`:input(f.label,f.key,f.type,seed?.details?.[f.key]||'')).join('')}</div><fieldset class="workspace-checklist"><legend>Review checklist</legend>${m.checklist.map((s,i)=>`<label><input type="checkbox" name="check${i}" ${seed?.checklist?.[i]?'checked':''}>${esc(s)}</label>`).join('')}</fieldset><p class="small">${esc(m.note)}${sample?.hint?' '+esc(sample.hint):''}</p><div class="workspace-actions"><button class="button" type="submit">Save record</button>${r?`<button type="button" data-archive>${r.archived?'Restore to active':'Archive record'}</button>`:''}</div><p role="status" aria-live="polite"></p></form>`;
  editor.querySelector('h3').focus();editor.querySelector('[data-close]').onclick=()=>{editor.hidden=true;el('[data-new]').focus();};
  const form=editor.querySelector('form');
  async function save(archive){const output=form.querySelector('[role=status]'),buttons=form.querySelectorAll('button');buttons.forEach(b=>b.disabled=true);output.textContent='Saving…';try{const f=new FormData(form),body={title:f.get('title'),status:f.get('status'),owner:f.get('owner'),dueDate:f.get('dueDate'),details:Object.fromEntries(m.fields.map(x=>[x.key,f.get(x.key)])),checklist:m.checklist.map((_,i)=>f.has('check'+i)),archived:archive,revision:selected?.revision};const d=await api(endpoint+(selected?'/'+selected.id:''),selected?'PATCH':'POST',body);selected={...body,id:d.id,revision:d.revision,due_date:body.dueDate,archived:archive};output.textContent='Record saved.';feedback(archive?'Record archived.':'Record saved.');await refresh();edit(selected);editor.querySelector('[role=status]').textContent='Record saved.';}catch(e){output.textContent=e.message;}finally{buttons.forEach(b=>b.disabled=false);}}
  form.onsubmit=e=>{e.preventDefault();save(Boolean(selected?.archived));};
  const archiveButton=editor.querySelector('[data-archive]');if(archiveButton)archiveButton.onclick=()=>{if(form.reportValidity())save(!selected.archived);};
 }
 el('[data-new]').onclick=()=>edit();
 el('[data-search]').oninput=e=>{query=e.target.value.toLowerCase().trim();draw();};
 el('[data-filter]').onchange=e=>{status=e.target.value;draw();};
 el('[data-owner-filter]').oninput=e=>{ownerFilter=e.target.value.toLowerCase().trim();draw();};
 el('[data-due-only]').onchange=e=>{dueOnly=e.target.checked;draw();};
 el('[data-layout]').onclick=e=>{board=!board;e.target.setAttribute('aria-pressed',String(board));e.target.textContent=board?'List view':'Board view';draw();};
 el('[data-collection]').onchange=async e=>{archived=e.target.value==='archive';try{await refresh();}catch(err){feedback(err.message);}};
 el('[data-export]').onclick=()=>{const rows=[['Title','Status','Owner','Due date',...m.fields.map(f=>f.label),'Completed steps','Updated'],...filtered().map(r=>[r.title,r.status,r.owner,r.due_date,...m.fields.map(f=>r.details[f.key]),r.checklist.filter(Boolean).length,new Date(r.updated_at).toISOString()])];const csv=rows.map(r=>r.map(v=>'"'+String(v??'').replace(/^[\s]*[=+@-]/,"'$&").replaceAll('"','""')+'"').join(',')).join('\r\n'),url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'})),link=document.createElement('a');link.href=url;link.download='blindbandit-'+m.slug+'.csv';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);feedback('Exported '+filtered().length+' records.');};
 await refresh();
 const requested=new URLSearchParams(location.search).get('record');
 if(requested){const target=records.find(r=>r.id===requested);if(target)edit(target);else feedback('This record is outside the loaded collection or is no longer available.');}
}
window.LabelWorkspace={navigation,directory,render,statusBadge:badge};
})();
