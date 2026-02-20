const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { writeReport } = require('../../../src/equity-valuation/output/write-report');

test('writeReport writes json and csv files', () => {
  const outputDir = fs.mkdtempSync(path.join(os.tmpdir(), 'equity-valuation-report-'));
  const files = writeReport(outputDir, {
    ticker: 'AAPL',
    valuePerShare: 123,
    p10: 100,
    p50: 120,
    p90: 140
  });

  assert.equal(files.length, 2);
  assert.ok(files.some((f) => f.endsWith('result.json')));
  assert.ok(files.some((f) => f.endsWith('result.csv')));
});
