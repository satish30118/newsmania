# NewsMania

**NewsMania** — Smart Indian news aggregator and summarizer.

NewsMania collects headlines from major Indian news outlets (The Times of India, Hindustan Times, Indian Express, The Hindu), lets users open and read full articles, generates short AI-powered summaries, and supports bookmarking for later reading. This repository contains a full-stack prototype with a React frontend and a Node.js backend.

---

## Key features

- Aggregate headlines from:
  - The Times of India (TOI)
  - Hindustan Times
  - Indian Express
  - The Hindu
- Read full article content (fetched / proxied by the backend)
- AI-generated summaries (short / medium / long)
- Bookmark articles (user-level bookmarks stored server-side / local)
- Basic deduplication / caching for repeated articles
- Simple REST API and React UI (frontend / backend folders)

---

## Repo layout

```
newsmania/
├─ backend/        # Node.js + Express backend
├─ frontend/       # React frontend
├─ README.md       # <-- you are here
├─ package.json
└─ ...
```

---

## Quickstart (local development)

### Prerequisites
- Node.js (v16+ recommended)
- npm or yarn
- (Optional) MongoDB or any DB if you decide to enable persistent bookmarks server-side — instructions below
- An AI API key (e.g., OpenAI) if you want built-in summarization (or configure another summarizer)

### 1. Clone
```bash
git clone https://github.com/satish30118/newsmania.git
cd newsmania
```

### 2. Backend
```bash
cd backend
npm install
```

Create your `.env` file (copy the example if present):
```bash
cp .env.example .env
```

Open `.env` and set these variables (example names — adapt to your actual backend code if different):

```
PORT=5000
NODE_ENV=development

# DB (optional - for bookmarks)
MONGO_URI=mongodb://localhost:27017/newsmania

# CORS / frontend URL
FRONTEND_URL=http://localhost:3000

# List of RSS or source configuration (comma-separated or path)
NEWS_SOURCES="toi,hindustan-times,indian-express,the-hindu"

# AI summarization (if integrated)
OPENAI_API_KEY=sk-...
SUMMARY_MODEL=gpt-4o-mini
SUMMARY_MAX_TOKENS=256
```

Start server:
```bash
# development
npm run dev   # or `node server.js` depending on repo scripts
```

Backend will run on `http://localhost:5000` (or the port you set).

---

### 3. Frontend
```bash
cd ../frontend
npm install
cp .env.example .env
# edit .env to set API base URL
```

Typical `.env` values for frontend:
```
REACT_APP_API_URL=http://localhost:5000
```

Run:
```bash
npm start
```

Frontend will typically run on `http://localhost:3000`.

---

## How the app works (high level)

1. Backend periodically fetches headlines and article links from configured sources (RSS or scrapers).
2. When a user clicks a headline, the frontend asks the backend to fetch the article content (backend acts as a proxy and optionally strips extraneous markup).
3. The user can request a summary — the backend sends article text to the configured AI summarizer and stores or returns the summary.
4. Bookmarks: bookmarks can be stored in DB per-user (requires auth) or locally in `localStorage` for a simple setup.

---

## API (example)

> Adjust endpoints to match your backend implementation. These are suggested endpoints that match the app features.

```
GET  /api/v1/feeds                -> list aggregated headlines (source, title, url, publishedAt, id)
GET  /api/v1/articles/:id         -> fetch article content (html/text)
POST /api/v1/articles/:id/summarize  -> return summary (body: { length: "short"|"medium"|"long" })
POST /api/v1/bookmarks           -> save bookmark (body: { articleId, userId? })
GET  /api/v1/bookmarks           -> list bookmarks (userId or session)
```

Example `POST /api/v1/articles/:id/summarize` request body:
```json
{ "length": "short" }
```

Example response:
```json
{
  "articleId": "123",
  "summary": "Short 2-3 sentence summary of the article...",
  "model": "gpt-4o-mini",
  "tokens": 145
}
```

---

## Environment & configuration notes

- If you use an AI provider (OpenAI or similar), never commit API keys to the repo. Use server-side environment variables.
- If storing bookmarks server-side, secure endpoints with authentication (JWT / sessions).
- If scraping or proxying article pages, be mindful of each source's `robots.txt` and terms of service. Prefer RSS feeds or official APIs when available.

---

## News sources & legal note

This app aggregates headlines from multiple Indian news sources (TOI, Hindustan Times, Indian Express, The Hindu). If you proxy full article content, verify the licensing and usage terms of each source. Prefer fetching via official RSS feeds or public APIs when possible. Respect copyright and use small extracts + links back to the original article where required.

---

## Deployment

- Build frontend:
```bash
cd frontend
npm run build
```
- Serve the build via static host (Netlify, Vercel, GitHub Pages with an API in a separate host) or from your Node backend (express static).
- For backend, use providers like Railway, Render, Heroku, or a VPS. Set environment variables in the provider dashboard.
- If using MongoDB in production, use managed DB (MongoDB Atlas or cloud provider).

---

## Suggested improvements / roadmap

- Add authentication + user profiles so bookmarks are tied to accounts.
- Scheduler (cron job / worker) to fetch & refresh feeds periodically.
- Deduplication and canonicalization of articles from multiple sources.
- Intelligent caching of article content and summaries to reduce API usage.
- Advanced UI: filters by source, category, read/unread markers, dark mode.
- Add unit/integration tests and CI pipeline (GitHub Actions).

---

## Contributing

1. Fork the repo
2. Create a branch: `git checkout -b feat/my-change`
3. Make changes and commit: `git commit -m "Add feature"`
4. Push and open a PR

Please include a short description of your change and how to test it.

---

## Troubleshooting

- If headlines are empty: check backend logs and ensure the news sources list (RSS feed URLs or scraper config) is present in `.env`.
- If summaries are failing: confirm your AI API key, model name, and quota.
- If CORS errors happen: confirm `FRONTEND_URL` or CORS settings in backend.

---

## Example `.env` (backend)
```
PORT=5000
NODE_ENV=production
MONGO_URI=mongodb://localhost:27017/newsmania
FRONTEND_URL=http://localhost:3000
NEWS_SOURCES_FILE=./config/sources.json
OPENAI_API_KEY=your_openai_key_here
SUMMARY_MODEL=gpt-4o-mini
```

---

## Screenshots / Demo
Add screenshots or a short GIF of the UI here (paste images into `docs/` and reference them). Consider adding a live demo link once deployed.

---

## License
Add a LICENSE file (MIT recommended) if you want this repo to be permissively licensed.

---

## Contact / Author
Satish — feel free to open issues or PRs on this repo for feature requests or bug reports. Repo: `satish30118/newsmania`.
