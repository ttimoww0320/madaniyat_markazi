/**
 * i18n — система переводов
 * Языки: ru (Русский), uz (Özbek lotin, новая латиница), oz (Ўзбек кирил)
 * По умолчанию (первый визит) — uz.
 */
(function () {
    const LANGS   = ['ru', 'uz', 'oz'];
    const DEFAULT = 'uz';

    let _lang = DEFAULT;
    try { const saved = localStorage.getItem('lang'); if (LANGS.includes(saved)) _lang = saved; } catch {}
    let _tr   = {};   // кэш переводов { lang: {…} }

    async function _load(lang) {
        if (_tr[lang]) return;
        try {
            const res = await fetch(`/locales/${lang}.json?v=${Date.now()}`);
            _tr[lang] = await res.json();
        } catch (e) {
            console.warn(`[i18n] Не удалось загрузить ${lang}.json`);
            _tr[lang] = {};
        }
    }

    /** Получить статический перевод по ключу "a.b.c" */
    function t(key) {
        const keys = key.split('.');
        let val = _tr[_lang] || {};
        for (const k of keys) {
            if (val === null || typeof val !== 'object') return key;
            val = val[k];
            if (val === undefined) return key;
        }
        return (val !== null && val !== undefined) ? String(val) : key;
    }

    /** Извлечь нужный язык из поля данных: "строка" | {ru, uz, oz} */
    function tData(field) {
        if (field === null || field === undefined) return '';
        if (typeof field !== 'object') return String(field);
        return String(field[_lang] ?? field[DEFAULT] ?? Object.values(field)[0] ?? '');
    }

    function getLang() { return _lang; }

    /** Сменить язык и уведомить страницу */
    async function setLang(lang) {
        if (!LANGS.includes(lang)) return;
        _lang = lang;
        localStorage.setItem('lang', lang);
        await _load(lang);
        document.documentElement.lang = lang === 'oz' ? 'uz-Cyrl' : lang;
        _uzSync();
        // Подсветка активной кнопки
        document.querySelectorAll('.lang-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.lang === lang);
        });
        document.dispatchEvent(new CustomEvent('langchange', { detail: { lang } }));
    }

    /** Инициализация при загрузке страницы */
    async function init() {
        await _load(_lang);
        document.documentElement.lang = _lang === 'oz' ? 'uz-Cyrl' : _lang;
    }

    // Контент из Telegram-синка иногда приходит уже HTML-энкоженным (напр. "A&#33;") —
    // декодируем перед экранированием, иначе escapeHtml задваивает "&" и на странице
    // виден сырой текст вроде "A&amp;#33;" вместо декодированного символа.
    function decodeEntities(s) {
        const ta = document.createElement('textarea');
        ta.innerHTML = String(s ?? '');
        return ta.value;
    }

    function escapeHtml(s) {
        return decodeEntities(s)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    // ===== Новая узбекская латиница: oʻ→ö, gʻ→ğ, sh→ş, ch→ç =====
    // Контент из админки и Telegram хранится в старом написании, поэтому при
    // языке uz весь видимый текст страницы прогоняется через конвертер
    // (MutationObserver ловит и всё, что секции дорисовывают позже).
    // Ссылки, e-mail и @каналы не трогаем.
    const UZ_SKIP = /(https?:\/\/\S+|www\.\S+|[\w.+-]+@[\w-]+(?:\.[\w-]+)+|@\w+)/;
    const UZ_AP   = "['ʻ‘’ʼ`´]";
    const UZ_O    = new RegExp('o' + UZ_AP + '(?=\\p{L})', 'gu');
    const UZ_OO   = new RegExp('O' + UZ_AP + '(?=\\p{L})', 'gu');
    const UZ_G    = new RegExp('g' + UZ_AP + '(?=\\p{L})', 'gu');
    const UZ_GG   = new RegExp('G' + UZ_AP + '(?=\\p{L})', 'gu');
    const UZ_TEST = new RegExp('[oOgG]' + UZ_AP + '|[sScC][hH]', 'u');

    function uzLatin(s) {
        s = String(s ?? '');
        if (!UZ_TEST.test(s)) return s;
        return s.split(UZ_SKIP).map((part, i) => (i % 2) ? part : part
            .replace(UZ_O, 'ö').replace(UZ_OO, 'Ö')
            .replace(UZ_G, 'ğ').replace(UZ_GG, 'Ğ')
            .replace(/S[hH]/g, 'Ş').replace(/sh/g, 'ş')
            .replace(/C[hH]/g, 'Ç').replace(/ch/g, 'ç')
        ).join('');
    }

    const UZ_ATTRS = ['placeholder', 'title', 'aria-label', 'alt'];
    const UZ_SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEXTAREA', 'INPUT', 'CODE', 'PRE']);

    function _uzSkipEl(el) {
        return !el || UZ_SKIP_TAGS.has(el.tagName) || (el.closest && el.closest('[data-no-uz]'));
    }
    function _uzText(node) {
        if (_uzSkipEl(node.parentElement)) return;
        const v = uzLatin(node.nodeValue);
        if (v !== node.nodeValue) node.nodeValue = v;
    }
    function _uzAttrs(el) {
        if (_uzSkipEl(el) && !(el.tagName === 'INPUT' || el.tagName === 'TEXTAREA')) return;
        for (const a of UZ_ATTRS) {
            const old = el.getAttribute(a);
            if (old) { const v = uzLatin(old); if (v !== old) el.setAttribute(a, v); }
        }
    }
    function _uzTree(root) {
        if (!root) return;
        if (root.nodeType === 3) { _uzText(root); return; }
        if (root.nodeType !== 1) return;
        _uzAttrs(root);
        const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
        let n;
        while ((n = w.nextNode())) n.nodeType === 3 ? _uzText(n) : _uzAttrs(n);
    }

    let _uzObserver = null;
    function _uzSync() {
        const on = _lang === 'uz';
        if (on && !_uzObserver) {
            _uzObserver = new MutationObserver((list) => {
                for (const m of list) {
                    if (m.type === 'childList') m.addedNodes.forEach(_uzTree);
                    else if (m.type === 'characterData') _uzText(m.target);
                    else if (m.type === 'attributes') _uzAttrs(m.target);
                }
                if (document.title) { const tt = uzLatin(document.title); if (tt !== document.title) document.title = tt; }
            });
            _uzObserver.observe(document.documentElement, {
                childList: true, subtree: true, characterData: true,
                attributes: true, attributeFilter: UZ_ATTRS,
            });
            _uzTree(document.documentElement);
        } else if (!on && _uzObserver) {
            _uzObserver.disconnect();
            _uzObserver = null;
        }
    }
    document.documentElement.lang = _lang === 'oz' ? 'uz-Cyrl' : _lang;
    _uzSync(); // запускаем сразу — текст конвертируется по мере разбора HTML

    window.i18n           = { t, tData, getLang, setLang, init, LANGS, DEFAULT, uzLatin };
    window.t              = t;
    window.decodeEntities = decodeEntities;
    window.tData     = tData;
    window.escapeHtml = escapeHtml;
})();
