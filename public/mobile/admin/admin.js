(()=>{
const API=async(path,opts={})=>{
  const r=await fetch(path,{credentials:'include',...opts,headers:{'content-type':'application/json',...(opts.headers||{})}});
  const j=await r.json().catch(()=>({}));
  if(!r.ok){const e=new Error(j.error?.message||('HTTP '+r.status));e.status=r.status;e.code=j.error?.code;throw e;}
  return j.data!==undefined?j.data:j;
};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const $=s=>document.querySelector(s);
let selected=null;

async function boot(){
  try{
    const me=await API('/api/v1/social/me');
    $('#admin-who').innerHTML=`Signed in as <strong>@${esc(me.handle)}</strong> (${esc(me.email||'')})`;
    await API('/api/v1/social/admin/overview');
    $('#admin-app').hidden=false;
    await refreshOverview();
    wire();
  }catch(e){
    $('#admin-denied').hidden=false;
    $('#admin-who').textContent=e.status===401?'Sign in with your production Clerk account to continue.':(e.message||'Access denied.');
  }
}

async function refreshOverview(){
  const o=await API('/api/v1/social/admin/overview');
  $('#admin-overview').innerHTML=[
    ['Profiles',o.profiles],['Posts',o.posts],['Open reports',o.open_reports],['Pending verify',o.pending_verification],
    ['Banned',o.banned],['Suspended',o.suspended],['Pending ads',o.pending_ads],
    ['LiveKit',o.livekit_configured?'Ready':'Unset'],['VAPID',o.vapid_configured?'Ready':'Unset']
  ].map(([k,v])=>`<div class="admin-stat"><strong>${esc(v)}</strong><span class="mb-muted">${esc(k)}</span></div>`).join('');
}

function modBadge(m){
  if(!m)return '';
  if(m.status==='banned')return '<span class="admin-badge bad">banned</span>';
  if(m.status==='suspended')return '<span class="admin-badge warn">suspended</span>';
  return '<span class="admin-badge ok">active</span>';
}

async function searchUsers(q){
  const data=await API('/api/v1/social/admin/users?limit=40&q='+encodeURIComponent(q||''));
  $('#user-results').innerHTML=(data.items||[]).map(u=>`<div class="admin-row"><div><strong>${esc(u.display_name)}</strong> @${esc(u.handle)} ${u.verified?'✔':''}<br><span class="mb-muted">${esc(u.email)} · ${esc(u.id)}</span> ${modBadge(u.moderation)}</div><button type="button" class="mb-btn" data-pick="${esc(u.id)}">Manage</button></div>`).join('')||'<p class="mb-muted">No matches.</p>';
  $('#user-results').querySelectorAll('[data-pick]').forEach(b=>b.addEventListener('click',()=>selectUser(b.dataset.pick,data.items.find(x=>x.id===b.dataset.pick))));
}

async function selectUser(id,row){
  selected=row||{id};
  const devices=await API('/api/v1/social/admin/users/'+encodeURIComponent(id)+'/devices').catch(()=>({devices:[],web_push:[]}));
  const m=selected.moderation||{};
  $('#user-panel').innerHTML=`
    <h2>@${esc(selected.handle||id)}</h2>
    <p>${esc(selected.display_name||'')} · ${esc(selected.email||'')} ${modBadge(m)}</p>
    <p class="mb-muted">id: ${esc(id)}</p>
    <div class="admin-actions">
      <button type="button" class="mb-btn" data-act="ban">Hard ban</button>
      <button type="button" class="mb-btn" data-act="suspend">Suspend 7 days</button>
      <button type="button" class="mb-btn" data-act="reinstate">Reinstate</button>
      <button type="button" class="mb-btn" data-act="mute">Mute posting</button>
      <button type="button" class="mb-btn" data-act="unmute">Unmute posting</button>
      <button type="button" class="mb-btn" data-act="nocall">Disable calls</button>
      <button type="button" class="mb-btn" data-act="yescall">Enable calls</button>
      <button type="button" class="mb-btn" data-act="shadow">Shadow restrict</button>
      <button type="button" class="mb-btn" data-act="verify">Force verify</button>
      <button type="button" class="mb-btn" data-act="unverify">Revoke verify</button>
      <button type="button" class="mb-btn" data-act="revoke-push">Revoke push tokens</button>
      <button type="button" class="mb-btn" data-act="disconnect">Force disconnect calls</button>
      <button type="button" class="mb-btn" data-act="monetize-ok">Approve monetization</button>
      <button type="button" class="mb-btn" data-act="monetize-no">Reject monetization</button>
      <button type="button" class="mb-btn" data-act="push-test">Test push</button>
    </div>
    <h3>Devices (redacted)</h3>
    <pre class="admin-pre">${esc(JSON.stringify(devices,null,2))}</pre>
    <p id="user-action-status" class="mb-muted" role="status"></p>`;
  $('#user-panel').querySelectorAll('[data-act]').forEach(b=>b.addEventListener('click',()=>runAct(b.dataset.act,id)));
}

async function runAct(act,id){
  const status=$('#user-action-status');
  try{
    if(act==='ban')await API('/api/v1/social/admin/users/'+id+'/ban',{method:'POST',body:JSON.stringify({reason:'Banned by Social Admin'})});
    if(act==='suspend')await API('/api/v1/social/admin/users/'+id+'/suspend',{method:'POST',body:JSON.stringify({reason:'Suspended by Social Admin',until:Date.now()+7*86400000})});
    if(act==='reinstate')await API('/api/v1/social/admin/users/'+id+'/reinstate',{method:'POST',body:'{}'});
    if(act==='mute')await API('/api/v1/social/admin/users/'+id+'/restrictions',{method:'PATCH',body:JSON.stringify({mute_posts:true})});
    if(act==='unmute')await API('/api/v1/social/admin/users/'+id+'/restrictions',{method:'PATCH',body:JSON.stringify({mute_posts:false,shadow_restricted:false})});
    if(act==='nocall')await API('/api/v1/social/admin/users/'+id+'/restrictions',{method:'PATCH',body:JSON.stringify({calls_disabled:true})});
    if(act==='yescall')await API('/api/v1/social/admin/users/'+id+'/restrictions',{method:'PATCH',body:JSON.stringify({calls_disabled:false})});
    if(act==='shadow')await API('/api/v1/social/admin/users/'+id+'/restrictions',{method:'PATCH',body:JSON.stringify({shadow_restricted:true,mute_posts:true})});
    if(act==='verify')await API('/api/v1/social/admin/users/'+id+'/verify',{method:'POST',body:'{}'});
    if(act==='unverify')await API('/api/v1/social/admin/users/'+id+'/unverify',{method:'POST',body:'{}'});
    if(act==='revoke-push')await API('/api/v1/social/admin/users/'+id+'/devices/revoke',{method:'POST',body:'{}'});
    if(act==='disconnect')await API('/api/v1/social/admin/users/'+id+'/calls/disconnect',{method:'POST',body:'{}'});
    if(act==='monetize-ok')await API('/api/v1/social/admin/users/'+id+'/monetization',{method:'POST',body:JSON.stringify({approve:true})});
    if(act==='monetize-no')await API('/api/v1/social/admin/users/'+id+'/monetization',{method:'POST',body:JSON.stringify({approve:false})});
    if(act==='push-test')await API('/api/v1/social/admin/notifications/test',{method:'POST',body:JSON.stringify({user_id:id})});
    status.textContent='Action completed: '+act;
    await refreshOverview();
  }catch(e){status.textContent=e.message;}
}

function wire(){
  $('#user-search').addEventListener('submit',e=>{e.preventDefault();searchUsers($('#uq').value.trim());});
  $('#load-reports').addEventListener('click',async()=>{
    const d=await API('/api/v1/social/admin/reports?status=open&limit=50');
    $('#report-list').innerHTML=(d.items||[]).map(r=>`<div class="admin-row"><div><strong>${esc(r.target_type)}</strong> ${esc(r.target_id)}<br><span class="mb-muted">${esc(r.reason)} — ${esc(r.details||'')}</span></div>
      <span><button class="mb-btn" data-res="${esc(r.id)}" data-st="resolved">Resolve</button>
      <button class="mb-btn" data-res="${esc(r.id)}" data-st="dismissed">Dismiss</button>
      <button class="mb-btn" data-res="${esc(r.id)}" data-st="escalated">Escalate</button></span></div>`).join('')||'<p class="mb-muted">No open reports.</p>';
    $('#report-list').querySelectorAll('[data-res]').forEach(b=>b.addEventListener('click',async()=>{
      await API('/api/v1/social/admin/reports/'+b.dataset.res+'/resolve',{method:'POST',body:JSON.stringify({status:b.dataset.st})});
      b.closest('.admin-row').remove();
    }));
  });
  $('#load-verify').addEventListener('click',async()=>{
    const d=await API('/api/v1/social/admin/verification?status=pending&limit=50');
    $('#verify-list').innerHTML=(d.items||[]).map(v=>`<div class="admin-row"><div><strong>@${esc(v.handle)}</strong> ${esc(v.display_name)}<br><span class="mb-muted">${esc(v.evidence||'')}</span></div>
      <span><button class="mb-btn primary" data-vid="${esc(v.id)}" data-ok="1">Approve</button>
      <button class="mb-btn" data-vid="${esc(v.id)}" data-ok="0">Reject</button></span></div>`).join('')||'<p class="mb-muted">Queue empty.</p>';
    $('#verify-list').querySelectorAll('[data-vid]').forEach(b=>b.addEventListener('click',async()=>{
      await API('/api/v1/social/verification/'+b.dataset.vid+'/review',{method:'POST',body:JSON.stringify({approve:b.dataset.ok==='1'})});
      b.closest('.admin-row').remove();
    }));
  });
  $('#load-ads').addEventListener('click',async()=>{
    const d=await API('/api/v1/social/admin/ads?limit=50');
    $('#ads-list').innerHTML=(d.items||[]).map(a=>`<div class="admin-row"><div><strong>${esc(a.title)}</strong><br><span class="mb-muted">${esc(a.body)}</span></div>
      <span><button class="mb-btn primary" data-ad="${esc(a.id)}" data-ok="1">Approve</button>
      <button class="mb-btn" data-ad="${esc(a.id)}" data-ok="0">Reject</button></span></div>`).join('')||'<p class="mb-muted">No pending ads.</p>';
    $('#ads-list').querySelectorAll('[data-ad]').forEach(b=>b.addEventListener('click',async()=>{
      await API('/api/v1/social/admin/ads/'+b.dataset.ad+'/review',{method:'POST',body:JSON.stringify({approve:b.dataset.ok==='1'})});
      b.closest('.admin-row').remove();
    }));
  });
  $('#broadcast').addEventListener('click',async()=>{
    try{
      const r=await API('/api/v1/social/admin/broadcast',{method:'POST',body:JSON.stringify({title:$('#bt').value,body:$('#bb').value})});
      $('#broadcast-status').textContent='Published. Attempted recipients: '+r.recipients_attempted;
    }catch(e){$('#broadcast-status').textContent=e.message;}
  });
  $('#load-audit').addEventListener('click',async()=>{
    const d=await API('/api/v1/social/admin/audit?limit=80');
    $('#audit-log').textContent=JSON.stringify(d.items||[],null,2);
  });
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
