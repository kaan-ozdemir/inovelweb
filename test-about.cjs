const fs = require('node:fs');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');
(async function () {
  const html = fs.readFileSync('static-site/sayfalar/about/index.html','utf8');
  const dom = new JSDOM(html, {runScripts:'outside-only',url:'http://127.0.0.1:5500/static-site/sayfalar/about/index.html'});
  const d = dom.window.document;
  const visible = () => [...d.querySelectorAll('[data-person]')].filter(person=>!person.hidden && !person.closest('[data-team-group]').hidden);
  const allCards = [...d.querySelectorAll('[data-person]')];
  assert.deepEqual([...d.querySelectorAll('[data-team-filter]')].slice(0,4).map(button=>button.dataset.teamFilter),['all','0','leaders','1'],'Leaders follows the board and precedes the departments');
  assert.equal(d.querySelector('[data-team-filter="leaders"]').textContent.trim(),'Liderler');
  assert.equal(d.querySelectorAll('[data-person]').length,71);
  assert.equal(d.querySelector('.about-team-tools').hidden,true,'Controls are hidden without JavaScript');
  assert.equal(visible().length,71,'All entries are readable without JavaScript');
  const old = new JSDOM(fs.readFileSync('backups/about-before-redesign.html','utf8'));
  let groupIndex=-1;
  const departmentNames=[];
  for(const el of old.window.document.querySelectorAll('h2,.team-member')){
    if(el.tagName==='H2'){groupIndex++;}
    else if(groupIndex>3){const name=el.querySelector('h4')?.textContent.trim();if(name)departmentNames.push(name);}
  }
  for(const [index,file,count] of [[4,'marketing',15],[5,'academy',2]]){
    const members=JSON.parse(fs.readFileSync('static-site/assets/team/'+file+'.json','utf8'));
    const cards=[...d.querySelectorAll('[data-team-group="'+index+'"] [data-person]')];
    assert.equal(cards.length,count);
    assert.deepEqual(cards.map(card=>({name:card.querySelector('h4').textContent,role:card.querySelector('.about-person-info>p').textContent})),members.map(({name,role})=>({name,role})));
    cards.forEach((card,i)=>{
      if(members[i].image){assert.equal(card.querySelector('img').getAttribute('src'),'../../'+(members[i].preview||members[i].image));assert.ok(fs.existsSync('static-site/'+members[i].image));}
      else {assert.equal(card.querySelector('img'),null);assert.ok(card.querySelector('.about-person-placeholder'));}
    });
  }
  assert.equal(d.querySelector('#group-3').textContent,'Sponsorluk ve Finans Departmanı');
  const sponsorship=JSON.parse(fs.readFileSync('static-site/assets/team/sponsorship.json','utf8'));
  const sponsorCards=[...d.querySelectorAll('[data-team-group="3"] [data-person]')];
  assert.equal(sponsorCards.length,13);
  assert.deepEqual(sponsorCards.map(card=>({name:card.querySelector('h4').textContent,role:card.querySelector('.about-person-info>p').textContent})),sponsorship.map(({name,role})=>({name,role})));
  sponsorCards.forEach((card,index)=>{
    if(sponsorship[index].image){assert.equal(card.querySelector('img').getAttribute('src'),'../../'+(sponsorship[index].preview||sponsorship[index].image));assert.ok(fs.existsSync('static-site/'+sponsorship[index].image));}
    else {assert.equal(card.querySelector('img'),null);assert.ok(card.querySelector('.about-person-placeholder'));}
  });
  const project=JSON.parse(fs.readFileSync('static-site/assets/team/project.json','utf8'));
  const projectCards=[...d.querySelectorAll('[data-team-group="2"] [data-person]')];
  assert.equal(projectCards.length,22);
  assert.deepEqual(projectCards.map(card=>({name:card.querySelector('h4').textContent,role:card.querySelector('.about-person-info>p').textContent})),project.map(({name,role})=>({name,role})));
  projectCards.forEach((card,index)=>{
    if(project[index].image){assert.equal(card.querySelector('img').getAttribute('src'),'../../'+(project[index].preview||project[index].image));assert.ok(fs.existsSync('static-site/'+project[index].image));}
    else {assert.equal(card.querySelector('img'),null);assert.ok(card.querySelector('.about-person-placeholder'));}
  });
  const media=JSON.parse(fs.readFileSync('static-site/assets/team/media.json','utf8'));
  const mediaCards=[...d.querySelectorAll('[data-team-group="1"] [data-person]')];
  assert.deepEqual(mediaCards.map(card=>({name:card.querySelector('h4').textContent,role:card.querySelector('.about-person-info>p').textContent})),media.map(({name,role})=>({name,role})));
  mediaCards.forEach((card,index)=>{
    if(media[index].image){assert.equal(card.querySelector('img').getAttribute('src'),'../../'+(media[index].preview||media[index].image));assert.ok(fs.existsSync('static-site/'+media[index].image));}
    else {assert.equal(card.querySelector('img'),null);assert.ok(card.querySelector('.about-person-placeholder'));}
  });
  const board=JSON.parse(fs.readFileSync('static-site/assets/team/board.json','utf8'));
  const cards=[...d.querySelectorAll('.about-board [data-person]')];
  assert.equal(cards.length,8);
  assert.deepEqual(cards.map(card=>({name:card.querySelector('h4').textContent,role:card.querySelector('.about-person-info>p').textContent})),board.map(person=>({name:person.name,role:person.role})),'Current board names, order and roles match the supplied list');
  assert.equal(cards[0].querySelector('h4').textContent,'İbrahim Çağrı DİLBER');
  assert.equal(cards[0].querySelector('.about-person-info>p').textContent,'Yönetim Kurulu Başkanı');
  cards.forEach((card,index)=>assert.equal(card.querySelector('img').getAttribute('src'),'../../'+(board[index].preview||board[index].image)));
  old.window.close();
  dom.window.eval(fs.readFileSync('static-site/assets/about.js','utf8'));
  await new Promise(resolve=>setTimeout(resolve,10));
  assert.equal(d.querySelector('.about-team-tools').hidden,false);
  const teamRoot=d.querySelector('.about-team');
  assert.equal(teamRoot.dataset.teamView,'all','Initial team view reflects the active filter');
  d.querySelector('[data-team-filter="0"]').click();
  assert.equal(teamRoot.dataset.teamView,'0');
  assert.equal(visible().length,8,'Board filter');
  d.querySelector('[data-team-filter="all"]').click();
  const search = d.querySelector('#team-search');
  function query(text) { search.value=text; search.dispatchEvent(new dom.window.Event('input')); }
  const coordinators = allCards.filter(card=>card.querySelector('.about-person-info>p').textContent==='Departman Koordinatörü');
  assert.equal(coordinators.length,10,'Five departments have two coordinators each');
  d.querySelector('[data-team-filter="leaders"]').click();
  assert.equal(teamRoot.dataset.teamView,'leaders');
  assert.equal(d.querySelector('[data-team-filter="leaders"]').getAttribute('aria-pressed'),'true');
  assert.deepEqual(visible(),coordinators,'Leaders shows the original coordinator cards without assistants or duplicated cards');
  const leaderGroups=[...d.querySelectorAll('[data-team-group]')].filter(group=>!group.hidden);
  assert.deepEqual(leaderGroups.map(group=>group.dataset.teamGroup),['1','2','3','4','5'],'Leaders retain their department groupings');
  for(const group of leaderGroups) assert.equal([...group.querySelectorAll('[data-person]')].filter(card=>!card.hidden).length,2);
  assert.match(d.querySelector('.about-team-status').textContent,/10/);
  query('rana');
  assert.equal(visible().length,1,'Name search combines with the leaders filter');
  assert.equal(visible()[0].querySelector('h4').textContent,'Rana UTKUTAN');
  query('dilara');
  assert.equal(visible().length,0,'An assistant does not enter the leaders results through search');
  assert.equal(d.querySelector('.about-empty').hidden,false);
  d.querySelector('.about-reset').click();
  assert.equal(search.value,'','Empty-state reset clears the search');
  assert.equal(teamRoot.dataset.teamView,'leaders','Reset keeps the current leaders view');
  assert.equal(d.querySelector('[data-team-filter="leaders"]').getAttribute('aria-pressed'),'true','Reset keeps the leaders filter selected');
  assert.deepEqual(visible(),coordinators,'Reset restores all ten original leaders');
  assert.deepEqual([...d.querySelectorAll('[data-team-group]')].filter(group=>!group.hidden).map(group=>group.dataset.teamGroup),['1','2','3','4','5'],'Reset restores the five department groupings');
  assert.equal(d.querySelector('.about-empty').hidden,true);
  assert.equal(d.activeElement,search,'Empty-state reset returns focus to the search field');
  d.querySelector('[data-team-filter="1"]').click();
  assert.equal(teamRoot.dataset.teamView,'1');
  assert.deepEqual(visible(),mediaCards,'Returning to a department restores its full roster, including both coordinators');
  d.querySelector('[data-team-filter="all"]').click();
  assert.equal(teamRoot.dataset.teamView,'all');
  assert.deepEqual(visible(),allCards,'All team entries are restored in their original order');
  assert.equal(d.querySelectorAll('[data-person]').length,71,'Leaders filtering neither copies nor removes team cards');
  query('gokhan');
  assert.equal(visible().length,1,'Turkish accented board name is searchable');
  assert.match(visible()[0].textContent,/KAYA/);
  query('rabiya');
  d.querySelector('[data-team-filter="0"]').click();
  assert.equal(visible().length,0,'Department and search filters combine');
  assert.equal(d.querySelector('.about-empty').hidden,false);
  query('');
  assert.equal(visible().length,8);
  d.querySelector('[data-team-filter="all"]').click();
  query('koordinator');
  assert.ok(visible().length>3,'Role search normalizes Turkish characters');
  query('');
  assert.equal(visible().length,71,'Reset restores the whole team');
  assert.equal(d.querySelector('.about-empty').hidden,true);
  for(const a of d.querySelectorAll('.about-person-info a')) {
    const label=a.textContent;
    if(a.href.includes('instagram.com'))assert.match(label,/Instagram/);
    if(a.href.includes('github.com'))assert.match(label,/GitHub/);
  }
  dom.window.close();
  console.log('About: 8 board members, 10 leaders retained in 5 departments, 71 entries without duplicates, filters and Turkish search passed.');
})().catch(error=>{console.error(error);process.exitCode=1;});




