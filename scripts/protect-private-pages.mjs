import {readFileSync,rmSync,existsSync,readdirSync} from 'node:fs';
import {resolve,join} from 'node:path';
const root=process.cwd();
const routes=JSON.parse(readFileSync(join(root,'data/private-routes.json'),'utf8'));
const client=resolve(root,'dist/client');
if(!existsSync(client))throw new Error('Missing compiled client output');
for(const route of routes){
 const file=resolve(client,'.'+route,'index.html');
 if(!file.startsWith(client+'/'))throw new Error('Invalid protected route');
 for(const suffix of ['','.gz','.br'])rmSync(file+suffix,{force:true});
}
console.log(`Protected ${routes.length} private documents from static asset delivery.`);
function removeDocuments(directory){for(const item of readdirSync(directory,{withFileTypes:true})){const file=join(directory,item.name);if(item.isDirectory())removeDocuments(file);else if(/\.html(?:\.(?:gz|br))?$/.test(item.name))rmSync(file);}}
removeDocuments(client);
console.log('All HTML documents are routed through the Worker for hostname and access control.');

// Sitemap is generated from publication state and must bypass static delivery.
for(const suffix of ['', '.gz', '.br'])rmSync(join(client,'sitemap.xml'+suffix),{force:true});

// Serve crawl policy through the same Worker as the dynamic sitemap.
for(const suffix of ['', '.gz', '.br'])rmSync(join(client,'robots.txt'+suffix),{force:true});
