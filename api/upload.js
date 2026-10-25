module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(204).end();

    // On Vercel we can't write to filesystem, so return the base64 as-is for use in admin
    if (req.method === 'POST') {
        const body = req.body;
        if (!body.image) {
            return res.status(400).json({ error: 'Image data is required' });
        }
        // Return the base64 data URL directly — admin panel will use it as img src
        return res.status(200).json({
            success: true,
            url: body.image,
            filename: `base64_${Date.now()}`
        });
    }

    return res.status(405).json({ error: 'Method not allowed' });
};
