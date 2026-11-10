const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {spawnSync} = require('node:child_process');
const root = path.resolve('static-site');
function walk(dir) { return fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]); }
const pages = walk(root).filter(f => f.endsWith('.html') && fs.readFileSync(f, 'utf8').trimStart().toLowerCase().startsWith('<!doctype html>'));
let changed = 0, references = 0;
for (const file of pages) {
  const original = fs.readFileSync(file, 'utf8');
  const prefix = path.relative(path.dirname(file), root).replaceAll('\\', '/');
  function resolveReference(url) {
    if (!url || /^(?:[a-z][a-z\d+.-]*:|\/\/|#|\?)/i.test(url)) return url;
    const pathname = url.split(/[?#]/)[0];
    if (pathname.startsWith('../') || pathname.startsWith('./')) return url;
    if (fs.existsSync(path.resolve(path.dirname(file), pathname))) return url;
    const target = path.join(root, pathname);
    if (!fs.existsSync(target)) return url;
    const fixed = (prefix ? prefix + '/' : '') + url;
    if (fixed !== url) references++;
    return fixed;
  }
  let html = original.replace(/\b(src|href|poster|thumb)\s*=\s*(["'])(.*?)\2/gi, (all, attr, quote, url) => `${attr}=${quote}${resolveReference(url)}${quote}`);
  if (!html.includes('id="static-site-fixes"')) {
    const fixesPath = (prefix ? prefix + '/' : '') + 'assets/site-fixes.css';
    html = html.replace(/<\/head>/i, `<link id="static-site-fixes" rel="stylesheet" href="${fixesPath}">\n</head>`);
  }
  html = html.replace(/url\(([^\s"')]+)%2529%253B/gi, (all, url) => `url(${resolveReference(url)});`);
  html = html.replace(/url\(([^\s"')]+)(\s+!important)/gi, 'url($1)$2');
  html = html.replace(/url\((wp-content\/[^\s"')]+)\)/gi, (all, url) => `url(${fs.existsSync(path.join(root, url)) ? resolveReference(url) : 'https://inoveldpu.com/' + url})`);
  html = html.replace(/\bthumb="(wp-content\/[^"<>]+)"/g, (all, url) => `thumb="https://inoveldpu.com/${url}"`);
  html = html.replace(/\bsrcset\s*=\s*(["'])(.*?)\1/gi, (all, quote, values) => `srcset=${quote}${values.split(',').map(candidate => candidate.replace(/^(\s*)(\S+)/, (m, space, url) => space + resolveReference(url))).join(',')}${quote}`);
  // These WordPress discovery endpoints do not exist in a static export.
  html = html.replace(/<link\b[^>]*\b(?:href=["'](?:xmlrpc\.php|wp-json\/oembed\/1\.0\/embed\/index\.html)["'])[^>]*>\s*/gi, '');
  // DearFlip appends worker, font and image paths to this directory.
  html = html.replace(/window\.dFlipLocation\s*=\s*'wp-content\/plugins\/3d-flipbook-dflip-lite\/assets\/index\.html'/g, "window.dFlipLocation = 'https://inoveldpu.com/wp-content/plugins/3d-flipbook-dflip-lite/assets/'");
  if (html !== original) { fs.writeFileSync(file, html, 'utf8'); changed++; }
}
let syntaxErrors = [], missingAssets = [], missingLinks = [];
for (const file of pages) {
  const html = fs.readFileSync(file, 'utf8');
  for (const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    if (/\bsrc\s*=/.test(match[1]) || /\btype\s*=\s*["'](?!text\/javascript|application\/javascript)[^"']+["']/i.test(match[1])) continue;
    try { new vm.Script(match[2], { filename: path.relative(root, file) }); } catch (error) { syntaxErrors.push(error.message); }
  }
  for (const match of html.matchAll(/\b(src|href|poster|thumb)\s*=\s*(["'])(.*?)\2/gi)) {
    const url = match[3];
    if (!url || /^(?:[a-z][a-z\d+.-]*:|\/\/|#|\?)/i.test(url)) continue;
    const target = path.resolve(path.dirname(file), url.split(/[?#]/)[0]);
    if (!fs.existsSync(target)) (match[1] === 'href' ? missingLinks : missingAssets).push(`${path.relative(root, file)}: ${url}`);
  }
  const imageUrls = [...html.matchAll(/url\(\s*["']?([^\s"')]+)/gi)].map(m => m[1]);
  for (const match of html.matchAll(/\bsrcset=["']([^"']+)["']/gi)) imageUrls.push(...match[1].split(',').map(v => v.trim().split(/\s+/)[0]));
  for (const url of imageUrls) {
    if (/^(?:[a-z][a-z\d+.-]*:|\/\/|#)/i.test(url)) continue;
    if (!fs.existsSync(path.resolve(path.dirname(file), url.split(/[?#]/)[0]))) missingAssets.push(`${path.relative(root, file)}: ${url}`);
  }
}
for (const file of walk(root).filter(f => f.endsWith('.js'))) {
  try {
    const source=fs.readFileSync(file,'utf8');
    if(/^\s*(import|export)\s/m.test(source)){
      const result=spawnSync(process.execPath,['--check','--input-type=module'],{input:source,encoding:'utf8'});
      if(result.status!==0)throw new Error('ES module syntax validation failed');
    }else new vm.Script(source,{filename:file});
  } catch (error) { syntaxErrors.push(`${file}: ${error.message}`); }
}
console.log(JSON.stringify({ pages: pages.length, changed, references, syntaxErrors, missingAssets, missingLinks }, null, 2));
