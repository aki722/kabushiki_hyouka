const test = require('node:test');
const assert = require('node:assert/strict');
const { resolveCik } = require('../../../../src/equity-valuation/providers/edgar/resolve-cik');

test('resolveCik finds CIK from ticker dataset', async () => {
  const cik = await resolveCik('AAPL', {
    fixture: 'tests/fixtures/equity-valuation/edgar/company_tickers.sample.json'
  });

  assert.equal(cik, '0000320193');
});
