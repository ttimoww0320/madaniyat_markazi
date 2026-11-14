// РОЛЬ 1 (QA) — пункт e: формы (feedback.html и "Оставить заявку" на главной) —
// заполнение/сабмит, валидация пустых обязательных полей, маска телефона.
//
// ВАЖНО: /api/send-message реально пересылает сообщение в Telegram-бот проекта.
// Чтобы тест не заспамил боевой чат тестовыми данными, сетевой запрос к этому
// эндпоинту здесь ПЕРЕХВАЧЕН (page.route) и не уходит на реальный сервер —
// проверяется только клиентское поведение формы.
const { test, expect } = require('@playwright/test');

const FORM_PAGES = [
    { label: 'feedback.html (форма обратной связи)', url: '/feedback.html' },
    { label: 'dom-kultury.html #contact (форма "Оставить заявку")', url: '/dom-kultury.html#contact' },
];

for (const { label, url } of FORM_PAGES) {
    test.describe(`Форма: ${label}`, () => {
        test('пустая обязательная форма не отправляется (нативная HTML5-валидация required)', async ({ page }) => {
            await page.goto(url);
            const form = page.locator('#contact-form');
            await expect(form).toBeAttached();

            let requestFired = false;
            await page.route('**/api/send-message', (route) => { requestFired = true; route.abort(); });

            await page.locator('.form-submit').click();
            await page.waitForTimeout(300);

            expect(requestFired, 'Запрос к /api/send-message не должен уйти при пустых полях').toBe(false);

            const nameValid = await page.locator('#field-name').evaluate(el => el.checkValidity());
            expect(nameValid, 'Поле "Имя" помечено required — браузер должен блокировать сабмит').toBe(false);
        });

        test('корректно заполненная форма отправляется и показывает успех', async ({ page }) => {
            await page.goto(url);

            await page.route('**/api/send-message', (route) =>
                route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true }) })
            );

            await page.locator('#field-name').fill('QA Тест');
            await page.locator('#field-phone').fill('+998901234567');
            const messageField = page.locator('#field-message');
            await messageField.fill('Автоматический тест перед продом, игнорировать.');
            const consent = page.locator('#consent');
            if (await consent.count()) await consent.check();

            await page.locator('.form-submit').click();
            await expect(page.locator('#btn-submit')).toContainText(/отправ|yubor|junat/i, { timeout: 5000 });
        });

        test('поле телефона: маска отбрасывает буквы, оставляет цифры и + ( ) -', async ({ page }) => {
            await page.goto(url);
            const phone = page.locator('#field-phone');
            await phone.pressSequentially('+998 (90) 123-45-67abc');
            expect(await phone.inputValue()).toBe('+998 (90) 123-45-67');
        });

        test('honeypot-поле есть и скрыто от пользователя', async ({ page }) => {
            await page.goto(url);
            const hp = page.locator('#field-website');
            await expect(hp).toHaveCount(1);
            await expect(hp).not.toBeInViewport();
        });
    });
}
