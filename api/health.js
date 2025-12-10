import { fetchProductRows } from '../lib/products.js';
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

  const startedAt = Date.now();

  try {
    const rows = await fetchProductRows();
    return res.status(200).json({
      status: 'ok',
      latencyMs: Date.now() - startedAt,
      productCount: rows.length,
      cacheTtlSeconds: 300
    });
  } catch (error) {
    console.error('Health Error:', error);
    return res.status(500).json({
      status: 'error',
      latencyMs: Date.now() - startedAt,
      message: error.message
    });
  }
}
