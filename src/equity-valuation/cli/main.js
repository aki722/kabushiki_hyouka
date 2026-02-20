const { parseArgs } = require('./parse-args');

function main(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  return args;
}

if (require.main === module) {
  main();
}

module.exports = { main };
