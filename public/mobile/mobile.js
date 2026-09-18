(()=>{
const API=(path,opts={})=>fetch(path.startsWith('http')?path:path,{credentials:'include',...opts,headers:{'content-type':'application/json',...(opts.headers||{})}}).then(async r=>{const j=await r.json().catch(()=>({}));if(!r.ok){const err=new Error(j.error?.message||j.message||('HTTP '+r.status));err.code=j.error?.code;err.status=r.status;throw err;}return j.data!==undefined?j:{data:j};});
const $= (s,el=document)=>el.querySelector(s);
const $$=(s,el=document)=>[...el.querySelectorAll(s)];
const state={me:null,view:'feed',profileHandle:'mrblindbandit',tab:'posts'};

function route(){
  const p=(location.pathname.replace(/\/$/,'')||'/mobile');
  const q=new URLSearchParams(location.search);
  if(/\/mobile\/explore$/.test(p))return {view:'explore'};
  if(/\/mobile\/messages$/.test(p))return {view:'messages',c:q.get('c')};
  if(/\/mobile\/calls$/.test(p))return {view:'calls',id:q.get('id')};
  if(/\/mobile\/settings$/.test(p))return {view:'settings'};
  if(/\/mobile\/monetization$/.test(p))return {view:'monetization'};
  if(/\/mobile\/verification$/.test(p))return {view:'verification'};
  if(/\/mobile\/(privacy|trust-safety|about)$/.test(p))return {view:'static'};
  const um=p.match(/\/mobile\/u\/([a-z0-9_]+)$/i);
  if(um)return {view:'profile',handle:um[1].toLowerCase(),tab:q.get('tab')||'posts'};
  return {view:'feed'};
}

function setNav(view){
  $$('.mb-bottom a').forEach(a=>{
    const v=a.dataset.view;
    if(v===view||(view==='profile'&&v==='profile'&&state.profileHandle==='mrblindbandit'&&a.getAttribute('href')?.includes('mrblindbandit')))a.setAttribute('aria-current','page');
    else a.removeAttribute('aria-current');
  });
}

function timeAgo(ts){
  const s=Math.max(0,Math.floor((Date.now()-Number(ts))/1000));
  if(s<60)return 'just now';if(s<3600)return Math.floor(s/60)+'m';if(s<86400)return Math.floor(s/3600)+'h';return Math.floor(s/86400)+'d';
}

function verifiedBadge(v){return v?' <span class="mb-badge" title="Verified">✔ Verified</span>':'';}

function postCard(p){
  const a=p.author||{};
  return `<article class="mb-card mb-post"><img class="av" src="${esc(a.avatar_url||'/assets/app-icon-gold-black-v1.jpg')}" alt=""><div><div class="meta"><a href="/mobile/u/${esc(a.handle||'')}">${esc(a.display_name||'User')}</a>${verifiedBadge(a.verified)} · ${timeAgo(p.created_at)}</div><p>${esc(p.body||'')}</p></div></article>`;
}

function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}

async function loadMe(){
  try{
    const r=await API('/api/v1/social/me');
    state.me=r.data;
    const el=$('#mb-auth-status');
    if(el)el.innerHTML=`Signed in as <strong>@${esc(state.me.handle)}</strong> · <a href="/account">Account</a>`;
    return state.me;
  }catch(e){
    state.me=null;
    const el=$('#mb-auth-status');
    if(el)el.innerHTML=`<a class="mb-btn primary" href="/sign-up?redirect_url=${encodeURIComponent('/mobile/')}">Create free account</a> <a class="mb-btn" href="/sign-in?redirect_url=${encodeURIComponent('/mobile/')}">Sign in</a>`;
    return null;
  }
}

async function renderFeed(){
  const root=$('#mb-main');
  root.innerHTML=`<div class="mb-banner"><p class="eyebrow mb-gold" style="margin:0 0 .35rem;font-size:.75rem;letter-spacing:.08em">BLINDBANDIT MOBILE</p><h1 style="margin:.2rem 0 .5rem;font-size:1.6rem">Social. Music. Calls.</h1><p class="mb-muted" style="margin:0">Anyone can create a profile with Clerk (Google or email). Follow Mr. Blindbandit, post, message, and call.</p></div>
  <div id="mb-compose" class="mb-card mb-compose" hidden><label for="mb-post-body" class="visually-hidden">New post</label><textarea id="mb-post-body" maxlength="4000" placeholder="Share something with the community…"></textarea><div class="row"><span class="mb-muted" id="mb-auth-status"></span><button type="button" class="mb-btn primary" id="mb-post-btn">Post</button></div><p id="mb-compose-err" class="mb-muted" role="status"></p></div>
  <div id="mb-feed"><div class="mb-loader"><img src="/assets/app-icon-gold-black-v1.jpg" alt=""><p>Loading your feed…</p></div></div>`;
  await loadMe();
  const compose=$('#mb-compose');
  if(state.me){compose.hidden=false;}
  $('#mb-post-btn')?.addEventListener('click',async()=>{
    const body=$('#mb-post-body').value.trim();
    const err=$('#mb-compose-err');
    if(!body){err.textContent='Write something first.';return;}
    try{
      await API('/api/v1/social/posts',{method:'POST',body:JSON.stringify({body})});
      $('#mb-post-body').value='';err.textContent='Posted.';
      await fillFeed();
    }catch(e){err.textContent=e.message||'Could not post.';}
  });
  await fillFeed();
}

async function fillFeed(){
  const box=$('#mb-feed');
  try{
    const r=await API('/api/v1/social/feed?limit=40');
    const items=r.data?.items||[];
    if(!items.length){box.innerHTML=`<div class="mb-empty"><img src="/assets/empty-state-castle-aurora-v1.jpg" alt=""><p>No posts yet. Be the first to share.</p></div>`;return;}
    box.innerHTML=items.map(postCard).join('');
  }catch(e){box.innerHTML=`<p class="mb-muted">Feed unavailable: ${esc(e.message)}. Seed profile still loads from public pages.</p>`;}
}

async function renderExplore(){
  const root=$('#mb-main');
  root.innerHTML=`<h1>Explore</h1><form id="mb-search" class="mb-card mb-form"><label for="q">Search people</label><input id="q" name="q" placeholder="Handle or name"><div style="margin-top:.75rem"><button class="mb-btn primary" type="submit">Search</button></div></form><div id="mb-explore-list" class="mb-list mb-card"><p class="mb-muted">Loading…</p></div>`;
  const load=async(q='')=>{
    const r=await API('/api/v1/social/explore?limit=40'+(q?'&q='+encodeURIComponent(q):''));
    const items=r.data?.items||[];
    $('#mb-explore-list').innerHTML=items.map(p=>`<a href="/mobile/u/${esc(p.handle)}"><img src="${esc(p.avatar_url||'/assets/app-icon-gold-black-v1.jpg')}" alt=""><div><strong>${esc(p.display_name)}</strong>${verifiedBadge(p.verified)}<div class="mb-muted">@${esc(p.handle)}</div></div></a>`).join('')||'<p class="mb-muted">No profiles found.</p>';
  };
  $('#mb-search').addEventListener('submit',e=>{e.preventDefault();load($('#q').value.trim());});
  try{await load();}catch(e){$('#mb-explore-list').innerHTML=`<p>${esc(e.message)}</p>`;}
}

async function renderProfile(handle,tab){
  state.profileHandle=handle;state.tab=tab||'posts';
  const root=$('#mb-main');
  root.innerHTML=`<div class="mb-loader"><img src="/assets/app-icon-gold-black-v1.jpg" alt=""><p>Loading profile…</p></div>`;
  let profile;
  try{profile=(await API('/api/v1/social/profiles/'+encodeURIComponent(handle))).data;}catch(e){root.innerHTML=`<p>${esc(e.message)}</p>`;return;}
  const tabs=['posts','music','about','media'];
  root.innerHTML=`<div class="mb-card" style="padding:0;overflow:hidden">
    <img class="mb-cover" src="${esc(profile.cover_url||'/assets/mobile-cover.jpg')}" alt="">
    <div style="padding:0 1rem 1rem">
      <img class="mb-avatar" src="${esc(profile.avatar_url||'/assets/mobile-artist.jpg')}" alt="">
      <h1 style="margin:.5rem 0 .25rem;font-size:1.45rem">${esc(profile.display_name)}${verifiedBadge(profile.verified)}</h1>
      <p class="mb-muted" style="margin:0">@${esc(profile.handle)} · ${profile.followers||0} followers · ${profile.posts||0} posts</p>
      <p style="margin:.75rem 0">${esc(profile.bio||'')}</p>
      <div style="display:flex;gap:.5rem;flex-wrap:wrap">
        <button type="button" class="mb-btn primary" id="mb-follow">Follow</button>
        <a class="mb-btn" href="/mobile/messages/?to=${esc(profile.handle)}">Message</a>
        <a class="mb-btn" href="/mobile/calls/?to=${esc(profile.handle)}">Call</a>
      </div>
    </div>
  </div>
  <div class="mb-tabs" role="tablist">${tabs.map(t=>`<button type="button" role="tab" data-tab="${t}" aria-selected="${t===state.tab}">${t[0].toUpperCase()+t.slice(1)}</button>`).join('')}</div>
  <div id="mb-tab-panel"></div>`;
  $$('.mb-tabs button').forEach(btn=>btn.addEventListener('click',()=>{
    history.replaceState({},'',`/mobile/u/${handle}?tab=${btn.dataset.tab}`);
    renderProfile(handle,btn.dataset.tab);
  }));
  $('#mb-follow')?.addEventListener('click',async()=>{
    try{await API('/api/v1/social/profiles/'+encodeURIComponent(handle)+'/follow',{method:'POST',body:'{}'});$('#mb-follow').textContent='Following';}catch(e){alert(e.message);}
  });
  const panel=$('#mb-tab-panel');
  if(state.tab==='posts'){
    try{
      const r=await API('/api/v1/social/profiles/'+encodeURIComponent(handle)+'/posts?limit=40');
      const items=r.data?.items||[];
      panel.innerHTML=items.map(p=>postCard({...p,author:profile})).join('')||'<p class="mb-muted">No posts yet.</p>';
    }catch(e){panel.innerHTML=`<p>${esc(e.message)}</p>`;}
  }else if(state.tab==='music'){
    try{
      const r=await API('/api/v1/social/spotify');
      const emb=r.data?.embed_artist||'https://open.spotify.com/embed/artist/04HZ4GubB66CqMpJrHysy3';
      panel.innerHTML=`<div class="mb-card"><h2>Listen on Spotify</h2><p class="mb-muted">${esc(r.data?.note||'')}</p>
        <iframe class="mb-spotify" style="border-radius:12px" src="${esc(emb)}" width="100%" height="352" frameBorder="0" allowfullscreen allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy" title="Mr. Blindbandit on Spotify"></iframe>
        <p style="margin-top:1rem"><a class="mb-btn primary" href="${esc(r.data?.artist_url||'https://open.spotify.com/artist/04HZ4GubB66CqMpJrHysy3')}" rel="noopener" target="_blank">Open full artist page ↗</a></p>
      </div>`;
    }catch{panel.innerHTML=`<iframe class="mb-spotify" src="https://open.spotify.com/embed/artist/04HZ4GubB66CqMpJrHysy3?utm_source=generator" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy" title="Spotify"></iframe>`;}
  }else if(state.tab==='about'){
    panel.innerHTML=`<div class="mb-card"><h2>About</h2><p>${esc(profile.bio||'No bio yet.')}</p>
      <p class="mb-muted">Location: ${esc(profile.location||'—')}</p>
      <p class="mb-muted">Website: ${profile.website?`<a href="${esc(profile.website)}">${esc(profile.website)}</a>`:'—'}</p>
      ${profile.is_artist?'<p class="mb-gold">Official Blindbandit Records artist.</p>':''}
      ${profile.verified?'<p class="mb-badge">Verified identity</p>':''}
    </div>`;
  }else{
    panel.innerHTML=`<div class="mb-card"><h2>Media</h2><div style="display:grid;grid-template-columns:1fr 1fr;gap:.75rem">
      <img src="${esc(profile.avatar_url)}" alt="Avatar" style="width:100%;border-radius:12px">
      <img src="${esc(profile.cover_url)}" alt="Cover" style="width:100%;border-radius:12px">
      <img src="/assets/sapphire-castles.jpg" alt="Sapphire Castles artwork" style="width:100%;border-radius:12px">
      <img src="/assets/call-bg-gold-particles-v2.jpg" alt="Brand visual" style="width:100%;border-radius:12px">
    </div></div>`;
  }
}

async function renderMessages(){
  const root=$('#mb-main');
  await loadMe();
  if(!state.me){root.innerHTML=`<div class="mb-card"><h1>Messages</h1><p>Sign in to message other members.</p><p id="mb-auth-status"></p></div>`;await loadMe();return;}
  const to=new URLSearchParams(location.search).get('to');
  root.innerHTML=`<h1>Messages</h1>
    ${to?`<div class="mb-card mb-form"><h2>Message @${esc(to)}</h2><label for="msg">Message</label><textarea id="msg" maxlength="4000"></textarea><button type="button" class="mb-btn primary" id="send-msg" style="margin-top:.75rem">Send</button><p id="msg-status" class="mb-muted" role="status"></p></div>`:''}
    <div id="mb-convs" class="mb-card mb-list"><p class="mb-muted">Loading conversations…</p></div>`;
  if(to)$('#send-msg').addEventListener('click',async()=>{
    try{await API('/api/v1/social/messages',{method:'POST',body:JSON.stringify({handle:to,body:$('#msg').value.trim()})});$('#msg-status').textContent='Sent.';$('#msg').value='';await loadConvs();}catch(e){$('#msg-status').textContent=e.message;}
  });
  await loadConvs();
}
async function loadConvs(){
  try{
    const r=await API('/api/v1/social/messages?limit=40');
    const items=r.data?.items||[];
    $('#mb-convs').innerHTML=items.map(c=>`<a href="/mobile/messages/?c=${esc(c.id)}"><img src="${esc(c.other?.avatar_url||'/assets/app-icon-gold-black-v1.jpg')}" alt=""><div><strong>${esc(c.other?.display_name||'User')}</strong>${verifiedBadge(c.other?.verified)}<div class="mb-muted">${esc(c.last_message?.body||'No messages yet')}</div></div></a>`).join('')||'<div class="mb-empty"><img src="/assets/empty-state-castle-aurora-v2.jpg" alt=""><p>No conversations yet. Open a profile and tap Message.</p><p class="mb-muted"><a href="/mobile/explore/">Find people to message</a></p></div>';
  }catch(e){$('#mb-convs').innerHTML=`<p>${esc(e.message)}</p>`;}
}

async function renderCalls(){
  const root=$('#mb-main');
  await loadMe();
  const to=new URLSearchParams(location.search).get('to');
  const id=new URLSearchParams(location.search).get('id');
  root.innerHTML=`<h1>Calls</h1>
    <div class="mb-call-stage"><p class="mb-gold">Voice & video via LiveKit</p><p class="mb-muted">Secure rooms for Blindbandit Mobile. Tokens are minted by the Worker — secrets never reach the browser.</p>
      ${state.me?`<p>Signed in as @${esc(state.me.handle)}</p>`:`<p><a class="mb-btn primary" href="/sign-in?redirect_url=/mobile/calls/">Sign in to call</a></p>`}
    </div>
    <div class="mb-card mb-form">
      <label for="call-handle">Call handle</label>
      <input id="call-handle" value="${esc(to||'mrblindbandit')}" placeholder="mrblindbandit">
      <div style="display:flex;gap:.5rem;margin-top:.75rem;flex-wrap:wrap">
        <button type="button" class="mb-btn primary" id="start-voice">Start voice call</button>
        <button type="button" class="mb-btn" id="start-video">Start video call</button>
        ${id?`<button type="button" class="mb-btn" id="join-call">Join call ${esc(id.slice(0,8))}</button>`:''}
      </div>
      <pre id="call-out" class="mb-muted" style="white-space:pre-wrap;font-size:.8rem;margin-top:1rem"></pre>
      <div id="lk-room" aria-live="polite"></div>
    </div>
    <p class="mb-muted">Client scaffold matches the mobile TEST pattern: request token → connect with LiveKit client SDK when available. CDN client loads below when configured.</p>`;
  const out=$('#call-out');
  const start=async(kind)=>{
    try{
      const r=await API('/api/v1/social/calls',{method:'POST',body:JSON.stringify({handle:$('#call-handle').value.trim(),kind})});
      out.textContent=JSON.stringify(r.data,null,2);
      await connectLiveKit(r.data?.livekit);
    }catch(e){out.textContent=e.message;}
  };
  $('#start-voice')?.addEventListener('click',()=>start('voice'));
  $('#start-video')?.addEventListener('click',()=>start('video'));
  $('#join-call')?.addEventListener('click',async()=>{
    try{const r=await API('/api/v1/social/calls/'+id+'/join',{method:'POST',body:'{}'});out.textContent=JSON.stringify(r.data,null,2);await connectLiveKit(r.data?.livekit);}catch(e){out.textContent=e.message;}
  });
}

async function connectLiveKit(info){
  const box=$('#lk-room');
  if(!info?.token){box.textContent='No token returned. Configure LIVEKIT_* Worker secrets.';return;}
  box.innerHTML=`<p class="mb-gold">Token minted for room <code>${esc(info.room)}</code>.</p><p class="mb-muted">URL: ${esc(info.url||'(set LIVEKIT_URL)')}. Embed LiveKit client to publish/subscribe A/V. Native apps use the same /api/v1/livekit/token and /api/v1/social/calls endpoints.</p>`;
  // Optional: load LiveKit client from CDN if present
  if(info.url&&!window.LivekitClient){
    await new Promise((resolve,reject)=>{const s=document.createElement('script');s.src='https://cdn.jsdelivr.net/npm/livekit-client/dist/livekit-client.umd.min.js';s.onload=resolve;s.onerror=resolve;document.head.append(s);});
  }
  if(window.LivekitClient&&info.url){
    try{
      const room=new LivekitClient.Room();
      await room.connect(info.url,info.token);
      box.innerHTML+=`<p>Connected to LiveKit room. Participants: ${room.numParticipants}</p>`;
      await room.localParticipant.setMicrophoneEnabled(true);
    }catch(e){box.innerHTML+=`<p class="mb-muted">LiveKit connect note: ${esc(e.message)}</p>`;}
  }
}

async function renderSettings(){
  const root=$('#mb-main');
  await loadMe();
  root.innerHTML=`<h1>Settings</h1>
    <div class="mb-card" id="mb-admin-link" hidden><p class="mb-chip">Moderator</p><p>You have Social Admin access.</p><a class="mb-btn primary" href="/mobile/admin/">Open Social Admin Control Center</a></div>
    <div class="mb-card" id="mb-auth-status"></div>
    <div class="mb-card mb-form"><h2>Notifications</h2>
      <p class="mb-muted">Enable browser Web Push. iOS/Android apps register device tokens at <code>/api/v1/social/devices/register</code>.</p>
      <button type="button" class="mb-btn primary" id="enable-push">Enable Web Push</button>
      <button type="button" class="mb-btn" id="test-push">Send test notification</button>
      <p id="push-status" class="mb-muted" role="status"></p>
    </div>
    <div class="mb-card"><h2>Programs</h2>
      <p><a class="mb-btn" href="/mobile/verification/">Verification program</a> <a class="mb-btn" href="/mobile/monetization/">Creator monetization</a></p>
    </div>
    <div class="mb-card mb-form" ${state.me?'':'hidden'}><h2>Edit profile</h2>
      <label for="dn">Display name</label><input id="dn" value="${esc(state.me?.display_name||'')}">
      <label for="bio">Bio</label><textarea id="bio">${esc(state.me?.bio||'')}</textarea>
      <button type="button" class="mb-btn primary" id="save-profile" style="margin-top:.75rem">Save</button>
      <p id="save-status" class="mb-muted"></p>
    </div>`;
  await loadMe();
  $('#enable-push')?.addEventListener('click',enableWebPush);
  $('#test-push')?.addEventListener('click',async()=>{
    try{await API('/api/v1/notifications/test',{method:'POST',body:JSON.stringify({})});$('#push-status').textContent='Test queued.';}catch(e){$('#push-status').textContent=e.message;}
  });
  API('/api/v1/social/admin/overview').then(()=>{$('#mb-admin-link').hidden=false;}).catch(()=>{});
  $('#save-profile')?.addEventListener('click',async()=>{
    try{await API('/api/v1/social/me',{method:'PATCH',body:JSON.stringify({display_name:$('#dn').value,bio:$('#bio').value})});$('#save-status').textContent='Saved.';}catch(e){$('#save-status').textContent=e.message;}
  });
}

async function enableWebPush(){
  const status=$('#push-status');
  try{
    if(!('serviceWorker' in navigator)||!('PushManager' in window)){status.textContent='Web Push is not supported in this browser.';return;}
    const vapid=(await API('/api/v1/push/web/vapid-public-key')).data;
    if(!vapid?.vapid_public_key){status.textContent='VAPID_PUBLIC_KEY is not configured on the Worker yet.';return;}
    const reg=await navigator.serviceWorker.register('/mobile/sw.js',{scope:'/mobile/'});
    const perm=await Notification.requestPermission();
    if(perm!=='granted'){status.textContent='Notification permission denied.';return;}
    const sub=await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:urlBase64ToUint8Array(vapid.vapid_public_key)});
    const json=sub.toJSON();
    await API('/api/v1/push/web/register',{method:'POST',body:JSON.stringify({endpoint:json.endpoint,keys:{p256dh:json.keys.p256dh,auth:json.keys.auth},user_agent:navigator.userAgent})});
    status.textContent='Web Push registered for this browser.';
  }catch(e){status.textContent=e.message||'Could not enable push.';}
}

function urlBase64ToUint8Array(base64String){
  const padding='='.repeat((4-base64String.length%4)%4);
  const base64=(base64String+padding).replace(/-/g,'+').replace(/_/g,'/');
  const raw=atob(base64);const out=new Uint8Array(raw.length);
  for(let i=0;i<raw.length;++i)out[i]=raw.charCodeAt(i);return out;
}

async function renderSimple(title,bodyHtml){
  $('#mb-main').innerHTML=`<div class="mb-card"><h1>${esc(title)}</h1>${bodyHtml}</div>`;
}

async function renderMonetization(){
  await loadMe();
  await renderSimple('Creator monetization',`
    <p>Apply to the Blindbandit creator monetization program. Approvals are reviewed by Blindbandit Records.</p>
    <div class="mb-form"><label for="pay">Payout email</label><input id="pay" value="${esc(state.me?.email||'')}">
    <label for="notes">Notes</label><textarea id="notes" placeholder="Tell us about your audience and content."></textarea>
    <button type="button" class="mb-btn primary" id="apply-mon" style="margin-top:.75rem">Apply</button><p id="mon-status" class="mb-muted"></p></div>
    <p class="mb-muted">Ads marketplace listings can be submitted from the API (<code>POST /api/v1/social/ads</code>) after review.</p>`);
  $('#apply-mon')?.addEventListener('click',async()=>{
    try{await API('/api/v1/social/monetization',{method:'POST',body:JSON.stringify({payout_email:$('#pay').value,notes:$('#notes').value})});$('#mon-status').textContent='Application submitted.';}catch(e){$('#mon-status').textContent=e.message;}
  });
}

async function renderVerification(){
  await loadMe();
  await renderSimple('Verification program',`
    <p>Verified badges help fans trust official artists and public figures. Mr. Blindbandit’s artist profile is already verified.</p>
    <div class="mb-form"><label for="ev">Evidence (links, press, government ID handling instructions)</label><textarea id="ev" placeholder="Links to official pages, distributor confirmations, etc."></textarea>
    <button type="button" class="mb-btn primary" id="apply-ver" style="margin-top:.75rem">Apply for verification</button><p id="ver-status" class="mb-muted"></p></div>`);
  $('#apply-ver')?.addEventListener('click',async()=>{
    try{await API('/api/v1/social/verification',{method:'POST',body:JSON.stringify({evidence:$('#ev').value})});$('#ver-status').textContent='Application pending review.';}catch(e){$('#ver-status').textContent=e.message;}
  });
}

async function boot(){
  const r=route();
  state.view=r.view;
  setNav(r.view==='profile'?'profile':r.view);
  try{
    if(r.view==='static')return;
    if(r.view==='feed')await renderFeed();
    else if(r.view==='explore')await renderExplore();
    else if(r.view==='profile')await renderProfile(r.handle,r.tab);
    else if(r.view==='messages')await renderMessages();
    else if(r.view==='calls')await renderCalls();
    else if(r.view==='settings')await renderSettings();
    else if(r.view==='monetization')await renderMonetization();
    else if(r.view==='verification')await renderVerification();
  }catch(e){
    console.error(e);
    $('#mb-main').innerHTML=`<div class="mb-card"><h1>Something went wrong</h1><p>${esc(e.message)}</p></div>`;
  }
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
window.addEventListener('popstate',boot);
})();
