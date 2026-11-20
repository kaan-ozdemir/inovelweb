(function () {
  'use strict';

  function init() {
    var root = document.querySelector('[data-gallery-root]');
    if (!root) return;

    var items = Array.from(root.querySelectorAll('[data-gallery-item]'));
    var filters = Array.from(root.querySelectorAll('[data-gallery-filter]'));

    filters.forEach(function (button) {
      button.addEventListener('click', function () {
        var selection = button.dataset.galleryFilter;
        var shown = 0;
        items.forEach(function (item) {
          item.hidden = selection !== 'all' && item.dataset.category !== selection && item.dataset.album !== selection;
          if (!item.hidden) shown++;
        });
        filters.forEach(function (other) {
          other.setAttribute('aria-pressed', String(other === button));
        });
        root.querySelector('.gallery-status').textContent = shown + ' fotoğraf gösteriliyor';
      });
    });
    root.querySelector('.gallery-controls').hidden = false;

    var dialog = document.querySelector('.gallery-viewer');
    // The original image links remain usable without a native dialog or its markup.
    if (!dialog || typeof dialog.showModal !== 'function') return;

    var image = dialog.querySelector('.gallery-viewer-image');
    var figure = image.parentElement;
    var loading = dialog.querySelector('.gallery-loading');
    var count = dialog.querySelector('.gallery-viewer-count');
    var close = dialog.querySelector('.gallery-close');
    var original = dialog.querySelector('.gallery-original');
    var previous = dialog.querySelector('.gallery-previous');
    var next = dialog.querySelector('.gallery-next');
    var stage = dialog.querySelector('.gallery-viewer-stage');
    var trigger = null;
    var photos = [];
    var position = 0;
    var swipe = null;

    function visible() {
      return items.filter(function (item) {
        return !item.hidden;
      }).map(function (item) {
        return item.querySelector('[data-gallery-photo]');
      });
    }

    function show(index) {
      position = (index + photos.length) % photos.length;
      var photo = photos[position];
      var nextImage = document.createElement('img');
      nextImage.className = image.className;
      nextImage.alt = photo.dataset.alt;
      nextImage.hidden = true;
      figure.setAttribute('aria-busy', 'true');
      loading.hidden = false;
      loading.textContent = 'Fotoğraf yükleniyor…';

      // Each request owns its image so delayed events cannot update another photo.
      nextImage.addEventListener('load', function () {
        if (image !== nextImage || !dialog.open) return;
        nextImage.hidden = false;
        figure.setAttribute('aria-busy', 'false');
        loading.hidden = true;
      });
      nextImage.addEventListener('error', function () {
        if (image !== nextImage || !dialog.open) return;
        nextImage.hidden = true;
        figure.setAttribute('aria-busy', 'false');
        loading.hidden = false;
        loading.textContent = 'Fotoğraf yüklenemedi. “Tam boy aç” bağlantısını deneyebilirsin.';
      });

      var oldImage = image;
      oldImage.replaceWith(nextImage);
      image = nextImage;
      oldImage.removeAttribute('src');
      image.src = photo.href;
      original.href = photo.href;
      count.textContent = String(position + 1).padStart(2, '0') + ' / ' + String(photos.length).padStart(2, '0') + ' — ' + photo.dataset.title;
      previous.disabled = photos.length < 2;
      next.disabled = photos.length < 2;
    }

    items.forEach(function (item) {
      var link = item.querySelector('[data-gallery-photo]');
      link.setAttribute('aria-haspopup', 'dialog');
      link.addEventListener('click', function (event) {
        if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        trigger = link;
        photos = visible();
        show(photos.indexOf(link));
        dialog.showModal();
        document.documentElement.classList.add('gallery-viewer-open');
        close.focus();
      });
    });

    close.addEventListener('click', function () { dialog.close(); });
    previous.addEventListener('click', function () { show(position - 1); });
    next.addEventListener('click', function () { show(position + 1); });

    stage.addEventListener('touchstart', function (event) {
      swipe = null;
      if (!dialog.open || event.touches.length !== 1 || event.target.closest('button,a') || (window.visualViewport && window.visualViewport.scale > 1)) return;
      swipe = { x: event.touches[0].clientX, y: event.touches[0].clientY };
    }, { passive: true });
    stage.addEventListener('touchmove', function (event) {
      if (event.touches.length !== 1) swipe = null;
    }, { passive: true });
    stage.addEventListener('touchcancel', function () {
      swipe = null;
    }, { passive: true });
    stage.addEventListener('touchend', function (event) {
      var start = swipe;
      swipe = null;
      if (!start || !dialog.open || event.touches.length || event.changedTouches.length !== 1 || photos.length < 2 || (window.visualViewport && window.visualViewport.scale > 1)) return;
      var dx = event.changedTouches[0].clientX - start.x;
      var dy = event.changedTouches[0].clientY - start.y;
      if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy) * 1.4) return;
      // A committed swipe must not also produce a backdrop click and close the viewer.
      if (event.cancelable) event.preventDefault();
      show(position + (dx < 0 ? 1 : -1));
    }, { passive: false });

    dialog.addEventListener('click', function (event) {
      if (event.target === dialog || event.target === stage) dialog.close();
    });
    dialog.addEventListener('close', function () {
      swipe = null;
      document.documentElement.classList.remove('gallery-viewer-open');
      image.hidden = true;
      image.removeAttribute('src');
      figure.setAttribute('aria-busy', 'false');
      loading.hidden = true;
      loading.textContent = 'Fotoğraf yükleniyor…';
      count.textContent = '';
      if (trigger && trigger.isConnected) trigger.focus();
      trigger = null;
    });

    document.addEventListener('keydown', function (event) {
      if (!dialog.open || event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey) return;
      if (event.key === 'Escape') { event.preventDefault(); dialog.close(); }
      else if (event.key === 'ArrowRight') { event.preventDefault(); show(position + 1); }
      else if (event.key === 'ArrowLeft') { event.preventDefault(); show(position - 1); }
      else if (event.key === 'Home') { event.preventDefault(); show(0); }
      else if (event.key === 'End') { event.preventDefault(); show(photos.length - 1); }
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
