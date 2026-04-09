window.renderAchievements = function(data) {
    if (!data || !data.length) return '';

    const cards = data.map(a => {
        const img = a.image
            ? `<img src="${a.image}" class="ach-img" alt="${a.title}">`
            : `<div class="ach-img-placeholder">
                   <svg width="40" height="40" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                       <circle cx="12" cy="8" r="4" stroke="#C8A84B" stroke-width="1.5"/>
                       <path d="M8 14l-2 7h12l-2-7" stroke="#C8A84B" stroke-width="1.5" stroke-linejoin="round"/>
                       <path d="M10 14l2 3 2-3" stroke="#C8A84B" stroke-width="1.5" stroke-linejoin="round"/>
                   </svg>
               </div>`;
        return `
        <div class="ach-card">
            ${img}
            <div class="ach-body">
                ${a.year ? `<span class="ach-year">${a.year}</span>` : ''}
                <h3 class="ach-title">${a.title}</h3>
                <p class="ach-desc">${a.description}</p>
            </div>
        </div>`;
    }).join('');

    return `
<section class="section" id="achievements">
    <div class="section-center">
        <h2 class="section-title">Наши достижения</h2>
        <p class="section-subtitle">Награды и признание за годы работы</p>
    </div>
    <div class="ach-grid">${cards}</div>
</section>`;
};
