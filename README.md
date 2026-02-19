# Equity Valuation CLI (DCF + Simulation)

This repository now includes an initial CLI pipeline under `src/equity-valuation`.

## Current Capabilities

- Parse ticker/country arguments
- Validate non-financial sector scope
- Normalize core statement fields
- Estimate DCF assumptions with override support
- Run FCFF DCF point valuation
- Run simulation quantiles (`P10`, `P50`, `P90`)
- Compute hybrid score (tracking + fundamental)
- Write JSON/CSV reports
- Detect filing updates by disclosure id changes

## Commands

- `npm run test:equity`
  - Runs all equity valuation tests.
- `npm run value:stock -- --ticker 7203 --country JP`
  - Runs CLI valuation flow.
- `npm run check:disclosures`
  - Verifies the disclosure change detector module is available.

## Note

Default CLI adapters for live data ingestion are placeholders in v1 (`not_implemented_ingest_company`, `not_implemented_ingest_statement`).
Use injected adapters (as in tests) until EDINET/TDnet/EDGAR ingestion modules are added.
