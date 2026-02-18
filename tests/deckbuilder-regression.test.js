const test = require('node:test');
const assert = require('node:assert/strict');

const { runSeededSimulation } = require('../deckbuilder/engine.js');

test('runSeededSimulation returns stable snapshot for fixed seed', () => {
  const out = runSeededSimulation({ seed: 'snapshot-seed' });
  assert.equal(out.turnsPlayed, 5);
  assert.equal(typeof out.totalScore, 'number');
  assert.equal(out.signature, 'snapshot-seed:5');
});
