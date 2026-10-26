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
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', '*');
    if (req.method === 'OPTIONS') return res.status(204).end();

    if (!supabase) {
        return res.status(500).json({ error: 'Supabase client not initialized.' });
    }

    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'Product ID required' });

    // PUT — update product
    if (req.method === 'PUT') {
        try {
            const updates = req.body || {};
            const updateData = {};
            if (updates.n !== undefined) updateData.n = updates.n;
            if (updates.pr !== undefined) {
                let pr = String(updates.pr).trim();
                if (!pr.startsWith('$')) pr = `$${pr}`;
                updateData.pr = pr;
                updateData.price_num = parseFloat(pr.replace(/[^\d.]/g, '')) || 0;
            }
            if (updates.sizes !== undefined) updateData.sizes = updates.sizes;
            if (updates.cat !== undefined) updateData.cat = updates.cat;
            if (updates.catName !== undefined) updateData.cat_name = updates.catName;
            if (updates.b !== undefined) updateData.b = updates.b;
            if (updates.c !== undefined) updateData.c = updates.c;
            if (updates.img !== undefined) updateData.img = updates.img;
            if (updates.back !== undefined) updateData.back = updates.back;
            if (updates.imgs !== undefined) updateData.imgs = updates.imgs;
            if (updates.video !== undefined) updateData.video = updates.video;
            if (updates.inScroll !== undefined) updateData.in_scroll = !!updates.inScroll;
            if (updates.topPosition !== undefined) updateData.top_position = !!updates.topPosition;
            if (updates.sortOrder !== undefined) updateData.sort_order = parseInt(updates.sortOrder, 10) || 1;
            if (updates.fabric !== undefined) updateData.fabric = updates.fabric;
            if (updates.pieces !== undefined) updateData.pieces = updates.pieces;
            if (updates.stock !== undefined) updateData.stock = updates.stock;
            if (updates.d !== undefined) updateData.d = updates.d;

            const { data, error } = await supabase
                .from('products')
                .update(updateData)
                .eq('id', String(id))
                .select()
                .single();

            if (error) return res.status(500).json({ error: error.message });
            return res.status(200).json(data);
        } catch (err) {
            return res.status(500).json({ error: err.message });
        }
    }

    // DELETE — delete product
    if (req.method === 'DELETE') {
        try {
            const { error } = await supabase
                .from('products')
                .delete()
                .eq('id', String(id));

            if (error) return res.status(500).json({ error: error.message });
            return res.status(200).json({ success: true, message: 'Product deleted' });
        } catch (err) {
            return res.status(500).json({ error: err.message });
        }
    }

    return res.status(405).json({ error: 'Method not allowed' });
};
