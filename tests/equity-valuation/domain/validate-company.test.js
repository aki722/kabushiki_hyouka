const test = require('node:test');
const assert = require('node:assert/strict');
const { validateCompany } = require('../../../src/equity-valuation/domain/validate-company');

test('validateCompany rejects financial sector entities', () => {
  assert.throws(() => validateCompany({ sector: 'Banks' }), /unsupported_sector/);
});

test('validateCompany allows non-financial sectors', () => {
  assert.doesNotThrow(() => validateCompany({ sector: 'Automobiles' }));
});
