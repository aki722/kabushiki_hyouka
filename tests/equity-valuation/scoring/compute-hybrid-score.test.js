const test = require('node:test');
const assert = require('node:assert/strict');
const { computeHybridScore } = require('../../../src/equity-valuation/scoring/compute-hybrid-score');

test('computeHybridScore combines tracking and fundamentals', () => {
  const score = computeHybridScore({
    trackingScore: 0.7,
    fundamentalScore: 0.8
  });

  assert.equal(score, 0.75);
});

test('computeHybridScore validates numeric input', () => {
  assert.throws(() => computeHybridScore({ trackingScore: 'a', fundamentalScore: 0.8 }), /invalid_score_input/);
});
