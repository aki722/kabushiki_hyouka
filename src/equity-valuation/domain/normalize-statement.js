const REQUIRED_FIELDS = ['revenue', 'ebit', 'capex'];
const OPTIONAL_FIELDS = [
  'taxExpense',
  'depreciation',
  'workingCapitalDelta',
  'debt',
  'cash',
  'sharesOutstanding'
];

function toFiniteNumber(value) {
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function normalizeStatement(input = {}) {
  const out = {};

  for (const field of REQUIRED_FIELDS) {
    const value = toFiniteNumber(input[field]);
    if (!Number.isFinite(value)) {
      throw new Error('missing_required_fields');
    }

    out[field] = value;
  }

  for (const field of OPTIONAL_FIELDS) {
    const value = toFiniteNumber(input[field]);
    out[field] = Number.isFinite(value) ? value : 0;
  }

  return out;
}

module.exports = { normalizeStatement };
