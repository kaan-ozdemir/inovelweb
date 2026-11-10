const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const {JSDOM}=require('jsdom');
const catalog=JSON.parse(fs.readFileSync('static-site/assets/content/catalog.json','utf8'));
(async()=>{
 const dom=new JSDOM(fs.readFileSync('static-site/icerikler/index.html','utf8'),{runScripts:'outside-only',url:'http://127.0.0.1:5500/static-site/icerikler/index.html'});
 const d=dom.window.document,cards=[...d.querySelectorAll('[data-content]')];
 assert.equal(cards.length,9);
 assert.equal(d.querySelector('.content-controls').hidden,true);
 assert.ok(cards.every(card=>!card.hidden),'Content remains available without JavaScript');
 for(const [kind,file,count]of [['magazine','dergi',5],['podcast','podcasts',3],['blog','blogs',1]]){
  const category=new JSDOM(fs.readFileSync(`static-site/${file}/index.html`,'utf8'));
  assert.equal(category.window.document.querySelectorAll('[data-content]').length,count);
  assert.equal([...category.window.document.querySelectorAll('.modern-header a')].filter(a=>a.textContent==='Tüm içerikler').length,1);
  assert.ok([...category.window.document.querySelectorAll('[data-content]')].every(card=>card.dataset.kind===kind));
  category.window.close();
 }
 for(const record of catalog){
  assert.ok(fs.existsSync(path.join('static-site',record.image)));
  if(record.kind==='podcast'){
   const card=cards.find(card=>card.querySelector('h3').textContent===record.title&&card.dataset.kind==='podcast');
   assert.equal(card.querySelector('a').href,record.href,'Original Spotify destination retained');
   assert.match(card.querySelector('a').rel,/noopener/);
  }
  if(record.kind==='magazine'){
   const reader=new JSDOM(fs.readFileSync(path.join('static-site',record.file),'utf8'));
   const object=reader.window.document.querySelector('object');
   if(record.available){
    assert.ok(object);
    assert.ok(object.getAttribute('data').endsWith(record.pdf));
    const pdf=fs.readFileSync(path.join('static-site',record.pdf));
    assert.equal(pdf.toString('ascii',0,5),'%PDF-');
    assert.ok(reader.window.document.querySelector('a[download]'));
   }else{
    assert.equal(object,null,'Missing PDF must not be embedded');
    assert.match(reader.window.document.querySelector('.magazine-unavailable-note').textContent,/erişilemiyor/);
   }
   assert.equal(reader.window.document.querySelectorAll('h1').length,1);
   reader.window.close();
  }
 }
 const original=new JSDOM(fs.readFileSync('backups/content-kariyer_gelisimi_ve_inovasyon_gelecege_adim-index.html','utf8'));
 const article=new JSDOM(fs.readFileSync('static-site/kariyer_gelisimi_ve_inovasyon_gelecege_adim/index.html','utf8'));
 const text=[...original.window.document.querySelectorAll('.blog-content>p')].map(p=>p.textContent.trim()).filter(Boolean);
 const revised=[...article.window.document.querySelectorAll('.story-prose>p,.story-prose>h2')].map(p=>p.textContent.trim());
 assert.deepEqual(revised,text,'Blog text and section order are preserved');
 assert.equal(article.window.document.querySelectorAll('.story-prose>h2').length,5);
 original.window.close();article.window.close();
 dom.window.eval(fs.readFileSync('static-site/assets/content.js','utf8'));
 await new Promise(resolve=>setTimeout(resolve,10));
 const input=d.querySelector('#content-search'),year=d.querySelector('#content-year');
 const visible=()=>cards.filter(card=>!card.hidden);
 function query(value){input.value=value;input.dispatchEvent(new dom.window.Event('input'));}
 d.querySelector('[data-content-filter="magazine"]').click();assert.equal(visible().length,5);
 year.value='2024';year.dispatchEvent(new dom.window.Event('change'));assert.equal(visible().length,3);
 query('yaz');assert.equal(visible().length,1);
 d.querySelector('[data-content-filter="podcast"]').click();assert.equal(visible().length,1);
 year.value='all';year.dispatchEvent(new dom.window.Event('change'));query('yilbasi');assert.equal(visible().length,1,'Turkish titles can be found using ASCII');
 query('no-match-123');assert.equal(visible().length,0);assert.equal(d.querySelector('.content-empty').hidden,false);
 d.querySelector('.content-reset').click();assert.equal(visible().length,9);assert.equal(year.value,'all');assert.equal(d.activeElement,input);
 dom.window.close();
 console.log('Content: 5 magazines/4 local PDFs, 3 original Spotify links, preserved blog text, no-JS content, kind/year/search filters and empty/reset passed.');
})().catch(error=>{console.error(error);process.exitCode=1;});
