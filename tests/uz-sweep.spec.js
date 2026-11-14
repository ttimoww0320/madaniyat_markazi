// Сканер: открывает каждую страницу на узбекской латинице и собирает весь
// видимый текст + атрибуты (placeholder/title/aria-label/alt). Ищет:
//  - кириллицу (непереведённые строки),
//  - старую латиницу (o' g' sh ch) вместо новой (ö ğ ş ç).
const { test } = require('@playwright/test');
const fs = require('fs');

const PAGES = ['/', '/dom-kultury.html', '/team.html', '/documents.html', '/contacts.html',
  '/all-numbers.html', '/bank-details.html', '/feedback.html', '/nope-404'];
const OUT = process.env.SWEEP_OUT || 'test-results/uz-sweep.json';
const results = {};

for (const url of PAGES) {
  test(`uz sweep ${url}`, async ({ page }) => {
    await page.addInitScript(() => { try { localStorage.setItem('lang', 'uz'); } catch {} });
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.waitForTimeout(800);
    // прокрутка для ленивых секций
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 600) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 120)); }
    });
    await page.waitForTimeout(800);
    const items = await page.evaluate(() => {
      const out = [];
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      let n;
      while ((n = walker.nextNode())) {
        const p = n.parentElement;
        if (!p || ['SCRIPT', 'STYLE', 'NOSCRIPT'].includes(p.tagName)) continue;
        const s = n.textContent.replace(/\s+/g, ' ').trim();
        if (s) out.push({ kind: 'text', s, where: p.closest('[id]')?.id || p.tagName });
      }
      document.querySelectorAll('[placeholder],[title],[aria-label],[alt]').forEach(el => {
        for (const a of ['placeholder', 'title', 'aria-label', 'alt']) {
          const v = el.getAttribute(a);
          if (v && v.trim()) out.push({ kind: a, s: v.trim(), where: el.closest('[id]')?.id || el.tagName });
        }
      });
      out.push({ kind: 'doc-title', s: document.title, where: 'head' });
      out.push({ kind: 'html-lang', s: document.documentElement.lang, where: 'html' });
      return out;
    });
    results[url] = items;
  });
}

test.afterAll(() => {
  let prev = {};
  try { prev = JSON.parse(fs.readFileSync(OUT, 'utf8')); } catch {}
  fs.mkdirSync(require('path').dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify({ ...prev, ...results }, null, 1));
});
