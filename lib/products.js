const DEFAULT_CACHE_MS = Number.parseInt(process.env.PRODUCT_CACHE_MS, 10) || 5 * 60 * 1000;
let cache = { rows: null, expiresAt: 0 };
const priceFormatter = new Intl.NumberFormat('mn-MN');

export async function fetchProductRows(options = {}) {
    const { force = false } = options;
    const now = Date.now();

    if (!force && cache.rows && cache.expiresAt > now) {
        return cache.rows;
    }

    const sheetUrl = process.env.GOOGLE_SHEET_URL;
    if (!sheetUrl) {
        throw new Error('Missing GOOGLE_SHEET_URL environment variable');
    }

    const response = await fetch(sheetUrl);
    if (!response.ok) {
        throw new Error(`Failed to download sheet: ${response.status}`);
    }

    const csvText = await response.text();
    const parsedRows = parseCsv(csvText).map(normalizeProduct).filter((row) => row.name || row.tokCode || row.oemCode);

    cache = {
        rows: parsedRows,
        expiresAt: now + DEFAULT_CACHE_MS
    };

    return parsedRows;
}

export function findMatchingProducts(query = '', products = [], limit = 6) {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return [];

    const tokens = trimmed.split(/\s+/).filter(Boolean);

    const scored = products
        .map((product) => {
            const haystack = [product.name, product.model, product.tokCode, product.oemCode]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();

            let score = 0;
            tokens.forEach((token) => {
                if (haystack.includes(token)) {
                    score += token.length;
                }
            });

            if (product.tokCode && trimmed.includes(product.tokCode.toLowerCase())) {
                score += 25;
            }
            if (product.oemCode && trimmed.includes(product.oemCode.toLowerCase())) {
                score += 15;
            }

            return { product, score };
        })
        .filter(({ score }) => score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map(({ product }) => product);

    return scored;
}

export function formatProductsForPrompt(products = []) {
    if (!products.length) return 'Бараа олдсонгүй';

    return products
        .map((product, index) => {
            const vat = product.priceWithVat || product.rawPriceWithVat || 'Мэдээлэлгүй';
            const noVat = product.priceWithoutVat || product.rawPriceWithoutVat || 'Мэдээлэлгүй';

            return (
                `${index + 1}. Нэр: ${product.name || 'Тодорхойгүй'}` +
                `\n   TOK: ${product.tokCode || '—'} | OEM: ${product.oemCode || '—'}` +
                `\n   Загвар: ${product.model || 'Тодорхойгүй'}` +
                `\n   Үнэ (НӨАТ-тэй): ${vat}` +
                `\n   Үнэ (НӨАТ-гүй): ${noVat}` +
                `\n   Нөөц: ${product.stock || 'Тодорхойгүй'}`
            );
        })
        .join('\n');
}

export function summarizeProductsForClient(products = []) {
    return products.map((product) => ({
        id: product.id,
        name: product.name,
        tokCode: product.tokCode,
        oemCode: product.oemCode,
        model: product.model,
        priceWithVat: product.priceWithVat || product.rawPriceWithVat,
        priceWithoutVat: product.priceWithoutVat || product.rawPriceWithoutVat,
        stock: product.stock
    }));
}

function parseCsv(text = '') {
    if (!text.trim()) return [];

    const rows = [];
    let currentRow = [];
    let currentValue = '';
    let inQuotes = false;

    for (let i = 0; i < text.length; i += 1) {
        const char = text[i];

        if (char === '"') {
            if (inQuotes && text[i + 1] === '"') {
                currentValue += '"';
                i += 1;
            } else {
                inQuotes = !inQuotes;
            }
            continue;
        }

        if (char === ',' && !inQuotes) {
            currentRow.push(currentValue);
            currentValue = '';
            continue;
        }

        if ((char === '\n' || char === '\r') && !inQuotes) {
            if (char === '\r' && text[i + 1] === '\n') {
                i += 1;
            }
            currentRow.push(currentValue);
            rows.push(currentRow);
            currentRow = [];
            currentValue = '';
            continue;
        }

        currentValue += char;
    }

    if (currentValue || currentRow.length) {
        currentRow.push(currentValue);
    }
    if (currentRow.length) {
        rows.push(currentRow);
    }

    if (!rows.length) return [];

    const headers = rows[0].map((header) => header.trim());
    return rows.slice(1).map((row) => {
        const record = {};
        headers.forEach((header, index) => {
            record[header] = (row[index] ?? '').trim();
        });
        return record;
    });
}

function normalizeProduct(row = {}) {
    const cleaned = Object.fromEntries(
        Object.entries(row).map(([key, value]) => [key.trim(), typeof value === 'string' ? value.trim() : value])
    );

    const name = pickField(cleaned, ['Барааны нэр', 'Нэр', 'name', 'Product Name']);
    const tokCode = pickField(cleaned, ['TOK код', 'TOK CODE', 'Tok code', 'tokCode', 'tok']);
    const oemCode = pickField(cleaned, ['OEM код', 'OEM', 'oemCode']);
    const model = pickField(cleaned, ['Загвар', 'Машин загвар', 'Model']);
    const priceVatRaw = pickField(cleaned, ['Үнэ (НӨАТ-тэй)', 'Бөөний үнэ (НӨАТ орсон үнэ)', 'priceVat']);
    const priceNoVatRaw = pickField(cleaned, ['Үнэ (НӨАТ-гүй)', 'Бөөний үнэ (НӨАТ-гүй)', 'priceNoVat']);
    const stock = pickField(cleaned, ['Нөөц', 'Тоо', 'Stock']);
    const brand = pickField(cleaned, ['Брэнд', 'Brand']);

    const priceWithVat = formatPrice(priceVatRaw);
    const priceWithoutVat = formatPrice(priceNoVatRaw);

    return {
        id: pickField(cleaned, ['ID', 'id', 'Row ID']) || tokCode || oemCode || cryptoRandomId(),
        name,
        tokCode,
        oemCode,
        model,
        brand,
        priceWithVat,
        priceWithoutVat,
        rawPriceWithVat: priceVatRaw,
        rawPriceWithoutVat: priceNoVatRaw,
        stock,
        raw: cleaned
    };
}

function pickField(row, keys = []) {
    for (const key of keys) {
        if (row[key]) return row[key];
    }
    return '';
}

function formatPrice(value) {
    if (!value) return '';
    const numeric = Number.parseFloat(String(value).replace(/[^0-9.-]/g, ''));
    if (!Number.isFinite(numeric)) {
        return value;
    }
    return `${priceFormatter.format(numeric)} ₮`;
}

function cryptoRandomId() {
    if (typeof globalThis.crypto !== 'undefined' && globalThis.crypto.randomUUID) {
        return globalThis.crypto.randomUUID();
    }
    return `row-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
