// РОЛЬ 1 (QA) — пункт g: адаптив — скриншоты на 375/768/1024/1440px (fullPage)
// в screenshots/ + проверка отсутствия горизонтального скролла на каждой ширине.
const { test, expect } = require('@playwright/test');
const { PAGES } = require('./audit-pages');

const WIDTHS = [375, 768, 1024, 1440];

for (const pagePath of PAGES) {
    for (const width of WIDTHS) {
        test(`Адаптив ${width}px — ${pagePath}`, async ({ page }) => {
            await page.setViewportSize({ width, height: 900 });
            await page.goto(`/${pagePath}`);
            await page.waitForLoadState('networkidle').catch(() => {});
            await page.waitForTimeout(800);

            const name = pagePath.replace('.html', '');
            await page.screenshot({ path: `screenshots/${name}-${width}.png`, fullPage: true });

            const { scrollWidth, clientWidth } = await page.evaluate(() => ({
                scrollWidth: document.documentElement.scrollWidth,
                clientWidth: document.documentElement.clientWidth,
            }));

            // Небольшой допуск на субпиксельное округление браузера
            expect(scrollWidth, `Горизонтальный скролл на /${pagePath} при ${width}px: scrollWidth=${scrollWidth} > clientWidth=${clientWidth}`)
                .toBeLessThanOrEqual(clientWidth + 1);
        });
    }
}
