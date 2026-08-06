const { test, expect } = require('@playwright/test');

test.describe('Секции: граница между Кружки/Карта и Галерея/Документы', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/dom-kultury.html');
        await expect(page.locator('#map')).toBeAttached();
    });

    test('карта и документы не завёрнуты в .section-gray', async ({ page }) => {
        await expect(page.locator('#map')).not.toHaveClass(/section-gray/);
        await expect(page.locator('#map').locator('xpath=..')).not.toHaveClass(/section-gray/);

        await expect(page.locator('#documents')).not.toHaveClass(/section-gray/);
        await expect(page.locator('#documents').locator('xpath=..')).not.toHaveClass(/section-gray/);
    });

    test('фон секций-соседей визуально различается (нет "шва")', async ({ page }) => {
        const bg = (loc) => loc.evaluate((el) => getComputedStyle(el).backgroundColor);

        const circlesBg = await bg(page.locator('#circles').locator('xpath=..'));
        const mapBg = await bg(page.locator('#map'));
        expect(mapBg).not.toBe(circlesBg);

        const galleryBg = await bg(page.locator('#gallery').locator('xpath=..'));
        const documentsBg = await bg(page.locator('#documents'));
        expect(documentsBg).not.toBe(galleryBg);
    });
});

test.describe('Интерактивная карта', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/dom-kultury.html');
        await page.locator('#leaflet-map .leaflet-tile, #leaflet-map svg').first().waitFor({ timeout: 15000 });
    });

    test('карта рендерится без ошибок в консоли', async ({ page }) => {
        const errors = [];
        page.on('pageerror', (e) => errors.push(e.message));
        page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()); });

        await page.reload();
        await page.locator('#leaflet-map .leaflet-tile, #leaflet-map svg').first().waitFor({ timeout: 15000 });

        expect(errors, `Ошибки в консоли: ${errors.join('; ')}`).toEqual([]);
        await expect(page.locator('#leaflet-map.leaflet-container')).toBeVisible();
    });

    test('прокрутка колесом мыши над картой прокручивает страницу, а не залипает', async ({ page }) => {
        const map = page.locator('#leaflet-map');
        await map.scrollIntoViewIfNeeded();
        const box = await map.boundingBox();
        expect(box).not.toBeNull();

        const before = await page.evaluate(() => window.scrollY);
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await page.mouse.wheel(0, 600);
        await page.waitForTimeout(300);
        const after = await page.evaluate(() => window.scrollY);

        expect(after - before).toBeGreaterThan(200);
    });

    test('карта не пробивает sticky-шапку слоями Leaflet (z-index)', async ({ page }) => {
        // Дожидаемся, пока сплэш-скрин (z-index:9999, самый верхний слой при загрузке) уйдёт —
        // иначе он сам закроет собой точку проверки и тест ничего не докажет.
        await page.locator('#splash-screen').waitFor({ state: 'detached', timeout: 6000 }).catch(() => {});

        // Скроллим так, чтобы карта оказалась прямо под шапкой — зона максимального риска перекрытия
        await page.evaluate(() => {
            const rect = document.getElementById('leaflet-map').getBoundingClientRect();
            window.scrollTo({ top: window.scrollY + rect.top - 100, behavior: 'instant' });
        });
        await page.waitForTimeout(200);

        const header = page.locator('.header');
        await expect(header).toBeVisible();
        const headerBox = await header.boundingBox();

        // Точка внутри шапки, прямо над областью, где сейчас отрисована карта
        const point = { x: headerBox.x + headerBox.width / 2, y: headerBox.y + headerBox.height - 15 };

        const topElementInHeader = await page.evaluate(({ x, y }) => {
            const el = document.elementFromPoint(x, y);
            return !!el && !!el.closest('.header');
        }, point);

        expect(topElementInHeader, 'В точке над шапкой должен быть элемент самой шапки, а не слой Leaflet').toBe(true);

        const zIndexes = await page.evaluate(() => {
            const cs = (sel) => getComputedStyle(document.querySelector(sel));
            return {
                header: Number(cs('.header').zIndex),
                mapSection: Number(cs('.map-section').zIndex),
                mapSectionIsolation: cs('.map-section').isolation,
            };
        });
        expect(zIndexes.mapSectionIsolation).toBe('isolate');
        expect(zIndexes.header).toBeGreaterThan(zIndexes.mapSection);
    });
});
