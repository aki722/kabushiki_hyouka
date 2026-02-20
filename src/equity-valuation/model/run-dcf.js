function runDcf(input = {}) {
  const fcffBase = Number(input.fcffBase);
  const assumptions = input.assumptions || {};
  const revGrowth = Number(assumptions.revGrowth);
  const wacc = Number(assumptions.wacc);
  const terminalGrowth = Number(assumptions.terminalGrowth);
  const debt = Number(input.debt || 0);
  const cash = Number(input.cash || 0);
  const sharesOutstanding = Number(input.sharesOutstanding || 1);
  const projectionYears = Number(input.projectionYears || 5);

  if (!Number.isFinite(fcffBase) || !Number.isFinite(revGrowth) || !Number.isFinite(wacc) || !Number.isFinite(terminalGrowth) || !Number.isFinite(sharesOutstanding) || sharesOutstanding <= 0) {
    throw new Error('invalid_dcf_inputs');
  }

  if (wacc <= terminalGrowth) {
    throw new Error('invalid_discount_constraints');
  }

  const discountedFcff = [];
  for (let year = 1; year <= projectionYears; year += 1) {
    const fcff = fcffBase * Math.pow(1 + revGrowth, year);
    const presentValue = fcff / Math.pow(1 + wacc, year);
    discountedFcff.push(presentValue);
  }

  const fcffAtHorizon = fcffBase * Math.pow(1 + revGrowth, projectionYears);
  const terminalFcff = fcffAtHorizon * (1 + terminalGrowth);
  const terminalValue = terminalFcff / (wacc - terminalGrowth);
  const terminalPresentValue = terminalValue / Math.pow(1 + wacc, projectionYears);

  const enterpriseValue = discountedFcff.reduce((sum, value) => sum + value, 0) + terminalPresentValue;
  const equityValue = enterpriseValue - debt + cash;
  const valuePerShare = equityValue / sharesOutstanding;

  return {
    enterpriseValue,
    equityValue,
    valuePerShare,
    discountedFcff,
    terminalValue
  };
}

module.exports = { runDcf };
