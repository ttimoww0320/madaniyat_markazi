// Иконка документа — единый стиль, цвет через currentColor (см. .doc-icon)
const DOC_ICON_SVG = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" stroke-width="1.5"/>
    <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="currentColor" stroke-width="1.5"/>
</svg>`;

const DOWNLOAD_ICON_SVG = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M12 3v12m0 0l-4-4m4 4l4-4M4 20h16" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

// Внешняя ссылка (напр. на lex.uz) — отличается от иконки скачивания локального файла
const EXTERNAL_ICON_SVG = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M15 3h6v6M10 14L21 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

// Порядок групп в списке документов — только реально существующие в контенте
// типы (см. data/documents.json: type). Совпадает с подпунктами dropdown
// "Документы" в шапке (см. partials/header.js).
const DOC_GROUPS = [
    { type: 'postanovlenie', id: 'documents-postanovlenie', labelKey: 'documents.group.postanovlenie' },
    { type: 'prikaz',        id: 'documents-prikaz',        labelKey: 'documents.group.prikaz' },
    { type: 'normativ',      id: 'documents-normativ',      labelKey: 'documents.group.normativ' },
];

function buildDocRow(doc, esc) {
    const isExternal = /^https?:\/\//i.test(doc.file || '');
    let downloadBtn;
    if (!doc.file) {
        downloadBtn = `<span class="doc-download" style="opacity:.4;cursor:default">${DOWNLOAD_ICON_SVG}</span>`;
    } else if (isExternal) {
        downloadBtn = `<a class="doc-download" href="${esc(doc.file)}" target="_blank" rel="noopener" aria-label="${window.t('btn.openSource')}">${EXTERNAL_ICON_SVG}</a>`;
    } else {
        downloadBtn = `<a class="doc-download" href="${esc(doc.file)}" download="${esc(window.tData(doc.title))}" aria-label="${window.t('btn.download')}">${DOWNLOAD_ICON_SVG}</a>`;
    }
    return `
    <div class="doc-row">
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
    const esc = window.escapeHtml;

    const groupsHtml = DOC_GROUPS.map(g => {
        const docs = data.main.filter(d => d.type === g.type);
        if (!docs.length) return '';
        return `
    <div class="docs-group" id="${g.id}">
        <h2 class="docs-group-title">${window.t(g.labelKey)}</h2>
        <div class="docs-list">${docs.map(d => buildDocRow(d, esc)).join('')}</div>
    </div>`;
    }).join('');

    // Документы без распознанного типа (на случай будущих правок из админки) —
    // отдельным списком в конце, без заголовка группы.
    const knownTypes = DOC_GROUPS.map(g => g.type);
    const untyped = data.main.filter(d => !knownTypes.includes(d.type));
    const untypedHtml = untyped.length ? `<div class="docs-list">${untyped.map(d => buildDocRow(d, esc)).join('')}</div>` : '';

    const smallRows = data.small.map(doc => buildDocRow(doc, esc)).join('');

    return `
<section class="section" id="documents">
    <div class="section-block">
        <h1 class="section-title">${window.t('sections.documents')}</h1>
        <p class="section-subtitle">${window.t('sections.documentsSub')}</p>
    </div>
    <div class="docs-main">${groupsHtml}${untypedHtml}</div>
    <div class="docs-small docs-list">${smallRows}</div>
</section>`;
};
