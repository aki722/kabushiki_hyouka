const test = require('node:test');
const assert = require('node:assert/strict');
const { createAppError } = require('../../../src/equity-valuation/errors/create-app-error');

test('createAppError preserves code and metadata', () => {
  const err = createAppError('missing_required_fields', 'normalize', { ticker: '7203' });
  assert.equal(err.code, 'missing_required_fields');
  assert.equal(err.stage, 'normalize');
  assert.equal(err.ticker, '7203');
});
