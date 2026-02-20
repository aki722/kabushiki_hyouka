# Equity Valuation MVP

Ticker-only CLI that ingests JP/US disclosures, runs a DCF valuation, and writes structured output files.

## Install and Run

```bash
npm install
npm run value:stock -- AAPL
```

Default output directory:

- `output/equity-valuation/result.json`
- `output/equity-valuation/result.csv`
- `output/equity-valuation/error.json` (failure case)

## Output Schema

`result.json` fields:

- `ticker` string
- `country` string (`US` or `JP`)
- `sector` string
- `valuePerShare` number (point estimate)
- `p10` number
- `p50` number
- `p90` number
- `hybridScore` number
- `assumptions` object (model assumptions)

`result.csv` columns:

- `ticker,valuePerShare,p10,p50,p90`

`error.json` fields:

- `code` string
- `message` string
- `stage` string
- `ticker` string
- `traceId` string

## Known Error Codes

- `missing_ticker`
- `market_resolution_failed`
- `ingestion_failed`
- `missing_required_fields`
- `unsupported_sector`
- `invalid_discount_constraints`
- `invalid_dcf_inputs`
- `invalid_simulation_iterations`
- `invalid_simulation_evaluator`
- `invalid_simulation_value`
- `invalid_hybrid_weights`
- `valuation_failed`

## Regression Tests

Run all equity tests:

```bash
npm run test:equity
```

Run fixed-ticker regression only:

```bash
node --test tests/equity-valuation/regression/fixed-tickers.test.js
```
