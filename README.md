# Japan Tok Mongolia Chatbot

AI-powered customer support assistant for auto parts. The system serves a full-screen client (`public/index.html`), an embeddable widget (`public/widget.js`), and Vercel serverless APIs backed by Google Sheets and Google Gemini.

## Key Features
- 🤖 Gemini-powered natural-language answers constrained to catalog data
- 📊 Server-side CSV ingestion, scoring, and caching (`lib/products.js`)
- 🛡️ Locked-down CORS and structured logging with optional webhook fan-out
- 🧩 Embeddable widget that auto-detects origin and surfaces matched products
- 📈 Health-check endpoint + retry-aware clients for better uptime

## Environment Variables
| Name | Required | Description |
| --- | --- | --- |
| `GEMINI_API_KEY` | ✅ | Google Gemini API key for `/api/chat`. |
| `GOOGLE_SHEET_URL` | ✅ | Published CSV export URL of the catalog sheet. |
| `ALLOWED_ORIGINS` | ✅ (prod) | Comma-separated origins that may call the APIs (e.g. `https://japantok.mn,https://app.partner.mn`). Leave unset only for local development. |
| `LOG_WEBHOOK_URL` | ⚙️ | Optional HTTPS endpoint for durable chat logs; if unset the app logs to console only. |

## Logging & Data Retention
- Each chat request is logged via `lib/logger.js`, containing the prompt, reply, matched product IDs, and latency.
- When `LOG_WEBHOOK_URL` is defined, payloads are POSTed to that webhook; otherwise the logger emits to stdout and warns once.
- Store webhook payloads for **≤30 days**, restrict access to support/ops staff, and redact any PII before persisting.
- Document downstream retention in your SOC/DSA records so customers know how long transcripts live.

## Local Development
```bash
npm install
# create .env.local and add the variables above
npm run build:css
vercel dev
```

## Pre-Deploy Checklist
1. Export/update secrets in your hosting provider (`GEMINI_API_KEY`, `GOOGLE_SHEET_URL`, `ALLOWED_ORIGINS`, `LOG_WEBHOOK_URL`).
2. Run `npm run predeploy` (executes the Tailwind build + environment checks via `scripts/predeploy.mjs`).
3. Optional smoke tests:
  - `curl -s https://<deployment>/api/sheet`
  - `curl -s https://<deployment>/api/chat -H 'Content-Type: application/json' -d '{"message":"Prius battery"}'`

## Monitoring & Uptime
- Use the new `GET /api/health` endpoint for uptime monitors (Better Stack, UptimeRobot, Pingdom, etc.).
- Configure alerts for non-200 responses or latency spikes >2000 ms.
- Both frontend clients retry `/api/sheet` and `/api/chat` twice before surfacing an error, reducing transient-impact for end users.

## Embedding
- Full-screen UI: serve `public/index.html` directly (Vercel static).
- Widget: `<script async src="https://<deployment>/widget.js"></script>`; it auto-detects origin and reuses the same API + logging stack.
- Both surfaces display the product matches returned by `/api/chat` so users can see which catalog entries informed the answer.

## API Surface
- `POST /api/chat` – Filters catalog rows server-side, builds a strict Gemini prompt, logs the interaction, and returns `{ reply, matches }`.
- `GET /api/sheet` – Summaries for UI counters (optionally `?full=1` for sanitized rows).
- `GET /api/health` – Lightweight health probe (latency + product count).

## File Map
```
├── public/index.html      # Main UI
├── public/widget.js       # Embeddable widget
├── public/styles.css      # Built Tailwind output (npm run build:css)
├── api/chat.js            # Gemini gateway with logging + filtering
├── api/sheet.js           # Sheet summaries
├── api/health.js          # Health probe for monitors
├── lib/products.js        # CSV ingestion, normalization, scoring
├── lib/logger.js          # Console/webhook logging helper
├── lib/cors.js            # Shared CORS whitelist helper
└── scripts/predeploy.mjs  # Pre-deploy checks
```

## Security Notes
- Secrets live in env vars; repo never stores API keys.
- `ALLOWED_ORIGINS` locks serverless endpoints to trusted hosts.
- No personal data is stored by default; ensure downstream logging complies with local regulations (GDPR, etc.).
