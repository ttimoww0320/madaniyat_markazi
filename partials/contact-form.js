// Форма «Оставить заявку/Обратная связь» — используется на главной (dom-kultury.html,
// секция #contact) и на feedback.html через document.write(). Логика отправки
// (валидация, POST /api/send-message) общая — initContactForm() в js/main.js
// биндится по id полей независимо от страницы.
(function () {
    window.CONTACT_FORM_HTML = `
    <div class="request-form-wrap">
        <form class="contact-form" id="contact-form" novalidate>
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label" id="lbl-name" for="field-name">Ваше имя *</label>
                    <input type="text" id="field-name" class="form-input" placeholder="Введите ваше имя" required>
                </div>
                <div class="form-group">
                    <label class="form-label" id="lbl-phone" for="field-phone">Телефон *</label>
                    <input type="tel" id="field-phone" class="form-input" placeholder="+998 (__) ___-__-__" required>
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label" id="lbl-email" for="field-email">Email</label>
                    <input type="email" id="field-email" class="form-input" placeholder="Необязательно">
                </div>
                <div class="form-group">
                    <label class="form-label" id="lbl-topic" for="field-topic">Тема обращения</label>
                    <select id="field-topic" class="form-select">
                        <option value="">Выберите тему</option>
                        <option value="circle">Запись в кружок</option>
                        <option value="rent">Аренда зала</option>
                        <option value="partner">Сотрудничество</option>
                        <option value="feedback">Жалоба или предложение</option>
                        <option value="other">Другое</option>
                    </select>
                </div>
            </div>
            <div class="form-group">
                <label class="form-label" id="lbl-message" for="field-message">Сообщение *</label>
                <textarea id="field-message" class="form-textarea" placeholder="Напишите ваше сообщение..." required></textarea>
            </div>
            <div class="form-checkbox">
                <input type="checkbox" id="consent">
                <label id="lbl-consent" for="consent">Я согласен на обработку персональных данных в соответствии с <a href="/documents.html">политикой конфиденциальности</a></label>
            </div>
            <button type="submit" class="form-submit">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke="#fff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <span id="btn-submit">Отправить заявку</span>
            </button>
        </form>
    </div>`;
})();
