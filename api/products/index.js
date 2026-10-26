const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || 'https://hyofyjsdfqplptyzsaer.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5b2Z5anNkZnFwbHB0eXpzYWVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI5MDg2OTMsImV4cCI6MjEwODQ4NDY5M30.WmNILjvwgWusJAJ-Mmc2FqwNMnp0QgqZ6h6-6iPU3nI';

let supabase = null;
if (supabaseUrl && supabaseKey) {
    try {
        supabase = createClient(supabaseUrl, supabaseKey);
    } catch (_) {}
}

module.exports = async function handler(req, res) {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', '*');
    if (req.method === 'OPTIONS') return res.status(204).end();

    if (!supabase) {
        return res.status(500).json({ error: 'Supabase client not initialized.' });
    }

    // GET — fetch all products
    if (req.method === 'GET') {
        try {
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .order('created_at', { ascending: true });

            if (error) return res.status(500).json({ error: error.message });

            const products = (data || []).map(item => ({
                id: item.id,
                n: item.n,
                pr: item.pr,
                priceNum: item.price_num || parseFloat(String(item.pr).replace(/[^\d.]/g, '')) || 0,
                sizes: item.sizes || 'S, M, L, XL, XXL',
                cat: item.cat,
                catName: item.cat_name || (item.cat === 'new' ? 'MEN’S COLLECTION' : 'WOMEN’S COLLECTION'),
                b: item.b || '',
                c: item.c || '',
                img: item.img,
                back: item.back || item.img,
                imgs: item.imgs || (item.img ? [{ k: item.img, l: 'Front' }] : []),
                video: item.video || item.videoUrl || '',
                inScroll: item.inScroll !== undefined ? item.inScroll : (item.in_scroll !== undefined ? item.in_scroll : true),
                topPosition: item.topPosition !== undefined ? item.topPosition : (item.top_position !== undefined ? item.top_position : false),
                sortOrder: item.sortOrder !== undefined ? item.sortOrder : (item.sort_order !== undefined ? item.sort_order : 1),
                fabric: item.fabric || 'Cotton Fleece',
                pieces: item.pieces || 'Set',
                stock: item.stock || 'In Stock',
                d: item.d || ''
            }));
            return res.status(200).json(products);
        } catch (err) {
            return res.status(500).json({ error: err.message });
        }
    }

    // POST — create new product
    if (req.method === 'POST') {
        try {
            const prod = req.body || {};
            if (!prod.n || !prod.pr) {
                return res.status(400).json({ error: 'Product name and price are required.' });
            }

            let rawPr = String(prod.pr).trim();
            if (!rawPr.startsWith('$')) rawPr = `$${rawPr}`;

            const newProduct = {
                id: prod.id || `prod-${Date.now()}`,
                n: (prod.n || '').trim(),
                pr: rawPr,
                price_num: parseFloat(rawPr.replace(/[^\d.]/g, '')) || 0,
                sizes: prod.sizes || 'S, M, L, XL, XXL',
                cat: prod.cat || 'new',
                cat_name: prod.catName || (prod.cat === 'new' ? 'MEN’S COLLECTION' : 'WOMEN’S COLLECTION'),
                b: prod.b || '',
                c: prod.c || (prod.b ? 'b-new' : ''),
                img: prod.img || 'assets/images/sage1.jpg',
                back: prod.back || prod.img || 'assets/images/sage2.jpg',
                imgs: Array.isArray(prod.imgs) ? prod.imgs : (prod.img ? [{ k: prod.img, l: 'Front' }] : []),
                video: prod.video || prod.videoUrl || '',
                in_scroll: prod.inScroll !== false,
                top_position: !!prod.topPosition,
                sort_order: parseInt(prod.sortOrder, 10) || 1,
                fabric: prod.fabric || 'Premium Fabric',
                pieces: prod.pieces || 'Set',
                stock: prod.stock || 'In Stock',
                d: prod.d || 'Premium quality apparel. Durable stitching.'
            };

            const { error } = await supabase.from('products').insert([newProduct]);
            if (error) return res.status(500).json({ error: error.message });

            return res.status(201).json({
                ...newProduct,
                priceNum: newProduct.price_num,
                catName: newProduct.cat_name,
                inScroll: newProduct.in_scroll,
                topPosition: newProduct.top_position,
                sortOrder: newProduct.sort_order
            });
        } catch (err) {
            return res.status(500).json({ error: err.message });
        }
    }

    return res.status(405).json({ error: 'Method not allowed' });
};
