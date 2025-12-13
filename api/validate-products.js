import { fetchProductRows } from '../lib/products.js';
import { applyCors } from '../lib/cors.js';

const EXPECTED_PRODUCT_COUNT = 226;

export default async function handler(req, res) {
    const cors = applyCors(req, res, { methods: 'GET,OPTIONS' });

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (!cors.allowed) return res.status(403).json({ error: 'Origin not allowed' });
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method Not Allowed' });

    try {
        const products = await fetchProductRows({ force: true });
        
        // Count products with complete information
        const completeProducts = products.filter(p => 
            p.name && p.tokCode && p.oemCode && p.model
        );
        
        const incompleteProducts = products.filter(p => 
            !p.name || !p.tokCode || !p.oemCode || !p.model
        );

        const response = {
            status: 'success',
            productCount: {
                total: products.length,
                expected: EXPECTED_PRODUCT_COUNT,
                difference: products.length - EXPECTED_PRODUCT_COUNT,
                complete: completeProducts.length,
                incomplete: incompleteProducts.length
            },
            validation: {
                countMatches: products.length === EXPECTED_PRODUCT_COUNT,
                allComplete: incompleteProducts.length === 0,
                overall: products.length === EXPECTED_PRODUCT_COUNT && incompleteProducts.length === 0
            },
            message: products.length === EXPECTED_PRODUCT_COUNT && incompleteProducts.length === 0
                ? '✅ All 226 products are present and complete!'
                : products.length === EXPECTED_PRODUCT_COUNT
                    ? `⚠️ Product count is correct (${products.length}), but ${incompleteProducts.length} products have missing fields`
                    : `❌ Expected ${EXPECTED_PRODUCT_COUNT} products, but found ${products.length}`,
            timestamp: new Date().toISOString()
        };

        // Cache for 5 minutes
        res.setHeader('Cache-Control', 'public, s-maxage=300');
        return res.status(200).json(response);

    } catch (error) {
        console.error('Product validation error:', error);
        return res.status(500).json({
            status: 'error',
            error: error.message,
            message: 'Failed to validate products'
        });
    }
}
