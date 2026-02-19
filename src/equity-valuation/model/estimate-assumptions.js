function estimateAssumptions(input, overrides = {}) {
  const history = input.history ?? [];
  const first = history[0]?.revenue ?? 0;
  const last = history[history.length - 1]?.revenue ?? 0;
  const revGrowth = first > 0 ? (last / first) - 1 : 0;

  const auto = {
    revGrowth,
    ebitMargin: 0.12,
    reinvestmentRate: 0.35,
    wacc: 0.09,
    terminalGrowth: 0.02
  };

  const merged = { ...auto, ...overrides };
  if (merged.wacc <= merged.terminalGrowth) {
    throw new Error('invalid_discount_constraints');
  }

  return merged;
}

module.exports = { estimateAssumptions };
