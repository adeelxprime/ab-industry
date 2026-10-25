const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || 'https://ebwcldmageqkdroszcnj.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVid2NsZG1hZ2Vxa2Ryb3N6Y25qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIyNjY5MTAsImV4cCI6MjEwNzg0MjkxMH0.Q1YHfeZ4kMeOz4AxgVNhPSC0sAXIyJvEJsi1Wq5DTAI';

let supabase = null;
if (supabaseUrl && supabaseKey) {
    supabase = createClient(supabaseUrl, supabaseKey);
}

module.exports = async function handler(req, res) {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(204).end();

    if (!supabase) {
        return res.status(500).json({ error: 'Supabase not configured. Set SUPABASE_URL and SUPABASE_ANON_KEY in Vercel Environment Variables.' });
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
                priceNum: item.price_num || parseInt(String(item.pr).replace(/[^\d]/g, ''), 10) || 0,
                cat: item.cat,
                catName: item.cat_name || (item.cat === 'new' ? 'New Collection' : 'Premium Embroidery'),
                b: item.b || '',
                c: item.c || '',
                img: item.img,
                back: item.back || item.img,
                fabric: item.fabric || 'Chiffon',
                pieces: item.pieces || '3 Piece Stitched',
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
            const prod = req.body;
            if (!prod.n || !prod.pr) {
                return res.status(400).json({ error: 'Product name and price are required.' });
            }

            const newProduct = {
                id: prod.id || `prod-${Date.now()}`,
                n: (prod.n || '').trim(),
                pr: prod.pr && prod.pr.startsWith('Rs') ? prod.pr : `Rs ${prod.pr}`,
                price_num: parseInt(String(prod.pr).replace(/[^\d]/g, ''), 10) || 0,
                cat: prod.cat || 'new',
                cat_name: prod.catName || (prod.cat === 'new' ? 'New Collection' : 'Premium Embroidery'),
                b: prod.b || '',
                c: prod.c || (prod.b ? 'b-new' : ''),
                img: prod.img || '',
                back: prod.back || prod.img || '',
                fabric: prod.fabric || 'Chiffon',
                pieces: prod.pieces || '3 Piece Stitched',
                stock: prod.stock || 'In Stock',
                d: prod.d || 'Handcrafted embroidery. Premium fabric.'
            };

            const { error } = await supabase.from('products').insert([newProduct]);
            if (error) return res.status(500).json({ error: error.message });

            return res.status(201).json({
                ...newProduct,
                priceNum: newProduct.price_num,
                catName: newProduct.cat_name
            });
        } catch (err) {
            return res.status(500).json({ error: err.message });
        }
    }

    return res.status(405).json({ error: 'Method not allowed' });
};
