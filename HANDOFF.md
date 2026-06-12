# Session handoff — 2026-06-12

**State:** Dashboard fully working. Canonical file: `index.html` (this repo).
Downloads copies are stale. Three commits document the session.

**Done today:** CORS fix, live Finnhub feed + CoinGecko crypto, Fable 5 upgrade,
dark/light Rose Alpha theme (toggle ☾/☀), animated rose logo, cartoon avatars,
chart hoisting-recursion bugfix, XSS hardening (esc()/textContent), freshness
stamp in topbar, Obama chat memory (last 12 turns, market context per-turn),
real BTC/ETH/SOL candles via CoinGecko with source label.

**Next up (in order):**
1. Key proxy (Cloudflare Worker or Vercel function) — REQUIRED before any
   public hosting; Finnhub key is hardcoded, Anthropic key is client-side.
2. Real stock candles (unlocked by the same proxy).
3. GitHub remote + Pages hosting once keys are out.
4. Optional: persist Chaos Alpha predictions to localStorage (real track
   record), mobile-responsive pass, prompt caching once chats run long.

**Brand decisions (locked):** rose-pink for negatives (not red), teal accent,
Inter font, semi-dark gray Obama panel in light mode.
