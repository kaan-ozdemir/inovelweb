/* Static hosting has no WordPress form submission endpoint. */
(function () {
  function init() {
    document.querySelectorAll('form.wpcf7-form').forEach(function (form) {
      form.removeAttribute('novalidate');
      form.querySelectorAll('[aria-required="true"]').forEach(function (field) {
        field.required = true;
      });
      form.querySelectorAll('input:not([type="hidden"]), textarea').forEach(function (field) {
        if (field.placeholder && !field.hasAttribute('aria-label')) {
          field.setAttribute('aria-label', field.placeholder);
        }
      });
      var submit = form.querySelector('[type="submit"]');
      if (submit) submit.value = 'E-posta taslağı hazırla';
      var output = form.querySelector('.wpcf7-response-output');
      if (output) {
        output.setAttribute('role', 'status');
        output.setAttribute('aria-live', 'polite');
        output.removeAttribute('aria-hidden');
        output.textContent = 'Mesajınız için bir e-posta taslağı hazırlayabilirsiniz.';
        output.style.display = 'block';
      }
      form.addEventListener('submit', function (event) {
        event.preventDefault();
        event.stopImmediatePropagation();
        if (!form.reportValidity() || !output) return;
        var data = new FormData(form);
        var body = ['Ad Soyad: ' + (data.get('your-name') || ''),
          'E-posta: ' + (data.get('your-email') || ''),
          'Telefon: ' + (data.get('your-phone') || ''), '',
          data.get('your-message') || ''].join('\n');
        var link = document.createElement('a');
        link.href = 'mailto:iletisim@inoveldpu.com?subject=' +
          encodeURIComponent('İnovel iletişim mesajı') + '&body=' + encodeURIComponent(body);
        link.textContent = 'E-posta uygulamasında aç';
        output.replaceChildren(document.createTextNode('Taslağınız hazır. Göndermek için: '), link);
      }, true);
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
