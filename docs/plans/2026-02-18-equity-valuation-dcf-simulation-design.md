# Equity Valuation DCF Simulation Design

Date: 2026-02-18
Status: Approved
Target: CLI software for listed companies

## 1. Scope

Build a CLI tool that downloads public financial statements and computes equity value using DCF plus simulation.

Confirmed decisions:
- Markets: Japan + United States listed companies
- Data sources: public disclosures only (EDINET, TDnet, EDGAR)
- Initial release: local CLI only
- Industry coverage: non-financial companies only
- Assumptions: auto-estimation with optional manual overrides
- Outputs: point estimate plus valuation range (P10/P50/P90)
- Update trigger: earnings-disclosure based updates
- Accuracy target: hybrid score (market-tracking + fundamental-consistency)

## 2. Approaches Considered

### Approach A: Pipeline-separated architecture (selected)
Separate ingestion, parsing, normalization, assumptions, valuation, and reporting.
- Pros: clear boundaries, safer JP/US adaptation, easier precision upgrades
- Cons: slightly heavier initial design effort

### Approach B: Single direct flow
One linear module from download to valuation.
- Pros: fastest initial implementation
- Cons: weak maintainability with cross-country accounting differences

### Approach C: Full plugin-first architecture
Data and models are plugin-swappable from day one.
- Pros: highest long-term extensibility
- Cons: over-engineering risk for initial release

## 3. Selected Architecture

Use a six-layer pipeline:
1. `ingest`: fetch filings and metadata (filing date, period, document id)
2. `parse`: extract required statement items from XBRL/HTML
3. `normalize`: map JP/US fields into a shared non-financial data model
4. `assumption`: auto-estimate DCF assumptions; apply CLI overrides
5. `valuation`: run DCF and simulation for P10/P50/P90
6. `evaluation/report`: compute hybrid quality score and export outputs

Design rules:
- Disclosure-cycle updates only
- Financial-sector entities are explicitly excluded in v1
- Each layer must be independently testable

## 4. Core Data Model

- `Company`: ticker, country, currency, fiscal_year_end, shares_outstanding
- `StatementHistory`: revenue, EBIT, tax_expense, D&A, CAPEX, working_capital, cash, debt
- `MarketData`: price, risk_free_rate, equity_risk_premium, beta_proxy
- `Assumptions`: auto values + optional override values
  - rev_growth, EBIT_margin, reinvestment_rate, WACC, terminal_growth
- `ValuationResult`: enterprise_value, equity_value, value_per_share, P10/P50/P90,
  tracking_score, fundamental_score, hybrid_score

## 5. Calculation Flow

1. Detect latest target filing by disclosure schedule
2. Download and parse statements
3. Normalize and validate units/currency/period alignment
4. Auto-estimate DCF assumptions
5. Apply user overrides when provided
6. Run FCFF-based DCF point estimate
7. Run simulation on uncertain parameters
8. Output P10/P50/P90
9. Compute hybrid score from:
   - market-tracking component
   - fundamental-consistency component
10. Export result package (JSON/CSV)

## 6. Error Handling

- Ingestion failures: retry with backoff; keep typed error logs
- Missing required financial fields: hard-stop with `missing_required_fields`
- Unit mismatch (thousand/million): auto-correct and log correction metadata
- Invalid valuation constraints (for example WACC <= terminal growth): hard-stop
- Persistently negative FCFF: continue with `low_confidence` flag
- If full report export fails: always emit minimal error JSON with trace id

## 7. Verification Strategy

Test layers:
- Unit tests for assumption estimation, DCF engine, quantile computation, hybrid scoring
- Golden regression tests on representative JP/US non-financial tickers
- Data contract tests for EDINET/TDnet/EDGAR parsing inputs
- CLI end-to-end test: ticker -> download -> valuation -> output files

Success criteria for v1:
- Non-financial JP/US samples complete without fatal parser errors
- Point estimate and P10/P50/P90 are always produced on valid inputs
- Re-runs with fixed inputs stay within deterministic tolerance
- All required tests pass in CI/local automation

## 8. Out of Scope (v1)

- Financial sector models (banks, insurers, securities)
- Paid data providers
- Web UI
- Full intraday/daily refresh scheduling

## 9. Transition

Next step after this approved design is to create an implementation plan using the `writing-plans` workflow.
