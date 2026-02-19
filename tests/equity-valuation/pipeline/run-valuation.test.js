const test = require('node:test');
const assert = require('node:assert/strict');
const { runValuation } = require('../../../src/equity-valuation/pipeline/run-valuation');

test('runValuation returns point estimate and quantiles', async () => {
  const mockAdapters = {
    ingestCompany: async () => ({ sharesOutstanding: 100, sector: 'Automobiles' }),
    validateCompany: () => {},
    ingestStatement: async () => ({ revenue: 1000, ebit: 100, capex: 40, debt: 200, cash: 50 }),
    normalizeStatement: (statement) => ({
      revenue: statement.revenue,
      ebit: statement.ebit,
      capex: statement.capex,
      debt: statement.debt,
      cash: statement.cash
    }),
    estimateAssumptions: () => ({
      revGrowth: 0.03,
      ebitMargin: 0.1,
      reinvestmentRate: 0.3,
      wacc: 0.09,
      terminalGrowth: 0.02
    }),
    runDcf: () => ({
      enterpriseValue: 1600,
      equityValue: 1450,
      valuePerShare: 14.5
    }),
    runSimulation: () => ({ p10: 12, p50: 14.5, p90: 17 }),
    computeHybridScore: () => 0.75
  };

  const result = await runValuation({ ticker: '7203', country: 'JP' }, mockAdapters);
  assert.equal(result.ticker, '7203');
  assert.ok(result.valuePerShare > 0);
  assert.ok(result.p10 <= result.p50 && result.p50 <= result.p90);
  assert.equal(result.hybridScore, 0.75);
});
