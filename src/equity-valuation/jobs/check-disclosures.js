function checkDisclosures(latestFilings, lastSeenMap) {
  const changed = [];
  for (const filing of latestFilings) {
    if (lastSeenMap[filing.ticker] !== filing.filingId) {
      changed.push(filing.ticker);
    }
  }

  return [...new Set(changed)];
}

module.exports = { checkDisclosures };
