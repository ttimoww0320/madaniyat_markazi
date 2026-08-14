// Список секций: id контейнера → render-функция.
// section-team/section-documents — полные секции (team.html, documents.html);
// section-team-teaser/section-documents-teaser — компактные анонсы на главной.
// На каждой странице реально существует только часть контейнеров — loadSections()
// фетчит и рендерит только то, что найдёт в DOM.
const SECTIONS = [
    { id: 'section-news',              api: 'news',         render: () => window.renderNews             },
    { id: 'section-events',            api: 'events',       render: () => window.renderEvents           },
    { id: 'section-circles',           api: 'circles',      render: () => window.renderCircles          },
    { id: 'section-map',               api: 'map',          render: () => window.renderMap              },
    { id: 'section-achievements',      api: 'achievements', render: () => window.renderAchievements     },
    { id: 'section-team',              api: 'team',         render: () => window.renderTeam             },
    { id: 'section-team-teaser',       api: 'team',         render: () => window.renderTeamTeaser       },
    { id: 'section-gallery',           api: 'gallery',      render: () => window.renderGallery          },
    { id: 'section-documents',         api: 'documents',    render: () => window.renderDocuments        },
    { id: 'section-documents-teaser',  api: 'documents',    render: () => window.renderDocumentsTeaser  },
    { id: 'section-contacts',          api: 'contact',      render: () => window.renderContactsPage     },
    { id: 'section-all-numbers',       api: 'team',         render: () => window.renderAllNumbers       },
];

// Секции у которых есть .section-gray обёртка
const GRAY_SECTIONS = new Set(['circles', 'documents', 'gallery']);

// Кэш загруженных данных — нужен для перерендера при смене языка
const _cache = {};
let   _cachedSiteData = null;

async function loadSections() {
    // Поисковый индекс собираем заново при каждой полной загрузке секций —
    // динамический контент (новости/кружки/события/документы/команда)
    // добавляется в индекс сразу после рендера соответствующей секции.
    window.searchIndexReset();

    // На отдельных страницах (team.html, documents.html и т.п.) в DOM есть только
    // часть контейнеров — не тратим запросы на секции, которых на странице нет.
    const activeSections = SECTIONS.filter(({ id }) => document.getElementById(id));
    await Promise.all(
        activeSections.map(async ({ id, api, render }) => {
            try {
                const res  = await fetch(`/api/${api}`);
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const data = await res.json();
                _cache[api] = data;
                const el   = document.getElementById(id);
                if (el) {
                    el.innerHTML = render()(data);
                    applyScrollAnimation(el);
                    window.searchIndexAddSection(api, data);
                }
                if (api === 'map' && window._mapAfterRender) window._mapAfterRender(data);
                if (id === 'section-contacts' && window._contactsAfterRender) window._contactsAfterRender(data);
            } catch (err) {
                console.error(`Ошибка загрузки секции "${api}":`, err);
                const el = document.getElementById(id);
                if (el) el.innerHTML = `<div style="padding:40px;text-align:center;color:#999;font-size:14px;">${window.t('errors.sectionLoad')}</div>`;
            }
        })
    );
}

// Перерендерить все секции с закэшированными данными (при смене языка)
function rerenderSections() {
    window.searchIndexReset();
    SECTIONS.forEach(({ id, api, render }) => {
        if (!_cache[api]) return;
        const el = document.getElementById(id);
        if (el) {
            el.innerHTML = render()(_cache[api]);
            applyScrollAnimation(el);
            window.searchIndexAddSection(api, _cache[api]);
        }
        if (api === 'map' && window._mapAfterRender) window._mapAfterRender(_cache[api]);
        if (id === 'section-contacts' && window._contactsAfterRender) window._contactsAfterRender(_cache[api]);
    });
}

// Применяет фоны — вызывается ПОСЛЕ отрисовки секций
function applyBackgrounds(siteData) {
    const globalBg = siteData.globalBg || '';
    const bgs      = siteData.backgrounds || {};
    const hero     = document.querySelector('.hero');

    if (globalBg) {
        document.body.style.backgroundImage      = `url('${globalBg}')`;
        document.body.style.backgroundSize       = 'cover';
        document.body.style.backgroundPosition   = 'center top';
        document.body.style.backgroundRepeat     = 'no-repeat';
        document.body.style.backgroundAttachment = 'fixed';
        document.body.classList.add('has-global-bg');
        if (hero) hero.classList.add('has-hero-photo');
        return;
    }

    document.body.style.backgroundImage = '';
    document.body.classList.remove('has-global-bg');
    if (hero && !bgs.hero) hero.classList.remove('has-hero-photo');

    Object.entries(bgs).forEach(([key, url]) => {
        if (!url) return;

        let el = null;
        if (key === 'hero') {
            el = hero;
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
            if (key === 'hero') el.classList.add('has-hero-photo');
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
            const esc = window.escapeHtml;
            req.innerHTML = [
                data.footer.logoText   ? `<p><strong>${esc(window.tData(data.footer.logoText))}</strong></p>` : '',
                data.footer.address    ? `<p>${esc(window.tData(data.footer.address))}</p>` : '',
                data.footer.inn        ? `<p>ИНН: ${esc(data.footer.inn)}</p>` : '',
                data.footer.workHours  ? `<p>${esc(window.tData(data.footer.workHours))}</p>` : '',
            ].join('');
        }
    }

    const bar = document.getElementById('stats-bar');
    if (bar) {
        const esc = window.escapeHtml;
        const tiles = (data.stats && data.stats.length)
            ? data.stats.map(s =>
                `<div class="stat-item">
                    <span class="stat-num" data-target="${esc(s.value)}" data-suffix="${esc(s.suffix || '')}">0</span>
                    <span class="stat-label">${esc(window.tData(s.label))}</span>
                </div>`
              ).join('')
            : '';
        if (tiles) {
            bar.innerHTML = tiles;
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

// Человекочитаемое "N минут назад" по ISO-дате
window.formatRelativeTime = function(iso) {
    if (!iso) return '';
    const diffMs = Date.now() - new Date(iso).getTime();
    const min = Math.floor(diffMs / 60000);
    if (min < 1)  return window.t('freshness.justNow');
    if (min < 60) return window.t('freshness.minutesAgo').replace('{n}', min);
    const hours = Math.floor(min / 60);
    if (hours < 24) return window.t('freshness.hoursAgo').replace('{n}', hours);
    const days = Math.floor(hours / 24);
    return window.t('freshness.daysAgo').replace('{n}', days);
};

async function loadFreshness() {
    try {
        const res = await fetch('/api/health');
        if (!res.ok) return;
        const data = await res.json();
        window._newsUpdatedAt    = data.newsUpdatedAt    || null;
        window._galleryUpdatedAt = data.galleryUpdatedAt || null;
    } catch {}
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
        'nav-contact':      'nav.contact',
    };
    Object.entries(navMap).forEach(([id, key]) => {
        const el = document.getElementById(id);
        if (!el) return;
        // У пунктов с dropdown (напр. "Команда") текст лежит в .nav-dropdown-label —
        // рядом со стрелкой-шевроном, которую textContent стёр бы целиком.
        const label = el.querySelector('.nav-dropdown-label');
        if (label) label.textContent = window.t(key); else el.textContent = window.t(key);
    });

    const navDropdownSubMap = {
        'nav-team-sub-director':    'team.nav.director',
        'nav-team-sub-deputies':    'team.nav.deputies',
        'nav-team-sub-staff':       'team.nav.staff',
        'nav-contact-sub-contacts': 'nav.contact',
        'nav-contact-sub-numbers':  'contact.nav.allNumbers',
        'nav-contact-sub-bank':     'contact.nav.bankDetails',
        'nav-contact-sub-feedback': 'contact.nav.feedback',
    };
    Object.entries(navDropdownSubMap).forEach(([id, key]) => {
        const el = document.getElementById(id);
        if (el) el.textContent = window.t(key);
    });

    const footerNavMap = {
        'footer-fnav-news':         'nav.news',
        'footer-fnav-events':       'nav.events',
        'footer-fnav-circles':      'nav.circles',
        'footer-fnav-map':          'nav.map',
        'footer-fnav-achievements': 'nav.achievements',
        'footer-fnav-team':         'nav.team',
        'footer-fnav-gallery':      'nav.gallery',
        'footer-fnav-documents':    'nav.documents',
        'footer-fnav-contact':      'nav.contact',
    };
    Object.entries(footerNavMap).forEach(([id, key]) => {
        const el = document.getElementById(id);
        if (el) el.textContent = window.t(key);
    });

    const SITEMAP_ICON_PATHS = {
        news:         '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M9 4v16"/>',
        events:       '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
        circles:      '<circle cx="12" cy="12" r="3"/><path d="M12 2v4m0 12v4m10-10h-4M6 12H2"/>',
        map:          '<path d="M9 20l-6-3V4l6 3 6-3 6 3v13l-6-3-6 3z"/><path d="M9 4v13M15 7v13"/>',
        achievements: '<circle cx="12" cy="8" r="4"/><path d="M8 14l-2 7h12l-2-7"/>',
        team:         '<circle cx="9" cy="8" r="3"/><path d="M2 20c0-3.5 3-5 7-5s7 1.5 7 5"/><circle cx="17.5" cy="9" r="2.3"/><path d="M23 20c0-2.7-2-4.3-4.5-4.7"/>',
        gallery:      '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/>',
        documents:    '<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/>',
        contact:      '<path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/>',
    };
    const sitemapNavMap = {
        'sitemap-news':         ['news', 'nav.news'],
        'sitemap-events':       ['events', 'nav.events'],
        'sitemap-circles':      ['circles', 'nav.circles'],
        'sitemap-map':          ['map', 'nav.map'],
        'sitemap-achievements': ['achievements', 'nav.achievements'],
        'sitemap-team':         ['team', 'nav.team'],
        'sitemap-gallery':      ['gallery', 'nav.gallery'],
        'sitemap-documents':    ['documents', 'nav.documents'],
        'sitemap-contact':      ['contact', 'nav.contact'],
    };
    Object.entries(sitemapNavMap).forEach(([id, [iconKey, key]]) => {
        const el = document.getElementById(id);
        if (!el) return;
        const icon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${SITEMAP_ICON_PATHS[iconKey]}</svg>`;
        el.innerHTML = icon + window.escapeHtml(window.t(key));
    });

    // Хлебные крошки на отдельных страницах (team.html, documents.html)
    const bcHome = document.getElementById('bc-home');
    if (bcHome) bcHome.textContent = window.t('nav.home');
    const bcCurrent = document.getElementById('bc-current');
    if (bcCurrent && bcCurrent.dataset.i18n) bcCurrent.textContent = window.t(bcCurrent.dataset.i18n);
    const bcMid = document.getElementById('bc-mid');
    if (bcMid && bcMid.dataset.i18n) bcMid.textContent = window.t(bcMid.dataset.i18n);
    const bcNav = document.querySelector('.breadcrumbs');
    if (bcNav) bcNav.setAttribute('aria-label', window.t('a11y.breadcrumbs'));

    const contactsLabel = document.getElementById('gov-contacts-label');
    if (contactsLabel) contactsLabel.textContent = window.t('nav.contact');

    // Гос.плашка шапки (пилюля с названием хокимията, "ОФИЦИАЛЬНЫЙ САЙТ" + район, герб, баннер)
    const govTextMap = {
        'gov-orgs-pill-text': 'gov.orgsPill',
        'gov-official-label': 'gov.officialSite',
        'gov-locality-text':  'gov.localityName',
    };
    Object.entries(govTextMap).forEach(([id, key]) => {
        const el = document.getElementById(id);
        if (el) el.textContent = window.t(key);
    });
    const govLocalityLink = document.getElementById('gov-locality-link');
    if (govLocalityLink) govLocalityLink.setAttribute('aria-label', window.t('gov.homeAria'));
    const govEmblemImg = document.getElementById('gov-emblem-img');
    if (govEmblemImg) govEmblemImg.setAttribute('alt', window.t('gov.emblemAlt'));
    const govBannerImg = document.getElementById('gov-building-banner-img');
    if (govBannerImg) govBannerImg.setAttribute('alt', window.t('gov.bannerAlt'));

    const searchInput = document.getElementById('site-search-input');
    if (searchInput) {
        searchInput.placeholder = window.t('search.placeholder');
        searchInput.setAttribute('aria-label', window.t('search.ariaLabel'));
    }
    const searchBtn = document.querySelector('.header-search-btn');
    if (searchBtn) {
        searchBtn.setAttribute('aria-label', window.t('search.ariaLabel'));
        searchBtn.setAttribute('title', window.t('search.ariaLabel'));
    }
    const searchClose = document.getElementById('site-search-close');
    if (searchClose) searchClose.setAttribute('aria-label', window.t('search.close'));
    const searchOverlay = document.getElementById('site-search-overlay');
    if (searchOverlay) searchOverlay.setAttribute('aria-label', window.t('search.ariaLabel'));
    // Если панель открыта при смене языка — переотрисуем результаты под новый язык
    const currentQuery = searchInput ? searchInput.value.trim() : '';
    if (currentQuery.length >= 2 && searchOverlay && searchOverlay.classList.contains('open')) {
        window.searchRenderResults && window.searchRenderResults(currentQuery);
    }
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

    // Footer col titles + official text
    const off = document.getElementById('footer-official');
    if (off) off.textContent = window.t('footer.official');
    const navTitle = document.getElementById('footer-col-nav-title');
    if (navTitle) navTitle.textContent = window.t('footer.sections');
    const contactsTitle = document.getElementById('footer-col-contacts-title');
    if (contactsTitle) contactsTitle.textContent = window.t('nav.contact');
}

// Универсальный перевод статичной разметки: <span data-i18n="ключ">.
// Используется на страницах-«скелетах» (bank-details.html и т.п.), где нет
// смысла заводить отдельный render()/API — значения там всё равно плейсхолдеры.
// bc-current/bc-mid переводятся отдельно в applyNavStrings (крошки нужны раньше).
function applyGenericI18n() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        if (el.id === 'bc-current' || el.id === 'bc-mid') return;
        el.textContent = window.t(el.dataset.i18n);
    });
}

// aria-label/title у статичных элементов шапки и модалок (не перерисовываются — переводим отдельно)
function applyA11yStrings() {
    const attrMap = {
        'main-nav':          { 'aria-label': 'a11y.mainNav' },
        'access-btns':       { 'aria-label': 'a11y.accessibility' },
        'font-inc-btn':      { title: 'a11y.increaseFont', 'aria-label': 'a11y.increaseFont' },
        'font-dec-btn':      { title: 'a11y.decreaseFont', 'aria-label': 'a11y.decreaseFont' },
        'contrast-btn':      { title: 'a11y.contrastTitle', 'aria-label': 'a11y.contrastLabel' },
        'a11y-toggle-btn':   { title: 'a11y.specialFeatures', 'aria-label': 'a11y.specialFeatures' },
        'sitemap-btn':       { title: 'a11y.sitemap', 'aria-label': 'a11y.sitemap' },
        'burger-btn':        { 'aria-label': 'a11y.menu' },
        'enroll-close-btn':  { 'aria-label': 'a11y.close' },
        'bio-close-btn':     { 'aria-label': 'a11y.close' },
        'lb-close-btn':      { 'aria-label': 'a11y.close' },
        'lb-prev':           { 'aria-label': 'a11y.back' },
        'lb-next':           { 'aria-label': 'a11y.next' },
        'back-to-top':       { 'aria-label': 'a11y.backToTop' },
    };
    Object.entries(attrMap).forEach(([id, attrs]) => {
        const el = document.getElementById(id);
        if (!el) return;
        Object.entries(attrs).forEach(([attr, key]) => el.setAttribute(attr, window.t(key)));
    });

    const textMap = {
        'a11y-panel-title':    'a11y.specialFeatures',
        'sitemap-panel-title': 'a11y.sitemap',
        'a11y-font-label':     'a11y.fontSize',
        'a11y-contrast-label': 'a11y.contrastLabel',
    };
    Object.entries(textMap).forEach(([id, key]) => {
        const el = document.getElementById(id);
        if (el) el.textContent = window.t(key);
    });
}

async function loadContactFooter() {
    try {
        const res = await fetch('/api/contact');
        if (!res.ok) return;
        const d = await res.json();
        const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');

        const FCI_ICONS = {
            pin:    '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>',
            phone:  '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>',
            mail:   '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><path d="M22 6l-10 7L2 6"/></svg>',
            clock:  '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>',
        };

        const contactItemsHtml = [
            d.address ? `<div class="footer-contact-item"><span class="fci-icon">${FCI_ICONS.pin}</span><span>${esc(window.tData(d.address))}</span></div>` : '',
            ...(d.phones || []).map(p =>
                `<div class="footer-contact-item"><span class="fci-icon">${FCI_ICONS.phone}</span><a href="tel:${p.number}">${esc(p.number)}</a></div>`),
            d.email ? `<div class="footer-contact-item"><span class="fci-icon">${FCI_ICONS.mail}</span><a href="mailto:${esc(d.email)}">${esc(d.email)}</a></div>` : '',
            d.hours?.weekdays ? `<div class="footer-contact-item"><span class="fci-icon">${FCI_ICONS.clock}</span><span>${esc(window.tData(d.hours.weekdays))}</span></div>` : '',
        ].join('');

        // footer-contact-list — колонка «Контакты» в подвале (на всех страницах);
        // feedback-contact-list — тот же блок над формой на feedback.html.
        ['footer-contact-list', 'feedback-contact-list'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.innerHTML = contactItemsHtml;
        });

        if (d.socials?.length) {
            const icons = {
                Telegram:  `<svg viewBox="0 0 24 24" fill="none"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>`,
                Instagram: `<svg viewBox="0 0 24 24" fill="none"><rect x="2" y="2" width="20" height="20" rx="5" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="12" r="4" stroke="currentColor" stroke-width="1.8"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/></svg>`,
                Facebook:  `<svg viewBox="0 0 24 24" fill="none"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" stroke="currentColor" stroke-width="1.8"/></svg>`,
                YouTube:   `<svg viewBox="0 0 24 24" fill="none"><rect x="2" y="5" width="20" height="14" rx="3" stroke="currentColor" stroke-width="1.8"/><path d="M10 9l5 3-5 3V9z" fill="currentColor"/></svg>`,
            };
            const safeUrl = u => { try { const p = new URL(u); return (p.protocol === 'https:' || p.protocol === 'http:') ? p.href : '#'; } catch { return '#'; } };
            const linkIcon = `<svg viewBox="0 0 24 24" fill="none"><path d="M10 13a5 5 0 007.07 0l2.83-2.83a5 5 0 00-7.07-7.07L11.5 4.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M14 11a5 5 0 00-7.07 0l-2.83 2.83a5 5 0 007.07 7.07L12.5 19.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`;
            const socialLinks = (btnClass) => d.socials.map(s => `
                <a href="${safeUrl(s.url)}" target="_blank" rel="noopener" class="${btnClass}" title="${esc(s.name)}">
                    ${icons[s.name] || linkIcon}
                </a>`).join('');

            const socEl = document.getElementById('footer-socials-row');
            if (socEl) socEl.innerHTML = socialLinks('footer-soc-btn');

            const newsSocEl = document.getElementById('news-socials-row');
            if (newsSocEl) newsSocEl.innerHTML = socialLinks('news-soc-btn');
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
    applyA11yStrings();
    applyGenericI18n();
    rerenderSections();
    if (_cachedSiteData) {
        applySiteData(_cachedSiteData);
        applyBackgrounds(_cachedSiteData);
    }
    loadContactFooter();
});

// Scroll-анимация карточек через IntersectionObserver
const _scrollObserver = new IntersectionObserver((entries) => {
    entries.forEach(e => {
        if (e.isIntersecting) {
            e.target.classList.add('in-view');
            _scrollObserver.unobserve(e.target);
        }
    });
}, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

function applyScrollAnimation(containerEl) {
    const cards = containerEl.querySelectorAll(
        '.news-card, .ach-card, .deputy-card, .staff-card, .doc-card, .circle-card, .gallery-card, .circle-extra-item > .circle-card'
    );
    cards.forEach((card, i) => {
        card.classList.add('anim-card');
        card.style.transitionDelay = `${Math.min(i * 60, 300)}ms`;
        _scrollObserver.observe(card);
    });
}

// window.imgFallback определён инлайн-скриптом в начале <body> в dom-kultury.html
// (должен быть готов до первого onerror ещё до загрузки этого файла)

// Общая разметка для кнопки «показать ещё» (используется в circles/achievements/events/documents/team)
window.renderToggleBtn = function(btnId, onclickCall) {
    return `
    <div style="text-align:center;margin-top:32px;margin-bottom:40px;">
        <button id="${btnId}" class="btn-outline" onclick="${onclickCall}">${window.t('btn.showAll')}</button>
    </div>`;
};

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

    // Даты обновления новостей/галереи нужны ДО рендера секций (используются в бейджах)
    await loadFreshness();

    // Потом грузим всё параллельно
    const [siteData] = await Promise.all([loadSite(), loadSections(), loadContactFooter()]);

    // Фоны применяем ПОСЛЕ того как секции отрисованы
    if (siteData) applyBackgrounds(siteData);

    // Статические строки
    applyNavStrings();
    applyContactStrings();
    applyA11yStrings();
    applyGenericI18n();

    // Инициализируем форму
    initContactForm();

    // Секции до этого момента были скелетонами меньшей высоты — браузер уже
    // прыгнул к якорю из URL (#gallery и т.п.), но целился в старую разметку.
    // После рендера реального контента высота страницы изменилась — довернём скролл.
    if (location.hash) {
        const target = document.querySelector(location.hash);
        // behavior:'instant' — с глобальным CSS scroll-behavior:smooth анимация
        // прокрутки то и дело обрывается на середине (мешают догружающиеся картинки/
        // карта), и страница застревает у самого верха вместо нужной секции.
        if (target) target.scrollIntoView({ block: 'start', behavior: 'instant' });
        // Убираем якорь из адресной строки — иначе он "прилипает" и обычный
        // Ctrl+Shift+R на этой же вкладке снова прыгает к разделу вместо верха страницы.
        history.replaceState(null, '', location.pathname + location.search);
    }
});
