const fs = require('fs');
const path = require('path');
const ROOT = '/home/yunusobo/madaniyat_markazi';
const uploadsDir = ROOT + '/uploads';
const dataDir = ROOT + '/data';

function extractFilename(url) {
    if (!url) return null;
    const m = String(url).match(/uploads\/([^\s"'\\\/]+)/);
    return m ? m[1] : null;
}

function deleteFile(fname) {
    if (!fname) return 0;
    const p = path.join(uploadsDir, fname);
    try {
        const size = fs.statSync(p).size;
        fs.unlinkSync(p);
        return size;
    } catch { return 0; }
}

let totalDeleted = 0;
let totalFreed = 0;

// --- ГАЛЕРЕЯ: оставить последние 40 альбомов ---
try {
    const galleryFile = path.join(dataDir, 'gallery.json');
    const gallery = JSON.parse(fs.readFileSync(galleryFile, 'utf8'));
    const KEEP_ALBUMS = 40;
    if (gallery.length > KEEP_ALBUMS) {
        const toRemove = gallery.slice(KEEP_ALBUMS);
        for (const album of toRemove) {
            for (const photo of (album.photos || [])) {
                const fname = extractFilename(photo);
                const freed = deleteFile(fname);
                if (freed > 0) { totalDeleted++; totalFreed += freed; }
            }
            const fname = extractFilename(album.cover || album.image);
            const freed = deleteFile(fname);
            if (freed > 0) { totalDeleted++; totalFreed += freed; }
        }
        const kept = gallery.slice(0, KEEP_ALBUMS);
        fs.writeFileSync(galleryFile, JSON.stringify(kept, null, 2), 'utf8');
        console.log('Галерея: было', gallery.length, 'альбомов -> оставлено', kept.length);
    } else {
        console.log('Галерея: альбомов', gallery.length, '- в норме');
    }
} catch (e) { console.error('Ошибка галереи:', e.message); }

// --- НОВОСТИ: оставить последние 100 ---
try {
    const newsFile = path.join(dataDir, 'news.json');
    const news = JSON.parse(fs.readFileSync(newsFile, 'utf8'));
    const KEEP_NEWS = 100;
    if (news.length > KEEP_NEWS) {
        const toRemove = news.slice(KEEP_NEWS);
        for (const item of toRemove) {
            const fname = extractFilename(item.image || item.photo);
            const freed = deleteFile(fname);
            if (freed > 0) { totalDeleted++; totalFreed += freed; }
        }
        const kept = news.slice(0, KEEP_NEWS);
        fs.writeFileSync(newsFile, JSON.stringify(kept, null, 2), 'utf8');
        console.log('Новости: было', news.length, '-> оставлено', kept.length);
    } else {
        console.log('Новости:', news.length, '- в норме');
    }
} catch (e) { console.error('Ошибка новостей:', e.message); }

console.log('Итого удалено файлов:', totalDeleted, '| Освобождено:', Math.round(totalFreed / 1024 / 1024) + ' МБ');
