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
    res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', '*');
    if (req.method === 'OPTIONS') return res.status(204).end();

    if (!supabase) {
        return res.status(500).json({ error: 'Supabase client not initialized.' });
    }

    // GET — fetch settings
    if (req.method === 'GET') {
        try {
            const { data, error } = await supabase
                .from('settings')
                .select('*')
                .eq('key', 'general')
                .single();

            if (error || !data) {
                return res.status(200).json({
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
            }
            return res.status(200).json(data.value);
        } catch (err) {
            return res.status(500).json({ error: err.message });
        }
    }

    // PUT — update settings
    if (req.method === 'PUT') {
        try {
            const settings = req.body;
            const { error } = await supabase
                .from('settings')
                .upsert({
                    key: 'general',
                    value: settings,
                    updated_at: new Date().toISOString()
                });

            if (error) return res.status(500).json({ error: error.message });
            return res.status(200).json(settings);
        } catch (err) {
            return res.status(500).json({ error: err.message });
        }
    }

    return res.status(405).json({ error: 'Method not allowed' });
};
