module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', '*');
    if (req.method === 'OPTIONS') return res.status(204).end();

    const supabaseUrl = process.env.SUPABASE_URL || 'https://hyofyjsdfqplptyzsaer.supabase.co';
    const isActive = true;

    return res.status(200).json({
        isSupabaseActive: isActive,
        supabaseUrl: supabaseUrl,
        mode: 'supabase'
    });
};
