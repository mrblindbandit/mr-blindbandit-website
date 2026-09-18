(()=>{
 const key='bb-consent-v2',gpc=navigator.globalPrivacyControl===true;
 let prefs=null,returnFocus;
 try{const v=JSON.parse(localStorage.getItem(key));if(v?.version===2&&Number.isFinite(v.savedAt)&&v.savedAt<=Date.now()&&Date.now()-v.savedAt<180*86400000)prefs=v;localStorage.removeItem('bb-consent-v1');}catch{}
 const allows=k=>k==='analytics'?false:k==='ads'&&gpc?false:prefs?.[k]===true;
 const dialog=document.createElement('dialog');dialog.className='privacy-dialog';dialog.id='privacy-choices-dialog';dialog.setAttribute('aria-labelledby','privacy-heading');
 dialog.innerHTML='<form method="dialog"><h2 id="privacy-heading">Your privacy choices</h2><p>Optional media and advertising stay off until you choose. Advertising also requires an activated, verified consent-platform configuration.</p><label><input type="checkbox" checked disabled> Essential account, security and requested preferences</label><label><input name="ads" type="checkbox"> Allow optional advertising when available</label><label><input name="media" type="checkbox"> Allow Spotify, YouTube and Apple Music embeds</label><p>Analytics is not configured and remains off.</p><p data-signal></p><div class="privacy-actions"><button type="button" data-choice="all">Accept available options</button><button type="button" data-choice="none">Reject nonessential</button><button type="button" data-choice="save">Save choices</button></div><p><a href="/privacy/">Privacy policy</a> · <a href="/cookies/">Cookie information</a></p><p role="status"></p><button value="close">Close</button></form>';
 document.body.append(dialog);
 if(gpc){dialog.querySelector('[name=ads]').disabled=true;dialog.querySelector('[data-signal]').textContent='Global Privacy Control is enabled. Optional advertising and analytics remain off.';}
 function open(){returnFocus=document.activeElement;for(const k of ['ads','media'])dialog.querySelector('[name='+k+']').checked=allows(k);if(!dialog.open)dialog.showModal();}
 function apply(){if(!allows('media'))document.querySelectorAll('iframe[src*="spotify.com"],iframe[src*="youtube.com"],iframe[src*="youtube-nocookie.com"],iframe[src*="music.apple.com"]').forEach(f=>f.remove());document.dispatchEvent(new CustomEvent('privacy:changed',{detail:prefs}));}
 function save(action){const oldAds=allows('ads');prefs={version:2,savedAt:Date.now(),essential:true,analytics:false,ads:!gpc&&(action==='all'||action==='save'&&dialog.querySelector('[name=ads]').checked),media:action==='all'||action==='save'&&dialog.querySelector('[name=media]').checked};try{localStorage.setItem(key,JSON.stringify(prefs));}catch{}apply();dialog.close();document.querySelector('[data-privacy-banner]')?.remove();if(oldAds&&!allows('ads'))location.reload();}
 dialog.addEventListener('close',()=>{if(returnFocus?.isConnected)returnFocus.focus();});
 dialog.addEventListener('click',e=>{const action=e.target.closest('[data-choice]')?.dataset.choice;if(action)save(action);});
 window.BlindbanditPrivacy={open,allows};
 document.addEventListener('click',e=>{if(e.target.closest('[data-privacy-choices]')){e.preventDefault();open();}});
 if(!document.querySelector('footer [data-privacy-choices]')){const button=document.createElement('button');button.type='button';button.dataset.privacyChoices='';button.textContent='Privacy Choices';(document.querySelector('footer')||document.body).append(button);}
 if(!prefs){const banner=document.createElement('aside');banner.dataset.privacyBanner='';banner.className='privacy-banner';banner.setAttribute('aria-label','Privacy choices');banner.innerHTML='<p>Optional media and advertising are off.</p><button type="button" data-privacy-choices>Manage privacy choices</button><button type="button" data-reject-initial>Reject nonessential</button>';document.body.append(banner);banner.querySelector('[data-reject-initial]').onclick=()=>save('none');}
 apply();
})();
