function runDcf(input) {
  const years = 5;
  const {
    fcffBase,
    assumptions,
    debt,
    cash,
    sharesOutstanding
  } = input;

  if (assumptions.wacc <= assumptions.terminalGrowth) {
    throw new Error('invalid_discount_constraints');
  }

  const projected = [];
  for (let year = 1; year <= years; year += 1) {
    projected.push(fcffBase * Math.pow(1 + assumptions.revGrowth, year));
  }

  let presentValue = 0;
  for (let year = 1; year <= years; year += 1) {
    presentValue += projected[year - 1] / Math.pow(1 + assumptions.wacc, year);
  }

  const terminalValue = (
    projected[years - 1] * (1 + assumptions.terminalGrowth)
  ) / (assumptions.wacc - assumptions.terminalGrowth);
  const terminalPv = terminalValue / Math.pow(1 + assumptions.wacc, years);

  const enterpriseValue = presentValue + terminalPv;
  const equityValue = enterpriseValue - debt + cash;
  const valuePerShare = equityValue / sharesOutstanding;

  return { enterpriseValue, equityValue, valuePerShare };
}

module.exports = { runDcf };
