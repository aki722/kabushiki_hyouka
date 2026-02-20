const { resolveMarket } = require('../market/resolve-market');
const { getProvider } = require('../providers');
const { normalizeStatement } = require('../domain/normalize-statement');
const { validateEligibility } = require('../domain/validate-eligibility');
const { estimateAssumptions } = require('../model/estimate-assumptions');
const { runDcf } = require('../model/run-dcf');
const { runSimulation } = require('../model/run-simulation');
const { computeHybridScore } = require('../scoring/compute-hybrid-score');
const { createAppError } = require('../errors/create-app-error');

function defaultHistory(statement) {
  return [
    { revenue: statement.revenue * 0.95 },
    { revenue: statement.revenue }
  ];
}

function buildSimulationEvaluator(baseInput) {
  return (rng) => {
    const growthShock = (rng() - 0.5) * 0.02;
    const waccShock = (rng() - 0.5) * 0.01;

    const assumptions = {
      ...baseInput.assumptions,
      revGrowth: baseInput.assumptions.revGrowth + growthShock,
      wacc: Math.max(baseInput.assumptions.wacc + waccShock, baseInput.assumptions.terminalGrowth + 0.005)
    };

    return runDcf({
      ...baseInput,
      assumptions
    }).valuePerShare;
  };
}

async function runValuation(input = {}, adapters = {}) {
  const ticker = String(input.ticker || '').trim().toUpperCase();

  try {
    const resolveMarketFn = adapters.resolveMarket || resolveMarket;
    const market = await Promise.resolve(resolveMarketFn(ticker));

    const provider = (adapters.fetchCompanyProfile && adapters.fetchLatestStatement)
      ? adapters
      : getProvider(market);

    const profile = await provider.fetchCompanyProfile(ticker, adapters.providerOptions || {});
    validateEligibility(profile);

    const rawStatement = await provider.fetchLatestStatement(ticker, adapters.providerOptions || {});
    const statement = normalizeStatement(rawStatement);

    const assumptions = estimateAssumptions(
      { history: adapters.history || defaultHistory(statement) },
      adapters.assumptionOverrides || {}
    );

    const fcffBase =
      statement.ebit * (1 - assumptions.taxRate) +
      statement.depreciation -
      statement.capex -
      statement.workingCapitalDelta;

    const dcfInput = {
      fcffBase,
      assumptions,
      debt: statement.debt,
      cash: statement.cash,
      sharesOutstanding: statement.sharesOutstanding || 1
    };

    const dcf = runDcf(dcfInput);
    const quantiles = runSimulation(buildSimulationEvaluator(dcfInput), {
      iterations: adapters.iterations || 500,
      seed: adapters.seed || 42
    });

    return {
      ticker,
      country: market.country,
      sector: profile.sector,
      valuePerShare: dcf.valuePerShare,
      p10: quantiles.p10,
      p50: quantiles.p50,
      p90: quantiles.p90,
      hybridScore: computeHybridScore({
        dcfScore: dcf.valuePerShare,
        qualityScore: quantiles.p50
      }),
      assumptions
    };
  } catch (error) {
    if (error && error.code) {
      throw error;
    }

    throw createAppError(
      (error && error.message) || 'valuation_failed',
      'pipeline',
      { ticker }
    );
  }
}

module.exports = { runValuation };
