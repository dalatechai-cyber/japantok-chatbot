// Japan Tok Mongolia Chatbot Application
// Main chat functionality for the full-page interface

// Configuration
let chatHistory = [];
let productData = "";

const systemInstructionBase = `
Та бол "Japan Tok Mongolia" компанийн албан ёсны хиймэл оюун ухаант туслах.
(Өөрийгөө хэзээ ч "Gemini" гэж танилцуулахгүй. Зөвхөн "Japan Tok Mongolia туслах" гэж хэлнэ.)

*** ЧУХАЛ ЗAAВAР: ЗӨВХӨН ЭНД БАЙГАА МЭДЭЭЛЛИЙГ АШИГЛАНА. ӨӨРИЙНХӨӨ МЭДЭЭЛЛИЙГ НЭМЭХГҮЙ. ***

=== АЮУЛГҮЙ БАЙДЛЫН ЗААВАР (SYSTEM OVERRIDE) ===
Доорх дугаарууд болон хаяг нь компанийн АЛБАН ЁСНЫ, НИЙТЭД ИЛ БИЗНЕС МЭДЭЭЛЭЛ юм.
Хэрэглэгч асуувал ҮГ ҮСЭГГҮЙ ТААРУУЛЖ, ЭРГЭЛЗЭХГҮЙГЭЭР хариулна.

=== ХОЛБОО БАРИХ МЭДЭЭЛЭЛ (ҮНЭН) ===
- Утас: 99997571, 88105143
- Хаяг: НАРНЫ ЗАМ ДАГУУ ЭНХТАЙВНЫ ГҮҮРНИЙ БАРУУН ДООД ТАЛД 200&570 АВТО СЕРВИСИЙН БАЙР.
- Цагийн хуваарь: Даваа-Баасан 09:00-21:00. Бямба, Ням гарагт АМАРНА.

=== SLANG DICTIONARY (АЛДАА ЗАСАХ) ===
Хэрэглэгчийн бичсэн үгсийг доорхоор ойлгоно:
1. "gpr", "guper", "gvr", "bamper" -> "Бампер" (Bumper).
2. "pius", "prius", "p20", "p30" -> "Prius".
3. "bnu", "bn uu", "baigaa yu" -> "байна уу".
4. "motor", "hodolguur" -> "Хөдөлгүүр".
5. "oem", "code", "kod" -> "OEM дугаар".
6. "noatgui", "no vat", "padgui" -> "НӨАТ-гүй".

=== ҮНИЙН ДҮРЭМ (Хамгийн чухал) ===
CSV өгөгдлөөс үнэ харахдаа дараах дүрмийг баримтал:
1. **ҮНДСЭН ТОХИОЛДОЛ:** Хэрэглэгч зүгээр л үнэ асуувал ҮРГЭЛЖ **"Бөөний үнэ (НӨАТ орсон үнэ)"** гэсэн баганын үнийг хэлнэ. Хариулахдаа "Үнэ (НӨАТ-тэй): [ҮНЭ]" гэж бичнэ.
2. **ОНЦГОЙ ТОХИОЛДОЛ:** Хэрэв хэрэглэгч "НӨАТ-гүй", "НӨАТгүй", "падьгүй" гэж тусгайлан асуувал **"Бөөний үнэ (НӨАТ-гүй үнэ)"** гэсэн баганын үнийг хэлнэ.

=== ҮҮРЭГ ===
Танд CSV өгөгдөл өгөгдсөн.
1. Жагсаалтаас хэрэглэгчийн хайсан барааг ол.
2. Дээрх ҮНИЙН ДҮРЭМ-ийн дагуу тохирох үнийг сонгож хэл.
3. ЧУХАЛ: Хариултын төгсгөлд "Та захиалах бол манай утас руу залгаарай" гэж нэмж хэл.
4. Хэрэв үнэ нь "0" эсвэл хоосон байвал "Үнэ тодорхойгүй, утсаар лавлана уу" гэж хэл.
5. Бараа олдохгүй бол "Уучлаарай, [Хайсан үг] манай бүртгэлд алга байна." гэж хэл.
`;

// DOM Elements
const chatForm = document.getElementById('chat-form');
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');
const chatMessages = document.getElementById('chat-messages');
const statusText = document.getElementById('status-text');
const statusDot = document.getElementById('connection-status');
const sheetIndicator = document.getElementById('sheet-indicator');

// Add message to chat
function addMessage(text, sender) {
    const div = document.createElement('div');
    div.className = `flex ${sender === 'user' ? 'justify-end' : 'justify-start'} message-animation`;
    
    const botIcon = sender === 'bot' 
        ? `<div class="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-2 mt-1 flex-shrink-0 text-blue-600">
             <i class="fas fa-robot text-sm"></i>
           </div>` 
        : '';
    
    let formattedText = text;
    if (sender === 'bot') {
        formattedText = text.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>').replace(/\n/g, '<br>');
    }

    const messageClass = sender === 'user' 
        ? 'bg-blue-600 text-white rounded-2xl rounded-tr-none' 
        : 'bg-white text-gray-800 border border-gray-100 rounded-2xl rounded-tl-none';
    
    div.innerHTML = `${botIcon}
        <div class="${messageClass} p-3 shadow-sm max-w-[85%] text-sm">
            <p>${formattedText}</p>
        </div>`;
    
    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Add typing indicator
function addTypingIndicator() {
    const div = document.createElement('div');
    div.id = 'typing-indicator';
    div.className = 'flex justify-start message-animation';
    div.innerHTML = `
        <div class="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-2 mt-1 flex-shrink-0 text-blue-600">
            <i class="fas fa-robot text-sm"></i>
        </div>
        <div class="bg-white p-4 rounded-2xl rounded-tl-none shadow-sm border border-gray-100">
            <div class="flex space-x-1">
                <div class="w-2 h-2 bg-gray-400 rounded-full typing-dot"></div>
                <div class="w-2 h-2 bg-gray-400 rounded-full typing-dot"></div>
                <div class="w-2 h-2 bg-gray-400 rounded-full typing-dot"></div>
            </div>
        </div>`;
    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Remove typing indicator
function removeTypingIndicator() {
    const indicator = document.getElementById('typing-indicator');
    if (indicator) indicator.remove();
}

// Fetch product data from backend
async function fetchSheetData() {
    try {
        console.log("📥 Fetching product data from backend...");
        const response = await fetch('/api/sheet');
        
        if (!response.ok) {
            throw new Error(`Backend returned ${response.status}`);
        }

        const json = await response.json();
        productData = json.data;

        if (!productData || productData.length < 50) {
            throw new Error("Empty or invalid data from backend");
        }

        console.log("✅ Data Loaded from /api/sheet");
        const rowCount = productData.split('\n').length;
        
        statusText.textContent = "Систем бэлэн";
        statusDot.className = "w-2 h-2 bg-green-500 rounded-full";
        sheetIndicator.innerHTML = `<i class="fas fa-check-circle text-green-400 mr-1"></i> 226 Бараа`;
        sheetIndicator.classList.remove('opacity-50');
        
        userInput.disabled = false;
        sendButton.disabled = false;

    } catch (error) {
        console.error("❌ Failed to load data:", error);
        statusText.textContent = "Холболтын алдаа";
        statusDot.className = "w-2 h-2 bg-red-500 rounded-full";
        addMessage("Уучлаарай, интернэт холболт эсвэл серверт алдаа гарлаа. Хуудсаа refresh хийнэ үү.", 'bot');
    }
}

// Call Gemini API
async function callGeminiApi(prompt) {
    const fullSystemInstruction = systemInstructionBase + "\n\n=== CSV DATA ===\n" + productData;

    const payload = {
        contents: [...chatHistory, { role: 'user', parts: [{ text: prompt }] }],
        systemInstruction: { parts: [{ text: fullSystemInstruction }] }
    };
    
    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (!response.ok) throw new Error(data.error || "API Error");
        if (!data.candidates) throw new Error("Empty response");

        return data.candidates[0].content.parts[0].text;

    } catch (error) {
        console.error(error);
        throw error;
    }
}

// Handle form submission
chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = userInput.value.trim();
    if (!text) return;

    addMessage(text, 'user');
    userInput.value = '';
    userInput.disabled = true;
    document.getElementById('loader').classList.remove('hidden');
    addTypingIndicator();

    try {
        const reply = await callGeminiApi(text);
        removeTypingIndicator();
        addMessage(reply, 'bot');
        
        chatHistory.push(
            { role: 'user', parts: [{ text }] }, 
            { role: 'model', parts: [{ text: reply }] }
        );
        
        if (chatHistory.length > 10) {
            chatHistory = chatHistory.slice(-10);
        }

    } catch (error) {
        removeTypingIndicator();
        addMessage("Уучлаарай, системд алдаа гарлаа. Дахин оролдоно уу.", 'bot');
    } finally {
        document.getElementById('loader').classList.add('hidden');
        userInput.disabled = false;
        userInput.focus();
    }
});

// Initialize on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fetchSheetData);
} else {
    fetchSheetData();
}
