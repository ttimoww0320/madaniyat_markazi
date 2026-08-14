// Компактная замена полной секции "Команда" на главной странице —
// только директор + ссылка на полную команду (team.html).
window.renderTeamTeaser = function(data) {
    const director = data && data.director;
    if (!director) return '';

    const esc = window.escapeHtml;
    const hourLines = (director.hours || []).map(h => esc(window.tData(h))).join(', ');

    const photo = director.photo
        ? `<div class="team-teaser-photo"><img src="${esc(director.photo)}" alt="" onerror="window.imgFallback(this,'person')"></div>`
        : `<div class="team-teaser-photo"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="8" r="4" stroke="currentColor" stroke-width="1.5"/><path d="M4 20c0-4 4-6 8-6s8 2 8 6" stroke="currentColor" stroke-width="1.5"/></svg></div>`;

    return `
<section class="section" id="team">
    <div class="section-block">
        <h2 class="section-title">${window.t('sections.team')}</h2>
    </div>
    <div class="team-teaser">
        ${photo}
        <div class="team-teaser-info">
            <div class="team-teaser-name">${esc(director.name)}</div>
            <div class="team-teaser-role">${esc(window.t('team.director'))} · ${esc(window.tData(director.title))}</div>
            <div class="team-teaser-meta">
                ${hourLines ? `
                <span class="team-teaser-meta-item">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" stroke-width="1.5"/><path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" stroke-width="1.5"/></svg>
                    ${hourLines}
                </span>` : ''}
                ${director.phone ? `
                <span class="team-teaser-meta-item">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" stroke="currentColor" stroke-width="1.5"/></svg>
                    <a href="tel:${esc(director.phone)}">${esc(director.phone)}</a>
                </span>` : ''}
            </div>
        </div>
        <a class="btn-outline team-teaser-cta" href="/team.html">${esc(window.t('team.viewAll'))} →</a>
    </div>
</section>`;
};
