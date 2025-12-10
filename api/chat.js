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

    if (!message) {
        return res.status(400).json({ error: 'Message is required' });
    }

    const requestId = randomUUID?.() ?? String(Date.now());
    const startedAt = Date.now();

    try {
        const allProducts = await fetchProductRows();
        const matchedProducts = findMatchingProducts(message, allProducts, 6);

        if (!matchedProducts.length) {
            const fallback = buildNoMatchResponse(message);
            await logInteraction({
                requestId,
                message,
                response: fallback,
                matchCount: 0,
                latencyMs: Date.now() - startedAt
            });

            return res.status(200).json({ reply: fallback, matches: [] });
        }

        const promptContext = formatProductsForPrompt(matchedProducts);
        const systemInstruction = buildSystemInstruction(promptContext, matchedProducts.length);
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

        const reply = extractReplyText(data) || buildFallbackResponse();

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
            matches: summarizeProductsForClient(matchedProducts)
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
    if (body.message) {
        return {
            message: body.message?.trim(),
            history: Array.isArray(body.history) ? body.history : []
        };
    }

    if (Array.isArray(body.contents)) {
        const contents = body.contents;
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

function buildSystemInstruction(contextText, matchCount) {
    return `Та бол "Japan Tok Mongolia" компанийн албан ёсны хиймэл оюун ухаант туслах. \n\n` +
        `=== Олдсон бараа (${matchCount}) ===\n${contextText}\n\n` +
        `=== ДҮРЭМ ===\n` +
        `1. ЗӨВХӨН дээрх барааны мэдээлэл дээр үндэслэн хариул.\n` +
        `2. Хэрэглэгч НӨАТ-гүй үнэ асуусан тохиолдолд "Үнэ (НӨАТ-гүй)" баганын мэдээллийг ашигла.\n` +
        `3. Эсрэгээрээ онцгойлон дурьдаагүй бол "Үнэ (НӨАТ-тэй)" баганын мэдээллийг ашигла.\n` +
        `4. Мэдээлэл байхгүй бол "Уучлаарай, таны хайсан бараа одоогоор бүртгэлд алга байна" гэж хэл.\n` +
        `5. ХАЯГ, ЦАГИЙН ХУВААРИЙН талаарх асуултад дараах өгөгдлөөр хариул: ` +
        `"нарны зам дагуу энхтайвны гүүрний баруун доод талд 200&570 авто сервисийн байр." ` +
    `Цагийн хуваарь: "даваа-баасан 09:00-21:00, бямба/ням амарна."\n` +
    `6. Хэрэв бараа санал болгож байгаа бол дараах бүтэцтэйгээр бич: \n` +
    `📦 Барааны мэдээлэл:\n` +
    `**Нэр:** <бүтээгдэхүүний нэр>\n` +
    `**Код:** <TOK эсвэл OEM код>\n` +
    `**Үнэ:** <Үнэ ба НӨАТ-ын тайлбар>\n` +
    `📞 захиалах: та 99997571, 88105143 дугаарт холбогдоно уу.\n` +
    `7. Олон сонголт бүхий үед илүү тохирох 1-2 барааг дээрх бүтэцтэйгээр жагсаа.`;
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
    return 'Уучлаарай, түр зуурын алдаа гарлаа. Та дахин оролдоно уу эсвэл 99997571, 88105143 дугаарт холбогдоно уу.';
}

function buildNoMatchResponse(query) {
    const safeQuery = query?.trim() || 'таны хайсан';
    return `Уучлаарай, таны хайсан ${safeQuery} кодтой бараа манай бүртгэлд олдсонгүй. Та кодоо шалгаад дахин бичнэ үү.`;
}