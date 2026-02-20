const test = require('node:test');
const assert = require('node:assert/strict');
const { resolveMarket } = require('../../../src/equity-valuation/market/resolve-market');

test('numeric 4-digit ticker resolves to JP', () => {
  assert.equal(resolveMarket('7203').country, 'JP');
});

test('alpha ticker resolves to US', () => {
  assert.equal(resolveMarket('AAPL').country, 'US');
});

test('unknown format throws market_resolution_failed', () => {
  assert.throws(() => resolveMarket('12AB34'), /market_resolution_failed/);
});
