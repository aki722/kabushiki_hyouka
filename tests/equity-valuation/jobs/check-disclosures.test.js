const test = require('node:test');
const assert = require('node:assert/strict');
const { checkDisclosures } = require('../../../src/equity-valuation/jobs/check-disclosures');

test('checkDisclosures returns changed tickers from filing metadata', () => {
  const changed = checkDisclosures(
    [
      { ticker: '7203', filingId: 'A' },
      { ticker: '7203', filingId: 'B' },
      { ticker: '6758', filingId: 'X' }
    ],
    { '7203': 'A', '6758': 'X' }
  );

  assert.deepEqual(changed, ['7203']);
});

test('checkDisclosures returns empty when nothing changed', () => {
  const changed = checkDisclosures(
    [
      { ticker: '7203', filingId: 'A' }
    ],
    { '7203': 'A' }
  );

  assert.deepEqual(changed, []);
});
