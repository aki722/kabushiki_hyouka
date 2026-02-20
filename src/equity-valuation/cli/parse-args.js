function parseArgs(argv) {
  const ticker = argv[0];
  if (!ticker) throw new Error('missing_ticker');
  return { ticker: String(ticker).trim().toUpperCase() };
}

module.exports = { parseArgs };
