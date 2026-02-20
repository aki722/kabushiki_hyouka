function parseNumber(raw) {
  const value = Number(String(raw).replace(/,/g, '').trim());
  return Number.isFinite(value) ? value : null;
}

function extractTagValue(xml, tagNames) {
  for (const tag of tagNames) {
    const regex = new RegExp(`<(?:[A-Za-z0-9_]+:)?${tag}[^>]*>([^<]+)</(?:[A-Za-z0-9_]+:)?${tag}>`, 'i');
    const match = String(xml).match(regex);
    if (!match) continue;

    const num = parseNumber(match[1]);
    if (Number.isFinite(num)) {
      return num;
    }
  }

  return null;
}

function extractEdinetFinancials(xml) {
  const revenue = extractTagValue(xml, [
    'NetSales',
    'Revenue',
    'OperatingRevenues'
  ]);

  const ebit = extractTagValue(xml, [
    'OperatingIncome',
    'OperatingIncomeLoss'
  ]);

  const capexRaw = extractTagValue(xml, [
    'PurchaseOfPropertyPlantAndEquipment',
    'PaymentsToAcquirePropertyPlantAndEquipment',
    'CapitalExpenditures'
  ]);

  if (!Number.isFinite(revenue) || !Number.isFinite(ebit) || !Number.isFinite(capexRaw)) {
    throw new Error('ingestion_failed');
  }

  return {
    revenue,
    ebit,
    capex: Math.abs(capexRaw)
  };
}

module.exports = { extractEdinetFinancials };
