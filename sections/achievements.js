window.toggleAchievements = function() {
    window._toggleSection('.ach-extra-item', 'ach-toggle-btn');
};

window.openAchModal = function(idx) {
    const modal = document.getElementById('ach-modal');
    const data  = window._achData;
    if (!modal || !data) return;
    const a = data[idx];

    // Поддержка старого формата image и нового images[]
    const images = (a.images && a.images.length) ? a.images : (a.image ? [a.image] : []);

    // --- Галерея ---
    const gallery = modal.querySelector('.ach-modal-gallery');
    gallery.innerHTML = '';

    if (images.length > 0) {
        let current = 0;

        const imgEl = document.createElement('img');
        imgEl.alt = window.tData(a.title);

        const counter = document.createElement('span');
        counter.className = 'ach-modal-counter';

        const dotsWrap = document.createElement('div');
        dotsWrap.className = 'ach-modal-dots';

        function goTo(i) {
            current = (i + images.length) % images.length;
            imgEl.src = images[current];
            counter.textContent = images.length > 1 ? `${current + 1} / ${images.length}` : '';
            dotsWrap.querySelectorAll('.ach-modal-dot').forEach((d, j) => {
                d.classList.toggle('active', j === current);
            });
        }

        gallery.appendChild(imgEl);

        if (images.length > 1) {
            const prev = document.createElement('button');
            prev.className = 'ach-modal-arrow ach-modal-prev';
            prev.innerHTML = '&#8592;';
            prev.setAttribute('aria-label', 'Назад');
            prev.onclick = () => goTo(current - 1);

            const next = document.createElement('button');
            next.className = 'ach-modal-arrow ach-modal-next';
            next.innerHTML = '&#8594;';
            next.setAttribute('aria-label', 'Вперёд');
            next.onclick = () => goTo(current + 1);

            images.forEach((_, i) => {
                const dot = document.createElement('span');
                dot.className = 'ach-modal-dot';
                dot.onclick = () => goTo(i);
                dotsWrap.appendChild(dot);
            });

            gallery.appendChild(prev);
            gallery.appendChild(next);
            gallery.appendChild(counter);
            gallery.appendChild(dotsWrap);
        }

        goTo(0);
        gallery.style.display = '';
    } else {
        gallery.style.display = 'none';
    }

    modal.querySelector('.ach-modal-year').textContent  = a.year  || '';
    modal.querySelector('.ach-modal-title').textContent = window.tData(a.title);
    modal.querySelector('.ach-modal-desc').textContent  = window.tData(a.description);
    modal.classList.add('is-open');
    document.body.style.overflow = 'hidden';
};

window.closeAchModal = function() {
    const modal = document.getElementById('ach-modal');
    if (!modal) return;
    modal.classList.remove('is-open');
    document.body.style.overflow = '';
};

window.renderAchievements = function(data) {
    if (!data || !data.length) return '';
    window._achData = data;

    const hasMore = data.length > 4;

    const cards = data.map((a, i) => {
        const images = (a.images && a.images.length) ? a.images : (a.image ? [a.image] : []);
        const thumb  = images[0];
        const count  = images.length;

        const imgBlock = thumb
            ? `<div class="ach-img">
                   <img src="${thumb}" alt="${window.tData(a.title)}" loading="lazy">
                   ${count > 1 ? `<span class="ach-img-count">📷 ${count}</span>` : ''}
               </div>`
            : `<div class="ach-img ach-img-placeholder">
                   <svg width="40" height="40" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                       <circle cx="12" cy="8" r="4" stroke="#C8A84B" stroke-width="1.5"/>
                       <path d="M8 14l-2 7h12l-2-7" stroke="#C8A84B" stroke-width="1.5" stroke-linejoin="round"/>
                       <path d="M10 14l2 3 2-3" stroke="#C8A84B" stroke-width="1.5" stroke-linejoin="round"/>
                   </svg>
               </div>`;

        const extra = i >= 4;
        return `
        <div class="ach-card${extra ? ' ach-extra-item' : ''}"${extra ? ' style="display:none"' : ''}
             onclick="window.openAchModal(${i})" role="button" tabindex="0"
             onkeydown="if(event.key==='Enter')window.openAchModal(${i})">
            ${imgBlock}
        </div>`;
    }).join('');

    const modal = `
<div id="ach-modal" class="ach-modal" onclick="if(event.target===this)window.closeAchModal()" role="dialog" aria-modal="true">
    <div class="ach-modal-inner">
        <button class="ach-modal-close" onclick="window.closeAchModal()" aria-label="Закрыть">&times;</button>
        <div class="ach-modal-gallery"></div>
        <div class="ach-modal-body">
            <span class="ach-modal-year"></span>
            <h2 class="ach-modal-title"></h2>
            <p class="ach-modal-desc"></p>
        </div>
    </div>
</div>`;

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
</section>
${modal}`;
};
