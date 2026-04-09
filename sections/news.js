window.renderNews = function(data) {
    if (!data || !data.length) return '';

    const cards = data.map((n, i) => {
        const extra = i >= 4;
        const img = n.image
            ? `<div class="news-img" style="background-image:url('${n.image}')"></div>`
            : `<div class="news-img news-img-placeholder"></div>`;
        return `
        <article class="news-card${extra ? ' news-extra' : ''}" style="${extra ? 'display:none' : ''}">
            ${img}
            <div class="news-body">
                ${n.date ? `<span class="news-date">${n.date}</span>` : ''}
                <h3 class="news-title">${n.title}</h3>
                <p class="news-text">${n.text}</p>
            </div>
        </article>`;
    }).join('');

    const hasMore = data.length > 4;
    const headerRight = hasMore
        ? `<button class="section-link-btn" id="news-toggle-btn" onclick="window.toggleNews()">Все новости →</button>`
        : `<span class="section-link" style="opacity:.4">Все новости →</span>`;

    return `
<section class="section" id="news">
    <div class="section-header">
        <h2 class="section-title">Новости</h2>
        ${headerRight}
    </div>
    <div class="news-grid">${cards}</div>
</section>`;
};

window.toggleNews = function() {
    const items = document.querySelectorAll('.news-extra');
    const btn   = document.getElementById('news-toggle-btn');
    if (!items.length || !btn) return;
    const open = items[0].style.display === 'none';
    items.forEach(el => el.style.display = open ? '' : 'none');
    btn.textContent = open ? 'Скрыть ↑' : 'Все новости →';
};
