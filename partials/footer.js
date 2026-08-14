// Общий футер сайта + кнопка "Наверх" — используется на всех страницах через document.write().
(function () {
    const isHome = location.pathname === '/' || location.pathname === '/dom-kultury.html';
    const HOME = isHome ? '' : '/dom-kultury.html';

    window.FOOTER_HTML = `
    <!-- ===== ПОДВАЛ ===== -->
    <footer class="footer">

        <div class="footer-body">

            <!-- Колонка 1: Лого + описание -->
            <div class="footer-col footer-col--brand">
                <div class="footer-logo">
                    <div class="footer-logo-icon">
                        <img src="/uploads/logo.png" alt="Логотип" width="40" height="40" style="object-fit:contain;" onerror="window.imgFallback(this,'landmark')">
                    </div>
                    <span class="footer-logo-text" id="footer-logo-text">Дом культуры</span>
                </div>
                <p class="footer-brand-desc" id="footer-requisites"></p>
                <!-- Соцсети -->
                <div class="footer-socials-row" id="footer-socials-row"></div>
            </div>

            <div class="footer-divider-v"></div>

            <!-- Колонка 2: Навигация -->
            <div class="footer-col">
                <div class="footer-col-title" id="footer-col-nav-title">Разделы сайта</div>
                <div class="footer-nav-grid">
                    <a href="${HOME}#news" id="footer-fnav-news">Новости</a>
                    <a href="${HOME}#events" id="footer-fnav-events">Афиша</a>
                    <a href="${HOME}#circles" id="footer-fnav-circles">Кружки</a>
                    <a href="${HOME}#map" id="footer-fnav-map">Карта</a>
                    <a href="${HOME}#achievements" id="footer-fnav-achievements">Достижения</a>
                    <a href="/team.html" id="footer-fnav-team">Команда</a>
                    <a href="${HOME}#gallery" id="footer-fnav-gallery">Галерея</a>
                    <a href="/documents.html" id="footer-fnav-documents">Документы</a>
                    <a href="/contacts.html" id="footer-fnav-contact">Контакты</a>
                </div>
            </div>

            <div class="footer-divider-v"></div>

            <!-- Колонка 3: Контакты -->
            <div class="footer-col">
                <div class="footer-col-title" id="footer-col-contacts-title">Контакты</div>
                <div class="footer-contact-list" id="footer-contact-list"></div>
            </div>


        </div>

        <!-- Нижняя строка -->
        <div class="footer-bottom">
            <div class="footer-bottom-left">
                <div class="footer-flag-mini">
                    <span style="background:#1DAEEF"></span>
                    <span style="background:#fff"></span>
                    <span style="background:#1EB57E"></span>
                </div>
                <p class="footer-copy" id="footer-copyright">© 2026 Все права защищены</p>
            </div>
            <p class="footer-official" id="footer-official">Официальный сайт государственного учреждения</p>
        </div>

    </footer>

    <!-- Кнопка "Наверх" -->
    <button id="back-to-top" onclick="window.scrollTo({top:0,behavior:'smooth'})" aria-label="Наверх">&#8593;</button>`;
})();
