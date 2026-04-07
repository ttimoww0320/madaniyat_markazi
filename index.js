const http  = require('http');
const https = require('https');
const fs    = require('fs');
const path  = require('path');

const PORT           = 3000;
const ROOT           = __dirname;
const ADMIN_PASSWORD = 'madaniyat_yunusobod';

const TG_TOKEN   = '8214512522:AAH1HzTLfI3WAYrkXRo41BgBAi1SOAxlPEo';
const TG_CHAT_ID = '617371098';

function sendTelegram(text) {
    return new Promise((resolve, reject) => {
        const body = JSON.stringify({ chat_id: TG_CHAT_ID, text, parse_mode: 'HTML' });
        const req  = https.request({
            hostname: 'api.telegram.org',
            path: `/bot${TG_TOKEN}/sendMessage`,
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
        }, res => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => resolve(JSON.parse(data)));
        });
        req.on('error', reject);
        req.write(body);
        req.end();
    });
}

const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css':  'text/css; charset=utf-8',
    '.js':   'text/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png':  'image/png',
    '.jpg':  'image/jpeg',
    '.svg':  'image/svg+xml',
    '.ico':  'image/x-icon',
};

// Разрешённые секции для API
const ALLOWED_SECTIONS = ['events', 'circles', 'team', 'documents', 'gallery', 'contact', 'site'];

// Отправить JSON-ответ
function sendJSON(res, status, data) {
    res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(data));
}

// Проверить пароль из заголовка Authorization: Bearer <пароль>
function checkAuth(req) {
    const auth = req.headers['authorization'] || '';
    return auth === `Bearer ${ADMIN_PASSWORD}`;
}

// Собрать тело запроса
function readBody(req) {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => resolve(body));
        req.on('error', reject);
    });
}

const server = http.createServer(async (req, res) => {

    // CORS — нужен чтобы admin.html мог делать fetch-запросы
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // Preflight OPTIONS
    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    // ===== API МАРШРУТЫ =====
    if (req.url.startsWith('/api/')) {
        const section = req.url.slice(5).split('?')[0]; // убираем /api/ и query string

        // POST /api/upload?name=file.jpg — загрузка фото
        if (section === 'upload') {
            if (!checkAuth(req)) { sendJSON(res, 401, { error: 'Неверный пароль' }); return; }
            if (req.method !== 'POST') { sendJSON(res, 405, { error: 'Метод не разрешён' }); return; }

            const urlObj  = new URL(req.url, `http://localhost:${PORT}`);
            let   fname   = (urlObj.searchParams.get('name') || 'image.jpg').replace(/[^a-zA-Z0-9._-]/g, '_');
            const uploadsDir = path.join(ROOT, 'uploads');

            if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);

            const chunks = [];
            req.on('data', c => chunks.push(c));
            req.on('end', () => {
                fs.writeFile(path.join(uploadsDir, fname), Buffer.concat(chunks), err => {
                    if (err) { sendJSON(res, 500, { error: 'Ошибка сохранения' }); return; }
                    sendJSON(res, 200, { url: `/uploads/${fname}` });
                });
            });
            return;
        }

        // GET /api/auth — проверка пароля без изменения данных
        if (section === 'auth') {
            if (req.method === 'GET') {
                sendJSON(res, checkAuth(req) ? 200 : 401, { ok: checkAuth(req) });
            } else {
                sendJSON(res, 405, { error: 'Метод не разрешён' });
            }
            return;
        }

        // POST /api/send-message — отправка формы обратной связи в Telegram
        if (section === 'send-message') {
            if (req.method !== 'POST') { sendJSON(res, 405, { error: 'Метод не разрешён' }); return; }
            let body;
            try {
                body = JSON.parse(await readBody(req));
            } catch {
                sendJSON(res, 400, { error: 'Некорректный JSON' }); return;
            }

            const { name, phone, message, email, topic } = body;
            if (!name || !phone || !message) {
                sendJSON(res, 400, { error: 'Заполните все поля' }); return;
            }

            // Экранируем HTML-символы чтобы не сломать parse_mode
            const esc = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

            const topicLabels = { circle: 'Запись в кружок', rent: 'Аренда зала', partner: 'Сотрудничество', feedback: 'Жалоба или предложение', other: 'Другое' };

            let text = `📩 <b>Новая заявка с сайта</b>\n\n` +
                       `👤 <b>Имя:</b> ${esc(name)}\n` +
                       `📞 <b>Телефон:</b> ${esc(phone)}\n`;
            if (email) text += `✉️ <b>Email:</b> ${esc(email)}\n`;
            if (topic) text += `📌 <b>Тема:</b> ${esc(topicLabels[topic] || topic)}\n`;
            text += `💬 <b>Сообщение:</b> ${esc(message)}`;

            try {
                await sendTelegram(text);
                sendJSON(res, 200, { ok: true });
            } catch (e) {
                sendJSON(res, 500, { error: 'Ошибка отправки в Telegram' });
            }
            return;
        }

        if (!ALLOWED_SECTIONS.includes(section)) {
            sendJSON(res, 404, { error: 'Секция не найдена' });
            return;
        }

        const dataFile = path.join(ROOT, 'data', `${section}.json`);

        // GET /api/:section — вернуть данные
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

        // POST /api/:section — сохранить данные (только с паролем)
        if (req.method === 'POST') {
            if (!checkAuth(req)) {
                sendJSON(res, 401, { error: 'Неверный пароль' });
                return;
            }

            let body;
            try {
                body = await readBody(req);
                JSON.parse(body); // валидация — убедимся что это корректный JSON
            } catch {
                sendJSON(res, 400, { error: 'Некорректный JSON' });
                return;
            }

            fs.writeFile(dataFile, body, 'utf8', err => {
                if (err) { sendJSON(res, 500, { error: 'Ошибка сохранения' }); return; }
                sendJSON(res, 200, { ok: true });
            });
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

    let filePath = urlPath === '/'
        ? path.join(ROOT, 'dom-kultury.html')
        : path.join(ROOT, urlPath);

    // Защита от path traversal
    if (!filePath.startsWith(ROOT + path.sep) && filePath !== path.join(ROOT, 'dom-kultury.html')) {
        res.writeHead(403);
        res.end('403 Forbidden');
        return;
    }

    const ext  = path.extname(filePath);
    const mime = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (err, data) => {
        if (err) { res.writeHead(404); res.end('404 Not Found'); return; }
        res.writeHead(200, { 'Content-Type': mime });
        res.end(data);
    });
});

server.listen(PORT, () => {
    console.log(`Сервер запущен:  http://localhost:${PORT}`);
    console.log(`Админка:         http://localhost:${PORT}/admin.html`);
    console.log('Нажми Ctrl+C чтобы остановить');

    const { exec } = require('child_process');
    const url = `http://localhost:${PORT}`;
    const cmd = process.platform === 'win32'  ? `start ${url}`
              : process.platform === 'darwin' ? `open ${url}`
              : `xdg-open ${url}`;
    exec(cmd);
});
