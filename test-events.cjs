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
   assert.equal(detail.window.document.querySelector('h1').textContent,record.title);
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
   const categoryDom=new JSDOM(fs.readFileSync(`static-site/portfolios/${name}/index.html`,'utf8'));
   const titles=[...categoryDom.window.document.querySelectorAll('[data-event] h3')].map(el=>el.textContent);
   assert.equal(titles.length,count);
   assert.deepEqual(titles.sort(),catalog.filter(record=>record.category===category).map(record=>record.title).sort());
   assert.ok(!categoryDom.window.document.querySelector('[data-vc-grid-settings]'),'No WordPress AJAX dependency');
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
 console.log('Events: 10 records/details, Inovel26 official 1080x1350 poster/date/time/venue, 3 categories, no-JS archive, search and year filters passed.');
})().catch(error=>{console.error(error);process.exitCode=1;});
