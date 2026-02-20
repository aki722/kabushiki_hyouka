const fs = require('node:fs');
const path = require('node:path');

function writeReport(outputDir, result) {
  fs.mkdirSync(outputDir, { recursive: true });

  const jsonPath = path.join(outputDir, 'result.json');
  const csvPath = path.join(outputDir, 'result.csv');

  fs.writeFileSync(jsonPath, JSON.stringify(result, null, 2));

  const headers = ['ticker', 'valuePerShare', 'p10', 'p50', 'p90'];
  const row = headers.map((key) => result[key] ?? '').join(',');
  const csv = `${headers.join(',')}\n${row}\n`;
  fs.writeFileSync(csvPath, csv);

  return [jsonPath, csvPath];
}

module.exports = { writeReport };
