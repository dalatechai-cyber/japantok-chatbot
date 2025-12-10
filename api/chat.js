export default async function handler(req, res) {
    // 1. Enable CORS (Allows your website to talk to this backend)
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    // Handle Pre-flight request
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { contents } = req.body;
    if (!contents) {
        return res.status(400).json({ error: 'No content provided' });
    }

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_API_KEY) {
        return res.status(500).json({ error: 'Server Error: API key configuration missing.' });
    }

    console.log("✅ DEBUG: Processing request with gemini-2.0-flash");

    const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

    try {
        const apiResponse = await fetch(GEMINI_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(req.body)
        });

        const data = await apiResponse.json();

        if (!apiResponse.ok) {
            console.error("❌ Google API Error:", JSON.stringify(data, null, 2));
            return res.status(apiResponse.status).json({ 
                error: data.error?.message || 'Error from Google AI' 
            });
        }

        res.status(200).json(data);

    } catch (error) {
        console.error("❌ Server Error:", error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}