const test = require('node:test');
const assert = require('node:assert/strict');
const { runValuation } = require('../../../src/equity-valuation/pipeline/run-valuation');

const mockAdapters = {
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
  seed: 42,
  iterations: 120
};

test('runValuation returns point estimate and quantiles', async () => {
  const result = await runValuation({ ticker: 'AAPL' }, mockAdapters);
  assert.ok(result.valuePerShare > 0);
  assert.ok(result.p10 <= result.p50 && result.p50 <= result.p90);
});
