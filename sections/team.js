// SVG иконка человека — цвет наследуется от контейнера (.avatar)
function personSVG(size) {
    return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="8" r="4" stroke="currentColor" stroke-width="1.5"/>
        <path d="M4 20c0-4 4-6 8-6s8 2 8 6" stroke="currentColor" stroke-width="1.5"/>
    </svg>`;
}

function photoAvatar(photo, cssClass, fallbackSvg) {
    if (photo) {
        return `<div class="avatar ${cssClass}" style="padding:0;overflow:hidden;"><img src="${photo}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:50%;display:block;" onerror="window.imgFallback(this,'person')"></div>`;
    }
    return `<div class="avatar ${cssClass}">${fallbackSvg}</div>`;
}

// Хранилище данных для модалки
window._deputiesData = [];

window.toggleDeputies = function() {
    window._toggleSection('.deputy-extra-item', 'deputy-toggle-btn');
};

window.renderTeam = function(data) {
    const { director, deputies, staff } = data;

    // Сохраняем данные для модалки
    window._deputiesData = deputies;

    const esc = window.escapeHtml;
    const deputyCards = deputies.map((d, i) => {
        const hasBio = !!d.bio;
        const clickAttr = hasBio ? `onclick="window.openBioModal(${i})" style="cursor:pointer;"` : '';
        const extraStyle = i >= 4 ? 'display:none;' : '';
        return `
        <div class="deputy-card${i >= 4 ? ' deputy-extra-item' : ''}" ${clickAttr} style="${extraStyle}">
            ${photoAvatar(d.photo, `md ${esc(d.color)}`, personSVG(36))}
            <span class="badge sm ${esc(d.color)}">${esc(window.tData(d.role))}</span>
            <h3 class="name-md">${esc(d.name)}</h3>
            <p class="title-sm">${esc(window.tData(d.department))}</p>
            <p class="contact-text"><a href="tel:${esc(d.phone)}" onclick="event.stopPropagation()">${esc(d.phone)}</a></p>
            <p class="contact-text"><a href="mailto:${esc(d.email)}" class="contact-email" onclick="event.stopPropagation()">${esc(d.email)}</a></p>
            ${hasBio ? `<div style="margin-top:auto;padding:7px 0;font-size:13px;font-weight:600;color:var(--color-primary);text-align:center;">${window.t('team.bioBtn')} →</div>` : '<div style="margin-top:auto;"></div>'}
        </div>`;
    }).join('');

    const staffCards = staff.map(s => `
        <div class="staff-card">
            ${photoAvatar(s.photo, 'sm', personSVG(28))}
            <h4 class="name-sm">${esc(s.name)}</h4>
            <p class="title-xs">${esc(window.tData(s.role))}</p>
            <a href="tel:${esc(s.phone)}" class="phone-sm">${esc(s.phone)}</a>
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
        ${photoAvatar(director.photo, 'lg', personSVG(56))}
        <span class="badge purple">${window.t('team.director')}</span>
        <h3 class="name-lg">${director.name}</h3>
        <p class="title-text">${window.tData(director.title)}</p>
        <div class="hours-box">
            <div class="hours-title">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true" style="color:var(--color-primary)">
                    <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" stroke-width="1.5"/>
                    <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" stroke-width="1.5"/>
                </svg>
                ${window.t('team.hours')}
            </div>
            ${hourLines}
        </div>
        <a href="tel:${director.phone}" class="contact-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" stroke="currentColor" stroke-width="1.5"/>
            </svg>
            ${director.phone}
        </a>
        <a href="mailto:${director.email}" class="contact-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="currentColor" stroke-width="1.5"/>
                <path d="M22 6l-10 7L2 6" stroke="currentColor" stroke-width="1.5"/>
            </svg>
            ${director.email}
        </a>
    </div>

    <div class="deputies-grid">${deputyCards}</div>
    ${deputies.length > 4 ? window.renderToggleBtn('deputy-toggle-btn', 'window.toggleDeputies()') : ''}
    <div class="staff-grid">${staffCards}</div>
</section>`;
};

window.openBioModal = function(idx) {
    const d = window._deputiesData[idx];
    if (!d || !d.bio) return;
    const bio = d.bio;

    const esc = window.escapeHtml;
    const careerRows = (bio.career || []).map(c =>
        `<tr>
            <td style="white-space:nowrap;padding:6px 12px 6px 0;color:var(--color-text-secondary);font-size:13px;vertical-align:top;">${esc(c.years)}</td>
            <td style="padding:6px 0;font-size:14px;line-height:1.5;">${esc(c.place)}</td>
        </tr>`
    ).join('');

    document.getElementById('bio-modal-content').innerHTML = `
        <div style="display:flex;align-items:center;gap:16px;margin-bottom:20px;">
            ${d.photo
                ? `<div style="width:72px;height:72px;border-radius:50%;flex-shrink:0;overflow:hidden;"><img src="${esc(d.photo)}" alt="" style="width:100%;height:100%;object-fit:cover;display:block;" onerror="window.imgFallback(this,'person')"></div>`
                : `<div style="width:72px;height:72px;border-radius:50%;background:var(--color-border);flex-shrink:0;"></div>`}
            <div>
                <div style="font-size:18px;font-weight:700;color:var(--color-primary);">${esc(d.name)}</div>
                <div style="font-size:14px;color:var(--color-text-secondary);margin-top:4px;">${esc(window.tData(d.department))}</div>
            </div>
        </div>
        <table style="width:100%;border-collapse:collapse;margin-bottom:16px;">
            <tr><td style="padding:6px 12px 6px 0;color:var(--color-text-secondary);font-size:13px;width:130px;">${window.t('team.bio.born')}</td><td style="font-size:14px;">${esc(bio.born || '—')}</td></tr>
            <tr><td style="padding:6px 12px 6px 0;color:var(--color-text-secondary);font-size:13px;">${window.t('team.bio.education')}</td><td style="font-size:14px;">${esc(bio.education || '—')}</td></tr>
            <tr><td style="padding:6px 12px 6px 0;color:var(--color-text-secondary);font-size:13px;">${window.t('team.bio.specialization')}</td><td style="font-size:14px;">${esc(bio.specialization || '—')}</td></tr>
        </table>
        <div style="font-size:14px;font-weight:700;color:var(--color-primary);margin-bottom:10px;border-bottom:2px solid var(--color-border);padding-bottom:8px;">${window.t('team.bio.career')}</div>
        <table style="width:100%;border-collapse:collapse;">${careerRows}</table>
    `;

    const modal = document.getElementById('bio-modal');
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
};

window.closeBioModal = function() {
    document.getElementById('bio-modal').style.display = 'none';
    document.body.style.overflow = '';
};

document.addEventListener('keydown', e => {
    if (e.key === 'Escape') window.closeBioModal();
});
