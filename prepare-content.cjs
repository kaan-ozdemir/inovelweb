const fs=require('node:fs');
const path=require('node:path');
const {JSDOM}=require('jsdom');
const directory='static-site/assets/content';
fs.mkdirSync(directory,{recursive:true});
const magazineSettings=[
 {id:'magazine-2024-yaz',title:'2024 Yaz Sezonu',year:'2024',file:'inovel-2024-yaz-sezonu-dergisi/index.html',pdfSource:'https://inoveldpu.com/wp-content/uploads/2024/09/24yaz2.pdf',available:false},
 {id:'magazine-2023-yaz',title:'2023 Yaz Sezonu',year:'2023',file:'dergi-2023yaz/index.html',pdfSource:'https://inoveldpu.com/wp-content/uploads/2024/03/Calameo-PDF-Downloader-1.pdf',available:true},
 {id:'magazine-2024-ilkbahar',title:'2024 İlkbahar Sezonu',year:'2024',file:'inovel-2024-ilkbahar/index.html',pdfSource:'https://inoveldpu.com/wp-content/uploads/2024/09/24ilk-1.pdf',available:true},
 {id:'magazine-2023-sonbahar',title:'2023 Sonbahar Sezonu',year:'2023',file:'dergi-2023sonbahar/index.html',pdfSource:'https://inoveldpu.com/wp-content/uploads/2024/09/23son.pdf',available:true},
 {id:'magazine-2024-kis',title:'2024 Kış Sezonu',year:'2024',file:'dergi-kissayisi/index.html',pdfSource:'https://inoveldpu.com/wp-content/uploads/2024/03/kis.pdf',available:true}
];
function source(file){const backup='backups/content-'+file.replaceAll('/','-');if(!fs.existsSync(backup))fs.copyFileSync('static-site/'+file,backup);return new JSDOM(fs.readFileSync(backup,'utf8')).window.document;}
const magazineDoc=source('dergi/index.html');
const podcastDoc=source('podcasts/index.html');
const blogDoc=source('blogs/index.html');
const records=[];
magazineDoc.querySelectorAll('.vc-hoverbox').forEach((box,index)=>{
 const settings=magazineSettings[index];
 const imageSource=box.querySelector('.vc-hoverbox-front').getAttribute('style').match(/url\(([^)]+)\)/)[1];
 records.push({...settings,kind:'magazine',label:'Dergi',imageSource,href:settings.file,description:box.querySelector('.vc-hoverbox-back p').textContent.trim()});
});
podcastDoc.querySelectorAll('.vc-hoverbox').forEach((box,index)=>{
 const title=box.querySelector('h2').textContent.trim();
 records.push({id:'podcast-'+index,kind:'podcast',label:'Podcast',title,year:title.match(/\d{4}/)[0],series:'Yaz Bunu Güzel Söz',href:box.querySelector('.vc-hoverbox-back a').href,imageSource:box.querySelector('.vc-hoverbox-front').getAttribute('style').match(/url\(([^)]+)\)/)[1],description:'Yaz Bunu Güzel Söz podcast serisinden. Spotify’da dinle.'});
});
const blogTitle=blogDoc.querySelector('h4 a');
records.push({id:'blog-kariyer',kind:'blog',label:'Blog',title:blogTitle.textContent.trim(),year:'2023',date:'31 Aralık 2023',href:'kariyer_gelisimi_ve_inovasyon_gelecege_adim/index.html',image:'wp-content/uploads/2023/12/image-1024x675.png',description:'Kariyer gelişimi ve inovasyon arasındaki bağı keşfet.'});
(async()=>{
 await Promise.all(records.filter(record=>record.imageSource).map(async record=>{
   const extension=path.extname(new URL(record.imageSource).pathname);
   const output=path.join(directory,record.id+extension);
   if(!fs.existsSync(output)){
     const response=await fetch(record.imageSource,{signal:AbortSignal.timeout(20000)});
     if(!response.ok)throw new Error(record.imageSource+': '+response.status);
     const bytes=Buffer.from(await response.arrayBuffer());
     if(!(bytes[0]===137&&bytes[1]===80)&&!(bytes[0]===255&&bytes[1]===216))throw new Error('Invalid cover image');
     fs.writeFileSync(output,bytes);
   }
   record.image='assets/content/'+path.basename(output);
 }));
 await Promise.all(records.filter(record=>record.kind==='magazine'&&record.available).map(async record=>{
   const output=path.join(directory,record.id+'.pdf');
   if(!fs.existsSync(output)){
     const response=await fetch(record.pdfSource,{signal:AbortSignal.timeout(60000)});
     if(!response.ok)throw new Error(record.pdfSource+': '+response.status);
     const bytes=Buffer.from(await response.arrayBuffer());
     if(bytes.toString('ascii',0,5)!=='%PDF-')throw new Error('Invalid PDF file');
     fs.writeFileSync(output,bytes);
   }
   record.pdf='assets/content/'+path.basename(output);
 }));
 fs.writeFileSync(path.join(directory,'catalog.json'),JSON.stringify(records,null,2)+'\n','utf8');
 console.log('5 magazines, 3 podcasts, 1 blog; 8 covers and 4 PDFs stored locally.');
})().catch(error=>{console.error(error);process.exitCode=1;});
