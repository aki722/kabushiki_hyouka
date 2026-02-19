const fs = require('node:fs');
const path = require('node:path');

const CSV_COLUMNS = [
  'ticker',
  'country',
  'enterpriseValue',
  'equityValue',
  'valuePerShare',
  'p10',
  'p50',
  'p90',
  'trackingScore',
  'fundamentalScore',
  'hybridScore'
];

function serializeCsvRow(payload) {
  return CSV_COLUMNS
    .map((column) => {
      const value = payload[column];
      if (value == null) {
        return '';
      }
      const cell = String(value).replace(/"/g, '""');
      return `"${cell}"`;
    })
    .join(',');
}

function writeReport(outputDir, payload) {
  fs.mkdirSync(outputDir, { recursive: true });

  const tag = `${payload.ticker || 'unknown'}-${Date.now()}`;
  const jsonPath = path.join(outputDir, `${tag}.json`);
  const csvPath = path.join(outputDir, `${tag}.csv`);

  fs.writeFileSync(jsonPath, JSON.stringify(payload, null, 2), 'utf8');
  const csvBody = `${CSV_COLUMNS.join(',')}\n${serializeCsvRow(payload)}\n`;
  fs.writeFileSync(csvPath, csvBody, 'utf8');

  return [jsonPath, csvPath];
}

module.exports = { writeReport };
