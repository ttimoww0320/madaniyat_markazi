// РОЛЬ 1 (QA) — пункты a, b, c, h из аудита перед продом:
// a) статус 200 + непустой <title>
// b) битые картинки (naturalWidth/complete)
// c) битые ссылки (внутренние href/якоря)
// h) ошибки JS в консоли
const { test, expect } = require('@playwright/test');
const { PAGES } = require('./audit-pages');

for (const pagePath of PAGES) {
    test.describe(`Базовые проверки: ${pagePath}`, () => {
        test(`${pagePath} — статус 200 и title не пустой`, async ({ page }) => {
            const res = await page.goto(`/${pagePath}`);
            expect(res, 'Навигация должна вернуть response').not.toBeNull();
            expect(res.status(), `Ожидался 200 для /${pagePath}`).toBe(200);
            const title = await page.title();
            expect(title.trim().length, `<title> пуст на /${pagePath}`).toBeGreaterThan(0);
        });

        test(`${pagePath} — нет битых картинок`, async ({ page }) => {
            await page.goto(`/${pagePath}`);
            await page.waitForLoadState('networkidle').catch(() => {});
            await page.waitForTimeout(500);

            // Проверяем по факту HTTP-ответа, а не по naturalWidth/complete —
            // на этом сайте многие картинки грузятся loading="lazy" внутри
            // CSS-анимированной бегущей строки (галерея), и naturalWidth===0
            // там означает "ещё не долистало до неё", а не "битая". Пустой
            // src="" тоже сознательно используется (плейсхолдер кроп-тула
            // в админке) — такие пропускаем.
            const srcs = await page.evaluate(() =>
                [...document.querySelectorAll('img')]
                    .map(img => img.getAttribute('src'))
                    .filter(src => src && src.trim() !== '')
            );

            const uniqueSrcs = [...new Set(srcs)];
            const broken = [];
            for (const src of uniqueSrcs) {
                let url;
                try { url = new URL(src, `http://localhost:3001/${pagePath}`); } catch { broken.push(`(невалидный src) ${src}`); continue; }
                if (url.host !== 'localhost:3001') continue; // внешние картинки не проверяем
                const res = await page.request.get(url.href).catch(e => ({ status: () => `ERR:${e.message}`, ok: () => false }));
                if (res.status() !== 200) broken.push(`${src} -> ${res.status()}`);
            }

            expect(broken, `Битые изображения на /${pagePath} (HTTP-статус не 200):\n${broken.join('\n')}`).toEqual([]);
        });

        test(`${pagePath} — нет битых внутренних ссылок`, async ({ page }) => {
            await page.goto(`/${pagePath}`);
            await page.waitForTimeout(1000);

            const hrefs = await page.evaluate(() =>
                [...document.querySelectorAll('a[href]')].map(a => a.getAttribute('href'))
            );

            const broken = [];
            const seenUrls = new Map();
            const base = new URL(`http://localhost:3001/${pagePath}`);

            for (const raw of hrefs) {
                // '#close' — стандартная кнопка закрытия попапа Leaflet (не наш код,
                // клик перехватывается JS библиотеки, реальной навигации не происходит).
                if (!raw || raw === '#' || raw === '#close' || raw.startsWith('mailto:') || raw.startsWith('tel:') || raw.startsWith('javascript:')) continue;

                let url;
                try { url = new URL(raw, base); } catch { broken.push(`(невалидный URL) ${raw}`); continue; }

                // Внешние ссылки (t.me, yandex.ru, openstreetmap...) не проверяем — только свой сайт
                if (url.host !== base.host) continue;

                if (url.hash && url.pathname === base.pathname) {
                    // Якорь на этой же странице — должен существовать в DOM.
                    // CSS.escape недоступен в Node-контексте теста, поэтому ищем
                    // через getElementById внутри page.evaluate (в контексте браузера).
                    const id = url.hash.slice(1);
                    const exists = await page.evaluate((elId) => !!document.getElementById(elId), id);
                    if (!exists) broken.push(`якорь ${raw} — элемента #${id} нет в DOM`);
                    continue;
                }

                if (url.hash && url.pathname !== base.pathname) {
                    // Якорь на другую страницу (напр. /dom-kultury.html#news) — проверяем страницу целиком,
                    // существование конкретного #id на ней не проверяем (грузится через SPA-рендер).
                    if (!seenUrls.has(url.pathname)) {
                        const r = await page.request.get(url.pathname).catch(e => ({ status: () => `ERR:${e.message}` }));
                        seenUrls.set(url.pathname, r.status());
                    }
                    if (seenUrls.get(url.pathname) === 404) broken.push(`${raw} — страница ${url.pathname} отвечает 404`);
                    continue;
                }

                // Обычная ссылка на страницу сайта
                if (!seenUrls.has(url.pathname)) {
                    const r = await page.request.get(url.pathname).catch(e => ({ status: () => `ERR:${e.message}` }));
                    seenUrls.set(url.pathname, r.status());
                }
                if (seenUrls.get(url.pathname) === 404) broken.push(`${raw} — отвечает 404`);
            }

            expect(broken, `Битые ссылки на /${pagePath}:\n${broken.join('\n')}`).toEqual([]);
        });

        test(`${pagePath} — нет ошибок в консоли`, async ({ page }) => {
            const errors = [];
            page.on('pageerror', (e) => errors.push(`[pageerror] ${e.message}`));
            page.on('console', (msg) => {
                if (msg.type() === 'error') errors.push(`[console.error] ${msg.text()}`);
            });

            await page.goto(`/${pagePath}`);
            await page.waitForTimeout(2000);

            expect(errors, `Ошибки в консоли на /${pagePath}:\n${errors.join('\n')}`).toEqual([]);
        });
    });
}
