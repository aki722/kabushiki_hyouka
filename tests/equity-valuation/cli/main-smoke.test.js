const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { main } = require('../../../src/equity-valuation/cli/main');

test('CLI smoke: returns report for mock ticker', async () => {
  const outputDir = fs.mkdtempSync(path.join(os.tmpdir(), 'equity-cli-smoke-'));
  const adapters = {
    ingestCompany: async () => ({ sharesOutstanding: 100, sector: 'Automobiles' }),
    validateCompany: () => {},
    ingestStatement: async () => ({ revenue: 1000, ebit: 100, capex: 30, debt: 150, cash: 50 }),
    normalizeStatement: (x) => x,
    estimateAssumptions: () => ({ revGrowth: 0.03, ebitMargin: 0.12, reinvestmentRate: 0.3, wacc: 0.09, terminalGrowth: 0.02 }),
    runDcf: () => ({ enterpriseValue: 1500, equityValue: 1400, valuePerShare: 14 }),
    runSimulation: () => ({ p10: 12, p50: 14, p90: 17 }),
    computeHybridScore: () => 0.75
  };

  try {
    const value = await main(['--ticker', '7203', '--country', 'JP'], { adapters, outputDir });
    assert.equal(value.args.ticker, '7203');
    assert.equal(value.args.country, 'JP');
    assert.equal(value.files.length, 2);
    for (const filePath of value.files) {
      assert.ok(fs.existsSync(filePath));
    }
  } finally {
    fs.rmSync(outputDir, { recursive: true, force: true });
  }
});
