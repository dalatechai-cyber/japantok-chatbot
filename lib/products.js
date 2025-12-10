import { parse } from 'csv-parse/sync';

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const numberFormatter = new Intl.NumberFormat('mn-MN');
let cachedRows = [];
let cacheTimestamp = 0;

const FIELD_ALIASES = {
  wholesaleNoVat: [
    'Бөөний үнэ (НӨАТ-гүй үнэ)',
    ' Бөөний үнэ (НӨАТ-гүй үнэ) ',
    'Бөөний үнэ (НӨАТ-гүй үнэ) '
  ],
  wholesaleWithVat: [
    'Бөөний үнэ (НӨАТ орсон үнэ)',
    ' Бөөний үнэ (НӨАТ орсон үнэ) ',
    'Бөөний үнэ (НӨАТ орсон үнэ) '
  ],
  retailPrice: [
    'Зах зээлд худалдаалагдах боломжтой жижиглэнгийн үнэ',
    ' Зах зээлд худалдаалагдах боломжтой жижиглэнгийн үнэ '
  ]
};

const clean = (value) => (typeof value === 'string' ? value.trim() : value ?? '');

function extractField(row, keys = []) {
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(row, key)) {
      const found = clean(row[key]);
      if (found) return found;
    }
  }
  return '';
}

function normalizeRow(raw) {
  const id = clean(raw.id);
  const oem = clean(raw.oem);
  const tokCode = clean(raw.tok_code);
  const title = clean(raw.title);
  const wholesaleNoVat = extractField(raw, FIELD_ALIASES.wholesaleNoVat);
  const wholesaleWithVat = extractField(raw, FIELD_ALIASES.wholesaleWithVat);
  const retailPrice = extractField(raw, FIELD_ALIASES.retailPrice);

  const searchBlob = [tokCode, oem, title]
    .filter(Boolean)
    .join(' | ')
    .toLowerCase();

  const compactSearchBlob = searchBlob.replace(/[\s\-/]+/g, '');

  return {
    id,
    oem,
    tokCode,
    title,
    wholesaleNoVat,
    wholesaleWithVat,
    retailPrice,
    searchBlob,
    compactSearchBlob
  };
}

function formatPriceText(value = '') {
  const text = clean(value);
  if (!text) return '';
  const match = text.match(/\d[\d\s]*/);
  if (!match) return text;
  const digits = match[0].replace(/\D/g, '');
  if (!digits) return text;
  const formatted = numberFormatter.format(Number(digits));
  return text.replace(match[0], formatted);
}

function normalizeText(text = '') {
  return text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenize(text = '') {
  return normalizeText(text)
    .replace(/[^0-9a-z\u0400-\u04FF\-\s]/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((token) => token.replace(/[\-/]+/g, ''));
}

function scoreRow(row, tokens) {
  if (!tokens.length) return 0;
  let score = 0;

  for (const token of tokens) {
    if (!token) continue;
    if (row.searchBlob.includes(token)) score += 3;
    if (row.compactSearchBlob.includes(token)) score += 2;
  }

  // Bonus for exact tok/oem matches
  for (const token of tokens) {
    if (!token) continue;
    if (row.tokCode?.replace(/[\s\-/]+/g, '').toLowerCase() === token) score += 5;
    if (row.oem?.replace(/[\s\-/]+/g, '').toLowerCase() === token) score += 4;
  }

  return score;
}

export async function fetchProductRows(force = false) {
  if (!force && cachedRows.length && Date.now() - cacheTimestamp < CACHE_TTL_MS) {
    return cachedRows;
  }

  const GOOGLE_SHEET_URL = process.env.GOOGLE_SHEET_URL;
  if (!GOOGLE_SHEET_URL) {
    throw new Error('GOOGLE_SHEET_URL is not configured');
  }

  const response = await fetch(GOOGLE_SHEET_URL);
  if (!response.ok) {
    throw new Error(`Failed to fetch sheet: ${response.status}`);
  }

  const csvData = await response.text();
  const records = parse(csvData, {
    columns: true,
    skip_empty_lines: true
  });

  const normalized = records
    .map(normalizeRow)
    .filter((row) => row.id || row.tokCode || row.oem || row.title);

  cachedRows = normalized;
  cacheTimestamp = Date.now();

  return normalized;
}

export function findMatchingProducts(query, rows, limit = 6) {
  const tokens = tokenize(query);
  const scored = rows
    .map((row) => ({ row, score: scoreRow(row, tokens) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((item) => item.row);

  return scored;
}

export function formatProductsForPrompt(products = []) {
  if (!products.length) {
    return 'Бараа олдсонгүй. Хэрэглэгчид уучлал хүсье.';
  }

  return products
    .map((product, index) => {
      const lines = [
        `#${index + 1}`,
        product.title ? `Нэр: ${product.title}` : null,
        product.tokCode ? `TOK код: ${product.tokCode}` : null,
        product.oem ? `OEM: ${product.oem}` : null,
        product.wholesaleWithVat ? `Үнэ (НӨАТ-тэй): ${formatPriceText(product.wholesaleWithVat)}` : null,
        product.wholesaleNoVat ? `Үнэ (НӨАТ-гүй): ${formatPriceText(product.wholesaleNoVat)}` : null,
        product.retailPrice ? `Жижиглэн: ${formatPriceText(product.retailPrice)}` : null
      ].filter(Boolean);

      return lines.join('\n');
    })
    .join('\n\n');
}

export function summarizeProductsForClient(products = []) {
  return products.map(({ id, tokCode, oem, title, wholesaleWithVat, wholesaleNoVat }) => ({
    id,
    tokCode,
    oem,
    title,
    wholesaleWithVat: formatPriceText(wholesaleWithVat),
    wholesaleNoVat: formatPriceText(wholesaleNoVat)
  }));
}
