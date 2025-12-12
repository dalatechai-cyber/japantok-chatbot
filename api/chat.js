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

// Configuration constants
const MAX_GREETING_LENGTH = 15; // Maximum characters for a message to be considered a simple greeting
const MIN_TOKEN_LENGTH = 4; // Minimum token length to keep during normalization
const RESULTS_PER_PAGE = 50; // Number of results to show per page
const MAX_RESULTS_IN_PROMPT = 100; // Maximum products to send to AI for context

const CONTACT_LINE = '📞 Захиалах:';
const CONTACT_NUMBERS = '99997571, 88105143';
const CONTACT_FULL_TEXT = 'Та доорх утсаар холбогдоно уу:';
const CONTACT_BLOCK = `Утас: ${CONTACT_NUMBERS}\nХаяг: Нарны зам дагуу Энхтайвны гүүрний баруун доод талд 200&570 авто сервисийн байр.\nЦагийн хуваарь: Даваа-Баасан 09:00-21:00 • Бямба/Ням амарна.`;

const AVAILABILITY_SLANG_PATTERN = '(bnu|bn\\s*uu|bn\\s*u|bnuu|baiga\\s*yu|baigaa\\s*yu|bainuu|baigayu|bgayuu|bgayu|bga\\s*yu|bgaa\\s*yu|bgay)';
const AVAILABILITY_SLANG_REGEX = new RegExp(AVAILABILITY_SLANG_PATTERN, 'gi'); // used for normalization
const AVAILABILITY_SLANG_DETECT_REGEX = new RegExp(AVAILABILITY_SLANG_PATTERN, 'i'); // non-global clone for safe .test()
const AVAILABILITY_PATTERNS = [
    /(байна\s*уу|байгаа\s*юу)/,
    AVAILABILITY_SLANG_DETECT_REGEX
];

const SLANG_RULES = [
    { pattern: /(gpr|guper|gvr|bamper|bampeer|banper)/gi, replace: 'бампер' },
    // Match priusni, priusiin, приус variants and normalize to "prius"
    { pattern: /(priusni|priusiin|priusnii|приусын|приусний|приус|pius|prius|pruis|prus|p20|p30)/gi, replace: 'prius' },
    { pattern: /(snu|sn u|snuu|sainuu|sain uu|sain)/gi, replace: 'сайн уу' },
    // Match various forms of "baiga yu", "baigaa yu", etc. with flexible spacing
    { pattern: AVAILABILITY_SLANG_REGEX, replace: 'байна уу' },
    { pattern: /(motor|hodolguur|motoor|mator)/gi, replace: 'хөдөлгүүр' },
    { pattern: /(oem|kod|code)/gi, replace: 'oem код' },
    { pattern: /(noatgui|no vat|padgui|novat)/gi, replace: 'нөат-гүй' },
    { pattern: /(utasni dugar|utas dugar|utasny dugar)/gi, replace: 'утасны дугаар' },
    { pattern: /(hedve|hedvee|хэдвэ)/gi, replace: 'хэд вэ' },
    { pattern: /(harrier|harier|harer)/gi, replace: 'harrier' },
    { pattern: /(фар|headlight|headlamp|lamp)/gi, replace: 'фар' },
    { pattern: /(толь|mirror|mirr|зөөгч толь)/gi, replace: 'толь' }
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
    'bainuu',
    'bara',    // product/goods - generic term
    'baiga',   // being/having - part of question forms
    'yu',      // question particle
    'бараа'    // Mongolian for product/goods
]);

// Keywords that indicate user wants contact information
const CONTACT_KEYWORDS = [
    'утас',           // phone
    'дугаар',         // number
    'холбоо',         // contact
    'захиалах',       // order
    'хаяг',           // address
    'байршил',        // location
    'цагийн хуваарь', // schedule
    'contact',
    'phone',
    'number',
    'call',
    'reach',
    'dugar',          // slang for number
    'utas',           // slang for phone
    'hedve'           // how much/what is
];

// Keywords that indicate greetings or general conversation
const GREETING_KEYWORDS = [
    'сайн',
    'байна',
    'сайн байна',
    'сайн уу',
    'snu',
    'sainuu',
    'sain uu',
    'hello',
    'hi',
    'танилцуулга',
    'юу вэ',
    'юу хийдэг',
    'таны нэр',
    'хэн',
    'яаж'
];

// Keywords that indicate product search intent
const PRODUCT_KEYWORDS = [
    'бампер',
    'prius',
    'харриер',
    'harrier',
    'хөдөлгүүр',
    'мотор',
    'сэлбэг',
    'код',
    'oem',
    'tok',
    'загвар',
    'машин',
    'үнэ',
    'барааны',
    'бараа',
    'нөөц',
    'хайна',
    'хэрэгтэй',
    'авах',
    'худалдаж',
    'bumper',
    'motor',
    'engine',
    'part',
    'spare',
    'фар',
    'headlight',
    'headlamp',
    'толь',
    'mirror',
    'хаалга',
    'door',
    'капот',
    'hood',
    'хавтан',
    'panel'
];

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
    const searchTokens = new Set();
    [cleanedQuery, message].forEach((part) => {
        (part || '')
            .split(/\s+/)
            .filter(Boolean)
            .forEach((token) => searchTokens.add(token));
    });
    // Keep both normalized and raw tokens so we don't lose useful inputs (e.g., English spellings)
    const searchQuery = Array.from(searchTokens).join(' ');
    
    // Check for pagination request ("more", "дараагийнх", etc.)
    const requestingMore = /\b(more|дараагийнх|цааш|next)\b/i.test(message.toLowerCase());
    
    // Extract page number from history or default to 1
    let currentPage = 1;
    if (requestingMore && history.length > 0) {
        // Try to find the last page number mentioned in assistant's responses
        for (let i = history.length - 1; i >= 0; i--) {
            const entry = history[i];
            if (entry.role === 'assistant' && entry.content) {
                const pageMatch = entry.content.match(/Showing\s+\d+[-–]\d+\s+of\s+(\d+)|(\d+)\s*-р хуудас/i);
                if (pageMatch) {
                    // Increment to next page
                    currentPage = Math.floor(parseInt(pageMatch[1] || '1', 10) / RESULTS_PER_PAGE) + 1;
                    break;
                }
            }
        }
    }

    if (!message) {
        return res.status(400).json({ error: 'Message is required' });
    }

    const requestId = randomUUID?.() ?? String(Date.now());
    const startedAt = Date.now();

    // Check intent before doing anything
    const askingForContact = isAskingForContact(message);
    const isGreetingMessage = isGreeting(message);
    const hasProductSearchIntent = hasProductIntent(message);

    // Handle greetings - respond conversationally without product search
    if (isGreetingMessage && !hasProductSearchIntent) {
        const greetingResponse = 'Сайн байна уу! 👋 Japan Tok Mongolia цахим туслахад тавтай морил. Би танд автомашины сэлбэг хэрэгсэл хайхад туслах болно. Танд ямар сэлбэг хэрэгтэй байна вэ? Та хайж буй сэлбэгийн нэр эсвэл машины загвараа бичээрэй.';
        await logInteraction({
            requestId,
            message,
            response: greetingResponse,
            matchCount: 0,
            latencyMs: Date.now() - startedAt
        });
        return res.status(200).json({
            reply: greetingResponse,
            matches: [],
            candidates: wrapCandidates(greetingResponse)
        });
    }

    // Handle contact info requests - use Gemini for natural response
    if (askingForContact && !hasProductSearchIntent) {
        const contactSystemInstruction = buildContactSystemInstruction(message);
        const payload = buildGeminiPayload(history, message, contactSystemInstruction);

        try {
            const response = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await response.json();
            const contactReply = extractReplyText(data) || buildContactResponse();
            
            await logInteraction({
                requestId,
                message,
                response: contactReply,
                matchCount: 0,
                latencyMs: Date.now() - startedAt
            });

            return res.status(200).json({
                reply: contactReply,
                matches: [],
                candidates: wrapCandidates(contactReply, data.candidates)
            });
        } catch (error) {
            // Fallback to static contact response
            const contactReply = buildContactResponse();
            await logInteraction({
                requestId,
                message,
                response: contactReply,
                matchCount: 0,
                latencyMs: Date.now() - startedAt
            });
            return res.status(200).json({
                reply: contactReply,
                matches: [],
                candidates: wrapCandidates(contactReply)
            });
        }
    }

    // If no clear product intent, use Gemini for conversation
    if (!hasProductSearchIntent && cleanedQuery) {
        const conversationInstruction = buildConversationSystemInstruction(message);
        const payload = buildGeminiPayload(history, message, conversationInstruction);

        try {
            const response = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await response.json();
            const conversationReply = extractReplyText(data) || 'Би танд туслахад бэлэн байна. Та хайж буй сэлбэгийн нэр эсвэл кодоо бичнэ үү.';
            
            await logInteraction({
                requestId,
                message,
                response: conversationReply,
                matchCount: 0,
                latencyMs: Date.now() - startedAt
            });

            return res.status(200).json({
                reply: conversationReply,
                matches: [],
                candidates: wrapCandidates(conversationReply, data.candidates)
            });
        } catch (error) {
            // Continue to product search as fallback
        }
    }

    if (!cleanedQuery) {
        const gentlePrompt = ensureContactLine('Сайн байна уу! 👋 Japan Tok Mongolia цахим туслахад тавтай морил. Танд ямар сэлбэг хэрэгтэй байна вэ? Та хайж буй сэлбэгийн нэр эсвэл машины загвараа бичээрэй.', askingForContact);
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
        // Get ALL matching products (no limit)
        const matchedProducts = findMatchingProducts(searchQuery, allProducts);

        if (!matchedProducts.length) {
            const askingForContact = isAskingForContact(message);
            const fallback = buildNoMatchResponse(message, askingForContact);
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

        // Calculate pagination
        const totalMatches = matchedProducts.length;
        const totalPages = Math.ceil(totalMatches / RESULTS_PER_PAGE);
        const startIdx = (currentPage - 1) * RESULTS_PER_PAGE;
        const endIdx = Math.min(startIdx + RESULTS_PER_PAGE, totalMatches);
        const pageProducts = matchedProducts.slice(startIdx, endIdx);
        
        // For AI context, send up to MAX_RESULTS_IN_PROMPT products
        const productsForPrompt = matchedProducts.slice(0, MAX_RESULTS_IN_PROMPT);
        const promptContext = formatProductsForPrompt(productsForPrompt);
        
        // Build pagination info
        const paginationInfo = totalMatches > RESULTS_PER_PAGE
            ? `\n\n💡 Нийт ${totalMatches} бараа олдлоо. ${startIdx + 1}-${endIdx} харуулж байна. ${currentPage < totalPages ? '"More" эсвэл "Цааш" гэж бичвэл дараагийн хуудсыг харна.' : 'Бүх үр дүн харагдсан.'}`
            : '';
        
        const systemInstruction = buildSystemInstruction(promptContext, matchedProducts.length, message, paginationInfo, startIdx + 1, endIdx, totalMatches);
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

        const askingForContact = isAskingForContact(message);
        const rawReply = extractReplyText(data) || buildFallbackResponse(askingForContact);
        const reply = ensureContactLine(rawReply, askingForContact);

        await logInteraction({
            requestId,
            message,
            response: reply,
            matchCount: matchedProducts.length,
            matchedProductIds: matchedProducts.slice(0, 20).map((product) => product.id || product.tokCode),
            latencyMs: Date.now() - startedAt
        });

        return res.status(200).json({
            reply,
            matches: summarizeProductsForClient(pageProducts),
            totalMatches,
            currentPage,
            totalPages,
            hasMore: currentPage < totalPages,
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

function buildSystemInstruction(contextText, matchCount, userMessage = '', paginationInfo = '', startIdx = 1, endIdx = null, totalMatches = null) {
    const resultsInfo = totalMatches && totalMatches > matchCount
        ? `\n\n📊 Нийт ${totalMatches} бараа олдлоо. Та одоогоор ${startIdx}-${endIdx}-ийг харж байна.${paginationInfo}`
        : '';
        
    return `Та бол "Japan Tok Mongolia" компанийн албан ёсны хиймэл оюун ухаант туслах.\n\n` +
        `=== Компанийн мэдээлэл ===\n${CONTACT_BLOCK}\n\n` +
        `=== Хэрэглэгчийн хүсэлт ===\n${userMessage || 'Тодорхойгүй'}\n\n` +
        `=== Олдсон бараа (${matchCount}) ===\n${contextText}${resultsInfo}\n\n` +
        `=== ДҮРЭМ ===\n` +
        `1. Зөвхөн дээрх өгөгдөл дээр үндэслэн хариул; та мэдээлэл зохиож болохгүй.\n` +
        `2. Хэрэглэгч НӨАТ-гүй үнэ асуусан бол "Үнэ (НӨАТ-гүй)" утгыг, онцгойлон дурдаагүй бол "Үнэ (НӨАТ-тэй)" утгыг ашигла.\n` +
        `3. МӨНГӨН ДҮН ФОРМАТЛАХ: Бүх мөнгөн дүнг ЗААВАЛ мянгатын таслал (,) бүхий, төгрөгийн тэмдэгттэй (₮) бич. Жишээ нь: 88000 → 88,000₮, 150000 → 150,000₮\n` +
        `4. Олон бараа олдсон бол хэрэглэгчид БҮГД барааг дараах МЭРГЭЖЛИЙН бүтэцтэйгээр жагсаа:\n\n` +
        `📦 Барааны мэдээлэл:\n` +
        `Нэр: <барааны нэр>\n` +
        `Код: <TOK код> | OEM: <OEM код>\n` +
        `Үнэ: <НӨАТ-тэй үнэ> (НӨАТ орсон)\n\n` +
        `5. Хэрэв олон үр дүн байвал эхний хуудсыг харуулж, "Нийт X бараа олдлоо. 1-50 харуулж байна. 'More' эсвэл 'Цааш' гэж бичвэл дараагийн хуудсыг харна." гэж мэдээлэл өг.\n` +
        `6. Хэрэв хэрэглэгч ерөнхий асуулт асуусан бол (жишээ нь "Priusni bara", "Priusni ymr bara bnve", "pruis 20", "pruis 20 bamper"), БҮГД олдсон барааг жагсаа. Дэлгэрэнгүй асуухыг бүү хүс.\n` +
        `7. БҮҮ "олдсонгүй" гэж хэл хэрэв ойролцоо таарах бараа байвал. Ойролцоо таарсан барааг харуул.\n` +
        `8. Хэрэв хэрэглэгчийн асуулт тийм ч тодорхойгүй бол (жишээ: "prius", "prius 20"), дараах санал болгоно:\n` +
        `   - Олдсон барааны ангиллууд: бампер, фар, толь, хөдөлгүүр гэх мэт\n` +
        `   - "Та ямар сэлбэг хайж байна вэ?" гэж асуугаарай\n` +
        `9. Холбоо барих мэдээлэл, цагийн хуваарь асуувал компанийн мэдээлэл хэсгийн өгөгдлийг ашигла.\n` +
        `10. Хариултын төгсгөлд холбоо барих мэдээлэл БИЕЭР БИТГИЙ нэмээрэй. Зөвхөн хэрэглэгч холбоо барих утас, дугаар, захиалах эсвэл хаяг асуусан тохиолдолд л "${CONTACT_LINE} ${CONTACT_FULL_TEXT} ${CONTACT_NUMBERS}" мэдээллийг өг.\n` +
        `11. Өөрийгөө "Japan Tok Mongolia"-ийн туслах гэж танилцуулж, найрсаг боловч мэргэжлийн хэв шинж хадгал.\n` +
        `12. TOK код, OEM кодыг зөвхөн мэдээлэл харуулахад ашигла. Хэрэглэгчээс код өгөхийг БҮҮ асуу - хэрэглэгчид код мэддэггүй.\n\n` +
        `=== Бичлэгийн засвар (Slang) ===\n` +
        `- "gpr/guper/gvr/bamper" → "бампер"\n` +
        `- "priusni/приусын/pius/prius/pruis/prus/p20/p30" → "Prius"\n` +
        `- "bnu/bn uu/baiga yu/baigaa yu" → "байна уу"\n` +
        `- "motor/hodolguur" → "хөдөлгүүр"\n` +
        `- "oem/kod/code" → "OEM код"\n` +
        `- "noatgui/no vat/padgui" → "нөат-гүй"\n`;
}

function buildContactSystemInstruction(userMessage = '') {
    return `Та бол "Japan Tok Mongolia" компанийн албан ёсны хиймэл оюун ухаант туслах.\n\n` +
        `=== Компанийн мэдээлэл ===\n${CONTACT_BLOCK}\n\n` +
        `=== Хэрэглэгчийн хүсэлт ===\n${userMessage}\n\n` +
        `=== ДҮРЭМ ===\n` +
        `1. Хэрэглэгч холбоо барих мэдээлэл асууж байна.\n` +
        `2. Найрсаг хэв маягаар, компанийн утас, хаяг, цагийн хуваарийг хүснэгт бус, бичвэр хэлбэрээр өг.\n` +
        `3. Утасны дугаарыг АЛБАН ЁСООР 99997571, 88105143 гэж бич.\n` +
        `4. Хаягийг бүрэн бичиж өг: Нарны зам дагуу Энхтайвны гүүрний баруун доод талд 200&570 авто сервисийн байр.\n` +
        `5. Цагийн хуваарь: Даваа-Баасан 09:00-21:00, Бямба/Ням амарна.\n` +
        `6. Мэргэжлийн боловч найрсаг хэв маяг хадгал. Өөрийгөө "Japan Tok Mongolia"-ийн туслах гэж танилцуул.\n` +
        `7. Дугаарыг бичихдээ ТУСАД НЬ бич: 99997571, 88105143\n`;
}

function buildConversationSystemInstruction(userMessage = '') {
    return `Та бол "Japan Tok Mongolia" компанийн албан ёсны хиймэл оюун ухаант туслах.\n\n` +
        `=== Компанийн мэдээлэл ===\n${CONTACT_BLOCK}\n\n` +
        `=== Хэрэглэгчийн хүсэлт ===\n${userMessage}\n\n` +
        `=== ДҮРЭМ ===\n` +
        `1. Та автомашины сэлбэг хэрэгсэл худалдаалах компанийн туслах.\n` +
        `2. Хэрэглэгчтэй найрсаг харилцаа үүсгэ, асуултад тодорхой хариул.\n` +
        `3. Хэрэв хэрэглэгч сэлбэг хайж байгаа бол нэр, код, загвар асуу.\n` +
        `4. Хэрэв хэрэглэгч компанийн тухай асуувал мэдээллийг өг.\n` +
        `5. Хэрэв хэрэглэгч холбоо барих утас, хаяг асуувал дээрх компанийн мэдээллийг ашиглан хариул.\n` +
        `6. Өөрийгөө "Japan Tok Mongolia"-ийн туслах гэж танилцуулж, найрсаг боловч мэргэжлийн хэв шинж хадгал.\n` +
        `7. Монгол хэл дээр бүрэн хариулна.\n`;
}

function buildContactResponse() {
    return `Сайн байна уу! 👋 Манай холбоо барих мэдээлэл:\n\n` +
        `📞 Утас: 99997571, 88105143\n\n` +
        `📍 Хаяг: Нарны зам дагуу Энхтайвны гүүрний баруун доод талд 200&570 авто сервисийн байр\n\n` +
        `🕒 Цагийн хуваарь: Даваа-Баасан 09:00-21:00, Бямба/Ням амарна\n\n` +
        `Та ямар нэгэн сэлбэг хайж байвал надад хэлээрэй!`;
}

function extractReplyText(data) {
    const candidate = data.candidates?.[0];
    if (!candidate?.content?.parts) return '';
    return candidate.content.parts
        .map((part) => part.text || '')
        .join('\n')
        .trim();
}

function buildFallbackResponse(shouldAddContact = false) {
    return ensureContactLine('Уучлаарай, түр зуурын алдаа гарлаа. Та дахин оролдоно уу.', shouldAddContact);
}

function buildNoMatchResponse(query, shouldAddContact = false) {
    const safeQuery = query?.trim() || '';
    
    // Check if it's a greeting or conversational phrase
    const isConversational = /сайн|байна|уу|танд|хэрэгтэй|юу|вэ|hello|hi/i.test(safeQuery);
    const availabilityQuestion = isAvailabilityQuestion(safeQuery);
    
    if (isConversational || availabilityQuestion || !safeQuery) {
        return ensureContactLine('Би танд туслахад бэлэн байна. Та хайж буй сэлбэгийн нэр эсвэл машины загвараа бичнэ үү. Жишээ нь: "Prius бампер", "Harrier хөдөлгүүр"', shouldAddContact);
    }
    
    // More helpful message for product searches that don't match
    return ensureContactLine(
        `Уучлаарай, "${safeQuery}" гэсэн хайлтад ойролцоо таарах бараа олдсонгүй.\n\n` +
        `💡 Зөвлөмж:\n` +
        `• Машины загвар болон сэлбэг нэрийг нэмж бичиж үзээрэй (жишээ: "Prius 20 бампер")\n` +
        `• Өөр нэр эсвэл загвараар хайж үзээрэй (жишээ: "Prius фар", "Harrier толь")\n` +
        `• TOK эсвэл OEM код мэдэж байвал кодоор хайж үзээрэй\n` +
        `• Утсаар холбогдоорой: 99997571, 88105143\n\n` +
        `Танд ямар сэлбэг хэрэгтэй байна вэ?`,
        shouldAddContact
    );
}

function normalizeUserMessage(text = '') {
    if (!text) return '';

    let normalized = text.toLowerCase();
    SLANG_RULES.forEach((rule) => {
        if (rule.pattern?.global) {
            rule.pattern.lastIndex = 0;
        }
    });
    // Apply slang rules to normalize common misspellings
    normalized = SLANG_RULES.reduce((acc, rule) => acc.replace(rule.pattern, rule.replace), normalized);

    // Only remove stopword phrases if they appear alone or at the start
    STOPWORD_PHRASES.forEach((phrase) => {
        // Remove phrase only if it's the entire message or at the start
        const regex = new RegExp(`^${phrase}\\s*|\\s+${phrase}$`, 'gi');
        normalized = normalized.replace(regex, ' ');
    });

    // Remove punctuation but keep alphanumeric
    normalized = normalized.replace(/[?.,!]/g, ' ');

    // Only filter out common stopwords, but be less aggressive
    const filtered = normalized
        .split(/\s+/)
        .filter(Boolean)
        .filter((token) => {
            // Keep the token if it's not in stopwords OR if it's longer than MIN_TOKEN_LENGTH
            // This prevents over-filtering
            return !STOPWORDS.has(token) || token.length >= MIN_TOKEN_LENGTH;
        });

    return filtered.join(' ');
}

function isAskingForContact(message = '') {
    if (!message) return false;
    const lower = message.toLowerCase();
    return CONTACT_KEYWORDS.some(keyword => lower.includes(keyword));
}

function isGreeting(message = '') {
    if (!message) return false;
    const lower = message.toLowerCase().trim();
    
    // Check for explicit greeting phrases first
    const greetingPhrases = [
        'сайн байна уу',
        'сайн уу',
        'байна уу',
        'snu',
        'sainuu',
        'sain uu',
        'hello',
        'hi'
    ];
    
    // If message matches a greeting phrase exactly or closely, it's a greeting
    if (greetingPhrases.some(phrase => lower === phrase || lower.startsWith(phrase))) {
        return true;
    }
    
    // Check if message is very short (likely greeting)
    if (lower.length <= MAX_GREETING_LENGTH) {
        return GREETING_KEYWORDS.some(keyword => lower.includes(keyword));
    }
    
    return false;
}

function hasProductIntent(message = '') {
    if (!message) return false;
    const lower = message.toLowerCase();
    
    // Check for product-related keywords
    const hasProductKeyword = PRODUCT_KEYWORDS.some(keyword => lower.includes(keyword));
    
    // Check if message looks like a product code:
    // - Must have at least one letter AND one number
    // - Must be at least 4 characters (typical product codes are longer)
    // - Optionally contains hyphens or underscores (common in product codes)
    const productCodePattern = /\b[a-z0-9]{4,}[-_]?[a-z0-9]*\b/i;
    const looksLikeCode = productCodePattern.test(message) && /[a-z]/i.test(message) && /\d/.test(message);
    
    // Check for product search patterns like "X байна уу" or "X байгаа юу"
    const productSearchPattern = /(\w+)\s+(байна\s*уу|байгаа\s*юу)/i;
    const hasProductSearchPattern = productSearchPattern.test(message);
    
    return hasProductKeyword || looksLikeCode || hasProductSearchPattern;
}

/**
 * Detects availability-style questions (e.g., "bgaa yu", "baina uu") so we can
 * prompt for more detail instead of returning a hard "not found". This overlaps
 * with SLANG_RULES normalization on purpose to catch both raw and normalized
 * text.
 *
 * @param {string} message - User input to inspect.
 * @returns {boolean} True if the message is asking whether a part exists.
 */
function isAvailabilityQuestion(message = '') {
    if (!message) return false;
    const lower = message.toLowerCase();
    // Keep both Cyrillic phrasing and Latin slang so raw messages are caught even before normalization.
    return AVAILABILITY_PATTERNS.some((pattern) => pattern.test(lower));
}

function ensureContactLine(text = '', shouldAddContact = false) {
    const trimmed = (text || '').trim();
    if (!trimmed) {
        return shouldAddContact ? `${CONTACT_LINE} ${CONTACT_FULL_TEXT} ${CONTACT_NUMBERS}` : '';
    }

    const lower = trimmed.toLowerCase();
    const hasLine = lower.includes(CONTACT_LINE.toLowerCase()) || lower.includes('захиалах');
    const hasNumbers = lower.includes('99997571') && lower.includes('88105143');
    
    // If contact info is already in the text, return as is
    if (hasLine || hasNumbers) {
        return trimmed;
    }

    // Only add contact info if explicitly requested
    if (shouldAddContact) {
        return `${trimmed}\n\n${CONTACT_LINE} ${CONTACT_FULL_TEXT} ${CONTACT_NUMBERS}`;
    }

    return trimmed;
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
