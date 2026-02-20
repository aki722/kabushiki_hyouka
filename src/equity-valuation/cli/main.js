const path = require('node:path');
const { parseArgs } = require('./parse-args');
const { runValuation } = require('../pipeline/run-valuation');
const { writeReport } = require('../output/write-report');
const { writeErrorReport } = require('../output/write-error-report');

function normalizeCliError(error, fallbackTicker) {
  const code = (error && (error.code || error.message)) || 'valuation_failed';
  return {
    code,
    message: (error && error.message) || code,
    stage: (error && error.stage) || 'cli',
    ticker: (error && error.ticker) || fallbackTicker
  };
}

async function runCliForTest(argv = [], options = {}) {
  const outputDir = options.outputDir || path.join('output', 'equity-valuation');
  let ticker = '';

  try {
    const args = parseArgs(argv);
    ticker = args.ticker;

    const result = await runValuation({ ticker }, options.adapters || {});
    writeReport(outputDir, result);
    return 0;
  } catch (error) {
    const fallbackTicker = ticker || String(argv[0] || '').trim().toUpperCase();
    writeErrorReport(outputDir, normalizeCliError(error, fallbackTicker));
    return 1;
  }
}

async function main(argv = process.argv.slice(2), options = {}) {
  const exitCode = await runCliForTest(argv, options);

  if (!options.skipExit) {
    process.exitCode = exitCode;
  }

  return exitCode;
}

if (require.main === module) {
  main();
}

module.exports = { main, runCliForTest };
