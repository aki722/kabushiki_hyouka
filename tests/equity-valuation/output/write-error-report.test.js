const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { writeErrorReport } = require('../../../src/equity-valuation/output/write-error-report');

test('writeErrorReport writes structured json', () => {
  const outputDir = fs.mkdtempSync(path.join(os.tmpdir(), 'equity-valuation-error-'));
  const file = writeErrorReport(outputDir, {
    code: 'unsupported_sector',
    message: 'sector not supported',
    stage: 'eligibility',
    ticker: '8306'
  });

  assert.ok(file.endsWith('error.json'));

  const payload = JSON.parse(fs.readFileSync(file, 'utf8'));
  assert.equal(payload.code, 'unsupported_sector');
  assert.equal(payload.message, 'sector not supported');
  assert.equal(payload.stage, 'eligibility');
  assert.equal(payload.ticker, '8306');
  assert.ok(payload.traceId);
});
