const fs=require('node:fs');
const assert=require('node:assert/strict');
const {JSDOM}=require('jsdom');
const html=()=>fs.readFileSync('static-site/iletisim/index.html','utf8');
async function setup(query=''){
 const dom=new JSDOM(html(),{runScripts:'outside-only',url:'http://127.0.0.1:5500/static-site/iletisim/index.html'+query});
 dom.window.eval(fs.readFileSync('static-site/assets/join.js','utf8'));
 await new Promise(resolve=>setTimeout(resolve,10));
 return dom;
}
(async()=>{
 const native=new JSDOM(html());
 assert.ok(native.window.document.querySelector('.join-form button[type="submit"]').disabled,'Without JS, use the direct email alternative');
 assert.equal(native.window.document.querySelectorAll('[data-department]').length,5);
 assert.match(native.window.document.querySelector('.join-membership-note').textContent,/oryantasyonda/);
 assert.ok(native.window.document.querySelector('a[href="mailto:iletisim@inoveldpu.com"]'));
 native.window.close();
 const dom=await setup(),d=dom.window.document,form=d.querySelector('.join-form');
 const draft=form.querySelector('.join-draft'),department=form.querySelector('#join-department');
 function submit(){const event=new dom.window.Event('submit',{bubbles:true,cancelable:true});form.dispatchEvent(event);assert.equal(event.defaultPrevented,true,'No backend submission occurs');}
 function set(id,value){const field=d.getElementById(id);field.value=value;field.dispatchEvent(new dom.window.Event('input',{bubbles:true}));}
 assert.equal(form.querySelector('[type="submit"]').disabled,false);
 submit();assert.equal(draft.hidden,true,'Empty form is rejected');
 set('join-name','   ');set('join-email','person@example.com');submit();assert.equal(draft.hidden,true,'Whitespace-only name is rejected');
 set('join-name','Deneme Kullanıcı');set('join-email','bad-email');submit();assert.equal(draft.hidden,true,'Invalid email is rejected');
 set('join-email','person@example.com');
 d.querySelector('[data-department="medya-tasarim"]').click();assert.equal(department.value,'medya-tasarim');
 assert.equal(d.querySelector('#join-subject').value,'katilim');
 set('join-message','Merhaba! Tasarım & iletişim ilgimi çekiyor.');submit();
 assert.equal(draft.hidden,false);
 const uri=new URL(form.querySelector('.join-draft-link').href);
 assert.equal(uri.protocol,'mailto:');assert.equal(uri.pathname,'iletisim@inoveldpu.com');
 assert.match(uri.searchParams.get('subject'),/Topluluğa katılım/);
 assert.ok(uri.searchParams.get('body').includes('Deneme Kullanıcı'));
 assert.ok(uri.searchParams.get('body').includes('person@example.com'));
 assert.ok(uri.searchParams.get('body').includes('Medya ve Tasarım'));
 assert.ok(uri.searchParams.get('body').includes('Tasarım & iletişim'));
 set('join-message','Güncel mesaj');assert.equal(draft.hidden,true,'Editing invalidates the old draft');
 set('join-name','<img src=x onerror=alert(1)>');submit();
 assert.equal(form.querySelector('.join-draft img'),null,'Input is encoded, never rendered as HTML');
 assert.ok(decodeURIComponent(form.querySelector('.join-draft-link').href).includes('<img'));
 dom.window.close();
 const preferred=await setup('?departman=akademi');assert.equal(preferred.window.document.querySelector('#join-department').value,'akademi');preferred.window.close();
 const invalid=await setup('?departman=unknown');assert.equal(invalid.window.document.querySelector('#join-department').value,'kararsiz');invalid.window.close();
 console.log('Join/contact: 5 department choices, membership guidance, required fields, email validation, encoded drafts, stale-draft invalidation and safe preselection passed. No messages sent.');
})().catch(error=>{console.error(error);process.exitCode=1;});
