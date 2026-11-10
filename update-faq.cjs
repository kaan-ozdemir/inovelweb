const fs = require('node:fs');
const { JSDOM } = require('jsdom');
const target = 'static-site/sayfalar/sss/index.html';
const backup = 'backups/faq-before-redesign.html';
if (!fs.existsSync(backup)) fs.copyFileSync(target, backup);
const source = fs.readFileSync(backup, 'utf8');
const doc = new JSDOM(source).window.document;
const esc = value => String(value || '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const questions = [...doc.querySelectorAll('.vc_toggle')].map(el=>({question:el.querySelector('h4').textContent.trim().replace(/^\d+\.\s*/,''),answer:el.querySelector('.vc_toggle_content').textContent.trim()}));
if (questions.length !== 11) throw new Error('Expected eleven existing FAQs');
questions[5].answer = "Oryantasyon haftasında İnovel standına uğrayarak ekiple tanışabilirsin. Ardından tanışma toplantısına, tanışma kahvaltısına ve mülakatlarımıza katılabilirsin. Sürecin tarih, saat ve yer bilgileri Instagram hesabımız @inoveldpu üzerinden duyurulur.";
const groups = [
  {id:'topluluk',title:'Topluluk hakkında',short:'Topluluk',indices:[0,4,8,9]},
  {id:'katilim',title:'Üyelik ve katılım',short:'Üyelik & katılım',indices:[3,5,6,7]},
  {id:'etkinlikler',title:'Etkinlikler ve sertifika',short:'Etkinlik & sertifika',indices:[1,2,10]}
];
const header=source.match(/<header class="modern-header">[\s\S]*?<\/header>/)[0];
const footer=source.match(/<footer class="modern-footer">[\s\S]*?<\/footer>/)[0];
let ordinal=0;
const body = `<!DOCTYPE html>
<html lang="tr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="theme-color" content="#101010"><title>Sıkça Sorulan Sorular — İnovel</title><meta name="description" content="İnovel üyeliği, etkinliklere katılım, sertifika ve topluluk hayatı hakkında sıkça sorulan soruların cevapları."><link rel="icon" href="../../wp-content/uploads/2023/11/cropped-4619ae774d4b5a017f280d5f2b16d18f_272x272_fit-32x32.png"><link rel="stylesheet" href="../../assets/modern-site.css"><link rel="stylesheet" href="../../assets/editorial-theme.css"><link rel="stylesheet" href="../../assets/editorial-layout.css"><link rel="stylesheet" href="../../assets/faq.css"><script src="../../assets/modern-site.js" defer></script><script src="../../assets/faq.js" defer></script></head>
<body class="modern-home direction-editorial faq-page">${header}<main id="main-content">
<section class="faq-hero zine-wrap"><nav class="faq-breadcrumb" aria-label="Sayfa yolu"><a href="../../index.html">Ana sayfa</a><span aria-hidden="true">/</span><span aria-current="page">Sıkça sorulan sorular</span></nav><div class="faq-hero-grid"><div><p class="zine-section-tag">MERAK ETMEKLE BAŞLAR.</p><h1>AKLINDAKİ<br>SORULAR.<br><span>NET CEVAPLAR.</span></h1></div><div class="faq-hero-aside"><span class="faq-question-mark" aria-hidden="true">?</span><p>Üyelik, etkinlikler, topluluk hayatı…<br>İlk adımından önce merak ettiklerin burada.</p></div></div></section>
<div class="faq-layout zine-wrap" data-faq-root><aside class="faq-sidebar"><nav aria-label="Soru kategorileri"><p class="zine-section-tag">KONULARA GÖZ AT</p>${groups.map((group,i)=>`<a href="#faq-${group.id}"><span>${String(i+1).padStart(2,'0')}</span>${esc(group.short)}<span aria-hidden="true">↓</span></a>`).join('')}</nav><div class="faq-side-note"><span aria-hidden="true">↗</span><h2>CEVABIN<br>BURADA YOK MU?</h2><p>Aklındaki diğer sorular için bizimle iletişime geçebilirsin.</p><a class="zine-inline-link" href="../../iletisim/index.html">BİZE YAZ <span aria-hidden="true">↗</span></a></div></aside>
<div class="faq-main"><div class="faq-tools" hidden><label class="faq-search"><span>SORULARDA ARA</span><input type="search" id="faq-search" placeholder="Üyelik, sertifika, etkinlik…" autocomplete="off" aria-controls="faq-questions"></label><button class="faq-expand" type="button" aria-controls="faq-questions" aria-expanded="false">Tümünü aç <span aria-hidden="true">+</span></button></div><p class="faq-status" role="status" aria-live="polite">11 soru · 3 konu</p><div id="faq-questions">${groups.map(group=>`<section class="faq-group" id="faq-${group.id}" aria-labelledby="faq-${group.id}-title"><div class="faq-group-heading"><h2 id="faq-${group.id}-title">${esc(group.title)}</h2><span>${group.indices.length} SORU</span></div>${group.indices.map(index=>{const item=questions[index];ordinal++;return `<details class="faq-item" data-faq-item id="soru-${index+1}" ${ordinal===1?'open':''}><summary><span class="faq-number" aria-hidden="true">${String(ordinal).padStart(2,'0')}</span><h3>${esc(item.question)}</h3><span class="faq-toggle" aria-hidden="true"></span></summary><div class="faq-answer"><p>${esc(item.answer)}</p></div></details>`;}).join('')}</section>`).join('')}</div><div class="faq-empty" hidden><h2>SONUÇ BULUNAMADI.</h2><p>Daha kısa bir kelimeyle arayabilir veya aramayı temizleyebilirsin.</p><button type="button" class="faq-reset">Aramayı temizle <span aria-hidden="true">↗</span></button></div></div></div>
<section class="faq-contact"><div class="zine-wrap"><div><p class="zine-section-tag">SORULARIN DA FİKİRLERİN KADAR DEĞERLİ.</p><h2>BİR MERHABA.<br><span>YENİ BİR BAŞLANGIÇ.</span></h2></div><div><p>Ekiple tanışmak ya da bir şey danışmak istersen buradayız.</p><a class="zine-button" href="../../iletisim/index.html">İLETİŞİME GEÇ <span aria-hidden="true">↗</span></a></div></div></section>
</main>${footer}</body></html>`;
fs.writeFileSync(target,require('./navigation-shared.cjs').finalizePage(body),'utf8');
console.log('Eleven existing questions and answers retained in three categories.');
