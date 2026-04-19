window.renderNews = function(data) {
    if (!data || !data.length) return '';

    const TG_CHANNEL = 'madaniyatvazirligi';

    const cards = data.map(n => {
        const img = n.image
            ? `<div class="news-img news-img-loading${n.isVideo ? ' news-img-video' : ''}">
                <img src="${n.image}" alt="" loading="lazy" onload="this.parentElement.classList.remove('news-img-loading')" onerror="this.parentElement.classList.add('news-img-error');this.remove()">
                ${n.isVideo ? `<div class="news-play-btn">▶</div>` : ''}
               </div>`
            : `<div class="news-img news-img-placeholder"></div>`;
        const tgLink = n.tgId ? `https://t.me/${TG_CHANNEL}/${n.tgId}` : null;
        const tag = tgLink ? `a href="${tgLink}" target="_blank" rel="noopener"` : 'article';
        const closeTag = tgLink ? 'a' : 'article';
        return `
        <${tag} class="news-card${tgLink ? ' news-card--link' : ''}">
            ${img}
            <div class="news-body">
                ${n.date ? `<span class="news-date">${n.date}</span>` : ''}
                <h3 class="news-title">${window.tData(n.title)}</h3>
                <p class="news-text">${window.tData(n.text)}</p>
                ${tgLink ? `<span class="news-tg-hint">Читать в Telegram →</span>` : ''}
            </div>
        </${closeTag}>`;
    }).join('');

    return `
<section class="section" id="news">
    <div class="news-section-header">
        <h2 class="section-title">${window.t('sections.news')}</h2>
        <div class="news-nav-btns">
            <button class="news-nav-btn" id="news-prev" onclick="window.scrollNews(-1)" aria-label="Назад">&#8592;</button>
            <button class="news-nav-btn" id="news-next" onclick="window.scrollNews(1)" aria-label="Вперёд">&#8594;</button>
        </div>
    </div>
    <div class="news-track-wrap">
        <div class="news-track" id="news-track">${cards}</div>
    </div>
</section>`;
};

window.scrollNews = function(dir) {
    const track = document.getElementById('news-track');
    if (!track) return;
    const card = track.querySelector('.news-card');
    const step = card ? card.offsetWidth + 24 : 320;
    track.scrollBy({ left: dir * step, behavior: 'smooth' });
};
