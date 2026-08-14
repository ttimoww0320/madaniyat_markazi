// Компактная замена полной секции "Документы" на главной странице —
// 2 последних документа + ссылка на полный список (documents.html).
const DOC_TEASER_ICON = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" stroke-width="1.5"/>
    <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="currentColor" stroke-width="1.5"/>
</svg>`;

window.renderDocumentsTeaser = function(data) {
    const docs = (data && data.main) || [];
    if (!docs.length) return '';

    const esc = window.escapeHtml;
    const rows = docs.slice(0, 2).map(doc => `
        <div class="doc-row">
            <div class="doc-icon">${DOC_TEASER_ICON}</div>
            <div class="doc-info">
                <h3 class="doc-title">${esc(window.tData(doc.title))}</h3>
                ${doc.description ? `<p class="doc-desc">${esc(window.tData(doc.description))}</p>` : ''}
            </div>
            <div class="doc-meta">
                <span class="doc-size">${esc(doc.size)}</span>
            </div>
        </div>`).join('');

    return `
<section class="section" id="documents">
    <div class="section-block">
        <h2 class="section-title">${window.t('sections.documents')}</h2>
    </div>
    <div class="docs-list">${rows}</div>
    <div style="text-align:center;margin-top:32px;">
        <a class="btn-outline" href="/documents.html">${esc(window.t('documents.viewAll'))} →</a>
    </div>
</section>`;
};
