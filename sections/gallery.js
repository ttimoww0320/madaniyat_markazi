const GALLERY_SVG_LG = `<svg width="64" height="64" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <rect x="3" y="3" width="18" height="18" rx="2" stroke="#fff" stroke-width="1.5"/>
    <circle cx="8.5" cy="8.5" r="1.5" fill="#fff"/>
    <path d="M21 15l-5-5L5 21" stroke="#fff" stroke-width="1.5"/>
</svg>`;

const GALLERY_SVG_SM = `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <rect x="3" y="3" width="18" height="18" rx="2" stroke="#fff" stroke-width="1.5"/>
    <circle cx="8.5" cy="8.5" r="1.5" fill="#fff"/>
    <path d="M21 15l-5-5L5 21" stroke="#fff" stroke-width="1.5"/>
</svg>`;

window._galleryData = [];

window.renderGallery = function(data) {
    window._galleryData = data;
    const hasMore = data.length > 5;

    const items = data.map((item, idx) => {
        const photos    = item.photos || [];
        const cover     = photos[0] || null;
        const count     = photos.length;
        const clickable = count > 0;
        const extra     = idx >= 5;

        const styles = [];
        if (cover) styles.push(`background-image:url('${cover}')`, `background-size:cover`, `background-position:center`);
        if (extra) styles.push(`display:none`);
        const styleAttr = styles.length ? `style="${styles.join(';')}"` : '';

        const placeholder = !cover ? (item.large ? GALLERY_SVG_LG : GALLERY_SVG_SM) : '';

        const countBadge = count > 1
            ? `<span class="gallery-count">${count > 9 ? '9+' : count + '+'}</span>`
            : '';

        const overlay = (item.alt || count > 1)
            ? `<div class="gallery-overlay">
                   <span class="gallery-title">${item.alt || ''}</span>
                   ${countBadge}
               </div>`
            : '';

        const classes = ['gallery-item', item.large ? 'large' : '', clickable ? 'clickable' : '', extra ? 'gallery-extra-item' : '']
            .filter(Boolean).join(' ');

        return `
        <div class="${classes}" aria-label="${item.alt || ''}" ${styleAttr}
             ${clickable ? `onclick="window.openGalleryItem(${idx})"` : ''}>
            ${placeholder}
            ${overlay}
        </div>`;
    }).join('');

    const headerRight = hasMore
        ? `<button class="section-link-btn" id="gallery-toggle-btn" onclick="window.toggleGallery()">Смотреть все →</button>`
        : `<span class="section-link" style="opacity:.4">Смотреть все →</span>`;

    return `
<div class="section-gray">
    <section class="section" id="gallery">
        <div class="section-header">
            <h2 class="section-title">Галерея</h2>
            ${headerRight}
        </div>
        <div class="gallery-grid">${items}</div>
    </section>
</div>`;
};

window.toggleGallery = function() {
    const items = document.querySelectorAll('.gallery-extra-item');
    const btn   = document.getElementById('gallery-toggle-btn');
    if (!items.length || !btn) return;
    const open = items[0].style.display === 'none';
    items.forEach(el => el.style.display = open ? '' : 'none');
    btn.textContent = open ? 'Скрыть ↑' : 'Смотреть все →';
};

// ── Lightbox ──────────────────────────────────────────
let _lbPhotos  = [];
let _lbCurrent = 0;

window.openGalleryItem = function(idx) {
    const item = window._galleryData[idx];
    if (!item || !item.photos || !item.photos.length) return;
    _lbPhotos  = item.photos;
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
}

document.addEventListener('keydown', e => {
    const lb = document.getElementById('lightbox');
    if (!lb || lb.style.display === 'none') return;
    if (e.key === 'ArrowLeft')  window.lbPrev();
    if (e.key === 'ArrowRight') window.lbNext();
    if (e.key === 'Escape')     window.closeLightbox();
});
