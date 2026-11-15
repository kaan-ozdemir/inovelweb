const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const {JSDOM}=require('jsdom');
const catalog=JSON.parse(fs.readFileSync('static-site/assets/events/catalog.json','utf8'));
(async()=>{
 const html=fs.readFileSync('static-site/etkinlikler/arsiv/index.html','utf8');
 const dom=new JSDOM(html,{runScripts:'outside-only',url:'http://127.0.0.1:5500/static-site/etkinlikler/arsiv/index.html'});
 const d=dom.window.document;
 const cards=[...d.querySelectorAll('[data-event]')];
 assert.equal(cards.length,10);
 assert.equal(d.querySelector('.events-tools').hidden,true);
 assert.ok(cards.every(card=>!card.hidden),'Archive is usable without JavaScript');
 for(const record of catalog){
   assert.ok(fs.existsSync(path.join('static-site',record.image)));
   const detailPath=`static-site/etkinlikler/${record.slug}/index.html`;
   const detail=new JSDOM(fs.readFileSync(detailPath,'utf8'));
   const heading=detail.window.document.querySelector('h1');
   const expectedTitle=record.category==='kasis'?({'kasis-2025':'KASİS 3',kasis:'KASİS 1'})[record.slug]:record.title;
   assert.equal(heading.getAttribute('aria-label')||heading.textContent,expectedTitle);
   if(record.slug==='inovel26'){
     const eventDocument=detail.window.document;
     assert.ok(eventDocument.body.classList.contains('inovel26-page'));
     assert.ok(eventDocument.querySelector('link[href$="assets/inovel26.css"]'));
     assert.ok(eventDocument.querySelector('.inovel26-poster img'));
     assert.ok(!eventDocument.querySelector('.events-cta'),'Dedicated event page uses its own footer');
     assert.match(eventDocument.querySelector('.inovel26-status').textContent,/sona erdi/);
   }
   if(record.category==='kasis'){
     const eventDocument=detail.window.document;
     assert.ok(eventDocument.body.classList.contains('kasis-detail-page'));
     assert.ok(eventDocument.querySelector('link[href$="assets/kasis.css"]'));
     assert.equal(heading.querySelector('.kasis-edition').textContent,record.slug==='kasis'?'1':'3','Main heading uses the event edition, not the year');
     assert.equal(eventDocument.title,expectedTitle+' — İnovel');
     assert.equal(eventDocument.querySelector('.kasis-poster img').getAttribute('src'),'../../'+record.image);
     assert.match(eventDocument.querySelector('.kasis-status').textContent,/sona erdi/);
     assert.ok(eventDocument.querySelector('.kasis-link[href="../../portfolios/kasis-etkinlikler/index.html"]'));
     if(record.slug==='kasis'){
       assert.ok(eventDocument.body.classList.contains('kasis-2023-page'));
       assert.ok(eventDocument.querySelector('.kasis-link[href="'+record.source+'"]'));
     }
     assert.ok(!eventDocument.querySelector('.events-cta'));
   }
   if(['gbs-etkinlik-6','inovel25','inovel24'].includes(record.slug)){
     const eventDocument=detail.window.document;
     const themeClasses={'gbs-etkinlik-6':'gbs6-page',inovel25:'inovel25-page',inovel24:'inovel24-page'};
     assert.ok(eventDocument.body.classList.contains(themeClasses[record.slug]));
     assert.equal(eventDocument.querySelector('link[rel="stylesheet"]:last-of-type').getAttribute('href'),'../../assets/poster-events.css','Event palette takes precedence over the shared styles');
     const poster=eventDocument.querySelector('.poster-event-art img');
     assert.equal(poster.getAttribute('src'),'../../'+record.image);
     assert.equal(poster.getAttribute('width'),String(record.imageWidth));
     assert.equal(poster.getAttribute('height'),String(record.imageHeight));
     assert.ok(eventDocument.querySelector('.poster-event-link[href="'+record.source+'"]'),'Original archive remains available');
     assert.match(eventDocument.querySelector('.poster-event-status').textContent,/sona erdi/);
     assert.ok(!eventDocument.querySelector('.events-cta'));
     if(record.slug==='gbs-etkinlik-6'){
       assert.match(eventDocument.querySelector('dl').textContent,/Saat bilgisi paylaşılmadı/);
       assert.match(eventDocument.querySelector('dl').textContent,/Yer bilgisi paylaşılmadı/);
     }else{
       assert.equal(record.eventDate,record.slug==='inovel25'?'10–11 Mayıs 2025':'4–5 Mayıs 2024','Full event dates come from the poster');
       assert.equal(record.eventTime,'10.00');
       assert.equal(record.venue,'Hezar Dinari Kültür Merkezi');
     }
   }
   if(record.detailsPending){
     assert.match(detail.window.document.querySelector('dl').textContent,/Henüz eklenmedi/);
     assert.match(detail.window.document.querySelector('dl').textContent,/Detaylar yakında/);
     assert.ok(!detail.window.document.querySelector('dl').textContent.includes('Geçmiş etkinlik'));
     assert.match(detail.window.document.querySelector('.event-detail-poster img').alt,/geçici/);
   }else{
     assert.ok(detail.window.document.querySelector('dl').textContent.includes(record.eventDate||record.archiveDate));
     if(!record.eventDate)assert.match(detail.window.document.querySelector('dt').textContent,/ARŞİV/,'Publication dates are not presented as confirmed event dates');
   }
   if(record.eventTime)assert.ok(detail.window.document.querySelector('dl').textContent.includes(record.eventTime));
   if(record.venue)assert.ok(detail.window.document.querySelector('dl').textContent.includes(record.venue));
   assert.ok(!detail.window.document.querySelector('[data-vc-grid-settings]'));
   detail.window.close();
 }
 for(const [name,category,count]of [['inovel-etkinlik','inovel',6],['gbs-etkinlik','gbs',2],['kasis-etkinlikler','kasis',2]]){
   const categoryDom=new JSDOM(fs.readFileSync(`static-site/portfolios/${name}/index.html`,'utf8'),{runScripts:'outside-only'});
   const titles=[...categoryDom.window.document.querySelectorAll('[data-event] h3')].map(el=>el.textContent);
   assert.equal(titles.length,count);
   assert.deepEqual(titles.sort(),catalog.filter(record=>record.category===category).map(record=>record.title).sort());
   assert.ok(!categoryDom.window.document.querySelector('[data-vc-grid-settings]'),'No WordPress AJAX dependency');
   assert.ok(!categoryDom.window.document.querySelector('link[href$="assets/kasis.css"],link[href$="assets/inovel26.css"],link[href$="assets/poster-events.css"]'),'Category listings retain the general site theme');
   if(category==='kasis'){
     const categoryDocument=categoryDom.window.document;
     assert.ok(!categoryDocument.body.classList.contains('kasis-page'));
     assert.ok(categoryDocument.querySelector('.events-hero'));
     assert.ok(categoryDocument.querySelector('script[src$="assets/events.js"]'),'The general archive loads its filters');
     assert.equal(categoryDocument.querySelector('.events-tools').hidden,true);
     categoryDom.window.eval(fs.readFileSync('static-site/assets/events.js','utf8'));
     await new Promise(resolve=>setTimeout(resolve,10));
     const categoryCards=[...categoryDocument.querySelectorAll('[data-event]')];
     assert.equal(categoryDocument.querySelector('.events-tools').hidden,false);
     const yearSelect=categoryDocument.querySelector('#event-year');
     yearSelect.value='2025';
     yearSelect.dispatchEvent(new categoryDom.window.Event('change'));
     assert.equal(categoryCards.filter(card=>!card.hidden).length,1);
     assert.equal(categoryCards.find(card=>!card.hidden).querySelector('h3').textContent,'KASİS 2025');
     const search=categoryDocument.querySelector('#event-search');
     search.value='bulunmayan';search.dispatchEvent(new categoryDom.window.Event('input'));
     assert.equal(categoryDocument.querySelector('.events-empty').hidden,false);
     categoryDocument.querySelector('.events-reset').click();
     assert.equal(categoryCards.filter(card=>!card.hidden).length,2);
   }
   categoryDom.window.close();
 }
 dom.window.eval(fs.readFileSync('static-site/assets/events.js','utf8'));
 await new Promise(resolve=>setTimeout(resolve,10));
 assert.equal(d.querySelector('.events-tools').hidden,false);
 const input=d.querySelector('#event-search'),year=d.querySelector('#event-year');
 const visible=()=>cards.filter(card=>!card.hidden);
 function query(value){input.value=value;input.dispatchEvent(new dom.window.Event('input'));}
 query('inovel');assert.equal(visible().length,6,'ASCII search matches Turkish event names');
 year.value='2026';year.dispatchEvent(new dom.window.Event('change'));assert.equal(visible().length,1);
 assert.match(visible()[0].querySelector('h3').textContent,/26/);
 assert.match(visible()[0].textContent,/9–10 Mayıs 2026/);
 assert.ok(!visible()[0].textContent.includes('Detaylar yakında'));
 const poster=fs.readFileSync('static-site/assets/events/inovel26.png');
 assert.equal(poster.readUInt32BE(16),1080);
 assert.equal(poster.readUInt32BE(20),1350);
 year.value='all';year.dispatchEvent(new dom.window.Event('change'));
 query('kasis');assert.equal(visible().length,2);
 year.value='2025';year.dispatchEvent(new dom.window.Event('change'));assert.equal(visible().length,1,'Year and name filters combine');
 year.value='2022';year.dispatchEvent(new dom.window.Event('change'));assert.equal(visible().length,0);
 assert.equal(d.querySelector('.events-empty').hidden,false);
 d.querySelector('.events-reset').click();assert.equal(visible().length,10);assert.equal(year.value,'all');assert.equal(d.activeElement,input);
 assert.equal(d.querySelectorAll('.modern-event-group').length,1,'Event menu is not duplicated');
 dom.window.close();
 console.log('Events: 10 records/details, KASIS 1/3 headings, 3 poster themes and facts, Inovel26 official poster, 3 general categories, no-JS archive, search and year filters passed.');
})().catch(error=>{console.error(error);process.exitCode=1;});
