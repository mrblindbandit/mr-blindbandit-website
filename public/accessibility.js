(()=>{
 let sequence=0,lastAction=null;
 const focus=e=>{if(!e)return;e.setAttribute('tabindex','-1');e.focus();};
 function clearErrors(form){form.querySelector('[data-error-summary]')?.remove();form.querySelectorAll('[data-field-error]').forEach(e=>{const control=document.getElementById(e.dataset.fieldError);if(control){control.removeAttribute('aria-invalid');const ids=(control.getAttribute('aria-describedby')||'').split(' ').filter(id=>id&&id!==e.id);if(ids.length)control.setAttribute('aria-describedby',ids.join(' '));else control.removeAttribute('aria-describedby');}e.remove();});}
 function formError(form,message,fields=[]){
  clearErrors(form);const box=document.createElement('div');box.className='form-errors';box.dataset.errorSummary='';box.setAttribute('role','alert');box.tabIndex=-1;
  const heading=document.createElement('p');heading.textContent=message;box.append(heading);
  if(fields.length){const list=document.createElement('ul');for(const c of fields){if(!c.id)c.id='a11y-field-'+(++sequence);const fieldName=c.labels?.[0]?.textContent.trim()||c.getAttribute('aria-label')||'Field';const error=document.createElement('p');error.id='a11y-error-'+(++sequence);error.dataset.fieldError=c.id;error.className='field-error';error.textContent=c.validationMessage; (c.closest('label')||c).after(error);c.setAttribute('aria-invalid','true');c.setAttribute('aria-describedby',((c.getAttribute('aria-describedby')||'')+' '+error.id).trim());const item=document.createElement('li'),a=document.createElement('a');a.href='#'+c.id;a.textContent=fieldName+': '+c.validationMessage;a.onclick=e=>{e.preventDefault();c.focus();};item.append(a);list.append(item);}box.append(list);}
  form.prepend(box);box.focus();
 }
 const invalidForms=new Set();
 document.addEventListener('invalid',e=>{const f=e.target.form;if(!f)return;e.preventDefault();if(invalidForms.has(f))return;invalidForms.add(f);queueMicrotask(()=>{invalidForms.delete(f);const fields=[...f.elements].filter(c=>c.willValidate&&!c.validity.valid);if(fields.length)formError(f,'Please correct the following fields before continuing.',fields);});},true);
 document.addEventListener('submit',e=>{if(e.target instanceof HTMLFormElement)clearErrors(e.target);},true);
 document.addEventListener('click',e=>{
  const a=e.target.closest('a[href="#main"]');if(a){e.preventDefault();focus(document.getElementById('main'));}
  const b=e.target.closest('button,summary');if(b?.closest('[data-label-portal]'))lastAction=b;
 });
 function enhance(root=document){
  root.querySelectorAll('footer').forEach(footer=>{if(footer.querySelector('[data-portal-accessibility]')||!document.body.classList.contains('label-page'))return;const box=document.createElement('details');box.dataset.portalAccessibility='';box.innerHTML='<summary>Accessibility settings</summary><button type="button" data-local-preference="paused">Pause motion</button> <button type="button" data-local-preference="large">Larger text</button> <button type="button" data-local-preference="contrast">High contrast</button><p><a href="mailto:accessibility@mrblindbandit.net">Accessibility help</a></p>';footer.append(box);let prefs={};try{prefs=JSON.parse(localStorage.getItem('bb-preferences')||'{}');}catch{}const apply=()=>{for(const [k,c] of [['paused','motion-paused'],['large','large-text'],['contrast','high-contrast']])document.body.classList.toggle(c,!!prefs[k]);box.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(!!prefs[b.dataset.localPreference])));};apply();box.onclick=e=>{const b=e.target.closest('[data-local-preference]');if(!b)return;prefs[b.dataset.localPreference]=!prefs[b.dataset.localPreference];try{localStorage.setItem('bb-preferences',JSON.stringify(prefs));}catch{}apply();};});

  root.querySelectorAll('input,textarea,select').forEach(e=>{if(e.hasAttribute('autocomplete'))return;const n=(e.name||'').toLowerCase();if(e.type==='email')e.autocomplete='email';else if(e.type==='tel')e.autocomplete='tel';else if(n==='name'&&e.closest('form')?.querySelector('[type=email]'))e.autocomplete='name';else if(['code','otp','totp'].includes(n)){e.autocomplete='one-time-code';e.autocapitalize='none';e.spellcheck=false;}});
  root.querySelectorAll('.label-table-wrap').forEach(e=>{e.tabIndex=0;e.setAttribute('role','region');e.setAttribute('aria-label','Scrollable records table');});
  root.querySelectorAll('main').forEach(e=>e.tabIndex=-1);
 }
 function addSiteDirectory(){
  if(document.querySelector('[data-site-directory-button]'))return;
  const privateSite=location.pathname.startsWith('/portal/');
  const trigger=document.createElement('button');
  trigger.type='button';
  trigger.className='site-directory-button';
  trigger.dataset.siteDirectoryButton='';
  trigger.setAttribute('aria-haspopup','dialog');
  trigger.setAttribute('aria-expanded','false');
  trigger.textContent=privateSite?'Portal pages':'All pages';
  const dialog=document.createElement('dialog');
  dialog.className='site-directory-dialog';
  dialog.id='site-directory-dialog';
  trigger.setAttribute('aria-controls',dialog.id);
  dialog.setAttribute('role','dialog');
  dialog.setAttribute('aria-modal','true');
  dialog.setAttribute('aria-labelledby','site-directory-title');
  dialog.setAttribute('aria-describedby','site-directory-instructions');
  dialog.innerHTML='<div class="site-directory-heading"><div><p class="eyebrow">'+(privateSite?'PRIVATE LABEL PORTAL':'MR. BLINDBANDIT')+'</p><h2 id="site-directory-title">'+(privateSite?'Portal directory':'Public site directory')+'</h2></div><button type="button" data-directory-close aria-label="Dismiss pop-up">Dismiss pop-up ×</button></div><p class="visually-hidden" id="site-directory-instructions">A modal list of available pages. Swipe through the controls, activate Dismiss pop-up, tap outside the panel, or press Escape to close.</p><label class="site-directory-search">Search pages<input type="search" data-directory-search autocomplete="off" spellcheck="false" placeholder="Type a page name"></label><p class="small" data-directory-status role="status" aria-live="polite">Loading pages…</p><nav aria-label="'+(privateSite?'Private portal pages':'All public pages')+'" data-directory-links></nav>';
  const announcement=document.createElement('p');announcement.className='visually-hidden';announcement.setAttribute('role','status');announcement.setAttribute('aria-live','assertive');announcement.setAttribute('aria-atomic','true');
  document.body.append(trigger,dialog,announcement);
  const list=dialog.querySelector('[data-directory-links]');
  const status=dialog.querySelector('[data-directory-status]');
  const search=dialog.querySelector('[data-directory-search]');
  let pages=[];
  const labelFor=path=>{
   if(path==='/')return 'Home';
   const parts=path.split('/').filter(Boolean);
   return decodeURIComponent(parts.at(-1)||'Home').replace(/[-_]+/g,' ').replace(/\b\w/g,c=>c.toUpperCase());
  };
  const unique=items=>[...new Map(items.map(item=>[item.href,item])).values()].sort((a,b)=>a.label.localeCompare(b.label));
  async function load(){
   if(privateSite){
    await new Promise(resolve=>{if(document.querySelector('[data-label-portal] .label-sidebar'))return resolve();const observer=new MutationObserver(()=>{if(document.querySelector('[data-label-portal] .label-sidebar')){observer.disconnect();resolve();}});observer.observe(document.querySelector('[data-label-portal]')||document.body,{childList:true,subtree:true});setTimeout(()=>{observer.disconnect();resolve();},2500);});
    pages=unique([...document.querySelectorAll('a[href]')].flatMap(a=>{
     try{const u=new URL(a.href,location.href);if(u.origin!==location.origin||!u.pathname.startsWith('/portal/'))return[];return[{href:u.pathname+u.search,label:(a.textContent||labelFor(u.pathname)).replace(/\s+/g,' ').trim()}];}catch{return[];}
    }));
   }else{
    try{
     const response=await fetch('/sitemap.xml',{credentials:'same-origin'});
     if(!response.ok)throw Error('Sitemap unavailable');
     const xml=new DOMParser().parseFromString(await response.text(),'application/xml');
     pages=unique([...xml.querySelectorAll('url > loc')].flatMap(node=>{try{const u=new URL(node.textContent);return u.origin===location.origin?[{href:u.pathname+u.search,label:labelFor(u.pathname)}]:[];}catch{return[];}}));
    }catch{
     pages=unique([...document.querySelectorAll('a[href]')].flatMap(a=>{try{const u=new URL(a.href,location.href);return u.origin===location.origin&&!u.pathname.startsWith('/portal/')?[{href:u.pathname+u.search,label:(a.textContent||labelFor(u.pathname)).replace(/\s+/g,' ').trim()}]:[];}catch{return[];}}));
    }
   }
   draw();
  }
  function draw(){
   const q=search.value.trim().toLowerCase();
   const shown=pages.filter(page=>!q||(page.label+' '+page.href).toLowerCase().includes(q));
   list.replaceChildren(...shown.map(page=>{const a=document.createElement('a');a.href=page.href;a.textContent=page.label;const path=document.createElement('span');path.textContent=page.href;a.append(path);if(privateSite)a.dataset.fullNavigation='';if(page.href===location.pathname)a.setAttribute('aria-current','page');return a;}));
   status.textContent=shown.length+' of '+pages.length+' pages shown.';
  }
  const close=()=>dialog.close();
  trigger.onclick=async()=>{dialog.showModal();trigger.setAttribute('aria-expanded','true');search.value='';announcement.textContent=(privateSite?'Portal':'Public site')+' pages pop-up opened.';await load();requestAnimationFrame(()=>search.focus());};
  dialog.querySelector('[data-directory-close]').onclick=close;
  dialog.addEventListener('close',()=>{trigger.setAttribute('aria-expanded','false');announcement.textContent='Pop-up dismissed.';trigger.focus();});
  dialog.addEventListener('click',e=>{if(e.target===dialog)close();});
  search.addEventListener('input',draw);
 }
 let queued=false;new MutationObserver(()=>{if(queued)return;queued=true;queueMicrotask(()=>{queued=false;enhance();if(lastAction&&!lastAction.isConnected&&document.activeElement===document.body){focus(document.querySelector('[data-panel] h2,[data-panel] h3,[data-label-portal] h2'));lastAction=null;}});}).observe(document.body,{childList:true,subtree:true});
 window.BBAccessibility={formError,clearErrors};enhance();addSiteDirectory();
})();
