const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const {JSDOM}=require('jsdom');
const platform=new JSDOM(fs.readFileSync('static-site/etkinlikler/index.html','utf8'));
const destinations=[...platform.window.document.querySelectorAll('.platform-choice')].map(a=>a.getAttribute('href'));
assert.deepEqual(destinations,['register.html','tombola_view.html','vampire.html']);
assert.equal(platform.window.document.querySelector('.platform-archive>a').getAttribute('href'),'arsiv/index.html');
platform.window.close();
for(const file of ['register.html','tombola_view.html','vampire.html','view.html']){
 const dom=new JSDOM(fs.readFileSync('static-site/etkinlikler/'+file,'utf8'));
 const d=dom.window.document;
 assert.equal(d.querySelector('.platform-return').getAttribute('href'),'index.html');
 const module=d.querySelector('script[type="module"][src]');
 assert.ok(module,'Original module entry is present');
 const local=path.resolve('static-site/etkinlikler',module.getAttribute('src'));
 assert.ok(fs.existsSync(local));
 for(const image of d.querySelectorAll('img[src]')){
   if(!/^https?:/.test(image.getAttribute('src')))assert.ok(fs.existsSync(path.resolve('static-site/etkinlikler',image.getAttribute('src'))));
 }
 dom.window.close();
}
for(const file of ['register.js','tombola_view.js','vampire.js'])assert.deepEqual(fs.readFileSync('static-site/etkinlikler/js/'+file),fs.readFileSync('backups/original-event-'+file),'Original platform behavior is preserved');
for(const file of ['view.js','firebase-config.js'])assert.deepEqual(fs.readFileSync('static-site/etkinlikler/js/'+file),fs.readFileSync('backups/original-event-js-'+file));
assert.ok(fs.existsSync('static-site/etkinlikler/arsiv/index.html'));
console.log('Platform: 3 selection links, 4 original screens, image/module dependencies, unchanged service clients and separate archive passed. No cloud writes or registrations performed.');
