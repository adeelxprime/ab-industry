const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || 'https://ebwcldmageqkdroszcnj.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVid2NsZG1hZ2Vxa2Ryb3N6Y25qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIyNjY5MTAsImV4cCI6MjEwNzg0MjkxMH0.Q1YHfeZ4kMeOz4AxgVNhPSC0sAXIyJvEJsi1Wq5DTAI';

let supabase = null;
if (supabaseUrl && supabaseKey) {
    supabase = createClient(supabaseUrl, supabaseKey);
}

module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(204).end();

    if (!supabase) {
        return res.status(500).json({ error: 'Supabase not configured.' });
    }

    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'Product ID required' });

    // PUT — update product
    if (req.method === 'PUT') {
        try {
            const updates = req.body;
            const updateData = {};
            if (updates.n !== undefined) updateData.n = updates.n;
            if (updates.pr !== undefined) {
                updateData.pr = updates.pr;
                updateData.price_num = parseInt(String(updates.pr).replace(/[^\d]/g, ''), 10) || 0;
            }
            if (updates.cat !== undefined) updateData.cat = updates.cat;
            if (updates.catName !== undefined) updateData.cat_name = updates.catName;
            if (updates.b !== undefined) updateData.b = updates.b;
            if (updates.c !== undefined) updateData.c = updates.c;
            if (updates.img !== undefined) updateData.img = updates.img;
            if (updates.back !== undefined) updateData.back = updates.back;
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
