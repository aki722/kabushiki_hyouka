const BLOCKED_PATTERNS = [
  /bank/i,
  /insurance/i,
  /insurer/i,
  /securit/i,
  /broker/i,
  /financial/i
];

function validateEligibility(profile = {}) {
  const sector = String(profile.sector || '').trim();

  if (BLOCKED_PATTERNS.some((pattern) => pattern.test(sector))) {
    throw new Error('unsupported_sector');
  }

  return true;
}

module.exports = { validateEligibility };
