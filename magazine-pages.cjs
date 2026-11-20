const fs = require('node:fs');
const path = require('node:path');

const esc = value => String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const arrow = '<span aria-hidden="true">↗</span>';
const months = { yaz: 6, ilkbahar: 3, kis: 1, sonbahar: 9 };
const pageCounts = { 'magazine-2023-yaz': 32, 'magazine-2024-ilkbahar': 30, 'magazine-2023-sonbahar': 28, 'magazine-2024-kis': 32 };

function getIssues(records, root = path.resolve('static-site')) {
  return records.filter(record => record.kind === 'magazine').map(record => {
    const pdfFile = record.pdf && path.join(root, record.pdf);
    const available = Boolean(record.available && pdfFile && fs.existsSync(pdfFile));
    return {
      ...record,
      available,
      order: Number(record.year) * 100 + months[record.id.split('-').at(-1)],
      pages: available ? pageCounts[record.id] : null,
      size: available ? (fs.statSync(pdfFile).size / 1e6).toLocaleString('tr-TR', { maximumFractionDigits: 1, minimumFractionDigits: 1 }) + ' MB' : null,
      width: record.id === 'magazine-2024-ilkbahar' ? 707 : 724,
      height: 1024,
    };
  }).sort((a, b) => b.order - a.order);
}

function metadata(issue) {
  return issue.available ? [issue.pages && `${issue.pages} sayfa`, `PDF · ${issue.size}`].filter(Boolean).join(' · ') : 'PDF henüz arşivde yok';
}

function cover(issue, prefix, lazy = true) {
  return `<img src="${prefix}${esc(issue.image)}" alt="${esc(issue.title)} dergi kapağı" width="${issue.width}" height="${issue.height}" ${lazy ? 'loading="lazy"' : 'fetchpriority="high"'} decoding="async">`;
}

function card(issue, prefix) {
  return `<article class="content-card content-card-magazine magazine-issue" data-content data-kind="magazine" data-year="${issue.year}" data-search="${esc(issue.title + ' İnovel dergi ' + issue.year)}" data-available="${issue.available}" data-order="${issue.order}">
    <a class="magazine-issue-cover" href="${prefix}${issue.file}" aria-label="${esc(issue.title)}: sayı bilgileri">${cover(issue, prefix)}</a>
    <div class="magazine-issue-info"><p class="magazine-issue-label">İNOVEL DERGİ / ${issue.year}</p><h3><a href="${prefix}${issue.file}">${esc(issue.title)}</a></h3><p class="magazine-file-meta">${metadata(issue)}</p>
    <div class="magazine-issue-actions">${issue.available ? `<a class="magazine-action-primary" href="${prefix}${issue.file}#dergi-okuyucu" aria-label="${esc(issue.title)} dergisini oku">Dergiyi oku ${arrow}</a><a class="magazine-action-secondary" href="${prefix}${issue.pdf}" download aria-label="${esc(issue.title)} PDF dosyasını indir">PDF indir <span aria-hidden="true">↓</span></a>` : `<span class="content-unavailable-label">Şu anda okunamıyor</span><a class="magazine-action-secondary" href="${prefix}${issue.file}">Sayı bilgisi ${arrow}</a>`}</div></div>
  </article>`;
}

function renderArchive(records, prefix, root) {
  const issues = getIssues(records, root);
  const available = issues.filter(issue => issue.available);
  const feature = available[0];
  const years = [...new Set(issues.map(issue => issue.year))];
  return `<section class="magazine-archive-hero zine-wrap"><nav class="content-breadcrumb" aria-label="Sayfa yolu"><a href="${prefix}index.html">Ana sayfa</a><span aria-hidden="true">/</span><a href="${prefix}icerikler/index.html">İçerikler</a><span aria-hidden="true">/</span><span aria-current="page">Dergi</span></nav>
    <div class="magazine-archive-intro"><div><p class="zine-section-tag">SAYI ARŞİVİ</p><h1>İNOVEL<br><span>DERGİ.</span></h1><p class="content-lead">Okumak istediğin sayıyı seç. Dergiyi burada açabilir ya da PDF olarak indirebilirsin.</p><p class="magazine-archive-count">${issues.length} sayı <span aria-hidden="true">/</span> ${available.length} okunabilir PDF</p></div>
    ${feature ? `<div class="magazine-latest"><a href="${prefix}${feature.file}#dergi-okuyucu" class="magazine-latest-cover" aria-label="${esc(feature.title)} dergisini oku">${cover(feature, prefix, false)}</a><div><p class="zine-section-tag">SON OKUNABİLİR SAYI</p><h2>${esc(feature.title)}</h2><p class="magazine-file-meta">${metadata(feature)}</p><a class="magazine-action-primary" href="${prefix}${feature.file}#dergi-okuyucu">Okumaya başla ${arrow}</a></div></div>` : ''}</div>
  </section>
  <section class="content-library magazine-library zine-wrap" id="icerik-listesi" data-content-root>
    <div class="content-library-heading"><h2>Tüm sayılar</h2><a href="${prefix}icerikler/index.html" class="magazine-archive-back">Tüm içerikler ${arrow}</a></div>
    <nav class="content-category-links" aria-label="İçerik sayfaları"><a href="${prefix}icerikler/index.html">Tüm içerikler</a><a href="${prefix}dergi/index.html" aria-current="page">Dergi</a><a href="${prefix}podcasts/index.html">Podcast</a><a href="${prefix}blogs/index.html">Blog</a></nav>
    <div class="content-controls" hidden><div class="content-search-row"><label><span>SAYI ARA</span><input type="search" id="content-search" placeholder="Sayı adı, sezon veya yıl…" aria-controls="content-grid" autocomplete="off"></label><label class="content-year"><span>YIL</span><select id="content-year" aria-controls="content-grid"><option value="all">Tüm yıllar</option>${years.map(year => `<option value="${year}">${year}</option>`).join('')}</select></label><label class="magazine-sort"><span>SIRALAMA</span><select id="magazine-sort" aria-controls="content-grid"><option value="newest">Yeniden eskiye</option><option value="oldest">Eskiden yeniye</option></select></label></div>
    <div class="magazine-filter-row"><label class="magazine-availability"><input type="checkbox" id="magazine-available" aria-controls="content-grid"><span>Yalnız okunabilir sayılar</span></label><button type="button" class="content-reset" data-magazine-reset hidden>Filtreleri temizle <span aria-hidden="true">×</span></button></div></div>
    <p class="content-status" role="status" aria-live="polite">${issues.length} sayı · ${available.length} okunabilir PDF</p>
    <div class="content-grid magazine-grid" id="content-grid">${issues.map(issue => card(issue, prefix)).join('')}</div>
    <div class="content-empty" hidden><h3>Sayı bulunamadı.</h3><p>Başka bir sezon veya yıl deneyebilir, filtreleri temizleyebilirsin.</p><button type="button" class="content-reset">Filtreleri temizle ${arrow}</button></div>
  </section>`;
}

function issueNavigation(issues, current, prefix) {
  return `<nav class="magazine-issue-nav" aria-label="Dergi sayıları"><label class="magazine-picker" hidden><span>BAŞKA BİR SAYI SEÇ</span><select data-magazine-picker>${issues.map(issue => `<option value="${prefix}${issue.file}" ${issue.id === current.id ? 'selected' : ''}>${esc(issue.title)}${issue.available ? '' : ' — PDF yok'}</option>`).join('')}</select></label><div class="magazine-issue-links">${issues.map(issue => `<a href="${prefix}${issue.file}" ${issue.id === current.id ? 'aria-current="page"' : ''}>${esc(issue.title)}${issue.available ? '' : '<span>PDF yok</span>'}</a>`).join('')}</div></nav>`;
}

function renderReader(record, records, prefix, root) {
  const issues = getIssues(records, root);
  const issue = issues.find(item => item.id === record.id);
  const pdf = issue.available ? `${prefix}${issue.pdf}` : null;
  return `<section class="magazine-heading zine-wrap"><nav class="content-breadcrumb" aria-label="Sayfa yolu"><a href="${prefix}icerikler/index.html">İçerikler</a><span aria-hidden="true">/</span><a href="${prefix}dergi/index.html">Dergi</a><span aria-hidden="true">/</span><span aria-current="page">${esc(issue.title)}</span></nav>
    <div class="magazine-heading-grid">${cover(issue, prefix, false)}<div><p class="zine-section-tag">İNOVEL DERGİ / ${issue.year}</p><h1>${esc(issue.title)}</h1><p class="magazine-file-meta">${metadata(issue)}</p>
    ${issue.available ? `<p>PDF’yi ayrı sekmede açabilir veya indirip daha sonra okuyabilirsin.</p><div class="magazine-actions"><a class="magazine-action-primary" href="${pdf}" target="_blank" rel="noopener noreferrer">PDF’yi aç ${arrow}</a><a class="magazine-action-secondary" href="${pdf}" download>PDF indir <span aria-hidden="true">↓</span></a></div>` : `<p class="magazine-unavailable-note" role="status">Bu sayının PDF dosyasına şu anda erişilemiyor. Aşağıdan okunabilir bir sayı seçebilir veya dosya için <a href="${prefix}iletisim/index.html">bizimle iletişime geçebilirsin.</a></p>`}
    <a class="magazine-back" href="${prefix}dergi/index.html">← Dergi arşivine dön</a></div></div>
  </section>
${issue.available ? `<section class="magazine-reader magazine-reader-panel zine-wrap" id="dergi-okuyucu" data-magazine-reader aria-labelledby="reader-heading"><div class="magazine-reader-toolbar"><div><h2 id="reader-heading">Bu sayfada oku</h2><p data-reader-status role="status" aria-live="polite">PDF dosyasını ayrı sekmede açabilir veya indirebilirsin.</p></div><button type="button" class="magazine-action-primary" data-reader-load aria-controls="magazine-reader-frame" aria-expanded="false" hidden>Okuyucuyu aç <span aria-hidden="true">↓</span></button></div><div class="magazine-reader-frame" id="magazine-reader-frame" data-reader-frame hidden></div><template data-reader-template><object data="${pdf}" type="application/pdf" title="${esc(issue.title)} dergisi"><p>Tarayıcın PDF’yi burada göstermiyor. <a href="${pdf}" target="_blank" rel="noopener noreferrer">PDF’yi ayrı sekmede aç.</a></p></object></template><p class="magazine-reader-help">Okuyucu görünmezse <a href="${pdf}" target="_blank" rel="noopener noreferrer">PDF’yi ayrı sekmede aç ↗</a> ya da <a href="${pdf}" download>indir ↓</a>.</p><noscript><p class="magazine-reader-help">Bu sayfada okumak için JavaScript gerekir. Yukarıdaki PDF açma ve indirme bağlantılarını kullanabilirsin.</p></noscript></section>` : ''}
  <section class="magazine-more zine-wrap" aria-labelledby="magazine-more-heading"><h2 id="magazine-more-heading">Diğer sayılar</h2>${issueNavigation(issues, issue, prefix)}</section>`;
}

module.exports = { getIssues, renderArchive, renderReader };
