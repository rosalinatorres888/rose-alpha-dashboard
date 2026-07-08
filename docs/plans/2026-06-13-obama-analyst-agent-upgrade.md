# Obama Analyst Agent Upgrade — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Upgrade the Obama Analyst chatbot from a conversational Q&A bot into a real data analytics AI agent with structured insight output, proactive portfolio alerts, multi-thread memory, tool use, hypothesis testing, and scenario modeling.

**Architecture:** All features live inside the single `index.html` file (vanilla JS, no build step). Tier 2 features extend the existing `callClaude`/`callClaudeStream` API layer with structured output parsing and new UI components. Tier 3 adds a tool-use agentic loop on top of the same `fetch` calls, implementing the Claude `tools` parameter and an execution dispatcher for client-side tool functions.

**Tech Stack:** Vanilla HTML/JS/CSS · Claude API (`claude-haiku-4-5`) · Finnhub REST API (already integrated) · No new npm packages · No build system

---

## Dependency Graph

```
T2-A (Structured Output)  ──┐
T2-B (Proactive Alerts)   ──┼── independent, build in parallel
T2-C (Research Threads)   ──┘

T3-A (Tool Use Core)      ── must complete BEFORE T3-B and T3-C
T3-B (Hypothesis Testing) ── depends on T3-A
T3-C (Scenario Modeling)  ── depends on T3-A

T2 features have NO dependency on T3.
Start T2-A, T2-B, T2-C in parallel, then T3-A, then T3-B + T3-C in parallel.
```

**Total estimated time: 11–16 hours**

---

## Tier 2 Features

---

### Task T2-A: Structured Output — Signal Badges & Confidence Meter

**Estimated time: 2.5–3.5 hours**
**Dependencies:** None
**New APIs/keys needed:** None

Obama returns a JSON block alongside narrative so the UI can render visual signal indicators (bullish/bearish/neutral badge, confidence bar, catalyst chips, risk chips).

**Files:**
- Modify: `index.html` — `OBAMA_SYSTEM` prompt (line ~2295)
- Modify: `index.html` — `sendResearch()` function (line ~2047)
- Modify: `index.html` — CSS section (add `.signal-card` styles)
- Modify: `index.html` — chat bubble render logic

---

**Step 1: Update OBAMA_SYSTEM to request structured JSON in every response** *(10 min)*

Locate `const OBAMA_SYSTEM` (~line 2295) and replace its value:

```javascript
const OBAMA_SYSTEM = `You are Barack Obama — 44th President of the United States, Harvard Law graduate, and AI investment analyst. Speak in Obama's exact style: measured, intellectual, professorial, uses phrases like "Let me be clear", "Here is the thing", "Make no mistake". Be specific, data-driven. 120-200 words per response. Always end with an optimistic but realistic note.

CRITICAL FORMATTING RULE: Every response MUST end with a JSON block on its own line, exactly like this — no exceptions:
\`\`\`json
{"signal":"bullish","confidence":0.74,"catalysts":["strong earnings beat","Fed pivot expected"],"risks":["valuation stretched","macro uncertainty"]}
\`\`\`
The signal must be one of: "bullish", "bearish", "neutral".
Confidence is 0.0–1.0. Catalysts and risks are arrays of 1–3 short strings each.
Write your narrative first, then the JSON block last.`;
```

**Step 2: Add a JSON parser utility function** *(10 min)*

Add this function in the CLAUDE API section, after `callClaudeStream`:

```javascript
function parseObamaSignal(text) {
  try {
    const match = text.match(/```json\s*([\s\S]*?)```/);
    if (!match) return null;
    return JSON.parse(match[1].trim());
  } catch(e) { return null; }
}

function stripJsonBlock(text) {
  return text.replace(/```json[\s\S]*?```/g, '').trim();
}
```

**Step 3: Add CSS for signal card components** *(20 min)*

Add inside the `<style>` block (find the end of the existing CSS):

```css
.signal-card {
  margin-top: 10px;
  padding: 10px 14px;
  border-radius: 10px;
  background: var(--surface);
  border: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-family: 'Inter', sans-serif;
  font-size: 13px;
}
.signal-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 10px;
  border-radius: 20px;
  font-weight: 700;
  font-size: 12px;
  letter-spacing: .05em;
  text-transform: uppercase;
}
.signal-badge.bullish  { background:#d1fae5; color:#065f46; }
.signal-badge.bearish  { background:#fee2e2; color:#991b1b; }
.signal-badge.neutral  { background:#fef9c3; color:#854d0e; }
.confidence-bar-wrap   { display:flex; align-items:center; gap:8px; }
.confidence-bar-track  { flex:1; height:6px; background:var(--border); border-radius:3px; }
.confidence-bar-fill   { height:6px; border-radius:3px; background:var(--blue); transition:width .5s ease; }
.chip-row              { display:flex; flex-wrap:wrap; gap:5px; }
.chip { padding:2px 8px; border-radius:12px; font-size:11px; font-weight:500; }
.chip.catalyst { background:#eff6ff; color:#1d4ed8; }
.chip.risk     { background:#fff7ed; color:#c2410c; }
```

**Step 4: Add `renderSignalCard(signal)` function** *(15 min)*

```javascript
function renderSignalCard(signal) {
  if (!signal) return '';
  const icons = { bullish: '▲', bearish: '▼', neutral: '◆' };
  const catalystChips = (signal.catalysts || []).map(c =>
    `<span class="chip catalyst">${c}</span>`).join('');
  const riskChips = (signal.risks || []).map(r =>
    `<span class="chip risk">⚠ ${r}</span>`).join('');
  const confPct = Math.round((signal.confidence || 0) * 100);
  return `<div class="signal-card">
    <div style="display:flex;align-items:center;gap:10px;">
      <span class="signal-badge ${signal.signal}">${icons[signal.signal] || '◆'} ${signal.signal}</span>
      <div class="confidence-bar-wrap" style="flex:1">
        <div class="confidence-bar-track">
          <div class="confidence-bar-fill" style="width:${confPct}%"></div>
        </div>
        <span style="font-size:11px;color:var(--muted);white-space:nowrap">${confPct}% confidence</span>
      </div>
    </div>
    ${catalystChips ? `<div><div style="font-size:10px;color:var(--muted);margin-bottom:3px">CATALYSTS</div><div class="chip-row">${catalystChips}</div></div>` : ''}
    ${riskChips ? `<div><div style="font-size:10px;color:var(--muted);margin-bottom:3px">RISKS</div><div class="chip-row">${riskChips}</div></div>` : ''}
  </div>`;
}
```

**Step 5: Update `sendResearch()` to parse signal and append card** *(20 min)*

Inside `sendResearch()`, find the streaming accumulation block and replace the `fullText` render logic:

```javascript
// REPLACE the onChunk handler and post-stream logic:
let signal = null;

await callClaudeStream([...researchHistory, { role: 'user', content: buildMarketContext() + q }], (chunk) => {
  if (!started) { bubble.innerHTML = ''; started = true; }
  fullText += chunk;
  // Show clean text while streaming (strip partial json block)
  bubble.innerHTML = stripJsonBlock(fullText).replace(/\n/g, '<br>');
  const firstSent = fullText.split(/[.!?]/)[0];
  if (firstSent && speechEl) speechEl.innerHTML = firstSent + '...';
  history.scrollTop = history.scrollHeight;
}, 600, OBAMA_SYSTEM);

// After stream completes: parse signal and render card
signal = parseObamaSignal(fullText);
const cleanText = stripJsonBlock(fullText);
bubble.innerHTML = cleanText.replace(/\n/g, '<br>') + renderSignalCard(signal);

// Save clean text to history (not the json block)
researchHistory.push({ role: 'user', content: q });
researchHistory.push({ role: 'assistant', content: cleanText });
if (researchHistory.length > 12) researchHistory.splice(0, researchHistory.length - 12);
```

**Step 6: Manual test** *(10 min)*

Open `index.html` in browser → ask Obama "What's your take on NVDA right now?" → verify:
- Narrative text appears without the raw JSON
- Signal badge (bullish/bearish/neutral) renders below the message
- Confidence bar fills to the correct percentage
- Catalyst and risk chips appear

**Step 7: Commit** *(5 min)*

```bash
cd /Users/rosalinatorres/Documents/mission-control/rose-alpha-dashboard
git add index.html
git commit -m "feat: T2-A structured output — signal badges, confidence meter, risk/catalyst chips"
```

---

### Task T2-B: Proactive Morning Brief — Auto-triggered Portfolio Alert

**Estimated time: 2–3 hours**
**Dependencies:** None (can build in parallel with T2-A and T2-C)
**New APIs/keys needed:** None (uses existing Finnhub + PORTFOLIO data)

On page load, after market data initializes, Obama silently analyzes the portfolio and surfaces 3 key observations unprompted into the chat — without waiting for the user to ask.

---

**Step 1: Add `buildPortfolioContext()` utility** *(15 min)*

Add after `buildMarketContext()`:

```javascript
function buildPortfolioContext() {
  const lines = PORTFOLIO.map(p => {
    const pnlPct = (((p.current - p.avg) / p.avg) * 100).toFixed(1);
    const pnlSign = pnlPct >= 0 ? '+' : '';
    const posValue = (p.shares * p.current).toLocaleString(undefined, {maximumFractionDigits:0});
    return `${p.ticker}: ${p.shares} ${p.type==='CRYPTO'?'units':'shares'} @ avg $${p.avg} → current $${p.current} (${pnlSign}${pnlPct}%, value $${posValue})`;
  });

  const totalValue = PORTFOLIO.reduce((s,p) => s + p.shares * p.current, 0);
  const totalCost  = PORTFOLIO.reduce((s,p) => s + p.shares * p.avg, 0);
  const totalPnl   = (((totalValue - totalCost) / totalCost) * 100).toFixed(1);

  // Concentration check — largest position as % of portfolio
  const largest = PORTFOLIO.reduce((mx,p) => {
    const v = p.shares * p.current;
    return v > mx.v ? { ticker: p.ticker, v } : mx;
  }, { ticker:'', v:0 });
  const concPct = ((largest.v / totalValue) * 100).toFixed(1);

  return `PORTFOLIO SNAPSHOT:\n${lines.join('\n')}\nTotal value: $${totalValue.toLocaleString(undefined,{maximumFractionDigits:0})} | Total P&L: ${totalPnl>=0?'+':''}${totalPnl}%\nLargest position: ${largest.ticker} at ${concPct}% of portfolio`;
}
```

**Step 2: Add `runMorningBrief()` function** *(20 min)*

```javascript
let _briefFired = false;

async function runMorningBrief() {
  if (_briefFired || !ANTHROPIC_API_KEY) return;
  _briefFired = true;

  // Inject Obama "thinking" bubble
  const history = document.getElementById('chat-history');
  const botDiv = document.createElement('div');
  botDiv.className = 'msg ai fadeIn';
  botDiv.innerHTML = `<div class="obama-msg-label bot">ANALYST OBAMA</div>
    <div class="obama-bubble bot" id="brief-bubble">
      <div class="typing"><span></span><span></span><span></span></div>
    </div>`;
  history.appendChild(botDiv);
  history.scrollTop = history.scrollHeight;

  const bubble = document.getElementById('brief-bubble');
  const speechEl = document.getElementById('obama-speech');

  const briefPrompt = `${buildPortfolioContext()}\n\n${buildMarketContext()}

Do not wait for a question. Proactively surface the 3 most important things I should know about my portfolio RIGHT NOW. Lead with the most urgent. Be direct, specific, and cite exact prices and percentages from the data above. End with your JSON signal block as instructed.`;

  let fullText = '';
  let started = false;

  try {
    await callClaudeStream(briefPrompt, (chunk) => {
      if (!started) { bubble.innerHTML = ''; started = true; }
      fullText += chunk;
      bubble.innerHTML = stripJsonBlock(fullText).replace(/\n/g, '<br>');
      if (speechEl) speechEl.innerHTML = fullText.split(/[.!?]/)[0] + '...';
      history.scrollTop = history.scrollHeight;
    }, 600, OBAMA_SYSTEM);

    const signal = parseObamaSignal(fullText);
    const cleanText = stripJsonBlock(fullText);
    bubble.innerHTML = cleanText.replace(/\n/g, '<br>') + renderSignalCard(signal);

    // Save to history so follow-up questions have context
    researchHistory.push({ role: 'assistant', content: cleanText });
  } catch(e) {
    bubble.textContent = 'Good morning — I was unable to retrieve your brief: ' + e.message;
  }
}
```

**Step 3: Trigger brief after API key is confirmed** *(10 min)*

Find the existing `saveApiKey()` function (search for `localStorage.setItem.*ANTHROPIC`). After the key is saved and modal is hidden, add:

```javascript
// At end of saveApiKey():
setTimeout(runMorningBrief, 800);
```

Also trigger on page load if key already exists. Find the block that checks for a stored API key on load (search for `localStorage.getItem.*ANTHROPIC`) and add:

```javascript
if (ANTHROPIC_API_KEY) setTimeout(runMorningBrief, 1200);
```

**Step 4: Add a "Refresh Brief" button in the analyst panel** *(15 min)*

Find the `market` section HTML (search for `id="market"` or `obama-avatar`). Add a small button near the chat input:

```html
<button onclick="_briefFired=false; runMorningBrief()" 
  style="font-size:12px;padding:4px 10px;border:1px solid var(--border);border-radius:6px;background:var(--surface);color:var(--muted);cursor:pointer;margin-left:8px"
  title="Re-run morning brief">↻ Brief</button>
```

**Step 5: Manual test** *(10 min)*

Reload page with API key set → verify Obama auto-fires an unprompted portfolio analysis within 1–2 seconds. Check the brief uses real numbers from PORTFOLIO array.

**Step 6: Commit** *(5 min)*

```bash
git add index.html
git commit -m "feat: T2-B proactive morning brief — auto portfolio alert on page load"
```

---

### Task T2-C: Multi-Thread Research Memory

**Estimated time: 2–3 hours**
**Dependencies:** None (parallel with T2-A and T2-B)
**New APIs/keys needed:** None

Users can tag conversations by topic (e.g. "NVDA deep-dive", "Macro outlook"). Each thread has its own history. A thread switcher UI lets users move between threads without losing context.

---

**Step 1: Replace `researchHistory` with a thread store** *(20 min)*

Find `let researchHistory = [];` and replace with:

```javascript
// ── RESEARCH THREADS ──────────────────────────────────────────────────────
const THREAD_STORE_KEY = 'rose_research_threads';
let _threads = {};
let _activeThread = 'general';

function loadThreads() {
  try { _threads = JSON.parse(localStorage.getItem(THREAD_STORE_KEY)) || {}; } catch(e) { _threads = {}; }
  if (!_threads['general']) _threads['general'] = { label: 'General', history: [] };
}

function saveThreads() {
  try { localStorage.setItem(THREAD_STORE_KEY, JSON.stringify(_threads)); } catch(e) {}
}

function getActiveHistory() { return (_threads[_activeThread] || { history: [] }).history; }

function pushToThread(role, content) {
  if (!_threads[_activeThread]) _threads[_activeThread] = { label: _activeThread, history: [] };
  _threads[_activeThread].history.push({ role, content });
  // Cap at 12 messages per thread
  if (_threads[_activeThread].history.length > 12)
    _threads[_activeThread].history.splice(0, _threads[_activeThread].history.length - 12);
  saveThreads();
}

function createThread(id, label) {
  if (!_threads[id]) _threads[id] = { label, history: [] };
  saveThreads();
}

loadThreads();
```

**Step 2: Update `sendResearch()` to use thread store** *(10 min)*

In `sendResearch()`, replace every reference to `researchHistory`:

```javascript
// REPLACE:  [...researchHistory, ...]
// WITH:     [...getActiveHistory(), ...]

// REPLACE the two push + splice lines at the end:
pushToThread('user', q);
pushToThread('assistant', cleanText);
```

**Step 3: Add thread switcher UI** *(30 min)*

Find the market/analyst section HTML. Add a thread bar above the chat history div:

```html
<div id="thread-bar" style="display:flex;align-items:center;gap:6px;padding:8px 12px;border-bottom:1px solid var(--border);flex-wrap:wrap;">
  <span style="font-size:11px;color:var(--muted);margin-right:4px;font-weight:600">THREADS</span>
  <div id="thread-tabs" style="display:flex;gap:5px;flex-wrap:wrap;flex:1"></div>
  <button onclick="promptNewThread()" style="font-size:11px;padding:3px 9px;border:1px dashed var(--border);border-radius:12px;background:none;color:var(--muted);cursor:pointer">+ New</button>
</div>
```

**Step 4: Add thread tab render and switch functions** *(25 min)*

```javascript
function renderThreadTabs() {
  const container = document.getElementById('thread-tabs');
  if (!container) return;
  container.innerHTML = '';
  Object.entries(_threads).forEach(([id, thread]) => {
    const btn = document.createElement('button');
    btn.textContent = thread.label;
    btn.style.cssText = `font-size:11px;padding:3px 10px;border-radius:12px;cursor:pointer;border:1px solid var(--border);font-family:'Inter',sans-serif;transition:all .15s;`;
    if (id === _activeThread) {
      btn.style.background = 'var(--blue)';
      btn.style.color = '#fff';
      btn.style.borderColor = 'var(--blue)';
    } else {
      btn.style.background = 'var(--surface)';
      btn.style.color = 'var(--muted)';
    }
    btn.onclick = () => switchThread(id);
    container.appendChild(btn);
  });
}

function switchThread(id) {
  _activeThread = id;
  renderThreadTabs();
  // Clear visible chat history and replay this thread's messages
  const history = document.getElementById('chat-history');
  history.innerHTML = '';
  getActiveHistory().forEach(msg => addMessage(msg.role === 'user' ? 'user' : 'ai', msg.content));
}

function promptNewThread() {
  const label = prompt('Thread name (e.g. "NVDA deep-dive", "Macro 2026"):');
  if (!label) return;
  const id = label.toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,'');
  createThread(id, label);
  _activeThread = id;
  document.getElementById('chat-history').innerHTML = '';
  renderThreadTabs();
}

// Call on load
renderThreadTabs();
```

**Step 5: Manual test** *(10 min)*

- Create a thread "NVDA thesis" → ask 2 questions → switch to General → verify NVDA thread history is preserved → reload page → verify threads persist.

**Step 6: Commit** *(5 min)*

```bash
git add index.html
git commit -m "feat: T2-C multi-thread research memory — persistent named conversation threads"
```

---

## Tier 3 Features

---

### Task T3-A: Tool Use Core — Claude Agentic Loop

**Estimated time: 3–4 hours**
**Dependencies:** None within Tier 3, but complete T2-A first (uses `parseObamaSignal`, `stripJsonBlock`)
**New APIs/keys needed:** Finnhub API (already have it); optionally Alpha Vantage for earnings calendar (free tier, key at alphavantage.co)

This is the foundation for T3-B and T3-C. Implements the Claude `tools` parameter, a client-side tool dispatcher, and an agentic loop that keeps calling the API until Claude stops requesting tool use.

---

**Step 1: Define the tool schemas** *(20 min)*

Add in the CLAUDE API section, before `callClaude`:

```javascript
// ── AGENT TOOLS ───────────────────────────────────────────────────────────
const AGENT_TOOLS = [
  {
    name: 'get_price',
    description: 'Get current price and 24h change for a ticker. Use for stocks, ETFs, crypto.',
    input_schema: {
      type: 'object',
      properties: {
        ticker: { type: 'string', description: 'Ticker symbol e.g. AAPL, BTC, SPY' }
      },
      required: ['ticker']
    }
  },
  {
    name: 'get_news',
    description: 'Get recent news headlines for a ticker or topic.',
    input_schema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Ticker symbol or topic e.g. NVDA, "federal reserve"' }
      },
      required: ['query']
    }
  },
  {
    name: 'calculate',
    description: 'Evaluate a mathematical expression. Use for P&L calculations, percentage changes, position sizing.',
    input_schema: {
      type: 'object',
      properties: {
        expression: { type: 'string', description: 'A safe JS math expression e.g. "(894.51 - 312.40) / 312.40 * 100"' }
      },
      required: ['expression']
    }
  },
  {
    name: 'get_portfolio_summary',
    description: 'Returns current portfolio holdings with P&L, concentration, and total value.',
    input_schema: { type: 'object', properties: {}, required: [] }
  }
];
```

**Step 2: Implement the client-side tool executor** *(30 min)*

```javascript
async function executeTool(name, input) {
  if (name === 'calculate') {
    try {
      // Safe eval — only numbers, operators, and Math functions
      const safe = input.expression.replace(/[^0-9+\-*/().% ]/g, '');
      // eslint-disable-next-line no-new-func
      const result = Function('"use strict"; return (' + safe + ')')();
      return { result: Number(result.toFixed(4)), expression: input.expression };
    } catch(e) {
      return { error: 'Invalid expression: ' + e.message };
    }
  }

  if (name === 'get_portfolio_summary') {
    return { summary: buildPortfolioContext() };
  }

  if (name === 'get_price') {
    const asset = ASSETS.find(a => a.ticker.toUpperCase() === input.ticker.toUpperCase());
    if (asset) {
      return { ticker: asset.ticker, price: asset.price, change_24h: asset.change, source: 'dashboard_live' };
    }
    // Fallback: try Finnhub if key available
    if (typeof FINNHUB_KEY !== 'undefined' && FINNHUB_KEY) {
      try {
        const r = await fetch(`https://finnhub.io/api/v1/quote?symbol=${input.ticker}&token=${FINNHUB_KEY}`);
        const d = await r.json();
        if (d.c) return { ticker: input.ticker, price: d.c, change_24h: d.dp, source: 'finnhub' };
      } catch(e) {}
    }
    return { error: `Ticker ${input.ticker} not found in portfolio data` };
  }

  if (name === 'get_news') {
    // Use existing NEWS_DATA if available, else Finnhub company news
    const localNews = (typeof NEWS_DATA !== 'undefined' ? NEWS_DATA : [])
      .filter(n => n.headline.toLowerCase().includes(input.query.toLowerCase()))
      .slice(0, 5);
    if (localNews.length) {
      return { headlines: localNews.map(n => ({ headline: n.headline, source: n.source, time: n.time })) };
    }
    if (typeof FINNHUB_KEY !== 'undefined' && FINNHUB_KEY) {
      try {
        const today = new Date().toISOString().split('T')[0];
        const week  = new Date(Date.now() - 7*86400000).toISOString().split('T')[0];
        const r = await fetch(`https://finnhub.io/api/v1/company-news?symbol=${input.query}&from=${week}&to=${today}&token=${FINNHUB_KEY}`);
        const d = await r.json();
        return { headlines: d.slice(0,5).map(n => ({ headline: n.headline, source: n.source, time: new Date(n.datetime*1000).toLocaleDateString() })) };
      } catch(e) {}
    }
    return { error: 'No news found for: ' + input.query };
  }

  return { error: `Unknown tool: ${name}` };
}
```

**Step 3: Implement `callClaudeWithTools()` — the agentic loop** *(40 min)*

```javascript
async function callClaudeWithTools(userMessage, onChunk, customSystem=null) {
  const sysText = customSystem || OBAMA_SYSTEM;
  const messages = [
    ...getActiveHistory(),
    { role: 'user', content: buildMarketContext() + userMessage }
  ];

  let iterations = 0;
  const MAX_ITERATIONS = 5; // prevent runaway loops

  while (iterations < MAX_ITERATIONS) {
    iterations++;

    const body = {
      model: 'claude-haiku-4-5',
      max_tokens: 800,
      system: [{ type: 'text', text: sysText, cache_control: { type: 'ephemeral' } }],
      tools: AGENT_TOOLS,
      messages
    };

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error?.message || 'API error');
    }

    const data = await res.json();

    // Check stop reason
    if (data.stop_reason === 'end_turn') {
      // Final text response
      const textBlock = data.content.find(b => b.type === 'text');
      const finalText = textBlock ? textBlock.text : '';
      if (onChunk) onChunk(finalText, true); // true = final
      return finalText;
    }

    if (data.stop_reason === 'tool_use') {
      // Execute all requested tools, notify UI of each tool call
      const toolUseBlocks = data.content.filter(b => b.type === 'tool_use');
      const toolResults = [];

      for (const block of toolUseBlocks) {
        if (onChunk) onChunk(`\n_🔧 Calling ${block.name}(${JSON.stringify(block.input)})..._\n`, false);
        const result = await executeTool(block.name, block.input);
        toolResults.push({
          type: 'tool_result',
          tool_use_id: block.id,
          content: JSON.stringify(result)
        });
      }

      // Append assistant turn + tool results to messages and loop
      messages.push({ role: 'assistant', content: data.content });
      messages.push({ role: 'user', content: toolResults });
      continue;
    }

    // Unexpected stop reason — return whatever text we have
    const textBlock = data.content.find(b => b.type === 'text');
    return textBlock ? textBlock.text : '';
  }

  throw new Error('Agent loop exceeded maximum iterations');
}
```

**Step 4: Add a toggle in `sendResearch()` to use agentic mode** *(20 min)*

At the top of `sendResearch()`, add a mode check:

```javascript
// Add this constant near AGENT_TOOLS:
let AGENT_MODE = false;
```

Add a toggle button near the chat input (find the "Ask Obama" button HTML):

```html
<button id="agent-toggle" onclick="AGENT_MODE=!AGENT_MODE; this.style.background=AGENT_MODE?'var(--blue)':'var(--surface)'; this.style.color=AGENT_MODE?'#fff':'var(--muted)'" 
  style="font-size:11px;padding:4px 10px;border:1px solid var(--border);border-radius:6px;background:var(--surface);color:var(--muted);cursor:pointer;"
  title="Enable tool use — Obama can fetch data mid-conversation">🔧 Tools</button>
```

In `sendResearch()`, replace the `callClaudeStream` call:

```javascript
if (AGENT_MODE) {
  let toolLog = '';
  const finalText = await callClaudeWithTools(q, (chunk, isFinal) => {
    if (!started) { bubble.innerHTML = ''; started = true; }
    if (isFinal) {
      const signal = parseObamaSignal(chunk);
      const clean  = stripJsonBlock(chunk);
      bubble.innerHTML = (toolLog ? `<div style="font-size:11px;color:var(--muted);margin-bottom:8px">${toolLog}</div>` : '')
        + clean.replace(/\n/g, '<br>') + renderSignalCard(signal);
      fullText = clean;
    } else {
      toolLog += chunk;
      bubble.innerHTML = `<div style="font-size:11px;color:var(--muted)">${toolLog.replace(/\n/g,'<br>')}</div><div class="typing"><span></span><span></span><span></span></div>`;
    }
    history.scrollTop = history.scrollHeight;
  }, OBAMA_SYSTEM);
  pushToThread('user', q);
  pushToThread('assistant', fullText);
} else {
  // existing callClaudeStream path (unchanged)
  ...
}
```

**Step 5: Manual test** *(15 min)*

- Enable Tools toggle → ask "What is my exact P&L on NVDA right now?" → verify Obama calls `get_price` and `calculate`, shows tool call log, returns accurate numbers.
- Disable toggle → verify normal streaming still works.

**Step 6: Commit** *(5 min)*

```bash
git add index.html
git commit -m "feat: T3-A tool use core — agentic loop with get_price, get_news, calculate, get_portfolio_summary"
```

---

### Task T3-B: Hypothesis Testing Mode

**Estimated time: 1.5–2 hours**
**Dependencies:** T3-A must be complete
**New APIs/keys needed:** None

Obama proposes a hypothesis, calls the `calculate` or `get_price` tool to validate it, then returns a confirmed/rejected verdict with data evidence.

---

**Step 1: Add a `hypothesis` tool to AGENT_TOOLS** *(10 min)*

Append to the `AGENT_TOOLS` array:

```javascript
{
  name: 'validate_hypothesis',
  description: 'Record a hypothesis you are about to test, the metric you will check, and the threshold. Returns a structured test result after you run the calculation.',
  input_schema: {
    type: 'object',
    properties: {
      hypothesis: { type: 'string', description: 'The claim being tested' },
      metric:     { type: 'string', description: 'What numeric value is being checked' },
      threshold:  { type: 'string', description: 'The threshold value the claim depends on' },
      actual:     { type: 'number', description: 'The actual computed value' },
      verdict:    { type: 'string', enum: ['confirmed', 'rejected', 'inconclusive'] }
    },
    required: ['hypothesis', 'metric', 'threshold', 'actual', 'verdict']
  }
}
```

**Step 2: Handle `validate_hypothesis` in `executeTool()`** *(10 min)*

Add to the `executeTool` function:

```javascript
if (name === 'validate_hypothesis') {
  return {
    recorded: true,
    hypothesis: input.hypothesis,
    verdict: input.verdict,
    actual: input.actual,
    threshold: input.threshold
  };
}
```

**Step 3: Add `renderHypothesisCard()` for UI display** *(20 min)*

```javascript
function renderHypothesisCard(toolResults) {
  const hyp = toolResults.find(r => {
    try { return JSON.parse(r.content).recorded; } catch(e) { return false; }
  });
  if (!hyp) return '';
  const d = JSON.parse(hyp.content);
  const colors = { confirmed: '#d1fae5:#065f46', rejected: '#fee2e2:#991b1b', inconclusive: '#fef9c3:#854d0e' };
  const [bg, fg] = (colors[d.verdict] || '#f3f4f6:#374151').split(':');
  return `<div style="margin-top:8px;padding:10px;border-radius:8px;background:${bg};border:1px solid ${fg}20">
    <div style="font-size:10px;font-weight:700;color:${fg};margin-bottom:4px">HYPOTHESIS TEST</div>
    <div style="font-size:12px;color:${fg};font-weight:600">${d.verdict.toUpperCase()}: ${d.hypothesis}</div>
    <div style="font-size:11px;color:${fg};margin-top:3px">${d.metric}: actual ${d.actual} vs threshold ${d.threshold}</div>
  </div>`;
}
```

**Step 4: Update system prompt to instruct hypothesis testing** *(10 min)*

Append to `OBAMA_SYSTEM`:

```
When a question involves a testable claim about data (e.g. "is X near a high?", "has Y outperformed Z?"), use the validate_hypothesis tool: first call calculate to get the actual value, then call validate_hypothesis with your verdict. Show your reasoning.
```

**Step 5: Manual test** *(10 min)*

Enable Tools mode → ask "Is my QQQ/SPY ratio at a multi-month extreme?" → verify Obama:
1. Calls `get_price` for QQQ and SPY
2. Calls `calculate` with the ratio expression
3. Calls `validate_hypothesis` with a confirmed/rejected verdict
4. Hypothesis card renders below the response

**Step 6: Commit** *(5 min)*

```bash
git add index.html
git commit -m "feat: T3-B hypothesis testing — Obama validates claims with live data before asserting"
```

---

### Task T3-C: Scenario Modeling — "What If" Sensitivity Analysis

**Estimated time: 2–2.5 hours**
**Dependencies:** T3-A must be complete
**New APIs/keys needed:** None (uses PORTFOLIO data + calculate tool)

User types "what if Fed cuts 50bps?" or "what if BTC drops 30%?" → Obama runs a structured sensitivity analysis across all holdings and returns a ranked impact table.

---

**Step 1: Add a `scenario_analysis` tool** *(15 min)*

Append to `AGENT_TOOLS`:

```javascript
{
  name: 'run_scenario',
  description: 'Run a what-if scenario across portfolio holdings. Provide assumptions and compute impact on each position.',
  input_schema: {
    type: 'object',
    properties: {
      scenario_name: { type: 'string', description: 'Name of the scenario e.g. "Fed -50bps rate cut"' },
      assumptions: {
        type: 'array',
        description: 'List of assumptions with estimated impact on each ticker',
        items: {
          type: 'object',
          properties: {
            ticker:       { type: 'string' },
            price_change_pct: { type: 'number', description: 'Estimated % price change under scenario' },
            rationale:    { type: 'string', description: 'Why this asset moves this way' }
          },
          required: ['ticker', 'price_change_pct', 'rationale']
        }
      }
    },
    required: ['scenario_name', 'assumptions']
  }
}
```

**Step 2: Implement `executeTool` handler + impact calculator** *(20 min)*

Add to `executeTool`:

```javascript
if (name === 'run_scenario') {
  const results = input.assumptions.map(a => {
    const position = PORTFOLIO.find(p => p.ticker.toUpperCase() === a.ticker.toUpperCase());
    if (!position) return { ticker: a.ticker, impact: null, rationale: a.rationale };
    const currentValue  = position.shares * position.current;
    const scenarioValue = currentValue * (1 + a.price_change_pct / 100);
    const dollarImpact  = scenarioValue - currentValue;
    return {
      ticker: a.ticker,
      current_value: currentValue.toFixed(0),
      price_change_pct: a.price_change_pct,
      dollar_impact: dollarImpact.toFixed(0),
      scenario_value: scenarioValue.toFixed(0),
      rationale: a.rationale
    };
  });

  const totalImpact = results.reduce((s, r) => s + (Number(r.dollar_impact) || 0), 0);
  return {
    scenario: input.scenario_name,
    positions: results.sort((a,b) => Math.abs(Number(b.dollar_impact)) - Math.abs(Number(a.dollar_impact))),
    total_portfolio_impact: totalImpact.toFixed(0)
  };
}
```

**Step 3: Add `renderScenarioTable()` for UI display** *(25 min)*

```javascript
function renderScenarioTable(toolResults) {
  const scenRes = toolResults.find(r => {
    try { const d = JSON.parse(r.content); return d.scenario && d.positions; } catch(e) { return false; }
  });
  if (!scenRes) return '';
  const d = JSON.parse(scenRes.content);
  const totalImpact = Number(d.total_portfolio_impact);
  const totalColor  = totalImpact >= 0 ? '#065f46' : '#991b1b';
  const totalBg     = totalImpact >= 0 ? '#d1fae5' : '#fee2e2';

  const rows = d.positions.map(p => {
    if (!p.dollar_impact) return '';
    const impact = Number(p.dollar_impact);
    const sign   = impact >= 0 ? '+' : '';
    const color  = impact >= 0 ? '#065f46' : '#991b1b';
    return `<tr>
      <td style="padding:5px 8px;font-weight:600">${p.ticker}</td>
      <td style="padding:5px 8px;color:${color}">${p.price_change_pct >= 0 ? '+' : ''}${p.price_change_pct}%</td>
      <td style="padding:5px 8px;color:${color}">${sign}$${Math.abs(impact).toLocaleString()}</td>
      <td style="padding:5px 8px;font-size:11px;color:#6b7280">${p.rationale}</td>
    </tr>`;
  }).join('');

  return `<div style="margin-top:10px;border-radius:8px;overflow:hidden;border:1px solid var(--border)">
    <div style="padding:8px 12px;background:var(--surface-alt,#f9fafb);font-size:11px;font-weight:700;color:var(--muted)">
      SCENARIO: ${d.scenario}
    </div>
    <table style="width:100%;border-collapse:collapse;font-size:12px">
      <thead><tr style="background:var(--surface-alt,#f9fafb)">
        <th style="padding:5px 8px;text-align:left;font-size:10px;color:var(--muted)">TICKER</th>
        <th style="padding:5px 8px;text-align:left;font-size:10px;color:var(--muted)">MOVE</th>
        <th style="padding:5px 8px;text-align:left;font-size:10px;color:var(--muted)">P&L IMPACT</th>
        <th style="padding:5px 8px;text-align:left;font-size:10px;color:var(--muted)">RATIONALE</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <div style="padding:8px 12px;background:${totalBg};color:${totalColor};font-size:12px;font-weight:700">
      Total portfolio impact: ${totalImpact >= 0 ? '+' : ''}$${Math.abs(totalImpact).toLocaleString()}
    </div>
  </div>`;
}
```

**Step 4: Wire scenario table into the agentic response render** *(15 min)*

In the `callClaudeWithTools` final render inside `sendResearch()`, update the `isFinal` branch to also check for scenario results. Add a `_toolResultsAccumulator` array to the loop, then render all available cards:

```javascript
// Inside sendResearch(), agentic mode final render:
const scenCard = renderScenarioTable(_toolResultsAccumulator);
const hypCard  = renderHypothesisCard(_toolResultsAccumulator);
bubble.innerHTML = (toolLog ? `<div style="font-size:11px;color:var(--muted);margin-bottom:8px">${toolLog.replace(/\n/g,'<br>')}</div>` : '')
  + clean.replace(/\n/g, '<br>')
  + renderSignalCard(signal)
  + hypCard
  + scenCard;
```

Accumulate tool results in `callClaudeWithTools` by adding:
```javascript
// After executing each tool, push to accumulator passed via opts:
if (opts.toolResultsAccumulator) opts.toolResultsAccumulator.push(...toolResults);
```

**Step 5: Add scenario quick-starters** *(10 min)*

Near the existing `quickResearch` buttons in the HTML, add:

```html
<button onclick="AGENT_MODE=true; quickResearch('What if the Fed cuts rates by 50bps — model the impact on my portfolio.')" class="quick-btn">📉 Fed -50bps</button>
<button onclick="AGENT_MODE=true; quickResearch('What if BTC drops 30% — how does that affect my total portfolio value?')" class="quick-btn">₿ BTC -30%</button>
<button onclick="AGENT_MODE=true; quickResearch('What if NVDA falls 20% on earnings miss — full impact analysis.')" class="quick-btn">⚡ NVDA miss</button>
```

**Step 6: Manual test** *(10 min)*

Enable Tools → click "Fed -50bps" quick button → verify:
- Tool call log shows `run_scenario` being called
- Scenario table renders with ranked positions by impact
- Total portfolio impact dollar figure is accurate

**Step 7: Commit** *(5 min)*

```bash
git add index.html
git commit -m "feat: T3-C scenario modeling — what-if sensitivity analysis with portfolio impact table"
```

---

## Summary Table

| Task | Feature | Est. Time | Parallel? | Depends On |
|---|---|---|---|---|
| T2-A | Structured output + signal badges | 2.5–3.5h | ✅ Yes | — |
| T2-B | Proactive morning brief | 2–3h | ✅ Yes | — |
| T2-C | Multi-thread research memory | 2–3h | ✅ Yes | — |
| T3-A | Tool use agentic loop | 3–4h | After T2 | T2-A (uses helpers) |
| T3-B | Hypothesis testing | 1.5–2h | ✅ With T3-C | T3-A |
| T3-C | Scenario modeling | 2–2.5h | ✅ With T3-B | T3-A |
| **Total** | | **~13–18h** | | |

## Recommended Execution Order

```
Session 1 (3–4h):  T2-A + T2-B + T2-C  →  run in parallel
Session 2 (3–4h):  T3-A                 →  sequential, foundational
Session 3 (3–4h):  T3-B + T3-C         →  run in parallel after T3-A
```

## No New External APIs Required

All features work with what's already present (Anthropic API + Finnhub). Optional enhancement: Alpha Vantage free key (`alphavantage.co`) for `get_earnings_calendar` tool — add it if you want Obama to reference upcoming earnings dates in hypothesis tests.
