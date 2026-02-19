function runSimulation(sampleFn, options = {}) {
  const iterations = options.iterations ?? 1000;
  if (!Number.isInteger(iterations) || iterations <= 0) {
    throw new Error('invalid_iterations');
  }

  const values = [];
  for (let index = 0; index < iterations; index += 1) {
    values.push(Number(sampleFn(index)));
  }

  values.sort((a, b) => a - b);

  const percentile = (p) => {
    const at = Math.floor((values.length - 1) * p);
    return values[at];
  };

  return {
    p10: percentile(0.1),
    p50: percentile(0.5),
    p90: percentile(0.9)
  };
}

module.exports = { runSimulation };
