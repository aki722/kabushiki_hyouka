const test = require('node:test');
const assert = require('node:assert/strict');
const { fetchLatestStatement } = require('../../../../src/equity-valuation/providers/jp/fetch-latest-statement');
const { fetchCompanyProfile } = require('../../../../src/equity-valuation/providers/jp/fetch-company-profile');

test('fetchLatestStatement (JP) returns required normalized raw fields', async () => {
  const s = await fetchLatestStatement('7203', { useFixtures: true });
  assert.ok(s.revenue > 0);
  assert.ok(s.ebit > 0);
  assert.ok(s.capex > 0);
});

test('fetchCompanyProfile (JP) returns sector for eligibility gate', async () => {
  const p = await fetchCompanyProfile('7203', { useFixtures: true });
  assert.equal(typeof p.sector, 'string');
  assert.ok(p.sector.length > 0);
});
