(function () {
  'use strict';

  function init() {
    var page = document.querySelector('.magazine-page');
    if (!page) return;

    var archive = page.querySelector('[data-content-root]');
    if (archive) {
      var search = archive.querySelector('#content-search');
      var year = archive.querySelector('#content-year');
      var available = archive.querySelector('#magazine-available');
      var sort = archive.querySelector('#magazine-sort');
      var cards = Array.from(archive.querySelectorAll('[data-content]'));
      var grid = archive.querySelector('#content-grid');
      var status = archive.querySelector('.content-status');
      var empty = archive.querySelector('.content-empty');
      var reset = archive.querySelector('[data-magazine-reset]');

      function normalize(text) {
        return text.toLocaleLowerCase('tr-TR').normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '').replace(/ı/g, 'i').replace(/\s+/g, ' ');
      }

      function update() {
        var query = normalize(search.value.trim());
        var count = 0;
        cards.forEach(function (card) {
          var matches = normalize(card.dataset.search).includes(query)
            && (year.value === 'all' || card.dataset.year === year.value)
            && (!available.checked || card.dataset.available === 'true');
          card.hidden = !matches;
          if (matches) count++;
        });

        var direction = sort.value === 'oldest' ? 1 : -1;
        cards.slice().sort(function (a, b) {
          return direction * (Number(a.dataset.order) - Number(b.dataset.order));
        }).forEach(function (card) {
          grid.appendChild(card);
        });

        status.textContent = count + ' / ' + cards.length + ' sayı gösteriliyor';
        empty.hidden = count !== 0;
        reset.hidden = !query && year.value === 'all' && !available.checked && sort.value === 'newest';
      }

      search.addEventListener('input', update);
      year.addEventListener('change', update);
      available.addEventListener('change', update);
      sort.addEventListener('change', update);
      archive.querySelectorAll('button.content-reset').forEach(function (button) {
        button.addEventListener('click', function () {
          search.value = '';
          year.value = 'all';
          available.checked = false;
          sort.value = 'newest';
          update();
          search.focus();
        });
      });
      archive.querySelector('.content-controls').hidden = false;
      update();
    }

    var reader = page.querySelector('[data-magazine-reader]');
    if (reader) {
      var load = reader.querySelector('[data-reader-load]');
      var frame = reader.querySelector('[data-reader-frame]');
      var template = reader.querySelector('[data-reader-template]');
      var readerStatus = reader.querySelector('[data-reader-status]');
      var readerLoaded = false;

      function openReader(moveFocus) {
        if (readerLoaded) return;
        readerLoaded = true;
        var content = template.content.cloneNode(true);
        var object = content.querySelector('object');
        object.setAttribute('tabindex', '0');
        object.addEventListener('error', function () {
          readerStatus.textContent = 'PDF görüntülenemedi. Ayrı sekmede açma veya indirme bağlantısını kullanabilirsin.';
        });
        frame.appendChild(content);
        frame.hidden = false;
        load.setAttribute('aria-expanded', 'true');
        load.hidden = true;
        readerStatus.textContent = 'Okuyucu açıldı. Görüntülenmezse PDF’yi ayrı sekmede açabilirsin.';
        if (moveFocus) object.focus();
      }

      function openLinkedReader() {
        if (window.location.hash === '#dergi-okuyucu') openReader(false);
      }

      load.hidden = false;
      load.addEventListener('click', function () { openReader(true); });
      window.addEventListener('hashchange', openLinkedReader);
      openLinkedReader();
    }

    page.querySelectorAll('[data-magazine-picker]').forEach(function (picker) {
      picker.closest('.magazine-picker').hidden = false;
      picker.addEventListener('change', function () {
        var destination = picker.value.trim();
        if (!destination || /[\u0000-\u001f\u007f]/.test(destination) || /^(?:[a-z][a-z0-9+.-]*:|[/\\]{2})/i.test(destination)) return;
        window.location.href = destination;
      });
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
