import {spawn} from 'node:child_process';
import {mkdtemp,readFile,writeFile,rm,stat} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
const types={wav:'audio/wav',mp3:'audio/mpeg',flac:'audio/flac',m4a:'audio/mp4',png:'image/png',mp4:'video/mp4'};
export function command(job,input,artwork,output){
 const o=job.options||{},format=['wav','mp3','flac','m4a'].includes(o.format)?o.format:'wav';
 const width=Number.isInteger(o.width)?Math.max(128,Math.min(3840,o.width)):1920,height=Number.isInteger(o.height)?Math.max(128,Math.min(3840,o.height)):1080;
 const args=['-nostdin','-hide_banner','-loglevel','error','-y','-protocol_whitelist','file,pipe','-threads','2'];
 if(job.tool==='artwork-resizer')return {type:types.png,args:[...args,'-i',input,'-vf',`scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2`,'-frames:v','1','-f','image2',output]};
 if(['art-track','audiogram'].includes(job.tool)){
  if(artwork)args.push('-loop','1','-i',artwork);else args.push('-f','lavfi','-i',`color=c=black:s=${width}x${height}:r=25`);
  args.push('-i',input);
  if(job.tool==='audiogram')args.push('-filter_complex',`[0:v]scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2[bg];[1:a]showwaves=s=${width}x${Math.floor(height/4)}:mode=line:colors=white[wave];[bg][wave]overlay=0:H-h[v]`,'-map','[v]','-map','1:a:0');
  else args.push('-map','0:v:0','-map','1:a:0','-vf',`scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2`);
  return {type:types.mp4,args:[...args,'-t','3600','-shortest','-c:v','libx264','-preset','veryfast','-pix_fmt','yuv420p','-c:a','aac','-b:a','192k','-movflags','+faststart','-f','mp4',output]};
 }
 if(!['audio-converter','audio-clipper','audio-normalizer'].includes(job.tool))throw new Error('Unsupported tool');
 if(job.tool==='audio-clipper')args.push('-ss',String(Math.max(0,Math.min(86400,Number(o.start_seconds)||0))));
 args.push('-i',input,'-vn','-map','0:a:0','-t',String(job.tool==='audio-clipper'?Math.max(1,Math.min(3600,Number(o.duration_seconds)||300)):3600));
 if(job.tool==='audio-normalizer')args.push('-af','loudnorm=I=-16:TP=-1.5:LRA=11');
 args.push('-ar',String([44100,48000,96000].includes(o.sample_rate)?o.sample_rate:48000));
 const codec={wav:'pcm_s16le',mp3:'libmp3lame',flac:'flac',m4a:'aac'}[format];args.push('-c:a',codec);
 if(['mp3','m4a'].includes(format))args.push('-b:a',['128k','192k','256k','320k'].includes(o.bitrate)?o.bitrate:'192k');
 return {type:types[format],args:[...args,'-f',format==='m4a'?'ipod':format,output]};
}
export async function processFile(args){await new Promise((resolve,reject)=>{const child=spawn('ffmpeg',args,{stdio:'ignore',shell:false});const timer=setTimeout(()=>child.kill('SIGKILL'),15*60000);child.on('error',()=>{clearTimeout(timer);reject(new Error('Processor unavailable'));});child.on('exit',code=>{clearTimeout(timer);code===0?resolve():reject(new Error('Processing failed'));});});}
async function run(){
 const base=new URL(process.env.MEDIA_API_BASE||'https://mrblindbandit.net');if(base.protocol!=='https:'||base.username||base.password)throw new Error('Use an HTTPS API URL without embedded credentials');
 const key=process.env.MEDIA_WORKER_KEY;if(!/^[a-f0-9]{64}$/i.test(key||''))throw new Error('Configure MEDIA_WORKER_KEY in protected server environment');
 async function request(path,method='GET',body,lease,contentType='application/json'){
  const url=new URL(path,base);if(url.origin!==base.origin)throw new Error('Invalid processor URL');
  const response=await fetch(url,{method,redirect:'error',signal:AbortSignal.timeout(120000),headers:{authorization:'Bearer '+key,...(lease?{'x-job-lease':lease}:{}),...(body?{'content-type':contentType,'content-length':String(body.length)}:{})},body});if(!response.ok)throw new Error('Processor API request failed');return response;
 }
 while(true){let job,dir;try{
  job=(await (await request('/v1/worker/jobs/claim','POST','{}')).json()).data;
  if(!job){await new Promise(r=>setTimeout(r,10000));continue;}
  dir=await mkdtemp(join(tmpdir(),'blindbandit-media-'));const input=join(dir,'input'),output=join(dir,'output');
  const source=await request(job.input_url,'GET',undefined,job.lease_token);if(Number(source.headers.get('content-length'))>250*1024*1024)throw new Error('Input too large');await writeFile(input,new Uint8Array(await source.arrayBuffer()),{mode:0o600});
  let artwork;if(job.options.artwork_id){artwork=join(dir,'artwork');const response=await request(job.artwork_url,'GET',undefined,job.lease_token);await writeFile(artwork,new Uint8Array(await response.arrayBuffer()),{mode:0o600});}
  const operation=command(job,input,artwork,output);await processFile(operation.args);if((await stat(output)).size>250*1024*1024)throw new Error('Output too large');
  await request(job.output_url,'PUT',await readFile(output),job.lease_token,operation.type);console.log('Media job completed.');
 }catch{console.error('Media processor could not finish an operation.');if(job)await request('/v1/worker/jobs/'+encodeURIComponent(job.id)+'/fail','POST','{}',job.lease_token).catch(()=>{});await new Promise(r=>setTimeout(r,10000));}
 finally{if(dir)await rm(dir,{recursive:true,force:true});}}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)run().catch(()=>{console.error('Media processor configuration is invalid.');process.exitCode=1;});
