const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { runCliForTest } = require('../../../src/equity-valuation/cli/main');

const successAdapters = {
  resolveMarket: () => ({ country: 'US' }),
  fetchCompanyProfile: async () => ({ sector: 'Technology Hardware' }),
  fetchLatestStatement: async () => ({
    revenue: 1000,
    ebit: 200,
    capex: 40,
    taxExpense: 20,
    debt: 100,
    cash: 50,
    sharesOutstanding: 10
  }),
  seed: 11,
  iterations: 80
};

const unsupportedSectorAdapters = {
  resolveMarket: () => ({ country: 'US' }),
  fetchCompanyProfile: async () => ({ sector: 'Banks' }),
  fetchLatestStatement: async () => ({
    revenue: 1000,
    ebit: 200,
    capex: 40,
    sharesOutstanding: 10
  })
};

test('CLI success path writes output files', async () => {
  const outputDir = fs.mkdtempSync(path.join(os.tmpdir(), 'equity-cli-success-'));
  const exitCode = await runCliForTest(['AAPL'], {
    adapters: successAdapters,
    outputDir
  });

  assert.equal(exitCode, 0);
  assert.ok(fs.existsSync(path.join(outputDir, 'result.json')));
  assert.ok(fs.existsSync(path.join(outputDir, 'result.csv')));
});

test('CLI writes error.json on unsupported sector', async () => {
  const outputDir = fs.mkdtempSync(path.join(os.tmpdir(), 'equity-cli-error-'));
  const exitCode = await runCliForTest(['8306'], {
    adapters: unsupportedSectorAdapters,
    outputDir
  });

  assert.equal(exitCode, 1);
  const errorPath = path.join(outputDir, 'error.json');
  assert.ok(fs.existsSync(errorPath));

  const payload = JSON.parse(fs.readFileSync(errorPath, 'utf8'));
  assert.equal(payload.code, 'unsupported_sector');
});
