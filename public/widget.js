// Japan Tok Mongolia Chatbot Widget
// Drop this script tag into any website:
// <script async src="https://japantok-chatbot.vercel.app/widget.js"></script>

(function() {
    const currentScript = document.currentScript;
    const scriptOrigin = currentScript ? new URL(currentScript.src).origin : window.location.origin;

    // Configuration
    const WIDGET_CONFIG = {
        apiUrl: scriptOrigin,
        title: 'Japan Tok Mongolia',
        subtitle: 'Цахим туслах', // Changed "Tuslah" to Cyrillic for consistency
        logoUrl: './logo.png', // Changed /logo.png to ./logo.png to fix 404
        icon: '💬'
    };

    // Create widget styles
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
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .japantok-header-info h3 {
            margin: 0;
            font-size: 16px;
            font-weight: 600;
        }

        .japantok-header-info p {
            margin: 4px 0 0 0;
            font-size: 12px;
            opacity: 0.9;
        }

        /* New Badge Style */
        .japantok-header-badge {
            background: rgba(255, 255, 255, 0.2);
            padding: 4px 10px;
            border-radius: 20px;
            font-size: 11px;
            font-weight: 500;
            border: 1px solid rgba(255,255,255,0.3);
            white-space: nowrap;
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
            max-width: 85%; /* Widened slightly for better list display */
            padding: 10px 14px;
            border-radius: 12px;
            font-size: 14px;
            line-height: 1.5;
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
    // Updated Greeting and Header Structure
    const html = `
        <style>${styles}</style>
        <div class="japantok-widget-overlay" id="japantok-overlay"></div>
        <button class="japantok-widget-button" id="japantok-toggle" title="Chat with us">
            ${WIDGET_CONFIG.icon}
        </button>
        <div class="japantok-widget-container" id="japantok-container">
            <div class="japantok-widget-header">
                <div class="japantok-header-info">
                    <h3>${WIDGET_CONFIG.title}</h3>
                    <p>${WIDGET_CONFIG.subtitle}</p>
                </div>
                <div class="japantok-header-badge">
                    ✅ 226 Бараа
                </div>
            </div>
            <div class="japantok-widget-messages" id="japantok-messages">
                <div class="japantok-widget-message bot">
                    <div class="japantok-widget-message-content">
                        Сайн байна уу? Japan Tok Mongolia цахим туслахад тавтай морил.<br><br>Танд ямар сэлбэг хэрэгтэй байна вэ?
                    </div>
                </div>
            </div>
            <div class="japantok-widget-input-area">
                <input 
                    type="text" 
                    class="japantok-widget-input" 
                    id="japantok-input" 
                    placeholder="Код, OEM эсвэл нэр..."
                >
                <button class="japantok-widget-send-btn" id="japantok-send">
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

        // Load chat history from localStorage
        function loadChatHistory() {
            try {
                const saved = localStorage.getItem('japantok-chat-history');
                if (saved) {
                    chatHistory = JSON.parse(saved);
                }
            } catch (e) {
                console.error('Failed to load chat history:', e);
            }
        }

        // Save chat history to localStorage
        function saveChatHistory() {
            try {
                localStorage.setItem('japantok-chat-history', JSON.stringify(chatHistory));
            } catch (e) {
                console.error('Failed to save chat history:', e);
            }
        }

        // Load chat messages from localStorage
        function loadChatMessages() {
            try {
                const saved = localStorage.getItem('japantok-chat-messages');
                if (saved) {
                    const messages = JSON.parse(saved);
                    messages.forEach(msg => {
                        addMessage(msg.text, msg.sender, false);
                    });
                }
            } catch (e) {
                console.error('Failed to load chat messages:', e);
            }
        }

        // Save chat messages to localStorage
        function saveChatMessages() {
            try {
                const messages = Array.from(messagesDiv.querySelectorAll('.japantok-widget-message:not(#japantok-typing)'))
                    .map(msgDiv => {
                        const isUser = msgDiv.classList.contains('user');
                        const content = msgDiv.querySelector('.japantok-widget-message-content');
                        if (!content) return null; // Skip if content not found
                        return {
                            text: isUser ? content.textContent : content.innerHTML,
                            sender: isUser ? 'user' : 'bot'
                        };
                    })
                    .filter(msg => msg !== null); // Remove null entries
                localStorage.setItem('japantok-chat-messages', JSON.stringify(messages));
            } catch (e) {
                console.error('Failed to save chat messages:', e);
            }
        }

        // Initialize chat history and messages
        loadChatHistory();
        
        // Check if we have saved messages, if so, clear the default welcome message
        try {
            const savedMessages = localStorage.getItem('japantok-chat-messages');
            if (savedMessages) {
                const parsedMessages = JSON.parse(savedMessages);
                if (Array.isArray(parsedMessages) && parsedMessages.length > 0) {
                    // Clear the default welcome message
                    messagesDiv.innerHTML = '';
                    loadChatMessages();
                }
            }
        } catch (e) {
            console.error('Failed to check saved messages:', e);
        }

        // Load widget open state from localStorage
        function loadWidgetState() {
            try {
                const isOpen = localStorage.getItem('japantok-widget-open');
                if (isOpen === 'true') {
                    chatContainer.classList.add('open');
                    overlay.classList.add('open');
                    toggleBtn.classList.add('open');
                }
            } catch (e) {
                console.error('Failed to load widget state:', e);
            }
        }

        // Save widget open state to localStorage
        function saveWidgetState(isOpen) {
            try {
                localStorage.setItem('japantok-widget-open', isOpen ? 'true' : 'false');
            } catch (e) {
                console.error('Failed to save widget state:', e);
            }
        }

        // Toggle chat
        function toggleChat() {
            chatContainer.classList.toggle('open');
            overlay.classList.toggle('open');
            toggleBtn.classList.toggle('open');
            const isOpen = chatContainer.classList.contains('open');
            saveWidgetState(isOpen);
            if (isOpen) {
                input.focus();
            }
        }

        toggleBtn.addEventListener('click', toggleChat);
        overlay.addEventListener('click', toggleChat);

        // Restore widget state on page load
        loadWidgetState();


        // Add message to chat
        function addMessage(text, sender, shouldSave = true) {
            const msgDiv = document.createElement('div');
            msgDiv.className = `japantok-widget-message ${sender}`;
            const content = document.createElement('div');
            content.className = 'japantok-widget-message-content';
            
            if (sender === 'bot') {
                // Allow HTML for bot messages to support bold/breaks
                content.innerHTML = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');
            } else {
                content.textContent = text;
            }
            
            msgDiv.appendChild(content);
            messagesDiv.appendChild(msgDiv);
            messagesDiv.scrollTop = messagesDiv.scrollHeight;
            
            // Save messages to localStorage
            if (shouldSave) {
                saveChatMessages();
            }
        }

        // Add typing indicator
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

        function formatMatches(matches = []) {
            const list = matches
                .slice(0, 3)
                .map((match, index) => {
                    const label = match.name || match.model || 'Нэр тодорхойгүй';
                    const code = match.tokCode || match.oemCode || 'код байхгүй';
                    // Basic fallback formatting if currency formatter isn't available in widget scope
                    const price = match.priceWithVat 
                        ? parseInt(match.priceWithVat).toLocaleString() + '₮'
                        : 'Үнэ тодорхойгүй';
                        
                    return `${index + 1}. ${label} (${code}) - <b>${price}</b>`;
                })
                .join('\n');

            if (!list) return '';
            return `📦 Илэрсэн бараа:\n${list}`;
        }

        // Send the message to the secure server API
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
                // Using relative path to avoid CORS/404 issues on same domain
                const response = await fetch(`${WIDGET_CONFIG.apiUrl}/api/chat`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        message: text,
                        history: chatHistory
                    })
                });

                const data = await response.json();
                if (!response.ok) {
                    throw new Error(data.error || 'AI сервер алдаа өглөө');
                }

                const reply = data.reply || 'Уучлаарай, одоогоор хариу өгөх боломжгүй байна.';
                addMessage(reply, 'bot');

                // If matches are returned separately, show them
                if (Array.isArray(data.matches) && data.matches.length) {
                    const matchesText = formatMatches(data.matches);
                    if (matchesText) {
                        addMessage(matchesText, 'bot');
                    }
                }

                chatHistory.push(
                    { role: 'user', content: text },
                    { role: 'assistant', content: reply }
                );
                if (chatHistory.length > 10) {
                    chatHistory = chatHistory.slice(-10);
                }
                
                // Save chat history to localStorage
                saveChatHistory();
            } catch (error) {
                console.error('Error:', error);
                addMessage(error.message || 'Уучлаарай, системд алдаа гарлаа. Дахин оролдоно уу.', 'bot');
            } finally {
                removeTyping();
                input.disabled = false;
                sendBtn.disabled = false;
                isLoading = false;
                input.focus();
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
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
