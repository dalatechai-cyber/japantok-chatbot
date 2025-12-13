const DEFAULT_CACHE_MS = Number.parseInt(process.env.PRODUCT_CACHE_MS, 10) || 5 * 60 * 1000;
let cache = { rows: null, expiresAt: 0 };
const priceFormatter = new Intl.NumberFormat('mn-MN');

// Fuzzy matching threshold - maximum edit distance to consider a match
// Increased from 2 to 3 to be more lenient with typos and variations
const MAX_EDIT_DISTANCE = 3;
const MIN_TOKEN_LENGTH_FOR_FUZZY = 3;

// Pre-compute normalized synonym groups for performance
const NORMALIZED_SYNONYM_GROUPS = [];

// Include common misspellings/transliterations intentionally to match Latin-script inputs
const SYNONYM_GROUPS = [
    ['motor', 'мотор', 'хөдөлгүүр', 'engine', 'motoor', 'hodolguur'],
    ['prius', 'приус', 'p20', 'p30', 'pruis', 'pius', 'prus'],
    // include common Latin misspellings for Harrier
    ['harrier', 'харриер', 'harier', 'harer'],
    ['bumper', 'бампер', 'гупер', 'bamper', 'gpr', 'guper', 'gvr'],
    ['headlight', 'headlamp', 'фар', 'толгойн гэрэл'],
    ['mirror', 'толь', 'зөөгч толь', 'зөөгч', 'мирор'],
    ['door', 'хаалга', 'door panel', 'хаалганы хавтан'],
    ['hood', 'капот', 'hood panel', 'капот хавтан'],
    ['fender', 'fender panel', 'хаалт', 'хаалт хавтан'],
    // Brake-related terms (including possessive forms)
    ['brake', 'тоормос', 'тормоз', 'тоорм', 'toormos', 'toorm', 'brakes', 'тоормосны', 'тоормосын', 'тормозный', 'тормозные'],
    ['brake pad', 'brake pads', 'колодок', 'колодка', 'тоормосны колодок', 'тормозные колодки', 'kolodok', 'kolodka', 'pad', 'pads', 'колодки'],
    ['brake disc', 'brake disk', 'диск', 'тоормосны диск', 'disc', 'disk', 'rotor', 'дискийг'],
    ['brake shoe', 'тоормосны гутал', 'shoe', 'shoes'],
    // Suspension and steering
    ['suspension', 'түдгэлзүүлэлт', 'амортизатор', 'amortizator', 'shock absorber', 'shock', 'амортизаторын'],
    ['steering', 'жолоодлого', 'жолооны', 'steering wheel', 'joloodlogo', 'joloonii', 'жолоодлогын'],
    ['tie rod', 'рулевая тяга', 'рулын татлага', 'тяга'],
    // Transmission and drivetrain
    ['transmission', 'хурдны хайрцаг', 'коробка', 'gearbox', 'gear box', 'hurdn haircag', 'хурдны', 'хурдны хайрцагны'],
    ['clutch', 'сэгсрэгч', 'сцепление', 'segsregch', 'сэгсрэгчийн'],
    ['axle', 'тэнхлэг', 'ось', 'tenkhleg', 'тэнхлэгийн'],
    ['driveshaft', 'drive shaft', 'хөтлөгч тэнхлэг', 'карданный вал'],
    // Filters and fluids
    ['filter', 'шүүлтүүр', 'фильтр', 'shuultur', 'air filter', 'oil filter', 'fuel filter', 'шүүлтүүрийн'],
    ['oil', 'тос', 'масло', 'engine oil', 'motor oil', 'тосны'],
    ['coolant', 'хөргөлтийн шингэн', 'антифриз', 'antifreeze', 'хөргөлтийн'],
    // Body parts
    ['windshield', 'windscreen', 'цонх', 'урд цонх', 'лобовое стекло', 'tsonh', 'glass', 'цонхны'],
    ['spoiler', 'спойлер', 'сарьсан багваахай'],
    ['grille', 'радиатор сүлжээ', 'радиаторная решетка', 'grid', 'радиаторын'],
    ['roof', 'дээвэр', 'крыша', 'deever', 'дээврийн']
];

// Helper to ensure normalized synonym groups are initialized
function ensureNormalizedSynonymGroups() {
    if (NORMALIZED_SYNONYM_GROUPS.length === 0) {
        SYNONYM_GROUPS.forEach(group => {
            const normalizedGroup = group.map(normalizeForSearch).filter(Boolean);
            NORMALIZED_SYNONYM_GROUPS.push(normalizedGroup);
        });
    }
}

const CYRILLIC_TO_LATIN = {
    а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'yo', ж: 'j', з: 'z',
    и: 'i', й: 'i', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', ө: 'u', п: 'p',
    р: 'r', с: 's', т: 't', у: 'u', ү: 'u', ф: 'f', х: 'h', ц: 'ts', ч: 'ch',
    ш: 'sh', щ: 'sh', ъ: '', ь: '', ы: 'y', э: 'e', ю: 'yu', я: 'ya'
};

/**
 * Calculate Levenshtein distance between two strings for fuzzy matching
 * @param {string} a - First string
 * @param {string} b - Second string
 * @returns {number} Edit distance
 */
function levenshteinDistance(a = '', b = '') {
    if (a === b) return 0;
    if (!a.length) return b.length;
    if (!b.length) return a.length;

    const matrix = Array.from({ length: b.length + 1 }, (_, i) => [i]);
    matrix[0] = Array.from({ length: a.length + 1 }, (_, i) => i);

    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b[i - 1] === a[j - 1]) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1, // substitution
                    matrix[i][j - 1] + 1,     // insertion
                    matrix[i - 1][j] + 1      // deletion
                );
            }
        }
    }

    return matrix[b.length][a.length];
}

/**
 * Check if two tokens are fuzzy matches within the edit distance threshold
 * @param {string} token1 - First token
 * @param {string} token2 - Second token
 * @returns {boolean} True if fuzzy match
 */
function isFuzzyMatch(token1 = '', token2 = '') {
    if (token1 === token2) return true;
    if (token1.length < MIN_TOKEN_LENGTH_FOR_FUZZY || token2.length < MIN_TOKEN_LENGTH_FOR_FUZZY) {
        return false;
    }
    
    // Early exit if length difference is too large
    const lengthDiff = Math.abs(token1.length - token2.length);
    if (lengthDiff > MAX_EDIT_DISTANCE) {
        return false;
    }
    
    const distance = levenshteinDistance(token1, token2);
    return distance <= MAX_EDIT_DISTANCE;
}

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

function normalizeForSearch(text = '') {
    return text.toLowerCase().replace(/[?.,!]/g, ' ').replace(/\s+/g, ' ').trim();
}

function transliterateCyrillicToLatin(text = '') {
    return text
        .split('')
        .map((char) => CYRILLIC_TO_LATIN[char] ?? char)
        .join('');
}

function buildTokenVariants(text = '', isNormalized = false) {
    const normalized = isNormalized ? text : normalizeForSearch(text);
    const transliterated = transliterateCyrillicToLatin(normalized);
    const tokens = new Set();

    normalized.split(/\s+/).filter(Boolean).forEach((token) => tokens.add(token));
    transliterated.split(/\s+/).filter(Boolean).forEach((token) => tokens.add(token));

    return Array.from(tokens);
}

function getSynonyms(token = '') {
    ensureNormalizedSynonymGroups();
    
    const normalizedToken = normalizeForSearch(token);
    if (!normalizedToken) return [];

    for (const normalizedGroup of NORMALIZED_SYNONYM_GROUPS) {
        if (normalizedGroup.includes(normalizedToken)) {
            return normalizedGroup.filter((item) => item !== normalizedToken);
        }
    }

    return [];
}

function expandTokens(tokens = []) {
    const expanded = new Set(tokens);

    tokens.forEach((token) => {
        getSynonyms(token).forEach((synonym) => expanded.add(synonym));
    });

    return Array.from(expanded);
}

function getProductTokens(product = {}) {
    if (Array.isArray(product.searchTokens)) return product.searchTokens;

    const haystack = [product.name, product.model, product.tokCode, product.oemCode]
        .filter(Boolean)
        .join(' ');

    // Build token variants but DON'T expand with synonyms to avoid over-matching
    // The query tokens ARE expanded, and synonym matching happens via areSynonyms()
    // This asymmetric approach ensures precise matching: query "тоормос" expands to
    // include "brake", and during comparison we check both exact match AND synonym match
    const tokens = buildTokenVariants(haystack);
    product.searchTokens = tokens;
    return tokens;
}

function hasCodeMatch(tokenSet, normalizedQueryText, code = '') {
    if (!code) return false;
    const normalizedCode = code.toLowerCase();
    return tokenSet.has(normalizedCode) || normalizedQueryText.includes(normalizedCode);
}

/**
 * Check if two tokens are synonyms
 * @param {string} token1 - First token
 * @param {string} token2 - Second token
 * @returns {boolean} True if tokens are synonyms
 */
function areSynonyms(token1 = '', token2 = '') {
    if (token1 === token2) return true;
    
    const norm1 = normalizeForSearch(token1);
    const norm2 = normalizeForSearch(token2);
    
    if (norm1 === norm2) return true;
    
    ensureNormalizedSynonymGroups();
    
    // Check if both tokens are in the same normalized synonym group
    for (const normalizedGroup of NORMALIZED_SYNONYM_GROUPS) {
        if (normalizedGroup.includes(norm1) && normalizedGroup.includes(norm2)) {
            return true;
        }
    }
    
    return false;
}

export function findMatchingProducts(query = '', products = [], limit = null) {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return [];

    const normalizedQuery = normalizeForSearch(trimmed);
    if (!normalizedQuery) return [];

    const tokens = expandTokens(buildTokenVariants(normalizedQuery, true));
    if (!tokens.length) return [];
    const tokenSet = new Set(tokens);
    const normalizedQueryText = normalizedQuery;

    const scored = products
        .map((product) => {
            const haystackTokens = getProductTokens(product);
            const haystackSet = new Set(haystackTokens);

            let score = 0;
            let exactMatches = 0;
            let synonymMatches = 0;
            let fuzzyMatches = 0;
            let substringMatches = 0;

            // Build full product text for substring matching
            const fullProductText = [product.name, product.model, product.tokCode, product.oemCode]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();

            // Check for exact, synonym, fuzzy, and substring matches
            tokens.forEach((queryToken) => {
                if (haystackSet.has(queryToken)) {
                    // Exact match - highest score
                    score += queryToken.length * 2;
                    exactMatches++;
                } else {
                    // Check for synonym matches
                    let foundSynonym = false;
                    for (const haystackToken of haystackTokens) {
                        if (areSynonyms(queryToken, haystackToken)) {
                            // Synonym match - high score (almost as good as exact)
                            score += queryToken.length * 1.8;
                            synonymMatches++;
                            foundSynonym = true;
                            break;
                        }
                    }
                    
                    // If no synonym found, check for fuzzy matches
                    if (!foundSynonym) {
                        let foundFuzzy = false;
                        for (const haystackToken of haystackTokens) {
                            if (isFuzzyMatch(queryToken, haystackToken)) {
                                // Fuzzy match - lower score than exact/synonym
                                score += queryToken.length;
                                fuzzyMatches++;
                                foundFuzzy = true;
                                break; // Only count once per query token
                            }
                        }
                        
                        // If no fuzzy match, check for substring match within product text
                        if (!foundFuzzy && fullProductText.includes(queryToken)) {
                            // Substring match - lower score than fuzzy
                            score += queryToken.length * 0.8;
                            substringMatches++;
                        }
                    }
                }
            });

            const tokCode = product.tokCodeLower;
            const oemCode = product.oemCodeLower;

            if (hasCodeMatch(tokenSet, normalizedQueryText, tokCode)) {
                score += 25;
            }
            if (hasCodeMatch(tokenSet, normalizedQueryText, oemCode)) {
                score += 15;
            }

            return { product, score, exactMatches, synonymMatches, fuzzyMatches, substringMatches };
        })
        .filter(({ score }) => score > 0)
        .sort((a, b) => {
            // Sort by score first, then by exact matches, then by synonym matches
            if (b.score !== a.score) return b.score - a.score;
            if (b.exactMatches !== a.exactMatches) return b.exactMatches - a.exactMatches;
            if (b.synonymMatches !== a.synonymMatches) return b.synonymMatches - a.synonymMatches;
            return b.substringMatches - a.substringMatches;
        });

    // Apply limit only if specified, otherwise return all matches
    if (limit && limit > 0) {
        return scored.slice(0, limit).map(({ product }) => product);
    }

    return scored.map(({ product }) => product);
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

/**
 * Extract unique part categories from product names
 * @param {Array} products - Array of products
 * @returns {Array} Array of category names
 */
export function extractCategories(products = []) {
    const categoryKeywords = [
        { pattern: /бампер|bumper|bamper/i, label: 'Бампер (Bumper)' },
        { pattern: /фар|headlight|headlamp|lamp/i, label: 'Фар (Headlight)' },
        { pattern: /толь|mirror/i, label: 'Толь (Mirror)' },
        { pattern: /хөдөлгүүр|мотор|motor|engine/i, label: 'Хөдөлгүүр (Engine)' },
        { pattern: /хаалга|door/i, label: 'Хаалга (Door)' },
        { pattern: /капот|hood/i, label: 'Капот (Hood)' },
        { pattern: /хавтан|panel|fender/i, label: 'Хавтан (Panel)' },
        { pattern: /тоормос|тормоз|brake/i, label: 'Тоормос (Brake)' },
        { pattern: /колодок|колодка|brake pad|pad/i, label: 'Тоормосны колодок (Brake Pads)' },
        { pattern: /диск|disc|disk|rotor/i, label: 'Тоормосны диск (Brake Disc)' },
        { pattern: /амортизатор|suspension|shock/i, label: 'Түдгэлзүүлэлт (Suspension)' },
        { pattern: /жолоодлого|steering/i, label: 'Жолоодлого (Steering)' },
        { pattern: /шүүлтүүр|filter|фильтр/i, label: 'Шүүлтүүр (Filter)' },
        { pattern: /сэлбэг|part/i, label: 'Бусад сэлбэг (Other parts)' }
    ];
    
    const foundCategories = new Set();
    
    products.forEach((product) => {
        const name = (product.name || '').toLowerCase();
        categoryKeywords.forEach(({ pattern, label }) => {
            if (pattern.test(name)) {
                foundCategories.add(label);
            }
        });
    });
    
    return Array.from(foundCategories);
}

/**
 * Extract car model names from query for fallback suggestions
 * @param {string} query - User's search query
 * @returns {Array} Array of detected model names
 */
export function extractModelNames(query = '') {
    if (!query) return [];
    
    const normalizedQuery = normalizeForSearch(query);
    const modelPatterns = [
        { pattern: /prius|приус|pruis|pius|prus|p20|p30/i, model: 'Prius' },
        { pattern: /harrier|харриер|harier|harer/i, model: 'Harrier' },
        { pattern: /camry|камри/i, model: 'Camry' },
        { pattern: /corolla|королла/i, model: 'Corolla' },
        { pattern: /rav4|рав4/i, model: 'RAV4' },
        { pattern: /land\s*cruiser|ленд\s*крузер|landcruiser/i, model: 'Land Cruiser' },
        { pattern: /hilux|хайлакс/i, model: 'Hilux' },
        { pattern: /alphard|альфард/i, model: 'Alphard' },
        { pattern: /voxy|вокси/i, model: 'Voxy' },
        { pattern: /noah|ноах/i, model: 'Noah' },
        { pattern: /wish|виш/i, model: 'Wish' },
        { pattern: /crown|краун/i, model: 'Crown' },
        { pattern: /mark\s*x|маркх|markx/i, model: 'Mark X' },
        { pattern: /estima|эстима/i, model: 'Estima' }
    ];
    
    const detectedModels = [];
    modelPatterns.forEach(({ pattern, model }) => {
        if (pattern.test(normalizedQuery) || pattern.test(query)) {
            detectedModels.push(model);
        }
    });
    
    return detectedModels;
}

/**
 * Find products by model name for fallback suggestions
 * @param {string} modelName - Model name to search for
 * @param {Array} products - Array of all products
 * @param {number} limit - Maximum number of results
 * @returns {Array} Array of matching products
 */
export function findProductsByModel(modelName = '', products = [], limit = 10) {
    if (!modelName) return [];
    
    const normalizedModel = normalizeForSearch(modelName);
    return products
        .filter((product) => {
            const productModel = normalizeForSearch(product.model || '');
            const productName = normalizeForSearch(product.name || '');
            return productModel.includes(normalizedModel) || productName.includes(normalizedModel);
        })
        .slice(0, limit);
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
        tokCodeLower: tokCode?.toLowerCase(),
        oemCode,
        oemCodeLower: oemCode?.toLowerCase(),
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
