// SVG иконки по цвету документа
const DOC_ICON_PATHS = {
    red:    { stroke: '#A32D2D', path: `<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="#A32D2D" stroke-width="1.5"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="#A32D2D" stroke-width="1.5"/>` },
    green:  { stroke: '#0F6E56', path: `<path d="M22 11.08V12a10 10 0 11-5.93-9.14" stroke="#0F6E56" stroke-width="1.5"/><path d="M22 4L12 14.01l-3-3" stroke="#0F6E56" stroke-width="1.5" stroke-linecap="round"/>` },
    blue:   { stroke: '#185FA5', path: `<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="#185FA5" stroke-width="1.5"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="#185FA5" stroke-width="1.5"/>` },
    yellow: { stroke: '#854F0B', path: `<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="#854F0B" stroke-width="1.5"/>` },
};

const SMALL_DOC_SVG = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="#888" stroke-width="1.5"/>
    <path d="M14 2v6h6" stroke="#888" stroke-width="1.5"/>
</svg>`;

window.toggleDocuments = function() {
    const items = document.querySelectorAll('.doc-extra-item');
    const btn   = document.getElementById('docs-toggle-btn');
    if (!items.length || !btn) return;
    const open = items[0].style.display === 'none';
    items.forEach(el => el.style.display = open ? '' : 'none');
    btn.textContent = open ? window.t('btn.hideAll') : window.t('btn.showAll');
};

window.renderDocuments = function(data) {
    const hasMore = data.main.length > 3;

    const mainCards = data.main.map((doc, i) => {
        const downloadBtn = doc.file
            ? `<a class="doc-download" href="${doc.file}" download="${window.tData(doc.title)}">${window.t('btn.download')}</a>`
            : `<span class="doc-download" style="opacity:.4;cursor:default">${window.t('btn.download')}</span>`;
        const extra = i >= 3;
        return `
        <div class="doc-card${extra ? ' doc-extra-item' : ''}"${extra ? ' style="display:none"' : ''}>
            <div class="doc-icon ${doc.color}">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    ${(DOC_ICON_PATHS[doc.color] || DOC_ICON_PATHS.blue).path}
                </svg>
            </div>
            <div class="doc-info">
                <h3 class="doc-title">${window.tData(doc.title)}</h3>
                <p class="doc-desc">${window.tData(doc.description)}</p>
                <div class="doc-meta">
                    <span class="doc-size">${doc.size}</span>
                    ${downloadBtn}
                </div>
            </div>
        </div>`;
    }).join('');

    const smallCards = data.small.map(doc => {
        const tag   = doc.file ? 'a' : 'div';
        const attrs = doc.file ? `href="${doc.file}" download="${window.tData(doc.title)}"` : '';
        return `
        <${tag} class="doc-small" ${attrs}>
            <div class="doc-small-icon">${SMALL_DOC_SVG}</div>
            <div>
                <h4 class="doc-small-title">${window.tData(doc.title)}</h4>
                <p class="doc-small-size">${doc.size}</p>
            </div>
        </${tag}>`;
    }).join('');

    return `
<div class="section-gray">
    <section class="section" id="documents">
        <div class="section-center">
            <h2 class="section-title">${window.t('sections.documents')}</h2>
            <p class="section-subtitle">${window.t('sections.documentsSub')}</p>
        </div>
        <div class="docs-main">${mainCards}</div>
        ${hasMore ? `
        <div style="text-align:center;margin-top:32px;margin-bottom:40px;">
            <button id="docs-toggle-btn" onclick="window.toggleDocuments()" style="
                display:inline-flex;align-items:center;gap:8px;
                padding:11px 32px;border-radius:10px;border:2px solid #1A3C6E;
                background:#fff;color:#1A3C6E;font-size:15px;font-weight:600;
                cursor:pointer;font-family:inherit;transition:background .2s,color .2s;">${window.t('btn.showAll')}</button>
        </div>` : ''}
        <div class="docs-small">${smallCards}</div>
    </section>
</div>`;
};
