const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');

const siteUrl = 'http://127.0.0.1:5500/static-site/';
const catalog = JSON.parse(fs.readFileSync('static-site/assets/content/catalog.json', 'utf8'));
const issues = catalog.filter(record => record.kind === 'magazine');
const script = fs.readFileSync('static-site/assets/magazine.js', 'utf8');
const archiveHtml = fs.readFileSync('static-site/dergi/index.html', 'utf8');
const options = { runScripts: 'outside-only', pretendToBeVisual: true };
const wait = () => new Promise(resolve => setTimeout(resolve, 10));
const newestTitles = [
  '2024 Yaz Sezonu',
  '2024 İlkbahar Sezonu',
  '2024 Kış Sezonu',
  '2023 Sonbahar Sezonu',
  '2023 Yaz Sezonu'
];

async function startPage(html, url) {
  const dom = new JSDOM(html, { ...options, url });
  dom.window.eval(script);
  await wait();
  return dom;
}

(async () => {
  assert.equal(issues.length, 5);
  const noScript = new JSDOM(archiveHtml, { url: siteUrl + 'dergi/index.html' });
  const archive = noScript.window.document;
  assert.ok(archive.querySelector('.magazine-page'));
  assert.ok(archive.querySelector('script[src$="assets/magazine.js"]'));
  assert.equal(archive.querySelector('script[src$="assets/content.js"]'), null, 'The magazine archive has one filter controller');
  const archiveCards = [...archive.querySelectorAll('#content-grid [data-content]')];
  assert.equal(archiveCards.length, 5);
  assert.ok(archiveCards.every(card => !card.hidden), 'All issues remain available without JavaScript');
  assert.equal(archive.querySelector('.content-controls').hidden, true);
  assert.equal(archive.querySelector('[data-magazine-reset]').hidden, true);
  assert.equal(archive.querySelector('.content-empty').hidden, true);
  assert.deepEqual(archiveCards.map(card => card.querySelector('h3').textContent.trim()), newestTitles, 'Seasons are rendered in chronological order');

  for (const issue of issues) {
    const card = archiveCards.find(item => item.querySelector('h3').textContent.trim() === issue.title);
    assert.ok(card, 'The archive retains ' + issue.title);
    assert.equal(card.dataset.kind, 'magazine');
    assert.equal(card.dataset.year, issue.year);
    assert.equal(card.dataset.available, String(issue.available));
    assert.match(card.dataset.order, /^\d{6}$/, 'Chronological ordering includes year and month');
    const metadata = card.querySelector('.magazine-file-meta').textContent;
    const issueUrl = new URL(issue.file, siteUrl).href;
    assert.ok([...card.querySelectorAll('a')].some(link => link.href === issueUrl), 'Issue details work without JavaScript');

    const html = fs.readFileSync(path.join('static-site', issue.file), 'utf8');
    const readerDom = new JSDOM(html, { url: issueUrl });
    const reader = readerDom.window.document;
    assert.ok(reader.querySelector('.magazine-page'));
    assert.equal(reader.querySelectorAll('h1').length, 1);
    assert.equal(reader.querySelector('h1').textContent.trim(), issue.title);
    assert.equal(reader.querySelectorAll('object').length, 0, 'No PDF loads before the reader is requested');
    const navigation = reader.querySelector('.magazine-issue-nav');
    assert.equal(navigation.querySelectorAll('.magazine-issue-links a').length, 5, 'All issue links work without JavaScript');
    assert.equal(navigation.querySelector('a[aria-current="page"]').href, issueUrl);
    assert.equal(navigation.querySelector('[data-magazine-picker]').closest('.magazine-picker').hidden, true);

    if (issue.available) {
      const pdfUrl = new URL(issue.pdf, siteUrl).href;
      const pdfFile = path.join('static-site', issue.pdf);
      assert.equal(fs.readFileSync(pdfFile).toString('ascii', 0, 5), '%PDF-');
      const expectedSize = (fs.statSync(pdfFile).size / 1e6).toLocaleString('tr-TR', {
        maximumFractionDigits: 1,
        minimumFractionDigits: 1
      }) + ' MB';
      assert.match(metadata, /\d+ sayfa/);
      assert.ok(metadata.includes(expectedSize), 'Archive file size matches the PDF');
      const readerMetadata = reader.querySelector('.magazine-heading .magazine-file-meta').textContent;
      assert.equal(readerMetadata, metadata, 'The reader and archive show the same file metadata');
      assert.ok([...card.querySelectorAll('a[download]')].some(link => link.href === pdfUrl));
      assert.ok([...card.querySelectorAll('a')].some(link => link.href === issueUrl + '#dergi-okuyucu'), 'The read action targets the inline reader');
      const directLinks = [...reader.querySelectorAll('a')].filter(link => link.href === pdfUrl);
      assert.ok(directLinks.some(link => link.target === '_blank' && /noopener/.test(link.rel)), 'A direct PDF opening link works without JavaScript');
      assert.ok(directLinks.some(link => link.hasAttribute('download')), 'A PDF download works without JavaScript');
      const panel = reader.querySelector('[data-magazine-reader]');
      assert.equal(panel.querySelector('[data-reader-load]').hidden, true);
      assert.equal(panel.querySelector('[data-reader-frame]').hidden, true);
      assert.equal(panel.querySelector('[data-reader-template]').content.querySelector('object').getAttribute('data'), '../' + issue.pdf);
      assert.match(panel.querySelector('noscript').textContent, /PDF/);
    } else {
      assert.match(metadata, /PDF/);
      assert.equal(card.querySelector('a[download]'), null, 'Unavailable issues do not offer a download');
      assert.equal(reader.querySelector('[data-magazine-reader]'), null, 'Unavailable issues do not offer an empty reader');
      assert.match(reader.querySelector('.magazine-unavailable-note').textContent, /erişilemiyor/);
    }
    readerDom.window.close();
  }
  noScript.window.close();

  const dom = await startPage(archiveHtml, siteUrl + 'dergi/index.html');
  const d = dom.window.document;
  const search = d.querySelector('#content-search');
  const year = d.querySelector('#content-year');
  const available = d.querySelector('#magazine-available');
  const sort = d.querySelector('#magazine-sort');
  const status = d.querySelector('.content-status');
  const reset = d.querySelector('[data-magazine-reset]');
  const visible = () => [...d.querySelectorAll('#content-grid [data-content]')].filter(card => !card.hidden);
  const titles = () => visible().map(card => card.querySelector('h3').textContent.trim());
  function change(control, value) {
    control.value = value;
    control.dispatchEvent(new dom.window.Event('change'));
  }
  function query(value) {
    search.value = value;
    search.dispatchEvent(new dom.window.Event('input'));
  }

  assert.equal(d.querySelector('.content-controls').hidden, false);
  assert.equal(status.textContent, '5 / 5 sayı gösteriliyor');
  assert.equal(reset.hidden, true);
  assert.deepEqual(titles(), newestTitles);
  available.checked = true;
  available.dispatchEvent(new dom.window.Event('change'));
  assert.equal(visible().length, 4);
  assert.ok(visible().every(card => card.dataset.available === 'true'));
  assert.equal(status.textContent, '4 / 5 sayı gösteriliyor');
  assert.equal(reset.hidden, false);
  change(year, '2023');
  assert.equal(visible().length, 2);
  query('SONBAHAR');
  assert.deepEqual(titles(), ['2023 Sonbahar Sezonu']);
  query('bulunmayan-sayi');
  assert.equal(visible().length, 0);
  assert.equal(d.querySelector('.content-empty').hidden, false);
  assert.equal(status.textContent, '0 / 5 sayı gösteriliyor');
  d.querySelector('.content-empty button.content-reset').click();
  assert.deepEqual(titles(), newestTitles, 'Empty-result reset restores the full default archive');
  assert.equal(year.value, 'all');
  assert.equal(available.checked, false);
  assert.equal(sort.value, 'newest');
  assert.equal(search.value, '');
  assert.equal(d.activeElement, search);
  assert.equal(reset.hidden, true);
  assert.equal(d.querySelector('.content-empty').hidden, true);

  query('KIŞ');
  assert.deepEqual(titles(), ['2024 Kış Sezonu'], 'Turkish uppercase letters match');
  query('kis');
  assert.deepEqual(titles(), ['2024 Kış Sezonu'], 'ASCII spelling finds Turkish titles');
  query('İLKBAHAR');
  assert.deepEqual(titles(), ['2024 İlkbahar Sezonu']);
  query('2024   ilkbahar');
  assert.deepEqual(titles(), ['2024 İlkbahar Sezonu'], 'Extra search spacing is ignored');
  reset.click();
  change(sort, 'oldest');
  assert.deepEqual(titles(), newestTitles.slice().reverse(), 'Oldest sorting reorders the cards');
  assert.equal(reset.hidden, false, 'Sorting alone makes reset available');
  available.checked = true;
  available.dispatchEvent(new dom.window.Event('change'));
  assert.deepEqual(titles(), newestTitles.slice(1).reverse(), 'Availability filtering preserves the selected chronological order');
  reset.click();
  assert.deepEqual(titles(), newestTitles);
  assert.equal(d.querySelectorAll('#content-grid [data-content]').length, 5, 'Filtering and sorting do not duplicate cards');
  dom.window.close();

  const issue = issues.find(item => item.id === 'magazine-2024-ilkbahar');
  const readerHtml = fs.readFileSync(path.join('static-site', issue.file), 'utf8');
  const readerUrl = new URL(issue.file, siteUrl).href;
  const manual = await startPage(readerHtml, readerUrl);
  const manualDocument = manual.window.document;
  const panel = manualDocument.querySelector('[data-magazine-reader]');
  const load = panel.querySelector('[data-reader-load]');
  const frame = panel.querySelector('[data-reader-frame]');
  const readerStatus = panel.querySelector('[data-reader-status]');
  assert.equal(manualDocument.querySelectorAll('object').length, 0, 'Reader initialization does not fetch the PDF');
  assert.equal(frame.hidden, true);
  assert.equal(load.hidden, false);
  assert.equal(load.getAttribute('aria-expanded'), 'false');
  assert.equal(readerStatus.textContent, 'PDF dosyasını ayrı sekmede açabilir veya indirebilirsin.');
  assert.equal(manualDocument.querySelector('.magazine-picker').hidden, false);
  load.click();
  assert.equal(frame.hidden, false);
  assert.equal(load.hidden, true);
  assert.equal(load.getAttribute('aria-expanded'), 'true');
  assert.equal(frame.querySelectorAll('object').length, 1);
  assert.equal(frame.querySelector('object').getAttribute('data'), '../' + issue.pdf);
  assert.equal(frame.querySelector('object').getAttribute('tabindex'), '0');
  assert.equal(manualDocument.activeElement, frame.querySelector('object'), 'Opening by button moves focus out of the hidden button into the reader');
  assert.equal(readerStatus.textContent, 'Okuyucu açıldı. Görüntülenmezse PDF’yi ayrı sekmede açabilirsin.');
  load.click();
  assert.equal(frame.querySelectorAll('object').length, 1, 'Repeated activation creates one PDF reader');
  frame.querySelector('object').dispatchEvent(new manual.window.Event('error'));
  assert.match(readerStatus.textContent, /görüntülenemedi/);
  assert.match(readerStatus.textContent, /Ayrı sekmede/);
  assert.ok(panel.querySelector('.magazine-reader-help a[target="_blank"]'), 'The fallback stays available after a native PDF error');
  manual.window.close();

  const linked = await startPage(readerHtml, readerUrl + '#dergi-okuyucu');
  const linkedDocument = linked.window.document;
  assert.equal(linkedDocument.querySelectorAll('[data-reader-frame] object').length, 1, 'Archive read links open the inline reader automatically');
  assert.equal(linkedDocument.querySelector('[data-reader-load]').hidden, true);
  assert.equal(linkedDocument.activeElement, linkedDocument.body, 'Hash opening does not move keyboard focus');
  linkedDocument.querySelector('[data-reader-load]').click();
  assert.equal(linkedDocument.querySelectorAll('[data-reader-frame] object').length, 1, 'Hash activation and button activation share one reader');
  linked.window.close();

  const changedHash = await startPage(readerHtml, readerUrl);
  const changedDocument = changedHash.window.document;
  const focusedLink = changedDocument.querySelector('.magazine-reader-help a');
  focusedLink.focus();
  changedHash.window.location.hash = '#dergi-okuyucu';
  await wait();
  assert.equal(changedDocument.querySelectorAll('[data-reader-frame] object').length, 1, 'A same-page reader link opens the deferred reader');
  assert.equal(changedDocument.activeElement, focusedLink, 'Same-page hash opening preserves focus');
  changedHash.window.location.hash = '#main-content';
  await wait();
  changedHash.window.location.hash = '#dergi-okuyucu';
  await wait();
  assert.equal(changedDocument.querySelectorAll('[data-reader-frame] object').length, 1, 'Returning to the reader hash does not duplicate the PDF');
  changedHash.window.close();

  // A plain location object lets jsdom verify navigation destinations without implementing page navigation.
  const pickerDom = new JSDOM(readerHtml, { ...options, url: readerUrl });
  await wait();
  const location = { href: readerUrl, hash: '' };
  vm.runInNewContext(script, { document: pickerDom.window.document, window: {
    location,
    addEventListener: pickerDom.window.addEventListener.bind(pickerDom.window)
  } });
  const picker = pickerDom.window.document.querySelector('[data-magazine-picker]');
  const destination = '../dergi-2023sonbahar/index.html';
  picker.value = destination;
  picker.dispatchEvent(new pickerDom.window.Event('change'));
  assert.equal(location.href, destination, 'The issue picker navigates to the selected relative page');
  for (const invalid of ['', 'https://example.com/', '//example.com/', 'javascript:alert(1)', 'java\nscript:alert(1)', '\\\\example.com/']) {
    const option = pickerDom.window.document.createElement('option');
    option.value = invalid;
    picker.appendChild(option);
    picker.value = invalid;
    picker.dispatchEvent(new pickerDom.window.Event('change'));
    assert.equal(location.href, destination, 'The issue picker ignores a nonrelative or empty destination');
  }
  pickerDom.window.close();

  console.log('Magazines: 5 issues, chronological seasons, readable/PDF metadata, no-JS links, filters/reset/sort, deferred reader, hash opening, error fallback and issue picker passed.');
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
