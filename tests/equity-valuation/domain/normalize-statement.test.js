const test = require('node:test');
const assert = require('node:assert/strict');
const { normalizeStatement } = require('../../../src/equity-valuation/domain/normalize-statement');

test('normalizeStatement maps required and optional fields', () => {
  const out = normalizeStatement({ revenue: 100, ebit: 10, capex: 5 });
  assert.equal(out.revenue, 100);
  assert.equal(out.taxExpense, 0);
});

test('normalizeStatement throws missing_required_fields', () => {
  assert.throws(() => normalizeStatement({ revenue: 100 }), /missing_required_fields/);
});
