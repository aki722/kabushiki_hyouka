const { parseArgs } = require('./parse-args');

function main(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  return args;
}

if (require.main === module) {
  try {
    const args = main();
    process.stdout.write(`${JSON.stringify(args)}\n`);
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  }
}

module.exports = { main };
