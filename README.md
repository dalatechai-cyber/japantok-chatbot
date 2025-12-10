# Japan Tok Mongolia Chatbot

AI-powered customer support chatbot for auto parts, powered by Google Gemini.

## Features

- 🤖 Google Gemini AI integration
- 📊 226 auto parts from Google Sheets
- 🇲🇳 Full Mongolian language support
- 💰 Smart pricing (with/without VAT)
- 📱 Mobile responsive
- 🔒 Secure backend API
- ⚡ Fast responses
- 24/7 availability

## Deployment

### Deploy to Vercel

1. **Push to GitHub**
```bash
git remote add origin https://github.com/YOUR_USERNAME/japantok-chatbot.git
git branch -M main
git push -u origin main
```

2. **Deploy**
   - Visit vercel.com → New Project
   - Select your repository
   - Add env vars:
     - `GEMINI_API_KEY` - Your API key
     - `GOOGLE_SHEET_URL` - Your sheet URL

3. **Done!** Your chatbot is live

### Embed as Widget

Add to any website:
```html
<script
  async
  src="https://your-url.vercel.app/widget.js"
  data-japantok-widget
  data-api-origin="https://your-url.vercel.app"
></script>
```

## Local Development

```bash
# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Run locally
npm install -g vercel
vercel dev
```

## API Endpoints

- `POST /api/chat` - Chat with Gemini
- `GET /api/sheet` - Get product data

## Configuration

Set these environment variables:
- `GEMINI_API_KEY` - Google Gemini API key
- `GOOGLE_SHEET_URL` - Google Sheet CSV export URL

## File Structure

```
├── index.html          - Main chatbot UI
├── widget.js           - Embeddable widget
├── api/
│   ├── chat.js        - Gemini API
│   └── sheet.js       - Sheet data fetching
├── vercel.json        - Vercel config
└── .env               - Environment variables
```

## Security

✅ API keys stored on Vercel (not in code)
✅ `.env` protected in `.gitignore`
✅ HTTPS enabled
✅ No personal data stored
✅ CORS configured

## Support

For issues, check the API logs or contact support.
