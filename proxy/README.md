# Rose Alpha Proxy — Cloudflare Worker

Keeps all API keys server-side. The dashboard calls `/proxy/*` instead of hitting Anthropic/Finnhub/Tavily directly.

## Deploy (one time, ~5 minutes)

```bash
# 1. Install Wrangler
npm install -g wrangler

# 2. Login to Cloudflare (opens browser)
wrangler login

# 3. Deploy the worker
cd proxy/
wrangler deploy

# 4. Set secrets (keys never touch code or git)
wrangler secret put ANTHROPIC_API_KEY
wrangler secret put FINNHUB_API_KEY
wrangler secret put TAVILY_API_KEY
```

After deploy, Wrangler prints your worker URL:
```
https://rose-alpha-proxy.<your-subdomain>.workers.dev
```

## Wire the dashboard

In `index.html`, set the proxy base URL at the top of the config section:

```js
const PROXY_BASE = 'https://rose-alpha-proxy.<your-subdomain>.workers.dev';
```

Then replace direct API calls:
- Anthropic: `POST ${PROXY_BASE}/proxy/anthropic`
- Finnhub:   `GET  ${PROXY_BASE}/proxy/finnhub/quote?symbol=AAPL`
- Tavily:    `POST ${PROXY_BASE}/proxy/tavily`

## Cloudflare free tier limits
- 100,000 requests/day — more than enough for personal use
- No credit card required for the free plan
