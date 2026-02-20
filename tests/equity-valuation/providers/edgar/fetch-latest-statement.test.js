const test = require('node:test');
const assert = require('node:assert/strict');
const { fetchLatestStatement } = require('../../../../src/equity-valuation/providers/edgar/fetch-latest-statement');

test('fetchLatestStatement extracts required statement fields', async () => {
  const s = await fetchLatestStatement('AAPL', {
    fixture: 'tests/fixtures/equity-valuation/edgar/companyfacts.aapl.sample.json'
  });

  assert.ok(s.revenue > 0);
  assert.ok(s.ebit > 0);
  assert.ok(s.capex > 0);
});
