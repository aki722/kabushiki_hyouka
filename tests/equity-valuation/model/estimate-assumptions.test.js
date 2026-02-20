const test = require('node:test');
const assert = require('node:assert/strict');
const { estimateAssumptions } = require('../../../src/equity-valuation/model/estimate-assumptions');

test('estimateAssumptions enforces wacc > terminalGrowth', () => {
  assert.throws(
    () => estimateAssumptions(
      { history: [{ revenue: 100 }, { revenue: 110 }] },
      { wacc: 0.02, terminalGrowth: 0.03 }
    ),
    /invalid_discount_constraints/
  );
});

test('estimateAssumptions derives deterministic defaults', () => {
  const out = estimateAssumptions({ history: [{ revenue: 100 }, { revenue: 110 }] });
  assert.ok(out.revGrowth > 0);
  assert.ok(out.wacc > out.terminalGrowth);
});
