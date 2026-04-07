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
        ? `<img src="${ev.image}" alt="${ev.title}" style="width:100%;height:100%;object-fit:cover;">`
        : `<svg width="56" height="56" viewBox="0 0 24 24" fill="none" aria-hidden="true">
               ${EVENT_ICONS[ev.color] || EVENT_ICONS.blue}
           </svg>`;

    return `
    <div class="card">
        <div class="event-image ${ev.image ? '' : ev.color}" style="${ev.image ? 'padding:0' : ''}">
            ${imageContent}
        </div>
        <div class="event-content">
            <span class="event-date ${ev.color !== 'blue' ? ev.color : ''}">${ev.date}</span>
            <h3 class="event-title">${ev.title}</h3>
            <p class="event-meta">${ev.place} • ${ev.time}</p>
        </div>
    </div>`;
}


window.renderEvents = function(data) {
    const hasMore = data.length > 3;

    // Все карточки в одной сетке — 4-я и далее скрыты
    const cardsHTML = data.map((ev, i) => {
        if (i >= 3) {
            return `<div class="event-extra-item" style="display:none">${buildEventCard(ev)}</div>`;
        }
        return buildEventCard(ev);
    }).join('');

    const headerRight = hasMore
        ? `<button class="section-link-btn" id="events-toggle-btn" onclick="window.toggleEvents()">Все события →</button>`
        : `<span class="section-link" style="opacity:.4">Все события →</span>`;

    return `
<section class="section" id="events">
    <div class="section-header">
        <h2 class="section-title">Ближайшие события</h2>
        ${headerRight}
    </div>
    <div class="grid-3" id="events-grid">${cardsHTML}</div>
</section>`;
};

window.toggleEvents = function() {
    const items = document.querySelectorAll('.event-extra-item');
    const btn   = document.getElementById('events-toggle-btn');
    if (!items.length || !btn) return;
    const open = items[0].style.display === 'none';
    items.forEach(el => el.style.display = open ? '' : 'none');
    btn.textContent = open ? 'Скрыть ↑' : 'Все события →';
};
