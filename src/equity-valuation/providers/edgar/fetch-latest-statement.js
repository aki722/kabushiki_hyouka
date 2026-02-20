const fs = require('node:fs/promises');
const { resolveCik } = require('./resolve-cik');

const DEFAULT_HEADERS = {
  accept: 'application/json',
  'user-agent': 'equity-valuation-mvp/0.1'
};

const REVENUE_TAGS = [
  'Revenues',
  'RevenueFromContractWithCustomerExcludingAssessedTax',
  'SalesRevenueNet'
];

const EBIT_TAGS = [
  'OperatingIncomeLoss',
  'IncomeLossFromOperations'
];

const CAPEX_TAGS = [
  'PaymentsToAcquirePropertyPlantAndEquipment',
  'CapitalExpendituresIncurredButNotYetPaid',
  'CapitalExpenditures'
];

function parseJson(raw) {
  return JSON.parse(String(raw).replace(/^\uFEFF/, ''));
}

async function loadCompanyFacts(ticker, options = {}) {
  if (options.fixture) {
    const raw = await fs.readFile(options.fixture, 'utf8');
    return parseJson(raw);
  }

  const cik = await resolveCik(ticker, options);
  const url = options.url || `https://data.sec.gov/api/xbrl/companyfacts/CIK${cik}.json`;

  const response = await fetch(url, {
    headers: { ...DEFAULT_HEADERS, ...(options.headers || {}) }
  });

  if (!response.ok) {
    throw new Error('ingestion_failed');
  }

  return response.json();
}

function collectFactValues(factNode) {
  if (!factNode || !factNode.units || typeof factNode.units !== 'object') {
    return [];
  }

  const rows = [];
  for (const unitRows of Object.values(factNode.units)) {
    if (!Array.isArray(unitRows)) continue;

    for (const row of unitRows) {
      const value = Number(row.val);
      if (!Number.isFinite(value)) continue;

      const dateValue = row.end || row.filed || row.frame || '';
      const stamp = Date.parse(dateValue) || 0;
      rows.push({ value, stamp });
    }
  }

  rows.sort((a, b) => b.stamp - a.stamp);
  return rows;
}

function extractLatestFact(companyFacts, tags) {
  const usGaap = companyFacts && companyFacts.facts && companyFacts.facts['us-gaap'];
  if (!usGaap) return null;

  for (const tag of tags) {
    const values = collectFactValues(usGaap[tag]);
    if (values.length > 0) {
      return values[0].value;
    }
  }

  return null;
}

async function fetchLatestStatement(ticker, options = {}) {
  const companyFacts = await loadCompanyFacts(ticker, options);
  const revenue = extractLatestFact(companyFacts, REVENUE_TAGS);
  const ebit = extractLatestFact(companyFacts, EBIT_TAGS);
  const capexRaw = extractLatestFact(companyFacts, CAPEX_TAGS);

  if (!Number.isFinite(revenue) || !Number.isFinite(ebit) || !Number.isFinite(capexRaw)) {
    throw new Error('ingestion_failed');
  }

  return {
    revenue,
    ebit,
    capex: Math.abs(capexRaw)
  };
}

module.exports = { fetchLatestStatement };
