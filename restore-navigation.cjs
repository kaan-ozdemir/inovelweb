const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve('static-site');
const shell=fs.readFileSync(path.join(root,'sayfalar/about/index.html'),'utf8');
const {normalizeHeader:repairHeader}=require('./navigation-shared.cjs');
if(process.argv.includes('--menus-only')){syncHeaders();console.log('Menus updated: Blog stays under Content; Inovel, GBS, KASIS precede the platform link.');process.exit(0);}
fs.mkdirSync(path.join(root,'etkinlikler/js'),{recursive:true});
fs.mkdirSync(path.join(root,'etkinlikler/assets'),{recursive:true});
for(const name of ['register.js','tombola_view.js','vampire.js'])fs.copyFileSync('backups/original-event-'+name,path.join(root,'etkinlikler/js',name));
for(const name of ['view.js','firebase-config.js'])fs.copyFileSync('backups/original-event-js-'+name,path.join(root,'etkinlikler/js',name));
fs.copyFileSync('backups/original-event-assets-logo.png',path.join(root,'etkinlikler/assets/logo.png'));
for(const name of ['register.html','tombola_view.html','vampire.html','view.html']){
 let html=fs.readFileSync('backups/original-event-'+name,'utf8');
 html=html.replace('</head>','<link rel="stylesheet" href="../assets/platform-restore.css">\n</head>');
 html=html.replace(/(<body\b[^>]*>)/,'$1<a class="platform-return" href="index.html">← Etkinlik seçimi</a>');
 fs.writeFileSync(path.join(root,'etkinlikler',name),html,'utf8');
}
let generator=fs.readFileSync('update-events.cjs','utf8');
generator=generator.replace("file:'etkinlikler/index.html',category:'all'","file:'etkinlikler/arsiv/index.html',category:'all'");
fs.writeFileSync('update-events.cjs',generator,'utf8');
const header=repairHeader(shell.match(/<header class="modern-header">[\s\S]*?<\/header>/)[0]).replaceAll('../../','../');
const footer=shell.match(/<footer class="modern-footer">[\s\S]*?<\/footer>/)[0].replaceAll('../../','../');
const tools=[{file:'register.html',number:'01',title:'ÇEKİLİŞ KAYIT',text:'Etkinlik çekilişi için kayıt alanını aç.',action:'KAYIT EKRANINA GİT'},{file:'tombola_view.html',number:'02',title:'TOMBALA',text:'Etkinlikteki canlı tombala ekranını takip et.',action:'TOMBALA EKRANINI AÇ'},{file:'vampire.html',number:'03',title:'VAMPİR KÖYLÜ',text:'Oda oluştur veya mevcut bir oyuna katıl.',action:'OYUNA GİT'}];
const html=`<!DOCTYPE html><html lang="tr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="theme-color" content="#101010"><title>Etkinlik Seçimi — İnovel</title><meta name="description" content="İnovel etkinlik platformu: çekiliş kayıt, tombala ve Vampir Köylü ekranları. Geçmiş etkinlikler için arşivi keşfet."><link rel="icon" href="../wp-content/uploads/2023/11/cropped-4619ae774d4b5a017f280d5f2b16d18f_272x272_fit-32x32.png"><link rel="stylesheet" href="../assets/modern-site.css"><link rel="stylesheet" href="../assets/editorial-theme.css"><link rel="stylesheet" href="../assets/editorial-layout.css"><link rel="stylesheet" href="../assets/event-platform.css"><script src="../assets/modern-site.js" defer></script></head><body class="modern-home direction-editorial platform-page">${header}<main id="main-content"><section class="platform-hero zine-wrap"><nav class="platform-breadcrumb" aria-label="Sayfa yolu"><a href="../index.html">Ana sayfa</a><span aria-hidden="true">/</span><span aria-current="page">Etkinlikler</span></nav><p class="zine-section-tag">İNOVEL ETKİNLİK PLATFORMU</p><h1>ETKİNLİĞİNİ SEÇ.<br><span>ARASINA KATIL.</span></h1><p>Çekiliş kayıt, canlı tombala veya Vampir Köylü. Katılmak ya da takip etmek istediğin ekranı seç.</p></section><section class="platform-choices zine-wrap" aria-label="Etkinlik ekranları">${tools.map(tool=>`<a class="platform-choice" href="${tool.file}"><span class="platform-number">${tool.number}</span><h2>${tool.title}</h2><p>${tool.text}</p><span class="platform-action">${tool.action}<span aria-hidden="true">↗</span></span></a>`).join('')}</section><p class="platform-live-note zine-wrap">Kayıt ve canlı oyun ekranları etkinlik düzenleyicisinin aktif oturumuna bağlıdır.</p><section class="platform-archive zine-wrap"><div><p class="zine-section-tag">GEÇMİŞ BULUŞMALARIMIZ</p><h2>ETKİNLİK<br><span>ARŞİVİ.</span></h2><p>İnovel, GBS ve KASİS buluşmalarını, etkinlik afişlerini ve tarih bilgilerini keşfet.</p></div><a class="zine-button" href="arsiv/index.html">TÜM ETKİNLİKLERİ GÖR <span aria-hidden="true">↗</span></a></section><p class="platform-credit zine-wrap">Medya ve Tasarım Ekibi · <a href="https://devosuit.com" target="_blank" rel="noopener noreferrer">devosuit</a></p></main>${footer}</body></html>`;
fs.writeFileSync(path.join(root,'etkinlikler/index.html'),html,'utf8');
function walk(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(entry=>entry.isDirectory()?walk(path.join(dir,entry.name)):[path.join(dir,entry.name)]);}
function syncHeaders(){for(const file of walk(root).filter(file=>file.endsWith('.html'))){
 let text=fs.readFileSync(file,'utf8');const current=text.match(/<header class="modern-header">[\s\S]*?<\/header>/)?.[0];if(!current)continue;
 text=text.replace(current,repairHeader(current));
 if(!text.includes('assets/navigation-repairs.css')){
  const prefix=path.relative(path.dirname(file),root).replaceAll('\\','/');
  text=text.replace('</head>',`<link rel="stylesheet" href="${prefix?prefix+'/':''}assets/navigation-repairs.css">\n</head>`);
 }
 fs.writeFileSync(file,text,'utf8');
}}
syncHeaders();
console.log('Standalone Blog link and direct event selection restored; four original platform screens and client modules copied.');
