const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { extractEdinetFinancials } = require('../../../../src/equity-valuation/providers/jp/extract-edinet-financials');

test('extractEdinetFinancials extracts required fields from sample XBRL', () => {
  const xml = fs.readFileSync('tests/fixtures/equity-valuation/jp/edinet-xbrl.sample.xml', 'utf8');
  const out = extractEdinetFinancials(xml);

  assert.ok(out.revenue > 0);
  assert.ok(out.ebit > 0);
  assert.ok(out.capex > 0);
});

test('extractEdinetFinancials throws ingestion_failed when fields are missing', () => {
  assert.throws(() => extractEdinetFinancials('<xbrl></xbrl>'), /ingestion_failed/);
});
