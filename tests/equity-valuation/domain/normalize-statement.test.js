const test = require('node:test');
const assert = require('node:assert/strict');
const { normalizeStatement } = require('../../../src/equity-valuation/domain/normalize-statement');

test('normalizeStatement maps required keys', () => {
  const normalized = normalizeStatement({
    revenue: 100,
    ebit: 10,
    capex: 5
  });

  assert.equal(normalized.revenue, 100);
  assert.equal(normalized.ebit, 10);
  assert.equal(normalized.capex, 5);
});

test('normalizeStatement throws on missing required fields', () => {
  assert.throws(() => normalizeStatement({ revenue: 100, ebit: 10 }), /missing_required_fields/);
});
