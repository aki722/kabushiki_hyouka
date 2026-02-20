const fs = require('node:fs/promises');
const path = require('node:path');
const { extractEdinetFinancials } = require('./extract-edinet-financials');

function parseJson(raw) {
  return JSON.parse(String(raw).replace(/^\uFEFF/, ''));
}

function fixturePath(fileName) {
  return path.join(process.cwd(), 'tests/fixtures/equity-valuation/jp', fileName);
}

async function fetchLatestStatement(ticker, options = {}) {
  if (!options.useFixtures) {
    throw new Error('ingestion_failed');
  }

  const listRaw = await fs.readFile(fixturePath('edinet-doc-list.sample.json'), 'utf8');
  const docList = parseJson(listRaw);

  if (!docList.results || docList.results.length === 0) {
    throw new Error('ingestion_failed');
  }

  const xml = await fs.readFile(fixturePath('edinet-xbrl.sample.xml'), 'utf8');
  return extractEdinetFinancials(xml);
}

module.exports = { fetchLatestStatement };
