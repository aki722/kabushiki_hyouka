function computeHybridScore(input = {}, weights = {}) {
  const dcfScore = Number(input.dcfScore || 0);
  const qualityScore = Number(input.qualityScore || 0);
  const weightDcf = Number(weights.weightDcf ?? 0.5);
  const weightQuality = Number(weights.weightQuality ?? 0.5);

  const totalWeight = weightDcf + weightQuality;
  if (!Number.isFinite(totalWeight) || totalWeight <= 0) {
    throw new Error('invalid_hybrid_weights');
  }

  return (dcfScore * weightDcf + qualityScore * weightQuality) / totalWeight;
}

module.exports = { computeHybridScore };
