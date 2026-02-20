const test = require('node:test');
const assert = require('node:assert/strict');
const { parseArgs } = require('../../../src/equity-valuation/cli/parse-args');

test('parseArgs accepts one positional ticker', () => {
  const out = parseArgs(['7203']);
  assert.equal(out.ticker, '7203');
});

test('parseArgs throws when ticker missing', () => {
  assert.throws(() => parseArgs([]), /missing_ticker/);
});
