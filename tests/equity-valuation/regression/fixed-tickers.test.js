const test = require('node:test');
const assert = require('node:assert/strict');
const { runValuation } = require('../../../src/equity-valuation/pipeline/run-valuation');
const baseline = require('../../fixtures/equity-valuation/regression/baseline.json');

const fixtureAdapters = {
  resolveMarket: (ticker) => (/^\d{4}$/.test(ticker) ? { country: 'JP' } : { country: 'US' }),
  fetchCompanyProfile: async (ticker) => {
    const sectors = {
      AAPL: 'Technology Hardware',
      MSFT: 'Software',
      '7203': 'Automobiles & Auto Parts'
    };
    return { sector: sectors[ticker] || 'Unknown' };
  },
  fetchLatestStatement: async (ticker) => {
    const statements = {
      AAPL: {
        revenue: 383285000000,
        ebit: 114301000000,
        capex: 10959000000,
        taxExpense: 16741000000,
        debt: 111000000000,
        cash: 62000000000,
        sharesOutstanding: 15600000000
      },
      MSFT: {
        revenue: 211915000000,
        ebit: 88523000000,
        capex: 28107000000,
        taxExpense: 16950000000,
        debt: 77000000000,
        cash: 80000000000,
        sharesOutstanding: 7440000000
      },
      '7203': {
        revenue: 45123700000000,
        ebit: 5352300000000,
        capex: 1450000000000,
        taxExpense: 1200000000000,
        debt: 32000000000000,
        cash: 8500000000000,
        sharesOutstanding: 3200000000
      }
    };

    return statements[ticker];
  },
  seed: 42,
  iterations: 400
};

test('three fixed tickers stay within tolerance window', async () => {
  for (const ticker of Object.keys(baseline)) {
    const result = await runValuation({ ticker }, fixtureAdapters);
    assert.ok(
      Math.abs(result.valuePerShare - baseline[ticker].valuePerShare) <= baseline[ticker].tolerance,
      `ticker=${ticker} value=${result.valuePerShare} baseline=${baseline[ticker].valuePerShare}`
    );
  }
});
