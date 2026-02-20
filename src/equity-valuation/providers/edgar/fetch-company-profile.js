const fs = require('node:fs/promises');
const { resolveCik } = require('./resolve-cik');

const DEFAULT_HEADERS = {
  accept: 'application/json',
  'user-agent': 'equity-valuation-mvp/0.1'
};

function parseJson(raw) {
  return JSON.parse(String(raw).replace(/^\uFEFF/, ''));
}

async function loadProfilePayload(ticker, options = {}) {
  if (options.fixture) {
    const raw = await fs.readFile(options.fixture, 'utf8');
    return parseJson(raw);
  }

  const cik = await resolveCik(ticker, options);
  const url = options.url || `https://data.sec.gov/submissions/CIK${cik}.json`;
  const response = await fetch(url, {
    headers: { ...DEFAULT_HEADERS, ...(options.headers || {}) }
  });

  if (!response.ok) {
    throw new Error('ingestion_failed');
  }

  return response.json();
}

async function fetchCompanyProfile(ticker, options = {}) {
  const payload = await loadProfilePayload(ticker, options);
  const sector = payload.sicDescription || payload.sic || 'Unknown';

  return {
    ticker: String(ticker || '').trim().toUpperCase(),
    sector: String(sector)
  };
}

module.exports = { fetchCompanyProfile };
