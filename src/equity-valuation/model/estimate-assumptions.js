function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function toNumber(value, fallback) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function estimateRevenueGrowth(history = []) {
  if (!Array.isArray(history) || history.length < 2) {
    return 0.03;
  }

  const first = Number(history[0] && history[0].revenue);
  const last = Number(history[history.length - 1] && history[history.length - 1].revenue);

  if (!Number.isFinite(first) || !Number.isFinite(last) || first <= 0 || last <= 0) {
    return 0.03;
  }

  const years = history.length - 1;
  const cagr = Math.pow(last / first, 1 / years) - 1;
  return clamp(cagr, -0.2, 0.2);
}

function estimateAssumptions(input = {}, overrides = {}) {
  const defaults = {
    revGrowth: estimateRevenueGrowth(input.history),
    ebitMargin: 0.15,
    taxRate: 0.30,
    capexRatio: 0.04,
    workingCapitalRatio: 0.01,
    wacc: 0.09,
    terminalGrowth: 0.02
  };

  const merged = { ...defaults, ...overrides };
  const assumptions = {};

  for (const [key, value] of Object.entries(merged)) {
    assumptions[key] = toNumber(value, defaults[key]);
  }

  if (assumptions.wacc <= assumptions.terminalGrowth) {
    throw new Error('invalid_discount_constraints');
  }

  return assumptions;
}

module.exports = { estimateAssumptions };
