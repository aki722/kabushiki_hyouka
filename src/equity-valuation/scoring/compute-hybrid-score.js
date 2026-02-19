function computeHybridScore(input) {
  const trackingScore = Number(input.trackingScore);
  const fundamentalScore = Number(input.fundamentalScore);

  if (!Number.isFinite(trackingScore) || !Number.isFinite(fundamentalScore)) {
    throw new Error('invalid_score_input');
  }

  return Number(((trackingScore + fundamentalScore) / 2).toFixed(4));
}

module.exports = { computeHybridScore };
