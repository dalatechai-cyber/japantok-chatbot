// Japan Tok Mongolia Chatbot Widget
// Drop this script tag into any website:
// <script async src="https://japantok-chatbot.vercel.app/widget.js"></script>

(function() {
    const currentScript = document.currentScript;
    const scriptOrigin = currentScript ? new URL(currentScript.src).origin : window.location.origin;

    // Configuration
    const WIDGET_CONFIG = {
        apiUrl: scriptOrigin, // Calls the same origin that serves widget.js
        title: 'Japan Tok Mongolia',
        subtitle: 'Tuslah',
        logoUrl: '/logo.png',
        icon: '💬'
    };

    // Create widget styles (Original Full CSS)
    const styles = `
        .japantok-widget-button {
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 60px;
            height: 60px;
            background: linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%);
            border: none;
            border-radius: 50%;
            cursor: pointer;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 28px;
            z-index: 999;
            transition: all 0.3s ease;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            color: white;
        }

        .japantok-widget-button:hover {
            transform: scale(1.1);
            box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
        }

        .japantok-widget-button.open {
            transform: rotate(45deg);
        }

        .japantok-widget-container {
            position: fixed;
            bottom: 90px;
            right: 20px;
            width: 400px;
            height: 600px;
            background: white;
            border-radius: 12px;
            box-shadow: 0 5px 40px rgba(0, 0, 0, 0.16);
            display: none;
            flex-direction: column;
            z-index: 998;
            overflow: hidden;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            animation: slideUp 0.3s ease;
        }

        .japantok-widget-container.open {
            display: flex;
        }

        @keyframes slideUp {
            from {
                opacity: 0;
                transform: translateY(20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        .japantok-widget-header {
            background: linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%);
            color: white;
            padding: 20px;
            border-radius: 12px 12px 0 0;
        }

        .japantok-widget-header h3 {
            margin: 0;
            font-size: 16px;
            font-weight: 600;
        }

        .japantok-widget-header p {
            margin: 4px 0 0 0;
            font-size: 12px;
            opacity: 0.9;
        }

        .japantok-widget-messages {
            flex: 1;
            overflow-y: auto;
            padding: 16px;
            background: #f7f7f7;
            display: flex;
            flex-direction: column;
            gap: 12px;
        }

        .japantok-widget-message {
            display: flex;
            animation: fadeIn 0.3s ease;
        }

        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }

        .japantok-widget-message.user {
            justify-content: flex-end;
        }

        .japantok-widget-message-content {
            max-width: 70%;
            padding: 10px 14px;
            border-radius: 12px;
            font-size: 14px;
            line-height: 1.4;
            word-wrap: break-word;
        }

        .japantok-widget-message.bot .japantok-widget-message-content {
            background: white;
            color: #333;
            border: 1px solid #e5e7eb;
            border-top-left-radius: 2px;
        }

        .japantok-widget-message.user .japantok-widget-message-content {
            background: #1e40af;
            color: white;
            border-radius: 12px 12px 2px 12px;
        }

        .japantok-widget-typing {
            display: flex;
            gap: 4px;
            padding: 10px 14px;
            background: white;
            border-radius: 12px;
            border: 1px solid #e5e7eb;
            width: fit-content;
        }

        .japantok-widget-typing-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: #999;
            animation: typing 1.4s infinite;
        }

        .japantok-widget-typing-dot:nth-child(2) {
            animation-delay: 0.2s;
        }

        .japantok-widget-typing-dot:nth-child(3) {
            animation-delay: 0.4s;
        }

        @keyframes typing {
            0%, 60%, 100% { opacity: 0.3; transform: translateY(0); }
            30% { opacity: 1; transform: translateY(-8px); }
        }

        .japantok-widget-input-area {
            padding: 16px;
            border-top: 1px solid #e5e7eb;
            background: white;
            display: flex;
            gap: 8px;
        }

        .japantok-widget-input {
            flex: 1;
            padding: 10px 14px;
            border: 1px solid #e5e7eb;
            border-radius: 20px;
            font-size: 14px;
            outline: none;
            transition: border-color 0.2s;
        }

        .japantok-widget-input:focus {
            border-color: #1e40af;
        }

        .japantok-widget-send-btn {
            width: 36px;
            height: 36px;
            border: none;
            border-radius: 50%;
            background: #1e40af;
            color: white;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: background 0.2s;
        }

        .japantok-widget-send-btn:hover:not(:disabled) {
            background: #1e3a8a;
        }

        .japantok-widget-send-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }

        @media (max-width: 480px) {
            .japantok-widget-container {
                width: calc(100% - 32px);
                height: 70vh;
                bottom: 90px;
                right: 16px;
            }
        }

        .japantok-widget-overlay {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.2);
            z-index: 997;
        }

        .japantok-widget-overlay.open {
            display: block;
        }
    `;

    // Create widget HTML
    const html = `
        <style>${styles}</style>
        <div class="japantok-widget-overlay" id="japantok-overlay"></div>
        <button class="japantok-widget-button" id="japantok-toggle" title="Chat with us">
            ${WIDGET_CONFIG.icon}
        </button>
        <div class="japantok-widget-container" id="japantok-container">
            <div class="japantok-widget-header">
                <h3>${WIDGET_CONFIG.title}</h3>
                <p>${WIDGET_CONFIG.subtitle}</p>
            </div>
            <div class="japantok-widget-messages" id="japantok-messages">
                <div class="japantok-widget-message bot">
                    <div class="japantok-widget-message-content">
                        Сайн байна уу? <strong>Japan Tok Mongolia</strong> цахим туслахад тавтай морил.<br>Танд ямар сэлбэг хэрэгтэй байна вэ?
                    </div>
                </div>
            </div>
            <div class="japantok-widget-input-area">
                <input 
                    type="text" 
                    class="japantok-widget-input" 
                    id="japantok-input" 
                    placeholder="Ачаалж байна..."
                    disabled
                >
                <button class="japantok-widget-send-btn" id="japantok-send" disabled>
                    ➤
                </button>
            </div>
        </div>
    `;

    // Initialize widget
    function init() {
        // Inject widget markup once
        document.body.insertAdjacentHTML('beforeend', html);

        // Get elements
        const toggleBtn = document.getElementById('japantok-toggle');
        const chatContainer = document.getElementById('japantok-container');
        const overlay = document.getElementById('japantok-overlay');
        const messagesDiv = document.getElementById('japantok-messages');
        const input = document.getElementById('japantok-input');
        const sendBtn = document.getElementById('japantok-send');
        let chatHistory = [];
        let isLoading = false;

        const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

        async function retry(operation, { retries = 2, delay = 400 } = {}) {
            let attempt = 0;
            while (true) {
                try {
                    return await operation(attempt);
                } catch (error) {
                    if (attempt >= retries) throw error;
                    await sleep(delay * (attempt + 1));
                    attempt += 1;
                }
            }
        }

        // Toggle chat
        function toggleChat() {
            chatContainer.classList.toggle('open');
            overlay.classList.toggle('open');
            toggleBtn.classList.toggle('open');
            if (chatContainer.classList.contains('open')) {
                input.focus();
            }
        }

        toggleBtn.addEventListener('click', toggleChat);
        overlay.addEventListener('click', toggleChat);

        async function loadSheetData() {
            try {
                const json = await retry(async () => {
                    const response = await fetch(`${WIDGET_CONFIG.apiUrl}/api/sheet`);
                    if (!response.ok) throw new Error(`Failed to load data (${response.status})`);
                    return response.json();
                });
                const rowCount = Number(json.count || 0);
                if (!Number.isFinite(rowCount) || rowCount <= 0) {
                    throw new Error('Inventory response empty');
                }

                console.log(`✅ Widget: API online, ${rowCount} products ready`);

                input.disabled = false;
                input.placeholder = "Бичээд хайгаарай...";
                sendBtn.disabled = false;
            } catch (error) {
                console.error('Error loading sheet data:', error);
                addMessage('Өгөгдөл ачаалах алдаа гарлаа. Дахин оролдоно уу.', 'bot');
                input.placeholder = "Алдаа гарлаа";
            }
        }

        // Add message to chat
        function addMessage(text, sender) {
            const msgDiv = document.createElement('div');
            msgDiv.className = `japantok-widget-message ${sender}`;
            const content = document.createElement('div');
            content.className = 'japantok-widget-message-content';
            
            if (sender === 'bot') {
                content.innerHTML = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');
            } else {
                content.textContent = text;
            }
            
            msgDiv.appendChild(content);
            messagesDiv.appendChild(msgDiv);
            messagesDiv.scrollTop = messagesDiv.scrollHeight;
        }

        // Add typing indicator (Original animation)
        function addTyping() {
            const msgDiv = document.createElement('div');
            msgDiv.className = 'japantok-widget-message bot';
            msgDiv.id = 'japantok-typing';
            const typing = document.createElement('div');
            typing.className = 'japantok-widget-typing';
            typing.innerHTML = '<div class="japantok-widget-typing-dot"></div><div class="japantok-widget-typing-dot"></div><div class="japantok-widget-typing-dot"></div>';
            msgDiv.appendChild(typing);
            messagesDiv.appendChild(msgDiv);
            messagesDiv.scrollTop = messagesDiv.scrollHeight;
        }

        function removeTyping() {
            const typing = document.getElementById('japantok-typing');
            if (typing) typing.remove();
        }

        async function sendMessage() {
            const text = input.value.trim();
            if (!text || isLoading) return;

            addMessage(text, 'user');
            input.value = '';
            input.disabled = true;
            sendBtn.disabled = true;
            isLoading = true;

            addTyping();

            try {
                const data = await retry(async () => {
                    const response = await fetch(`${WIDGET_CONFIG.apiUrl}/api/chat`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            message: text,
                            history: chatHistory.map((entry) => ({
                                role: entry.role === 'model' ? 'assistant' : entry.role,
                                content: entry.parts?.map((part) => part.text).join('\n')
                            }))
                        })
                    });

                    const json = await response.json();
                    if (!response.ok) throw new Error(json.error || 'API error');
                    if (!json.reply) throw new Error('Empty response');
                    return json;
                });
                removeTyping();

                if (data.reply) {
                    addMessage(data.reply, 'bot');
                    renderMatches(data.matches);
                    chatHistory.push(
                        { role: 'user', parts: [{ text }] },
                        { role: 'model', parts: [{ text: data.reply }] }
                    );
                    if (chatHistory.length > 10) chatHistory = chatHistory.slice(-10);
                } else {
                    removeTyping();
                    addMessage('Уучлаарай, хариулт авах алдаа гарлаа.', 'bot');
                }
            } catch (error) {
                removeTyping();
                console.error('Error:', error);
                addMessage('Уучлаарай, системд алдаа гарлаа. Дахин оролдоно уу.', 'bot');
            } finally {
                input.disabled = false;
                sendBtn.disabled = false;
                isLoading = false;
                input.focus();
            }
        }

        function escapeHtml(value = '') {
            return value.replace(/[&<>"']/g, (char) => ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#39;'
            })[char] || char);
        }

        function renderMatches(matches = []) {
            if (!matches?.length) return;
            const summary = matches
                .map((match) => {
                    const parts = [];
                    if (match.title) parts.push(`• ${escapeHtml(match.title)}`);
                    if (match.tokCode) parts.push(`TOK: ${escapeHtml(match.tokCode)}`);
                    if (match.wholesaleWithVat) parts.push(`Үнэ: ${escapeHtml(match.wholesaleWithVat)}`);
                    return parts.join(' | ');
                })
                .filter(Boolean)
                .join('\n');

            if (summary) {
                addMessage(`\n<i>Хариулт баталгаажсан өгөгдөл:</i>\n${summary}`, 'bot');
            }
        }

        // Event listeners
        sendBtn.addEventListener('click', sendMessage);
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });

        // Load data on init
        loadSheetData();
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
