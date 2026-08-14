const NEWS_MONTHS_RU = ['ЯНВ', 'ФЕВ', 'МАР', 'АПР', 'МАЙ', 'ИЮН', 'ИЮЛ', 'АВГ', 'СЕН', 'ОКТ', 'НОЯ', 'ДЕК'];
const NEWS_MONTHS_FULL_RU = ['ЯНВАРЬ', 'ФЕВРАЛЬ', 'МАРТ', 'АПРЕЛЬ', 'МАЙ', 'ИЮНЬ', 'ИЮЛЬ', 'АВГУСТ', 'СЕНТЯБРЬ', 'ОКТЯБРЬ', 'НОЯБРЬ', 'ДЕКАБРЬ'];
const NEWS_CALENDAR_PATH = '<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>';

function parseNewsDate(dateStr) {
    const m = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/.exec(String(dateStr || '').trim());
    if (!m) return null;
    const day = parseInt(m[1], 10);
    const monthIdx = parseInt(m[2], 10) - 1;
    if (monthIdx < 0 || monthIdx > 11) return null;
    return {
        day: String(day).padStart(2, '0'),
        month: NEWS_MONTHS_RU[monthIdx],
        monthFull: NEWS_MONTHS_FULL_RU[monthIdx],
        full: m[0],
    };
}

const TG_CHANNEL = 'madaniyatvazirligi';

function newsTgLink(n) {
    return n.tgId ? `https://t.me/${TG_CHANNEL}/${n.tgId}` : null;
}

// #Хештег или строка эмодзи в начале поста — не заголовок, а метка. Ищем первую
// содержательную строку/предложение и используем её; хештег остаётся fallback'ом.
// Хвостовые "#33" и т.п. — это HTML-сущности вида &#33; (не хештеги), поэтому
// требуем хотя бы одну букву внутри хештега.
const NEWS_HASHTAG_RE = /#(?=[\p{L}\p{N}_]*\p{L})[\p{L}\p{N}_]+/gu;
const NEWS_EMOJI_RE = /\p{Extended_Pictographic}|\p{Regional_Indicator}/gu;
const NEWS_EMOJI_TAIL_RE = /[️‍]/g;
// Постоянная "подпись" каналов в конце поста — не часть заголовка.
const NEWS_FOOTER_RE = /(?:[\s|•]*(?:🔹|🔸|👉|📌)?\s*(?:Telegram|Instagram|Facebook|Veb-sayt|YouTube|Mediabank))+\s*$/gi;

function newsStripFooter(str) {
    return str.replace(NEWS_FOOTER_RE, '').trim();
}

function newsStripNoise(str) {
    return str.replace(NEWS_HASHTAG_RE, '').replace(NEWS_EMOJI_RE, '').replace(NEWS_EMOJI_TAIL_RE, '').replace(/\s+/g, ' ').trim();
}

function newsIsMeaningless(str) {
    return newsStripNoise(str) === '';
}

function newsStripLeadingNoise(str) {
    const re = /^(?:#(?=[\p{L}\p{N}_]*\p{L})[\p{L}\p{N}_]+|\p{Extended_Pictographic}[️‍]?|\p{Regional_Indicator}|[️‍]|\s)+/u;
    return str.replace(re, '').trim();
}

function newsExtractHashtags(str) {
    const tags = [];
    const seen = new Set();
    let m;
    NEWS_HASHTAG_RE.lastIndex = 0;
    while ((m = NEWS_HASHTAG_RE.exec(str)) !== null) {
        const tag = m[0].slice(1);
        const key = tag.toLowerCase();
        if (!seen.has(key)) { seen.add(key); tags.push(tag); }
    }
    return tags;
}

function newsHumanizeTag(tag) {
    const readable = tag.replace(/_/g, ' ').trim();
    return readable.charAt(0).toUpperCase() + readable.slice(1);
}

function newsTruncate(str, max) {
    if (str.length <= max) return str;
    const cut = str.slice(0, max);
    const lastSpace = cut.lastIndexOf(' ');
    const base = lastSpace > max * 0.5 ? cut.slice(0, lastSpace) : cut;
    return base.trim() + '…';
}

function newsHeadline(n) {
    const title = String(window.tData(n.title) || '').trim();
    const text = String(window.tData(n.text) || '').trim();

    const segments = [];
    if (title) segments.push(title);
    if (text) {
        text.split(/(?<=[.!?…])\s+|\n+/).forEach(s => {
            const t = s.trim();
            if (t) segments.push(t);
        });
    }

    const hashtags = newsExtractHashtags(`${title} ${text}`).slice(0, 2);

    for (const seg of segments) {
        if (newsIsMeaningless(seg)) continue;
        const cleaned = newsStripFooter(newsStripLeadingNoise(seg));
        if (cleaned) return { headline: newsTruncate(cleaned, 70), hashtags };
    }

    if (hashtags.length) return { headline: newsHumanizeTag(hashtags[0]), hashtags };

    return { headline: title || 'Новость из канала', hashtags };
}

function newsImgBlock(n, extraClass) {
    if (!n.image) {
        return `<div class="news-big-img img-fallback-tile${extraClass || ''}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${NEWS_CALENDAR_PATH}</svg></div>`;
    }
    return `
    <div class="news-big-img news-img-loading${n.isVideo ? ' news-img-video' : ''}${extraClass || ''}">
        <img src="${n.image}" alt="" loading="lazy"
            onload="this.parentElement.classList.remove('news-img-loading')"
            onerror="window.imgFallback(this,'calendar')">
        ${n.isVideo ? `<div class="news-play-btn">▶</div>` : ''}
    </div>`;
}

function buildBigCard(n, esc) {
    const date = parseNewsDate(n.date);
    const tgLink = newsTgLink(n);
    const tag = tgLink ? 'a' : 'article';
    const linkAttrs = tgLink ? `href="${tgLink}" target="_blank" rel="noopener"` : '';

    const excerpt = window.tData(n.text);
    const { headline } = newsHeadline(n);

    return `
    <${tag} class="news-big-card"${linkAttrs ? ` ${linkAttrs}` : ''}>
        ${newsImgBlock(n)}
        <div class="news-big-plate">
            <div class="news-big-top">
                ${date ? `
                <div class="news-big-date">
                    <span class="nb-day">${date.day}</span>
                    <span class="nb-month">${date.monthFull}</span>
                </div>` : ''}
                <h3 class="news-big-title">${esc(headline)}</h3>
            </div>
            ${excerpt ? `<p class="news-big-excerpt">${esc(excerpt)}</p>` : ''}
            <div class="news-big-meta">
                <span class="news-big-fulldate">${esc(date ? date.full : (n.date || ''))}</span>
                ${tgLink ? `<span class="news-big-tglink">${window.t('news.readInTelegram')}</span>` : ''}
            </div>
        </div>
    </${tag}>`;
}

function buildListItem(n, esc) {
    const date = parseNewsDate(n.date);
    const tgLink = newsTgLink(n);
    const tag = tgLink ? 'a' : 'div';
    const linkAttrs = tgLink ? `href="${tgLink}" target="_blank" rel="noopener"` : '';
    const { headline, hashtags } = newsHeadline(n);

    return `
    <${tag} class="news-list-item"${linkAttrs ? ` ${linkAttrs}` : ''}>
        ${date ? `
        <div class="news-list-date">
            <span class="nl-day">${date.day}</span>
            <span class="nl-month">${date.month}</span>
        </div>` : ''}
        <div class="news-list-content">
            <h4 class="news-list-title">${esc(headline)}</h4>
            ${hashtags.length ? `<div class="news-list-tags">${hashtags.map(t => `#${esc(t)}`).join(' ')}</div>` : ''}
        </div>
    </${tag}>`;
}

window.renderNews = function(data) {
    if (!data || !data.length) return '';

    const esc = window.escapeHtml;
    const bigItems  = data.slice(0, 2);
    const listItems = data.slice(2, 7);

    const bigHtml  = bigItems.map(n => buildBigCard(n, esc)).join('');
    const listHtml = listItems.map(n => buildListItem(n, esc)).join('');

    const freshness = window._newsUpdatedAt
        ? `<span class="freshness-badge">${window.t('freshness.updated')} ${window.formatRelativeTime(window._newsUpdatedAt)}</span>`
        : '';

    return `
<section class="section" id="news">
    <div class="news-section-header">
        <div class="news-header-titlewrap">
            <h2 class="news-heading">${window.t('sections.news')}</h2>
            ${freshness}
        </div>
        <div class="news-socials" id="news-socials-row"></div>
    </div>
    <div class="news-grid">
        ${bigHtml}
        <div class="news-list">${listHtml}</div>
    </div>
    <div class="news-all-link-wrap">
        <a class="news-all-link" href="https://t.me/${TG_CHANNEL}" target="_blank" rel="noopener">${window.t('sections.newsAll')} <span class="news-all-arrow">→</span></a>
    </div>
</section>`;
};
