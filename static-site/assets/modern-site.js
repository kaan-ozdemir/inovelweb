(function () {
  'use strict';
  function init() {
    var header = document.querySelector('.modern-header');
    if (!header) return;
    var toggle = header.querySelector('.modern-menu-toggle');
    var menu = header.querySelector('.modern-menu');
    var groups = Array.from(header.querySelectorAll('details'));
    var eventToggle = header.querySelector('.modern-event-toggle');
    var eventSubmenu = header.querySelector('.modern-event-submenu');
    function closeEventMenu() {
      if (!eventToggle || !eventSubmenu) return;
      eventToggle.setAttribute('aria-expanded', 'false');
      eventSubmenu.hidden = true;
    }
    function closeMenu(restoreFocus) {
      header.classList.remove('menu-is-open');
      toggle.setAttribute('aria-expanded', 'false');
      groups.forEach(function (group) { group.open = false; });
      closeEventMenu();
      if (restoreFocus) toggle.focus();
    }
    toggle.addEventListener('click', function () {
      var open = toggle.getAttribute('aria-expanded') !== 'true';
      toggle.setAttribute('aria-expanded', String(open));
      header.classList.toggle('menu-is-open', open);
      if (!open) {
        groups.forEach(function (group) { group.open = false; });
        closeEventMenu();
      }
    });
    if (eventToggle && eventSubmenu) eventToggle.addEventListener('click', function () {
      var open = eventToggle.getAttribute('aria-expanded') !== 'true';
      groups.forEach(function (group) { group.open = false; });
      eventToggle.setAttribute('aria-expanded', String(open));
      eventSubmenu.hidden = !open;
    });
    groups.forEach(function (group) {
      group.addEventListener('toggle', function () {
        if (group.open) {
          groups.forEach(function (other) { if (other !== group) other.open = false; });
          closeEventMenu();
        }
      });
    });
    document.addEventListener('click', function (event) {
      if (!header.contains(event.target)) closeMenu(false);
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && eventToggle && eventToggle.getAttribute('aria-expanded') === 'true') {
        closeEventMenu();
        eventToggle.focus();
        return;
      }
      if (event.key === 'Escape' && (header.classList.contains('menu-is-open') || groups.some(function (group) { return group.open; }))) {
        var mobileOpen = header.classList.contains('menu-is-open');
        var openGroup = groups.find(function (group) { return group.open; });
        closeMenu(false);
        if (mobileOpen) toggle.focus();
        else if (openGroup) openGroup.querySelector('summary').focus();
      }
    });
    menu.querySelectorAll('a').forEach(function (link) { link.addEventListener('click', function () { closeMenu(false); }); });
    // Highlight the current destination, including nested pages.
    function canonicalPath(path) { return path.replace(/\/index\.html$/i, '/'); }
    menu.querySelectorAll('a').forEach(function (link) {
      link.removeAttribute('aria-current');
      if (canonicalPath(link.pathname) === canonicalPath(window.location.pathname)) link.setAttribute('aria-current', 'page');
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
