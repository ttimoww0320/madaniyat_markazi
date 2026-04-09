// Иконки по цвету кружка
const CIRCLE_ICONS = {
    purple: `<path d="M12 3v18M3 12h18" stroke="#534AB7" stroke-width="2" stroke-linecap="round"/>`,
    green:  `<circle cx="12" cy="12" r="3" stroke="#1D9E75" stroke-width="1.5"/>
             <path d="M12 2v4m0 12v4m10-10h-4M6 12H2" stroke="#1D9E75" stroke-width="1.5"/>`,
    yellow: `<path d="M9 18V5l12-2v13" stroke="#BA7517" stroke-width="1.5"/>
             <circle cx="6" cy="18" r="3" stroke="#BA7517" stroke-width="1.5"/>`,
    pink:   `<path d="M4 19.5A2.5 2.5 0 016.5 17H20" stroke="#D4537E" stroke-width="1.5"/>
             <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" stroke="#D4537E" stroke-width="1.5"/>`,
};

window.renderCircles = function(data) {
    const hasMore = data.length > 5;

    const cardsHTML = data.map((c, i) => {
        const card = `
        <div class="circle-card">
            <div class="circle-icon ${c.color}">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    ${CIRCLE_ICONS[c.color] || CIRCLE_ICONS.purple}
                </svg>
            </div>
            <h3 class="circle-title">${c.title}</h3>
            <p class="circle-age">${c.age}</p>
            <button class="circle-enroll-btn" onclick="window.openEnroll('${c.title.replace(/'/g,"\\'")}')">Записаться</button>
        </div>`;
        if (i >= 5) {
            return `<div class="circle-extra-item" style="display:none">${card}</div>`;
        }
        return card;
    }).join('');

    const headerRight = hasMore
        ? `<button class="section-link-btn" id="circles-toggle-btn" onclick="window.toggleCircles()">Все кружки →</button>`
        : `<span class="section-link" style="opacity:.4">Все кружки →</span>`;

    return `
<div class="section-gray">
    <section class="section" id="circles">
        <div class="section-header">
            <h2 class="section-title">Кружки и секции</h2>
            ${headerRight}
        </div>
        <div class="grid-4" id="circles-grid">${cardsHTML}</div>
    </section>
</div>`;
};

window.toggleCircles = function() {
    const items = document.querySelectorAll('.circle-extra-item');
    const btn   = document.getElementById('circles-toggle-btn');
    if (!items.length || !btn) return;
    const open = items[0].style.display === 'none';
    items.forEach(el => el.style.display = open ? '' : 'none');
    btn.textContent = open ? 'Скрыть ↑' : 'Все кружки →';
};
