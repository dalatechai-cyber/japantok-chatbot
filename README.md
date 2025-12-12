# Japan Tok Mongolia AI Chatbot

Professional AI-powered customer support chatbot for auto parts, integrated with Google Sheets inventory and powered by Google Gemini AI.

## Features

- 🤖 **Google Gemini AI Integration** - Advanced natural language understanding
- 📊 **Real-time Inventory** - Syncs with Google Sheets (226 products)
- 🇲🇳 **Mongolian Language Support** - Full native language support
- 💰 **Smart Pricing** - Automatic VAT calculations and display
- 📱 **Responsive Design** - Mobile and desktop optimized
- 🔒 **Secure Backend** - API keys protected, CORS enabled
- ⚡ **Fast Performance** - Caching and optimized queries
- 🌐 **Easy Embedding** - Widget for any website
- 🔍 **Fuzzy Search** - Handles typos and spelling variations (e.g., "pruis" → "prius", "bamper" → "bumper")
- 📄 **Pagination Support** - Browse through large result sets with "more" command
- 🎯 **Smart Intent Detection** - Distinguishes between broad model queries and specific part searches
- 📦 **Category Grouping** - Automatically suggests product categories for broad queries
- ♾️ **Unlimited Recall** - Shows all matching products, not just top results

## Quick Start

### 1. Local Development

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/japantok-chatbot.git
cd japantok-chatbot

# Install dependencies
npm install

# Create environment file
cp .env.example .env
# Edit .env with your API keys

# Run locally with Vercel CLI
npm install -g vercel
vercel dev
```

### 2. Deploy to Vercel

1. **Push to GitHub**
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/japantok-chatbot.git
   git branch -M main
   git push -u origin main
   ```

2. **Deploy on Vercel**
   - Visit [vercel.com](https://vercel.com)
   - Sign in with GitHub
   - Click "New Project"
   - Select your repository
   - Click "Deploy"

3. **Configure Environment Variables**
   - Go to Project Settings → Environment Variables
   - Add the following:
     - `GEMINI_API_KEY` - Get from [Google AI Studio](https://aistudio.google.com/app/apikeys)
     - `GOOGLE_SHEET_URL` - Your Google Sheet CSV export URL
   - Redeploy from Deployments tab

4. **Done!** Your chatbot is live at `https://your-project.vercel.app`

## Embedding as Widget

Add this script to any website to embed the chatbot as a popup widget:

```html
<script
  async
  src="https://your-project.vercel.app/widget.js"
  data-japantok-widget
  data-api-origin="https://your-project.vercel.app"
></script>
```

The chatbot button will appear in the bottom-right corner.

## Project Structure

```
japantok-chatbot/
├── api/
│   ├── chat.js           # AI chat endpoint
│   └── sheet.js          # Product data endpoint
├── lib/
│   ├── cors.js           # CORS configuration
│   ├── logger.js         # Logging utilities
│   └── products.js       # Product search & formatting
├── public/
│   ├── index.html        # Main chatbot interface
│   ├── app.js            # Frontend application logic
│   ├── custom.css        # Custom styles
│   └── widget.js         # Embeddable widget
├── .env.example          # Environment variables template
├── package.json          # Dependencies
└── vercel.json           # Vercel configuration
```

## API Endpoints

### POST `/api/chat`
Chat with the AI assistant.

**Request:**
```json
{
  "message": "pruis 20 bamper",
  "history": []
}
```

**Response:**
```json
{
  "reply": "Here are Prius 20 bumper options...",
  "matches": [...],
  "categories": ["Бампер (Bumper)", "Фар (Headlight)"],
  "totalMatches": 132,
  "currentPage": 1,
  "totalPages": 3,
  "hasMore": true,
  "candidates": [...]
}
```

**Pagination:**
To get more results, send "more" or "цааш" in the message:
```json
{
  "message": "more",
  "history": [...]
}
```

### GET `/api/sheet`
Fetch product data from Google Sheets.

**Response:**
```json
{
  "data": "CSV formatted product data..."
}
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GEMINI_API_KEY` | Yes | Google Gemini API key |
| `GOOGLE_SHEET_URL` | Yes | Google Sheet CSV export URL |
| `ALLOWED_ORIGINS` | No | Comma-separated CORS origins |
| `LOG_WEBHOOK_URL` | No | Webhook for logging |
| `PRODUCT_CACHE_MS` | No | Cache duration (default: 300000ms) |

## Google Sheet Setup

1. Create a Google Sheet with your products
2. Include columns: 
   - Барааны нэр (Product Name)
   - TOK код (TOK Code)
   - OEM код (OEM Code)
   - Машин загвар (Model)
   - Үнэ (НӨАТ-тэй) (Price with VAT)
   - Үнэ (НӨАТ-гүй) (Price without VAT)
   - Нөөц (Stock)
3. Publish: File → Share → Publish to web → CSV
4. Copy the CSV URL to your `.env` file

## Search Capabilities

### Fuzzy Matching
The chatbot uses advanced fuzzy search with Levenshtein distance to handle typos and variations:
- **Typos**: "pruis" → "prius", "bamper" → "bumper"
- **Variations**: "priusni", "приус", "p20" all match "Prius"
- **Edit Distance**: Allows up to 2 character differences for tokens ≥3 characters

### Query Types

#### 1. Broad Model Queries
When asking about a model without specifying parts:
```
User: "prius 20"
Bot: Shows category overview (bumpers, headlights, mirrors, etc.) 
     and asks "What part do you need?"
```

#### 2. Specific Part Queries  
When asking about specific parts:
```
User: "pruis 20 bamper" (with typos)
Bot: Shows ALL matching bumpers for Prius 20
     "Found 15 bumpers. Showing 1-15. Which side (front/rear)?"
```

#### 3. Pagination
For large result sets:
```
Bot: "Found 132 items. Showing 1-50. Say 'more' for next page."
User: "more"
Bot: Shows items 51-100
```

### Supported Synonyms
- **Bumper**: бампер, bamper, gpr, guper, gvr
- **Engine**: хөдөлгүүр, мотор, motor, hodolguur
- **Mirror**: толь, зөөгч толь, мирор
- **Headlight**: фар, headlamp, lamp
- **Hood**: капот, hood panel

## Security

✅ API keys stored securely in environment variables  
✅ `.env` excluded from version control  
✅ HTTPS enforced on Vercel  
✅ CORS configured for specific origins  
✅ No sensitive data in client-side code  

## Updating Your Deployment

```bash
# Make your changes
git add .
git commit -m "Your update message"
git push origin main
# Vercel automatically redeploys
```

## Support & Contact

For issues or questions:
- Create an issue in this repository
- Contact: 99997571, 88105143
- Address: Нарны зам дагуу Энхтайвны гүүрний баруун доод талд 200&570 авто сервисийн байр

## License

This project is private and proprietary to Japan Tok Mongolia.

