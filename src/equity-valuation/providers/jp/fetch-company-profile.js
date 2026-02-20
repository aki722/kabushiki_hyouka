const fs = require('node:fs/promises');
const path = require('node:path');

function parseJson(raw) {
  return JSON.parse(String(raw).replace(/^\uFEFF/, ''));
}

function fixturePath(fileName) {
  return path.join(process.cwd(), 'tests/fixtures/equity-valuation/jp', fileName);
}

async function fetchCompanyProfile(ticker, options = {}) {
  if (!options.useFixtures) {
    throw new Error('ingestion_failed');
  }

  const raw = await fs.readFile(fixturePath('tdnet-company.sample.json'), 'utf8');
  const payload = parseJson(raw);

  return {
    ticker: String(ticker || '').trim(),
    sector: String(payload.sector || 'Unknown')
  };
}

module.exports = { fetchCompanyProfile };
