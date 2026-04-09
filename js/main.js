// Список секций: id контейнера → render-функция
const SECTIONS = [
    { id: 'section-news',         api: 'news',         render: () => window.renderNews         },
    { id: 'section-events',       api: 'events',       render: () => window.renderEvents       },
    { id: 'section-circles',      api: 'circles',      render: () => window.renderCircles      },
    { id: 'section-achievements', api: 'achievements', render: () => window.renderAchievements },
    { id: 'section-team',         api: 'team',         render: () => window.renderTeam         },
    { id: 'section-documents',    api: 'documents',    render: () => window.renderDocuments    },
    { id: 'section-gallery',      api: 'gallery',      render: () => window.renderGallery      },
    { id: 'section-contact',      api: 'contact',      render: () => window.renderContact      },
];

// Секции у которых есть .section-gray обёртка
const GRAY_SECTIONS = new Set(['circles', 'documents', 'gallery']);

async function loadSections() {
    await Promise.all(
        SECTIONS.map(async ({ id, api, render }) => {
            try {
                const res  = await fetch(`/api/${api}`);
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const data = await res.json();
                const el   = document.getElementById(id);
                if (el) el.innerHTML = render()(data);
            } catch (err) {
                console.error(`Ошибка загрузки секции "${api}":`, err);
            }
        })
    );
}

// Применяет фоны — вызывается ПОСЛЕ отрисовки секций
function applyBackgrounds(siteData) {
    const globalBg = siteData.globalBg || '';
    const bgs      = siteData.backgrounds || {};

    if (globalBg) {
        // Общий фон на body — одно фото на всю страницу
        document.body.style.backgroundImage      = `url('${globalBg}')`;
        document.body.style.backgroundSize       = 'cover';
        document.body.style.backgroundPosition   = 'center top';
        document.body.style.backgroundRepeat     = 'no-repeat';
        document.body.style.backgroundAttachment = 'fixed';
        document.body.classList.add('has-global-bg');
        return;
    }

    // Нет глобального фона — сбрасываем
    document.body.style.backgroundImage = '';
    document.body.classList.remove('has-global-bg');

    // Для каждой секции ищем правильный элемент
    Object.entries(bgs).forEach(([key, url]) => {
        if (!url) return;

        let el = null;
        if (key === 'hero') {
            el = document.querySelector('.hero');
        } else {
            // Секции с .section-gray — фон на саму обёртку
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

async function loadSite() {
    const res = await fetch('/api/site');
    if (!res.ok) return null;
    const data = await res.json();

    const set     = (id, text) => { const el = document.getElementById(id); if (el) el.textContent = text; };
    const setAttr = (id, attr, val) => { const el = document.getElementById(id); if (el) el.setAttribute(attr, val); };

    if (data.header) set('logo-text', data.header.logoText);
    if (data.hero) {
        set('hero-title',    data.hero.title);
        set('hero-subtitle', data.hero.subtitle);
        if (data.hero.btn1Text) { set('hero-btn1', data.hero.btn1Text); setAttr('hero-btn1', 'href', data.hero.btn1Href); }
        if (data.hero.btn2Text) { set('hero-btn2', data.hero.btn2Text); setAttr('hero-btn2', 'href', data.hero.btn2Href); }
    }
    if (data.footer) {
        set('footer-logo-text', data.footer.logoText);
        set('footer-copyright', data.footer.copyright);
    }

    return data;
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
        btn.innerHTML = 'Отправляем...';
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
                btn.innerHTML = '&#10003; Сообщение отправлено!';
                btn.style.background = '#1D9E75';
                form.reset();
            } else {
                btn.innerHTML = '✗ Ошибка, попробуйте снова';
                btn.style.background = '#e53e3e';
                btn.disabled = false;
            }
        } catch {
            btn.innerHTML = '✗ Нет соединения';
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

// Запускаем после загрузки DOM
document.addEventListener('DOMContentLoaded', async () => {
    // Сначала грузим текст сайта и секции параллельно
    const [siteData] = await Promise.all([loadSite(), loadSections()]);
    // Фоны применяем ПОСЛЕ того как секции отрисованы
    if (siteData) applyBackgrounds(siteData);
    initContactForm();
});
