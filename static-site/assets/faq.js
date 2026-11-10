(function () {
  'use strict';
  function init() {
    var root = document.querySelector('[data-faq-root]');
    if (!root) return;
    var input = root.querySelector('#faq-search');
    var expand = root.querySelector('.faq-expand');
    var items = Array.from(root.querySelectorAll('[data-faq-item]'));
    var groups = Array.from(root.querySelectorAll('.faq-group'));
    var status = root.querySelector('.faq-status');
    var empty = root.querySelector('.faq-empty');
    var beforeSearch = null;
    function normalize(text) { return text.toLocaleLowerCase('tr-TR').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ı/g,'i'); }
    function updateButton() {
      var visible = items.filter(function (item) { return !item.hidden; });
      var allOpen = visible.length > 0 && visible.every(function (item) { return item.open; });
      expand.replaceChildren(document.createTextNode(allOpen ? 'Tümünü kapat ' : 'Tümünü aç '));
      var icon = document.createElement('span');
      icon.setAttribute('aria-hidden','true');
      icon.textContent = allOpen ? '−' : '+';
      expand.append(icon);
      expand.setAttribute('aria-expanded',String(allOpen));
      expand.disabled = visible.length === 0;
    }
    function filter() {
      var query = normalize(input.value.trim());
      if (query && !beforeSearch) beforeSearch = items.map(function (item) { return item.open; });
      var count = 0;
      items.forEach(function (item,index) {
        var match = normalize(item.textContent).includes(query);
        item.hidden = !match;
        if (match) count++;
        if (query && match) item.open = true;
        else if (!query && beforeSearch) item.open = beforeSearch[index];
      });
      if (!query) beforeSearch = null;
      groups.forEach(function (group) {
        var visible = Array.from(group.querySelectorAll('[data-faq-item]')).some(function (item) { return !item.hidden; });
        group.hidden = !visible;
      });
      status.textContent = query ? count + ' soru bulundu' : '11 soru · 3 konu';
      empty.hidden = count !== 0;
      updateButton();
    }
    input.addEventListener('input',filter);
    expand.addEventListener('click',function () {
      var open = expand.getAttribute('aria-expanded') !== 'true';
      items.forEach(function (item) { if (!item.hidden) item.open = open; });
      updateButton();
    });
    items.forEach(function (item) { item.addEventListener('toggle',updateButton); });
    root.querySelector('.faq-reset').addEventListener('click',function () { input.value='';filter();input.focus(); });
    root.querySelectorAll('.faq-sidebar nav a').forEach(function (link) {
      link.addEventListener('click',function () { if (input.value) { input.value='';filter(); } });
    });
    root.querySelector('.faq-tools').hidden = false;
    updateButton();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',init);
  else init();
})();
