const test = require('node:test');
const assert = require('node:assert/strict');
const { parseArgs } = require('../../../src/equity-valuation/cli/parse-args');

test('parseArgs reads required flags', () => {
  const args = parseArgs(['--ticker', '7203', '--country', 'JP']);
  assert.equal(args.ticker, '7203');
  assert.equal(args.country, 'JP');
});

test('parseArgs throws on missing required flags', () => {
  assert.throws(() => parseArgs(['--ticker', '7203']), /missing_required_args/);
});
