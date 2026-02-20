function createRng(seed = 1) {
  let state = (Number(seed) >>> 0) || 1;
  return function rng() {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function quantile(sorted, q) {
  if (sorted.length === 0) return 0;

  const pos = (sorted.length - 1) * q;
  const lower = Math.floor(pos);
  const upper = Math.ceil(pos);

  if (lower === upper) return sorted[lower];

  const ratio = pos - lower;
  return sorted[lower] + (sorted[upper] - sorted[lower]) * ratio;
}

function runSimulation(evaluator, options = {}) {
  const iterations = Number(options.iterations || 1000);
  if (!Number.isFinite(iterations) || iterations <= 0) {
    throw new Error('invalid_simulation_iterations');
  }

  if (typeof evaluator !== 'function') {
    throw new Error('invalid_simulation_evaluator');
  }

  const rng = createRng(options.seed || 1);
  const results = [];

  for (let i = 0; i < iterations; i += 1) {
    const value = Number(evaluator(rng));
    if (!Number.isFinite(value)) {
      throw new Error('invalid_simulation_value');
    }

    results.push(value);
  }

  results.sort((a, b) => a - b);

  return {
    p10: quantile(results, 0.10),
    p50: quantile(results, 0.50),
    p90: quantile(results, 0.90)
  };
}

module.exports = { runSimulation };
