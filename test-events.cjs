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
 assert.equal(cards.length,11);
 assert.equal(d.querySelector('.events-tools').hidden,true);
 assert.ok(cards.every(card=>!card.hidden),'Archive is usable without JavaScript');
 for(const record of catalog){
   const archiveCard=cards.find(card=>card.querySelector('a').getAttribute('href').includes('/'+record.slug+'/'));
   assert.equal(archiveCard.querySelector('h3').textContent,record.title);
   if(['inovel-all-star','inovel-etkinlik-2022','inovel-etkinlik-2021'].includes(record.slug))assert.ok(archiveCard.textContent.includes(record.eventDate),'Archive cards use both confirmed event days');
   assert.ok(fs.existsSync(path.join('static-site',record.image)));
   const detailPath=`static-site/etkinlikler/${record.slug}/index.html`;
   const detail=new JSDOM(fs.readFileSync(detailPath,'utf8'));
   const heading=detail.window.document.querySelector('h1');
   const expectedTitle=record.category==='kasis'?'KASİS '+record.edition:record.title;
   assert.equal(heading.getAttribute('aria-label')||heading.textContent,expectedTitle);
   assert.doesNotMatch(detail.window.document.querySelector('meta[name="description"]').content,/\b(?:undefined|null)\b/,'Page descriptions omit unavailable event information');
   const speakerCounts={kasis:5,'kasis-2':6,'kasis-2025':6,inovel26:10,inovel25:9,inovel24:10,'inovel-etkinlik-2021':9,'inovel-etkinlik-2022':12,'inovel-all-star':9};
   if(Object.hasOwn(speakerCounts,record.slug)){
     const eventDocument=detail.window.document;
     const section=eventDocument.querySelector('#konusmacilar');
     assert.ok(section,'Supplied speaker posters have a dedicated section');
     assert.equal(section.querySelector('h2').textContent,'Konuşmacılar');
     assert.equal(eventDocument.querySelectorAll('#konusmacilar').length,1);
     assert.ok(eventDocument.querySelector('main a[href="#konusmacilar"]'),'Speakers are reachable from the event summary');
     assert.ok(eventDocument.querySelector('link[href$="assets/event-speakers.css"]'));
     const speakerPoster=section.querySelector('figure img');
     const posterPath=path.resolve(path.dirname(detailPath),speakerPoster.getAttribute('src'));
     assert.ok(fs.existsSync(posterPath),'Speaker poster resolves locally');
     assert.equal(speakerPoster.closest('a').getAttribute('href'),speakerPoster.getAttribute('src'),'Full-size speaker poster opens from the preview');
     assert.equal(speakerPoster.getAttribute('loading'),'lazy');
     assert.equal(speakerPoster.getAttribute('width'),String(record.speakerPoster.width),'Speaker poster width matches its metadata');
     assert.equal(speakerPoster.getAttribute('height'),String(record.speakerPoster.height),'Speaker poster height matches its metadata');
     if(['kasis-2025','inovel26'].includes(record.slug)){
       const posterBytes=fs.readFileSync(posterPath);
       assert.deepEqual(posterBytes.subarray(0,8),Buffer.from([137,80,78,71,13,10,26,10]),'New speaker posters are local PNG images');
       assert.equal(posterBytes.readUInt32BE(16),record.speakerPoster.width,'Actual PNG width matches the speaker poster metadata');
       assert.equal(posterBytes.readUInt32BE(20),record.speakerPoster.height,'Actual PNG height matches the speaker poster metadata');
     }
     const speakers=[...section.querySelectorAll('.event-speaker:not(.event-speaker-guest):not(.event-speaker-workshop)')];
     assert.equal(speakers.length,speakerCounts[record.slug]);
     assert.deepEqual(speakers.map(speaker=>speaker.querySelector('h3').textContent),record.speakers.map(speaker=>speaker.name),'Names remain readable without JavaScript');
     speakers.forEach((speaker,index)=>{
       const company=speaker.querySelector('.event-speaker-company');
       if(record.speakers[index].company){
         assert.equal(company.textContent,record.speakers[index].company,'Speaker companies remain readable without JavaScript');
       }else{
         assert.equal(company,null,'A company is only displayed when supplied');
       }
       const role=speaker.querySelector('.event-speaker-role');
       if(record.speakers[index].role){
         assert.equal(role.textContent,record.speakers[index].role);
       }else{
         assert.equal(role,null,'A role is only displayed when it appears in the supplied speaker data');
       }
     });
     if(record.slug==='inovel-etkinlik-2021'){
       assert.equal(section.querySelectorAll('.event-speaker-workshop').length,0,'Removed workshop entries stay out of the event page');
       assert.equal(record.workshops,undefined);
     }
     if(record.slug==='inovel25'){
       assert.equal(section.querySelectorAll('.event-speaker-guest').length,0,'The removed guest company stays out of the event page');
       assert.equal(record.guestCompanies,undefined);
     }
   }else{
     assert.ok(!detail.window.document.querySelector('.event-speakers'),'Other event details are preserved');
   }
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
     assert.equal(heading.querySelector('.kasis-edition').textContent,record.edition,'Main heading uses the event edition, not the year');
     assert.equal(eventDocument.title,expectedTitle+' — İnovel');
     assert.equal(eventDocument.querySelector('.kasis-poster img').getAttribute('src'),'../../'+record.image);
     assert.match(eventDocument.querySelector('.kasis-status').textContent,/sona erdi/);
     assert.ok(eventDocument.querySelector('.kasis-link[href="../../portfolios/kasis-etkinlikler/index.html"]'));
     if(record.slug==='kasis'){
       assert.ok(eventDocument.body.classList.contains('kasis-2023-page'));
       assert.ok(eventDocument.querySelector('.kasis-link[href="'+record.source+'"]'));
     }
     if(record.edition==='2'){
       assert.ok(eventDocument.body.classList.contains('kasis-2024-page'));
       assert.equal(record.eventDate,'20 Aralık 2024');
       assert.equal(record.eventTime,'10.00');
       assert.equal(record.venue,'İİBF Amfi-II');
       assert.equal(eventDocument.querySelector('.kasis-poster img').getAttribute('width'),'1440');
       assert.equal(eventDocument.querySelector('.kasis-poster img').getAttribute('height'),'1440');
     }
     assert.ok(!eventDocument.querySelector('.events-cta'));
   }
   if(['gbs-etkinlik-6','inovel25','inovel24','inovel-all-star','inovel-etkinlik-2022','inovel-etkinlik-2021'].includes(record.slug)){
     const eventDocument=detail.window.document;
     const themeClasses={'gbs-etkinlik-6':'gbs6-page',inovel25:'inovel25-page',inovel24:'inovel24-page','inovel-all-star':'allstar-page','inovel-etkinlik-2022':'inovel22-page','inovel-etkinlik-2021':'inovel21-page'};
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
     }else if(record.slug==='inovel-all-star'){
       assert.equal(record.eventDate,'8–9 Mayıs 2023','Both event days are shown on the poster');
       assert.equal(record.eventTime,'10.30','The supplied speaker poster confirms the start time');
       assert.equal(record.venue,'Hezar Dinari Kültür Merkezi');
       assert.ok(eventDocument.querySelector('dl').textContent.includes('10.30'));
       assert.equal(heading.querySelector('.poster-event-number').textContent,'ALL STAR');
       assert.equal(eventDocument.querySelector('meta[name="theme-color"]').content,'#111315');
     }else if(['inovel-etkinlik-2022','inovel-etkinlik-2021'].includes(record.slug)){
       const is2022=record.slug==='inovel-etkinlik-2022';
       const expectedArchiveDate=is2022?'21 Mayıs 2022':'20 Mart 2021';
       const expectedEventDate=is2022?'21–22 Mayıs 2022':'20–21 Mart 2021';
       const expectedEventTime=is2022?'10.30':'12.00';
       const expectedVenue=is2022?'Hezar Dinari Kültür Merkezi':'YouTube canlı yayını';
       assert.equal(heading.getAttribute('aria-label'),record.title,'The original archive title remains accessible');
       assert.equal(heading.querySelector('.poster-event-number').textContent.replace(/\s+/g,''),is2022?'’22':'’21');
       assert.equal(record.archiveDate,expectedArchiveDate,'The original publication date is retained');
       assert.equal(record.eventDate,expectedEventDate,'Both days are taken from the supplied poster');
       assert.equal(record.eventTime,expectedEventTime);
       assert.equal(record.venue,expectedVenue);
       const facts=eventDocument.querySelector('dl');
       assert.equal(facts.querySelector('dt').textContent,'Tarih','Confirmed event days replace the publication-date label');
       assert.equal(facts.querySelector('dd').textContent,expectedEventDate);
       assert.ok(facts.textContent.includes(expectedEventTime));
       assert.ok(facts.textContent.includes(expectedVenue));
       assert.doesNotMatch(facts.textContent,/bilgisi paylaşılmadı/);
       assert.equal(eventDocument.querySelector('.poster-event-motto').textContent.replace(/\s+/g,''),'Herşeyseniniçin.Çünküsenbunadeğersin.','The existing club motto is retained');
       if(is2022){
         assert.equal(record.imageWidth,600);
         assert.equal(record.imageHeight,400);
         const originalPoster=fs.readFileSync(path.join('static-site',record.image));
         assert.equal(originalPoster.readUInt32BE(16),600,'Landscape poster width matches the local image');
         assert.equal(originalPoster.readUInt32BE(20),400,'Landscape poster height matches the local image');
       }else{
         assert.equal(record.image,'assets/events/inovel21-poster.jpg','The full supplied announcement is the main poster');
         assert.equal(record.imageWidth,1440);
         assert.equal(record.imageHeight,1440);
       }
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
 for(const [name,category,count]of [['inovel-etkinlik','inovel',6],['gbs-etkinlik','gbs',2],['kasis-etkinlikler','kasis',3]]){
   const categoryDom=new JSDOM(fs.readFileSync(`static-site/portfolios/${name}/index.html`,'utf8'),{runScripts:'outside-only'});
   const titles=[...categoryDom.window.document.querySelectorAll('[data-event] h3')].map(el=>el.textContent);
   assert.equal(titles.length,count);
   assert.deepEqual(titles.sort(),catalog.filter(record=>record.category===category).map(record=>record.title).sort());
   if(category==='inovel'){
     const allStarCard=categoryDom.window.document.querySelector('[href$="/inovel-all-star/index.html"]').closest('[data-event]');
     assert.match(allStarCard.textContent,/8–9 Mayıs 2023/);
     assert.equal(allStarCard.querySelector('img').getAttribute('width'),'1080');
     assert.equal(allStarCard.querySelector('img').getAttribute('height'),'1080');
   }
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
     assert.equal(categoryCards.find(card=>!card.hidden).querySelector('h3').textContent,'KASİS 3');
     const search=categoryDocument.querySelector('#event-search');
     search.value='bulunmayan';search.dispatchEvent(new categoryDom.window.Event('input'));
     assert.equal(categoryDocument.querySelector('.events-empty').hidden,false);
     categoryDocument.querySelector('.events-reset').click();
     assert.equal(categoryCards.filter(card=>!card.hidden).length,3);
     yearSelect.value='2024';yearSelect.dispatchEvent(new categoryDom.window.Event('change'));
     assert.equal(categoryCards.filter(card=>!card.hidden).length,1);
     assert.equal(categoryCards.find(card=>!card.hidden).querySelector('h3').textContent,'KASİS 2');
     search.value='kasis 2';search.dispatchEvent(new categoryDom.window.Event('input'));
     assert.equal(categoryCards.filter(card=>!card.hidden).length,1,'KASIS 2 name and year filters combine');
     categoryDocument.querySelector('.events-reset').click();
     search.value='kasis 1';search.dispatchEvent(new categoryDom.window.Event('input'));
     assert.equal(categoryCards.filter(card=>!card.hidden).length,1);
     assert.equal(categoryCards.find(card=>!card.hidden).dataset.year,'2023');
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
 query('kasis');assert.equal(visible().length,3);
 year.value='2025';year.dispatchEvent(new dom.window.Event('change'));assert.equal(visible().length,1,'Year and name filters combine');
 year.value='2022';year.dispatchEvent(new dom.window.Event('change'));assert.equal(visible().length,0);
 assert.equal(d.querySelector('.events-empty').hidden,false);
 d.querySelector('.events-reset').click();assert.equal(visible().length,11);assert.equal(year.value,'all');assert.equal(d.activeElement,input);
 assert.equal(d.querySelectorAll('.modern-event-group').length,1,'Event menu is not duplicated');
 dom.window.close();
 console.log('Events: 11 records/details, 9 speaker posters and 76 named speakers, local PNG dimensions, readable speaker companies/roles, confirmed 2021/2022/All Star event facts, KASIS 1/2/3 facts, 6 poster themes, 3 general categories, no-JS content, search and year filters passed.');
})().catch(error=>{console.error(error);process.exitCode=1;});
