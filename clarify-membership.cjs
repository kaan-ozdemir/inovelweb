const fs=require('node:fs');
const file='update-join.cjs';
let text=fs.readFileSync(file,'utf8');
const marker='<p class="join-lead">';
const start=text.indexOf(marker),end=text.indexOf('</p>',start)+4;
if(!text.includes('join-membership-summary'))text=text.slice(0,end)+`<aside class="join-membership-summary" aria-labelledby="membership-summary-title"><h2 id="membership-summary-title">Nasıl üye olurum?</h2><dl><div><dt>NASIL?</dt><dd>İnovel standına uğra, ekiple tanış ve üyelik işlemlerini standımızda tamamla.</dd></div><div><dt>NEREDE?</dt><dd>Kampüsteki oryantasyon alanında, İnovel standında. Kesin stand konumu duyurulacak.</dd></div><div><dt>NE ZAMAN?</dt><dd>Dönem başındaki oryantasyonda. Gün ve saat bilgisi henüz paylaşılmadı.</dd></div></dl><a class="zine-inline-link" href="#katilim-formu">ÜYELİK HAKKINDA BİZE YAZ <span aria-hidden="true">↓</span></a><p>Aşağıdaki iletişim alanından üyelik hakkında bilgi isteyebilirsin.</p></aside>`+text.slice(end);
fs.writeFileSync(file,text,'utf8');
