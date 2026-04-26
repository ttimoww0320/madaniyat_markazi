const http  = require('http');
const https = require('https');
const fs    = require('fs');
const path  = require('path');
const zlib  = require('zlib');

// ===== ЗАГРУЗКА .env =====
try {
    const envLines = fs.readFileSync(path.join(__dirname, '.env'), 'utf8').split('\n');
    for (const line of envLines) {
        const m = line.match(/^([A-Z_][A-Z0-9_]*)\s*=\s*(.+)$/);
        if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
    }
} catch {}

const PORT           = Number(process.env.PORT) || 3001;
const ROOT           = __dirname;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';
const TG_TOKEN       = process.env.TG_TOKEN || '';
const TG_CHAT_ID     = process.env.TG_CHAT_ID || '';
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || `http://localhost:${PORT}`;

// ===== КОНСТАНТЫ =====
const RATE_LIMIT_REQUESTS  = 5;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const AUTH_BLOCK_ATTEMPTS  = 10;
const AUTH_BLOCK_WINDOW_MS = 15 * 60 * 1000;
const REQUEST_TIMEOUT_MS   = 30 * 1000;
const TG_FETCH_TIMEOUT_MS  = 15 * 1000;
const TG_SEND_TIMEOUT_MS   = 10 * 1000;
const UPLOAD_MAX_BYTES     = 20 * 1024 * 1024;
const BACKUP_KEEP_COUNT    = 5;
const RETRY_ATTEMPTS       = 3;
const RETRY_DELAY_MS       = 5 * 1000;
const CLEANUP_INTERVAL_MS  = 5 * 60 * 1000;
const SYNC_INTERVAL_MS     = 30 * 60 * 1000;
const HISTORY_DAYS         = 90;

// ===== БЕЗОПАСНАЯ ЗАПИСЬ JSON (бэкап + атомарная запись) =====
const BACKUP_DIR = path.join(__dirname, 'data', 'backups');
try { fs.mkdirSync(BACKUP_DIR, { recursive: true }); } catch {}

function safeWriteJSON(filePath, data) {
    const json = JSON.stringify(data, null, 2);
    // Бэкап текущего файла
    try {
        if (fs.existsSync(filePath)) {
            const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
            const name  = path.basename(filePath, '.json');
            fs.copyFileSync(filePath, path.join(BACKUP_DIR, `${name}.${stamp}.json`));
            // Оставляем только 5 последних бэкапов для каждого файла
            const all = fs.readdirSync(BACKUP_DIR)
                .filter(f => f.startsWith(name + '.'))
                .sort();
            for (const old of all.slice(0, -5)) fs.unlinkSync(path.join(BACKUP_DIR, old));
        }
    } catch (e) { logger.warn('[Backup] Не удалось создать бэкап:', e.message); }
    // Атомарная запись через временный файл
    const tmp = filePath + '.tmp';
    fs.writeFileSync(tmp, json, 'utf8');
    fs.renameSync(tmp, filePath);
}

// ===== ЛОГИРОВАНИЕ В ФАЙЛ =====
const LOG_FILE = path.join(__dirname, 'logs', 'server.log');
try { fs.mkdirSync(path.join(__dirname, 'logs'), { recursive: true }); } catch {}

function log(level, ...args) {
    const line = `[${new Date().toISOString()}] [${level}] ${args.join(' ')}\n`;
    process.stdout.write(line);
    try { fs.appendFileSync(LOG_FILE, line); } catch {}
}

// Ротация лога — оставляем последние 5 МБ
function rotateLogs() {
    try {
        const stat = fs.statSync(LOG_FILE);
        if (stat.size > 5 * 1024 * 1024) {
            fs.renameSync(LOG_FILE, LOG_FILE + '.old');
        }
    } catch {}
}

const logger = {
    info:  (...a) => log('INFO',  ...a),
    warn:  (...a) => log('WARN',  ...a),
    error: (...a) => log('ERROR', ...a),
};

if (!ADMIN_PASSWORD) logger.warn('[WARN] ADMIN_PASSWORD не задан — установите его в .env');
if (!TG_TOKEN)       logger.warn('[WARN] TG_TOKEN не задан — Telegram-функции не будут работать');

// ===== ЛОКА ОТ RACE CONDITION =====
const _syncLocks = new Set();
async function withLock(key, fn) {
    if (_syncLocks.has(key)) {
        logger.warn(`[Lock] Пропуск — ${key} уже выполняется`);
        return null;
    }
    _syncLocks.add(key);
    try { return await fn(); }
    finally { _syncLocks.delete(key); }
}

// ===== RATE LIMITING (в памяти) =====
const _rateLimits = new Map();
function checkRateLimit(ip, maxRequests = RATE_LIMIT_REQUESTS, windowMs = RATE_LIMIT_WINDOW_MS) {
    const now  = Date.now();
    const hits = (_rateLimits.get(ip) || []).filter(t => now - t < windowMs);
    if (hits.length >= maxRequests) return false;
    hits.push(now);
    _rateLimits.set(ip, hits);
    // Периодически чистим старые записи
    if (_rateLimits.size > 5000) {
        for (const [k, v] of _rateLimits) {
            if (!v.some(t => now - t < windowMs)) _rateLimits.delete(k);
        }
    }
    return true;
}

function sendTelegram(text) {
    return new Promise((resolve, reject) => {
        if (!TG_TOKEN || !TG_CHAT_ID) { reject(new Error('Telegram не настроен')); return; }
        const body = JSON.stringify({ chat_id: TG_CHAT_ID, text, parse_mode: 'HTML' });
        const req  = https.request({
            hostname: 'api.telegram.org',
            path: `/bot${TG_TOKEN}/sendMessage`,
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
        }, res => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    logger.info('[Telegram ответ]:', JSON.stringify(parsed));
                    if (parsed.ok) {
                        resolve(parsed);
                    } else {
                        reject(new Error(`Telegram: ${parsed.description || 'неизвестная ошибка'}`));
                    }
                } catch (e) {
                    reject(e);
                }
            });
        });
        req.on('error', err => {
            logger.error('[Telegram ошибка сети]:', err.message);
            reject(err);
        });
        req.setTimeout(10000, () => { req.destroy(); reject(new Error('Telegram timeout')); });
        req.write(body);
        req.end();
    });
}

// ===== RETRY-ХЕЛПЕР =====
async function withRetry(fn, attempts = RETRY_ATTEMPTS, delayMs = RETRY_DELAY_MS) {
    for (let i = 0; i < attempts; i++) {
        try { return await fn(); }
        catch (e) {
            if (i === attempts - 1) throw e;
            logger.warn(`[Retry] Попытка ${i + 1} не удалась: ${e.message}. Повтор через ${delayMs / 1000}с...`);
            await new Promise(r => setTimeout(r, delayMs * (i + 1)));
        }
    }
}

// ===== СИНХРОНИЗАЦИЯ С TELEGRAM-КАНАЛОМ =====
const TG_CHANNEL_NAME = 'madaniyatvazirligi';

function fetchTelegramPage(channelName, before) {
    channelName = channelName || TG_CHANNEL_NAME;
    const qs = before ? `?before=${before}` : '';
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 't.me',
            path: `/s/${channelName}${qs}`,
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'ru-RU,ru;q=0.9,uz;q=0.8,en;q=0.7'
            }
        };
        const req = https.request(options, res => {
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                res.resume();
                const loc = res.headers.location;
                const u = new URL(loc.startsWith('http') ? loc : `https://t.me${loc}`);
                const req2 = https.request({ hostname: u.hostname, path: u.pathname + u.search, method: 'GET', headers: options.headers }, res2 => {
                    let d = '';
                    res2.setEncoding('utf8');
                    res2.on('data', c => d += c);
                    res2.on('end', () => resolve(d));
                });
                req2.on('error', reject);
                req2.setTimeout(15000, () => { req2.destroy(); reject(new Error('Telegram page timeout')); });
                req2.end();
                return;
            }
            let data = '';
            res.setEncoding('utf8');
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(data));
        });
        req.on('error', reject);
        req.setTimeout(15000, () => { req.destroy(); reject(new Error('Telegram page timeout')); });
        req.end();
    });
}

// Общая функция — извлекает postId, date, text из блока Telegram
function parseTgBlockBase(block) {
    const postIdMatch = block.match(/data-post="[^/]+\/(\d+)"/);
    if (!postIdMatch) return null;
    const dateMatch = block.match(/<time[^>]+datetime="(\d{4}-\d{2}-\d{2})/);
    if (!dateMatch) return null;
    const [y, m, d] = dateMatch[1].split('-');
    const date = `${d}.${m}.${y}`;
    let text = '';
    const textMatch = block.match(/class="tgme_widget_message_text[^"]*"[^>]*>([\s\S]*?)<\/div>/);
    if (textMatch) {
        text = textMatch[1]
            .replace(/<br\s*\/?>/gi, '\n')
            .replace(/<[^>]+>/g, '')
            .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ')
            .trim();
    }
    return { postId: postIdMatch[1], date, text };
}

function parseTelegramMessage(block) {
    const base = parseTgBlockBase(block);
    if (!base) return null;
    const { postId, date } = base;

    let image = null;
    let isVideo = false;

    const photoMatch = block.match(/tgme_widget_message_photo_wrap[^>]*style="[^"]*background-image:url\('([^']+)'\)/);
    if (photoMatch) image = photoMatch[1];

    if (!image) {
        const mv = block.match(/<video[^>]+poster="([^"]+)"/);
        if (mv) { image = mv[1]; isVideo = true; }
    }
    if (!image) {
        const mv = block.match(/message_video[^>]*style="[^"]*background-image:url\('([^']+)'\)/);
        if (mv) { image = mv[1]; isVideo = true; }
    }
    if (!image) {
        const mv = block.match(/message_roundvideo[^>]*style="[^"]*background-image:url\('([^']+)'\)/);
        if (mv) { image = mv[1]; isVideo = true; }
    }
    if (!image) {
        const mv = block.match(/tgme_widget_message_wrap[\s\S]*?background-image:url\('(https:\/\/cdn[^']+)'\)/);
        if (mv) { image = mv[1]; isVideo = isVideo || block.includes('video'); }
    }

    return { postId, date, image, isVideo, text: base.text };
}

function parseTelegramPage(html) {
    const posts = [];
    const blocks = html.split(/(?=<div class="tgme_widget_message\b)/);

    for (const block of blocks) {
        const msg = parseTelegramMessage(block);
        if (!msg || !msg.image) continue;

        const lines = msg.text.split('\n').map(l => l.trim()).filter(Boolean);
        const title = (lines[0] || 'Новость из канала').slice(0, 120);
        const body  = lines.length > 1 ? lines.slice(1).join(' ').trim() : title;

        posts.push({ postId: msg.postId, date: msg.date, title, text: body, image: msg.image, isVideo: msg.isVideo });
    }

    return posts;
}

function parseTelegramGalleryPage(html) {
    const items = [];
    const blocks = html.split(/(?=<div class="tgme_widget_message_wrap\b)/);

    for (const block of blocks) {
        if (!block.includes('tgme_widget_message_wrap')) continue;

        const photos = [];
        const photoRe = /tgme_widget_message_photo_wrap[^>]*style="[^"]*background-image:url\('([^']+)'\)/g;
        let m;
        while ((m = photoRe.exec(block)) !== null) {
            if (!photos.includes(m[1])) photos.push(m[1]);
        }
        if (!photos.length) continue;

        const base = parseTgBlockBase(block);
        if (!base) continue;
        const { postId, date } = base;
        const alt = base.text.split('\n')[0].trim().slice(0, 120) || `Фото ${date}`;

        items.push({ postId, date, alt, photos });
    }

    return items;
}

async function syncTelegramNews() { return withLock('tg-news', _syncTelegramNews); }
async function _syncTelegramNews() {
    logger.info(`[TG Sync] Синхронизация с каналом @${TG_CHANNEL_NAME}...`);

    let html;
    try {
        html = await withRetry(() => fetchTelegramPage());
    } catch (e) {
        logger.error('[TG Sync] Ошибка запроса после 3 попыток:', e.message);
        return { added: 0, error: e.message };
    }

    const posts = parseTelegramPage(html);
    logger.info(`[TG Sync] Найдено постов: ${posts.length}`);

    const newsFile = path.join(ROOT, 'data', 'news.json');
    let existing = [];
    try { existing = JSON.parse(fs.readFileSync(newsFile, 'utf8')); } catch { existing = []; }

    const existingTgIds = new Set(existing.filter(n => n.tgId).map(n => String(n.tgId)));
    let maxId = Math.max(0, ...existing.map(n => (typeof n.id === 'number' ? n.id : 0)));

    let added = 0;
    const newPosts = [];
    for (let i = posts.length - 1; i >= 0; i--) {
        const post = posts[i];
        if (existingTgIds.has(post.postId)) continue;
        maxId++;
        newPosts.unshift({ id: maxId, post });
        added++;
    }

    for (const { id, post } of newPosts) {
        let imageUrl = post.image || null;
        if (imageUrl) {
            try {
                const fname = tgImageFilename(imageUrl, 'news');
                imageUrl = await downloadImage(imageUrl, fname);
                logger.info(`[TG Sync] Скачано фото: ${fname}`);
            } catch (e) {
                logger.warn(`[TG Sync] Не удалось скачать фото: ${e.message}`);
            }
        }
        existing.unshift({
            id,
            tgId: post.postId,
            title: post.title,
            date:  post.date,
            text:  post.text,
            ...(imageUrl ? { image: imageUrl } : {}),
            ...(post.isVideo ? { isVideo: true } : {})
        });
    }

    if (added > 0) {
        safeWriteJSON(newsFile, existing);
        logger.info(`[TG Sync] Добавлено новых постов: ${added}`);
    } else {
        logger.info('[TG Sync] Новых постов нет');
    }
    return { added, total: posts.length };
}

// ===== СИНХРОНИЗАЦИЯ ГАЛЕРЕИ =====
const TG_GALLERY_CHANNEL = 'madaniyatbolimi';
const TG_GALLERY_MAX_PAGES = 5;
const TG_GALLERY_PAGE_DELAY = 500;

async function syncTelegramGallery() { return withLock('tg-gallery', _syncTelegramGallery); }
async function _syncTelegramGallery() {
    logger.info(`[TG Gallery] Синхронизация с каналом @${TG_GALLERY_CHANNEL}...`);

    let allItems = [];
    let before = null;

    for (let page = 0; page < TG_GALLERY_MAX_PAGES; page++) {
        let html;
        try {
            html = await withRetry(() => fetchTelegramPage(TG_GALLERY_CHANNEL, before));
        } catch (e) {
            logger.error('[TG Gallery] Ошибка запроса после 3 попыток:', e.message);
            if (page === 0) return { added: 0, error: e.message };
            break;
        }

        const pageItems = parseTelegramGalleryPage(html);
        if (!pageItems.length) break;

        allItems = [...pageItems, ...allItems];

        const minId = Math.min(...pageItems.map(i => Number(i.postId)));
        if (!minId || before === minId) break;
        before = minId;

        await new Promise(r => setTimeout(r, TG_GALLERY_PAGE_DELAY));
    }

    logger.info(`[TG Gallery] Найдено постов с фото: ${allItems.length}`);

    const galleryFile = path.join(ROOT, 'data', 'gallery.json');
    let existing = [];
    try { existing = JSON.parse(fs.readFileSync(galleryFile, 'utf8')); } catch { existing = []; }

    const existingTgIds = new Set(existing.filter(n => n.tgId).map(n => String(n.tgId)));
    let maxId = Math.max(0, ...existing.map(n => (typeof n.id === 'number' ? n.id : 0)));

    let added = 0;
    const newItems = [];
    for (let i = allItems.length - 1; i >= 0; i--) {
        const item = allItems[i];
        if (existingTgIds.has(item.postId)) continue;
        maxId++;
        newItems.unshift({ id: maxId, item });
        added++;
    }

    for (const { id, item } of newItems) {
        const localPhotos = [];
        for (const photoUrl of item.photos) {
            try {
                const fname = tgImageFilename(photoUrl, 'gallery');
                const local = await downloadImage(photoUrl, fname);
                localPhotos.push(local);
                logger.info(`[TG Gallery] Скачано фото: ${fname}`);
            } catch (e) {
                logger.warn(`[TG Gallery] Не удалось скачать фото: ${e.message}`);
                localPhotos.push(photoUrl);
            }
        }
        existing.unshift({
            id,
            tgId: item.postId,
            alt: item.alt,
            large: false,
            photos: localPhotos
        });
    }

    if (added > 0) {
        safeWriteJSON(galleryFile, existing);
        logger.info(`[TG Gallery] Добавлено новых: ${added}`);
    } else {
        logger.info('[TG Gallery] Новых элементов нет');
    }
    return { added, total: allItems.length };
}

// ===== СКАЧИВАНИЕ ИЗОБРАЖЕНИЙ =====
function downloadImage(url, filename) {
    return new Promise((resolve, reject) => {
        const uploadsDir = path.join(ROOT, 'uploads');
        if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

        // Защита от path traversal в имени файла
        const safeName = path.basename(filename).replace(/[^a-zA-Z0-9._-]/g, '_').replace(/^\.+$/, '_');
        if (!safeName || safeName.length < 2) { reject(new Error('Недопустимое имя файла')); return; }
        const filePath = path.join(uploadsDir, safeName);
        if (!filePath.startsWith(path.resolve(uploadsDir) + path.sep)) { reject(new Error('Недопустимый путь')); return; }

        if (fs.existsSync(filePath)) { resolve(`/uploads/${safeName}`); return; }

        const get = url.startsWith('https') ? https : require('http');
        const request = get.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, res => {
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                res.resume();
                downloadImage(res.headers.location, safeName).then(resolve).catch(reject);
                return;
            }
            if (res.statusCode !== 200) { res.resume(); reject(new Error(`HTTP ${res.statusCode}`)); return; }
            const chunks = [];
            res.on('data', c => chunks.push(c));
            res.on('end', () => {
                fs.writeFile(filePath, Buffer.concat(chunks), err => {
                    if (err) reject(err);
                    else resolve(`/uploads/${safeName}`);
                });
            });
            res.on('error', reject);
        });
        request.on('error', reject);
        request.setTimeout(15000, () => { request.destroy(); reject(new Error('Timeout')); });
    });
}

function tgImageFilename(url, prefix) {
    const hash = url.split('/').pop().slice(0, 24).replace(/[^a-zA-Z0-9]/g, '');
    return `tg_${prefix}_${hash}.jpg`;
}

const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css':  'text/css; charset=utf-8',
    '.js':   'text/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png':  'image/png',
    '.jpg':  'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.svg':  'image/svg+xml',
    '.ico':  'image/x-icon',
    '.doc':  'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.pdf':  'application/pdf',
};

const ALLOWED_SECTIONS = ['events', 'circles', 'team', 'documents', 'gallery', 'contact', 'site', 'news', 'achievements', 'map'];

// ===== СЧЁТЧИК ПОСЕТИТЕЛЕЙ =====
const VISITORS_FILE = path.join(ROOT, 'data', 'visitors.json');

function readVisitors() {
    try { return JSON.parse(fs.readFileSync(VISITORS_FILE, 'utf8')); } catch { return { total: 0, days: {} }; }
}

function trackVisit() {
    try {
        const data  = readVisitors();
        const today = new Date().toISOString().slice(0, 10);
        data.total        = (data.total || 0) + 1;
        data.days[today]  = (data.days[today] || 0) + 1;
        // Оставляем только последние 90 дней
        const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
        for (const d of Object.keys(data.days)) { if (d < cutoff) delete data.days[d]; }
        fs.writeFile(VISITORS_FILE, JSON.stringify(data, null, 2), 'utf8', () => {});
    } catch {}
}
const ALLOWED_UPLOAD_EXTS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg', '.pdf', '.doc', '.docx']);

function sendCompressed(req, res, status, headers, body) {
    const accept = req.headers['accept-encoding'] || '';
    if (accept.includes('gzip') && body.length > 512) {
        zlib.gzip(body, (err, compressed) => {
            if (err) { res.writeHead(status, headers); res.end(body); return; }
            res.writeHead(status, { ...headers, 'Content-Encoding': 'gzip', 'Vary': 'Accept-Encoding' });
            res.end(compressed);
        });
    } else {
        res.writeHead(status, headers);
        res.end(body);
    }
}

function sendJSON(res, status, data, req) {
    const body = Buffer.from(JSON.stringify(data), 'utf8');
    const headers = { 'Content-Type': 'application/json; charset=utf-8' };
    if (req) { sendCompressed(req, res, status, headers, body); return; }
    res.writeHead(status, headers);
    res.end(body);
}

const _authFailures = new Map();
function checkAuth(req) {
    if (!ADMIN_PASSWORD) return false;
    const ip  = req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    const failures = (_authFailures.get(ip) || []).filter(t => now - t < AUTH_BLOCK_WINDOW_MS);
    if (failures.length >= AUTH_BLOCK_ATTEMPTS) return false; // блок на 15 минут после 10 неудач
    const auth = req.headers['authorization'] || '';
    if (auth === `Bearer ${ADMIN_PASSWORD}`) { _authFailures.delete(ip); return true; }
    failures.push(now);
    _authFailures.set(ip, failures);
    return false;
}

// Собрать тело запроса с ограничением размера и таймаутом
function readBody(req, maxBytes = 10 * 1024 * 1024) {
    return new Promise((resolve, reject) => {
        let body = '';
        let size = 0;
        const timer = setTimeout(() => { req.destroy(); reject(new Error('Request timeout')); }, 30000);
        req.on('data', chunk => {
            size += chunk.length;
            if (size > maxBytes) {
                clearTimeout(timer);
                req.destroy();
                reject(new Error('Request body too large'));
                return;
            }
            body += chunk;
        });
        req.on('end', () => { clearTimeout(timer); resolve(body); });
        req.on('error', e => { clearTimeout(timer); reject(e); });
    });
}

const PHONE_RE = /^[\+\d\s\-\(\)]{7,20}$/;
const EMAIL_RE = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;

const server = http.createServer(async (req, res) => {

    // CORS — разрешаем только настроенный origin
    const reqOrigin = req.headers.origin;
    if (reqOrigin === ALLOWED_ORIGIN || !reqOrigin) {
        res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    // ===== API МАРШРУТЫ =====
    if (req.url.startsWith('/api/')) {
        const section = req.url.slice(5).split('?')[0];

        // POST /api/upload?name=file.jpg
        if (section === 'upload') {
            if (!checkAuth(req)) { sendJSON(res, 401, { error: 'Неверный пароль' }); return; }
            if (!req.headers['x-requested-with']) { sendJSON(res, 403, { error: 'Запрещено' }); return; }
            if (req.method !== 'POST') { sendJSON(res, 405, { error: 'Метод не разрешён' }); return; }

            const urlObj = new URL(req.url, `http://localhost:${PORT}`);
            const rawName = urlObj.searchParams.get('name') || 'image.jpg';
            const ext     = path.extname(rawName).toLowerCase();

            if (!ALLOWED_UPLOAD_EXTS.has(ext)) {
                sendJSON(res, 400, { error: 'Недопустимый тип файла' }); return;
            }

            const baseName   = path.basename(rawName).replace(/[^a-zA-Z0-9._-]/g, '_').replace(/^\.+$/, '_');
            const safeName   = `${Date.now()}_${baseName || 'file'}`;
            const uploadsDir = path.join(ROOT, 'uploads');
            if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
            const uploadPath = path.join(uploadsDir, safeName);
            if (!uploadPath.startsWith(path.resolve(uploadsDir) + path.sep)) {
                sendJSON(res, 400, { error: 'Недопустимое имя файла' }); return;
            }

            let size = 0;
            const chunks = [];
            const timer = setTimeout(() => { req.destroy(); sendJSON(res, 408, { error: 'Timeout' }); }, 60000);
            req.on('data', c => {
                size += c.length;
                if (size > UPLOAD_MAX_BYTES) { req.destroy(); clearTimeout(timer); sendJSON(res, 413, { error: 'Файл слишком большой' }); return; }
                chunks.push(c);
            });
            req.on('end', () => {
                clearTimeout(timer);
                fs.writeFile(uploadPath, Buffer.concat(chunks), err => {
                    if (err) { sendJSON(res, 500, { error: 'Ошибка сохранения' }); return; }
                    sendJSON(res, 200, { url: `/uploads/${safeName}` });
                });
            });
            req.on('error', () => { clearTimeout(timer); sendJSON(res, 500, { error: 'Ошибка загрузки' }); });
            return;
        }

        // GET /api/health
        if (section === 'health') {
            const dataOk = fs.existsSync(path.join(ROOT, 'data', 'news.json'));
            sendJSON(res, 200, { ok: true, uptime: Math.floor(process.uptime()), data: dataOk }, req);
            return;
        }

        // GET /api/auth
        if (section === 'auth') {
            if (req.method === 'GET') {
                const ok = checkAuth(req);
                sendJSON(res, ok ? 200 : 401, { ok });
            } else {
                sendJSON(res, 405, { error: 'Метод не разрешён' });
            }
            return;
        }

        // POST /api/send-message
        if (section === 'send-message') {
            if (req.method !== 'POST') { sendJSON(res, 405, { error: 'Метод не разрешён' }); return; }

            const ip = req.socket.remoteAddress || 'unknown';
            if (!checkRateLimit(ip, RATE_LIMIT_REQUESTS, RATE_LIMIT_WINDOW_MS)) {
                sendJSON(res, 429, { error: 'Слишком много запросов. Попробуйте через минуту.' }); return;
            }

            let body;
            try {
                body = JSON.parse(await readBody(req, 64 * 1024));
            } catch {
                sendJSON(res, 400, { error: 'Некорректный JSON' }); return;
            }

            const { name, phone, message, email, topic } = body;
            if (!name || !phone || !message) {
                sendJSON(res, 400, { error: 'Заполните все поля' }); return;
            }
            if (typeof name !== 'string' || name.length > 100) {
                sendJSON(res, 400, { error: 'Некорректное имя' }); return;
            }
            if (!PHONE_RE.test(phone)) {
                sendJSON(res, 400, { error: 'Некорректный формат телефона' }); return;
            }
            if (email && !EMAIL_RE.test(email)) {
                sendJSON(res, 400, { error: 'Некорректный формат email' }); return;
            }
            if (typeof message !== 'string' || message.length > 2000) {
                sendJSON(res, 400, { error: 'Сообщение слишком длинное' }); return;
            }

            const esc = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
            const topicLabels = { circle: 'Запись в кружок', rent: 'Аренда зала', partner: 'Сотрудничество', feedback: 'Жалоба или предложение', other: 'Другое' };

            let text = `📩 <b>Новая заявка с сайта</b>\n\n` +
                       `👤 <b>Имя:</b> ${esc(name)}\n` +
                       `📞 <b>Телефон:</b> ${esc(phone)}\n`;
            if (email) text += `✉️ <b>Email:</b> ${esc(email)}\n`;
            if (topic && topicLabels[topic]) text += `📌 <b>Тема:</b> ${esc(topicLabels[topic])}\n`;
            text += `💬 <b>Сообщение:</b> ${esc(message)}`;

            try {
                await sendTelegram(text);
                sendJSON(res, 200, { ok: true });
            } catch (e) {
                logger.error('[send-message] Ошибка:', e.message);
                sendJSON(res, 500, { error: 'Ошибка отправки в Telegram' });
            }
            return;
        }

        // POST /api/sync-tg
        if (section === 'sync-tg') {
            if (!checkAuth(req)) { sendJSON(res, 401, { error: 'Неверный пароль' }); return; }
            if (req.method !== 'POST') { sendJSON(res, 405, { error: 'Метод не разрешён' }); return; }
            try {
                const result = await syncTelegramNews();
                sendJSON(res, 200, { ok: true, ...result });
            } catch (e) {
                sendJSON(res, 500, { error: e.message });
            }
            return;
        }

        // POST /api/sync-tg-gallery
        if (section === 'sync-tg-gallery') {
            if (!checkAuth(req)) { sendJSON(res, 401, { error: 'Неверный пароль' }); return; }
            if (req.method !== 'POST') { sendJSON(res, 405, { error: 'Метод не разрешён' }); return; }
            try {
                const result = await syncTelegramGallery();
                sendJSON(res, 200, { ok: true, ...result });
            } catch (e) {
                sendJSON(res, 500, { error: e.message });
            }
            return;
        }

        // POST /api/sync-tg-images
        if (section === 'sync-tg-images') {
            if (!checkAuth(req)) { sendJSON(res, 401, { error: 'Неверный пароль' }); return; }
            if (req.method !== 'POST') { sendJSON(res, 405, { error: 'Метод не разрешён' }); return; }
            try {
                let downloaded = 0, failed = 0;

                const newsFile = path.join(ROOT, 'data', 'news.json');
                let news = [];
                try { news = JSON.parse(fs.readFileSync(newsFile, 'utf8')); } catch {}
                let newsChanged = false;
                for (const n of news) {
                    if (n.image && n.image.startsWith('http')) {
                        try {
                            const fname = tgImageFilename(n.image, 'news');
                            n.image = await downloadImage(n.image, fname);
                            downloaded++; newsChanged = true;
                        } catch { failed++; }
                    }
                }
                if (newsChanged) safeWriteJSON(newsFile, news);

                const galleryFile = path.join(ROOT, 'data', 'gallery.json');
                let gallery = [];
                try { gallery = JSON.parse(fs.readFileSync(galleryFile, 'utf8')); } catch {}
                let galleryChanged = false;
                for (const g of gallery) {
                    if (Array.isArray(g.photos)) {
                        for (let i = 0; i < g.photos.length; i++) {
                            if (g.photos[i] && g.photos[i].startsWith('http')) {
                                try {
                                    const fname = tgImageFilename(g.photos[i], 'gallery');
                                    g.photos[i] = await downloadImage(g.photos[i], fname);
                                    downloaded++; galleryChanged = true;
                                } catch { failed++; }
                            }
                        }
                    }
                }
                if (galleryChanged) safeWriteJSON(galleryFile, gallery);

                sendJSON(res, 200, { ok: true, downloaded, failed });
            } catch (e) {
                sendJSON(res, 500, { error: e.message });
            }
            return;
        }


        // GET /api/visitors — статистика посетителей (только для админа)
        if (section === 'visitors') {
            if (!checkAuth(req)) { sendJSON(res, 401, { error: 'Неверный пароль' }); return; }
            if (req.method !== 'GET') { sendJSON(res, 405, { error: 'Метод не разрешён' }); return; }
            const data  = readVisitors();
            const today = new Date().toISOString().slice(0, 10);
            const days  = data.days || {};
            // Последние 30 дней для графика
            const last30 = [];
            for (let i = 29; i >= 0; i--) {
                const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
                last30.push({ date: d, count: days[d] || 0 });
            }
            const week  = last30.slice(-7).reduce((s, d) => s + d.count, 0);
            const month = last30.reduce((s, d) => s + d.count, 0);
            sendJSON(res, 200, { total: data.total || 0, today: days[today] || 0, week, month, last30 });
            return;
        }

        if (!ALLOWED_SECTIONS.includes(section)) {
            sendJSON(res, 404, { error: 'Секция не найдена' });
            return;
        }

        const dataFile = path.join(ROOT, 'data', `${section}.json`);

        // GET /api/:section
        if (req.method === 'GET') {
            fs.readFile(dataFile, 'utf8', (err, raw) => {
                if (err) { sendJSON(res, 404, { error: 'Файл не найден' }); return; }
                try {
                    sendJSON(res, 200, JSON.parse(raw));
                } catch {
                    sendJSON(res, 500, { error: 'Повреждённый JSON' });
                }
            });
            return;
        }

        // POST /api/:section
        if (req.method === 'POST') {
            if (!checkAuth(req)) { sendJSON(res, 401, { error: 'Неверный пароль' }); return; }
            if (!req.headers['x-requested-with']) { sendJSON(res, 403, { error: 'Запрещено' }); return; }

            let body, parsed;
            try {
                body   = await readBody(req);
                parsed = JSON.parse(body);
            } catch (e) {
                sendJSON(res, 400, { error: e.message.includes('large') ? 'Данные слишком большие' : 'Некорректный JSON' });
                return;
            }

            // Валидация структуры по секции
            const arraySection  = ['news', 'events', 'circles', 'achievements'];
            const objectSection = ['site', 'contact', 'map', 'visitors'];
            if (arraySection.includes(section) && !Array.isArray(parsed)) {
                sendJSON(res, 400, { error: `Секция "${section}" должна быть массивом` }); return;
            }
            if (objectSection.includes(section) && (typeof parsed !== 'object' || Array.isArray(parsed))) {
                sendJSON(res, 400, { error: `Секция "${section}" должна быть объектом` }); return;
            }
            if (section === 'team' && (!parsed.director || !Array.isArray(parsed.deputies) || !Array.isArray(parsed.staff))) {
                sendJSON(res, 400, { error: 'Секция "team" должна содержать director, deputies[], staff[]' }); return;
            }
            if (section === 'documents' && !Array.isArray(parsed.main)) {
                sendJSON(res, 400, { error: 'Секция "documents" должна содержать main[]' }); return;
            }
            if (section === 'gallery' && !Array.isArray(parsed)) {
                sendJSON(res, 400, { error: 'Секция "gallery" должна быть массивом' }); return;
            }

            safeWriteJSON(dataFile, parsed);
            sendJSON(res, 200, { ok: true });
            return;
        }

        sendJSON(res, 405, { error: 'Метод не разрешён' });
        return;
    }

    // ===== СТАТИЧЕСКИЕ ФАЙЛЫ =====
    let urlPath;
    try {
        urlPath = decodeURIComponent(req.url.split('?')[0]);
    } catch {
        res.writeHead(400);
        res.end('400 Bad Request');
        return;
    }

    // Считаем посетителей главной страницы
    if (urlPath === '/' || urlPath === '/dom-kultury.html') trackVisit();

    let filePath = urlPath === '/'
        ? path.join(ROOT, 'dom-kultury.html')
        : path.join(ROOT, urlPath);

    // Защита от path traversal
    const normalizedRoot = path.resolve(ROOT);
    const normalizedFile = path.resolve(filePath);
    if (!normalizedFile.startsWith(normalizedRoot + path.sep) && normalizedFile !== path.resolve(ROOT, 'dom-kultury.html')) {
        res.writeHead(403);
        res.end('403 Forbidden');
        return;
    }

    const ext  = path.extname(filePath);
    const mime = MIME_TYPES[ext] || 'application/octet-stream';

    const cacheControl = /\.(jpg|jpeg|png|webp|gif|svg|woff2?|ico)$/i.test(filePath)
        ? 'public, max-age=604800'
        : /\.(css|js)$/i.test(filePath)
        ? 'public, max-age=3600'
        : 'no-cache';

    fs.readFile(filePath, (err, data) => {
        if (err) {
            const page404 = path.join(ROOT, '404.html');
            fs.readFile(page404, (err2, html) => {
                if (err2) { res.writeHead(404); res.end('404 Not Found'); return; }
                res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
                res.end(html);
            });
            return;
        }
        const headers = {
            'Content-Type': mime,
            'Cache-Control': cacheControl,
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'SAMEORIGIN',
        };
        if (mime.startsWith('text/html')) {
            headers['Content-Security-Policy'] = 'upgrade-insecure-requests';
            headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains';
        }
        const compressible = /^(text\/|application\/javascript|application\/json)/.test(mime);
        if (compressible) {
            sendCompressed(req, res, 200, headers, data);
        } else {
            res.writeHead(200, headers);
            res.end(data);
        }
    });
});

function cleanOrphanedUploads() {
    const uploadsDir = path.join(ROOT, 'uploads');
    const dataDir    = path.join(ROOT, 'data');
    try {
        const used = new Set(['логотип.png']);
        for (const f of fs.readdirSync(dataDir)) {
            if (!f.endsWith('.json')) continue;
            const raw = fs.readFileSync(path.join(dataDir, f), 'utf8');
            for (const m of raw.matchAll(/uploads\/([^"'\s]+)/g)) used.add(m[1]);
        }
        let deleted = 0;
        for (const f of fs.readdirSync(uploadsDir)) {
            if (!used.has(f)) {
                fs.unlinkSync(path.join(uploadsDir, f));
                deleted++;
            }
        }
        if (deleted > 0) logger.info(`[Автоочистка] Удалено ${deleted} неиспользуемых файлов из uploads/`);
    } catch (e) {
        logger.error('[Автоочистка] Ошибка:', e.message);
    }
}

server.listen(PORT, () => {
    rotateLogs();
    logger.info(`Сервер запущен:  http://localhost:${PORT}`);
    logger.info(`Админка:         http://localhost:${PORT}/admin.html`);
    logger.info('Нажми Ctrl+C чтобы остановить');

    setTimeout(() => syncTelegramNews().catch(e => logger.error('[TG Sync]', e.message)), 3000);
    setTimeout(() => syncTelegramGallery().catch(e => logger.error('[TG Gallery]', e.message)), 5000);
    setInterval(() => syncTelegramNews().catch(e => logger.error('[TG Sync]', e.message)), SYNC_INTERVAL_MS);
    setInterval(() => syncTelegramGallery().catch(e => logger.error('[TG Gallery]', e.message)), SYNC_INTERVAL_MS);
    setInterval(cleanOrphanedUploads, 7 * 24 * 60 * 60 * 1000);
    setInterval(() => {
        const now = Date.now();
        for (const [k, v] of _rateLimits) if (!v.some(t => now - t < 60000)) _rateLimits.delete(k);
        for (const [k, v] of _authFailures) if (!v.some(t => now - t < AUTH_BLOCK_WINDOW_MS)) _authFailures.delete(k);
    }, CLEANUP_INTERVAL_MS);

    if (process.platform === 'win32' || process.platform === 'darwin') {
        const { exec } = require('child_process');
        exec(process.platform === 'win32' ? `start http://localhost:${PORT}` : `open http://localhost:${PORT}`);
    }
});

// ===== GRACEFUL SHUTDOWN =====
function shutdown() {
    logger.info('[Сервер] Завершение работы...');
    server.close(() => {
        logger.info('[Сервер] Остановлен.');
        process.exit(0);
    });
    setTimeout(() => { logger.error('[Сервер] Принудительное завершение.'); process.exit(1); }, 10000);
}
process.on('SIGTERM', shutdown);
process.on('SIGINT',  shutdown);
