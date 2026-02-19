const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { writeReport } = require('../../../src/equity-valuation/output/write-report');

test('writeReport writes json and csv outputs', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'equity-valuation-'));
  try {
    const files = writeReport(dir, {
      ticker: '7203',
      valuePerShare: 1234,
      p10: 1000,
      p50: 1200,
      p90: 1400
    });

    assert.equal(files.length, 2);
    for (const filePath of files) {
      assert.ok(fs.existsSync(filePath));
    }

    const jsonPath = files.find((filePath) => filePath.endsWith('.json'));
    const payload = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    assert.equal(payload.ticker, '7203');
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
