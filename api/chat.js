import { randomUUID } from 'node:crypto';

import {
    fetchProductRows,
    findMatchingProducts,
    formatProductsForPrompt,
    summarizeProductsForClient
} from '../lib/products.js';
import { logInteraction } from '../lib/logger.js';
import { applyCors } from '../lib/cors.js';

const GEMINI_URL =
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

const CONTACT_LINE = '📞 Захиалах:';
const CONTACT_NUMBERS = '99997571, 88105143';
const CONTACT_BLOCK = `Утас: ${CONTACT_NUMBERS}\nХаяг: Нарны зам дагуу Энхтайвны гүүрний баруун доод талд 200&570 авто сервисийн байр.\nЦагийн хуваарь: Даваа-Баасан 09:00-21:00 • Бямба/Ням амарна.`;

const SLANG_RULES = [
    { pattern: /(gpr|guper|gvr|bamper)/gi, replace: 'бампер' },
    { pattern: /(pius|prius|pruis|prus|p20|p30)/gi, replace: 'prius' },
    { pattern: /(snu|sn u|snuu|sainuu)/gi, replace: 'сайн уу' },
    { pattern: /(bnu|bn uu|baigaa yu|priusni bara baigayu)/gi, replace: 'байна уу' },
    { pattern: /(motor|hodolguur)/gi, replace: 'хөдөлгүүр' },
    { pattern: /(oem|kod|code)/gi, replace: 'oem код' },
    { pattern: /(noatgui|no vat|padgui)/gi, replace: 'нөат-гүй' }
];

const STOPWORD_PHRASES = [
    'байна уу',
    'сайн байна уу',
    'сайн уу',
    'sain bnuu',
    'sain bainuu',
    'sain baina uu'
];
const STOPWORDS = new Set([
    'байна',
    'уу',
    'сайн',
    'сайн байна',
    'сайнуу',
    'та',
    'манай',
    'туслах',
    'бол',
    'юу',
    'уу?',
    'юм',
    'лавлах',
    'дээр',
    'sain',
    'sainuu',
    'sainbnuu',
    'sainbainuu',
    'bnuu',
    'bnu',
    'bn',
    'bna',
    'baina',
    'bainuu'
]);

export default async function handler(req, res) {
    const cors = applyCors(req, res, { methods: 'POST,OPTIONS' });

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (!cors.allowed) {
        return res.status(403).json({ error: 'Origin not allowed' });
    }
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_API_KEY) {
        return res.status(500).json({ error: 'Server Error: Missing API Key' });
    }

    const { message, history } = normalizeRequestBody(req.body);
    const normalizedQuery = normalizeUserMessage(message);
    const cleanedQuery = normalizedQuery?.trim();
    const searchQuery = cleanedQuery || message;

    if (!message) {
        return res.status(400).json({ error: 'Message is required' });
    }

    const requestId = randomUUID?.() ?? String(Date.now());
    const startedAt = Date.now();

    if (!cleanedQuery) {
        const gentlePrompt = ensureContactLine('Сайн байна уу! 👋 Japan Tok Mongolia цахим туслахад тавтай морил. Танд ямар сэлбэг хэрэгтэй байна вэ? Та хайж буй сэлбэгийн нэр, код эсвэл машины загвараа бичээрэй.');
        await logInteraction({
            requestId,
            message,
            response: gentlePrompt,
            matchCount: 0,
            latencyMs: Date.now() - startedAt
        });
        return res.status(200).json({
            reply: gentlePrompt,
            matches: [],
            candidates: wrapCandidates(gentlePrompt)
        });
    }

    try {
        const allProducts = await fetchProductRows();
        const matchedProducts = findMatchingProducts(searchQuery, allProducts, 6);

        if (!matchedProducts.length) {
            const fallback = buildNoMatchResponse(message);
            await logInteraction({
                requestId,
                message,
                response: fallback,
                matchCount: 0,
                latencyMs: Date.now() - startedAt
            });

            return res.status(200).json({
                reply: fallback,
                matches: [],
                candidates: wrapCandidates(fallback)
            });
        }

        const promptContext = formatProductsForPrompt(matchedProducts);
        const systemInstruction = buildSystemInstruction(promptContext, matchedProducts.length, message);
        const payload = buildGeminiPayload(history, message, systemInstruction);

        const response = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('Gemini API Error:', data);
            await logInteraction({
                requestId,
                message,
                error: data.error?.message || 'Gemini error',
                matchCount: matchedProducts.length,
                latencyMs: Date.now() - startedAt
            });

            return res.status(response.status).json({ error: data.error?.message || 'AI Error' });
        }

        const rawReply = extractReplyText(data) || buildFallbackResponse();
        const reply = ensureContactLine(rawReply);

        await logInteraction({
            requestId,
            message,
            response: reply,
            matchCount: matchedProducts.length,
            matchedProductIds: matchedProducts.map((product) => product.id || product.tokCode),
            latencyMs: Date.now() - startedAt
        });

        return res.status(200).json({
            reply,
            matches: summarizeProductsForClient(matchedProducts),
            candidates: wrapCandidates(reply, data.candidates)
        });
    } catch (error) {
        console.error('Server Error:', error);
        await logInteraction({
            requestId,
            message,
            error: error.message,
            latencyMs: Date.now() - startedAt
        });

        return res.status(500).json({ error: 'Internal Server Error' });
    }
}

function normalizeRequestBody(body = {}) {
    const data = coerceBody(body);

    if (data.message) {
        return {
            message: data.message?.trim(),
            history: Array.isArray(data.history) ? data.history : []
        };
    }

    if (Array.isArray(data.contents)) {
        const contents = data.contents;
        const last = contents[contents.length - 1];
        const previous = contents.slice(0, -1);

        const legacyHistory = previous
            .map((item) => ({
                role: item.role === 'model' ? 'assistant' : 'user',
                content: item.parts?.map((part) => part.text || '').join('\n').trim()
            }))
            .filter((item) => item.content);

        const lastMessage = last?.parts?.map((part) => part.text || '').join('\n').trim();

        return {
            message: lastMessage,
            history: legacyHistory
        };
    }

    return { message: '', history: [] };
}

function coerceBody(body) {
    if (!body) return {};
    if (typeof body === 'object' && !Buffer.isBuffer(body)) return body;

    try {
        const text = Buffer.isBuffer(body) ? body.toString('utf8') : String(body);
        return JSON.parse(text);
    } catch (_) {
        return {};
    }
}

function buildGeminiPayload(history = [], message, systemInstruction) {
    const trimmedHistory = history
        .filter((entry) => entry?.content)
        .slice(-10)
        .map((entry) => ({
            role: entry.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: entry.content }]
        }));

    trimmedHistory.push({ role: 'user', parts: [{ text: message }] });

    return {
        contents: trimmedHistory,
        systemInstruction: {
            parts: [{ text: systemInstruction }]
        }
    };
}

function buildSystemInstruction(contextText, matchCount, userMessage = '') {
    return `Та бол "Japan Tok Mongolia" компанийн албан ёсны хиймэл оюун ухаант туслах.\n\n` +
        `=== Компанийн мэдээлэл ===\n${CONTACT_BLOCK}\n\n` +
        `=== Хэрэглэгчийн хүсэлт ===\n${userMessage || 'Тодорхойгүй'}\n\n` +
        `=== Олдсон бараа (${matchCount}) ===\n${contextText}\n\n` +
        `=== ДҮРЭМ ===\n` +
        `1. Зөвхөн дээрх өгөгдөл дээр үндэслэн хариул; та мэдээлэл зохиож болохгүй.\n` +
        `2. Хэрэглэгч НӨАТ-гүй үнэ асуусан бол "Үнэ (НӨАТ-гүй)" утгыг, онцгойлон дурдаагүй бол "Үнэ (НӨАТ-тэй)" утгыг ашигла.\n` +
        `3. МӨНГӨН ДҮН ФОРМАТЛАХ: Бүх мөнгөн дүнг ЗААВАЛ мянгатын таслал (,) бүхий, төгрөгийн тэмдэгттэй (₮) бич. Жишээ нь: 88000 → 88,000₮, 150000 → 150,000₮\n` +
        `4. Нэг эсвэл хоёр хамгийн тохирох барааг дараах МЭРГЭЖЛИЙН бүтэцтэйгээр жагсаа:\n\n` +
        `📦 Барааны мэдээлэл:\n` +
        `Нэр: <барааны нэр>\n` +
        `Код: <TOK код> | OEM: <OEM код>\n` +
        `Үнэ: <НӨАТ-тэй үнэ> (НӨАТ орсон)\n` +
        `\n${CONTACT_LINE} Та доорх утсаар холбогдоно уу: ${CONTACT_NUMBERS}\n\n` +
        `5. Бараа олдоогүй бол соёлтойгоор мэдэгдэж, дахин кодоо шалгаж бичихийг санал болго.\n` +
        `6. Холбоо барих мэдээлэл, цагийн хуваарь асуувал компанийн мэдээлэл хэсгийн өгөгдлийг ашигла.\n` +
        `7. Хариултын төгсгөлд заавал "${CONTACT_LINE} Та доорх утсаар холбогдоно уу: ${CONTACT_NUMBERS}" гэж бич.\n` +
        `8. Өөрийгөө "Japan Tok Mongolia"-ийн туслах гэж танилцуулж, найрсаг боловч мэргэжлийн хэв шинж хадгал.\n\n` +
        `=== Бичлэгийн засвар (Slang) ===\n` +
        `- "gpr/guper/gvr/bamper" → "бампер"\n` +
        `- "pius/prius/p20/p30" → "Prius"\n` +
        `- "bnu/bn uu/baigaa yu" → "байна уу"\n` +
        `- "motor/hodolguur" → "хөдөлгүүр"\n` +
        `- "oem/kod/code" → "OEM код"\n` +
        `- "noatgui/no vat/padgui" → "НӨАТ-гүй"\n`;
}

function extractReplyText(data) {
    const candidate = data.candidates?.[0];
    if (!candidate?.content?.parts) return '';
    return candidate.content.parts
        .map((part) => part.text || '')
        .join('\n')
        .trim();
}

function buildFallbackResponse() {
    return ensureContactLine('Уучлаарай, түр зуурын алдаа гарлаа. Та дахин оролдоно уу.');
}

function buildNoMatchResponse(query) {
    const safeQuery = query?.trim() || '';
    // Standardized Polite Error Message - don't assume it's a code if it's a conversational phrase
    const isConversational = /сайн|байна|уу|танд|хэрэгтэй|юу|вэ/i.test(safeQuery);
    
    if (isConversational || !safeQuery) {
        return ensureContactLine('Би танд туслахад бэлэн байна. Та хайж буй сэлбэгийн нэр эсвэл кодоо бичнэ үү.');
    }
    
    return ensureContactLine(`Уучлаарай, таны хайсан "${safeQuery}" бараа манай бүртгэлд олдсонгүй. Та кодоо шалгаад дахин бичнэ үү.`);
}

function normalizeUserMessage(text = '') {
    if (!text) return '';

    let normalized = text.toLowerCase();
    normalized = SLANG_RULES.reduce((acc, rule) => acc.replace(rule.pattern, rule.replace), normalized);

    STOPWORD_PHRASES.forEach((phrase) => {
        const regex = new RegExp(phrase, 'g');
        normalized = normalized.replace(regex, ' ');
    });

    normalized = normalized.replace(/[?.,!]/g, ' ');

    const filtered = normalized
        .split(/\s+/)
        .filter(Boolean)
        .filter((token) => !STOPWORDS.has(token));

    return filtered.join(' ');
}

function ensureContactLine(text = '') {
    const trimmed = (text || '').trim();
    if (!trimmed) {
        return `${CONTACT_LINE} Та доорх утсаар холбогдоно уу: ${CONTACT_NUMBERS}`;
    }

    const lower = trimmed.toLowerCase();
    const hasLine = lower.includes(CONTACT_LINE.toLowerCase()) || lower.includes('захиалах');
    const hasNumbers = lower.includes('99997571') && lower.includes('88105143');
    if (hasLine || hasNumbers) {
        return trimmed;
    }

    return `${trimmed}\n\n${CONTACT_LINE} Та доорх утсаар холбогдоно уу: ${CONTACT_NUMBERS}`;
}

function wrapCandidates(replyText = '', sourceCandidates) {
    if (Array.isArray(sourceCandidates) && sourceCandidates.length) {
        return sourceCandidates;
    }

    return [
        {
            content: {
                parts: [{ text: replyText }]
            },
            finishReason: 'STOP'
        }
    ];
}
