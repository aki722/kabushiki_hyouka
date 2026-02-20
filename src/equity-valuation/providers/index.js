const { fetchCompanyProfile: fetchUsCompanyProfile } = require('./edgar/fetch-company-profile');
const { fetchLatestStatement: fetchUsLatestStatement } = require('./edgar/fetch-latest-statement');
const { fetchCompanyProfile: fetchJpCompanyProfile } = require('./jp/fetch-company-profile');
const { fetchLatestStatement: fetchJpLatestStatement } = require('./jp/fetch-latest-statement');

function getProvider(market = {}) {
  if (market.country === 'US') {
    return {
      fetchCompanyProfile: fetchUsCompanyProfile,
      fetchLatestStatement: fetchUsLatestStatement
    };
  }

  if (market.country === 'JP') {
    return {
      fetchCompanyProfile: fetchJpCompanyProfile,
      fetchLatestStatement: fetchJpLatestStatement
    };
  }

  throw new Error('ingestion_failed');
}

module.exports = { getProvider };
