const fs = require('node:fs');
const path = require('node:path');
const root=path.resolve('static-site');
const records=JSON.parse(fs.readFileSync('static-site/assets/events/catalog.json','utf8')).sort((a,b)=>Number(b.year)-Number(a.year));
// --only=slug,slug regenerates event details without touching any archive or other page.
// Add --include-listings to refresh only the selected categories and the full archive.
const onlyArgument=process.argv.slice(2).find(argument=>argument.startsWith('--only='));
const selectedSlugs=onlyArgument?new Set(onlyArgument.slice('--only='.length).split(',').filter(Boolean)):null;
if(selectedSlugs&&(!selectedSlugs.size||[...selectedSlugs].some(slug=>!records.some(record=>record.slug===slug))))throw new Error('Unknown or empty event selection');
const shell=fs.readFileSync('static-site/sayfalar/about/index.html','utf8');
const originalHeader=shell.match(/<header class="modern-header">[\s\S]*?<\/header>/)[0];
const originalFooter=shell.match(/<footer class="modern-footer">[\s\S]*?<\/footer>/)[0];
const esc=value=>String(value||'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const pages=[
 {file:'etkinlikler/arsiv/index.html',category:'all',title:'Etkinlikler',headline:'BULUŞUNCA<br>BAŞKA BİR<br><span>HİKÂYE.</span>',description:'İlham veren buluşmalar, farklı bakış açıları ve birlikte edindiğimiz deneyimler. İnovel etkinlik arşivini keşfet.'},
 {file:'portfolios/inovel-etkinlik/index.html',category:'inovel',title:'İnovel Etkinlikleri',headline:'FİKİRLER<br>AYNI<br><span>SAHNEDE.</span>',description:'İnovel buluşmalarının arşivi. Yıllar içinde bir araya geldiğimiz etkinlikleri ve afişlerini keşfet.'},
 {file:'portfolios/gbs-etkinlik/index.html',category:'gbs',title:'GBS Etkinlikleri',headline:'İLHAM AL.<br>YENİ BİR<br><span>ADIM AT.</span>',description:'GBS etkinlik arşivine göz at. Geçmiş buluşmaların afişleri ve arşiv kayıtları burada.'},
 {file:'portfolios/kasis-etkinlikler/index.html',category:'kasis',title:'KASİS Etkinlikleri',headline:'KARİYER<br><span>BULUŞMASI.</span>',description:'Kariyer yolunda bir araya geldiğimiz KASİS buluşmaları. Etkinlik afişlerini ve geçmiş buluşmaları keşfet.'}
];
function header(prefix){
  const header=originalHeader.replaceAll('../../',prefix);
  return header.includes('>Tüm etkinlikler</a>')?header:header.replace(/(<div>)(<a href="[^"]*portfolios\/inovel-etkinlik\/index.html">)/,`$1<a href="${prefix}etkinlikler/index.html">Tüm etkinlikler</a>$2`);
}
function footer(prefix){return originalFooter.replaceAll('../../',prefix);}
function layout(file,title,body,options={}){
  const prefix=path.relative(path.dirname(path.join(root,file)),root).replaceAll('\\','/')+'/';
  const description=options.description||`${title}: İnovel topluluğunun etkinlik arşivi ve afişleri.`;
  return `<!DOCTYPE html><html lang="tr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="theme-color" content="${options.themeColor||'#101010'}"><title>${esc(title)} — İnovel</title><meta name="description" content="${esc(description)}"><link rel="icon" href="${prefix}wp-content/uploads/2023/11/cropped-4619ae774d4b5a017f280d5f2b16d18f_272x272_fit-32x32.png"><link rel="stylesheet" href="${prefix}assets/modern-site.css"><link rel="stylesheet" href="${prefix}assets/editorial-theme.css"><link rel="stylesheet" href="${prefix}assets/editorial-layout.css"><link rel="stylesheet" href="${prefix}assets/events.css"><script src="${prefix}assets/modern-site.js" defer></script>${options.archiveScript===false?'':`<script src="${prefix}assets/events.js" defer></script>`}</head><body class="modern-home direction-editorial events-page${options.themeClass?' '+options.themeClass:''}">${header(prefix)}<main id="main-content">${body(prefix)}</main>${options.footer?options.footer(prefix):footer(prefix)}</body></html>`;
}
function save(file,html){
  const destination=path.join(root,file);
  const backup='backups/events-'+file.replaceAll('/','-');
  if(fs.existsSync(destination)&&!fs.existsSync(backup))fs.copyFileSync(destination,backup);
  let finalized=require('./navigation-shared.cjs').finalizePage(html);
  if(html.includes('class="event-speakers '))finalized=finalized.replace('</head>','<link rel="stylesheet" href="../../assets/event-speakers.css">\n</head>');
  if(file==='etkinlikler/inovel26/index.html')finalized=finalized.replace('</head>','<link rel="stylesheet" href="../../assets/inovel26.css">\n</head>');
  if(html.includes('kasis-page'))finalized=finalized.replace('</head>','<link rel="stylesheet" href="../../assets/kasis.css">\n</head>');
  if(html.includes('poster-event-page'))finalized=finalized.replace('</head>','<link rel="stylesheet" href="../../assets/poster-events.css">\n</head>');
  fs.mkdirSync(path.dirname(destination),{recursive:true});fs.writeFileSync(destination,finalized,'utf8');
}
function imageAlt(record){return esc(record.imageAlt||record.title+' etkinlik afişi');}
function detailTitle(record){return record.category==='kasis'?`KASİS ${record.edition}`:record.title;}
function speakerSection(record,prefix){
  if(!record.speakerPoster)return '';
  const title=detailTitle(record);
  const poster=record.speakerPoster;
  const posterLink=prefix+poster.image;
  const wrap=record.category==='kasis'?'kasis-wrap':'poster-event-wrap';
  const speakerItems=(record.speakers||[]).map(speaker=>`<li class="event-speaker"><h3 class="event-speaker-name">${esc(speaker.name)}</h3>${speaker.company?`<p class="event-speaker-company">${esc(speaker.company)}</p>`:''}${speaker.role?`<p class="event-speaker-role">${esc(speaker.role)}</p>`:''}</li>`);
  speakerItems.push(...(record.guestCompanies||[]).map(company=>`<li class="event-speaker event-speaker-guest"><h3 class="event-speaker-name">${esc(company)}</h3><p class="event-speaker-role">Konuk kurum</p></li>`));
  speakerItems.push(...(record.workshops||[]).map(company=>`<li class="event-speaker event-speaker-workshop"><h3 class="event-speaker-name">${esc(company)}</h3><p class="event-speaker-role">Workshop</p></li>`));
  return `<section class="event-speakers ${wrap}" id="konusmacilar" aria-labelledby="event-speakers-title">
  <header class="event-speakers-heading">
    <p class="event-speakers-kicker">${esc(title)}</p>
    <h2 id="event-speakers-title">Konuşmacılar</h2>
  </header>
  <div class="event-speakers-layout">
    <figure class="event-speakers-poster">
      <a href="${posterLink}" aria-label="${esc(title)} konuşmacı afişini tam boy aç">
        <img src="${posterLink}" alt="${esc(title)} konuşmacı afişi" width="${poster.width}" height="${poster.height}" loading="lazy" decoding="async">
      </a>
      <figcaption><a href="${posterLink}">Konuşmacı afişini görüntüle ${arrow}</a></figcaption>
    </figure>
    <ul class="event-speakers-list" role="list">
      ${speakerItems.join('\n      ')}
    </ul>
  </div>
</section>`;
}
function dateLabel(record){return record.detailsPending?'Detaylar yakında':record.eventDate?'Etkinlik tarihi: '+esc(record.eventDate):'Arşiv kaydı: '+esc(record.archiveDate);}
function eventFacts(record){
  const rows=[{label:record.detailsPending?'TARİH':record.eventDate?'ETKİNLİK TARİHİ':'ARŞİV KAYDI',value:record.detailsPending?'Henüz eklenmedi':record.eventDate||record.archiveDate}];
  rows.push({label:'SAAT',value:record.eventTime||'Saat bilgisi paylaşılmadı'});
  rows.push({label:'YER',value:record.venue||'Yer bilgisi paylaşılmadı'});
  rows.push({label:'DURUM',value:record.detailsPending?'Detaylar yakında':'Geçmiş etkinlik'});
  const registration=record.registrationUrl&&/^https:\/\//.test(record.registrationUrl)?`<a class="zine-button" href="${esc(record.registrationUrl)}" target="_blank" rel="noopener noreferrer">KATILIM BİLGİSİ <span aria-hidden="true">↗</span></a>`:`<p class="event-participation">${record.detailsPending?'Katılım bağlantısı henüz paylaşılmadı.':'Bu etkinlik sona erdi. Aktif katılım bağlantısı bulunmuyor.'}</p>`;
  return '<section class="event-info-panel" aria-label="Etkinlik özeti"><h2>Bir bakışta</h2><dl>'+rows.map(row=>`<div><dt>${esc(row.label)}</dt><dd>${esc(row.value)}</dd></div>`).join('')+'</dl>'+registration+'</section>';
}
const arrow='<span aria-hidden="true">↗</span>';
function platformNotice(prefix){return `<section class="events-tools-note zine-wrap"><details><summary>Çekiliş ve oyun ekranları</summary><p><a href="${prefix}etkinlikler/register.html">Çekiliş kayıt ↗</a> · <a href="${prefix}etkinlikler/tombola_view.html">Tombala ↗</a> · <a href="${prefix}etkinlikler/vampire.html">Vampir Köylü ↗</a></p><p><a href="${prefix}etkinlikler/index.html">Etkinlik seçim ekranına dön ↗</a></p></details></section>`;}
function cta(prefix){return `<section class="events-cta"><div class="zine-wrap"><div><p class="zine-section-tag">BİR SONRAKİ BULUŞMADA GÖRÜŞELİM.</p><h2>HABERDAR OL.<br><span>ARASINA KATIL.</span></h2></div><div><p>Yeni etkinlik duyuruları için sosyal medya hesabımızı takip edebilir, soruların için ekiple iletişime geçebilirsin.</p><a class="zine-button" href="https://www.instagram.com/inoveldpu/" target="_blank" rel="noopener noreferrer">INSTAGRAM’DA TAKİP ET ${arrow}</a><a class="zine-inline-link" href="${prefix}iletisim/index.html">BİZE YAZ ${arrow}</a></div></div></section>`;}
function inovel26Content(record,prefix){
  return `<section class="inovel26-hero inovel26-wrap" aria-labelledby="inovel26-title">
  <nav class="events-breadcrumb" aria-label="Sayfa yolu">
    <a href="${prefix}portfolios/inovel-etkinlik/index.html">İnovel etkinlikleri</a>
    <span aria-hidden="true">/</span><span aria-current="page">İnovel’26</span>
  </nav>
  <div class="inovel26-layout">
    <div class="inovel26-copy">
      <p class="inovel26-date">9–10 MAYIS 2026</p>
      <h1 id="inovel26-title" aria-label="${esc(record.title)}"><span class="inovel26-word">İNOVEL</span><span class="inovel26-number">26.</span></h1>
      <p class="inovel26-motto">Her şey senin için.<br>Çünkü sen buna değersin.</p>
      <dl class="inovel26-facts">
        <div><dt>Tarih</dt><dd>${esc(record.eventDate)}</dd></div>
        <div><dt>Saat</dt><dd>${esc(record.eventTime)}</dd></div>
        <div><dt>Yer</dt><dd>${esc(record.venue)}</dd></div>
      </dl>
      <p class="inovel26-status">Bu etkinlik sona erdi.</p>
      <a class="inovel26-back" href="${prefix}portfolios/inovel-etkinlik/index.html"><span aria-hidden="true">←</span> Diğer İnovel etkinlikleri</a>
    </div>
    <figure class="inovel26-poster">
      <a class="event-detail-poster" href="${prefix}${record.image}" aria-label="İnovel’26 afişini tam boy aç">
        <img src="${prefix}${record.image}" alt="${imageAlt(record)}" width="${record.imageWidth}" height="${record.imageHeight}" fetchpriority="high">
      </a>
      <figcaption><a href="${prefix}${record.image}">Afişi görüntüle <span aria-hidden="true">↗</span></a></figcaption>
    </figure>
  </div>
</section>`;
}
function inovel26Footer(prefix){
  return `<footer class="inovel26-footer inovel26-wrap">
  <a class="inovel26-footer-brand" href="${prefix}portfolios/inovel-etkinlik/index.html">İNOVEL26</a>
  <p>İnovasyon ve Liderlik Topluluğu<br>Kütahya Dumlupınar Üniversitesi</p>
  <a href="https://www.instagram.com/inoveldpu/" target="_blank" rel="noopener noreferrer">@inoveldpu <span aria-hidden="true">↗</span></a>
</footer>`;
}
function eventArchive(page,filtered,years,prefix){
  return `<div class="events-archive zine-wrap" id="etkinlik-arsivi" data-events-root><div class="events-archive-heading"><h2>${esc(page.title)}</h2><span>${String(filtered.length).padStart(2,'0')} ETKİNLİK KAYDI</span></div><nav class="events-categories" aria-label="Etkinlik kategorileri">${pages.map(category=>`<a href="${prefix}${category.file}" ${category.category===page.category?'aria-current="page"':''}>${category.category==='all'?'Tüm etkinlikler':category.category==='inovel'?'İnovel':category.category==='gbs'?'GBS':'KASİS'}</a>`).join('')}</nav><div class="events-tools" hidden><label><span>ETKİNLİK ARA</span><input type="search" id="event-search" placeholder="Etkinlik adı veya yıl…" autocomplete="off" aria-controls="event-grid"></label><label class="events-year"><span>YIL</span><select id="event-year" aria-controls="event-grid"><option value="all">Tüm yıllar</option>${years.map(year=>`<option value="${year}">${year}</option>`).join('')}</select></label></div><p class="events-status" role="status" aria-live="polite">${filtered.length} etkinlik</p><div class="events-grid" id="event-grid">${filtered.map(record=>`<article class="event-card" data-event data-year="${record.year}" data-search="${esc(record.title+' '+record.label+' '+record.year)}"><a href="${prefix}etkinlikler/${record.slug}/index.html"><div class="event-card-image"><img src="${prefix}${record.image}" width="${record.imageWidth||760}" height="${record.imageHeight||938}" alt="${imageAlt(record)}" loading="lazy"><span>${esc(record.label)}</span></div><div class="event-card-heading"><h3>${esc(record.title)}</h3>${arrow}</div><p>${dateLabel(record)}</p></a></article>`).join('')}</div><div class="events-empty" hidden><h3>BU ARAMADA BULUŞAMADIK.</h3><p>Farklı bir kelime veya yıl seçebilirsin.</p><button type="button" class="events-reset">Filtreleri temizle ${arrow}</button></div></div>`;
}
function kasisContent(record,prefix){
  const title=detailTitle(record);
  const posterLink=`${prefix}${record.image}`;
  return `<section class="kasis-hero kasis-wrap" aria-labelledby="kasis-title">
  <nav class="events-breadcrumb" aria-label="Sayfa yolu">
    <a href="${prefix}etkinlikler/arsiv/index.html">Etkinlik arşivi</a><span aria-hidden="true">/</span>
    <a href="${prefix}portfolios/kasis-etkinlikler/index.html">KASİS</a><span aria-hidden="true">/</span>
    <span aria-current="page">${esc(title)}</span>
  </nav>
  <div class="kasis-layout">
    <div class="kasis-copy">
      <p class="kasis-kicker">${record.eventDate?esc(record.eventDate).toLocaleUpperCase('tr-TR'):'ETKİNLİK ARŞİVİ / '+esc(record.year)}</p>
      <h1 id="kasis-title" class="kasis-title" aria-label="${esc(title)}"><span class="kasis-word">KASİS</span><span class="kasis-edition">${esc(record.edition)}</span></h1>
      <p class="kasis-motto">Kariyer adımların<br>seni ileriye sürüklesin.</p>
      <p class="kasis-description">${esc(record.description||'KASİS buluşmasının arşiv kaydı. Etkinlik afişini bu sayfada inceleyebilirsin.')}</p>
      <dl class="kasis-facts">
        <div><dt>${record.eventDate?'Tarih':'ARŞİV KAYDI'}</dt><dd>${esc(record.eventDate||record.archiveDate)}</dd></div>
        <div><dt>Saat</dt><dd>${esc(record.eventTime||'Saat bilgisi paylaşılmadı')}</dd></div>
        <div><dt>Yer</dt><dd>${esc(record.venue||'Yer bilgisi paylaşılmadı')}</dd></div>
      </dl><p class="kasis-status">Bu etkinlik sona erdi.</p>${record.source?`\n      <p><a class="kasis-link" href="${esc(record.source)}" target="_blank" rel="noopener noreferrer">Özgün arşiv sayfası ${arrow}</a></p>`:''}
      ${record.speakerPoster?'<p><a class="kasis-link" href="#konusmacilar">Konuşmacılar <span aria-hidden="true">↓</span></a></p>':''}
      <a class="kasis-link" href="${prefix}portfolios/kasis-etkinlikler/index.html"><span aria-hidden="true">←</span> Diğer KASİS etkinlikleri</a>
    </div>
    <figure class="kasis-poster">
      <a class="event-detail-poster" href="${posterLink}" aria-label="${esc(title)} afişini tam boy aç">
        <img src="${prefix}${record.image}" alt="${imageAlt(record)}" width="${record.imageWidth}" height="${record.imageHeight}" fetchpriority="high">
      </a>
      <figcaption><a href="${posterLink}">Afişi görüntüle ${arrow}</a></figcaption>
    </figure>
  </div>
</section>`;
}
function kasisFooter(prefix){
  return `<footer class="kasis-footer kasis-wrap">
  <a class="kasis-footer-brand" href="${prefix}portfolios/kasis-etkinlikler/index.html">KASİS</a>
  <p>İnovasyon ve Liderlik Topluluğu<br>Kütahya Dumlupınar Üniversitesi</p>
  <a href="https://www.instagram.com/inoveldpu/" target="_blank" rel="noopener noreferrer">@inoveldpu ${arrow}</a>
</footer>`;
}
const posterThemes={
  inovel25:{className:'inovel25-page',word:'İNOVEL',number:'25.',color:'#171113',brand:'İNOVEL25',motto:'Her şey senin için.<br>Çünkü sen buna değersin.'},
  inovel24:{className:'inovel24-page',word:'İNOVEL',number:'24.',color:'#031b2b',brand:'İNOVEL24',motto:'Her şey senin için.<br>Çünkü sen buna değersin.'},
  'inovel-etkinlik-2022':{className:'inovel22-page',word:'İNOVEL',number:'<span class="poster-event-year-mark">’</span>22',color:'#202020',brand:'İNOVEL’22',motto:'Her şey senin için.<br>Çünkü sen buna değersin.'},
  'inovel-etkinlik-2021':{className:'inovel21-page',word:'İNOVEL',number:'’21',color:'#151615',brand:'İNOVEL’21',motto:'Her şey senin için.<br>Çünkü sen buna değersin.'},
  'inovel-all-star':{className:'allstar-page',word:'İNOVEL',number:'ALL STAR',color:'#111315',brand:'İNOVEL ALL STAR',motto:'Her şey senin için.<br>Çünkü sen buna değersin.'},
  'gbs-etkinlik-6':{className:'gbs6-page',word:'GBS',number:'’6',color:'#04182f',brand:'GBS’6',motto:'GBS’nin altıncı buluşması.'}
};
function posterEventContent(record,category,theme,prefix){
  const posterLink=`${prefix}${record.image}`;
  return `<section class="poster-event-hero poster-event-wrap" aria-labelledby="poster-event-title">
  <nav class="events-breadcrumb" aria-label="Sayfa yolu">
    <a href="${prefix}etkinlikler/arsiv/index.html">Etkinlik arşivi</a><span aria-hidden="true">/</span>
    <a href="${prefix}${category.file}">${esc(record.label)}</a><span aria-hidden="true">/</span>
    <span aria-current="page">${esc(record.title)}</span>
  </nav>
  <div class="poster-event-layout">
    <div class="poster-event-copy">
      <p class="poster-event-kicker">${record.eventDate?esc(record.eventDate).toLocaleUpperCase('tr-TR'):'ETKİNLİK ARŞİVİ / '+esc(record.year)}</p>
      <h1 id="poster-event-title" class="poster-event-title" aria-label="${esc(record.title)}"><span class="poster-event-word">${theme.word}</span><span class="poster-event-number">${theme.number}</span></h1>
      <p class="poster-event-motto">${theme.motto}</p>
      <dl class="poster-event-facts">
        <div><dt>${record.eventDate?'Tarih':'ARŞİV KAYDI'}</dt><dd>${esc(record.eventDate||record.archiveDate)}</dd></div>
        <div><dt>Saat</dt><dd>${esc(record.eventTime||'Saat bilgisi paylaşılmadı')}</dd></div>
        <div><dt>Yer</dt><dd>${esc(record.venue||'Yer bilgisi paylaşılmadı')}</dd></div>
      </dl>
      <p class="poster-event-status">Bu etkinlik sona erdi.</p>
      <div class="poster-event-links">${record.speakerPoster?'\n        <a class="poster-event-link" href="#konusmacilar">Konuşmacılar <span aria-hidden="true">↓</span></a>':''}
        ${record.source?`<a class="poster-event-link" href="${esc(record.source)}" target="_blank" rel="noopener noreferrer">Özgün arşiv sayfası ${arrow}</a>`:''}
        <a class="poster-event-link" href="${prefix}${category.file}"><span aria-hidden="true">←</span> Diğer ${esc(record.label)} etkinlikleri</a>
      </div>
    </div>
    <figure class="poster-event-art">
      <a class="event-detail-poster" href="${posterLink}" aria-label="${esc(record.title)} afişini tam boy aç">
        <img src="${posterLink}" alt="${imageAlt(record)}" width="${record.imageWidth}" height="${record.imageHeight}" fetchpriority="high">
      </a>
      <figcaption><a href="${posterLink}">Afişi görüntüle ${arrow}</a></figcaption>
    </figure>
  </div>
</section>`;
}
function posterEventFooter(category,theme,prefix){
  return `<footer class="poster-event-footer poster-event-wrap">
  <a class="poster-event-footer-brand" href="${prefix}${category.file}">${theme.brand}</a>
  <p>İnovasyon ve Liderlik Topluluğu<br>Kütahya Dumlupınar Üniversitesi</p>
  <a href="https://www.instagram.com/inoveldpu/" target="_blank" rel="noopener noreferrer">@inoveldpu ${arrow}</a>
</footer>`;
}
const listingPages=selectedSlugs?(process.argv.includes('--include-listings')?pages.filter(page=>page.category==='all'||records.some(record=>selectedSlugs.has(record.slug)&&record.category===page.category)):[]):pages;
for(const page of listingPages){
 const filtered=records.filter(record=>page.category==='all'||record.category===page.category);
 const years=[...new Set(filtered.map(record=>record.year))];
 const feature=filtered[0];
 save(page.file,layout(page.file,page.title,prefix=>`<section class="events-hero zine-wrap"><nav class="events-breadcrumb" aria-label="Sayfa yolu"><a href="${prefix}index.html">Ana sayfa</a><span aria-hidden="true">/</span><span aria-current="page">${esc(page.title)}</span></nav><div class="events-hero-grid"><div><p class="zine-section-tag">BİRLİKTE YAŞADIKLARIMIZ / ETKİNLİK ARŞİVİ</p><h1>${page.headline}</h1><p class="events-lead">${esc(page.description)}</p><a class="zine-inline-link" href="#etkinlik-arsivi">ARŞİVİ KEŞFET <span aria-hidden="true">↓</span></a></div><a class="events-feature" href="${prefix}etkinlikler/${feature.slug}/index.html"><img src="${prefix}${feature.image}" width="${feature.imageWidth||760}" height="${feature.imageHeight||938}" alt="${imageAlt(feature)}" fetchpriority="high"><div><span>${feature.detailsPending?'DETAYLAR YAKINDA':'ARŞİVDEN / '+esc(feature.year)}</span><strong>${esc(feature.title)}</strong>${arrow}</div></a></div></section>${eventArchive(page,filtered,years,prefix)}${page.category==='all'?platformNotice(prefix):''}${cta(prefix)}`));
}
for(const record of records.filter(record=>!selectedSlugs||selectedSlugs.has(record.slug))){
 const file=`etkinlikler/${record.slug}/index.html`;
 const category=pages.find(page=>page.category===record.category);
 if(record.slug==='inovel26'){
   save(file,layout(file,record.title,prefix=>inovel26Content(record,prefix),{
     themeClass:'inovel26-page',
     archiveScript:false,
     themeColor:'#101723',
     description:'İnovel’26 · 9–10 Mayıs 2026, saat 10.00 · İİBF Konferans Salonu. Her şey senin için çünkü sen buna değersin.',
     footer:inovel26Footer
   }));
   continue;
 }
 if(record.category==='kasis'){
   save(file,layout(file,detailTitle(record),prefix=>kasisContent(record,prefix)+speakerSection(record,prefix),{
     themeClass:'kasis-page kasis-detail-page'+(record.edition==='1'?' kasis-2023-page':record.edition==='2'?' kasis-2024-page':''),
     archiveScript:false,
     themeColor:record.edition==='1'?'#16080b':record.edition==='2'?'#11120c':'#101713',
     description:record.eventDate?[detailTitle(record),record.eventDate+(record.eventTime?`, saat ${record.eventTime}`:''),record.venue].filter(Boolean).join(' · ')+'. Kariyer adımların seni ileriye sürüklesin.':`${detailTitle(record)} · Kariyer adımların seni ileriye sürüklesin. Etkinlik afişi ve arşiv bilgileri.`,
     footer:kasisFooter
   }));
   continue;
 }
 const theme=posterThemes[record.slug];
 if(theme){
   save(file,layout(file,record.title,prefix=>posterEventContent(record,category,theme,prefix)+speakerSection(record,prefix),{
     themeClass:`poster-event-page ${theme.className}`,
     archiveScript:false,
     themeColor:theme.color,
     description:record.eventDate?[record.title,record.eventDate+(record.eventTime?`, saat ${record.eventTime}`:''),record.venue].filter(Boolean).join(' · ')+'.':`${record.title} etkinlik görseli ve arşiv bilgileri.`,
     footer:prefix=>posterEventFooter(category,theme,prefix)
   }));
   continue;
 }
 save(file,layout(file,record.title,prefix=>`<section class="event-detail zine-wrap"><nav class="events-breadcrumb" aria-label="Sayfa yolu"><a href="${prefix}etkinlikler/index.html">Etkinlikler</a><span aria-hidden="true">/</span><a href="${prefix}${category.file}">${esc(record.label)}</a><span aria-hidden="true">/</span><span aria-current="page">${esc(record.title)}</span></nav><div class="event-detail-grid"><a class="event-detail-poster" href="${prefix}${record.image}" aria-label="${esc(record.title)} ${record.detailsPending?'geçici görselini':'afişini'} tam boy aç"><img src="${prefix}${record.image}" alt="${imageAlt(record)}" width="${record.imageWidth||760}" height="${record.imageHeight||938}" fetchpriority="high"><span>${record.detailsPending?'GEÇİCİ GÖRSELİ AÇ':'AFİŞİ TAM BOY AÇ'} ${arrow}</span></a><div class="event-detail-copy"><p class="zine-section-tag">${record.detailsPending?'ETKİNLİK BİLGİLERİ':'GEÇMİŞ ETKİNLİK'} / ${esc(record.label)}</p><h1>${esc(record.title)}</h1>${eventFacts(record)}<p>${record.description?esc(record.description):esc(record.title)+' buluşmasının arşiv kaydı. Etkinlik afişini bu sayfada inceleyebilirsin.'}</p>${record.source?`<a class="zine-inline-link" href="${esc(record.source)}" target="_blank" rel="noopener noreferrer">ÖZGÜN ARŞİV SAYFASI ${arrow}</a>`:''}<a class="zine-button zine-button-outline" href="${prefix}${category.file}">KATEGORİYE DÖN <span aria-hidden="true">←</span></a></div></div></section>${cta(prefix)}`));
}
function walk(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(entry=>entry.isDirectory()?walk(path.join(dir,entry.name)):[path.join(dir,entry.name)]);}
if(!selectedSlugs)for(const file of walk(root).filter(file=>file.endsWith('.html'))){let html=fs.readFileSync(file,'utf8');const updated=html.replace(/(<div>)(<a href="([^"]*)portfolios\/inovel-etkinlik\/index.html">)/, '$1<a href="$3etkinlikler/index.html">Tüm etkinlikler</a>$2');if(!html.includes('>Tüm etkinlikler</a>')&&updated!==html)fs.writeFileSync(file,updated);}
console.log(selectedSlugs?selectedSlugs.size+' selected event detail pages and '+listingPages.length+' related listings generated; all other pages preserved.':'Four listing pages and '+records.length+' event detail pages generated; shared navigation updated.');
