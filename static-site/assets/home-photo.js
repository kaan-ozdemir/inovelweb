(function () {
  'use strict';
  var hero = document.querySelector('.zine-hero');
  var trigger = document.querySelector('.home-photo-open');
  if (!hero || !trigger || typeof HTMLDialogElement === 'undefined') return;
  var dialog = document.createElement('dialog');
  dialog.className = 'home-photo-viewer';
  dialog.setAttribute('aria-label', 'İnovel ekip fotoğrafı');
  var close = document.createElement('button');
  close.type = 'button';
  close.textContent = 'Kapat ×';
  var photo = document.createElement('img');
  photo.src = trigger.href;
  photo.alt = hero.querySelector('.zine-hero-photo').alt;
  dialog.append(close, photo);
  document.body.append(dialog);
  var previousFocus;
  hero.addEventListener('click', function (event) {
    var link = event.target.closest('a, button');
    if (link && link !== trigger) return;
    event.preventDefault();
    if (dialog.open) return;
    previousFocus = document.activeElement;
    dialog.showModal();
    close.focus();
  });
  close.addEventListener('click', function () { dialog.close(); });
  dialog.addEventListener('click', function (event) {
    if (event.target === dialog) dialog.close();
  });
  dialog.addEventListener('close', function () {
    if (previousFocus && previousFocus !== document.body) previousFocus.focus();
    else trigger.focus();
  });
}());
