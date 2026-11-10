(function () {
  'use strict';
  function init() {
    var root=document.querySelector('[data-events-root]');
    if(!root)return;
    var input=root.querySelector('#event-search');
    var year=root.querySelector('#event-year');
    var cards=Array.from(root.querySelectorAll('[data-event]'));
    function normalize(text){return text.toLocaleLowerCase('tr-TR').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ı/g,'i');}
    function update(){
      var query=normalize(input.value.trim());
      var count=0;
      cards.forEach(function(card){var match=(year.value==='all'||card.dataset.year===year.value)&&normalize(card.dataset.search).includes(query);card.hidden=!match;if(match)count++;});
      root.querySelector('.events-status').textContent=count+' etkinlik gösteriliyor';
      root.querySelector('.events-empty').hidden=count!==0;
    }
    input.addEventListener('input',update);
    year.addEventListener('change',update);
    root.querySelector('.events-reset').addEventListener('click',function(){input.value='';year.value='all';update();input.focus();});
    root.querySelector('.events-tools').hidden=false;
    update();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
