# Equity Valuation MVP Design

Date: 2026-02-20
Status: Approved
Target: CLI software for listed companies (JP/US)

## 1. Scope

Build an MVP CLI that fetches public disclosures and outputs DCF valuation with simulation ranges.

Confirmed decisions:
- Priority: fastest MVP delivery
- Data source policy: include real data ingestion in v1
- Markets: Japan + United States in v1
- Industry scope: non-financial valuation; financial sector returns unsupported error
- Input: ticker only (no required country flag)
- Market resolution: auto-detect JP/US internally
- Success criteria:
  - One command values one non-financial JP/US ticker and outputs point estimate + P10/P50/P90
  - Typed error responses for ingestion failure, missing required fields, and unsupported sector
  - Regression tests for three fixed tickers pass within tolerance

## 2. Approaches Considered

### Approach A: Provider-specific direct implementation
Build end-to-end flow separately per EDINET/TDnet/EDGAR.
- Pros: quick first path for one provider
- Cons: duplicated logic, weak maintainability across markets

### Approach B: Shared core + thin provider adapters (selected)
Keep valuation/domain logic common, isolate source-specific extraction in adapters.
- Pros: MVP speed with controlled complexity, easier extension and testing
- Cons: modest upfront interface design effort

### Approach C: Operations-first architecture
Build disclosure monitoring and storage pipeline before valuation flow.
- Pros: strong production-readiness
- Cons: slows MVP completion

## 3. Selected Architecture

Use a pipeline where data-source details stay at the edges and valuation logic stays central:

1. `cli`: accept ticker-only command (`value-stock <ticker>`)
2. `market-resolver`: infer JP/US market
3. `providers`: fetch company metadata and latest statement from EDINET/TDnet/EDGAR
4. `normalizer`: convert provider fields into common schema
5. `eligibility-gate`: reject financial sector with typed error
6. `valuation-core`: assumptions, DCF point estimate, simulation quantiles, hybrid score
7. `reporter`: emit JSON/CSV on success, structured `error.json` on failure

Design rules:
- Real data ingestion is in-scope for MVP
- Financial entities are explicit non-supported outputs in v1
- Error codes are stable and machine-readable
- Core valuation logic must be provider-agnostic and unit-testable

## 4. Component Contracts

- `marketResolver.resolve(ticker)` -> `{ country: 'JP' | 'US', marketHint?: string }`
  - Error: `market_resolution_failed`
- `provider.fetchCompanyProfile(ticker)` -> `{ sector, sharesOutstanding, ... }`
  - Error: `ingestion_failed`
- `provider.fetchLatestStatement(ticker)` -> raw statement object
  - Error: `ingestion_failed`
- `normalizeStatement(raw)` -> normalized statement
  - Required: `revenue`, `ebit`, `capex`
  - Optional with default handling: `taxExpense`, `depreciationAmortization`, `workingCapital`, `cash`, `debt`
  - Error: `missing_required_fields`
- `validateEligibility(company)` -> `void`
  - Error: `unsupported_sector`
- `valuationCore`:
  - `estimateAssumptions(history, overrides?)`
  - `runDcf(input)`
  - `runSimulation(sampleFn, opts)`
  - `computeHybridScore(scores)`
  - Error: `invalid_discount_constraints`
- `writeReport(outputDir, result)` -> paths to generated files
  - Failure path writes `error.json`

## 5. Data Flow

1. User runs `value-stock <ticker>`
2. CLI resolves market (JP/US)
3. Provider fetches company profile and latest disclosure data
4. Normalizer maps data into shared schema
5. Eligibility gate blocks financial sector with `unsupported_sector`
6. Valuation core computes point estimate, P10/P50/P90, and hybrid score
7. Reporter writes output artifacts:
   - Success: `result.json`, `result.csv`
   - Failure: `error.json` with `code`, `message`, `traceId`, `ticker`, `stage`

## 6. Error Handling

- `ingestion_failed`: source connectivity/download/parse failures at provider boundary
- `missing_required_fields`: required normalized fields absent
- `unsupported_sector`: sector in banks/insurance/securities families
- `invalid_discount_constraints`: invalid valuation constraints (for example `wacc <= terminalGrowth`)

All failures must produce structured error output with a stable code.

## 7. Verification Strategy

Test layers:
- Unit tests:
  - market resolution behavior
  - statement normalization (required and optional fields)
  - sector eligibility checks
  - DCF engine, simulation quantiles, hybrid scoring
- Integration tests:
  - JP non-financial ticker produces `result.json` and `result.csv`
  - US non-financial ticker produces `result.json` and `result.csv`
- Regression tests:
  - three fixed tickers remain within deterministic tolerance windows
- Error-path tests:
  - ingestion failure -> `ingestion_failed`
  - required field missing -> `missing_required_fields`
  - financial sector -> `unsupported_sector`

v1 is complete when all above tests pass and one-command valuation works for JP/US non-financial tickers.

## 8. Out of Scope (v1)

- Financial-sector valuation models
- Web UI
- Paid data providers
- Intraday refresh orchestration and persistent job scheduler

## 9. Transition

Next step is to create a task-level implementation plan with `writing-plans` for this approved MVP design.
