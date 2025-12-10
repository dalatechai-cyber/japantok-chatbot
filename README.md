# Japan Tok Mongolia Chatbot

A Mongolian-language AI chatbot for Japan Tok Mongolia's auto parts business, powered by Google Gemini.

## Features

- 🤖 AI-powered product inquiries using Google Gemini
- 📊 Real-time product data from Google Sheets (~311 items)
- 🌐 Mongolian language support
- 💰 Automatic price formatting with/without VAT
- 📱 Mobile-responsive design
- 🔒 Secure backend API (Vercel serverless functions)

## Project Structure

```
.
├── index.html              # Frontend chatbot UI
├── package.json            # Dependencies
├── vercel.json             # Vercel deployment config
├── .env.example            # Environment variables template
├── .env                    # Actual environment variables (git ignored)
└── api/
    ├── chat.js             # Gemini API integration
    └── sheet.js            # Google Sheet data fetching
```

## Local Development

### Prerequisites
- Node.js 18+
- npm or yarn
- Google Gemini API Key
- Public Google Sheet with CSV export enabled

### Setup

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd japantok-chatbot
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**
```bash
cp .env.example .env
```

Edit `.env` and add:
```
GEMINI_API_KEY=your_gemini_api_key_here
GOOGLE_SHEET_URL=https://docs.google.com/spreadsheets/d/.../pub?output=csv
```

4. **Run locally with Vercel CLI**
```bash
npm install -g vercel
vercel dev
```

The chatbot will be available at `http://localhost:3000`

## Deployment to Vercel

### Step 1: Create GitHub Repository

```bash
git add .
git commit -m "Initial commit: Japan Tok Mongolia Chatbot"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/japantok-chatbot.git
git push -u origin main
```

### Step 2: Deploy to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Sign in with GitHub
3. Click "New Project"
4. Select your repository
5. Keep default settings, click "Deploy"

### Step 3: Add Environment Variables

1. In Vercel dashboard, go to your project → Settings → Environment Variables
2. Add:
   - `GEMINI_API_KEY` = Your actual API key
   - `GOOGLE_SHEET_URL` = Your Google Sheet CSV URL

3. Click "Save and Deploy"

The chatbot will automatically deploy and be live!

## API Endpoints

### `POST /api/chat`
Sends a user message to Gemini and returns the response.

**Request:**
```json
{
  "contents": [
    { "role": "user", "parts": [{ "text": "Prius үнэ хэд вэ?" }] }
  ],
  "systemInstruction": {
    "parts": [{ "text": "You are a helpful assistant..." }]
  }
}
```

**Response:**
```json
{
  "candidates": [
    {
      "content": {
        "parts": [{ "text": "Prius-ийн үнэ (НӨАТ-тэй): 63,800₮..." }]
      }
    }
  ]
}
```

### `GET /api/sheet`
Fetches product data from Google Sheets.

**Response:**
```json
{
  "data": "№,OEM дугаар,Ток код,Машины марк,...\n1,,TO-048/A,..."
}
```

## Configuration

### Slang Dictionary
The bot understands common typos and slang:
- gpr, guper, gvr, bamper → Бампер (Bumper)
- pius, prius, p20, p30 → Prius
- motor, hodolguur → Хөдөлгүүр (Engine)
- oem, code, kod → OEM дугаар
- noatgui, no vat, padgui → НӨАТ-гүй (Without VAT)

### Pricing Rules
1. **Default (with VAT):** "Бөөний үнэ (НӨАТ орсон үнэ)" column
2. **Without VAT:** If user asks for НӨАТ-гүй, uses "Бөөний үнэ (НӨАТ-гүй үнэ)" column

### Contact Information
- **Phone:** 99997571, 88105143
- **Address:** НАРНЫ ЗАМ ДАГУУ ЭНХТАЙВНЫ ГҮҮРНИЙ БАРУУН ДООД ТАЛД 200&570 АВТО СЕРВИСИЙН БАЙР
- **Hours:** Mon-Fri 09:00-21:00, Sat-Sun CLOSED

## Troubleshooting

### Google Sheet data not loading
- Ensure the Google Sheet is published with "Anyone with link can view" permissions
- Check that CSV export is enabled (pub?output=csv in URL)
- Verify `GOOGLE_SHEET_URL` environment variable is set

### API Key errors
- Verify `GEMINI_API_KEY` is valid and has appropriate permissions
- Check that the API is enabled in Google Cloud Console
- Ensure the key hasn't been rotated or revoked

### CORS errors
- Ensure API endpoints are deployed on Vercel
- Check that environment variables are set in Vercel dashboard
- Verify that the backend functions are responding

## Security Notes

⚠️ **Important:**
- Never commit `.env` file to Git (it's in `.gitignore`)
- Use Vercel's environment variables for sensitive data
- Regularly rotate API keys
- Monitor API usage for unexpected costs

## Future Enhancements

- [ ] Product image support
- [ ] Order placement integration
- [ ] Multi-language support
- [ ] Customer feedback system
- [ ] Analytics dashboard
- [ ] WhatsApp integration

## Support

For issues or questions about the Japan Tok Mongolia chatbot, contact the development team.

## License

Proprietary - Japan Tok Mongolia Co., Ltd.
