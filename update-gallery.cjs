const fs=require('node:fs');
const {JSDOM}=require('jsdom');
const target='static-site/galeri/index.html';
const backup='backups/gallery-before-redesign.html';
if(!fs.existsSync(backup))fs.copyFileSync(target,backup);
const source=fs.readFileSync(backup,'utf8');
const d=new JSDOM(source).window.document;
const esc=value=>String(value||'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const captions=[
 ['Kampüste bir arada','İnovel standının önünde birlikte poz veren topluluk üyeleri','topluluk'],
 ['Salondan bir kare','Konferans salonunun kırmızı koltuklarında oturan İnovel ekibi','topluluk'],
 ['İnovel’24’ten bir hatıra','İnovel’24 sahnesinin önünde bir araya gelen katılımcılar','sahne'],
 ['Aynı sahnede, birlikte','İnovel’24 pankartının önünde sahnede poz veren kalabalık ekip','sahne'],
 ['All Star’dan bir an','İnovel All Star sahnesinde bir araya gelen topluluk üyeleri','sahne'],
 ['Fuayeden bir kare','Etkinlik fuayesinde İnovel pankartının önünde poz veren ekip','topluluk'],
 ['Sahne ve dinleyiciler','Dolu konferans salonunda sahnedeki konuşmacıyı dinleyen katılımcılar','sahne'],
 ['Sahnede bir arada','Konferans salonu sahnesinde toplu fotoğraf için bir araya gelen katılımcılar','sahne'],
 ['İnovel standında','İnovel pankartının önünde duran topluluk üyeleri','topluluk'],
 ['Birlikte bir hatıra','Etkinlik alanındaki İnovel standında birlikte poz veren ekip','topluluk'],
 ['Ekiple aynı kadrajda','İnovel pankartının önünde ayakta ve diz çökerek poz veren topluluk üyeleri','topluluk'],
 ['Sahneden hatıralar','Konferans salonunun sahnesinde ellerini kaldırarak poz veren topluluk üyeleri','sahne']
];
const photos=[...d.querySelectorAll('.mg-single-img')].map((el,index)=>{
 const image=el.querySelector('img');
 const converted=/\.heic$/i.test(image.getAttribute('src'));
 const full=converted?'../assets/gallery/IMG_5458.jpg':el.querySelector('a').getAttribute('href');
 const dimensions=converted?[3024,4032]:el.querySelector('a').getAttribute('data-size').split('x').map(Number);
 const set=image.getAttribute('srcset')||'';
 const candidates=set.split(',').map(entry=>entry.trim().split(/\s+/)).filter(parts=>parts.length===2);
 const preferred=candidates.find(parts=>parseInt(parts[1],10)>=768&&parseInt(parts[1],10)<=1024);
 return {index,original:el.querySelector('a').getAttribute('href'),full,src:preferred?preferred[0]:full,srcset:converted?'':set,width:dimensions[0],height:dimensions[1],title:captions[index][0],alt:captions[index][1],category:captions[index][2]};
});
if(photos.length!==12)throw new Error('Expected twelve original gallery photos');
const additions=[
 ['salonda-birlikte.jpg',640,426,'Salonda birlikte','Konferans salonunda toplu fotoğraf için bir araya gelen İnovel ekibi','sahne'],
 ['kampus-bulusmasi.jpg',1200,1600,'Kampüste buluşma','Kampüsteki topluluk çadırları önünde bir araya gelen İnovel ekibi','topluluk'],
 ['kampus-ekibi.jpg',4284,5712,'Aynı heyecan, aynı ekip','Açık havada İnovel tişörtleriyle birlikte poz veren ekip','topluluk'],
 ['15-yil-toplu.jpg',4032,2268,'15. Yıl Buluşması · 7 Kasım 2026','7 Kasım 2026 tarihli İnovel 15. Yıl Buluşması toplu fotoğrafı','topluluk'],
 ['15-yil-ekip.jpg',5712,3213,'15. Yıl Buluşması · Ekip · 7 Kasım 2026','7 Kasım 2026 tarihli 15. Yıl Buluşması’nda bir araya gelen İnovel ekibi','topluluk'],
 ['15-yil-bulusma.jpg',3024,4032,'15. Yıl Buluşması · 7 Kasım 2026','7 Kasım 2026 tarihli İnovel 15. Yıl Buluşması’ndan bir kare','topluluk']
];
for(const [file,width,height,title,alt,category] of additions){
 const full='../assets/gallery/'+file;
 photos.push({index:photos.length,original:full,full,src:full,srcset:'',width,height,title,alt,category});
}
const previewsFile='static-site/assets/gallery/previews.json';
if(fs.existsSync(previewsFile)){
 const previews=JSON.parse(fs.readFileSync(previewsFile,'utf8'));
 for(const photo of photos)if(previews[photo.full]){photo.src=previews[photo.full];photo.srcset='';}
}
fs.writeFileSync('static-site/assets/gallery/catalog.json',JSON.stringify(photos,null,2)+'\n','utf8');
const header=source.match(/<header class="modern-header">[\s\S]*?<\/header>/)[0];
const footer=source.match(/<footer class="modern-footer">[\s\S]*?<\/footer>/)[0];
const html=`<!DOCTYPE html><html lang="tr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="theme-color" content="#101010"><title>Galeri — İnovel</title><meta name="description" content="İnovel'in etkinliklerinden ve topluluk hayatından fotoğraflar. Birlikte biriktirdiğimiz anları keşfet."><link rel="icon" href="../wp-content/uploads/2023/11/cropped-4619ae774d4b5a017f280d5f2b16d18f_272x272_fit-32x32.png"><link rel="stylesheet" href="../assets/modern-site.css"><link rel="stylesheet" href="../assets/editorial-theme.css"><link rel="stylesheet" href="../assets/editorial-layout.css"><link rel="stylesheet" href="../assets/gallery.css"><script src="../assets/modern-site.js" defer></script><script src="../assets/gallery.js" defer></script></head><body class="modern-home direction-editorial gallery-page">${header}<main id="main-content">
<section class="gallery-hero zine-wrap"><nav class="gallery-breadcrumb" aria-label="Sayfa yolu"><a href="../index.html">Ana sayfa</a><span aria-hidden="true">/</span><span aria-current="page">Galeri</span></nav><div class="gallery-hero-grid"><div><p class="zine-section-tag">GALERİ / İNOVEL ARŞİVİ</p><h1>BAZI ANLAR<br>ANLATILMAZ.<br><span>YAŞANIR.</span></h1><p class="gallery-lead">Etkinliklerimizden ve ekip buluşmalarımızdan fotoğraflar. Büyütmek için bir fotoğrafa dokun.</p></div><aside class="gallery-hero-aside"><span>${photos.length}<span aria-hidden="true">↗</span></span><p>FOTOĞRAF.</p><a class="zine-inline-link" href="#fotograflar">GALERİYİ KEŞFET <span aria-hidden="true">↓</span></a></aside></div></section>
<section class="gallery-library zine-wrap" id="fotograflar" data-gallery-root aria-label="Fotoğraf arşivi"><div class="gallery-controls" role="group" aria-label="Fotoğraf kategorisi" hidden>${[['all','Tümü',photos.length],['topluluk','Topluluk hayatı',photos.filter(p=>p.category==='topluluk').length],['sahne','Sahneden',photos.filter(p=>p.category==='sahne').length]].map(([category,label,count])=>`<button type="button" data-gallery-filter="${category}" aria-pressed="${category==='all'}">${label}<span>${String(count).padStart(2,'0')}</span></button>`).join('')}</div><div class="gallery-grid-heading"><p class="gallery-status" role="status" aria-live="polite">${photos.length} fotoğraf</p><span>BÜYÜTMEK İÇİN FOTOĞRAFA DOKUN <span aria-hidden="true">↗</span></span></div><div class="gallery-grid">${photos.map(photo=>`<figure class="gallery-item" data-gallery-item data-category="${photo.category}"><a class="gallery-photo-link" href="${esc(photo.full)}" data-gallery-photo data-title="${esc(photo.title)}" data-alt="${esc(photo.alt)}" aria-label="${esc(photo.title)} — büyük görüntüle"><div class="gallery-image"><img src="${esc(photo.src)}" ${photo.srcset?`srcset="${esc(photo.srcset)}" sizes="(max-width: 550px) 95vw, (max-width: 950px) 45vw, 30vw"`:''} width="${photo.width}" height="${photo.height}" alt="${esc(photo.alt)}" ${photo.index===0?'fetchpriority="high"':'loading="lazy"'} decoding="async"><span aria-hidden="true">↗</span></div><figcaption><span>${String(photo.index+1).padStart(2,'0')}</span><span>${esc(photo.title)}</span></figcaption></a></figure>`).join('')}</div></section>
<section class="gallery-invite"><div class="zine-wrap"><div><p class="zine-section-tag">ETKİNLİKLERİMİZ</p><h2>DİĞER<br><span>ETKİNLİKLER.</span></h2></div><div><p>Geçmiş etkinliklerin bilgilerine arşivden ulaşabilirsin.</p><a class="zine-button" href="../etkinlikler/index.html">ETKİNLİKLERİ KEŞFET <span aria-hidden="true">↗</span></a><a class="zine-inline-link" href="../sayfalar/about/index.html">EKİPLE TANIŞ <span aria-hidden="true">↗</span></a></div></div></section>
</main>${footer}<dialog class="gallery-viewer" aria-labelledby="gallery-viewer-title"><div class="gallery-viewer-shell"><header class="gallery-viewer-header"><h2 id="gallery-viewer-title">İnovel fotoğraf arşivi</h2><div><a class="gallery-original" href="${photos[0].full}" target="_blank" rel="noopener noreferrer">Tam boy aç <span aria-hidden="true">↗</span></a><button type="button" class="gallery-close" aria-label="Fotoğraf görüntüleyicisini kapat">Kapat <span aria-hidden="true">×</span></button></div></header><div class="gallery-viewer-stage"><button type="button" class="gallery-previous" aria-label="Önceki fotoğraf">←</button><figure><img class="gallery-viewer-image" alt=""><figcaption class="gallery-loading" role="status">Fotoğraf yükleniyor…</figcaption></figure><button type="button" class="gallery-next" aria-label="Sonraki fotoğraf">→</button></div><footer class="gallery-viewer-caption"><p class="gallery-viewer-count" role="status" aria-live="polite"></p><p class="gallery-viewer-help">Sağa–sola kaydır &nbsp; · &nbsp; ← → Gez &nbsp; · &nbsp; Esc Kapat</p></footer></div></dialog></body></html>`;
fs.writeFileSync(target,require('./navigation-shared.cjs').finalizePage(html),'utf8');
console.log('Gallery: '+photos.length+' photos, including all 12 originals; HEIC uses a compatible JPEG copy.');
