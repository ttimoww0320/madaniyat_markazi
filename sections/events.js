// Иконки по цвету события
const EVENT_ICONS = {
    blue: `<circle cx="12" cy="12" r="10" stroke="#185FA5" stroke-width="1.5"/>
           <path d="M12 6v6l4 2" stroke="#185FA5" stroke-width="1.5" stroke-linecap="round"/>`,
    yellow: `<rect x="3" y="3" width="18" height="18" rx="2" stroke="#854F0B" stroke-width="1.5"/>
             <path d="M3 9h18M9 21V9" stroke="#854F0B" stroke-width="1.5"/>`,
    green: `<path d="M9 18V5l12-2v13" stroke="#0F6E56" stroke-width="1.5"/>
            <circle cx="6" cy="18" r="3" stroke="#0F6E56" stroke-width="1.5"/>
            <circle cx="18" cy="16" r="3" stroke="#0F6E56" stroke-width="1.5"/>`,
};

function buildEventCard(ev) {
    const imageContent = ev.image
        ? `<img src="${ev.image}" alt="${window.tData(ev.title)}" style="width:100%;height:100%;object-fit:cover;">`
        : `<svg width="56" height="56" viewBox="0 0 24 24" fill="none" aria-hidden="true">
               ${EVENT_ICONS[ev.color] || EVENT_ICONS.blue}
           </svg>`;

    return `
    <div class="card">
        <div class="event-image ${ev.image ? '' : ev.color}" style="${ev.image ? 'padding:0' : ''}">
            ${imageContent}
        </div>
        <div class="event-content">
            <span class="event-date ${ev.color !== 'blue' ? ev.color : ''}">${window.tData(ev.date)}</span>
            <h3 class="event-title">${window.tData(ev.title)}</h3>
            <p class="event-meta">${window.tData(ev.place)} • ${ev.time}</p>
        </div>
    </div>`;
}

window.renderEvents = function(data) {
    const hasMore = data.length > 3;

    const cardsHTML = data.map((ev, i) => {
        if (i >= 3) {
            return `<div class="event-extra-item" style="display:none">${buildEventCard(ev)}</div>`;
        }
        return buildEventCard(ev);
    }).join('');

    return `
<section class="section" id="events">
    <div class="section-header">
        <h2 class="section-title">${window.t('sections.events')}</h2>
    </div>
    <div class="grid-3" id="events-grid">${cardsHTML}</div>
    ${hasMore ? `
    <div style="text-align:center;margin-top:32px;margin-bottom:40px;">
        <button id="events-toggle-btn" onclick="window.toggleEvents()" style="
            display:inline-flex;align-items:center;gap:8px;
            padding:11px 32px;border-radius:10px;border:2px solid #1A3C6E;
            background:#fff;color:#1A3C6E;font-size:15px;font-weight:600;
            cursor:pointer;font-family:inherit;transition:background .2s,color .2s;">${window.t('btn.showAll')}</button>
    </div>` : ''}
</section>`;
};

window.toggleEvents = function() {
    const items = document.querySelectorAll('.event-extra-item');
    const btn   = document.getElementById('events-toggle-btn');
    if (!items.length || !btn) return;
    const open = items[0].style.display === 'none';
    items.forEach(el => el.style.display = open ? '' : 'none');
    btn.textContent = open ? window.t('btn.hideAll') : window.t('btn.showAll');
};
