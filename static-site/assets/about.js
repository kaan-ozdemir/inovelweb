(function () {
  'use strict';
  function init() {
    var root = document.querySelector('.about-team');
    if (!root) return;
    var input = root.querySelector('#team-search');
    var buttons = Array.from(root.querySelectorAll('[data-team-filter]'));
    var groups = Array.from(root.querySelectorAll('[data-team-group]'));
    var status = root.querySelector('.about-team-status');
    var active = 'all';
    function normalize(text) { return text.toLocaleLowerCase('tr-TR').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ı/g, 'i'); }
    function update() {
      var query = normalize(input.value.trim());
      var people = new Set();
      groups.forEach(function (group) {
        var included = active === 'all' || group.dataset.teamGroup === active;
        var visible = 0;
        group.querySelectorAll('[data-person]').forEach(function (person) {
          var match = included && normalize(person.querySelector('.about-person-info').textContent).includes(query);
          person.hidden = !match;
          if (match) {
            visible++;
            people.add(normalize(person.querySelector('h4').textContent.trim()));
          }
        });
        group.hidden = visible === 0;
      });
      status.textContent = people.size + ' ekip üyesi gösteriliyor';
      root.querySelector('.about-empty').hidden = people.size !== 0;
    }
    buttons.forEach(function (button) {
      button.addEventListener('click', function () {
        active = button.dataset.teamFilter;
        buttons.forEach(function (other) { other.setAttribute('aria-pressed', String(other === button)); });
        update();
      });
    });
    input.addEventListener('input', update);
    root.querySelector('.about-team-tools').hidden = false;
    update();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();

/* Reveal each department card once as it enters the viewport. */
(function () {
 function animateMembers() {
  if (!('IntersectionObserver' in window) || !window.matchMedia || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var cards = document.querySelectorAll('.about-person');
  var observer = new IntersectionObserver(function (entries) {
   entries.forEach(function (entry) {
    if (!entry.isIntersecting) return;
    entry.target.classList.add('member-visible');
    observer.unobserve(entry.target);
   });
  }, { threshold: 0.08 });
  cards.forEach(function (card, index) {
   card.style.setProperty('--member-delay', (index % 4) * 70 + 'ms');
   card.classList.add('member-reveal');
   observer.observe(card);
  });
 }
 if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', animateMembers);
 else animateMembers();
})();
