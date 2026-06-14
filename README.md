# ROSE ALPHA — Multi-Asset Intelligence Dashboard

> Single-file investment dashboard. No build step, no dependencies — open `index.html` in a browser.

A personal AI-powered market intelligence terminal built around two analyst personas: **Obama** (investment analyst, market research, agentic tool use) and **Trump** (chaos event predictor, volatility signals). Runs entirely client-side with live market data and direct Claude API calls.

---

## Tabs

| Tab | Description |
|-----|-------------|
| **Market** | Live prices, Obama research chat, sector performance, asset allocation, earnings watch, correlation alerts |
| **Charts** | Candlestick charts per asset, AI technical analysis, Ask Obama deep dive |
| **News** | Live market news feed, Ask Obama about headlines |
| **Watchlist** | Customizable ticker watchlist |
| **AI Research** | Multi-turn research threads, deep research reports, scenario modeling, hypothesis testing |
| **Portfolio** | Holdings P&L, live stats (total value, daily change, best performer) |
| **Risk** | Correlation matrix, risk metrics (vol, beta), data age indicator |
| **🔥 Chaos Alpha** | Trump-persona event predictor, portfolio impact panel, live Chaos Index, prediction history with P&L scoring |
| **📓 Journal** | Conviction Journal — every Obama signal auto-captured and scored vs real price at 7d/30d |
| **💥 Stress** | Portfolio Stress Replay — simulate current holdings against 6 historical crashes |
| **🗒 Trades** | Natural language trade log with bias tagging, Obama monthly audit |

---

## Features

### AI Analysts

**Obama Market Analyst**
- Streaming and agentic (tool-use) modes toggled with the Tools button
- Tools available: `search_web` (Tavily), `get_price` (Finnhub), `get_news`, `calculate`, `get_portfolio_summary`, `validate_hypothesis`, `run_scenario`
- Structured signal output: every response ends with a JSON block (`signal`, `confidence`, `catalysts`, `risks`)
- Signal cards rendered with confidence meter and chip rows
- Hypothesis cards: `validate_hypothesis` tool returns confirmed/rejected verdict with metric vs threshold
- Scenario tables: `run_scenario` tool returns per-ticker impact ranked by dollar exposure
- Multi-turn research threads: named tabs, separate context per thread, persisted to localStorage
- Morning brief: fires automatically on load (6h TTL), surfaces top 3 portfolio actions

**Trump Chaos Alpha**
- Event feed: live chaos news + generated predictions
- Per-event prediction grid with bull/bear/neutral signal per asset
- Portfolio impact panel: maps predictions against PORTFOLIO positions, ranks by dollar exposure
- Live Chaos Index: composite score from event severity, portfolio volatility, open unscored bets
- Prediction cache: revisiting an event shows saved prediction instantly
- P&L scoring: auto-scores past predictions against actual price moves every 10 minutes
- Ask Obama button: routes any chaos event directly to Obama for regime-aware analysis

### Macro Regime Detection
- Classifies current regime every 6h: **Risk-On / Risk-Off / Stagflation / Goldilocks / Transition**
- Fetches macro proxies via Finnhub: VIX, TNX (10Y yield), DXY, GLD, TLT
- Persistent banner shown across all tabs (color-coded by regime, with confidence %, rationale, implications)
- Regime context injected into every Obama prompt — analysis shifts automatically based on macro environment
- Persisted to `rose_macro_regime` localStorage with 6h TTL; manual ↻ refresh button

### Conviction Journal
- Auto-captures every bullish/bearish/neutral signal Obama emits (chat, morning brief, agent mode)
- Records: signal direction, confidence, catalysts/risks, inferred ticker, entry price at time of call
- 7d and 30d outcomes scored automatically via Finnhub live price
- Win rate scorecard: total calls, 7d win rate, 30d win rate, avg confidence, best call
- Score Now button for manual scoring pass
- Persisted to `rose_conviction_journal` localStorage (200 entry cap)

### Portfolio Stress Replay
- 6 historical crash scenarios with per-asset drawdown data:
  - 🦠 COVID Crash (Feb–Mar 2020, S&P −34% in 33 days)
  - 🏦 SVB Collapse (Mar 2023, regional bank contagion)
  - 💣 GFC 2008 (Lehman collapse, S&P −57% over 6 months)
  - 💻 Dot-com Bust (Mar 2000–Oct 2002, NASDAQ −78%)
  - ₿ Crypto Winter (Nov 2021–Nov 2022, BTC −77%, SOL −97%)
  - 📈 Rate Shock 2022 (Fed +425bps, growth stocks obliterated)
- Per-holding impact table: position value, crash return %, dollar impact — sorted worst to best
- Assets that didn't exist during an event get beta-heuristic estimates flagged with `≈est`
- Obama narrates a 100–140 word lesson citing your exact numbers, regime-aware

### Earnings Watch
- Fetches next 21 days of earnings for all portfolio holdings via Finnhub calendar API
- Shows date, pre-market/after-close timing, EPS and revenue consensus estimates
- Days-until badge: red ≤3d, amber ≤7d
- Brief button fires a pre-earnings Obama research prompt with full position context
- 1h cache, refreshes on Market tab open

### Correlation Alerts
- Monitors 6 historically-correlated pairs: NVDA/QQQ, BTC/ETH, AAPL/MSFT, SPY/QQQ, BTC/NVDA, ETH/SOL
- Flags divergences when 24h spread exceeds per-pair threshold
- Ask Obama button routes divergence analysis to research tab
- Runs automatically on Market tab open; manual Scan button

### Trade Journal
- Plain-English trade log — no special format required
- Auto-detects ticker from CAPS words, stamps entry price and current macro regime
- Client-side bias tagger: `fear` / `fomo` / `greed` / `overconfident` / `revenge` / `disciplined`
- Bias Audit button: sends last 20 trades to Claude, Obama returns a 150–180 word pattern analysis covering dominant bias, what's working, recurring behavioral trap, and one discipline rule
- Persisted to `rose_trade_log` localStorage (300 entry cap)

### Charts
- Candlestick chart per asset, multiple time periods
- AI technical analysis (brief, 120–150 words)
- Ask Obama (deep dive): builds full investment thesis with web search, current price, chart period, and any existing technical summary

### Risk Tab
- Pearson correlation matrix (90d, equity-calendar aligned)
- Risk metrics: 30d annualized vol, beta vs SPY
- Data age indicator: shows staleness with amber warning if data is 2+ days old

---

## Data Sources

| Source | Used For |
|--------|----------|
| [Finnhub](https://finnhub.io) | Live prices, quotes, earnings calendar, company news |
| [Tavily](https://tavily.com) | Web search for Obama agent tool use |
| [Anthropic Claude](https://anthropic.com) | All AI analysis (claude-haiku-4-5) |

---

## Setup

1. Clone the repo and open `index.html` in a browser (no server needed)
2. On first load, enter your API keys in the modal:
   - **Anthropic** — for all AI features
   - **Finnhub** — for live prices, earnings, news
   - **Tavily** — for Obama web search tool (optional but recommended)
3. Keys are saved to `localStorage` — you only enter them once

**Optional:** Create `config.local.js` alongside `index.html` to auto-load keys without the modal:
```js
window.LOCAL_KEYS = {
  finnhub:    'your-finnhub-key',
  anthropic:  'your-anthropic-key',
  tavily:     'your-tavily-key',
};
```
This file is gitignored — never commit API keys.

---

## Files

| File | Description |
|------|-------------|
| `index.html` | The entire dashboard (~4,500 lines, single file) |
| `config.local.js` | Local API keys (gitignored, never commit) |
| `legacy-light-theme.html` | Pre-redesign original, kept for reference |

---

## localStorage Keys

| Key | Contents | TTL |
|-----|----------|-----|
| `rose_conviction_journal` | Obama signal history with 7d/30d outcomes | permanent |
| `rose_macro_regime` | Current macro regime classification | 6h |
| `rose_trade_log` | Plain-English trade entries with bias tags | permanent |
| `rose_chaos_history` | Chaos Alpha prediction history + P&L | permanent |
| `rose_last_chaos_pred` | Last chaos prediction (for restore on tab open) | permanent |
| `rose_research_threads` | Multi-turn Obama research threads | permanent |
| `rose_last_deep` | Last deep research result | permanent |
| `rose_brief_ts` | Morning brief timestamp for 6h TTL | 6h |

---

## ⚠️ Security Note

API keys live client-side. Do not host this dashboard on a public URL without routing API calls through a server-side proxy (Cloudflare Worker, Vercel function, etc.) that holds the keys. The `config.local.js` pattern is for local use only.

---

## Related

- PRD: `~/Documents/mission-control/prds/PRD-Equity-Dashboard.md`
- Sibling project: `~/Documents/mission-control/nvda-equity-dashboard/`
