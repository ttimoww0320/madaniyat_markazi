// Страница «Контакты» — переиспользует данные /api/contact (тот же источник,
// что и подвал сайта), поэтому телефон/адрес/e-mail/соцсети правятся в одном
// месте (data/contact.json) и не расходятся между шапкой, футером и этой
// страницей.

const CONTACTS_SOCIAL_ICONS = {
    Telegram:  '<svg viewBox="0 0 24 24" fill="none"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>',
    Instagram: '<svg viewBox="0 0 24 24" fill="none"><rect x="2" y="2" width="20" height="20" rx="5" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="12" r="4" stroke="currentColor" stroke-width="1.8"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/></svg>',
    Facebook:  '<svg viewBox="0 0 24 24" fill="none"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" stroke="currentColor" stroke-width="1.8"/></svg>',
    YouTube:   '<svg viewBox="0 0 24 24" fill="none"><rect x="2" y="5" width="20" height="14" rx="3" stroke="currentColor" stroke-width="1.8"/><path d="M10 9l5 3-5 3V9z" fill="currentColor"/></svg>',
};

function contactsSafeUrl(u) {
    try { const p = new URL(u); return (p.protocol === 'https:' || p.protocol === 'http:') ? p.href : '#'; } catch { return '#'; }
}

// ул. Осиё, 40, Юнусабадский район, Ташкент (OpenStreetMap Nominatim).
const CONTACTS_MAP_CENTER = [41.3278079, 69.2854031];
const CONTACTS_YANDEX_MAP_URL = `https://yandex.ru/maps/?ll=${CONTACTS_MAP_CENTER[1]},${CONTACTS_MAP_CENTER[0]}&z=16&pt=${CONTACTS_MAP_CENTER[1]},${CONTACTS_MAP_CENTER[0]}`;

window.renderContactsPage = function (data) {
    const esc = window.escapeHtml;
    const tbd = window.t('contact.tbd');

    const phone   = (data.phones || [])[0];
    const address = window.tData(data.address);
    const weekdays = data.hours && data.hours.weekdays ? window.tData(data.hours.weekdays) : '';

    const socialsHtml = (data.socials || []).map(s => `
        <a href="${contactsSafeUrl(s.url)}" target="_blank" rel="noopener" class="contacts-soc-btn" title="${esc(s.name)}">
            ${CONTACTS_SOCIAL_ICONS[s.name] || ''}
        </a>`).join('');

    const rows = [
        [window.t('contactsPage.phone'),    phone ? `<a href="tel:${esc(phone.number)}">${esc(phone.number)}</a>` : tbd],
        [window.t('contactsPage.website'),  `<a href="https://yunusobod-madaniyat.uz/" target="_blank" rel="noopener">yunusobod-madaniyat.uz</a>`],
        [window.t('contactsPage.email'),    data.email ? `<a href="mailto:${esc(data.email)}">${esc(data.email)}</a>` : tbd],
        [window.t('contactsPage.socials'),  socialsHtml || tbd],
        [window.t('contactsPage.address'),  address ? esc(address) : tbd],
        [window.t('contactsPage.hours'),    (weekdays ? esc(weekdays) : tbd) + '; ' + esc(window.t('contactsPage.hoursExtra'))],
    ];

    const rowsHtml = rows.map(([label, value]) =>
        `<tr><th>${esc(label)}</th><td>${value}</td></tr>`
    ).join('');

    return `
<section class="section" id="contacts-page">
    <div class="section-block">
        <h1 class="section-title">${window.t('nav.contact')}</h1>
        <p class="section-subtitle">${window.t('contactsPage.subtitle')}</p>
    </div>

    <div class="contacts-table-wrap">
        <table class="contacts-table">
            <tbody>${rowsHtml}</tbody>
        </table>
    </div>

    <div class="contacts-map-block">
        <h2 class="contacts-map-title">${window.t('contactsPage.mapTitle')}</h2>
        <div id="contacts-leaflet-map" class="contacts-leaflet-map"></div>
        <a href="${CONTACTS_YANDEX_MAP_URL}" target="_blank" rel="noopener" class="contacts-map-yandex-link">${window.t('contactsPage.openYandex')}</a>
    </div>
</section>`;
};

/* ── Простая Leaflet-карта с одним маркером (вызывается после вставки HTML) ── */
window._contactsAfterRender = function (data) {
    if (!window.L || !document.getElementById('contacts-leaflet-map')) return;
    if (window._contactsLeafletMap) { window._contactsLeafletMap.remove(); window._contactsLeafletMap = null; }

    const center = CONTACTS_MAP_CENTER;

    const map = L.map('contacts-leaflet-map', {
        center, zoom: 16, zoomControl: true, scrollWheelZoom: false,
    });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/">OpenStreetMap</a>',
        maxZoom: 18,
    }).addTo(map);

    const address = window.tData(data.address) || '';
    L.marker(center).addTo(map).bindPopup(window.escapeHtml(address)).openPopup();

    // Клик по карте (не по элементам управления) открывает эту точку в Яндекс Картах.
    map.on('click', () => window.open(CONTACTS_YANDEX_MAP_URL, '_blank', 'noopener'));

    window._contactsLeafletMap = map;
};
