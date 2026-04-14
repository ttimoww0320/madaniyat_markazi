window.toggleAchievements = function() {
    const items = document.querySelectorAll('.ach-extra-item');
    const btn   = document.getElementById('ach-toggle-btn');
    if (!items.length || !btn) return;
    const open = items[0].style.display === 'none';
    items.forEach(el => el.style.display = open ? '' : 'none');
    btn.textContent = open ? window.t('btn.hideAll') : window.t('btn.showAll');
};

window.renderAchievements = function(data) {
    if (!data || !data.length) return '';

    const hasMore = data.length > 4;

    const cards = data.map((a, i) => {
        const img = a.image
            ? `<img src="${a.image}" class="ach-img" alt="${window.tData(a.title)}">`
            : `<div class="ach-img-placeholder">
                   <svg width="40" height="40" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                       <circle cx="12" cy="8" r="4" stroke="#C8A84B" stroke-width="1.5"/>
                       <path d="M8 14l-2 7h12l-2-7" stroke="#C8A84B" stroke-width="1.5" stroke-linejoin="round"/>
                       <path d="M10 14l2 3 2-3" stroke="#C8A84B" stroke-width="1.5" stroke-linejoin="round"/>
                   </svg>
               </div>`;
        const extra = i >= 4;
        return `
        <div class="ach-card${extra ? ' ach-extra-item' : ''}"${extra ? ' style="display:none"' : ''}>
            ${img}
            <div class="ach-body">
                ${a.year ? `<span class="ach-year">${a.year}</span>` : ''}
                <h3 class="ach-title">${window.tData(a.title)}</h3>
                <p class="ach-desc">${window.tData(a.description)}</p>
            </div>
        </div>`;
    }).join('');

    return `
<section class="section" id="achievements">
    <div class="section-center">
        <h2 class="section-title">${window.t('sections.achievements')}</h2>
        <p class="section-subtitle">${window.t('sections.achievementsSub')}</p>
    </div>
    <div class="ach-grid">${cards}</div>
    ${hasMore ? `
    <div style="text-align:center;margin-top:32px;margin-bottom:40px;">
        <button id="ach-toggle-btn" onclick="window.toggleAchievements()" style="
            display:inline-flex;align-items:center;gap:8px;
            padding:11px 32px;border-radius:10px;border:2px solid #1A3C6E;
            background:#fff;color:#1A3C6E;font-size:15px;font-weight:600;
            cursor:pointer;font-family:inherit;transition:background .2s,color .2s;">${window.t('btn.showAll')}</button>
    </div>` : ''}
</section>`;
};
