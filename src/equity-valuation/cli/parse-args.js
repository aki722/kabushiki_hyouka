function parseArgs(argv) {
  const out = {};

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith('--')) {
      continue;
    }

    const key = token.slice(2);
    const value = argv[i + 1];
    if (value == null || value.startsWith('--')) {
      throw new Error('missing_required_args');
    }

    out[key] = value;
    i += 1;
  }

  if (!out.ticker || !out.country) {
    throw new Error('missing_required_args');
  }

  return out;
}

module.exports = { parseArgs };
