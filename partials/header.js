// Общая шапка сайта — используется на всех страницах через document.write().
// Якоря разделов (Новости/Афиша/.../Команда) ведут на "#section" на главной и на
// "/dom-kultury.html#section" с любой другой страницы — "Команда" ведёт к тизеру
// с директором (id="team"), а не на полную страницу. Документы — отдельная
// страница, ссылка на неё статична.
(function () {
    const isHome = location.pathname === '/' || location.pathname === '/dom-kultury.html';
    const HOME = isHome ? '' : '/dom-kultury.html';

    window.HEADER_HTML = `
    <!-- ===== ШАПКА ===== -->
    <header class="header">

        <!-- Уровень 1: гос.плашка, герб, время, язык, спец.возможности, карта сайта -->
        <div class="gov-topbar">
            <div class="gov-topbar-inner">
                <div class="gov-topbar-left">
                    <span class="gov-orgs-pill">
                        <span id="gov-orgs-pill-text">Ҳокимият Юнусобод тумани</span>
                        <span class="gov-orgs-pill-arrow" aria-hidden="true">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="24" height="24" fill="currentColor">
                                <path d="M16 0C7.163 0 0 7.163 0 16s7.163 16 16 16 16-7.164 16-16S24.836 0 16 0m0 30C8.28 30 2 23.72 2 16S8.28 1.969 16 1.969 30 8.28 30 16s-6.28 14-14 14"></path>
                                <path d="M13.808 8.271a.994.994 0 0 0-1.414 0 1.017 1.017 0 0 0 0 1.429l6.195 6.285-6.196 6.285a1.017 1.017 0 0 0 0 1.429.994.994 0 0 0 1.414 0l6.9-6.999a1.037 1.037 0 0 0 0-1.429z"></path>
                            </svg>
                        </span>
                    </span>
                    <img id="gov-emblem-img" src="/uploads/emblem.svg" alt="Герб Республики Узбекистан" class="gov-emblem-mini" width="56" height="58">
                    <span class="gov-topbar-divider gov-flag-divider" aria-hidden="true"></span>
                    <a class="gov-locality" id="gov-locality-link" href="${HOME || '/dom-kultury.html'}" aria-label="На главную">
                        <span id="gov-official-label">ОФИЦИАЛЬНЫЙ САЙТ</span>
                        <span id="gov-locality-text">ЮНУСОБОД ТУМАНИ</span>
                    </a>
                </div>
                <div class="gov-topbar-right">
                    <div class="gov-building-banner">
                        <img id="gov-building-banner-img" src="/uploads/building.webp" alt="35 лет Независимости Узбекистана" width="420" height="82" onerror="this.parentElement.style.display='none'">
                    </div>
                    <div class="gov-widgets">
                        <span class="gov-clock" id="gov-clock" aria-hidden="true"></span>

                        <div class="gov-lang-a11y">
                            <div class="lang-switcher">
                                <button class="lang-pill-btn" id="lang-pill-btn" onclick="window.toggleLangPanel()" aria-haspopup="true" aria-expanded="false" aria-controls="lang-panel">
                                    <span id="lang-pill-label">RU</span> <span class="a11y-caret" aria-hidden="true">▾</span>
                                </button>
                                <div class="lang-panel" id="lang-panel">
                                    <button class="lang-btn active" data-lang="ru" onclick="window.i18n.setLang('ru')">Русский</button>
                                    <button class="lang-btn"        data-lang="uz" onclick="window.i18n.setLang('uz')">O'zbek</button>
                                    <button class="lang-btn"        data-lang="oz" onclick="window.i18n.setLang('oz')">Ўзбек</button>
                                </div>
                            </div>

                            <div class="a11y-dropdown">
                                <button class="a11y-icon-btn" id="a11y-toggle-btn" onclick="window.toggleA11yPanel()" aria-haspopup="true" aria-expanded="false" aria-controls="a11y-panel" title="Специальные возможности" aria-label="Специальные возможности">
                                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                                </button>
                                <div class="a11y-panel" id="a11y-panel">
                                    <div class="a11y-panel-title" id="a11y-panel-title">Специальные возможности</div>
                                    <div class="a11y-row">
                                        <span id="a11y-font-label">Размер шрифта</span>
                                        <div class="access-btns" id="access-btns" aria-label="Доступность">
                                            <button class="access-btn" id="font-inc-btn" onclick="changeFontSize(1)" title="Увеличить шрифт" aria-label="Увеличить шрифт">A+</button>
                                            <button class="access-btn" id="font-dec-btn" onclick="changeFontSize(-1)" title="Уменьшить шрифт" aria-label="Уменьшить шрифт">A-</button>
                                        </div>
                                    </div>
                                    <div class="a11y-row">
                                        <span id="a11y-contrast-label">Высокий контраст</span>
                                        <button class="access-btn" id="contrast-btn" onclick="toggleContrast()" title="Режим для слабовидящих" aria-label="Высокий контраст"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg></button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Уровень 2: полное название организации, телефон -->
        <div class="gov-mainbar">
            <div class="gov-mainbar-inner">
                <div class="logo">
                    <div class="logo-emblem" aria-hidden="true">
                        <img src="/uploads/logo.png" alt="Логотип" width="44" height="44" style="object-fit:contain;" onerror="window.imgFallback(this,'landmark')">
                    </div>
                    <span class="logo-text" id="logo-text">Дом культуры</span>
                </div>
                <div class="gov-mainbar-right">
                    <button class="header-search-btn" type="button" aria-label="Поиск" title="Поиск" aria-haspopup="true" aria-expanded="false" aria-controls="site-search-overlay" onclick="window.toggleHeaderSearch()">
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="11" cy="11" r="7"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                    </button>
                    <a class="gov-header-phone" id="gov-header-contacts" href="/contacts.html">
                        <span class="gov-phone-icon" aria-hidden="true"><svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"></path></svg></span>
                        <span class="gov-contacts-label" id="gov-contacts-label">Контакты</span>
                    </a>
                </div>
                <button class="burger-btn" id="burger-btn" onclick="toggleMenu()" aria-label="Меню" aria-expanded="false">
                    <span></span><span></span><span></span>
                </button>
            </div>
        </div>

        <!-- Уровень 3: разделы -->
        <nav class="nav" id="main-nav" aria-label="Основная навигация">
            <div class="nav-links">
                <a id="nav-news"         href="${HOME}#news"         onclick="closeMenu()">Новости</a>
                <a id="nav-events"       href="${HOME}#events"       onclick="closeMenu()">Афиша</a>
                <a id="nav-circles"      href="${HOME}#circles"      onclick="closeMenu()">Кружки</a>
                <a id="nav-map"          href="${HOME}#map"          onclick="closeMenu()">Карта</a>
                <a id="nav-achievements" href="${HOME}#achievements" onclick="closeMenu()">Достижения</a>
                <div class="nav-item-dropdown" id="nav-team-dropdown">
                    <a id="nav-team" href="${HOME}#team" onclick="window.handleNavDropdownClick(event,'nav-team-dropdown')" aria-haspopup="true" aria-expanded="false" aria-controls="nav-team-panel">
                        <span class="nav-dropdown-label">Команда</span>
                        <svg class="nav-dropdown-chevron" viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="6 9 12 15 18 9"></polyline></svg>
                    </a>
                    <div class="nav-dropdown-panel" id="nav-team-panel" role="menu" aria-label="Команда">
                        <a role="menuitem" id="nav-team-sub-director" href="/team.html#team-director" onclick="closeMenu()">Руководство</a>
                        <a role="menuitem" id="nav-team-sub-deputies" href="/team.html#team-deputies" onclick="closeMenu()">Руководители центров</a>
                        <a role="menuitem" id="nav-team-sub-staff"    href="/team.html#team-staff"    onclick="closeMenu()">Специалисты</a>
                    </div>
                </div>
                <a id="nav-gallery"      href="${HOME}#gallery"      onclick="closeMenu()">Галерея</a>
                <a id="nav-documents"    href="/documents.html"      onclick="closeMenu()">Документы</a>
                <div class="nav-item-dropdown" id="nav-contact-dropdown">
                    <a id="nav-contact" href="/contacts.html" onclick="window.handleNavDropdownClick(event,'nav-contact-dropdown')" aria-haspopup="true" aria-expanded="false" aria-controls="nav-contact-panel">
                        <span class="nav-dropdown-label">Контакты</span>
                        <svg class="nav-dropdown-chevron" viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="6 9 12 15 18 9"></polyline></svg>
                    </a>
                    <div class="nav-dropdown-panel" id="nav-contact-panel" role="menu" aria-label="Контакты">
                        <a role="menuitem" id="nav-contact-sub-contacts" href="/contacts.html"     onclick="closeMenu()">Контакты</a>
                        <a role="menuitem" id="nav-contact-sub-numbers"  href="/all-numbers.html"  onclick="closeMenu()">Все номера</a>
                        <a role="menuitem" id="nav-contact-sub-bank"     href="/bank-details.html" onclick="closeMenu()">Банковские реквизиты</a>
                        <a role="menuitem" id="nav-contact-sub-feedback" href="/feedback.html"     onclick="closeMenu()">Обратная связь</a>
                    </div>
                </div>
            </div>
            <div class="gov-nav-sitemap-wrap">
                <button class="sitemap-btn" id="sitemap-btn" onclick="window.toggleSitemap()" aria-haspopup="true" aria-expanded="false" aria-controls="sitemap-panel" title="Карта сайта" aria-label="Карта сайта">
                    <span></span><span></span><span></span>
                </button>
            </div>
        </nav>

        <!-- ===== ПОИСК ПО САЙТУ ===== -->
        <div class="site-search-overlay" id="site-search-overlay" role="search" aria-label="Поиск по сайту">
            <div class="site-search-bar">
                <svg class="site-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                <input type="text" class="site-search-input" id="site-search-input" autocomplete="off" placeholder="Поиск по сайту…" aria-label="Поиск по сайту">
                <button type="button" class="site-search-close" id="site-search-close" aria-label="Закрыть" onclick="window.toggleHeaderSearch(false)">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
            </div>
            <div class="site-search-results" id="site-search-results"></div>
        </div>
    </header>

    <!-- ===== ПАНЕЛЬ "КАРТА САЙТА" ===== -->
    <div class="sitemap-overlay" id="sitemap-overlay" onclick="window.toggleSitemap(false)"></div>
    <div class="sitemap-panel" id="sitemap-panel" role="dialog" aria-label="Карта сайта" aria-modal="true">
        <div class="sitemap-panel-header">
            <span id="sitemap-panel-title">Карта сайта</span>
            <button class="sitemap-close" onclick="window.toggleSitemap(false)" aria-label="Закрыть">✕</button>
        </div>
        <ul class="sitemap-list">
            <li><a href="${HOME}#news"         id="sitemap-news"         onclick="window.toggleSitemap(false)">Новости</a></li>
            <li><a href="${HOME}#events"       id="sitemap-events"       onclick="window.toggleSitemap(false)">Афиша</a></li>
            <li><a href="${HOME}#circles"      id="sitemap-circles"      onclick="window.toggleSitemap(false)">Кружки</a></li>
            <li><a href="${HOME}#map"          id="sitemap-map"          onclick="window.toggleSitemap(false)">Карта</a></li>
            <li><a href="${HOME}#achievements" id="sitemap-achievements" onclick="window.toggleSitemap(false)">Достижения</a></li>
            <li><a href="${HOME}#team"         id="sitemap-team"         onclick="window.toggleSitemap(false)">Команда</a></li>
            <li><a href="${HOME}#gallery"      id="sitemap-gallery"      onclick="window.toggleSitemap(false)">Галерея</a></li>
            <li><a href="/documents.html"      id="sitemap-documents"    onclick="window.toggleSitemap(false)">Документы</a></li>
            <li><a href="/contacts.html"       id="sitemap-contact"      onclick="window.toggleSitemap(false)">Контакты</a></li>
        </ul>
    </div>`;
})();
