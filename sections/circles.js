// Иконки по цвету кружка
const CIRCLE_ICONS = {
    purple: `<path d="M12 3v18M3 12h18" stroke="#1A3C6E" stroke-width="2" stroke-linecap="round"/>`,
    green:  `<circle cx="12" cy="12" r="3" stroke="#1D9E75" stroke-width="1.5"/>
             <path d="M12 2v4m0 12v4m10-10h-4M6 12H2" stroke="#1D9E75" stroke-width="1.5"/>`,
    yellow: `<path d="M9 18V5l12-2v13" stroke="#BA7517" stroke-width="1.5"/>
             <circle cx="6" cy="18" r="3" stroke="#BA7517" stroke-width="1.5"/>`,
    pink:   `<path d="M4 19.5A2.5 2.5 0 016.5 17H20" stroke="#D4537E" stroke-width="1.5"/>
             <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" stroke="#D4537E" stroke-width="1.5"/>`,
};

window._circlesData = [];

window.renderCircles = function(data) {
    window._circlesData = data;
    const hasMore = data.length > 4;

    const esc = window.escapeHtml;
    const cardsHTML = data.map((c, i) => {
        const descHtml = c.description
            ? `<p class="circle-desc">${esc(window.tData(c.description))}</p>`
            : '';

        const statCells = [];
        if (c.schedule) {
            statCells.push(`<div class="circle-stat-cell">
                <span class="circle-stat-cap">${window.t('circles.schedule')}</span>
                <span class="circle-stat-val">${esc(c.schedule)}</span>
            </div>`);
        }
        if (c.teacher) {
            statCells.push(`<div class="circle-stat-cell">
                <span class="circle-stat-cap">${window.t('circles.teacher')}</span>
                <span class="circle-stat-val">${esc(c.teacher)}</span>
            </div>`);
        }
        const statHtml = statCells.length ? `<div class="circle-stat-row">${statCells.join('')}</div>` : '';

        const spotsNum = parseInt(c.spots, 10);
        const hasSpots = c.spots !== undefined && c.spots !== '';
        const isClosed = hasSpots && !isNaN(spotsNum) && spotsNum === 0;
        const isLow = hasSpots && !isNaN(spotsNum) && spotsNum > 0 && spotsNum <= 5;
        const capacityHtml = hasSpots
            ? `<div class="circle-capacity"><span class="${isClosed ? 'circle-spots-closed' : isLow ? 'circle-spots-low' : 'circle-spots-ok'}" style="width:${isClosed ? 100 : isLow ? 75 : 35}%"></span></div>`
            : '';

        const btnHtml = isClosed
            ? `<button class="circle-waitlist-btn" onclick="window.openEnroll(${i})">${window.t('circles.waitlist')} <svg class="circle-btn-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#999" stroke-width="2"><path d="M5 12h14M13 6l6 6-6 6"/></svg></button>`
            : `<button class="circle-enroll-btn" onclick="window.openEnroll(${i})">${window.t('btn.enroll')} <svg class="circle-btn-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><path d="M5 12h14M13 6l6 6-6 6"/></svg></button>`;

        const iconMarkup = CIRCLE_ICONS[c.color] || CIRCLE_ICONS.purple;
        const iconMarkupWhite = iconMarkup.replace(/stroke="#[0-9A-Fa-f]+"/g, 'stroke="#fff"');

        const card = `
        <div class="circle-card">
            <div class="circle-cover">
                <div class="circle-cover-flag"><span style="background:#1DAEEF"></span><span style="background:#fff"></span><span style="background:#1EB57E"></span></div>
                <div class="circle-cover-wm" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none">${iconMarkupWhite}</svg>
                </div>
                <span class="circle-age-tag">${esc(window.tData(c.age))}</span>
            </div>
            <div class="circle-badge-wrap">
                <div class="circle-badge">
                    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">${iconMarkup}</svg>
                </div>
            </div>
            <div class="circle-body">
                <h3 class="circle-title">${esc(window.tData(c.title))}</h3>
                <div class="circle-title-rule"></div>
                ${descHtml}
                ${statHtml}
                ${capacityHtml}
                ${btnHtml}
            </div>
        </div>`;
        if (i >= 4) {
            return `<div class="circle-extra-item" style="display:none">${card}</div>`;
        }
        return card;
    }).join('');

    return `
<div class="section-gray">
    <section class="section" id="circles">
        <div class="section-header">
            <h2 class="section-title">${window.t('sections.circles')}</h2>
        </div>
        <div class="grid-4" id="circles-grid">${cardsHTML}</div>
        ${hasMore ? window.renderToggleBtn('circles-toggle-btn', 'window.toggleCircles()') : ''}
    </section>
</div>`;
};

window.toggleCircles = function() {
    window._toggleSection('.circle-extra-item', 'circles-toggle-btn');
};
