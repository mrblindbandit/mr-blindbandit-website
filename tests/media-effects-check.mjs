import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync,mkdtempSync,rmSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
const context=vm.createContext({window:{}});
vm.runInContext(readFileSync(new URL('../public/media-effects.js',import.meta.url),'utf8'),context);
const effects=context.window.MediaEffects;
const work=mkdtempSync(join(tmpdir(),'effects-check-'));
const defaults={gain:6,limiter:true,ceiling:-1,bass:3,mid:-2,treble:2,preamp:-4,semitones:12,channelmode:'right',repeats:3,edgefade:.05,threshold:-24,ratio:3,attack:10,release:150,makeup:2,silenceduration:.3,keep:.02,silencemode:'all',format:'wav'};
try{
 execFileSync('ffmpeg',['-v','error','-f','lavfi','-i','aevalsrc=0.2*sin(2*PI*440*t)|0.1*sin(2*PI*880*t):s=48000:d=2',join(work,'source.wav')]);
 function render(tool,overrides={},preview=false){const values={...defaults,...overrides},out=join(work,tool+'.'+(preview?'wav':values.format));const config=effects.args(tool,key=>values[key],2,'stereo',join(work,'source.wav'),out,preview);execFileSync('ffmpeg',['-v','error','-y',...config.args],{timeout:30000});const probe=JSON.parse(execFileSync('ffprobe',['-v','error','-show_streams','-show_format','-of','json',out]));assert.ok(Number(probe.format.size)>1000);return {probe,out,config};}
 for(const tool of effects.ids){const {probe}=render(tool);if(tool==='audio-loop')assert.ok(Math.abs(Number(probe.format.duration)-6)<.03);else if(tool==='audio-pitch')assert.ok(Math.abs(Number(probe.format.duration)-2)<.15);if(tool==='audio-channels')assert.equal(probe.streams[0].channels,1);console.log('PASS native export',tool,probe.format.duration+'s');}
 for(const format of ['mp3','flac'])assert.ok(render('audio-volume',{format}).probe.streams[0].codec_name);
 assert.ok(Number(render('audio-loop',{repeats:10},true).probe.format.duration)<=10.01);
 // An octave pitch shift must approximately double zero crossings.
 const pitched=render('audio-pitch').out;
 const samples=execFileSync('ffmpeg',['-v','error','-i',pitched,'-map','0:a','-ac','1','-ar','48000','-f','f32le','-']);
 const f=new Float32Array(samples.buffer.slice(samples.byteOffset,samples.byteOffset+samples.length));let crossings=0;for(let i=4801;i<24000;i++)if(f[i-1]<=0&&f[i]>0)crossings++;assert.ok(crossings>300&&crossings<750);
 // Quiet passages really disappear, while tone remains.
 execFileSync('ffmpeg',['-v','error','-f','lavfi','-i','aevalsrc=if(between(t\\,0.5\\,1.5)\\,0.2*sin(2*PI*440*t)\\,0):s=48000:d=2','-y',join(work,'source.wav')]);
 for(const silencemode of ['edges','all']){const result=render('audio-silence',{silencemode,threshold:-45});console.log('Silence mode',silencemode,result.probe.format.duration);assert.ok(Number(result.probe.format.duration)<(silencemode==='all'?1.4:1.1));assert.ok(Number(result.probe.format.duration)>.8);}
 for(const [tool,override] of [['audio-loop',{repeats:2.5}],['audio-volume',{gain:25}],['audio-pitch',{semitones:Infinity}]])assert.throws(()=>effects.config(tool,k=>({...defaults,...override})[k],2,'stereo'));
 assert.throws(()=>effects.config('audio-channels',k=>defaults[k],2,'mono'));
 console.log('PASS: seven effects, alternate codecs, preview limit, pitch, silence cuts and invalid settings.');
}finally{rmSync(work,{recursive:true,force:true});}
