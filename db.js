try { require('dotenv').config(); } catch (_) {}
let createClient = null;
try { createClient = require('@supabase/supabase-js').createClient; } catch (_) {}
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');
const PRODUCTS_FILE = path.join(DATA_DIR, 'products.json');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');

const supabaseUrl = process.env.SUPABASE_URL || 'https://hyofyjsdfqplptyzsaer.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5b2Z5anNkZnFwbHB0eXpzYWVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI5MDg2OTMsImV4cCI6MjEwODQ4NDY5M30.WmNILjvwgWusJAJ-Mmc2FqwNMnp0QgqZ6h6-6iPU3nI';

let supabase = null;
let isSupabaseActive = false;

if (createClient && supabaseUrl && supabaseKey && !supabaseUrl.includes('your-project-id')) {
    try {
        supabase = createClient(supabaseUrl, supabaseKey);
        isSupabaseActive = true;
        console.log('[Database] Connected to Supabase at:', supabaseUrl);
    } catch (e) {
        console.error('[Database] Failed to initialize Supabase client:', e.message);
    }
} else {
    console.log('[Database] Using local JSON database (Resilient & Zero-dependency).');
}

// Local JSON Helpers
function readLocalJSON(file, fallback = []) {
    try {
        if (!fs.existsSync(file)) return fallback;
        return JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch (e) {
        return fallback;
    }
}

function writeLocalJSON(file, data) {
    try {
        fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
        return true;
    } catch (e) {
        return false;
    }
}

// In-Memory Fast Cache (Always primed from local disk on boot)
let memoryCache = {
    products: null,
    settings: null
};

try {
    memoryCache.products = readLocalJSON(PRODUCTS_FILE, []);
    memoryCache.settings = readLocalJSON(SETTINGS_FILE, null);
    console.log('[Database] Fast cache primed: ' + (memoryCache.products ? memoryCache.products.length : 0) + ' products');
} catch (_) {}

function invalidateCache() {
    memoryCache.products = readLocalJSON(PRODUCTS_FILE, []);
    memoryCache.settings = readLocalJSON(SETTINGS_FILE, null);
}

// Non-blocking background initial sync from Supabase
if (isSupabaseActive && supabase) {
    supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: true })
        .then(({ data, error }) => {
            if (!error && Array.isArray(data) && data.length > 0) {
                const prods = data.map(item => ({
                    id: item.id,
                    n: item.n,
                    pr: item.pr,
                    priceNum: item.price_num || parseInt(String(item.pr).replace(/[^\d]/g, ''), 10) || 0,
                    sizes: item.sizes || 'S, M, L, XL, XXL',
                    cat: item.cat,
                    catName: item.cat_name || (item.cat === 'new' ? 'MEN’S COLLECTION' : 'WOMEN’S COLLECTION'),
                    b: item.b || '',
                    c: item.c || '',
                    img: item.img,
                    back: item.back || item.img,
                    imgs: item.imgs || (item.img ? [{ k: item.img, l: 'Front' }, { k: item.back || item.img, l: 'Detail' }] : []),
                    video: item.video || item.videoUrl || '',
                    inScroll: item.inScroll !== undefined ? item.inScroll : (item.in_scroll !== undefined ? item.in_scroll : true),
                    topPosition: item.topPosition !== undefined ? item.topPosition : (item.top_position !== undefined ? item.top_position : false),
                    sortOrder: item.sortOrder !== undefined ? item.sortOrder : (item.sort_order !== undefined ? item.sort_order : 0),
                    fabric: item.fabric || 'Cotton Fleece',
                    pieces: item.pieces || '2 Piece Set',
                    stock: item.stock || 'In Stock',
                    d: item.d || ''
                }));
                memoryCache.products = prods;
                writeLocalJSON(PRODUCTS_FILE, prods);
                console.log('[Database] Supabase products synchronized to cache:', prods.length);
            }
        })
        .catch(err => console.warn('[Database] Initial Supabase products sync skipped:', err.message));

    supabase
        .from('settings')
        .select('*')
        .eq('key', 'general')
        .single()
        .then(({ data, error }) => {
            if (!error && data && data.value) {
                memoryCache.settings = data.value;
                writeLocalJSON(SETTINGS_FILE, data.value);
                console.log('[Database] Supabase settings synchronized to cache');
            }
        })
        .catch(err => console.warn('[Database] Initial Supabase settings sync skipped:', err.message));
}

// ================= PRODUCT METHODS (ULTRA-FAST LOCAL-FIRST) =================
async function getProducts() {
    if (memoryCache.products && Array.isArray(memoryCache.products) && memoryCache.products.length > 0) {
        return memoryCache.products;
    }
    const local = readLocalJSON(PRODUCTS_FILE, []);
    memoryCache.products = local;
    return local;
}

async function createProduct(prod) {
    let rawPr = (prod.pr || '49.00').trim();
    if (!rawPr.startsWith('$')) rawPr = `$${rawPr}`;
    const newProduct = {
        id: prod.id || `prod-${Date.now()}`,
        n: (prod.n || '').trim(),
        pr: rawPr,
        priceNum: parseFloat(rawPr.replace(/[^\d.]/g, '')) || 0,
        sizes: prod.sizes || 'S, M, L, XL, XXL',
        cat: prod.cat || 'new',
        catName: prod.catName || (prod.cat === 'new' ? 'MEN’S COLLECTION' : 'WOMEN’S COLLECTION'),
        b: prod.b || '',
        c: prod.c || (prod.b ? 'b-new' : ''),
        img: prod.img || 'a1',
        back: prod.back || prod.img || 'a2',
        imgs: Array.isArray(prod.imgs) ? prod.imgs : (prod.img ? [{ k: prod.img, l: 'Front' }] : []),
        video: prod.video || prod.videoUrl || '',
        inScroll: prod.inScroll !== false,
        topPosition: !!prod.topPosition,
        sortOrder: parseInt(prod.sortOrder, 10) || 1,
        fabric: prod.fabric || 'Premium Fabric',
        pieces: prod.pieces || 'Set',
        stock: prod.stock || 'In Stock',
        d: prod.d || 'Premium quality apparel. Durable stitching.'
    };

    // 1. INSTANT LOCAL WRITE (< 1 millisecond response time)
    const local = readLocalJSON(PRODUCTS_FILE, []);
    local.push(newProduct);
    writeLocalJSON(PRODUCTS_FILE, local);
    memoryCache.products = local;

    // 2. BACKGROUND ASYNC SUPABASE SYNC (Never freezes or delays the user)
    if (isSupabaseActive && supabase) {
        supabase
            .from('products')
            .insert([{
                id: newProduct.id,
                n: newProduct.n,
                pr: newProduct.pr,
                price_num: newProduct.priceNum,
                sizes: newProduct.sizes,
                cat: newProduct.cat,
                cat_name: newProduct.catName,
                b: newProduct.b,
                c: newProduct.c,
                img: newProduct.img,
                back: newProduct.back,
                imgs: newProduct.imgs,
                video: newProduct.video,
                in_scroll: newProduct.inScroll,
                top_position: newProduct.topPosition,
                sort_order: newProduct.sortOrder,
                fabric: newProduct.fabric,
                pieces: newProduct.pieces,
                stock: newProduct.stock,
                d: newProduct.d
            }])
            .then(({ error }) => {
                if (error) console.error('[Supabase Async Insert Error]:', error.message);
                else console.log('[Supabase Cloud Sync]: Inserted product', newProduct.id);
            })
            .catch(err => console.error('[Supabase Async Insert Exception]:', err.message));
    }

    return newProduct;
}

async function updateProduct(id, updates) {
    const local = readLocalJSON(PRODUCTS_FILE, []);
    const index = local.findIndex(p => String(p.id) === String(id));
    if (index === -1) return null;

    let pr = updates.pr ? String(updates.pr).trim() : local[index].pr;
    if (pr && !pr.startsWith('$')) pr = `$${pr}`;

    const updated = {
        ...local[index],
        ...updates,
        id: local[index].id,
        pr,
        priceNum: pr ? (parseFloat(String(pr).replace(/[^\d.]/g, '')) || 0) : (local[index].priceNum || 0),
        imgs: updates.imgs !== undefined ? updates.imgs : (local[index].imgs || []),
        video: updates.video !== undefined ? updates.video : (local[index].video || ''),
        inScroll: updates.inScroll !== undefined ? updates.inScroll : (local[index].inScroll !== false),
        topPosition: updates.topPosition !== undefined ? updates.topPosition : !!local[index].topPosition,
        sortOrder: updates.sortOrder !== undefined ? updates.sortOrder : (local[index].sortOrder || 1)
    };

    // 1. INSTANT LOCAL WRITE
    local[index] = updated;
    writeLocalJSON(PRODUCTS_FILE, local);
    memoryCache.products = local;

    // 2. BACKGROUND ASYNC SUPABASE SYNC
    if (isSupabaseActive && supabase) {
        supabase
            .from('products')
            .update({
                n: updated.n,
                pr: updated.pr,
                price_num: updated.priceNum,
                sizes: updated.sizes,
                cat: updated.cat,
                cat_name: updated.catName,
                b: updated.b,
                c: updated.c,
                img: updated.img,
                back: updated.back,
                imgs: updated.imgs,
                video: updated.video,
                in_scroll: updated.inScroll,
                top_position: updated.topPosition,
                sort_order: updated.sortOrder,
                fabric: updated.fabric,
                pieces: updated.pieces,
                stock: updated.stock,
                d: updated.d
            })
            .eq('id', String(id))
            .then(({ error }) => {
                if (error) console.error('[Supabase Async Update Error]:', error.message);
                else console.log('[Supabase Cloud Sync]: Updated product', id);
            })
            .catch(err => console.error('[Supabase Async Update Exception]:', err.message));
    }

    return updated;
}

async function deleteProduct(id) {
    // 1. INSTANT LOCAL WRITE
    const local = readLocalJSON(PRODUCTS_FILE, []);
    const filtered = local.filter(p => String(p.id) !== String(id));
    writeLocalJSON(PRODUCTS_FILE, filtered);
    memoryCache.products = filtered;

    // 2. BACKGROUND ASYNC SUPABASE SYNC
    if (isSupabaseActive && supabase) {
        supabase
            .from('products')
            .delete()
            .eq('id', String(id))
            .then(({ error }) => {
                if (error) console.error('[Supabase Async Delete Error]:', error.message);
                else console.log('[Supabase Cloud Sync]: Deleted product', id);
            })
            .catch(err => console.error('[Supabase Async Delete Exception]:', err.message));
    }

    return true;
}

// ================= SETTINGS METHODS =================
async function getSettings() {
    if (memoryCache.settings) {
        return memoryCache.settings;
    }
    const local = readLocalJSON(SETTINGS_FILE, {
        whatsapp: '923077536327',
        brandName: 'AB INDUSTRY',
        tagline: 'WEAR YOUR STYLE',
        instagram: '@abindustry',
        currency: '$',
        adminPin: '1423',
        categories: [
            { id: 'new', name: 'MEN’S COLLECTION', badge: 'MEN' },
            { id: 'sig', name: 'WOMEN’S COLLECTION', badge: 'WOMEN' }
        ]
    });
    memoryCache.settings = local;
    return local;
}

async function saveSettings(settings) {
    // 1. INSTANT LOCAL WRITE
    writeLocalJSON(SETTINGS_FILE, settings);
    memoryCache.settings = settings;

    // 2. BACKGROUND ASYNC SUPABASE SYNC
    if (isSupabaseActive && supabase) {
        supabase
            .from('settings')
            .upsert({
                key: 'general',
                value: settings,
                updated_at: new Date().toISOString()
            })
            .then(({ error }) => {
                if (error) console.error('[Supabase Async Save Settings Error]:', error.message);
                else console.log('[Supabase Cloud Sync]: Saved settings');
            })
            .catch(err => console.error('[Supabase Async Save Settings Exception]:', err.message));
    }

    return settings;
}

function getStatus() {
    return {
        isSupabaseActive,
        supabaseUrl: process.env.SUPABASE_URL || supabaseUrl || null,
        supabaseKey: process.env.SUPABASE_ANON_KEY || supabaseKey || null,
        mode: isSupabaseActive ? 'supabase' : 'local'
    };
}

async function configureSupabase(url, key) {
    url = (url || '').trim();
    key = (key || '').trim();

    if (url && key) {
        try {
            const client = createClient(url, key);
            supabase = client;
            isSupabaseActive = true;
            process.env.SUPABASE_URL = url;
            process.env.SUPABASE_ANON_KEY = key;

            const envPath = path.join(__dirname, '.env');
            const envContent = `SUPABASE_URL=${url}\nSUPABASE_ANON_KEY=${key}\nPORT=${process.env.PORT || 3000}\n`;
            fs.writeFileSync(envPath, envContent, 'utf8');

            return {
                success: true,
                isSupabaseActive: true,
                supabaseUrl: url,
                message: 'Successfully connected to Supabase!'
            };
        } catch (e) {
            return {
                success: false,
                isSupabaseActive: false,
                error: e.message
            };
        }
    } else {
        supabase = null;
        isSupabaseActive = false;
        process.env.SUPABASE_URL = '';
        process.env.SUPABASE_ANON_KEY = '';
        const envPath = path.join(__dirname, '.env');
        fs.writeFileSync(envPath, `SUPABASE_URL=\nSUPABASE_ANON_KEY=\nPORT=${process.env.PORT || 3000}\n`, 'utf8');
        return {
            success: true,
            isSupabaseActive: false,
            message: 'Switched to Local Database'
        };
    }
}

async function syncLocalToSupabase() {
    if (!isSupabaseActive || !supabase) {
        return { success: false, message: 'Supabase is not connected. Please enter URL and Anon Key first.' };
    }
    const localProds = readLocalJSON(PRODUCTS_FILE, []);
    const localSettings = readLocalJSON(SETTINGS_FILE, {});

    let syncedCount = 0;
    const errors = [];
    for (const p of localProds) {
        const payload = {
            id: p.id,
            n: p.n,
            pr: p.pr,
            price_num: p.priceNum || 0,
            sizes: typeof p.sizes === 'string' ? p.sizes : (Array.isArray(p.sizes) ? p.sizes.join(', ') : 'S, M, L, XL, XXL'),
            cat: p.cat || 'new',
            cat_name: p.catName || 'MEN’S COLLECTION',
            b: p.b || '',
            c: p.c || '',
            img: p.img,
            back: p.back || p.img,
            imgs: p.imgs || [],
            video: p.video || '',
            in_scroll: p.inScroll !== false,
            top_position: !!p.topPosition,
            sort_order: p.sortOrder || 1,
            fabric: p.fabric || 'Cotton Fleece',
            pieces: p.pieces || 'Set',
            stock: p.stock || 'In Stock',
            d: p.d || ''
        };
        const { error } = await supabase.from('products').upsert(payload, { onConflict: 'id' });
        if (!error) syncedCount++;
        else errors.push(`${p.n}: ${error.message}`);
    }

    if (localSettings && Object.keys(localSettings).length > 0) {
        await supabase.from('settings').upsert({
            key: 'general',
            value: localSettings,
            updated_at: new Date().toISOString()
        });
    }

    if (errors.length > 0) {
        return {
            success: syncedCount > 0,
            syncedCount,
            total: localProds.length,
            errors,
            message: `Synced ${syncedCount}/${localProds.length} products. Some columns may need supabase_schema.sql run.`
        };
    }

    return {
        success: true,
        syncedCount,
        total: localProds.length,
        message: `Successfully synced all ${syncedCount} products and settings to Supabase!`
    };
}

module.exports = {
    getProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    getSettings,
    saveSettings,
    getStatus,
    configureSupabase,
    syncLocalToSupabase
};
