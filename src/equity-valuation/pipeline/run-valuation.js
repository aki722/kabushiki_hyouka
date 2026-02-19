async function runValuation(args, adapters) {
  const company = await adapters.ingestCompany(args);
  adapters.validateCompany(company);

  const statement = await adapters.ingestStatement(args);
  const normalized = adapters.normalizeStatement(statement);
  const assumptions = adapters.estimateAssumptions(
    { history: [normalized] },
    args.overrides || {}
  );

  const point = adapters.runDcf({
    fcffBase: normalized.ebit * (1 - 0.3),
    assumptions,
    debt: normalized.debt,
    cash: normalized.cash,
    sharesOutstanding: company.sharesOutstanding
  });

  const quantiles = adapters.runSimulation(
    () => point.valuePerShare,
    { iterations: 500 }
  );

  const trackingScore = typeof adapters.computeTrackingScore === 'function'
    ? adapters.computeTrackingScore(args, point, normalized)
    : 0.7;
  const fundamentalScore = typeof adapters.computeFundamentalScore === 'function'
    ? adapters.computeFundamentalScore(normalized, assumptions)
    : 0.8;

  const hybridScore = adapters.computeHybridScore({
    trackingScore,
    fundamentalScore
  });

  return {
    ticker: args.ticker,
    country: args.country,
    ...point,
    ...quantiles,
    trackingScore,
    fundamentalScore,
    hybridScore
  };
}

module.exports = { runValuation };
