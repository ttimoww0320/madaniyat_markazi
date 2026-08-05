// Иконка документа — единый стиль, цвет через currentColor (см. .doc-icon)
const DOC_ICON_SVG = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" stroke-width="1.5"/>
    <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="currentColor" stroke-width="1.5"/>
</svg>`;

const DOWNLOAD_ICON_SVG = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M12 3v12m0 0l-4-4m4 4l4-4M4 20h16" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

window.toggleDocuments = function() {
    window._toggleSection('.doc-extra-item', 'docs-toggle-btn');
};

function buildDocRow(doc, esc, extraClass, hidden) {
    const downloadBtn = doc.file
        ? `<a class="doc-download" href="${esc(doc.file)}" download="${esc(window.tData(doc.title))}" aria-label="${window.t('btn.download')}">${DOWNLOAD_ICON_SVG}</a>`
        : `<span class="doc-download" style="opacity:.4;cursor:default">${DOWNLOAD_ICON_SVG}</span>`;
    return `
    <div class="doc-row${extraClass ? ' doc-extra-item' : ''}"${hidden ? ' style="display:none"' : ''}>
        <div class="doc-icon">${DOC_ICON_SVG}</div>
        <div class="doc-info">
            <h3 class="doc-title">${esc(window.tData(doc.title))}</h3>
            ${doc.description ? `<p class="doc-desc">${esc(window.tData(doc.description))}</p>` : ''}
        </div>
        <div class="doc-meta">
            <span class="doc-size">${esc(doc.size)}</span>
            ${downloadBtn}
        </div>
    </div>`;
}

window.renderDocuments = function(data) {
    const hasMore = data.main.length > 4;

    const esc = window.escapeHtml;
    const mainRows = data.main.map((doc, i) => buildDocRow(doc, esc, i >= 4, i >= 4)).join('');
    const smallRows = data.small.map(doc => buildDocRow(doc, esc, false, false)).join('');

    return `
<div class="section-gray">
    <section class="section" id="documents">
        <div class="section-block">
            <h2 class="section-title">${window.t('sections.documents')}</h2>
            <p class="section-subtitle">${window.t('sections.documentsSub')}</p>
        </div>
        <div class="docs-main docs-list">${mainRows}</div>
        ${hasMore ? window.renderToggleBtn('docs-toggle-btn', 'window.toggleDocuments()') : ''}
        <div class="docs-small docs-list">${smallRows}</div>
    </section>
</div>`;
};
