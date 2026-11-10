const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');
const root='static-site/assets/events';
fs.mkdirSync(root,{recursive:true});
const categories=[['inovel-etkinlik','inovel','İnovel'],['gbs-etkinlik','gbs','GBS'],['kasis-etkinlikler','kasis','KASİS']];
const records=[];
for(const [file,category,label] of categories){
  const doc=new JSDOM(fs.readFileSync(`backups/${file}-grid.html`,'utf8')).window.document;
  for(const el of doc.querySelectorAll('.vc_grid-item')){
    const link=el.querySelector('.vc_gitem-post-data-source-post_title a');
    const source=link.href;
    const slug=new URL(source).pathname.split('/').filter(Boolean).pop();
    const date=el.querySelector('.vc_gitem-post-data-source-post_date').textContent.trim();
    const image=el.querySelector('img').src.replace(/-400x250(?=\.[a-z]+$)/i,'');
    records.push({slug,title:link.textContent.trim(),category,label,archiveDate:date,year:date.match(/\d{4}/)[0],source,imageSource:image});
  }
}
(async()=>{
  await Promise.all(records.map(async record=>{
    const extension=path.extname(new URL(record.imageSource).pathname);
    const file=record.slug+extension;
    const response=await fetch(record.imageSource,{signal:AbortSignal.timeout(15000)});
    if(!response.ok)throw new Error(record.imageSource+': '+response.status);
    const bytes=Buffer.from(await response.arrayBuffer());
    if(!(bytes[0]===137&&bytes[1]===80)&&!(bytes[0]===255&&bytes[1]===216))throw new Error('Invalid image for '+record.slug);
    fs.writeFileSync(path.join(root,file),bytes);
    record.image='assets/events/'+file;
  }));
  records.unshift({slug:'kasis-2025',title:'KASİS 2025',category:'kasis',label:'KASİS',eventDate:'19 Aralık 2025',year:'2025',image:'wp-content/uploads/2026/02/SCR-20260210-piuw.jpeg',venue:'DPÜ · İİBF Konferans Salonu',description:'19 Aralık 2025’te KASİS’te sektör temsilcileri ve ilham veren konuşmacılarla bir araya geldik. Kariyer engellerini aşmak ve geleceğe birlikte bakmak üzerine konuştuk.'});
  const catalogFile=path.join(root,'catalog.json');
  const previous=fs.existsSync(catalogFile)?JSON.parse(fs.readFileSync(catalogFile,'utf8')):[];
  for(const record of previous){if(!records.some(item=>item.slug===record.slug))records.push(record);}
  fs.writeFileSync(catalogFile,JSON.stringify(records,null,2));
  console.log(records.length+' verified archive records; '+(records.length-1)+' original posters saved locally.');
})().catch(error=>{console.error(error);process.exitCode=1;});
