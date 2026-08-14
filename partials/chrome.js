// Общее поведение шапки/подвала: бургер-меню, доступность, переключатель языка,
// карта сайта, часы, анимация счётчиков, кнопка "Наверх".
// Используется на всех страницах — подключается после js/main.js.

// ===== БУРГЕР-МЕНЮ =====
window.toggleMenu = function() {
    const nav = document.getElementById('main-nav');
    const btn = document.getElementById('burger-btn');
    const open = nav.classList.toggle('open');
    btn.classList.toggle('open', open);
    btn.setAttribute('aria-expanded', open);
    document.body.style.overflow = open ? 'hidden' : '';
};
window.closeMenu = function() {
    const nav = document.getElementById('main-nav');
    const btn = document.getElementById('burger-btn');
    nav.classList.remove('open');
    btn.classList.remove('open');
    btn.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    document.querySelectorAll('.nav-item-dropdown.open').forEach(w => {
        w.classList.remove('open');
        const trigger = w.querySelector(':scope > a');
        if (trigger) trigger.setAttribute('aria-expanded', 'false');
    });
};
document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
        window.closeMenu();
        if (typeof window.closeAchModal === 'function') window.closeAchModal();
    }
});

// ===== DROPDOWN В ГЛАВНОЙ НАВИГАЦИИ (напр. "Команда") =====
// Десктоп: открытие по наведению (с задержкой закрытия, чтобы курсор успел
// дойти до панели) + по клику/Enter — для клавиатуры и тач-устройств.
// Мобильный бургер (<=768px, см. .nav-item-dropdown в CSS): панель превращается
// в аккордеон — тот же .open класс, только раскрывается по тапу, без наведения.
const NAV_DROPDOWN_HOVER_MAX_WIDTH = 1024; // выше — hover, ниже — только тап/клик
let _navDropdownCloseTimer = null;

function _navDropdownEls(wrapId) {
    const wrap = document.getElementById(wrapId);
    if (!wrap) return null;
    const trigger = wrap.querySelector(':scope > a');
    const panel   = wrap.querySelector('.nav-dropdown-panel');
    if (!trigger || !panel) return null;
    return { wrap, trigger, panel };
}

window.toggleNavDropdown = function(wrapId, force) {
    const els = _navDropdownEls(wrapId);
    if (!els) return;
    const open = typeof force === 'boolean' ? force : !els.wrap.classList.contains('open');
    if (open) {
        // Одновременно открыт только один dropdown
        document.querySelectorAll('.nav-item-dropdown.open').forEach(w => {
            if (w.id !== wrapId) window.toggleNavDropdown(w.id, false);
        });
    }
    els.wrap.classList.toggle('open', open);
    els.trigger.setAttribute('aria-expanded', String(open));
};

window.handleNavDropdownClick = function(e, wrapId) {
    e.preventDefault();
    const els = _navDropdownEls(wrapId);
    if (!els) return;
    window.toggleNavDropdown(wrapId, !els.wrap.classList.contains('open'));
};

document.querySelectorAll('.nav-item-dropdown').forEach(wrap => {
    const trigger = wrap.querySelector(':scope > a');
    const panel   = wrap.querySelector('.nav-dropdown-panel');
    if (!trigger || !panel) return;
    const items = () => [...panel.querySelectorAll('[role="menuitem"]')];

    wrap.addEventListener('mouseenter', () => {
        if (window.innerWidth <= NAV_DROPDOWN_HOVER_MAX_WIDTH) return;
        clearTimeout(_navDropdownCloseTimer);
        window.toggleNavDropdown(wrap.id, true);
    });
    wrap.addEventListener('mouseleave', () => {
        if (window.innerWidth <= NAV_DROPDOWN_HOVER_MAX_WIDTH) return;
        _navDropdownCloseTimer = setTimeout(() => window.toggleNavDropdown(wrap.id, false), 200);
    });

    trigger.addEventListener('keydown', e => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            window.toggleNavDropdown(wrap.id, true);
            const first = items()[0];
            if (first) first.focus();
        } else if (e.key === 'Escape') {
            window.toggleNavDropdown(wrap.id, false);
        }
    });

    panel.addEventListener('keydown', e => {
        const list = items();
        const idx  = list.indexOf(document.activeElement);
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            const next = list[Math.min(idx + 1, list.length - 1)];
            if (next) next.focus();
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            const prev = list[Math.max(idx - 1, 0)];
            if (prev) prev.focus();
        } else if (e.key === 'Escape') {
            e.preventDefault();
            window.toggleNavDropdown(wrap.id, false);
            trigger.focus();
        }
    });

    // Tab выходит за пределы блока целиком — закрываем
    wrap.addEventListener('focusout', e => {
        if (!wrap.contains(e.relatedTarget)) window.toggleNavDropdown(wrap.id, false);
    });
});

document.addEventListener('click', e => {
    document.querySelectorAll('.nav-item-dropdown.open').forEach(wrap => {
        if (!wrap.contains(e.target)) window.toggleNavDropdown(wrap.id, false);
    });
});
document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
        document.querySelectorAll('.nav-item-dropdown.open').forEach(wrap => window.toggleNavDropdown(wrap.id, false));
    }
});

// ===== ДОСТУПНОСТЬ =====
let _fontSize = parseInt(localStorage.getItem('fontSize') || '0');
applyFontSize(_fontSize);

function applyFontSize(delta) {
    const size = 16 + delta * 2;
    document.documentElement.style.fontSize = size + 'px';
}

window.changeFontSize = function(dir) {
    _fontSize = Math.max(-2, Math.min(4, _fontSize + dir));
    localStorage.setItem('fontSize', _fontSize);
    applyFontSize(_fontSize);
};

window.toggleContrast = function() {
    const on = document.body.classList.toggle('high-contrast');
    localStorage.setItem('highContrast', on ? '1' : '');
    document.getElementById('contrast-btn').classList.toggle('active', on);
};

if (localStorage.getItem('highContrast')) {
    document.body.classList.add('high-contrast');
    const btn = document.getElementById('contrast-btn');
    if (btn) btn.classList.add('active');
}

// ===== ПЕРЕКЛЮЧАТЕЛЬ ЯЗЫКА (плашка) =====
window.toggleLangPanel = function(force) {
    const panel = document.getElementById('lang-panel');
    const btn   = document.getElementById('lang-pill-btn');
    const open  = typeof force === 'boolean' ? force : !panel.classList.contains('open');
    panel.classList.toggle('open', open);
    btn.setAttribute('aria-expanded', open);
    if (open) { window.toggleA11yPanel(false); window.toggleSitemap(false); }
};
const LANG_PILL_LABELS = { ru: 'RU', uz: 'UZ', oz: 'ЎЗ' };
document.addEventListener('langchange', e => {
    const label = document.getElementById('lang-pill-label');
    if (label) label.textContent = LANG_PILL_LABELS[e.detail.lang] || e.detail.lang.toUpperCase();
    window.toggleLangPanel(false);
});

// ===== ПАНЕЛЬ "СПЕЦ. ВОЗМОЖНОСТИ" =====
window.toggleA11yPanel = function(force) {
    const panel = document.getElementById('a11y-panel');
    const btn   = document.getElementById('a11y-toggle-btn');
    const open  = typeof force === 'boolean' ? force : !panel.classList.contains('open');
    panel.classList.toggle('open', open);
    btn.setAttribute('aria-expanded', open);
    if (open) { window.toggleSitemap(false); window.toggleLangPanel(false); window.toggleHeaderSearch(false); }
};

// ===== ПАНЕЛЬ "КАРТА САЙТА" =====
window.toggleSitemap = function(force) {
    const panel   = document.getElementById('sitemap-panel');
    const overlay = document.getElementById('sitemap-overlay');
    const btn     = document.getElementById('sitemap-btn');
    const open    = typeof force === 'boolean' ? force : !panel.classList.contains('open');
    panel.classList.toggle('open', open);
    overlay.classList.toggle('open', open);
    btn.setAttribute('aria-expanded', open);
    document.body.style.overflow = open ? 'hidden' : '';
    if (open) { window.toggleA11yPanel(false); window.toggleLangPanel(false); window.toggleHeaderSearch(false); }
};

// ===== ПОИСК ПО САЙТУ (клиентский поиск-навигация, выезжающая панель) =====
// Индекс собирается из контента, который уже есть на странице: статические
// пункты меню — сразу, динамика (новости/кружки/события/документы/команда) —
// main.js добавляет через window.searchIndexAddSection() после загрузки каждой секции.
let _searchIndex     = [];
let _searchActiveIdx = -1;
let _searchDebounce  = null;

window.searchIndexReset = function() {
    _searchIndex = [];
};

function _searchBuildSectionItems() {
    const items = [];
    document.querySelectorAll('#main-nav .nav-links a[href]').forEach(a => {
        const title = a.textContent.trim();
        const url   = a.getAttribute('href');
        if (title && url) items.push({ title, snippet: '', type: 'section', url });
    });
    return items;
}

window.searchIndexAddSection = function(api, data) {
    const td = window.tData;
    if (api === 'news' && Array.isArray(data)) {
        data.forEach(n => _searchIndex.push({
            title: td(n.title), snippet: td(n.text), type: 'news', url: '#news',
        }));
    } else if (api === 'circles' && Array.isArray(data)) {
        data.forEach(c => _searchIndex.push({
            title: td(c.title),
            snippet: [td(c.description), c.teacher].filter(Boolean).join(' — '),
            type: 'circle', url: '#circles',
        }));
    } else if (api === 'events' && Array.isArray(data)) {
        data.forEach(e => _searchIndex.push({
            title: td(e.title), snippet: td(e.place), type: 'event', url: '#events',
        }));
    } else if (api === 'documents' && data) {
        [...(data.main || []), ...(data.small || [])].forEach(doc => {
            _searchIndex.push({
                title: td(doc.title), snippet: td(doc.description) || doc.size || '',
                type: 'document', url: '/documents.html',
            });
        });
    } else if (api === 'team' && data) {
        const push = (name, role) => { if (name) _searchIndex.push({ title: name, snippet: role || '', type: 'staff', url: '/team.html' }); };
        if (data.director) push(data.director.name, td(data.director.title));
        (data.deputies || []).forEach(d => push(d.name, td(d.department)));
        (data.staff     || []).forEach(s => push(s.name, td(s.role)));
    }
};

// Без учёта регистра, апострофов и диакритики (o'g'li = oʻgʻli)
function _searchNormalize(s) {
    return String(s || '')
        .toLowerCase()
        .replace(/[ʻʼ'’‘`´]/g, '')
        .normalize('NFKD')
        .replace(/[̀-ͯ]/g, '');
}

function _searchHighlight(text, rawQuery) {
    const str = String(text || '');
    let idx = str.toLowerCase().indexOf(rawQuery.toLowerCase());
    let len = rawQuery.length;

    if (idx === -1) {
        // Точного совпадения нет — оно нашлось только через _searchNormalize
        // (другой апостроф/диакритика). Строим карту "нормализованный индекс →
        // исходный", чтобы всё равно подсветить нужный фрагмент в исходном тексте.
        const normQuery = _searchNormalize(rawQuery);
        let normStr = '';
        const map = [];
        for (let i = 0; i < str.length; i++) {
            const nc = _searchNormalize(str[i]);
            for (let k = 0; k < nc.length; k++) map.push(i);
            normStr += nc;
        }
        const nIdx = normStr.indexOf(normQuery);
        if (nIdx === -1) return window.escapeHtml(str);
        idx = map[nIdx];
        const endIdx = map[nIdx + normQuery.length - 1];
        len = (endIdx !== undefined ? endIdx : str.length - 1) - idx + 1;
    }

    const before = str.slice(0, idx);
    const match  = str.slice(idx, idx + len);
    const after  = str.slice(idx + len);
    return `${window.escapeHtml(before)}<mark>${window.escapeHtml(match)}</mark>${window.escapeHtml(after)}`;
}

const SEARCH_TYPE_ORDER = ['section', 'news', 'circle', 'event', 'document', 'staff'];
const SEARCH_TYPE_KEYS  = {
    section: 'search.type.section', news: 'search.type.news', circle: 'search.type.circle',
    event: 'search.type.event', document: 'search.type.document', staff: 'search.type.staff',
};
const SEARCH_GROUP_KEYS = {
    section: 'search.group.section', news: 'search.group.news', circle: 'search.group.circle',
    event: 'search.group.event', document: 'search.group.document', staff: 'search.group.staff',
};

function _searchRun(rawQuery) {
    const norm = _searchNormalize(rawQuery);
    if (norm.length < 2) return [];
    const all = [..._searchBuildSectionItems(), ..._searchIndex];
    const matched = all.filter(item =>
        _searchNormalize(item.title).includes(norm) || _searchNormalize(item.snippet).includes(norm)
    );
    matched.sort((a, b) => SEARCH_TYPE_ORDER.indexOf(a.type) - SEARCH_TYPE_ORDER.indexOf(b.type));
    return matched.slice(0, 8);
}

function _searchIsHome() {
    return location.pathname === '/' || location.pathname === '/dom-kultury.html';
}

// Якоря новостей/кружков/событий/галереи существуют только на главной —
// с других страниц ведём на главную с этим же якорем.
function _searchResolveUrl(url) {
    if (!url.startsWith('#')) return url;
    return _searchIsHome() ? url : '/dom-kultury.html' + url;
}

function _searchNavigate(url) {
    window.toggleHeaderSearch(false);
    const resolved = _searchResolveUrl(url);
    if (resolved.startsWith('#')) {
        const target = document.querySelector(resolved);
        if (target) { target.scrollIntoView({ block: 'start', behavior: 'instant' }); return; }
    }
    window.location.href = resolved;
}

window.searchApplyChip = function(value) {
    const input = document.getElementById('site-search-input');
    if (!input) return;
    input.value = value;
    input.dispatchEvent(new Event('input'));
    input.focus();
};

function _searchRenderChips() {
    const chips = [window.t('nav.circles'), window.t('nav.events'), window.t('nav.documents')];
    return chips.map(label =>
        `<button type="button" class="site-search-chip" data-chip="${window.escapeHtml(label)}">${window.escapeHtml(label)}</button>`
    ).join('');
}

window.searchRenderResults = _searchRender;
function _searchRender(rawQuery) {
    const el = document.getElementById('site-search-results');
    if (!el) return;
    _searchActiveIdx = -1;
    const results = _searchRun(rawQuery);

    if (!results.length) {
        const title = window.t('search.emptyTitle').replace('{q}', rawQuery);
        el.innerHTML = `
        <div class="site-search-empty">
            <div class="site-search-empty-title">${window.escapeHtml(title)}</div>
            <div class="site-search-chips">${_searchRenderChips()}</div>
        </div>`;
        return;
    }

    let lastType = null;
    let html = '';
    results.forEach(r => {
        if (r.type !== lastType) {
            html += `<div class="site-search-group-label">${window.escapeHtml(window.t(SEARCH_GROUP_KEYS[r.type] || r.type))}</div>`;
            lastType = r.type;
        }
        const badge     = window.t(SEARCH_TYPE_KEYS[r.type] || r.type);
        const titleHtml = _searchHighlight(r.title, rawQuery);
        html += `
        <a class="site-search-result-item" href="${window.escapeHtml(_searchResolveUrl(r.url))}" data-url="${window.escapeHtml(r.url)}">
            <span class="site-search-result-badge">${window.escapeHtml(badge)}</span>
            <span class="site-search-result-title">${titleHtml}</span>
            ${r.snippet ? `<span class="site-search-result-snippet">${window.escapeHtml(r.snippet)}</span>` : ''}
        </a>`;
    });
    el.innerHTML = html;
}

window.toggleHeaderSearch = function(force) {
    const overlay = document.getElementById('site-search-overlay');
    const btn     = document.querySelector('.header-search-btn');
    if (!overlay || !btn) return;
    const open = typeof force === 'boolean' ? force : !overlay.classList.contains('open');
    overlay.classList.toggle('open', open);
    btn.setAttribute('aria-expanded', open);
    if (open) {
        window.toggleA11yPanel(false);
        window.toggleLangPanel(false);
        window.toggleSitemap(false);
        const input = document.getElementById('site-search-input');
        if (input) { input.value = ''; input.focus(); }
        const results = document.getElementById('site-search-results');
        if (results) results.innerHTML = '';
    }
};

(function() {
    const input = document.getElementById('site-search-input');
    if (!input) return;

    const getItems = () => [...document.querySelectorAll('.site-search-result-item')];
    const setActive = idx => {
        const list = getItems();
        list.forEach((el, i) => el.classList.toggle('active', i === idx));
        if (list[idx]) list[idx].scrollIntoView({ block: 'nearest' });
    };

    input.addEventListener('input', () => {
        clearTimeout(_searchDebounce);
        const q = input.value.trim();
        const results = document.getElementById('site-search-results');
        if (q.length < 2) { if (results) results.innerHTML = ''; return; }
        _searchDebounce = setTimeout(() => _searchRender(q), 200);
    });

    input.addEventListener('keydown', e => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            const list = getItems();
            if (!list.length) return;
            _searchActiveIdx = Math.min(_searchActiveIdx + 1, list.length - 1);
            setActive(_searchActiveIdx);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            const list = getItems();
            if (!list.length) return;
            _searchActiveIdx = Math.max(_searchActiveIdx - 1, 0);
            setActive(_searchActiveIdx);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            const list = getItems();
            const target = list[_searchActiveIdx] || list[0];
            if (target) _searchNavigate(target.dataset.url);
        }
    });
})();

document.addEventListener('click', e => {
    if (!e.target.closest('.a11y-dropdown')) window.toggleA11yPanel(false);
    if (!e.target.closest('.lang-switcher'))  window.toggleLangPanel(false);
    if (!e.target.closest('.site-search-overlay') && !e.target.closest('.header-search-btn')) window.toggleHeaderSearch(false);

    const resultItem = e.target.closest('.site-search-result-item');
    if (resultItem) { e.preventDefault(); _searchNavigate(resultItem.dataset.url); return; }

    const chip = e.target.closest('.site-search-chip');
    if (chip) window.searchApplyChip(chip.dataset.chip);
});
document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
        window.toggleA11yPanel(false);
        window.toggleSitemap(false);
        window.toggleLangPanel(false);
        window.toggleHeaderSearch(false);
    }
});

// ===== ЧАСЫ В ШАПКЕ =====
(function() {
    const el = document.getElementById('gov-clock');
    if (!el) return;
    const tick = () => {
        const now = new Date();
        const time = now.toLocaleTimeString('ru-RU');
        const date = now.toLocaleDateString('ru-RU');
        el.textContent = `${time} (GMT+5) ${date}`;
    };
    tick();
    setInterval(tick, 1000);
})();

// ===== АНИМАЦИЯ СЧЁТЧИКОВ =====
// Вызывается из main.js после того как счётчики отрендерились из site.json
window.initStatsAnimation = function() {
    const bar = document.getElementById('stats-bar');
    if (!bar) return;
    let animated = false;

    function animateCounters() {
        if (animated) return;
        animated = true;
        bar.querySelectorAll('.stat-num').forEach(el => {
            const target = +el.dataset.target;
            const suffix = el.dataset.suffix || '';
            const steps = 1800 / 16;
            let current = 0;
            const inc = target / steps;
            const timer = setInterval(() => {
                current = Math.min(current + inc, target);
                el.textContent = Math.floor(current).toLocaleString('ru') + (current >= target ? suffix : '');
                if (current >= target) clearInterval(timer);
            }, 16);
        });
    }

    const observer = new IntersectionObserver(entries => {
        if (entries[0].isIntersecting) animateCounters();
    }, { threshold: 0.3 });
    observer.observe(bar);
};

// ===== КНОПКА "НАВЕРХ" + ЗАТЕНЕНИЕ ШАПКИ ПРИ СКРОЛЛЕ =====
(function() {
    const btn = document.getElementById('back-to-top');
    const header = document.querySelector('.header');
    if (!btn || !header) return;
    window.addEventListener('scroll', function() {
        btn.classList.toggle('visible', window.scrollY > 400);
        header.classList.toggle('header--scrolled', window.scrollY > 10);
    }, { passive: true });
})();
