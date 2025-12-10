# 🤖 Japan Tok Mongolia Chatbot Widget Integration Guide

Your chatbot can be easily embedded into any website as a floating messenger-like widget.

## ⚡ Quick Start (30 seconds)

### Step 1: Get the Script URL
```html
<script async src="https://japantok-chatbot.vercel.app/widget.js"></script>
```

### Step 2: Add to Your Website
Paste this single line of code before the closing `</body>` tag on any page:

```html
<!DOCTYPE html>
<html>
<head>
    <title>Your Website</title>
</head>
<body>
    <!-- Your website content -->
    
    <!-- Add this line at the bottom -->
    <script async src="https://japantok-chatbot.vercel.app/widget.js"></script>
</body>
</html>
```

### Step 3: Done! 🎉
The chatbot widget will appear as a blue button in the bottom-right corner of your website.

---

## 📋 What the Widget Includes

- ✅ **Floating button** in bottom-right corner
- ✅ **Chat window** that slides up when clicked
- ✅ **Mongolian language support**
- ✅ **Mobile responsive** design
- ✅ **Auto-loads product data** from your Google Sheet
- ✅ **Instant responses** powered by Google Gemini
- ✅ **Contact information** automatically included in responses

---

## 🌐 Integration on Different Platforms

### HTML/Static Websites
```html
<script async src="https://japantok-chatbot.vercel.app/widget.js"></script>
```
Add anywhere before `</body>`

### WordPress
1. Go to Theme → Theme File Editor
2. Edit `footer.php`
3. Add the script tag before `<?php wp_footer(); ?>`

Alternatively, use a plugin like "Insert Headers and Footers":
1. Install & activate plugin
2. Paste the script in the footer section

### Shopify
1. Go to Settings → Checkout
2. Scroll to "Order status page" → Edit template
3. Add script in the additional scripts section

Or go to Theme → Edit Code:
1. Find `theme.liquid`
2. Add script before `</body>`

### React/Vue/Next.js
Create a component:
```jsx
import { useEffect } from 'react';

export default function ChatbotWidget() {
    useEffect(() => {
        const script = document.createElement('script');
        script.src = 'https://japantok-chatbot.vercel.app/widget.js';
        script.async = true;
        document.body.appendChild(script);
    }, []);
    
    return null; // Widget loads automatically
}

// Use in your app
<ChatbotWidget />
```

### Wix
Not directly supported (Wix has restrictions), but you can use a custom embed:
1. Add a Custom HTML element
2. Paste the script tag

---

## 🎨 How It Looks

The widget appears as:
- **Closed**: Blue circular button (💬) in bottom-right corner
- **Open**: Chat window with header, messages, and input field
- **Mobile**: Adapts to screen size, full width on small screens

Example user interaction:
```
User: "Prius үнэ хэд вэ?"
Bot:  "Prius-ийн үнэ (НӨАТ-тэй): 63,800₮
       Та захиалах бол манай утас руу залгаарай: 99997571, 88105143"
```

---

## 🔧 Customization

The widget comes pre-configured, but can be customized:

**Current Configuration:**
```javascript
WIDGET_CONFIG = {
    apiUrl: 'https://japantok-chatbot.vercel.app',
    position: 'bottom-right',
    theme: 'light',
    title: 'Japan Tok Mongolia',
    subtitle: 'Tuslah',
    icon: '💬'
}
```

To customize, contact support with your requirements.

---

## 📊 Data Source

The widget uses **Google Sheets** as the product database:
- **~311 auto parts** available
- **Real-time pricing** (updated hourly)
- **Search by model name** (Prius, Land Cruiser, etc.)
- **Search by OEM code** (TO-048/A, etc.)
- **Both VAT and non-VAT pricing**

When customers ask about products, the AI searches this database and provides accurate information.

---

## 💬 What Customers Can Ask

The chatbot understands:
- Product pricing questions ("Prius үнэ хэд вэ?")
- Model names (Prius, Land Cruiser, etc.)
- Slang terms (gpr → Бампер, motor → Хөдөлгүүр)
- VAT variations ("НӨАТ-гүй үнэ?")
- Part codes (OEM codes)

It automatically provides:
- Product price
- Price with/without VAT
- Contact information for orders
- Store hours and address

---

## 🔒 Security & Privacy

- ✅ **API keys are server-side** - never exposed to clients
- ✅ **No personal data stored** - conversations are temporary
- ✅ **HTTPS encrypted** - all data is encrypted in transit
- ✅ **No cookies** - no tracking or data collection
- ✅ **GDPR compliant** - minimal data usage

---

## 🐛 Troubleshooting

### Widget doesn't appear
- **Check 1**: Is the script tag correctly placed before `</body>`?
- **Check 2**: Are you on the right page? (Script must be on each page where you want it)
- **Check 3**: Is your website being served over HTTPS?
- **Check 4**: Check browser console (F12) for errors

### Button appears but chat doesn't open
- Clear browser cache
- Check browser console for JavaScript errors
- Ensure JavaScript is enabled

### Chat doesn't respond
- Check if the chatbot API is live (visit https://japantok-chatbot.vercel.app)
- Verify Google Sheet is accessible
- Check browser console for network errors

### Styling looks wrong
- Clear browser cache
- Try a different browser
- Check for CSS conflicts with your website

---

## 📱 Mobile Experience

The widget is fully responsive:
- **Desktop**: 400px × 600px chat window in corner
- **Tablet**: Adjusts to fit screen
- **Mobile**: Full width with proper spacing

Users can:
- Type with mobile keyboard
- Scroll chat history
- Send messages with Enter key

---

## 📞 Support & Contact

- **Demo**: https://japantok-chatbot.vercel.app
- **Integration Guide**: https://japantok-chatbot.vercel.app/widget-integration-guide.html
- **Email**: support@japantok.mn
- **Phone**: 99997571, 88105143
- **Hours**: Mon-Fri 09:00-21:00 (Mongolian Standard Time)

---

## 🎓 Advanced Integration

### Detect Widget Events
```javascript
window.japantokWidget = {
    onOpen: function() { console.log('Widget opened'); },
    onClose: function() { console.log('Widget closed'); },
    onMessage: function(msg) { console.log('User message:', msg); }
};
```

### Programmatic Control (Coming Soon)
```javascript
// Future API
JapantokWidget.open();
JapantokWidget.close();
JapantokWidget.sendMessage('Hello');
```

Contact us for these advanced features.

---

## 📈 Analytics (Optional)

Want to track widget usage? We can set up:
- Message count per day
- Popular questions
- Response times
- Conversion metrics

Contact support to enable analytics.

---

## 🚀 Deployment Checklist

- [ ] Widget URL is correct: `https://japantok-chatbot.vercel.app/widget.js`
- [ ] Script tag is placed before `</body>`
- [ ] Website is served over HTTPS
- [ ] Tested on desktop and mobile
- [ ] JavaScript is enabled in browser
- [ ] No CSS conflicts detected

---

## 📝 Example Integration Code

### Full HTML Template
```html
<!DOCTYPE html>
<html lang="mn">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Japan Tok Mongolia</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            padding: 20px;
        }
        h1 { color: #1e40af; }
    </style>
</head>
<body>
    <h1>Welcome to Japan Tok Mongolia</h1>
    <p>Click the chat button in the bottom-right corner to ask about our products!</p>
    
    <!-- Japan Tok Mongolia Chatbot Widget -->
    <script async src="https://japantok-chatbot.vercel.app/widget.js"></script>
</body>
</html>
```

---

## ✅ You're All Set!

Your website now has AI-powered customer support. Customers can ask about auto parts and get instant answers 24/7.

**Need help?** Contact support@japantok.mn or call 99997571
