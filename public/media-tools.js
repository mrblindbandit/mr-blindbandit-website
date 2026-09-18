(()=>{'use strict';
const form=document.querySelector('[data-media-tool]');if(!form)return;
const tool=form.dataset.mediaTool,$=s=>document.querySelector(s),health=$('[data-health]'),progress=$('[data-job-progress]'),results=$('[data-results]'),canvas=$('[data-preview]'),audio=$('[data-audio]'),submit=form.querySelector('[type=submit]'),cancel=$('[data-cancel]');
let lastExport=null,renderPreviewURL='',handoffFile=null,effectURL='';
let busy=false,input='',selected=null,decoded=null,art=null,audioURL='',frame=0,lastStatus='',probe={},clipStop=null;
const engine=new LocalMedia.Engine((status,p,message)=>{progress.hidden=false;if(p===null)progress.removeAttribute('value');else progress.value=p;const milestone=status+':'+Math.floor((p||0)/20);if(lastStatus!==milestone){health.textContent=status+'. '+message;lastStatus=milestone;}});
function v(name,fallback=''){const e=form.elements[name];if(!e)return fallback;return e.type==='checkbox'?e.checked:e.value;}
function set(name,value){if(form.elements[name])form.elements[name].value=value;}
function say(s){health.textContent=s;}
function lock(on){busy=on;for(const el of form.elements)if(el!==cancel)el.disabled=on;for(const el of results.querySelectorAll('button'))el.disabled=on;cancel.disabled=!on;form.setAttribute('aria-busy',String(on));}
async function job(fn){if(busy)return;lock(true);try{await fn();}catch(e){say('Error. '+e.message);results.textContent=e.message+' Your selected files and settings are preserved. Retry the action when ready.';}finally{lock(false);}}
function dimensions(){if(v('size'))return v('size').split('x').map(Number);let h=Number(v('quality',1080)),w=Math.round(h*16/9/2)*2;return v('platform')==='youtube'?[w,h]:[h,w];}
function time(s){const p=s.split(':').map(Number);return p.reduce((n,v)=>60*n+v,0);}
async function inspect(){
 const f=form.elements.source?.files[0];if(!f)throw Error('Choose an audio file first.');
 if(selected===f&&input&&engine.api?.loaded)return;
 await engine.cleanup();input=await engine.input(f);selected=f;decoded=null;probe={};engine.logs=[];
 await engine.api.exec(['-i',input,'-hide_banner']);
 const logs=engine.logs.join('\n'),duration=logs.match(/Duration:\s*(\d+:\d+:\d+(?:\.\d+)?)/);if(!duration)throw Error('The file has no readable media duration or is damaged.');
 probe.duration=time(duration[1]);probe.sampleRate=logs.match(/(\d+) Hz/)?.[1]||'Unknown';probe.channels=logs.match(/Hz, (stereo|mono|[0-9.]+)/)?.[1]||'Unknown';for(const key of ['title','artist','album']){const m=logs.match(new RegExp('\\b'+key+'\\s*:\\s*([^\\n]+)','i'));if(m){probe[key]=m[1].trim();if(!v(key))set(key,probe[key]);}}
 if(!v('title'))set('title',f.name.replace(/\.[^.]+$/,''));
 if(form.elements.end&&Number(v('end'))>probe.duration)set('end',probe.duration.toFixed(2));
 if(audio){if(audioURL)URL.revokeObjectURL(audioURL);audioURL=URL.createObjectURL(f);audio.src=audioURL;}
 say('Ready. Source duration '+probe.duration.toFixed(2)+' seconds. Review your metadata and settings.');
}
async function samples(){
 await inspect();if(decoded)return decoded;
 await engine.exec(['-i',input,'-vn','-ac','1','-ar','12000','-c:a','pcm_f32le','-f','f32le','analysis.f32']);
 engine.files.add('analysis.f32');const bytes=await engine.api.readFile('analysis.f32');decoded=new Float32Array(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength));return decoded;
}
async function artwork(){const f=form.elements.artwork?.files[0];if(!f){art=null;return;}if(!['image/jpeg','image/png','image/webp'].includes(f.type))throw Error('Choose JPEG, PNG or WebP artwork. Convert HEIC to JPEG first.');if(f.size>40*1048576)throw Error('Choose artwork under 40 MB.');if(art?.file===f)return;const image=await createImageBitmap(f);if(art)art.image.close();art={file:f,image};}
function wrap(ctx,text,x,y,maxWidth,size,lineHeight,maxLines=3){ctx.font='600 '+size+'px sans-serif';const words=String(text||'').split(/\s+/);let line='',lines=[];for(const word of words){if(ctx.measureText(line+' '+word).width>maxWidth&&line){lines.push(line);line=word;}else line+=(line?' ':'')+word;}if(line)lines.push(line);for(let i=0;i<Math.min(lines.length,maxLines);i++){let s=lines[i];if(i===maxLines-1&&lines.length>maxLines)s+='…';while(ctx.measureText(s).width>maxWidth&&s.length>1)s=s.slice(0,-2)+'…';ctx.fillText(s,x,y+i*lineHeight,maxWidth);}}
function scene(target,visual=false){
 const [w,h]=dimensions();target.width=w;target.height=h;const c=target.getContext('2d');c.clearRect(0,0,w,h);const vertical=h>w;const hasVisual=v('showvisual',true)&&v('visualizer','wave')!=='off';const safeX=v('platform')==='tiktok'?w*.44:w*.5;
 if(!v('transparent')){c.fillStyle='#0b1c26';c.fillRect(0,0,w,h);}
 if(art){c.save();c.filter='blur('+Math.max(w,h)*.035+'px)';const scale=Math.max(w/art.image.width,h/art.image.height);c.drawImage(art.image,(w-art.image.width*scale)/2,(h-art.image.height*scale)/2,art.image.width*scale,art.image.height*scale);c.restore();c.fillStyle='#03101bac';c.fillRect(0,0,w,h);}
 c.textAlign='center';c.fillStyle='#fff3d7';
 if(v('showtext',true)&&tool!=='artwork-resizer'){wrap(c,v('title'),safeX,h*(vertical?.13:.085),w*.73,Math.min(w*.044,h*.065),h*.055,vertical?3:2);wrap(c,v('artist')||v('album'),safeX,h*(vertical?.30:.20),w*.72,Math.min(w*.032,h*.043),h*.042,vertical?2:1);}
 if(art){const maxW=tool==='artwork-resizer'?w:w*(vertical?.7:.48),maxH=tool==='artwork-resizer'?h:h*(hasVisual?(vertical?.47:.54):(vertical?.58:.66)),scale=Math.min(maxW/art.image.width,maxH/art.image.height),aw=art.image.width*scale,ah=art.image.height*scale;c.drawImage(art.image,(tool==='artwork-resizer'?w*.5:safeX)-aw/2,(tool==='artwork-resizer'?h*.5:h*(hasVisual?(vertical?.55:.50):.59))-ah/2,aw,ah);}
 if((visual||tool==='waveform-image'||tool==='audio-clipper')&&decoded&&(hasVisual||tool==='waveform-image'||tool==='audio-clipper')){const n=180,base=h*(tool==='waveform-image'?.57:vertical?.82:.865),amp=h*.09;c.strokeStyle='#edca83';c.lineWidth=Math.max(2,w/800);for(let i=0;i<n;i++){const moving=visual&&audio&&!audio.paused&&['art-track','audiogram'].includes(tool),span=moving?Math.min(decoded.length,12000):decoded.length,offset=moving?Math.min(Math.floor(audio.currentTime*12000),Math.max(0,decoded.length-span)):0,from=offset+Math.floor(i*span/n),to=offset+Math.floor((i+1)*span/n);let peak=0;const stride=Math.max(1,Math.floor((to-from)/100));for(let j=from;j<to;j+=stride)peak=Math.max(peak,Math.abs(decoded[j]));const x=w*.12+i*w*.7/n;c.beginPath();c.moveTo(x,base-peak*amp);c.lineTo(x,base+peak*amp);c.stroke();}}
 if($('[data-layout]'))$('[data-layout]').textContent=(vertical?'Vertical ':'Horizontal ')+v('platform')+' layout: title above artwork. '+(hasVisual?'Visualizer below. ':'Waveform hidden; artwork enlarged and moved down. ')+w+' × '+h+'.';
}
function draw(){if(canvas)scene(canvas,true);}
function png(c){return new Promise((resolve,reject)=>c.toBlob(b=>b?resolve(b):reject(Error('Image could not be exported.')),'image/png'));}
function animate(){if(!audio?.paused&&!matchMedia('(prefers-reduced-motion: reduce)').matches){draw();frame=requestAnimationFrame(animate);}}
audio?.addEventListener('play',()=>{cancelAnimationFrame(frame);animate();});
audio?.addEventListener('pause',()=>cancelAnimationFrame(frame));
async function exportVideo(platform,options={}){
 await inspect();await artwork();if(tool==='art-track'&&v('mode')==='art'&&!art)throw Error('Choose artwork for Art Track, or select Podcast mode.');
 if(platform)set('platform',platform);const [w,h]=dimensions();let start=tool==='audiogram'?Number(v('start')):0,end=tool==='audiogram'?Math.min(Number(v('end')),probe.duration):probe.duration,duration=end-start;if(options.preview){start=Math.max(start,Math.min(audio?.currentTime||start,end-0.1));duration=Math.min(3,end-start);}
 if(!Number.isFinite(duration)||duration<=0||start<0)throw Error('Set an end time after the start and within the source duration.');
 if(Number(v('quality'))>=2160)say('Processing 4K. This may take substantial memory and time.');
 await samples();draw();
 const background=document.createElement('canvas');scene(background,false);await engine.api.writeFile('scene.png',new Uint8Array(await (await png(background)).arrayBuffer()));engine.files.add('scene.png');
 const args=['-loop','1','-framerate','24','-i','scene.png','-ss',String(start),'-t',String(duration),'-i',input];
 const vis=!v('showvisual',true)?'off':['wave','bars','spectrum','off'].includes(v('visualizer'))?v('visualizer'):'wave',vh=Math.max(16,Math.round(h*.15/2)*2),vw=Math.round(w*.70/2)*2,fade=Math.min(.25,duration/4);
 let filter='[0:v]format=yuv420p[bg];';
 if(vis==='off'){filter+='[bg]null[scene];';args.push('-filter_complex',filter+'[scene]null[video]','-map','[video]','-map','1:a:0');}
 else{const visual=vis==='wave'?'showwaves=s='+vw+'x'+vh+':mode=cline:rate=24:scale=sqrt:draw=full:colors=0xedca83':vis==='bars'?'showfreqs=s='+vw+'x'+vh+':mode=bar:ascale=sqrt:fscale=log:colors=0xedca83':'showspectrum=s='+vw+'x'+vh+':mode=combined:slide=scroll:color=intensity:scale=log';
 filter+='[1:a]asplit[audio][visual];[visual]'+visual+'[wave];[bg][wave]overlay=x='+Math.round(w*.12)+':y='+Math.round(h*(w>h?.79:.76))+':shortest=1[scene];[scene]null[video]';
 args.push('-filter_complex',filter,'-map','[video]','-map','[audio]');}
 args.push('-t',String(duration),'-c:v','libx264','-preset','ultrafast','-crf','20','-pix_fmt','yuv420p','-c:a','aac','-b:a','256k','-movflags','+faststart','video.mp4');
 await engine.exec(args);const blob=await engine.output('video.mp4');const name=[v('artist')||v('album'),v('title'),v('platform')+' '+v('quality')+'p'].filter(Boolean).join(' - ')+'.mp4';if(!options.collect)LocalMedia.complete(blob,name,submit);say('Complete. Video ready to download.');await engine.api.deleteFile('video.mp4');engine.files.delete('video.mp4');if(options.collect){if(!options.preview)lastExport={name,width:w,height:h,duration,bytes:blob.size,platform:v('platform'),visualizer:vis};return {blob,name,width:w,height:h,duration};}lastExport={name,width:w,height:h,duration,bytes:blob.size,platform:v('platform'),visualizer:vis};
 results.replaceChildren();const report=document.createElement('p');report.textContent='Exported '+w+' × '+h+' · '+duration.toFixed(2)+' seconds · '+(blob.size/1048576).toFixed(2)+' MB.';results.append(report);
 for(const [label,p]of [['Export horizontal version','youtube'],['Export TikTok version','tiktok'],['Export Reels version','reels'],['Export Shorts version','shorts']]){const b=document.createElement('button');b.type='button';b.textContent=label;b.onclick=()=>job(()=>exportVideo(p));results.append(b);}
}
async function effectExport(preview=false){
 await inspect();
 const ext=preview?'wav':v('format'),out='effect-output.'+ext;
 const config=MediaEffects.args(tool,v,probe.duration,probe.channels,input,out,preview);
 await engine.exec(config.args);const blob=await engine.output(out);
 if(blob.size<128)throw Error('No audible output was produced. Try a lower silence threshold or another source.');
 if(effectURL)URL.revokeObjectURL(effectURL);effectURL=URL.createObjectURL(blob);
 results.replaceChildren();const report=document.createElement('p');report.textContent=(preview?'First 10 seconds of processed output. ':'Export ready. ')+config.description+' · '+(blob.size/1048576).toFixed(2)+' MB.';
 const player=document.createElement('audio');player.controls=true;player.src=effectURL;player.setAttribute('aria-label','Processed audio preview');
 const download=document.createElement('a');download.href=effectURL;download.download=LocalMedia.filename(selected.name.replace(/\.[^.]+$/,'')+'-'+tool+(preview?'-preview':'')+'.'+ext);download.textContent=preview?'Download preview':'Download '+ext.toUpperCase();download.className='button';
 results.append(report,player,download);if(!preview)LocalMedia.complete(blob,download.download,submit);say(preview?'Preview ready. Compare with the source audio above.':'Complete. Your processed file is ready.');
 await engine.api.deleteFile(out);engine.files.delete(out);
}
async function perform(){
 if(window.MediaEffects?.ids.includes(tool)){await effectExport();return;}
 if(tool==='art-track'||tool==='audiogram'){await exportVideo();return;}
 if(tool==='artwork-resizer'){await artwork();if(!art)throw Error('Choose artwork first.');draw();LocalMedia.complete(await png(canvas),'artwork-'+v('size')+'.png',submit);say('Complete. Artwork ready.');return;}
 await inspect();
 if(['audio-fade','audio-speed','audio-reverse'].includes(tool)){
  let filter='';
  if(tool==='audio-fade'){const fi=Number(v('fadein')),fo=Number(v('fadeout'));if(!Number.isFinite(fi)||!Number.isFinite(fo)||fi<0||fo<0||fi+fo>probe.duration)throw Error('Fade durations must be non-negative and together fit within the source duration.');filter=[fi?'afade=t=in:st=0:d='+fi:'',fo?'afade=t=out:st='+(probe.duration-fo)+':d='+fo:''].filter(Boolean).join(',')||'anull';}
  if(tool==='audio-speed'){const speed=Number(v('speed'));if(!Number.isFinite(speed)||speed<0.5||speed>2)throw Error('Choose a speed between 0.5× and 2×.');filter='atempo='+speed;}
  if(tool==='audio-reverse'){if(probe.duration>600)throw Error('Reversing is limited to 10 minutes. Use Audio Clipper first.');filter='areverse';}
  const ext=v('format'),out='processed.'+ext,args=['-i',input,'-map','0:a:0','-vn','-af',filter,'-c:a',ext==='mp3'?'libmp3lame':ext==='flac'?'flac':'pcm_s24le'];if(ext==='mp3')args.push('-b:a','320k');args.push(out);await engine.exec(args);LocalMedia.complete(await engine.output(out),selected.name.replace(/\.[^.]+$/,'')+'-'+tool+'.'+ext,submit);say('Complete. Processed audio ready to download.');return;
 }
 if(tool==='metadata-editor'){const ext=selected.name.split('.').pop().toLowerCase();if(!['mp3','m4a','flac','ogg','opus','wav'].includes(ext))throw Error('Metadata editing supports MP3, M4A, FLAC, OGG, Opus and WAV.');const out='tagged.'+ext,args=['-i',input,'-map','0:a:0','-c:a','copy'];for(const key of ['title','artist','album'])args.push('-metadata',key+'='+v(key));args.push(out);await engine.exec(args);LocalMedia.complete(await engine.output(out),selected.name.replace(/\.[^.]+$/,'')+'-tagged.'+ext,submit);say('Complete. Metadata copy ready. Some players may not display every tag.');return;}
 if(tool==='audio-check'){await engine.exec(['-i',input,'-vn','-af','loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json','-f','null','-']);const logs=engine.logs.join('\n'),m=logs.match(/\{\s*"input_i"[\s\S]*?\}/);if(!m)throw Error('Loudness analysis could not be read.');const info=JSON.parse(m[0]);results.textContent='Duration: '+probe.duration.toFixed(2)+' seconds\nSample rate: '+probe.sampleRate+' Hz\nChannels: '+probe.channels+'\nIntegrated loudness: '+info.input_i+' LUFS\nTrue peak: '+info.input_tp+' dBTP\nLoudness range: '+info.input_lra+' LU\n'+(Number(info.input_tp)>=0?'Possible clipping or inter-sample peaks. Review the source.':'No above-zero true peak detected. This does not establish mastering quality.')+'\nThese measurements are guidance, not a distributor approval or mastering guarantee.';say('Complete. Audio analysis available.');return;}
 if(tool==='waveform-image'){await samples();draw();LocalMedia.complete(await png(canvas),(v('title')||'audio')+'-waveform.png',submit);say('Complete. Waveform image ready.');return;}
 if(tool==='audio-clipper'){const start=Number(v('start')),end=Math.min(Number(v('end')),probe.duration);if(!Number.isFinite(start)||!Number.isFinite(end)||start<0||end<=start)throw Error('Enter a valid start and end within the source duration.');const ext=v('format'),out='clip.'+ext,args=['-i',input,'-ss',String(start),'-t',String(end-start),'-vn','-c:a',ext==='mp3'?'libmp3lame':ext==='flac'?'flac':'pcm_s24le'];if(ext==='mp3')args.push('-b:a','320k');args.push(out);await engine.exec(args);const clipped=await engine.output(out);handoffFile=new File([clipped],'clip-'+start+'-'+end+'.'+ext,{type:clipped.type});LocalMedia.complete(clipped,handoffFile.name,submit);say('Complete. Audio clip ready.');}
}
form.onsubmit=e=>{e.preventDefault();if(form.reportValidity())job(perform);};
$('[data-effect-preview]')?.addEventListener('click',()=>job(()=>effectExport(true)));
$('[data-effect-reset]')?.addEventListener('click',()=>{for(const e of form.querySelectorAll('[data-effect-settings] input,[data-effect-settings] select')){if(e.type==='checkbox')e.checked=e.defaultChecked;else if(e.options)e.value=[...e.options].find(o=>o.defaultSelected)?.value||e.options[0].value;else e.value=e.defaultValue;}say('Effect settings reset. Your selected file is preserved.');});
$('[data-effect-preset]')?.addEventListener('change',e=>{const presets=JSON.parse(e.target.dataset.effectPreset);for(const [name,value]of Object.entries(presets[e.target.value]||{}))set(name,value);say('Preset applied. You can adjust every setting below.');});
$('[data-inspect]')?.addEventListener('click',()=>job(async()=>{await inspect();if(canvas){await samples();await artwork();draw();}}));
$('[data-silence]')?.addEventListener('click',()=>job(async()=>{await inspect();await engine.exec(['-i',input,'-af','silencedetect=noise=-45dB:d=0.2','-f','null','-']);const logs=engine.logs.join('\n'),starts=[...logs.matchAll(/silence_start:\s*([\d.]+)/g)].map(m=>Number(m[1])),ends=[...logs.matchAll(/silence_end:\s*([\d.]+)/g)].map(m=>Number(m[1]));let start=starts[0]===0?(ends[0]||0):0,end=probe.duration;if(ends.length&&Math.abs(ends.at(-1)-probe.duration)<.1)end=starts.at(-1);if(end<=start)throw Error('The source appears entirely silent. Select a range manually.');set('start',start.toFixed(2));set('end',end.toFixed(2));say('Proposed trim '+start.toFixed(2)+' to '+end.toFixed(2)+' seconds. Preview and review before exporting.');}));
$('[data-play-clip]')?.addEventListener('click',()=>job(async()=>{await inspect();const start=Number(v('start')),end=Number(v('end'));if(start<0||end<=start||start>=probe.duration)throw Error('Choose a valid clip range.');audio.currentTime=start;clipStop=end;await audio.play();}));
audio?.addEventListener('timeupdate',()=>{if(clipStop!==null&&audio.currentTime>=clipStop){audio.pause();clipStop=null;}});
cancel.onclick=()=>{engine.cancel();input='';say('Cancelled. Retry with your selected files and settings.');};
form.addEventListener('change',e=>{if(e.target.name==='source'){selected=null;input='';decoded=null;probe={};if(audio){audio.pause();audio.removeAttribute('src');}const f=e.target.files[0];if(f&&!v('title'))set('title',f.name.replace(/\.[^.]+$/,''));if(f&&canvas){job(async()=>{await samples();await artwork();draw();});return;}}if(['quality','platform','visualizer','size','showtext','mode'].includes(e.target.name)){try{localStorage.setItem('blindbandit-media-'+tool,JSON.stringify(Object.fromEntries(['quality','platform','visualizer','size','mode'].map(n=>[n,v(n)]))));}catch{}}if(e.target.name==='artwork')job(async()=>{await artwork();draw();});else draw();});
function restoreVisuals(){if(form.elements.showvisual)form.elements.showvisual.checked=true;if(form.elements.showtext)form.elements.showtext.checked=true;set('visualizer','wave');try{localStorage.removeItem('blindbandit-media-'+tool);}catch{}draw();say('Title and waveform enabled. Read metadata and preview, or render an exact preview.');}
$('[data-restore-visuals]')?.addEventListener('click',restoreVisuals);
$('[data-reset-preferences]').onclick=()=>{for(const name of ['quality','platform','visualizer','size','mode']){const el=form.elements[name];if(el?.options)el.value=[...el.options].find(o=>o.defaultSelected)?.value||el.options[0].value;}restoreVisuals();};
form.addEventListener('input',e=>{if(['title','artist','album'].includes(e.target.name))draw();});
try{const prefs=JSON.parse(localStorage.getItem('blindbandit-media-'+tool)||'{}');for(const [key,val]of Object.entries(prefs))if(val&&form.elements[key]&&(!form.elements[key].options||[...form.elements[key].options].some(o=>o.value===val)))set(key,val);}catch{}
window.addEventListener('pagehide',()=>{engine.dispose();if(audioURL)URL.revokeObjectURL(audioURL);art?.image.close();cancelAnimationFrame(frame);},{once:true});
draw();
try{if(tool==='audiogram'&&!localStorage.getItem('blindbandit-media-'+tool))set('platform','tiktok');}catch{}
form.addEventListener('media-start-over',()=>{engine.dispose();if(effectURL){URL.revokeObjectURL(effectURL);effectURL='';}input='';selected=null;decoded=null;probe={};art?.image.close();art=null;if(audio){audio.pause();audio.removeAttribute('src');audio.load();}if(audioURL)URL.revokeObjectURL(audioURL);results.replaceChildren();draw();say('Ready for a new file.');});
if(tool==='artwork-resizer'){const pack=document.createElement('button');pack.type='button';pack.textContent='Download artwork pack';pack.onclick=()=>job(async()=>{await artwork();if(!art)throw Error('Choose artwork first.');const d=document.createElement('dialog');d.setAttribute('aria-label','Artwork pack downloads');const h=document.createElement('h2');h.textContent='Artwork pack ready';d.append(h);const urls=[];const previous=v('size');for(const size of ['3000x3000','2000x2000','1400x1400','1080x1080','1080x1920','1920x1080']){set('size',size);draw();const blob=await png(canvas),url=URL.createObjectURL(blob);urls.push(url);const a=document.createElement('a');a.href=url;a.download='artwork-'+size+'.png';a.textContent='Download '+size;d.append(a);}set('size',previous);draw();const close=document.createElement('button');close.textContent='Close / dismiss';close.onclick=()=>d.close();d.append(close);d.addEventListener('close',()=>{urls.forEach(u=>URL.revokeObjectURL(u));d.remove();pack.focus();});document.body.append(d);d.showModal();say('Complete. Choose the artwork sizes to download.');});form.append(pack);}
draw();
function toolButton(label,action){const b=document.createElement('button');b.type='button';b.textContent=label;b.onclick=()=>job(action);form.append(b);return b;}
function downloadPack(items,trigger){const d=document.createElement('dialog');d.setAttribute('aria-label','Export pack downloads');const h=document.createElement('h2');h.textContent='Your export pack is ready';d.append(h);const urls=[];for(const item of items){const url=URL.createObjectURL(item.blob);urls.push(url);const a=document.createElement('a');a.href=url;a.download=LocalMedia.filename(item.name);a.textContent='Download '+item.name;d.append(a);}const close=document.createElement('button');close.textContent='Close / dismiss';close.onclick=()=>d.close();d.append(close);d.onclose=()=>{urls.forEach(u=>URL.revokeObjectURL(u));d.remove();trigger.focus();};document.body.append(d);d.showModal();}
if(['art-track','audiogram'].includes(tool)){
 const preview=document.createElement('video');preview.controls=true;preview.hidden=true;preview.setAttribute('aria-label','Exact rendered preview');preview.style.width='100%';form.append(preview);
 toolButton('Render exact 3-second preview',async()=>{const item=await exportVideo(null,{preview:true,collect:true});if(renderPreviewURL)URL.revokeObjectURL(renderPreviewURL);renderPreviewURL=URL.createObjectURL(item.blob);preview.src=renderPreviewURL;preview.hidden=false;preview.focus();say('Preview ready. This uses the same visualizer, layout and encoding as the final video. Press Play to preview.');});
 const pack=toolButton('Export horizontal + all social versions',async()=>{await inspect();const original=v('platform'),items=[];try{for(const platform of ['youtube','tiktok','reels','shorts']){say('Rendering pack: '+platform+'. Keep this tab open.');items.push(await exportVideo(platform,{collect:true}));}say('Complete. Four versions are ready.');}finally{set('platform',original);draw();if(items.length)downloadPack(items,pack);}});
 toolButton('Download cover frame',async()=>{await artwork();draw();LocalMedia.complete(await png(canvas),(v('title')||'media')+'-cover.png',submit);});
 toolButton('Download render report',async()=>{if(!lastExport)throw Error('Export a video first to create its report.');LocalMedia.complete(new Blob([JSON.stringify(lastExport,null,2)],{type:'text/plain'}),'render-report.txt',submit);});
 toolButton('Copy output details',async()=>{if(!lastExport)throw Error('Export a video first.');await navigator.clipboard.writeText(JSON.stringify(lastExport,null,2));say('Output details copied.');});
}
if(tool==='audio-check'){const note=document.createElement('p');note.textContent='Normalize Copy creates a new 24-bit WAV targeting −14 LUFS and −1.5 dBTP. It changes audio levels and may apply dynamic processing; the original stays unchanged.';form.append(note);toolButton('Normalize a copy to −14 LUFS',async()=>{await inspect();await engine.exec(['-i',input,'-vn','-af','loudnorm=I=-14:TP=-1.5:LRA=11','-ar','48000','-c:a','pcm_s24le','normalized.wav']);LocalMedia.complete(await engine.output('normalized.wav'),'normalized-copy.wav',submit);say('Complete. Normalized copy ready.');});}
if(tool==='audio-clipper'){const b=document.createElement('button');b.type='button';b.textContent='Send exported clip to Audiogram';b.onclick=()=>{if(!handoffFile){say('Export a clip first, then send it to Audiogram.');return;}const nonce=crypto.randomUUID(),child=window.open('/audiogram/#handoff='+nonce,'_blank');if(!child){say('Allow this site to open the Audiogram tab, then try again.');return;}const listener=e=>{if(e.origin===location.origin&&e.source===child&&e.data?.kind==='media-ready'&&e.data.nonce===nonce){child.postMessage({kind:'media-file',nonce,file:handoffFile},location.origin);window.removeEventListener('message',listener);}};window.addEventListener('message',listener);setTimeout(()=>window.removeEventListener('message',listener),30000);};form.append(b);}
if(tool==='audiogram'&&location.hash.startsWith('#handoff=')&&window.opener){const nonce=location.hash.slice(9);const receive=e=>{if(e.origin!==location.origin||e.source!==window.opener||e.data?.kind!=='media-file'||e.data.nonce!==nonce||!(e.data.file instanceof File))return;const transfer=new DataTransfer();transfer.items.add(e.data.file);form.elements.source.files=transfer.files;form.elements.source.dispatchEvent(new Event('change',{bubbles:true}));history.replaceState(null,'',location.pathname);window.removeEventListener('message',receive);say('Your clip is ready here. Choose a destination and generate the video.');};window.addEventListener('message',receive);window.opener.postMessage({kind:'media-ready',nonce},location.origin);}
window.addEventListener('pagehide',()=>{if(renderPreviewURL)URL.revokeObjectURL(renderPreviewURL);if(effectURL)URL.revokeObjectURL(effectURL);handoffFile=null;});

})();
