(function(){
 'use strict';
 function init(){
  var root=document.querySelector('[data-content-root]');if(!root)return;
  var input=root.querySelector('#content-search'),year=root.querySelector('#content-year');
  var filters=Array.from(root.querySelectorAll('[data-content-filter]'));
  var cards=Array.from(root.querySelectorAll('[data-content]'));
  var active='all';
  function normalize(text){return text.toLocaleLowerCase('tr-TR').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ı/g,'i');}
  function update(){
   var query=normalize(input.value.trim()),count=0;
   cards.forEach(function(card){var match=(active==='all'||card.dataset.kind===active)&&(year.value==='all'||card.dataset.year===year.value)&&normalize(card.dataset.search).includes(query);card.hidden=!match;if(match)count++;});
   root.querySelector('.content-status').textContent=count+' içerik gösteriliyor';root.querySelector('.content-empty').hidden=count!==0;
  }
  filters.forEach(function(button){button.addEventListener('click',function(){active=button.dataset.contentFilter;filters.forEach(function(other){other.setAttribute('aria-pressed',String(other===button));});update();});});
  input.addEventListener('input',update);year.addEventListener('change',update);
  root.querySelector('.content-reset').addEventListener('click',function(){active='all';input.value='';year.value='all';filters.forEach(function(button){button.setAttribute('aria-pressed',String(button.dataset.contentFilter==='all'));});update();input.focus();});
  root.querySelector('.content-controls').hidden=false;update();
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
