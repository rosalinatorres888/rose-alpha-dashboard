/**
 * Rose Alpha Dashboard — Cloudflare Worker API Proxy
 *
 * Routes:
 *   POST /proxy/anthropic   → https://api.anthropic.com/v1/messages
 *   GET  /proxy/finnhub     → https://finnhub.io/api/v1/*
 *   POST /proxy/tavily      → https://api.tavily.com/search
 *   GET  /proxy/twelvedata  → https://api.twelvedata.com/*
 *
 * Keys stored as Cloudflare Worker Secrets (never in code):
 *   ANTHROPIC_API_KEY, FINNHUB_API_KEY, TAVILY_API_KEY, TWELVEDATA_API_KEY
 *
 * Deploy:
 *   1. npm install -g wrangler
 *   2. wrangler login
 *   3. wrangler deploy
 *   4. wrangler secret put ANTHROPIC_API_KEY
 *   5. wrangler secret put FINNHUB_API_KEY
 *   6. wrangler secret put TAVILY_API_KEY
 *   7. wrangler secret put TWELVEDATA_API_KEY
 */

const ALLOWED_ORIGIN = 'https://rosalinatorres888.github.io';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return corsResponse(null, 204);
    }

    // Only allow requests from the dashboard origin
    const origin = request.headers.get('Origin') || '';
    if (origin !== ALLOWED_ORIGIN && !origin.includes('localhost')) {
      return corsResponse(JSON.stringify({ error: 'Forbidden' }), 403);
    }

    const path = url.pathname;

    if (path === '/proxy/anthropic' && request.method === 'POST') {
      return proxyAnthropic(request, env);
    }

    if (path.startsWith('/proxy/finnhub') && request.method === 'GET') {
      return proxyFinnhub(url, env);
    }

    if (path === '/proxy/tavily' && request.method === 'POST') {
      return proxyTavily(request, env);
    }

    if (path.startsWith('/proxy/twelvedata') && request.method === 'GET') {
      return proxyTwelveData(url, env);
    }

    return corsResponse(JSON.stringify({ error: 'Not found' }), 404);
  }
};

async function proxyAnthropic(request, env) {
  const body = await request.text();
  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'anthropic-beta': 'prompt-caching-2024-07-31',
    },
    body,
  });
  const data = await resp.text();
  return corsResponse(data, resp.status, 'application/json');
}

async function proxyFinnhub(url, env) {
  // Strip /proxy/finnhub prefix, forward the rest as the Finnhub path+query
  const finnhubPath = url.pathname.replace('/proxy/finnhub', '') || '/quote';
  const params = new URLSearchParams(url.search);
  params.set('token', env.FINNHUB_API_KEY);
  const finnhubUrl = `https://finnhub.io/api/v1${finnhubPath}?${params.toString()}`;
  const resp = await fetch(finnhubUrl);
  const data = await resp.text();
  return corsResponse(data, resp.status, 'application/json');
}

async function proxyTavily(request, env) {
  const body = await request.json();
  body.api_key = env.TAVILY_API_KEY;
  const resp = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await resp.text();
  return corsResponse(data, resp.status, 'application/json');
}

async function proxyTwelveData(url, env) {
  const tdPath = url.pathname.replace('/proxy/twelvedata', '') || '/time_series';
  const params = new URLSearchParams(url.search);
  params.set('apikey', env.TWELVEDATA_API_KEY);
  const tdUrl = `https://api.twelvedata.com${tdPath}?${params.toString()}`;
  const resp = await fetch(tdUrl);
  const data = await resp.text();
  return corsResponse(data, resp.status, 'application/json');
}

function corsResponse(body, status = 200, contentType = 'application/json') {
  return new Response(body, {
    status,
    headers: {
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, x-api-key, anthropic-version, anthropic-beta, anthropic-dangerous-direct-browser-access',
    },
  });
}
