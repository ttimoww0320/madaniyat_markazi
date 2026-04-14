window.renderNews = function(data) {
    if (!data || !data.length) return '';

    const hasMore = data.length > 3;

    const cards = data.map((n, i) => {
        const extra = i >= 3;
        const img = n.image
            ? `<div class="news-img" style="background-image:url('${n.image}')"></div>`
            : `<div class="news-img news-img-placeholder"></div>`;
        return `
        <article class="news-card${extra ? ' news-extra' : ''}" style="${extra ? 'display:none' : ''}">
            ${img}
            <div class="news-body">
                ${n.date ? `<span class="news-date">${n.date}</span>` : ''}
                <h3 class="news-title">${window.tData(n.title)}</h3>
                <p class="news-text">${window.tData(n.text)}</p>
            </div>
        </article>`;
    }).join('');

    return `
<section class="section" id="news">
    <div class="section-header">
        <h2 class="section-title">${window.t('sections.news')}</h2>
    </div>
    <div class="news-grid">${cards}</div>
    ${hasMore ? `
    <div style="text-align:center;margin-top:32px;margin-bottom:40px;">
        <button id="news-toggle-btn" onclick="window.toggleNews()" style="
            display:inline-flex;align-items:center;gap:8px;
            padding:11px 32px;border-radius:10px;border:2px solid #1A3C6E;
            background:#fff;color:#1A3C6E;font-size:15px;font-weight:600;
            cursor:pointer;font-family:inherit;transition:background .2s,color .2s;">${window.t('btn.showAll')}</button>
    </div>` : ''}
</section>`;
};

window.toggleNews = function() {
    const items = document.querySelectorAll('.news-extra');
    const btn   = document.getElementById('news-toggle-btn');
    if (!items.length || !btn) return;
    const open = items[0].style.display === 'none';
    items.forEach(el => el.style.display = open ? '' : 'none');
    btn.textContent = open ? window.t('btn.hideAll') : window.t('btn.showAll');
};
