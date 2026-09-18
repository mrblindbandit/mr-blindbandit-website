// Focused export regression check: executes the shipping controller with a
// Canvas implementation and native FFmpeg. Browser/WASM parity is a separate check.
// Requires ffmpeg and @napi-rs/canvas (available in the native work runtime).
import assert from 'node:assert/strict';
import { readFile, writeFile, mkdtemp, copyFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import vm from 'node:vm';
const require = createRequire(import.meta.url);
const canvasPath = require.resolve('@napi-rs/canvas', {paths:[process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES].filter(Boolean)});
const { createCanvas } = require(canvasPath);
const root = new URL('../', import.meta.url);
const controller = await readFile(new URL('public/media-tools.js', root), 'utf8');
const work = await mkdtemp(join(tmpdir(), 'media-check-'));
try {
 execFileSync('ffmpeg',['-v','error','-f','lavfi','-i','sine=frequency=440:duration=3:sample_rate=12000','-c:a','pcm_s16le',join(work,'test.wav')]);
 function canvas(){const c=createCanvas(640,360);c.toBlob=fn=>fn(new Blob([c.toBuffer('image/png')],{type:'image/png'}));return c;}
 const artwork=canvas();const ac=artwork.getContext('2d');ac.fillStyle='#23495b';ac.fillRect(0,0,640,360);
 const file={name:'test.wav'},artfile={type:'image/png',size:1000};
 const values={source:{files:[file]},artwork:{files:[artfile]},title:{value:'EXPORT TITLE'},artist:{value:'Artist Name'},album:{value:''},mode:{value:'art'},showtext:{type:'checkbox',checked:true},showvisual:{type:'checkbox',checked:true},platform:{value:'youtube'},quality:{value:'360'},visualizer:{value:'wave'},start:{value:'0'},end:{value:'3'},format:{value:'wav'},fadein:{value:'0.5'},fadeout:{value:'0.5'},speed:{value:'2'}};
 let output;
 const engine={api:{loaded:true,writeFile:async(n,b)=>writeFile(join(work,n),b),deleteFile:async(n)=>rm(join(work,n),{force:true})},files:new Set(),exec:async args=>execFileSync('ffmpeg',['-v','error','-y',...args],{cwd:work,timeout:60000}),output:async n=>new Blob([await readFile(join(work,n))])};
 const ctx=vm.createContext({window:{},form:{elements:values},tool:'art-track',engine,selected:file,input:'test.wav',art:{file:artfile,image:artwork},decoded:new Float32Array(36000).fill(.5),probe:{duration:3},audio:{paused:true,currentTime:0,addEventListener:()=>{}},canvas:canvas(),document:{createElement:()=>canvas()},$:()=>null,health:{},submit:{},lastExport:null,handoffFile:null,Blob,File,Uint8Array,Float32Array,URL,console,Number,Math,JSON,Error,LocalMedia:{complete:b=>{output=b}},requestAnimationFrame:()=>0,cancelAnimationFrame:()=>{},matchMedia:()=>({matches:true})});
 vm.runInContext(controller.slice(controller.indexOf('function v('),controller.indexOf('form.onsubmit=')),ctx);

 const drawContext=ctx.canvas.getContext('2d'),drawOriginal=drawContext.drawImage.bind(drawContext);let placements=[];
 drawContext.drawImage=(...args)=>{placements.push(args);return drawOriginal(...args);};
 ctx.scene(ctx.canvas,false);const visiblePlacement=placements.at(-1);
 values.showvisual.checked=false;placements=[];ctx.scene(ctx.canvas,false);const hiddenPlacement=placements.at(-1);
 assert.ok(hiddenPlacement[2]+hiddenPlacement[4]/2>visiblePlacement[2]+visiblePlacement[4]/2,'hiding waveform must move artwork center down');
 values.showvisual.checked=true;drawContext.drawImage=drawOriginal;
 ctx.scene(ctx.canvas,false);
 const pixels=ctx.canvas.getContext('2d').getImageData(0,0,640,100).data;
 let titlePixels=0;for(let i=0;i<pixels.length;i+=4)if(pixels[i]>220&&pixels[i+1]>210&&pixels[i+2]>160)titlePixels++;
 assert.ok(titlePixels>100,'title text must be drawn above artwork');
 for(const visualizer of ['wave','bars','spectrum','off']){
  values.visualizer.value=visualizer;values.showvisual.checked=visualizer!=='off';
  const rendered=await ctx.exportVideo(null,{collect:true});assert.ok(rendered.blob.size>1000);
  const path=join(work,visualizer+'.mp4');await writeFile(path,new Uint8Array(await rendered.blob.arrayBuffer()));
  const streams=JSON.parse(execFileSync('ffprobe',['-v','error','-show_streams','-of','json',path])).streams;
  assert.ok(streams.some(s=>s.codec_type==='audio'));assert.equal(streams.find(s=>s.codec_type==='video').width,640);
  execFileSync('ffmpeg',['-v','error','-ss','0.5','-i',path,'-frames:v','1',join(work,visualizer+'.png')]);
  console.log('Actual MP4 export:',visualizer,rendered.blob.size,'bytes');
 }
 values.showvisual.checked=true;
 // Inspect a decoded export frame, not only the source canvas.
 const {loadImage}=require(canvasPath);
 const waveFrame=await loadImage(join(work,'wave.png'));const offFrame=await loadImage(join(work,'off.png'));
 const a=canvas(),b=canvas();a.getContext('2d').drawImage(waveFrame,0,0);b.getContext('2d').drawImage(offFrame,0,0);
 const wa=a.getContext('2d').getImageData(70,270,460,70).data,wo=b.getContext('2d').getImageData(70,270,460,70).data;
 assert.ok(wa.some((n,i)=>Math.abs(n-wo[i])>30),'encoded waveform must change visible pixels');
 const title=a.getContext('2d').getImageData(0,0,640,100).data;
 assert.ok(title.some((n,i)=>i%4===0&&n>220&&title[i+1]>200),'encoded title must remain visible');
 for(const name of ['audio-fade','audio-speed','audio-reverse']){ctx.tool=name;await ctx.perform();assert.ok(output.size>1000);await writeFile(join(work,name+'.wav'),new Uint8Array(await output.arrayBuffer()));console.log('Actual audio export:',name,output.size,'bytes');}
 for(const name of ['metadata-editor','audio-clipper','waveform-image','artwork-resizer']){ctx.tool=name;await ctx.perform();assert.ok(output.size>100);console.log('Companion export:',name,output.size,'bytes');}
 const duration=Number(execFileSync('ffprobe',['-v','error','-show_entries','format=duration','-of','default=nw=1:nk=1',join(work,'audio-speed.wav')]));assert.ok(Math.abs(duration-1.5)<.1);
 const proof=new URL('../.sites-runtime/media-proof.png',import.meta.url);await copyFile(join(work,'wave.png'),proof);
 console.log('PASS: title, encoded waveform, four visualizer modes, three new audio exports and speed duration.');
} finally {await rm(work,{recursive:true,force:true});}
