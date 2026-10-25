const http = require('http');
const fs = require('fs');
const path = require('path');
const db = require('./db');

const DATA_DIR = path.join(__dirname, 'data');
const UPLOADS_DIR = path.join(__dirname, 'assets', 'images');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

// Pre-read HTML files so Vercel NFT bundles them and in-memory serving is guaranteed
let ADMIN_HTML = '';
let INDEX_HTML = '';
try {
    ADMIN_HTML = fs.readFileSync(path.join(__dirname, 'admin.html'), 'utf8');
} catch (e) {
    console.warn('Initial admin.html read:', e.message);
}
try {
    INDEX_HTML = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
} catch (e) {
    console.warn('Initial index.html read:', e.message);
}

const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.mov': 'video/quicktime',
    '.ico': 'image/x-icon'
};

function sendJSON(res, statusCode, data) {
    res.writeHead(statusCode, {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
    });
    res.end(JSON.stringify(data));
}

function parseBody(req) {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => {
            body += chunk;
            if (body.length > 50 * 1024 * 1024) { // 50MB limit
                req.connection?.destroy();
                reject(new Error('Payload too large'));
            }
        });
        req.on('end', () => {
            if (!body) return resolve({});
            try {
                resolve(JSON.parse(body));
            } catch (e) {
                resolve(body);
            }
        });
        req.on('error', reject);
    });
}

const handler = async (req, res) => {
    const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const pathname = urlObj.pathname;

    // CORS preflight
    if (req.method === 'OPTIONS') {
        res.writeHead(204, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        });
        return res.end();
    }

    // ================= API ROUTES =================
    // GET /api/db/status (Supabase connection status)
    if (pathname === '/api/db/status' && req.method === 'GET') {
        return sendJSON(res, 200, db.getStatus());
    }

    // POST /api/supabase/config (Update Supabase credentials)
    if (pathname === '/api/supabase/config' && req.method === 'POST') {
        try {
            const body = await parseBody(req);
            const result = await db.configureSupabase(body.url, body.key);
            return sendJSON(res, 200, result);
        } catch (err) {
            return sendJSON(res, 500, { error: err.message });
        }
    }

    // POST /api/db/sync (Push local catalog to Supabase)
    if (pathname === '/api/db/sync' && req.method === 'POST') {
        try {
            const result = await db.syncLocalToSupabase();
            return sendJSON(res, 200, result);
        } catch (err) {
            return sendJSON(res, 500, { error: err.message });
        }
    }

    // GET /api/products
    if (pathname === '/api/products' && req.method === 'GET') {
        const products = await db.getProducts();
        return sendJSON(res, 200, products);
    }

    // POST /api/products (Create product)
    if (pathname === '/api/products' && req.method === 'POST') {
        try {
            const body = await parseBody(req);
            if (!body.n || !body.pr) {
                return sendJSON(res, 400, { error: 'Product name and price are required.' });
            }
            const newProduct = await db.createProduct(body);
            return sendJSON(res, 201, newProduct);
        } catch (err) {
            return sendJSON(res, 500, { error: err.message });
        }
    }

    // PUT /api/products/:id (Update product)
    if (pathname.startsWith('/api/products/') && req.method === 'PUT') {
        const id = pathname.replace('/api/products/', '');
        try {
            const body = await parseBody(req);
            const updated = await db.updateProduct(id, body);
            if (!updated) {
                return sendJSON(res, 404, { error: 'Product not found' });
            }
            return sendJSON(res, 200, updated);
        } catch (err) {
            return sendJSON(res, 500, { error: err.message });
        }
    }

    // DELETE /api/products/:id (Delete product)
    if (pathname.startsWith('/api/products/') && req.method === 'DELETE') {
        const id = pathname.replace('/api/products/', '');
        await db.deleteProduct(id);
        return sendJSON(res, 200, { success: true, message: 'Product deleted' });
    }

    // GET /api/settings
    if (pathname === '/api/settings' && req.method === 'GET') {
        const settings = await db.getSettings();
        return sendJSON(res, 200, settings);
    }

    // PUT /api/settings (Update settings)
    if (pathname === '/api/settings' && req.method === 'PUT') {
        try {
            const body = await parseBody(req);
            const updated = await db.saveSettings(body);
            return sendJSON(res, 200, updated);
        } catch (err) {
            return sendJSON(res, 500, { error: err.message });
        }
    }

    // POST /api/upload-video (Direct binary stream upload for video files without base64 memory bloat)
    if (pathname === '/api/upload-video' && req.method === 'POST') {
        try {
            const rawExt = req.headers['x-file-ext'] || '.mp4';
            const ext = rawExt.startsWith('.') ? rawExt.toLowerCase() : `.${rawExt.toLowerCase()}`;
            const filename = `video_${Date.now()}_${Math.random().toString(36).substring(2, 7)}${ext}`;
            const dest = path.join(UPLOADS_DIR, filename);

            const fileStream = fs.createWriteStream(dest);
            req.pipe(fileStream);

            fileStream.on('finish', () => {
                const publicUrl = `assets/images/${filename}`;
                return sendJSON(res, 200, { success: true, url: publicUrl, filename });
            });

            fileStream.on('error', (err) => {
                console.error('[Video Upload Error]:', err.message);
                return sendJSON(res, 500, { error: 'Failed to save video file' });
            });
            return;
        } catch (err) {
            return sendJSON(res, 500, { error: err.message });
        }
    }

    // POST /api/upload (Base64 image or video upload)
    if (pathname === '/api/upload' && req.method === 'POST') {
        try {
            const body = await parseBody(req);
            const data = body.image || body.file || body.video;
            if (!data) {
                return sendJSON(res, 400, { error: 'File data is required' });
            }
            // If running on readonly filesystem (like Vercel lambda), return base64 URL directly
            try {
                let ext = '.jpg';
                if (data.startsWith('data:image/png')) ext = '.png';
                else if (data.startsWith('data:image/webp')) ext = '.webp';
                else if (data.startsWith('data:video/mp4')) ext = '.mp4';
                else if (data.startsWith('data:video/webm')) ext = '.webm';
                else if (data.startsWith('data:video/quicktime')) ext = '.mov';
                else if (data.includes('video')) ext = '.mp4';

                const base64Data = data.replace(/^data:[^;]+;base64,/, '');
                const filename = `media_${Date.now()}_${Math.random().toString(36).substring(2, 7)}${ext}`;
                const dest = path.join(UPLOADS_DIR, filename);

                fs.writeFileSync(dest, Buffer.from(base64Data, 'base64'));
                const publicUrl = `assets/images/${filename}`;
                return sendJSON(res, 200, { success: true, url: publicUrl, filename });
            } catch (fsErr) {
                // Readonly fallback: return base64 data directly
                return sendJSON(res, 200, { success: true, url: data, filename: `upload_${Date.now()}` });
            }
        } catch (err) {
            return sendJSON(res, 500, { error: err.message });
        }
    }

    // ================= HTML PAGES (FAST IN-MEMORY SERVING) =================
    // Admin Panel
    if (pathname === '/admin' || pathname === '/admin.html') {
        try {
            const adminHtml = fs.readFileSync(path.join(__dirname, 'admin.html'), 'utf8');
            res.writeHead(200, {
                'Content-Type': 'text/html; charset=utf-8',
                'Cache-Control': 'no-cache, no-store, must-revalidate'
            });
            return res.end(adminHtml);
        } catch (e) {
            if (ADMIN_HTML) {
                res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
                return res.end(ADMIN_HTML);
            }
        }
    }

    // Storefront Homepage
    if (pathname === '/' || pathname === '/index.html' || pathname === '') {
        try {
            const indexHtml = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
            res.writeHead(200, {
                'Content-Type': 'text/html; charset=utf-8',
                'Cache-Control': 'no-cache, no-store, must-revalidate'
            });
            return res.end(indexHtml);
        } catch (e) {
            if (INDEX_HTML) {
                res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
                return res.end(INDEX_HTML);
            }
        }
    }

    // ================= STATIC ASSET FILES =================
    let safePath = path.normalize(decodeURIComponent(pathname))
        .replace(/^(\.\.[\/\\])+/, '')
        .replace(/^[\\\/]+/, '');

    const filePath = path.join(__dirname, safePath);
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (err, content) => {
        if (err) {
            if (err.code === 'ENOENT') {
                res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
                res.end('404 Not Found - Naqsh e Noor');
            } else {
                res.writeHead(500);
                res.end(`Server Error: ${err.code}`);
            }
        } else {
            res.writeHead(200, {
                'Content-Type': contentType,
                'Cache-Control': ext === '.jpg' || ext === '.png' || ext === '.webp' ? 'public, max-age=86400' : 'no-cache'
            });
            res.end(content);
        }
    });
};

const server = http.createServer(handler);

if (require.main === module) {
    const port = process.env.PORT || 3000;
    server.listen(port, () => {
        const url = `http://localhost:${port}`;
        console.log(`===========================================`);
        console.log(` Naqsh e Noor Storefront: ${url}`);
        console.log(` Naqsh e Noor Admin Panel: ${url}/admin`);
        console.log(`===========================================`);
    });
}

module.exports = handler;
