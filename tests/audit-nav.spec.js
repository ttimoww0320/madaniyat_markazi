// РОЛЬ 1 (QA) — пункт d: меню/навигация, включая дропдауны "Команда" и "Контакты";
// с внутренних страниц пункты-якоря должны вести на главную.
const { test, expect } = require('@playwright/test');

const ANCHOR_ITEMS = [
    ['nav-news', '#news'],
    ['nav-events', '#events'],
    ['nav-circles', '#circles'],
    ['nav-map', '#map'],
    ['nav-achievements', '#achievements'],
    ['nav-gallery', '#gallery'],
];

test.describe('Главное меню — главная страница (якоря на этой же странице)', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/dom-kultury.html');
    });

    for (const [id, expectedHash] of ANCHOR_ITEMS) {
        test(`#${id} ведёт на ${expectedHash} на самой странице`, async ({ page }) => {
            const href = await page.locator(`#${id}`).getAttribute('href');
            expect(href).toBe(expectedHash);
            const target = expectedHash.slice(1);
            await expect(page.locator(`#${target}`)).toBeAttached();
        });
    }

    test('"Документы" ведёт на отдельную страницу /documents.html', async ({ page }) => {
        await expect(page.locator('#nav-documents')).toHaveAttribute('href', '/documents.html');
    });
});

test.describe('Дропдаун "Команда"', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/dom-kultury.html');
    });

    test('открывается по клику (без наведения — тач/клавиатура) и содержит 3 корректных подпункта', async ({ page }) => {
        // dispatchEvent намеренно не двигает мышь и не эмулирует hover —
        // проверяем сам click-обработчик изолированно (см. отдельный тест
        // ниже про баг с hover+click на десктопе).
        await page.locator('#nav-team').dispatchEvent('click');
        await expect(page.locator('#nav-team')).toHaveAttribute('aria-expanded', 'true');
        await expect(page.locator('#nav-team-panel')).toBeVisible();

        await expect(page.locator('#nav-team-sub-director')).toHaveAttribute('href', '/team.html#team-director');
        await expect(page.locator('#nav-team-sub-deputies')).toHaveAttribute('href', '/team.html#team-deputies');
        await expect(page.locator('#nav-team-sub-staff')).toHaveAttribute('href', '/team.html#team-staff');
    });

    test('регрессия: на десктопе клик по пункту, уже открытому через hover, НЕ закрывает его', async ({ page }) => {
        // Реальный курсор мыши (Playwright .click()) сначала наводится на элемент —
        // это триггерит mouseenter/hover-открытие (см. partials/chrome.js). Раньше
        // handleNavDropdownClick после этого переключал СОСТОЯНИЕ (закрывал уже
        // открытое hover'ом меню); теперь на десктопе клик по триггеру только
        // держит панель открытой, закрывается она по mouseleave/Escape.
        await page.locator('#nav-team').hover();
        await expect(page.locator('#nav-team-dropdown')).toHaveClass(/open/);

        await page.locator('#nav-team').click();
        await expect(page.locator('#nav-team-dropdown'), 'Меню закрылось от клика сразу после hover-открытия — ожидалось, что останется открытым').toHaveClass(/open/);
    });
});

test.describe('Дропдаун "Контакты"', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/dom-kultury.html');
    });

    test('открывается по клику (без наведения — тач/клавиатура) и содержит 4 корректных подпункта', async ({ page }) => {
        await page.locator('#nav-contact').dispatchEvent('click');
        await expect(page.locator('#nav-contact')).toHaveAttribute('aria-expanded', 'true');
        await expect(page.locator('#nav-contact-panel')).toBeVisible();

        await expect(page.locator('#nav-contact-sub-contacts')).toHaveAttribute('href', '/contacts.html');
        await expect(page.locator('#nav-contact-sub-numbers')).toHaveAttribute('href', '/all-numbers.html');
        await expect(page.locator('#nav-contact-sub-bank')).toHaveAttribute('href', '/bank-details.html');
        await expect(page.locator('#nav-contact-sub-feedback')).toHaveAttribute('href', '/feedback.html');
    });
});

test.describe('Меню с внутренних страниц — якорные пункты ведут на главную', () => {
    for (const innerPage of ['team.html', 'documents.html', 'contacts.html']) {
        test(`с ${innerPage}: якорные пункты меню ведут на /dom-kultury.html#...`, async ({ page }) => {
            await page.goto(`/${innerPage}`);
            for (const [id, expectedHash] of ANCHOR_ITEMS) {
                const href = await page.locator(`#${id}`).getAttribute('href');
                expect(href, `#${id} на ${innerPage}`).toBe(`/dom-kultury.html${expectedHash}`);
            }
        });
    }
});

test.describe('Логотип / "На главную"', () => {
    test('логотип в шапке ведёт на главную с любой внутренней страницы', async ({ page }) => {
        await page.goto('/team.html');
        const href = await page.locator('.gov-locality').getAttribute('href');
        expect(href).toBe('/dom-kultury.html');
    });
});
