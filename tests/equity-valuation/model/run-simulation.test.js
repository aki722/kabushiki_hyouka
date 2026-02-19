const test = require('node:test');
const assert = require('node:assert/strict');
const { runSimulation } = require('../../../src/equity-valuation/model/run-simulation');

test('runSimulation returns p10 p50 p90 in ascending order', () => {
  const quantiles = runSimulation(
    (index) => index + 1,
    { iterations: 200 }
  );

  assert.ok(quantiles.p10 <= quantiles.p50);
  assert.ok(quantiles.p50 <= quantiles.p90);
});

test('runSimulation throws when iterations is invalid', () => {
  assert.throws(() => runSimulation(() => 1, { iterations: 0 }), /invalid_iterations/);
});
