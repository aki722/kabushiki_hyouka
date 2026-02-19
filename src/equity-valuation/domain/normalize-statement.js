function normalizeStatement(raw) {
  const required = ['revenue', 'ebit', 'capex'];
  for (const key of required) {
    if (raw[key] == null) {
      throw new Error('missing_required_fields');
    }
  }

  return {
    revenue: Number(raw.revenue),
    ebit: Number(raw.ebit),
    capex: Number(raw.capex),
    taxExpense: Number(raw.taxExpense ?? 0),
    depreciationAmortization: Number(raw.depreciationAmortization ?? 0),
    workingCapital: Number(raw.workingCapital ?? 0),
    cash: Number(raw.cash ?? 0),
    debt: Number(raw.debt ?? 0)
  };
}

module.exports = { normalizeStatement };
