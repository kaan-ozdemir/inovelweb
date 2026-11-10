(function(){
 'use strict';
 function init(){
  var form=document.querySelector('.join-form');if(!form)return;
  var name=form.querySelector('#join-name'),email=form.querySelector('#join-email');
  var department=form.querySelector('#join-department'),subject=form.querySelector('#join-subject');
  var message=form.querySelector('#join-message'),draft=form.querySelector('.join-draft'),status=form.querySelector('.join-form-status');
  form.querySelector('[type="submit"]').disabled=false;
  function invalidate(){draft.hidden=true;status.textContent='';name.setCustomValidity('');}
  form.addEventListener('input',invalidate);
  form.addEventListener('change',invalidate);
  document.querySelectorAll('[data-department]').forEach(function(link){link.addEventListener('click',function(){
   department.value=link.dataset.department;subject.value='katilim';invalidate();
   document.querySelectorAll('[data-department]').forEach(function(other){other.classList.toggle('is-selected',other===link);});
  });});
  department.addEventListener('change',function(){document.querySelectorAll('[data-department]').forEach(function(link){link.classList.toggle('is-selected',link.dataset.department===department.value);});});
  var preferred=new URLSearchParams(window.location.search).get('departman');
  if(preferred&&Array.from(department.options).some(function(option){return option.value===preferred;})){
   department.value=preferred;department.dispatchEvent(new Event('change'));
  }
  form.addEventListener('submit',function(event){
   event.preventDefault();
   name.value=name.value.trim();email.value=email.value.trim();
   name.setCustomValidity(name.value?'':'Lütfen adını ve soyadını yaz.');
   if(!form.reportValidity()){draft.hidden=true;return;}
   var topic=subject.options[subject.selectedIndex].text;
   var interest=department.options[department.selectedIndex].text;
   var body=['Ad soyad: '+name.value,'E-posta: '+email.value,'Konu: '+topic,'İlgilendiğim departman: '+interest,'',message.value.trim()].join('\n');
   form.querySelector('.join-draft-link').href='mailto:iletisim@inoveldpu.com?subject='+encodeURIComponent('İnovel — '+topic)+'&body='+encodeURIComponent(body);
   draft.hidden=false;status.textContent='E-posta taslağın hazır. Mesajı göndermek için e-posta uygulamanda aç.';
  });
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
