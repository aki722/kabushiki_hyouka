const path = require('node:path');
const { parseArgs } = require('./parse-args');
const { validateCompany } = require('../domain/validate-company');
const { normalizeStatement } = require('../domain/normalize-statement');
const { estimateAssumptions } = require('../model/estimate-assumptions');
const { runDcf } = require('../model/run-dcf');
const { runSimulation } = require('../model/run-simulation');
const { computeHybridScore } = require('../scoring/compute-hybrid-score');
const { runValuation } = require('../pipeline/run-valuation');
const { writeReport } = require('../output/write-report');

function createDefaultAdapters() {
  return {
    ingestCompany: async () => {
      throw new Error('not_implemented_ingest_company');
    },
    ingestStatement: async () => {
      throw new Error('not_implemented_ingest_statement');
    },
    validateCompany,
    normalizeStatement,
    estimateAssumptions,
    runDcf,
    runSimulation,
    computeHybridScore
  };
}

async function main(argv = process.argv.slice(2), options = {}) {
  const args = parseArgs(argv);
  const adapters = options.adapters || createDefaultAdapters();
  const outputDir = options.outputDir || path.join('output', 'equity-valuation');

  const result = await runValuation(args, adapters);
  const files = writeReport(outputDir, result);
  return { args, result, files };
}

if (require.main === module) {
  main()
    .then((value) => {
      process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
    })
    .catch((error) => {
      process.stderr.write(`${error.message}\n`);
      process.exitCode = 1;
    });
}

module.exports = { main, createDefaultAdapters };
