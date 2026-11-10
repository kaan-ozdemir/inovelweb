const fs = require('node:fs');
const { JSDOM } = require('jsdom');
const target = 'static-site/sayfalar/departmanlarimiz/index.html';
const backup = 'backups/departments-before-redesign.html';
if (!fs.existsSync(backup)) fs.copyFileSync(target, backup);
const source = fs.readFileSync(backup, 'utf8');
const doc = new JSDOM(source).window.document;
const esc = value => String(value || '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const content = [...doc.querySelectorAll('h4.service-heading')].map(heading => {
  const parent = heading.closest('.ib-wrapper');
  return {name:heading.textContent.trim(),description:[...parent.querySelectorAll('p')].map(p=>p.textContent.trim()).filter(Boolean).join(' '),image:parent.querySelector('img').getAttribute('src')};
});
const config = [
  {id:'proje-iletisim',short:'Proje & İletişim',title:'BAĞ KUR.<br>HAREKETE GEÇ.',intro:'Topluluğun nabzını tutan, insanları ve fikirleri bir araya getiren ekip.',tags:['Araştırma','Topluluk içi iletişim','Kaynaşma etkinlikleri'],team:2},
  {id:'sponsorluk-finans',short:'Sponsorluk & Finans',title:'İŞ BİRLİĞİNDEN<br>GÜÇ DOĞAR.',intro:'Etkinlikleri hayata geçirmek için ihtiyaç duyulan desteği bir araya getiren ekip.',tags:['Sponsorluk','Maddi destek','Malzeme desteği'],team:3},
  {id:'medya-tasarim',short:'Medya & Tasarım',title:'FİKRİ GÖRÜNÜR<br>HALE GETİR.',intro:'Topluluğun sesini, görüntüsünü ve dijital dünyadaki hikâyesini şekillendiren ekip.',tags:['Sosyal medya','Tasarım','Podcast'],team:1},
  {id:'reklam-marka',short:'Reklam & Marka',title:'HİKÂYEMİZİ<br>DAHA İLERİ TAŞI.',intro:'Etkinlikleri duyuran, içerik üreten ve İnovel’in marka değerini büyüten ekip.',tags:['Etkinlik tanıtımı','Marka değeri','İçerik üretimi'],team:4},
  {id:'akademi',short:'Akademi',title:'ÖĞREN.<br>GELİŞ. PAYLAŞ.',intro:'Kişisel gelişim ve ekip yetkinliği için birlikte öğrenen, çözüm üreten ekip.',tags:['Kişisel gelişim','Yetkinlik','Çözüm üretimi'],team:5}
];
if (content.length !== config.length) throw new Error('Expected five source departments');
content[1].name='Sponsorluk ve Finans Departmanı';
config[1].short='Sponsorluk ve Finans Departmanı';
const header = source.match(/<header class="modern-header">[\s\S]*?<\/header>/)[0];
const footer = source.match(/<footer class="modern-footer">[\s\S]*?<\/footer>/)[0];
const html = `<!DOCTYPE html>
<html lang="tr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="theme-color" content="#101010"><title>Departmanlarımız — İnovel</title><meta name="description" content="İnovel'in beş departmanını keşfet: Proje Geliştirme ve İletişim, Sponsorluk ve Finans, Medya ve Tasarım, Reklam ve Marka, Akademi."><link rel="icon" href="../../wp-content/uploads/2023/11/cropped-4619ae774d4b5a017f280d5f2b16d18f_272x272_fit-32x32.png"><link rel="stylesheet" href="../../assets/modern-site.css"><link rel="stylesheet" href="../../assets/editorial-theme.css"><link rel="stylesheet" href="../../assets/editorial-layout.css"><link rel="stylesheet" href="../../assets/departments.css"><script src="../../assets/modern-site.js" defer></script></head>
<body class="modern-home direction-editorial departments-page">${header}
<main id="main-content">
<section class="dept-hero zine-wrap"><nav class="dept-breadcrumb" aria-label="Sayfa yolu"><a href="../../index.html">Ana sayfa</a><span aria-hidden="true">/</span><span aria-current="page">Departmanlarımız</span></nav><div class="dept-hero-grid"><div><p class="zine-section-tag">DEPARTMANLARIMIZ</p><h1>HANGİ EKİP<br><span>NE YAPIYOR?</span></h1><p class="dept-hero-lead">Etkinlik hazırlıklarını beş departmanla yürütüyoruz. Her ekibin görevlerini aşağıda inceleyebilirsin.</p></div><aside class="dept-hero-aside" aria-label="Beş departman, bir topluluk"><span class="dept-big-number">05<span>↗</span></span><p>DEPARTMAN.<br>BİR TOPLULUK.</p><div class="dept-logo-strip">${content.map(dept=>`<img src="${esc(dept.image)}" width="150" height="116" alt="${esc(dept.name)} logosu">`).join('')}</div></aside></div></section>
<nav class="dept-index zine-wrap" aria-label="Departmanlara hızlı erişim">${config.map((dept,index)=>`<a href="#${dept.id}"><span>${String(index+1).padStart(2,'0')}</span>${esc(dept.short)}<span aria-hidden="true">↓</span></a>`).join('')}</nav>
<div class="dept-sections zine-wrap">${content.map((dept,index)=>{
  const settings=config[index];
  return `<section class="dept-section" id="${settings.id}" aria-labelledby="${settings.id}-title"><div class="dept-section-top"><span>${String(index+1).padStart(2,'0')} / DEPARTMAN</span><p>${esc(dept.name)}</p></div><div class="dept-section-grid"><div class="dept-identity"><div class="dept-emblem"><img src="${esc(dept.image)}" width="150" height="116" alt="${esc(dept.name)} logosu" loading="lazy"></div><h2 id="${settings.id}-title">${settings.title}</h2><p>${esc(settings.intro)}</p></div><div class="dept-description"><h3>NE YAPIYORUZ?</h3><p>${esc(dept.description)}</p><ul aria-label="Çalışma alanları">${settings.tags.map(tag=>`<li>${esc(tag)}</li>`).join('')}</ul><a class="zine-inline-link" href="../about/index.html#group-${settings.team}">EKİPLE TANIŞ <span aria-hidden="true">↗</span></a></div></div></section>`;
}).join('')}</div>
<section class="dept-join"><div class="zine-wrap"><div><p class="zine-section-tag">SIRADAKİ ADIM SANA AİT.</p><h2>DEPARTMAN<br><span>SEÇİMİ.</span></h2></div><div><p>İlgilendiğin departmanı bize yaz. Görevler ve katılım hakkında konuşalım.</p><a class="zine-button" href="../../iletisim/index.html">İLETİŞİME GEÇ <span aria-hidden="true">↗</span></a><a class="zine-inline-link" href="../sss/index.html">AKLINDA SORU MU VAR? <span aria-hidden="true">↗</span></a></div></div></section>
</main>${footer}</body></html>`;
fs.writeFileSync(target, require('./navigation-shared.cjs').finalizePage(html), 'utf8');
console.log('Five departments updated; original descriptions and logos retained.');
