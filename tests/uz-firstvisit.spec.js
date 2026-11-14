const { test, expect } = require('@playwright/test');
test('первый визит: узб. латиница + заставка', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const splash = await page.locator('#splash-screen').innerText();
  console.log('SPLASH:', splash.replace(/\s+/g, ' '));
  await page.waitForLoadState('networkidle');
  console.log('LANG:', await page.evaluate(() => document.documentElement.lang), '| saved:', await page.evaluate(() => localStorage.getItem('lang')));
  console.log('NAV:', (await page.locator('#main-nav').innerText()).replace(/\s+/g, ' ').slice(0, 160));
  console.log('TITLE:', await page.title());
  await page.locator('.site-search-input, #site-search-input').first().evaluate(el => { el.value = 'alisher'; el.dispatchEvent(new Event('input', { bubbles: true })); });
  await page.waitForTimeout(800);
  console.log('SEARCH:', (await page.locator('#site-search-overlay').innerText()).replace(/\s+/g, ' ').slice(0, 200));
  await page.evaluate(() => window.i18n.setLang('ru'));
  await page.waitForTimeout(1000);
  console.log('RU NAV:', (await page.locator('#main-nav').innerText()).replace(/\s+/g, ' ').slice(0, 100), '| TITLE:', await page.title());
});
