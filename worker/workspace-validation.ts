export function validateWorkspace(slug:string,d:any,status:string,checks:boolean[]):string|null{
 const compliance=['privacy-casework','legal-holds','retention-reviews','moderation-casework','copyright-notices','consent-audits','regulatory-register','software-register','accessibility-evidence'];
 if(compliance.includes(slug)&&['Closed','Completed','Released','Verified','Evidence recorded','Passed for tested scope'].includes(status)){
  if(checks.some(v=>!v))return 'Complete the review checklist before recording this outcome.';
  const proof:Record<string,string>={'privacy-casework':'response','legal-holds':'release','retention-reviews':'result','moderation-casework':'decision','copyright-notices':'outcome','consent-audits':'evidence','regulatory-register':'evidence','software-register':'evidence','accessibility-evidence':'fix'};
  if(!d[proof[slug]])return 'Record the outcome or supporting evidence before marking this review complete.';
 }
 const ready=['Ready','Approved','Eligible','Submitted','Accepted','Complete','Resolved','Closed'].includes(status);
 if(slug==='delivery-catalog'){
  if(d.isrc&&!/^[A-Z]{2}[A-Z0-9]{3}\d{7}$/.test(d.isrc))return 'ISRC must contain 12 uppercase letters and digits, without hyphens.';
  if(d.upc){if(!/^\d{12,13}$/.test(d.upc))return 'UPC/EAN must contain 12 or 13 digits.';const digits=[...d.upc].map(Number),last=digits.pop();if((10-digits.reverse().reduce((n,x,i)=>n+x*(i%2?1:3),0)%10)%10!==last)return 'The UPC/EAN check digit is invalid.';}
  if(ready&&['artist','isrc','upc','releaseDate','master','artwork','credits'].some(k=>!d[k]))return 'Complete the release metadata before marking this record ready.';
 }
 if(slug==='ownership-splits'){
  if(d.rightsType&&!['master','composition'].includes(d.rightsType.toLowerCase()))return 'Rights type must be master or composition.';
  if(d.shares){let total=0;const names=new Set();for(const line of d.shares.split('\n').filter((x:string)=>x.trim())){const parts=line.split('|').map((x:string)=>x.trim());if(parts.length!==2||!parts[0]||!/^\d{1,3}(\.\d{1,2})?$/.test(parts[1]))return 'Use one owner per line: Name | percentage (up to two decimal places).';const n=Math.round(Number(parts[1])*100),name=parts[0].toLowerCase();if(n<=0||n>10000||names.has(name))return 'Owners must be unique, with shares greater than zero and at most 100%.';names.add(name);total+=n;}if(total>10000||ready&&total!==10000)return 'Approved ownership shares must total exactly 100%; draft shares cannot exceed 100%.';}
  if(ready&&['work','rightsType','shares','evidence'].some(k=>!d[k]))return 'Record the work, rights type, shares and signed agreement reference first.';
 }
 if(slug==='territory-rights'){
  if(d.territories&&!/^(WORLD|[A-Z]{2}(\s*,\s*[A-Z]{2})*)$/.test(d.territories))return 'Use WORLD or comma-separated two-letter territory codes.';
  if(d.start&&d.end&&d.end<d.start)return 'Rights end cannot precede rights start.';
  if(ready&&['work','territories','start','evidence'].some(k=>!d[k]))return 'Record the work, territories, start date and agreement reference.';
 }
 if(slug==='content-id-review'){
  if(d.exclusive&&!['yes','no','unknown'].includes(d.exclusive.toLowerCase()))return 'Exclusive rights must be yes, no or unknown.';
  if(status==='Eligible'&&(d.exclusive.toLowerCase()!=='yes'||['work','evidence','audio','provider','claimant'].some(k=>!d[k])))return 'Eligibility requires exclusive rights, evidence, reference audio, partner and claimant ID.';
 }
 if(slug==='delivery-history'&&['Submitted','Accepted','Complete'].includes(status)&&['work','provider','submitted','reference'].some(k=>!d[k]))return 'Record the work, provider, submission date and delivery reference.';
 if(slug==='claims-disputes'&&status!=='Draft'&&['work','provider','claim','evidence'].some(k=>!d[k]))return 'Record the work, provider, claim ID and evidence reference.';
 if(slug==='takedown-reviews'&&ready&&['work','url','evidence','reason','reviewer'].some(k=>!d[k]))return 'Complete the rights evidence, scope and authorized reviewer before approval.';
 if(slug==='takedown-reviews'&&status==='Submitted'&&!d.reference)return 'Record the external request reference.';
 if(['delivery-catalog','ownership-splits','territory-rights','content-id-review','takedown-reviews'].includes(slug)&&ready&&checks.some(x=>!x))return 'Complete every review check before approving this record.';
 return null;
}
