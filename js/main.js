// Список секций: id контейнера → render-функция
const SECTIONS = [
    { id: 'section-news',         api: 'news',         render: () => window.renderNews         },
    { id: 'section-events',       api: 'events',       render: () => window.renderEvents       },
    { id: 'section-circles',      api: 'circles',      render: () => window.renderCircles      },
    { id: 'section-map',          api: 'map',          render: () => window.renderMap          },
    { id: 'section-achievements', api: 'achievements', render: () => window.renderAchievements },
    { id: 'section-team',         api: 'team',         render: () => window.renderTeam         },
    { id: 'section-gallery',      api: 'gallery',      render: () => window.renderGallery      },
    { id: 'section-documents',    api: 'documents',    render: () => window.renderDocuments    },
];

// Секции у которых есть .section-gray обёртка
const GRAY_SECTIONS = new Set(['circles', 'documents', 'gallery']);

// Кэш загруженных данных — нужен для перерендера при смене языка
const _cache = {};
let   _cachedSiteData = null;

async function loadSections() {
    await Promise.all(
        SECTIONS.map(async ({ id, api, render }) => {
            try {
                const res  = await fetch(`/api/${api}`);
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const data = await res.json();
                _cache[api] = data;
                const el   = document.getElementById(id);
                if (el) el.innerHTML = render()(data);
                if (api === 'map' && window._mapAfterRender) window._mapAfterRender(data);
            } catch (err) {
                console.error(`Ошибка загрузки секции "${api}":`, err);
            }
        })
    );
}

// Перерендерить все секции с закэшированными данными (при смене языка)
function rerenderSections() {
    SECTIONS.forEach(({ id, api, render }) => {
        if (!_cache[api]) return;
        const el = document.getElementById(id);
        if (el) el.innerHTML = render()(_cache[api]);
        if (api === 'map' && window._mapAfterRender) window._mapAfterRender(_cache[api]);
    });
}

// Применяет фоны — вызывается ПОСЛЕ отрисовки секций
function applyBackgrounds(siteData) {
    const globalBg = siteData.globalBg || '';
    const bgs      = siteData.backgrounds || {};

    if (globalBg) {
        document.body.style.backgroundImage      = `url('${globalBg}')`;
        document.body.style.backgroundSize       = 'cover';
        document.body.style.backgroundPosition   = 'center top';
        document.body.style.backgroundRepeat     = 'no-repeat';
        document.body.style.backgroundAttachment = 'fixed';
        document.body.classList.add('has-global-bg');
        return;
    }

    document.body.style.backgroundImage = '';
    document.body.classList.remove('has-global-bg');

    Object.entries(bgs).forEach(([key, url]) => {
        if (!url) return;

        let el = null;
        if (key === 'hero') {
            el = document.querySelector('.hero');
        } else {
            const container = document.getElementById(`section-${key}`);
            if (container) {
                el = GRAY_SECTIONS.has(key)
                    ? container.querySelector('.section-gray') || container
                    : container;
            }
        }

        if (el) {
            el.style.backgroundImage    = `url('${url}')`;
            el.style.backgroundSize     = 'cover';
            el.style.backgroundPosition = 'center';
            el.style.backgroundRepeat   = 'no-repeat';
        }
    });
}

// Применить данные из site.json к DOM
function applySiteData(data) {
    const set     = (id, text) => { const el = document.getElementById(id); if (el) el.textContent = text; };
    const setAttr = (id, attr, val) => { const el = document.getElementById(id); if (el) el.setAttribute(attr, val); };

    if (data.header) set('logo-text', window.tData(data.header.logoText));

    if (data.hero) {
        set('hero-title',    window.tData(data.hero.title));
        set('hero-subtitle', window.tData(data.hero.subtitle));
        if (data.hero.btn1Text) {
            set('hero-btn1', window.tData(data.hero.btn1Text));
            setAttr('hero-btn1', 'href', data.hero.btn1Href);
        }
        if (data.hero.btn2Text) {
            set('hero-btn2', window.tData(data.hero.btn2Text));
            setAttr('hero-btn2', 'href', data.hero.btn2Href);
        }
    }

    if (data.footer) {
        set('footer-logo-text', window.tData(data.footer.logoText));
        set('footer-copyright', window.tData(data.footer.copyright));

        const req = document.getElementById('footer-requisites');
        if (req) {
            req.innerHTML = [
                data.footer.logoText   ? `<p><strong>${window.tData(data.footer.logoText)}</strong></p>` : '',
                data.footer.address    ? `<p>${window.tData(data.footer.address)}</p>` : '',
                data.footer.inn        ? `<p>ИНН: ${data.footer.inn}</p>` : '',
                data.footer.workHours  ? `<p>${window.tData(data.footer.workHours)}</p>` : '',
            ].join('');
        }
    }

    if (data.stats && data.stats.length) {
        const bar = document.getElementById('stats-bar');
        if (bar) {
            bar.innerHTML = data.stats.map(s =>
                `<div class="stat-item">
                    <span class="stat-num" data-target="${s.value}" data-suffix="${s.suffix || ''}">0</span>
                    <span class="stat-label">${window.tData(s.label)}</span>
                </div>`
            ).join('');
            if (window.initStatsAnimation) window.initStatsAnimation();
        }
    }
}

async function loadSite() {
    const res = await fetch('/api/site');
    if (!res.ok) return null;
    const data = await res.json();
    _cachedSiteData = data;
    applySiteData(data);
    return data;
}

// Обновить статические строки навигации
function applyNavStrings() {
    const navMap = {
        'nav-news':         'nav.news',
        'nav-events':       'nav.events',
        'nav-circles':      'nav.circles',
        'nav-map':          'nav.map',
        'nav-achievements': 'nav.achievements',
        'nav-team':         'nav.team',
        'nav-gallery':      'nav.gallery',
        'nav-documents':    'nav.documents',
    };
    Object.entries(navMap).forEach(([id, key]) => {
        const el = document.getElementById(id);
        if (el) el.textContent = window.t(key);
    });
}

// Обновить форму контакта при смене языка
function applyContactStrings() {
    const map = {
        'contact-form-title':    'contact.title',
        'contact-form-subtitle': 'contact.subtitle',
        'lbl-name':    'contact.name',
        'lbl-phone':   'contact.phone',
        'lbl-email':   'contact.email',
        'lbl-topic':   'contact.topic',
        'lbl-message': 'contact.message',
        'lbl-consent': 'contact.consent',
        'btn-submit':  'contact.submit',
    };
    Object.entries(map).forEach(([id, key]) => {
        const el = document.getElementById(id);
        if (el) el.textContent = window.t(key);
    });

    const placeholders = {
        'field-name':    'contact.namePh',
        'field-phone':   'contact.phonePh',
        'field-email':   'contact.emailPh',
        'field-message': 'contact.messagePh',
    };
    Object.entries(placeholders).forEach(([id, key]) => {
        const el = document.getElementById(id);
        if (el) el.placeholder = window.t(key);
    });

    // Select options
    const topicSel = document.getElementById('field-topic');
    if (topicSel) {
        topicSel.options[0].text = window.t('contact.topicPh');
        const topicKeys = ['', 'contact.topicCircle', 'contact.topicRent', 'contact.topicPartner', 'contact.topicFeedback', 'contact.topicOther'];
        [...topicSel.options].forEach((opt, i) => {
            if (i > 0 && topicKeys[i]) opt.text = window.t(topicKeys[i]);
        });
    }

    // Footer official text
    const off = document.getElementById('footer-official');
    if (off) off.textContent = window.t('footer.official');
}

async function loadContactFooter() {
    try {
        const res = await fetch('/api/contact');
        if (!res.ok) return;
        const d = await res.json();
        const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');

        const el = document.getElementById('footer-contact-list');
        if (el) {
            el.innerHTML = [
                d.address ? `<div class="footer-contact-item"><span class="fci-icon">📍</span><span>${esc(window.tData(d.address))}</span></div>` : '',
                ...(d.phones || []).map(p =>
                    `<div class="footer-contact-item"><span class="fci-icon">📞</span><a href="tel:${p.number}">${esc(p.number)}</a></div>`),
                d.email ? `<div class="footer-contact-item"><span class="fci-icon">✉️</span><a href="mailto:${esc(d.email)}">${esc(d.email)}</a></div>` : '',
                d.hours?.weekdays ? `<div class="footer-contact-item"><span class="fci-icon">🕐</span><span>${esc(window.tData(d.hours.weekdays))}</span></div>` : '',
            ].join('');
        }

        const socEl = document.getElementById('footer-socials-row');
        if (socEl && d.socials?.length) {
            const icons = {
                Telegram:  `<svg viewBox="0 0 24 24" fill="none"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>`,
                Instagram: `<svg viewBox="0 0 24 24" fill="none"><rect x="2" y="2" width="20" height="20" rx="5" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="12" r="4" stroke="currentColor" stroke-width="1.8"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/></svg>`,
                Facebook:  `<svg viewBox="0 0 24 24" fill="none"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" stroke="currentColor" stroke-width="1.8"/></svg>`,
                YouTube:   `<svg viewBox="0 0 24 24" fill="none"><rect x="2" y="5" width="20" height="14" rx="3" stroke="currentColor" stroke-width="1.8"/><path d="M10 9l5 3-5 3V9z" fill="currentColor"/></svg>`,
            };
            const safeUrl = u => { try { const p = new URL(u); return (p.protocol === 'https:' || p.protocol === 'http:') ? p.href : '#'; } catch { return '#'; } };
            socEl.innerHTML = d.socials.map(s => `
                <a href="${safeUrl(s.url)}" target="_blank" rel="noopener" class="footer-soc-btn" title="${esc(s.name)}">
                    ${icons[s.name] || '🔗'}
                </a>`).join('');
        }
    } catch (e) {
        console.warn('[loadContactFooter] Не удалось загрузить контакты:', e.message);
    }
}

function initContactForm() {
    const form = document.getElementById('contact-form');
    if (!form) return;

    const name    = document.getElementById('field-name');
    const phone   = document.getElementById('field-phone');
    const email   = document.getElementById('field-email');
    const topic   = document.getElementById('field-topic');
    const message = document.getElementById('field-message');
    const consent = document.getElementById('consent');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        let valid = true;
        [name, phone, message].forEach((field) => {
            if (!field.value.trim()) { field.style.borderColor = '#e53e3e'; valid = false; }
            else field.style.borderColor = '';
        });

        if (!consent.checked) {
            consent.closest('.form-checkbox').style.outline = '2px solid #e53e3e';
            valid = false;
        } else {
            consent.closest('.form-checkbox').style.outline = '';
        }

        if (!valid) return;

        const btn = form.querySelector('.form-submit');
        const originalHTML = btn.innerHTML;
        btn.innerHTML = window.t('contact.sending');
        btn.disabled  = true;

        try {
            const res = await fetch('/api/send-message', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name:    name.value.trim(),
                    phone:   phone.value.trim(),
                    email:   email ? email.value.trim() : '',
                    topic:   topic ? topic.value : '',
                    message: message.value.trim()
                })
            });

            if (res.ok) {
                btn.innerHTML = window.t('contact.sent');
                btn.style.background = '#1D9E75';
                form.reset();
            } else {
                btn.innerHTML = window.t('contact.error');
                btn.style.background = '#e53e3e';
                btn.disabled = false;
            }
        } catch {
            btn.innerHTML = window.t('contact.noConn');
            btn.style.background = '#e53e3e';
            btn.disabled = false;
        }

        setTimeout(() => {
            btn.innerHTML = originalHTML;
            btn.disabled  = false;
            btn.style.background = '';
        }, 4000);
    });

    form.querySelectorAll('.form-input, .form-textarea').forEach((field) => {
        field.addEventListener('input', () => { field.style.borderColor = ''; });
    });

    consent.addEventListener('change', () => {
        consent.closest('.form-checkbox').style.outline = '';
    });
}

// При смене языка — всё перерисовываем
document.addEventListener('langchange', () => {
    applyNavStrings();
    applyContactStrings();
    rerenderSections();
    if (_cachedSiteData) {
        applySiteData(_cachedSiteData);
        applyBackgrounds(_cachedSiteData);
    }
    loadContactFooter();
});

// Общая утилита для кнопок «показать ещё / скрыть»
window._toggleSection = function(itemSelector, btnId) {
    const items = document.querySelectorAll(itemSelector);
    const btn   = document.getElementById(btnId);
    if (!items.length || !btn) return;
    const open = items[0].style.display === 'none';
    items.forEach(el => el.style.display = open ? '' : 'none');
    btn.textContent = open ? window.t('btn.hideAll') : window.t('btn.showAll');
};

// Запускаем после загрузки DOM
document.addEventListener('DOMContentLoaded', async () => {
    // Сначала инициализируем i18n
    await window.i18n.init();

    // Потом грузим всё параллельно
    const [siteData] = await Promise.all([loadSite(), loadSections(), loadContactFooter()]);

    // Фоны применяем ПОСЛЕ того как секции отрисованы
    if (siteData) applyBackgrounds(siteData);

    // Статические строки
    applyNavStrings();
    applyContactStrings();

    // Инициализируем форму
    initContactForm();
});
