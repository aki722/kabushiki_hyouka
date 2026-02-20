const fs = require('node:fs/promises');

const DEFAULT_TICKERS_URL = 'https://www.sec.gov/files/company_tickers.json';
const DEFAULT_HEADERS = {
  accept: 'application/json',
  'user-agent': 'equity-valuation-mvp/0.1'
};

function parseJson(raw) {
  return JSON.parse(String(raw).replace(/^\uFEFF/, ''));
}

async function loadTickerDataset(options = {}) {
  if (options.fixture) {
    const raw = await fs.readFile(options.fixture, 'utf8');
    return parseJson(raw);
  }

  const response = await fetch(options.url || DEFAULT_TICKERS_URL, {
    headers: { ...DEFAULT_HEADERS, ...(options.headers || {}) }
  });

  if (!response.ok) {
    throw new Error('ingestion_failed');
  }

  return response.json();
}

function normalizeEntries(payload) {
  if (Array.isArray(payload)) return payload;
  if (payload && typeof payload === 'object') return Object.values(payload);
  return [];
}

function normalizeCik(value) {
  const digits = String(value || '').replace(/\D/g, '');
  if (!digits) return '';
  return digits.padStart(10, '0');
}

async function resolveCik(ticker, options = {}) {
  const symbol = String(ticker || '').trim().toUpperCase();
  const dataset = await loadTickerDataset(options);
  const entries = normalizeEntries(dataset);

  const match = entries.find((item) => String(item.ticker || '').trim().toUpperCase() === symbol);
  const cik = match ? normalizeCik(match.cik_str) : '';

  if (!cik) {
    throw new Error('ingestion_failed');
  }

  return cik;
}

module.exports = { resolveCik };
