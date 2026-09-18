/* Validated effect settings shared by previews, exports and regression checks. */
(()=>{'use strict';
const ids=['audio-volume','audio-equalizer','audio-pitch','audio-channels','audio-loop','audio-compressor','audio-silence'];
function config(tool,get,duration,channels){
 const n=(key,min,max)=>{const raw=get(key);const x=Number(raw);if(raw===''||!Number.isFinite(x)||x<min||x>max)throw Error(key+' must be between '+min+' and '+max+'.');return x;};
 const choice=(key,values)=>{const x=get(key);if(!values.includes(x))throw Error('Choose a valid '+key+'.');return x;};
 const amp=db=>Math.pow(10,db/20);
 let filter='',description='',outputDuration=duration;
 switch(tool){
 case 'audio-volume':{
  const gain=n('gain',-60,24);filter='volume='+gain+'dB';
  if(get('limiter'))filter+=',alimiter=limit='+amp(n('ceiling',-12,0))+':level=false:latency=true';
  description='Gain '+gain+' dB'+(get('limiter')?' with peak limiter':' without limiter');break;}
 case 'audio-equalizer':{
  const bass=n('bass',-18,18),mid=n('mid',-18,18),treble=n('treble',-18,18),preamp=n('preamp',-24,0);
  filter='volume='+preamp+'dB,bass=g='+bass+':f=120:w=0.5,equalizer=f=1000:t=q:w=1:g='+mid+',treble=g='+treble+':f=6000:w=0.5';
  if(get('limiter'))filter+=',alimiter=limit=0.891251:level=false:latency=true';
  description='EQ: bass '+bass+', mid '+mid+', treble '+treble+' dB; preamp '+preamp+' dB';break;}
 case 'audio-pitch':{
  const steps=n('semitones',-12,12),factor=Math.pow(2,steps/12);
  filter='aresample=48000,asetrate='+Math.round(48000*factor)+',aresample=48000,atempo='+(1/factor);
  description='Pitch shift '+steps+' semitones, preserving duration';break;}
 case 'audio-channels':{
  const mode=choice('channelmode',['mono','stereo','left','right','swap']);
  if(['left','right','swap'].includes(mode)&&channels!=='stereo')throw Error('Left, right and swap require a stereo source. Use mono or stereo conversion for other layouts.');
  filter={mono:'aformat=channel_layouts=mono',stereo:'aformat=channel_layouts=stereo',left:'pan=mono|c0=c0',right:'pan=mono|c0=c1',swap:'pan=stereo|c0=c1|c1=c0'}[mode];
  description='Channel conversion: '+mode;break;}
 case 'audio-loop':{
  const repeats=n('repeats',2,20),fade=n('edgefade',0,5);
  if(!Number.isInteger(repeats))throw Error('Repeat count must be a whole number.');
  if(duration>300)throw Error('Use a source up to 5 minutes for looping to limit browser memory.');
  if(fade*2>duration)throw Error('Edge fades must fit within each repeat.');
  outputDuration=duration*repeats;if(outputDuration>3600)throw Error('Loop output must be no longer than 60 minutes.');
  filter='aresample=48000'+(fade?',afade=t=in:d='+fade+',afade=t=out:st='+(duration-fade)+':d='+fade:'')+',aloop=loop='+(repeats-1)+':size='+Math.ceil(duration*48000);
  description=repeats+' repeats'+(fade?' with '+fade+' second edge fades':'');break;}
 case 'audio-compressor':{
  const threshold=n('threshold',-48,0),ratio=n('ratio',1,20),attack=n('attack',0.1,2000),release=n('release',1,9000),makeup=n('makeup',0,24);
  filter='acompressor=threshold='+amp(threshold)+':ratio='+ratio+':attack='+attack+':release='+release+':makeup='+amp(makeup)+':knee=2.82843';
  if(get('limiter'))filter+=',alimiter=limit=0.891251:level=false:latency=true';
  description='Compression '+ratio+':1 at '+threshold+' dB; attack '+attack+' ms, release '+release+' ms';break;}
 case 'audio-silence':{
  const threshold=n('threshold',-80,-10),silence=n('silenceduration',0.1,10),keep=n('keep',0,1),mode=choice('silencemode',['edges','all']);
  if(mode==='edges')filter='silenceremove=start_periods=1:start_duration=0.02:start_threshold='+threshold+'dB:start_silence='+keep+',areverse,silenceremove=start_periods=1:start_duration=0.02:start_threshold='+threshold+'dB:start_silence='+keep+',areverse';
  else filter='silenceremove=start_periods=1:start_duration=0.02:start_threshold='+threshold+'dB:start_silence='+keep+':stop_periods=-1:stop_duration='+silence+':stop_threshold='+threshold+'dB:stop_silence='+keep;
  if(duration>600)throw Error('Use a source up to 10 minutes for silence removal.');
  description='Silence removal: '+mode+'; threshold '+threshold+' dB';outputDuration=null;break;}
 default:throw Error('Unknown audio effect.');
 }
 return {filter,description,outputDuration};
}
function args(tool,get,duration,channels,input,out,preview=false){
 const c=config(tool,get,duration,channels),format=preview?'wav':get('format');
 if(!['wav','mp3','flac'].includes(format))throw Error('Choose WAV, MP3 or FLAC.');
 const result=['-i',input,'-map','0:a:0','-vn','-af',c.filter];
 if(preview)result.push('-t','10');
 result.push('-ar','48000','-c:a',format==='mp3'?'libmp3lame':format==='flac'?'flac':'pcm_s24le');
 if(format==='mp3')result.push('-b:a','320k');
 result.push(out);return {args:result,...c};
}
window.MediaEffects={ids,config,args};
})();
