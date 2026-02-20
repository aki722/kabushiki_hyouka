function resolveMarket(ticker) {
  if (/^\d{4}$/.test(ticker)) return { country: 'JP' };
  if (/^[A-Z.\-]{1,10}$/.test(ticker) && /[A-Z]/.test(ticker)) return { country: 'US' };
  throw new Error('market_resolution_failed');
}

module.exports = { resolveMarket };
