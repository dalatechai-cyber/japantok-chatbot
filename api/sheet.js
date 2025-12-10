import { fetchProductRows, summarizeProductsForClient } from '../lib/products.js';
import { applyCors } from '../lib/cors.js';

export default async function handler(req, res) {
    const cors = applyCors(req, res, { methods: 'GET,OPTIONS' });

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (!cors.allowed) {
        return res.status(403).json({ error: 'Origin not allowed' });
    }
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const rows = await fetchProductRows();
        const includeFull = req.query?.full === '1';

        res.status(200).json({
            count: rows.length,
            rows: includeFull ? summarizeProductsForClient(rows) : undefined
        });
    } catch (error) {
        console.error('Sheet Error:', error);
        res.status(500).json({ error: error.message });
    }
}