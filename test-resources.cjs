const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');
function walk(dir) { return fs.readdirSync(dir, {withFileTypes:true}).flatMap(e => e.isDirectory() ? walk(path.join(dir,e.name)) : [path.join(dir,e.name)]); }
const urls = new Set();
function add(value) { if (/^https?:/.test(value || '')) urls.add(value.replaceAll('\\/', '/')); }
for (const file of walk('static-site').filter(f => /\.(html|css)$/.test(f) && !f.includes('wp-json'))) {
  const text = fs.readFileSync(file, 'utf8');
  for (const match of text.matchAll(/url\(\s*["']?(https?:[^)'"\s]+)/g)) add(match[1]);
  if (!file.endsWith('.html') || !/^\s*<!doctype html>/i.test(text)) continue;
  const dom = new JSDOM(text);
  for (const el of dom.window.document.querySelectorAll('script[src],img[src],link[rel="stylesheet"], [thumb]')) add(el.getAttribute('src') || el.getAttribute('href') || el.getAttribute('thumb'));
  for (const match of text.matchAll(/"source":"(https:[^"]+\.pdf)"/g)) add(match[1]);
  dom.window.close();
}
(async () => {
  const queue = [...urls], results = [];
  await Promise.all(Array.from({length:8},async () => { while(queue.length) {
    const url = queue.pop();
    try {
      let response = await fetch(url, {method:'HEAD',signal:AbortSignal.timeout(15000)});
      if (response.status === 405) response = await fetch(url,{signal:AbortSignal.timeout(15000)});
      results.push({url,status:response.status,type:response.headers.get('content-type')});
    } catch(error) { results.push({url,error:error.message}); }
  }}));
  const failures = results.filter(r => r.error || r.status >= 400);
  fs.writeFileSync('external-resource-audit.json',JSON.stringify({checked:results.length,failures,results},null,2));
  console.log(JSON.stringify({checked:results.length,failures},null,2));
  process.exitCode = failures.length ? 1 : 0;
})();
