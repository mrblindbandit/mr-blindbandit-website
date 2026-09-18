(()=>{
 const names={en:'English',es:'Español',fil:'Filipino',ceb:'Cebuano'};
 const privatePath=p=>/^\/(portal|owner|api|signin-with-chatgpt|signout-with-chatgpt|callback)(\/|$)|^\/community\/(account|dashboard|moderation)(\/|$)/.test(p);
 document.addEventListener('click',e=>{const a=e.target.closest('[data-language]');if(a&&names[a.dataset.language])try{localStorage.setItem('bb-language',a.dataset.language);}catch{}});
 function apply(){
  const path=location.pathname,lang=/^\/(es|fil|ceb)(\/|$)/.exec(path)?.[1]||'en';
  document.documentElement.lang=lang;
  // No private URLs, query strings, form values or authentication tokens go to a translator.
  if(privatePath(path))return;
  const source=lang==='en'?path:path.replace(/^\/(es|fil|ceb)(?=\/|$)/,'')||'/';
  document.querySelectorAll('[data-language]').forEach(a=>{
   const l=a.dataset.language,alternate=document.querySelector('link[rel="alternate"][hreflang="'+l+'"]');
   if(l==='en')a.href=source;else if(alternate)a.href=alternate.href;
   a.removeAttribute('aria-label');if(l===lang)a.setAttribute('aria-current','true');else a.removeAttribute('aria-current');
  });
  document.querySelectorAll('[data-public-translate]').forEach(a=>{
   const l=a.dataset.publicTranslate;if(!['es','fil','ceb'].includes(l))return;
   const u=new URL('https://translate.google.com/translate');u.searchParams.set('sl','en');u.searchParams.set('tl',l==='fil'?'tl':l);u.searchParams.set('u','https://mrblindbandit.net'+source);a.href=u.href;
  });
 }
 apply();document.addEventListener('site:navigate',apply);
})();
