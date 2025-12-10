import { applyCors } from '../lib/cors.js';

export default async function handler(req, res) {
    const cors = applyCors(req, res, { methods: 'GET,OPTIONS' });

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (!cors.allowed) return res.status(403).json({ error: 'Origin not allowed' });
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method Not Allowed' });

    const GOOGLE_SHEET_URL = process.env.GOOGLE_SHEET_URL;

    if (!GOOGLE_SHEET_URL) {
        return res.status(500).json({ error: 'Configuration Error: Missing Sheet URL' });
    }

    try {
        const response = await fetch(GOOGLE_SHEET_URL);
        
        if (!response.ok) {
            throw new Error(`Sheet fetch failed: ${response.status}`);
        }

        const csvData = await response.text();

        // Basic validation
        if (!csvData || csvData.length < 10) {
            return res.status(400).json({ error: 'Sheet is empty' });
        }

        // Cache for 1 hour to speed up subsequent loads
        res.setHeader('Cache-Control', 'public, s-maxage=3600');
        res.status(200).json({ data: csvData });

    } catch (error) {
        console.error("Sheet Error:", error);
        res.status(500).json({ error: error.message });
    }
}