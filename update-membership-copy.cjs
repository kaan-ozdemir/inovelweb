const fs=require('fs');
const pairs=[
 ['ETKİNLİK<br><span>FOTOĞRAFLARI.</span>','BAZI ANLAR<br>ANLATILMAZ.<br><span>YAŞANIR.</span>'],
 ['İnovel standına uğra, ekiple tanış ve üyelik işlemlerini standımızda tamamla.','Oryantasyon haftasında standımıza uğra. Tanışma toplantısına ve tanışma kahvaltısına gel, ardından mülakatlarımıza katıl.'],
 ['Kampüsteki oryantasyon alanında, İnovel standında. Kesin stand konumu duyurulacak.','İlk buluşma oryantasyon haftasında İnovel standında. Toplantı, kahvaltı ve mülakat yerleri Instagram hesabımızda duyurulur.'],
 ['Dönem başındaki oryantasyonda. Gün ve saat bilgisi henüz paylaşılmadı.','Sürecin tarih ve saatlerini Instagram hesabımızdan takip edebilirsin.'],
 ['<a class="zine-inline-link" href="#katilim-formu">ÜYELİK HAKKINDA BİZE YAZ <span aria-hidden="true">↓</span></a><p>Aşağıdaki iletişim alanından üyelik hakkında bilgi isteyebilirsin.</p>','<a class="zine-inline-link" href="https://www.instagram.com/inoveldpu/" target="_blank" rel="noopener noreferrer">DUYURULAR İÇİN @İNOVELDPU <span aria-hidden="true">↗</span></a><p>Soruların için aşağıdaki iletişim alanından bize yazabilirsin.</p>'],
 ['<h2>Ekibi tanı.</h2><p>Departmanlara göz at, ilgini çeken alanı keşfet. Önceden deneyim sahibi olman gerekmiyor.</p>','<h2>Standımıza uğra.</h2><p>Oryantasyon haftasında standımıza gel, ekiple tanış ve katılım süreci hakkında bilgi al.</p>'],
 ['<h2>Standımıza uğra.</h2><p>Her dönem başındaki oryantasyonda İnovel standından üyelik işlemlerini yapabilirsin.</p>','<h2>Tanışma buluşmalarına gel.</h2><p>Tanışma toplantısına ve tanışma kahvaltısına katıl. Topluluğu ve departmanları yakından tanı.</p>'],
 ['<h2>Birlikte üret.</h2><p>İlgilendiğin departmanın çalışmalarına ve topluluk etkinliklerine katıl.</p>','<h2>Mülakatlara katıl.</h2><p>Mülakat duyurularını Instagram’dan takip et. Paylaşılan tarihlerde mülakatlarımıza katıl.</p>'],
 ['Üyelik nasıl tamamlanır?','Katılım süreci nasıl ilerler?'],
 ['Üyelik işlemleri dönem başındaki oryantasyonda topluluk standında yapılır. Bu alan, ekibe e-posta taslağı hazırlamanı sağlar.','Süreç oryantasyonda standımızda tanışmayla başlar; tanışma toplantısı, tanışma kahvaltısı ve mülakatlarla devam eder. Duyurular Instagram’da paylaşılır. Bu formdan soruların için e-posta taslağı hazırlayabilirsin.'],
 ['Her dönem başında gerçekleşen oryantasyon alanından kulübümüzün standından üye olabilirsiniz.','Oryantasyon haftasında İnovel standına uğrayarak ekiple tanışabilirsin. Ardından tanışma toplantısına, tanışma kahvaltısına ve mülakatlarımıza katılabilirsin. Sürecin tarih, saat ve yer bilgileri Instagram hesabımız @inoveldpu üzerinden duyurulur.']
];
for(const file of ['update-join.cjs','update-gallery.cjs','static-site/iletisim/index.html','static-site/galeri/index.html','static-site/sayfalar/sss/index.html']){
 let text=fs.readFileSync(file,'utf8');for(const [from,to]of pairs)text=text.split(from).join(to);fs.writeFileSync(file,text);
}
// The FAQ generator imports legacy answers; keep the current process explicit.
const file='update-faq.cjs';let source=fs.readFileSync(file,'utf8');
source=source.replace("if (questions.length !== 11) throw new Error('Expected eleven existing FAQs');", "if (questions.length !== 11) throw new Error('Expected eleven existing FAQs');\nquestions[5].answer = "+JSON.stringify(pairs[pairs.length-1][1])+";");fs.writeFileSync(file,source);
