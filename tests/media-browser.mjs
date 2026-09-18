import { chromium } from '/home/user/media-runtime/node_modules/playwright/index.mjs';
import http from 'node:http';import fs from 'node:fs';import path from 'node:path';
const root=process.cwd()+'/public';const types={'.js':'text/javascript','.css':'text/css','.html':'text/html','.wasm':'application/wasm','.svg':'image/svg+xml','.png':'image/png'};
const server=http.createServer((req,res)=>{const url=new URL(req.url,'http://localhost');let f=path.join(root,decodeURIComponent(url.pathname));if(!path.extname(f))f=path.join(f,'index.html');if(!f.startsWith(root)||!fs.existsSync(f)){res.writeHead(404);res.end();return;}res.setHeader('Content-Type',types[path.extname(f)]||'application/octet-stream');fs.createReadStream(f).pipe(res);}).listen(8788);
const browser=await chromium.launch({headless:true,executablePath:'/ms-playwright/chromium-1228/chrome-linux64/chrome',args:['--no-sandbox']});
const context=await browser.newContext({acceptDownloads:true});const page=await context.newPage();
page.on('pageerror',e=>console.log('PAGE_ERROR',e.message));
const base=process.env.MEDIA_TEST_URL||'http://127.0.0.1:8788';
try{
for(const [route,input,extra]of [
['audio-converter','video.mp4',async()=>{await page.locator('input[value="mp3-high"]').check();}],
['art-track','tone.wav',async()=>{await page.locator('[name=artwork]').setInputFiles('/home/user/art.png');await page.locator('[name=quality]').selectOption('144');}],
['audiogram','tone.wav',async()=>{await page.locator('[name=quality]').selectOption('144');}],
['metadata-editor','tone.wav',async()=>{}],
['waveform-image','tone.wav',async()=>{}],
['artwork-resizer',null,async()=>{await page.locator('[name=artwork]').setInputFiles('/home/user/art.png');}],
['audio-check','tone.wav',async()=>{}],
['audio-clipper','tone.wav',async()=>{}]]){
 await page.goto(base+'/'+route+'/',{waitUntil:'domcontentloaded'});if(input)await page.locator('input[name=source]').setInputFiles('/home/user/'+input);await extra();await page.locator('form[data-media-tool] button[type=submit],form[data-audio-converter] button[type=submit]').click();
 await page.waitForFunction(()=>document.querySelector('dialog[open]')||/^(Error\.|Complete\.)/.test(document.querySelector('[data-health],[data-engine-state]')?.textContent||''),{},{timeout:180000});
 const status=await page.locator('[data-health],[data-engine-state]').textContent();console.log(route,status);
 if(await page.locator('dialog[open]').count()){const downloadPromise=page.waitForEvent('download');await page.locator('dialog a[download]').click();const download=await downloadPromise;await download.saveAs('/home/user/'+route+'-result'+path.extname(download.suggestedFilename()));console.log('OUTPUT',download.suggestedFilename());await page.locator('dialog button').filter({hasText:'Close / dismiss'}).click();}
 else if(route!=='audio-check')console.log('FAILED',route,await page.locator('[data-results],[data-converter-result]').textContent());
}
}finally{await browser.close();server.close();}
