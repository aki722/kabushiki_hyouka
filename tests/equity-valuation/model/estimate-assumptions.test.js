const test = require('node:test');
const assert = require('node:assert/strict');
const { estimateAssumptions } = require('../../../src/equity-valuation/model/estimate-assumptions');

test('estimateAssumptions returns auto values from history', () => {
  const assumptions = estimateAssumptions(
    { history: [{ revenue: 100 }, { revenue: 110 }] },
    {}
  );

  assert.ok(assumptions.revGrowth > 0);
  assert.ok(assumptions.wacc > assumptions.terminalGrowth);
});

test('manual override replaces auto value', () => {
  const assumptions = estimateAssumptions(
    { history: [{ revenue: 100 }, { revenue: 110 }] },
    { wacc: 0.11 }
  );

  assert.equal(assumptions.wacc, 0.11);
});

test('estimateAssumptions validates discount constraint', () => {
  assert.throws(
    () => estimateAssumptions({ history: [{ revenue: 100 }, { revenue: 110 }] }, { wacc: 0.02, terminalGrowth: 0.02 }),
    /invalid_discount_constraints/
  );
});
