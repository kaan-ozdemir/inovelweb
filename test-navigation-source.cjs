const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const {JSDOM}=require('jsdom');
const {finalizePage}=require('./navigation-shared.cjs');
function walk(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(entry=>entry.isDirectory()?walk(path.join(dir,entry.name)):[path.join(dir,entry.name)]);}
let checked=0;
for(const file of walk('static-site').filter(file=>file.endsWith('.html'))){
 const html=fs.readFileSync(file,'utf8');if(!html.includes('class="modern-header"'))continue;
 const output=finalizePage(html);
 assert.equal(finalizePage(output),output,'Normalization is idempotent');
 const dom=new JSDOM(output),d=dom.window.document,header=d.querySelector('.modern-header');
 assert.equal(header.querySelectorAll('.modern-blog-link').length,0);
 assert.equal(header.querySelectorAll('.modern-event-toggle').length,1);
 assert.deepEqual([...header.querySelectorAll('.modern-event-submenu>a')].map(a=>a.firstChild.textContent.trim()),['İNOVEL','GBS','KASİS','Etkinlik ekranı'],'Event submenu uses the uppercase İNOVEL label');
 assert.ok([...header.querySelectorAll('.modern-dropdown a')].some(a=>a.textContent==='Blog'));
 assert.ok([...header.querySelectorAll('.modern-dropdown a')].some(a=>a.textContent==='Tüm içerikler'));
 const styles=d.querySelectorAll('link[href$="assets/navigation-repairs.css"]');
 assert.equal(styles.length,1);
 assert.ok(fs.existsSync(path.resolve(path.dirname(file),styles[0].getAttribute('href'))));
 checked++;dom.window.close();
}
const old=fs.readFileSync('backups/about-before-redesign.html','utf8');
const rebuilt=new JSDOM(finalizePage(old));
assert.equal(rebuilt.window.document.querySelectorAll('.modern-event-toggle').length,1,'Legacy generator input receives the current menu');
assert.equal(rebuilt.window.document.querySelector('.modern-event-submenu>a').textContent,'İNOVEL','Legacy menus also receive the uppercase label');
rebuilt.window.close();
assert.equal(finalizePage('<html><body>Plain page</body></html>'),'<html><body>Plain page</body></html>');
console.log(checked+' shared headers: current menu ordering, Blog placement, relative styles, legacy regeneration and idempotence passed.');
