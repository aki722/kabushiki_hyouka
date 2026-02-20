const fs = require('node:fs');
const path = require('node:path');

function writeErrorReport(outputDir, error) {
  fs.mkdirSync(outputDir, { recursive: true });
  const traceId = error.traceId || `trace-${Date.now()}`;
  const payload = { ...error, traceId };
  const filePath = path.join(outputDir, 'error.json');
  fs.writeFileSync(filePath, JSON.stringify(payload, null, 2));
  return filePath;
}

module.exports = { writeErrorReport };
