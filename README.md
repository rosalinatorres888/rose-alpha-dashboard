# ROSE ALPHA — Multi-Asset Intelligence Dashboard

Single-file investment dashboard (no build step — open `index.html` in a browser).

## Features
- Live market data: Finnhub (stocks/ETFs/news) + CoinGecko (BTC/ETH/SOL)
- Claude Fable 5 integration: Chaos Alpha event predictor (Trump persona),
  AI Research chat (Obama persona, grounded in live market context), deep research reports
- Dark/light theme toggle (obsidian charcoal / sage), Rose Alpha brand system (Inter, teal + rose-pink)
- Animated SVG brand logo and cartoon analyst avatars (pure vector)

## Files
- `index.html` — the dashboard (canonical version)
- `legacy-light-theme.html` — pre-redesign original, kept for reference

## ⚠️ Security note — DO NOT push to a public remote yet
API keys currently live client-side (Finnhub key in source, Anthropic key in
localStorage). Before publishing or hosting, route API calls through a key-holding
proxy (Cloudflare Worker / Vercel function). See PRD: `../prds/PRD-Equity-Dashboard.md`.

## Related
- PRD: `~/Documents/mission-control/prds/PRD-Equity-Dashboard.md`
- Sibling project: `~/Documents/mission-control/nvda-equity-dashboard/`
