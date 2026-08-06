/**
 * i18n — система переводов
 * Языки: ru (Русский), uz (O'zbek lotin), oz (Ўзбек кирил)
 */
(function () {
    const LANGS   = ['ru', 'uz', 'oz'];
    const DEFAULT = 'uz';

    let _lang = localStorage.getItem('lang') || DEFAULT;
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

    window.i18n           = { t, tData, getLang, setLang, init, LANGS, DEFAULT };
    window.t              = t;
    window.decodeEntities = decodeEntities;
    window.tData     = tData;
    window.escapeHtml = escapeHtml;
})();
