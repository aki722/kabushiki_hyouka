const test = require('node:test');
const assert = require('node:assert/strict');
const { computeHybridScore } = require('../../../src/equity-valuation/scoring/compute-hybrid-score');

test('computeHybridScore returns weighted average (default 50/50)', () => {
  const score = computeHybridScore({ dcfScore: 80, qualityScore: 60 });
  assert.equal(score, 70);
});
