// РОЛЬ 1 (QA) — пункт f: переключатель языков RU/UZ/ЎЗ меняет контент;
// панель доступности (размер шрифта, контраст) реагирует.
const { test, expect } = require('@playwright/test');

test.describe('Переключатель языков', () => {
    test('RU -> UZ -> ЎЗ меняет текст навигации', async ({ page }) => {
        await page.goto('/dom-kultury.html');
        const navNews = page.locator('#nav-news');

        await page.locator('#lang-pill-btn').click();
        await page.locator('.lang-btn[data-lang="ru"]').click();
        await expect(navNews).toHaveText('Новости');

        await page.locator('#lang-pill-btn').click();
        await page.locator('.lang-btn[data-lang="uz"]').click();
        await expect(navNews).toHaveText(/Yangiliklar/i);

        await page.locator('#lang-pill-btn').click();
        await page.locator('.lang-btn[data-lang="oz"]').click();
        await expect(navNews).toHaveText('Янгиликлар');
    });

    test('выбор языка сохраняется в localStorage и переживает перезагрузку', async ({ page }) => {
        await page.goto('/dom-kultury.html');
        await page.locator('#lang-pill-btn').click();
        await page.locator('.lang-btn[data-lang="uz"]').click();
        await page.waitForTimeout(200);

        await page.reload();
        await expect(page.locator('#nav-news')).toHaveText(/Yangiliklar/i);
    });
});

test.describe('Панель доступности', () => {
    test('A+ / A- меняют размер шрифта документа', async ({ page }) => {
        await page.goto('/dom-kultury.html');
        await page.locator('#a11y-toggle-btn').click();
        await expect(page.locator('#a11y-panel')).toBeVisible();

        const before = await page.evaluate(() => document.documentElement.style.fontSize || getComputedStyle(document.documentElement).fontSize);
        await page.locator('#font-inc-btn').click();
        await page.locator('#font-inc-btn').click();
        const after = await page.evaluate(() => document.documentElement.style.fontSize);

        expect(after, 'Размер шрифта на <html> должен был измениться после A+').not.toBe('');
        expect(parseInt(after)).toBeGreaterThan(parseInt(before) || 16);
    });

    test('кнопка контраста включает режим высокого контраста', async ({ page }) => {
        await page.goto('/dom-kultury.html');
        await page.locator('#a11y-toggle-btn').click();
        await page.locator('#contrast-btn').click();

        const hasClass = await page.evaluate(() => document.body.classList.contains('high-contrast'));
        expect(hasClass, 'body должен получить класс .high-contrast после клика').toBe(true);
    });
});
