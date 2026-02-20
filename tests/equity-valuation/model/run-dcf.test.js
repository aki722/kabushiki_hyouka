const test = require('node:test');
const assert = require('node:assert/strict');
const { runDcf } = require('../../../src/equity-valuation/model/run-dcf');

test('runDcf returns positive valuation metrics for valid inputs', () => {
  const r = runDcf({
    fcffBase: 100,
    assumptions: { revGrowth: 0.03, wacc: 0.09, terminalGrowth: 0.02 },
    debt: 200,
    cash: 50,
    sharesOutstanding: 100
  });

  assert.ok(r.valuePerShare > 0);
  assert.ok(r.enterpriseValue > 0);
  assert.ok(r.equityValue > 0);
});
