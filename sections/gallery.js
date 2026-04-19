window._galleryData = [];

window.renderGallery = function(data) {
    window._galleryData = data;

    if (!data.length) {
        return `
<div class="section-gray">
    <section class="section" id="gallery">
        <div class="section-header">
            <h2 class="section-title">${window.t('sections.gallery')}</h2>
        </div>
    </section>
</div>`;
    }

    const makeCard = (item, idx) => {
        const photos = item.photos || [];
        const cover  = photos[0] || null;
        const count  = photos.length;

        const imgEl = cover
            ? `<div class="news-img news-img-loading">
                <img src="${cover}" alt="" loading="lazy"
                    onload="this.parentElement.classList.remove('news-img-loading')"
                    onerror="this.parentElement.classList.add('news-img-error');this.remove()">
                ${count > 1 ? `<span class="gallery-count">${count > 9 ? '9+' : count + '+'}</span>` : ''}
               </div>`
            : `<div class="news-img news-img-placeholder"></div>`;

        return `
        <div class="news-card gallery-card${count > 0 ? ' clickable' : ''}"
             ${count > 0 ? `onclick="window.openGalleryItem(${idx})"` : ''}>
            ${imgEl}
            <div class="news-body">
                <h3 class="news-title">${window.tData(item.alt)}</h3>
            </div>
        </div>`;
    };

    // Дублируем карточки для бесшовной бегущей строки
    const set1 = data.map((item, idx) => makeCard(item, idx)).join('');
    const set2 = data.map((item, idx) => makeCard(item, idx)).join('');

    // Скорость: ~8 секунд на карточку, минимум 40 сек
    const duration = Math.max(40, data.length * 8);

    return `
<div class="section-gray">
    <section class="section" id="gallery">
        <div class="section-header">
            <h2 class="section-title">${window.t('sections.gallery')}</h2>
        </div>
        <div class="gallery-marquee-outer">
            <div class="gallery-marquee-track" style="animation-duration:${duration}s">
                <div class="gallery-marquee-set">${set1}</div>
                <div class="gallery-marquee-set">${set2}</div>
            </div>
        </div>
    </section>
</div>`;
};

// ── Lightbox ──────────────────────────────────────────
let _lbPhotos  = [];
let _lbCurrent = 0;
let _lbTitle   = '';

window.openGalleryItem = function(idx) {
    const item = window._galleryData[idx];
    if (!item || !item.photos || !item.photos.length) return;
    _lbPhotos  = item.photos;
    _lbTitle   = window.tData(item.alt) || '';
    _lbCurrent = 0;
    _lbRender();
    document.getElementById('lightbox').style.display = 'flex';
    document.body.style.overflow = 'hidden';
};

window.closeLightbox = function() {
    document.getElementById('lightbox').style.display = 'none';
    document.body.style.overflow = '';
};

window.lbPrev = function() {
    _lbCurrent = (_lbCurrent - 1 + _lbPhotos.length) % _lbPhotos.length;
    _lbRender();
};

window.lbNext = function() {
    _lbCurrent = (_lbCurrent + 1) % _lbPhotos.length;
    _lbRender();
};

function _lbRender() {
    document.getElementById('lb-img').src = _lbPhotos[_lbCurrent];
    document.getElementById('lb-counter').textContent =
        _lbPhotos.length > 1 ? `${_lbCurrent + 1} / ${_lbPhotos.length}` : '';
    document.getElementById('lb-prev').style.display = _lbPhotos.length > 1 ? '' : 'none';
    document.getElementById('lb-next').style.display = _lbPhotos.length > 1 ? '' : 'none';
    const titleEl = document.getElementById('lb-title');
    if (titleEl) { titleEl.textContent = _lbTitle; titleEl.style.display = _lbTitle ? '' : 'none'; }
}

document.addEventListener('keydown', e => {
    const lb = document.getElementById('lightbox');
    if (!lb || lb.style.display === 'none') return;
    if (e.key === 'ArrowLeft')  window.lbPrev();
    if (e.key === 'ArrowRight') window.lbNext();
    if (e.key === 'Escape')     window.closeLightbox();
});
