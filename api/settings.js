const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || 'https://ebwcldmageqkdroszcnj.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVid2NsZG1hZ2Vxa2Ryb3N6Y25qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIyNjY5MTAsImV4cCI6MjEwNzg0MjkxMH0.Q1YHfeZ4kMeOz4AxgVNhPSC0sAXIyJvEJsi1Wq5DTAI';

let supabase = null;
if (supabaseUrl && supabaseKey) {
    supabase = createClient(supabaseUrl, supabaseKey);
}

module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(204).end();

    if (!supabase) {
        return res.status(500).json({ error: 'Supabase not configured.' });
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
                    whatsapp: '923320002095',
                    brandName: 'NAQSH E NOOR',
                    tagline: 'EMBROIDERY COLLECTION',
                    instagram: '@naqshenoor555',
                    currency: 'Rs',
                    adminPin: 'admin123'
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
