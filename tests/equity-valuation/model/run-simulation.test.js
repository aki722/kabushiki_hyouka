const test = require('node:test');
const assert = require('node:assert/strict');
const { runSimulation } = require('../../../src/equity-valuation/model/run-simulation');

test('runSimulation returns ordered quantiles', () => {
  const q = runSimulation(() => 100, { iterations: 100, seed: 42 });
  assert.ok(q.p10 <= q.p50 && q.p50 <= q.p90);
});

test('runSimulation is deterministic for same seed', () => {
  const stochastic = (rand) => 90 + rand() * 20;
  const a = runSimulation(stochastic, { iterations: 200, seed: 7 });
  const b = runSimulation(stochastic, { iterations: 200, seed: 7 });
  assert.deepEqual(a, b);
});
