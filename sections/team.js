// SVG иконка человека с заданным цветом обводки
function personSVG(size, stroke) {
    return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="8" r="4" stroke="${stroke}" stroke-width="1.5"/>
        <path d="M4 20c0-4 4-6 8-6s8 2 8 6" stroke="${stroke}" stroke-width="1.5"/>
    </svg>`;
}

function photoAvatar(photo, cssClass, fallbackSvg) {
    if (photo) {
        return `<div class="avatar ${cssClass}" style="padding:0;overflow:hidden;"><img src="${photo}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:50%;display:block;"></div>`;
    }
    return `<div class="avatar ${cssClass}">${fallbackSvg}</div>`;
}

const DEPUTY_COLORS = { green: '#0F6E56', blue: '#185FA5', yellow: '#854F0B' };

window.toggleDeputies = function() {
    const items = document.querySelectorAll('.deputy-extra-item');
    const btn   = document.getElementById('deputy-toggle-btn');
    if (!items.length || !btn) return;
    const open = items[0].style.display === 'none';
    items.forEach(el => el.style.display = open ? '' : 'none');
    btn.textContent = open ? window.t('btn.hideAll') : window.t('btn.showAll');
};

window.renderTeam = function(data) {
    const { director, deputies, staff } = data;

    const deputyCards = deputies.map((d, i) => `
        <div class="deputy-card${i >= 3 ? ' deputy-extra-item' : ''}"${i >= 3 ? ' style="display:none"' : ''}>
            ${photoAvatar(d.photo, `md ${d.color}`, personSVG(36, DEPUTY_COLORS[d.color] || '#888'))}
            <span class="badge sm ${d.color}">${window.tData(d.role)}</span>
            <h3 class="name-md">${d.name}</h3>
            <p class="title-sm">${window.tData(d.department)}</p>
            <p class="contact-text"><a href="tel:${d.phone}">${d.phone}</a></p>
            <p class="contact-text"><a href="mailto:${d.email}" class="contact-email">${d.email}</a></p>
        </div>
    `).join('');

    const staffCards = staff.map(s => `
        <div class="staff-card">
            ${photoAvatar(s.photo, 'sm', personSVG(28, '#888'))}
            <h4 class="name-sm">${s.name}</h4>
            <p class="title-xs">${window.tData(s.role)}</p>
            <a href="tel:${s.phone}" class="phone-sm">${s.phone}</a>
        </div>
    `).join('');

    const hourLines = (director.hours || []).map(h =>
        `<p>${window.tData(h)}</p>`
    ).join('');

    return `
<section class="section" id="team">
    <div class="section-center">
        <h2 class="section-title">${window.t('sections.team')}</h2>
        <p class="section-subtitle">${window.t('sections.teamSub')}</p>
    </div>

    <div class="director-card">
        ${photoAvatar(director.photo, 'lg', personSVG(56, '#1A3C6E'))}
        <span class="badge purple">${window.t('team.director')}</span>
        <h3 class="name-lg">${director.name}</h3>
        <p class="title-text">${window.tData(director.title)}</p>
        <div class="hours-box">
            <div class="hours-title">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <rect x="3" y="4" width="18" height="18" rx="2" stroke="#1A3C6E" stroke-width="1.5"/>
                    <path d="M16 2v4M8 2v4M3 10h18" stroke="#1A3C6E" stroke-width="1.5"/>
                </svg>
                ${window.t('team.hours')}
            </div>
            ${hourLines}
        </div>
        <a href="tel:${director.phone}" class="contact-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" stroke="#1A3C6E" stroke-width="1.5"/>
            </svg>
            ${director.phone}
        </a>
        <a href="mailto:${director.email}" class="contact-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="#1A3C6E" stroke-width="1.5"/>
                <path d="M22 6l-10 7L2 6" stroke="#1A3C6E" stroke-width="1.5"/>
            </svg>
            ${director.email}
        </a>
    </div>

    <div class="deputies-grid">${deputyCards}</div>
    ${deputies.length > 3 ? `
    <div style="text-align:center;margin-top:32px;margin-bottom:40px;">
        <button id="deputy-toggle-btn" onclick="window.toggleDeputies()" style="
            display:inline-flex;align-items:center;gap:8px;
            padding:11px 32px;border-radius:10px;border:2px solid #1A3C6E;
            background:#fff;color:#1A3C6E;font-size:15px;font-weight:600;
            cursor:pointer;font-family:inherit;transition:background .2s,color .2s;">${window.t('btn.showAll')}</button>
    </div>` : ''}
    <div class="staff-grid">${staffCards}</div>
</section>`;
};
