const SOCIAL_ICONS = {
    Telegram: `<path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke="#1A3C6E" stroke-width="1.5"/>`,
    Instagram: `<rect x="2" y="2" width="20" height="20" rx="5" stroke="#1A3C6E" stroke-width="1.5"/>
                <circle cx="12" cy="12" r="4" stroke="#1A3C6E" stroke-width="1.5"/>`,
    Facebook: `<path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" stroke="#1A3C6E" stroke-width="1.5"/>`,
    YouTube: `<path d="M22.54 6.42a2.78 2.78 0 00-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 00-1.94 2A29 29 0 001 11.75a29 29 0 00.46 5.33A2.78 2.78 0 003.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 001.94-2 29 29 0 00.46-5.25 29 29 0 00-.46-5.33z" stroke="#1A3C6E" stroke-width="1.5"/>
               <path d="M9.75 15.02l5.75-3.27-5.75-3.27v6.54z" stroke="#1A3C6E" stroke-width="1.5"/>`,
};

window.renderContact = function(data) {
    const esc = window.escapeHtml;
    const safeUrl = u => /^https?:\/\/|^mailto:/.test(u) ? u : '#';

    const phoneLines = data.phones.map(p =>
        `<a href="tel:${esc(p.number.replace(/\s/g, ''))}">${esc(p.number)}</a> (${esc(p.label)})`
    ).join('<br>');

    const socialLinks = data.socials.map(s => `
        <a href="${safeUrl(s.url)}" class="social-link" aria-label="${esc(s.name)}">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                ${SOCIAL_ICONS[s.name] || ''}
            </svg>
        </a>
    `).join('');

    return `
<section class="section" id="contact">
    <div class="section-center">
        <h2 class="section-title">Свяжитесь с нами</h2>
        <p class="section-subtitle">Мы ответим на все ваши вопросы</p>
    </div>
    <div class="contact-grid">
        <form class="contact-form" id="contact-form" novalidate>
            <h3 class="form-title">Форма обратной связи</h3>
            <div class="form-group">
                <label class="form-label" for="field-name">Ваше имя *</label>
                <input type="text" id="field-name" name="name" class="form-input" placeholder="Введите ваше имя" required>
            </div>
            <div class="form-group">
                <label class="form-label" for="field-phone">Телефон *</label>
                <input type="tel" id="field-phone" name="phone" class="form-input" placeholder="+998 (__) ___-__-__" required>
            </div>
            <div class="form-group">
                <label class="form-label" for="field-email">Email</label>
                <input type="email" id="field-email" name="email" class="form-input" placeholder="example@mail.com">
            </div>
            <div class="form-group">
                <label class="form-label" for="field-topic">Тема обращения</label>
                <select id="field-topic" name="topic" class="form-select">
                    <option value="">Выберите тему</option>
                    <option value="circle">Запись в кружок</option>
                    <option value="rent">Аренда зала</option>
                    <option value="partner">Сотрудничество</option>
                    <option value="feedback">Жалоба или предложение</option>
                    <option value="other">Другое</option>
                </select>
            </div>
            <div class="form-group">
                <label class="form-label" for="field-message">Сообщение *</label>
                <textarea id="field-message" name="message" class="form-textarea" placeholder="Напишите ваше сообщение..." required></textarea>
            </div>
            <div class="form-checkbox">
                <input type="checkbox" id="consent" name="consent">
                <label for="consent">
                    Я согласен на обработку персональных данных в соответствии с
                    <a href="#documents">политикой конфиденциальности</a>
                </label>
            </div>
            <button type="submit" class="form-submit">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke="#fff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                Отправить сообщение
            </button>
        </form>

        <div>
            <div class="info-card">
                <h3 class="info-title">Контактная информация</h3>
                <div class="contact-items">
                    <div class="contact-item">
                        <div class="contact-item-icon purple">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" stroke="#1A3C6E" stroke-width="1.5"/>
                                <circle cx="12" cy="10" r="3" stroke="#1A3C6E" stroke-width="1.5"/>
                            </svg>
                        </div>
                        <div>
                            <p class="contact-item-label">Адрес</p>
                            <p class="contact-item-value">${esc(data.address)}<br>${esc(data.landmark)}</p>
                        </div>
                    </div>
                    <div class="contact-item">
                        <div class="contact-item-icon green">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" stroke="#0F6E56" stroke-width="1.5"/>
                            </svg>
                        </div>
                        <div>
                            <p class="contact-item-label">Телефоны</p>
                            <p class="contact-item-value">${phoneLines}</p>
                        </div>
                    </div>
                    <div class="contact-item">
                        <div class="contact-item-icon blue">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="#185FA5" stroke-width="1.5"/>
                                <path d="M22 6l-10 7L2 6" stroke="#185FA5" stroke-width="1.5"/>
                            </svg>
                        </div>
                        <div>
                            <p class="contact-item-label">Email</p>
                            <p class="contact-item-value">
                                <a href="mailto:${esc(data.email)}" class="contact-link">${esc(data.email)}</a>
                            </p>
                        </div>
                    </div>
                    <div class="contact-item">
                        <div class="contact-item-icon yellow">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                <circle cx="12" cy="12" r="10" stroke="#854F0B" stroke-width="1.5"/>
                                <path d="M12 6v6l4 2" stroke="#854F0B" stroke-width="1.5" stroke-linecap="round"/>
                            </svg>
                        </div>
                        <div>
                            <p class="contact-item-label">Режим работы</p>
                            <p class="contact-item-value">${esc(data.hours.weekdays)}<br>${esc(data.hours.weekends)}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div class="info-card">
                <h3 class="info-title">Мы в социальных сетях</h3>
                <div class="social-links">${socialLinks}</div>
            </div>

            <div class="map-wrap">
                <iframe
                    class="map-iframe"
                    src="https://maps.google.com/maps?q=${encodeURIComponent(data.address)}&output=embed&hl=ru&z=16"
                    allowfullscreen
                    loading="lazy"
                    referrerpolicy="no-referrer-when-downgrade"
                    title="Карта местоположения"
                ></iframe>
            </div>
        </div>
    </div>
</section>`;
};
