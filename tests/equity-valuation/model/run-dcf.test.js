const test = require('node:test');
const assert = require('node:assert/strict');
const { runDcf } = require('../../../src/equity-valuation/model/run-dcf');

test('runDcf computes enterprise and equity value', () => {
  const result = runDcf({
    fcffBase: 100,
    assumptions: { revGrowth: 0.03, wacc: 0.09, terminalGrowth: 0.02 },
    debt: 200,
    cash: 50,
    sharesOutstanding: 100
  });

  assert.ok(result.enterpriseValue > 0);
  assert.ok(result.equityValue > 0);
  assert.ok(result.valuePerShare > 0);
});

test('runDcf validates terminal assumptions', () => {
  assert.throws(() => runDcf({
    fcffBase: 100,
    assumptions: { revGrowth: 0.03, wacc: 0.02, terminalGrowth: 0.02 },
    debt: 0,
    cash: 0,
    sharesOutstanding: 100
  }), /invalid_discount_constraints/);
});
