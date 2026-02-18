const test = require('node:test');
const assert = require('node:assert/strict');

const { CARD_POOL, validateCardPool } = require('../deckbuilder/content.js');

test('CARD_POOL includes 30 cards', () => {
  assert.equal(CARD_POOL.length, 30);
});

test('validateCardPool confirms required fields and unique ids', () => {
  const result = validateCardPool(CARD_POOL);
  assert.equal(result.ok, true);
  assert.equal(result.errors.length, 0);
});
