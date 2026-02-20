const test = require('node:test');
const assert = require('node:assert/strict');
const { validateEligibility } = require('../../../src/equity-valuation/domain/validate-eligibility');

test('validateEligibility rejects financial sectors', () => {
  assert.throws(() => validateEligibility({ sector: 'Banks' }), /unsupported_sector/);
});

test('validateEligibility accepts non-financial sectors', () => {
  assert.doesNotThrow(() => validateEligibility({ sector: 'Automobiles' }));
});
