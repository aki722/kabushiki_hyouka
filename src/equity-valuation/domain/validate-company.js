const BLOCKED_SECTORS = new Set(['Banks', 'Insurance', 'Securities']);

function validateCompany(company) {
  if (BLOCKED_SECTORS.has(company.sector)) {
    throw new Error('unsupported_sector');
  }
}

module.exports = { validateCompany };
