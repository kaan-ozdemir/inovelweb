const fs = require('node:fs');
const assert = require('node:assert/strict');
const path = require('node:path');
const { JSDOM } = require('jsdom');

const html = fs.readFileSync('static-site/galeri/index.html', 'utf8');
const script = fs.readFileSync('static-site/assets/gallery.js', 'utf8');
const catalog = JSON.parse(fs.readFileSync('static-site/assets/gallery/catalog.json', 'utf8'));
const wait = () => new Promise(resolve => setTimeout(resolve, 10));
const base = {
  runScripts: 'outside-only',
  url: 'http://127.0.0.1:5500/static-site/galeri/index.html',
  pretendToBeVisual: true
};

function visibleLinks(document) {
  return [...document.querySelectorAll('[data-gallery-item]')]
    .filter(item => !item.hidden)
    .map(item => item.querySelector('[data-gallery-photo]'));
}

(async () => {
  const original = new JSDOM(fs.readFileSync('backups/gallery-before-redesign.html', 'utf8'));
  assert.deepEqual(
    catalog.slice(0, 12).map(photo => photo.original),
    [...original.window.document.querySelectorAll('.mg-single-img>a')].map(link => link.getAttribute('href')),
    'All twelve original photos are retained'
  );
  original.window.close();

  const fallback = new JSDOM(html, base);
  assert.equal(fallback.window.document.querySelectorAll('[data-gallery-photo]').length, 18);
  const previews = [...fallback.window.document.querySelectorAll('.gallery-image > img')];
  assert.equal(previews.length, 18, 'Every gallery card has a preview');
  catalog.forEach((photo, index) => {
    assert.ok(fs.existsSync(path.resolve('static-site/galeri', decodeURIComponent(photo.full))), 'Full photo exists for ' + photo.title);
    assert.ok(fs.existsSync(path.resolve('static-site/galeri', decodeURIComponent(photo.src))), 'Preview exists for ' + photo.title);
    assert.match(photo.src, /\/previews\//, 'Cards use optimized previews');
    assert.equal(previews[index].getAttribute('src'), photo.src, 'Rendered preview matches the catalog');
  });
  assert.equal(fallback.window.document.querySelector('.gallery-controls').hidden, true);
  assert.ok(
    [...fallback.window.document.querySelectorAll('[data-gallery-photo]')].every(link => !link.href.endsWith('.heic')),
    'All image destinations use browser-compatible formats'
  );
  fallback.window.HTMLDialogElement.prototype.showModal = undefined;
  fallback.window.eval(script);
  await wait();
  const fallbackClick = new fallback.window.MouseEvent('click', { bubbles: true, cancelable: true, button: 0 });
  fallback.window.document.querySelector('[data-gallery-photo]').dispatchEvent(fallbackClick);
  assert.equal(fallbackClick.defaultPrevented, false, 'Unsupported dialog falls back to the original image link');
  fallback.window.document.querySelector('[data-gallery-filter="15-yil"]').click();
  assert.equal(visibleLinks(fallback.window.document).length, 3, 'Album filters work without native dialog support');
  fallback.window.close();

  const missingDialog = new JSDOM(html, base);
  missingDialog.window.document.querySelector('.gallery-viewer').remove();
  const missingDialogErrors = [];
  missingDialog.window.addEventListener('error', event => missingDialogErrors.push(event.error));
  missingDialog.window.eval(script);
  await wait();
  assert.deepEqual(missingDialogErrors, [], 'Missing dialog markup does not crash initialization');
  assert.equal(missingDialog.window.document.querySelector('.gallery-controls').hidden, false);
  missingDialog.window.document.querySelector('[data-gallery-filter="sahne"]').click();
  assert.equal(visibleLinks(missingDialog.window.document).length, 7, 'Category filters work without dialog markup');
  const directClick = new missingDialog.window.MouseEvent('click', { bubbles: true, cancelable: true, button: 0 });
  visibleLinks(missingDialog.window.document)[0].dispatchEvent(directClick);
  assert.equal(directClick.defaultPrevented, false, 'Missing dialog retains normal photo links');
  missingDialog.window.close();

  const dom = new JSDOM(html, base);
  // jsdom does not implement browser top-layer layout. Emulate only the native API.
  dom.window.HTMLDialogElement.prototype.showModal = function () { this.open = true; };
  dom.window.HTMLDialogElement.prototype.close = function () {
    this.open = false;
    this.dispatchEvent(new dom.window.Event('close'));
  };
  dom.window.eval(script);
  await wait();

  const d = dom.window.document;
  const dialog = d.querySelector('.gallery-viewer');
  const loading = d.querySelector('.gallery-loading');
  const count = d.querySelector('.gallery-viewer-count');
  const links = [...d.querySelectorAll('[data-gallery-photo]')];
  const currentImage = () => d.querySelector('.gallery-viewer-image');
  const figure = currentImage().parentElement;

  links[0].click();
  assert.equal(dialog.open, true);
  assert.equal(currentImage().src, links[0].href);
  assert.equal(d.activeElement, d.querySelector('.gallery-close'));
  assert.equal(currentImage().hidden, true, 'Pending photos stay hidden');
  assert.equal(figure.getAttribute('aria-busy'), 'true');
  assert.equal(loading.hidden, false);
  const firstImage = currentImage();
  firstImage.dispatchEvent(new dom.window.Event('load'));
  assert.equal(firstImage.hidden, false, 'Successful loads reveal the current photo');
  assert.equal(figure.getAttribute('aria-busy'), 'false');
  assert.equal(loading.hidden, true);

  d.querySelector('.gallery-next').click();
  assert.equal(currentImage().src, links[1].href);
  assert.equal(firstImage.isConnected, false, 'Previous photo leaves the viewer before the next one loads');
  const secondImage = currentImage();
  firstImage.dispatchEvent(new dom.window.Event('error'));
  firstImage.dispatchEvent(new dom.window.Event('load'));
  assert.equal(secondImage.hidden, true, 'Delayed previous-photo events cannot reveal a pending photo');
  assert.equal(figure.getAttribute('aria-busy'), 'true');
  assert.equal(loading.hidden, false);
  assert.match(loading.textContent, /yükleniyor/, 'Delayed errors cannot replace the active loading message');
  secondImage.dispatchEvent(new dom.window.Event('load'));
  assert.equal(secondImage.hidden, false);
  assert.equal(loading.hidden, true);

  function touch(type, x, y, multiple) {
    const event = new dom.window.Event(type, { bubbles: true, cancelable: true });
    const point = { clientX: x, clientY: y };
    Object.defineProperty(event, 'touches', { value: type === 'touchend' ? [] : multiple ? [point, point] : [point] });
    Object.defineProperty(event, 'changedTouches', { value: [point] });
    currentImage().dispatchEvent(event);
    return event;
  }

  touch('touchstart', 200, 100);
  const swipeEnd = touch('touchend', 100, 105);
  assert.equal(currentImage().src, links[2].href, 'Left swipe advances');
  assert.equal(swipeEnd.defaultPrevented, true, 'A committed swipe suppresses the synthetic click');
  touch('touchstart', 100, 100);
  touch('touchend', 200, 105);
  assert.equal(currentImage().src, links[1].href, 'Right swipe goes back');
  touch('touchstart', 200, 100);
  touch('touchend', 190, 105);
  assert.equal(currentImage().src, links[1].href, 'Short gesture ignored');
  touch('touchstart', 200, 100);
  const verticalEnd = touch('touchend', 130, 250);
  assert.equal(currentImage().src, links[1].href, 'Vertical gesture ignored');
  assert.equal(verticalEnd.defaultPrevented, false, 'Vertical gestures retain native behavior');
  touch('touchstart', 200, 100);
  touch('touchmove', 180, 100, true);
  touch('touchend', 100, 100);
  assert.equal(currentImage().src, links[1].href, 'Pinch gesture ignored');
  touch('touchstart', 200, 100);
  touch('touchcancel', 150, 100);
  touch('touchend', 100, 100);
  assert.equal(currentImage().src, links[1].href, 'Cancelled gesture ignored');
  Object.defineProperty(dom.window, 'visualViewport', { value: { scale: 2 }, configurable: true });
  touch('touchstart', 200, 100);
  const zoomEnd = touch('touchend', 100, 105);
  assert.equal(currentImage().src, links[1].href, 'Panning a zoomed page does not advance photos');
  assert.equal(zoomEnd.defaultPrevented, false, 'Zoomed page gestures retain native behavior');
  dom.window.visualViewport.scale = 1;
  touch('touchstart', 200, 100);
  dom.window.visualViewport.scale = 2;
  const lateZoomEnd = touch('touchend', 100, 105);
  assert.equal(currentImage().src, links[1].href, 'Zoom beginning during a gesture cancels photo navigation');
  assert.equal(lateZoomEnd.defaultPrevented, false);
  dom.window.visualViewport.scale = 1;

  function key(value, modifiers = {}) {
    const event = new dom.window.KeyboardEvent('keydown', { key: value, bubbles: true, cancelable: true, ...modifiers });
    d.dispatchEvent(event);
    return event;
  }

  assert.equal(key('ArrowLeft', { altKey: true }).defaultPrevented, false, 'Browser Back shortcut is preserved');
  assert.equal(key('ArrowRight', { altKey: true }).defaultPrevented, false, 'Browser Forward shortcut is preserved');
  assert.equal(key('Home', { ctrlKey: true }).defaultPrevented, false, 'Ctrl shortcuts are preserved');
  assert.equal(key('End', { metaKey: true }).defaultPrevented, false, 'Meta shortcuts are preserved');
  assert.equal(currentImage().src, links[1].href, 'Modified shortcuts do not navigate photos');
  key('ArrowLeft');
  assert.equal(currentImage().src, links[0].href);
  key('ArrowLeft');
  assert.equal(currentImage().src, links[links.length - 1].href, 'Previous wraps around');
  key('Home');
  assert.equal(currentImage().src, links[0].href);
  key('End');
  assert.equal(currentImage().src, links[links.length - 1].href);

  const failedImage = currentImage();
  failedImage.dispatchEvent(new dom.window.Event('error'));
  assert.equal(failedImage.hidden, true, 'Failed photo remains hidden');
  assert.equal(figure.getAttribute('aria-busy'), 'false');
  assert.match(loading.textContent, /yüklenemedi/);
  secondImage.dispatchEvent(new dom.window.Event('load'));
  assert.equal(loading.hidden, false, 'Stale successful loads cannot hide the active error');
  key('Home');
  currentImage().dispatchEvent(new dom.window.Event('load'));
  failedImage.dispatchEvent(new dom.window.Event('error'));
  assert.equal(currentImage().hidden, false, 'Stale failed loads cannot hide the current successful photo');
  assert.equal(loading.hidden, true);

  const closedImage = currentImage();
  key('Escape');
  assert.equal(dialog.open, false);
  assert.equal(d.activeElement, links[0]);
  assert.ok(!d.documentElement.classList.contains('gallery-viewer-open'));
  assert.equal(closedImage.hasAttribute('src'), false);
  assert.equal(closedImage.hidden, true);
  assert.equal(figure.getAttribute('aria-busy'), 'false');
  assert.equal(loading.hidden, true);
  assert.equal(count.textContent, '');
  closedImage.dispatchEvent(new dom.window.Event('error'));
  closedImage.dispatchEvent(new dom.window.Event('load'));
  assert.equal(loading.hidden, true, 'Closing the viewer ignores pending image events');
  assert.equal(closedImage.hidden, true);

  d.querySelector('[data-gallery-filter="sahne"]').click();
  const stagePhotos = visibleLinks(d);
  assert.equal(stagePhotos.length, 7);
  stagePhotos[0].click();
  assert.equal(currentImage().src, stagePhotos[0].href);
  assert.match(count.textContent, /01 \/ 07/);
  key('ArrowLeft');
  assert.equal(currentImage().src, stagePhotos[6].href, 'Viewer stays inside the selected category');
  d.querySelector('.gallery-close').click();
  assert.equal(d.activeElement, stagePhotos[0]);

  d.querySelector('[data-gallery-filter="topluluk"]').click();
  assert.equal(visibleLinks(d).length, 11, 'Anniversary photos remain part of Topluluk hayatı');
  const albumFilter = d.querySelector('[data-gallery-filter="15-yil"]');
  albumFilter.click();
  const anniversaryPhotos = visibleLinks(d);
  assert.equal(anniversaryPhotos.length, 3, 'The anniversary album contains three photos');
  assert.ok(anniversaryPhotos.every(link => link.closest('[data-gallery-item]').dataset.category === 'topluluk'));
  assert.equal(albumFilter.getAttribute('aria-pressed'), 'true');
  assert.equal(d.querySelector('[data-gallery-filter="topluluk"]').getAttribute('aria-pressed'), 'false');
  assert.equal(d.querySelector('.gallery-status').textContent, '3 fotoğraf gösteriliyor');
  anniversaryPhotos[0].click();
  assert.match(count.textContent, /01 \/ 03/);
  key('ArrowLeft');
  assert.equal(currentImage().src, anniversaryPhotos[2].href, 'Anniversary navigation wraps within the album');
  key('ArrowRight');
  assert.equal(currentImage().src, anniversaryPhotos[0].href);
  key('End');
  assert.equal(currentImage().src, anniversaryPhotos[2].href);
  key('Escape');
  assert.equal(d.activeElement, anniversaryPhotos[0]);

  d.querySelector('[data-gallery-filter="all"]').click();
  assert.equal(visibleLinks(d).length, 18);
  const modified = new dom.window.MouseEvent('click', { bubbles: true, cancelable: true, button: 0, ctrlKey: true });
  links[0].dispatchEvent(modified);
  assert.equal(modified.defaultPrevented, false, 'Ctrl-click retains normal link behavior');
  const converted = fs.readFileSync('static-site/assets/gallery/IMG_5458.jpg');
  assert.equal(converted[0], 255);
  assert.equal(converted[1], 216);
  dom.window.close();

  console.log('Gallery: ' + catalog.length + ' photos, original links, category and anniversary filters, isolated image requests, keyboard, swipe, focus return and error states passed.');
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
