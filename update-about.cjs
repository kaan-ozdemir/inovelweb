const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');
const target = 'static-site/sayfalar/about/index.html';
const backup = 'backups/about-before-redesign.html';
if (!fs.existsSync(backup)) fs.copyFileSync(target, backup);
const source = fs.readFileSync(backup, 'utf8');
const doc = new JSDOM(source).window.document;
const groups = [];
let current;
for (const el of doc.querySelectorAll('h2,.team-member')) {
  if (el.tagName === 'H2') {
    current = { title: el.textContent.trim(), people: [] };
    groups.push(current);
  } else if (current) {
    const name = el.querySelector('h4')?.textContent.trim();
    const role = el.querySelector('.team-subtitle')?.textContent.trim();
    const image = el.querySelector('img');
    if (!name || current.people.some(person => person.name === name && person.role === role)) continue;
    current.people.push({name, role, src: image?.getAttribute('src'), srcset: image?.getAttribute('srcset'), links: [...el.querySelectorAll('.team-socials a')].map(a => a.href)});
  }
}
const teams = groups.filter(group => group.people.length);
const originalPeopleCount=teams.reduce((sum,group)=>sum+group.people.length,0);
const boardFile='static-site/assets/team/board.json';
if(fs.existsSync(boardFile)){
  const board=JSON.parse(fs.readFileSync(boardFile,'utf8'));
  const key=name=>name.toLocaleLowerCase('tr-TR').trim();
  const previous=teams.flatMap(group=>group.people);
  teams[0].people=board.map(person=>({
    name:person.name,role:person.role,src:'../../'+(person.preview||person.image),
    links:previous.find(old=>key(old.name)===key(person.name))?.links||[]
  }));
}
const esc = value => String(value || '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const header = source.match(/<header class="modern-header">[\s\S]*?<\/header>/)[0];
const footer = source.match(/<footer class="modern-footer">[\s\S]*?<\/footer>/)[0];
const mediaFile='static-site/assets/team/media.json';
if(fs.existsSync(mediaFile)){
 const previous=teams[1].people;
 teams[1].people=JSON.parse(fs.readFileSync(mediaFile,'utf8')).map(person=>({
  name:person.name,role:person.role,src:person.image?'../../'+(person.preview||person.image):null,
  links:previous.find(old=>old.name.toLocaleLowerCase('tr-TR')===person.name.toLocaleLowerCase('tr-TR'))?.links||[]
 }));
}
const projectFile='static-site/assets/team/project.json';
if(fs.existsSync(projectFile)){
 const previous=teams[2].people;
 teams[2].people=JSON.parse(fs.readFileSync(projectFile,'utf8')).map(person=>({
  name:person.name,role:person.role,src:person.image?'../../'+(person.preview||person.image):null,
  links:previous.find(old=>old.name.toLocaleLowerCase('tr-TR')===person.name.toLocaleLowerCase('tr-TR'))?.links||[]
 }));
}
const sponsorshipFile='static-site/assets/team/sponsorship.json';
if(fs.existsSync(sponsorshipFile)){
 const previous=teams[3].people;
 teams[3].people=JSON.parse(fs.readFileSync(sponsorshipFile,'utf8')).map(person=>({
  name:person.name,role:person.role,src:person.image?'../../'+(person.preview||person.image):null,
  links:previous.find(old=>old.name.toLocaleLowerCase('tr-TR')===person.name.toLocaleLowerCase('tr-TR'))?.links||[]
 }));
}
teams[3].title='Sponsorluk ve Finans Departmanı';
teams[5].title='Akademi Departmanı';
for(const [index,file] of [[4,'marketing'],[5,'academy']]){
 const filename='static-site/assets/team/'+file+'.json';
 if(!fs.existsSync(filename))continue;
 const previous=teams[index].people;
 teams[index].people=JSON.parse(fs.readFileSync(filename,'utf8')).map(person=>({
  name:person.name,role:person.role,src:person.image?'../../'+(person.preview||person.image):null,
  links:previous.find(old=>old.name.toLocaleLowerCase('tr-TR')===person.name.toLocaleLowerCase('tr-TR'))?.links||[]
 }));
}
function card(person) {
  const socials = person.links.filter(url => /^https?:\/\//.test(url)).map(url => {
    const host = new URL(url).hostname;
    const label = host.includes('linkedin.com') ? 'LinkedIn' : host.includes('instagram.com') ? 'Instagram' : host === 'github.com' ? 'GitHub' : 'Profil';
    return `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer" aria-label="${esc(person.name)} ${label} profili">${label} <span aria-hidden="true">↗</span></a>`;
  }).join('');
  const image = !person.src || person.src.includes('empty800')
    ? `<div class="about-person-placeholder" aria-hidden="true"><span>${esc(person.name.split(/\s+/).slice(0,2).map(word=>word[0]).join(''))}</span><small>İNOVEL</small></div>`
    : `<img src="${esc(person.src)}" ${person.srcset ? `srcset="${esc(person.srcset)}" sizes="(max-width: 500px) 45vw, (max-width: 950px) 30vw, 280px"` : ''} width="800" height="800" alt="${esc(person.name)}" loading="lazy" decoding="async">`;
  const coordinator = person.role === 'Departman Koordinatörü' ? ' data-team-role="coordinator"' : '';
  return `<article class="about-person" data-person${coordinator}><div class="about-person-photo">${image}</div><div class="about-person-info"><h4>${esc(person.name)}</h4><p>${esc(person.role)}</p>${socials}</div></article>`;
}
const count = teams.reduce((sum,group)=>sum+group.people.length,0);
const uniqueCount=new Set(teams.flatMap(group=>group.people.map(person=>person.name.toLocaleLowerCase('tr-TR').trim()))).size;
const teamFilters = `<div class="about-filter-primary"><button type="button" data-team-filter="all" aria-pressed="true">Tümü</button><button type="button" data-team-filter="0" aria-pressed="false">${esc(teams[0].title)}</button><button type="button" data-team-filter="leaders" aria-pressed="false">Liderler</button></div><div class="about-filter-departments"><span class="about-filter-label">DEPARTMANLAR</span>${teams.slice(1).map((group,index)=>`<button type="button" data-team-filter="${index+1}" aria-pressed="false" aria-label="${esc(group.title)}">${esc(group.title.replace(/ Departmanı$/, ''))}</button>`).join('')}</div>`;
const aboutOpening = `<div class="about-opening zine-wrap">
<nav class="about-breadcrumb" aria-label="Sayfa yolu"><a href="../../index.html">Ana sayfa</a><span aria-hidden="true">/</span><span aria-current="page">Hakkımızda</span></nav>
<section class="about-hero" aria-labelledby="about-title"><p class="zine-section-tag">İNOVEL HAKKINDA</p><h1 id="about-title">BİZ<br><span>İNOVEL’İZ.</span></h1><p class="about-lead">DPÜ’de iş ve kariyer etkinlikleri düzenleyen bir öğrenci topluluğuyuz. Öğrencilerle sektör temsilcilerini bir araya getiriyoruz.</p><div class="about-hero-actions"><a class="zine-button" href="#ekibimiz">EKİPLE TANIŞ <span aria-hidden="true">↘</span></a><a class="zine-inline-link" href="../departmanlarimiz/index.html">DEPARTMANLARIMIZ <span aria-hidden="true">↗</span></a></div><div class="about-year"><span>2012</span><small>KURULUŞ YILIMIZ.</small></div></section>
<figure class="about-community"><img src="../../assets/about-community.jpg" width="1705" height="1136" alt="Konferans salonunda bir araya gelen İnovel topluluk üyeleri" fetchpriority="high" decoding="async"><figcaption><span>İNOVEL EKİBİ BİR ARADA.</span><a href="../../galeri/index.html">GALERİYE GİT <span aria-hidden="true">↗</span></a></figcaption></figure>
</div>`;
const html = `<!DOCTYPE html>
<html lang="tr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="theme-color" content="#101010"><title>Hakkımızda — İnovel</title><meta name="description" content="DPÜ İnovasyon ve Liderlik Topluluğu'nun hikâyesi, misyonu, vizyonu ve ekibiyle tanışın."><link rel="icon" href="../../wp-content/uploads/2023/11/cropped-4619ae774d4b5a017f280d5f2b16d18f_272x272_fit-32x32.png"><link rel="stylesheet" href="../../assets/modern-site.css"><link rel="stylesheet" href="../../assets/editorial-theme.css"><link rel="stylesheet" href="../../assets/editorial-layout.css"><link rel="stylesheet" href="../../assets/about.css"><script src="../../assets/modern-site.js" defer></script><script src="../../assets/about.js" defer></script></head>
<body class="modern-home direction-editorial about-page">${header}
<main id="main-content">
${aboutOpening}
<section class="about-purpose zine-wrap" id="first-section" aria-label="Misyon ve vizyon"><article><p class="zine-section-tag">01 / MİSYONUMUZ</p><h2>DERSLERİN<br><span>ÖTESİNDE.</span></h2><p>Kulübümüz, düzenlediğimiz iş ve kariyer etkinliklerimiz haricinde teknik ve kültürel geziler, sosyal sorumluluk projeleri ve dönem içi kaynaşma etkinlikleriyle öğrencilerin üniversite hayatını renklendirmektedir.</p><p>Günümüzde iş hayatında sadece teknik bilginin yetersiz kaldığının bilincinde olan kulübümüz, geleceğine yön vermek ve kendini geliştirmek isteyen öğrenciler ile yoluna devam etmektedir.</p></article><article><p class="zine-section-tag">02 / VİZYONUMUZ</p><h2>BUGÜNDEN<br><span>GELECEĞE.</span></h2><p>İnovasyon ve Liderlik Topluluğu 2012 yılında kurulmuştur. Kurulduğu günden bu yana düzenlenen etkinlikler, üniversitemiz ve diğer tüm üniversite öğrencilerinin gelecek hayallerine yardımcı olmayı hedef alarak planlandı.</p><p>Düzenlenen etkinlikler sayesinde üniversitemizin en büyük kariyer topluluklarından birisi olmuştur.</p></article></section>
<section class="about-team zine-wrap" id="ekibimiz" aria-labelledby="team-title"><div class="about-team-heading"><div><p class="zine-section-tag">03 / İNOVEL'İN ARKASINDAKİ EKİP</p><h2 id="team-title">TOPLULUK<br><span>EKİBİ.</span></h2></div><p>Yönetim kurulumuzu, departman koordinatörlerimizi ve ekiplerimizi burada bulabilirsin.</p></div><div class="about-team-tools" hidden><div class="about-filters" role="group" aria-label="Ekibi filtrele">${teamFilters}</div><label class="about-search"><span>EKİPTE ARA</span><input type="search" id="team-search" placeholder="İsim veya görev yaz…" autocomplete="off"></label></div><p class="about-team-status" role="status" aria-live="polite">${uniqueCount} ekip üyesi</p>${teams.map((group,index)=>`<section class="about-team-group ${index===0?'about-board':''}" data-team-group="${index}" aria-labelledby="group-${index}"><div class="about-group-heading"><h3 id="group-${index}">${esc(group.title)}</h3><span>${String(group.people.length).padStart(2,'0')} KİŞİ</span></div><div class="about-people">${group.people.map(card).join('')}</div></section>`).join('')}<p class="about-empty" hidden>Bu aramayla eşleşen bir ekip üyesi bulunamadı. <button type="button" class="about-reset">Aramayı temizle <span aria-hidden="true">↗</span></button></p></section>
<section class="about-invite"><div class="zine-wrap"><div><p class="zine-section-tag">TOPLULUĞA KATILIM</p><h2>BİZE<br><span>YAZ.</span></h2></div><div><p>Üyelik ve departman görevleri hakkında bilgi almak için bize yazabilirsin.</p><a class="zine-button" href="../../iletisim/index.html">BİZE YAZ <span aria-hidden="true">↗</span></a><a class="zine-inline-link" href="../departmanlarimiz/index.html">DEPARTMANLARIMIZ <span aria-hidden="true">↗</span></a></div></div></section>
</main>${footer}</body></html>`;
fs.writeFileSync(target, require('./navigation-shared.cjs').finalizePage(html), 'utf8');
console.log(JSON.stringify({groups:teams.length,people:count,boardMembers:teams[0].people.length,duplicateRemoved:doc.querySelectorAll('.team-member').length-originalPeopleCount}));
