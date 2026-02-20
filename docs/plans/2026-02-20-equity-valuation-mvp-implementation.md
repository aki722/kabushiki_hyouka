# Equity Valuation MVP Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a ticker-only CLI that ingests JP/US public disclosures (EDINET/TDnet/EDGAR), values non-financial companies with DCF, and outputs point estimate plus P10/P50/P90.

**Architecture:** Use shared valuation/domain logic with thin provider adapters. Keep source-specific ingestion/parsing inside provider modules, then normalize to a common schema before eligibility checks and valuation. Return typed errors with stable codes and always write structured output files.

**Tech Stack:** Node.js (CommonJS), built-in `node:test` + `assert/strict`, built-in `fetch`, `fs`, `path`, optional `fast-xml-parser` for XBRL extraction.

---

### Task 1: Bootstrap CLI Skeleton and Test Script

**Files:**
- Create: `src/equity-valuation/cli/parse-args.js`
- Create: `src/equity-valuation/cli/main.js`
- Create: `tests/equity-valuation/cli/parse-args.test.js`
- Modify: `package.json`

**Step 1: Write the failing test**

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const { parseArgs } = require('../../../src/equity-valuation/cli/parse-args');

test('parseArgs accepts one positional ticker', () => {
  const out = parseArgs(['7203']);
  assert.equal(out.ticker, '7203');
});

test('parseArgs throws when ticker missing', () => {
  assert.throws(() => parseArgs([]), /missing_ticker/);
});
```

**Step 2: Run test to verify it fails**

Run: `node --test tests/equity-valuation/cli/parse-args.test.js`  
Expected: FAIL with module-not-found for `parse-args.js`.

**Step 3: Write minimal implementation**

```js
function parseArgs(argv) {
  const ticker = argv[0];
  if (!ticker) throw new Error('missing_ticker');
  return { ticker: String(ticker).trim().toUpperCase() };
}

module.exports = { parseArgs };
```

**Step 4: Run test to verify it passes**

Run: `node --test tests/equity-valuation/cli/parse-args.test.js`  
Expected: PASS.

**Step 5: Add npm scripts**

Update `package.json`:

```json
{
  "scripts": {
    "test:equity": "node --test tests/equity-valuation/**/*.test.js",
    "value:stock": "node src/equity-valuation/cli/main.js"
  }
}
```

**Step 6: Commit**

```bash
git add package.json src/equity-valuation/cli tests/equity-valuation/cli
git commit -m "feat(equity-cli): add ticker-only CLI skeleton"
```

### Task 2: Add Market Resolver (Ticker-Only Auto Detection)

**Files:**
- Create: `src/equity-valuation/market/resolve-market.js`
- Create: `tests/equity-valuation/market/resolve-market.test.js`

**Step 1: Write the failing test**

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const { resolveMarket } = require('../../../src/equity-valuation/market/resolve-market');

test('numeric 4-digit ticker resolves to JP', () => {
  assert.equal(resolveMarket('7203').country, 'JP');
});

test('alpha ticker resolves to US', () => {
  assert.equal(resolveMarket('AAPL').country, 'US');
});

test('unknown format throws market_resolution_failed', () => {
  assert.throws(() => resolveMarket('12AB34'), /market_resolution_failed/);
});
```

**Step 2: Run test to verify it fails**

Run: `node --test tests/equity-valuation/market/resolve-market.test.js`  
Expected: FAIL with module-not-found.

**Step 3: Write minimal implementation**

```js
function resolveMarket(ticker) {
  if (/^\d{4}$/.test(ticker)) return { country: 'JP' };
  if (/^[A-Z.\-]{1,10}$/.test(ticker) && /[A-Z]/.test(ticker)) return { country: 'US' };
  throw new Error('market_resolution_failed');
}

module.exports = { resolveMarket };
```

**Step 4: Run test to verify it passes**

Run: `node --test tests/equity-valuation/market/resolve-market.test.js`  
Expected: PASS.

**Step 5: Commit**

```bash
git add src/equity-valuation/market tests/equity-valuation/market
git commit -m "feat(market): add JP/US auto resolver for ticker-only input"
```

### Task 3: Add Typed Error Utility and Reporter Contract

**Files:**
- Create: `src/equity-valuation/errors/create-app-error.js`
- Create: `src/equity-valuation/output/write-error-report.js`
- Create: `tests/equity-valuation/errors/create-app-error.test.js`
- Create: `tests/equity-valuation/output/write-error-report.test.js`

**Step 1: Write the failing tests**

```js
test('createAppError preserves code and metadata', () => {
  const err = createAppError('missing_required_fields', 'normalize', { ticker: '7203' });
  assert.equal(err.code, 'missing_required_fields');
  assert.equal(err.stage, 'normalize');
});

test('writeErrorReport writes structured json', () => {
  const file = writeErrorReport('output/equity-valuation', {
    code: 'unsupported_sector',
    message: 'sector not supported',
    stage: 'eligibility',
    ticker: '8306'
  });
  assert.ok(file.endsWith('error.json'));
});
```

**Step 2: Run tests to verify failure**

Run: `node --test tests/equity-valuation/errors/create-app-error.test.js tests/equity-valuation/output/write-error-report.test.js`  
Expected: FAIL with missing modules.

**Step 3: Write minimal implementation**

```js
function createAppError(code, stage, meta = {}) {
  const err = new Error(code);
  err.code = code;
  err.stage = stage;
  Object.assign(err, meta);
  return err;
}

module.exports = { createAppError };
```

```js
const fs = require('node:fs');
const path = require('node:path');

function writeErrorReport(outputDir, error) {
  fs.mkdirSync(outputDir, { recursive: true });
  const traceId = error.traceId || `trace-${Date.now()}`;
  const payload = { ...error, traceId };
  const filePath = path.join(outputDir, 'error.json');
  fs.writeFileSync(filePath, JSON.stringify(payload, null, 2));
  return filePath;
}

module.exports = { writeErrorReport };
```

**Step 4: Run tests to verify pass**

Run: `node --test tests/equity-valuation/errors/create-app-error.test.js tests/equity-valuation/output/write-error-report.test.js`  
Expected: PASS.

**Step 5: Commit**

```bash
git add src/equity-valuation/errors src/equity-valuation/output tests/equity-valuation/errors tests/equity-valuation/output
git commit -m "feat(errors): add typed app errors and structured error reporter"
```

### Task 4: Implement US Ingestion Adapter (EDGAR)

**Files:**
- Create: `src/equity-valuation/providers/edgar/resolve-cik.js`
- Create: `src/equity-valuation/providers/edgar/fetch-company-profile.js`
- Create: `src/equity-valuation/providers/edgar/fetch-latest-statement.js`
- Create: `tests/equity-valuation/providers/edgar/resolve-cik.test.js`
- Create: `tests/equity-valuation/providers/edgar/fetch-latest-statement.test.js`
- Create: `tests/fixtures/equity-valuation/edgar/company_tickers.sample.json`
- Create: `tests/fixtures/equity-valuation/edgar/companyfacts.aapl.sample.json`

**Step 1: Write the failing tests**

```js
test('resolveCik finds CIK from ticker dataset', async () => {
  const cik = await resolveCik('AAPL', { fixture: 'tests/fixtures/equity-valuation/edgar/company_tickers.sample.json' });
  assert.equal(cik, '0000320193');
});

test('fetchLatestStatement extracts required statement fields', async () => {
  const s = await fetchLatestStatement('AAPL', { fixture: 'tests/fixtures/equity-valuation/edgar/companyfacts.aapl.sample.json' });
  assert.ok(s.revenue > 0);
  assert.ok(s.ebit > 0);
  assert.ok(s.capex > 0);
});
```

**Step 2: Run tests to verify failure**

Run: `node --test tests/equity-valuation/providers/edgar/*.test.js`  
Expected: FAIL with missing modules.

**Step 3: Write minimal implementation**

- Implement ticker->CIK lookup from SEC ticker dataset (live URL by default, fixture in tests).
- Implement statement extraction from SEC companyfacts JSON for:
  - revenue
  - ebit (or operating income proxy)
  - capex (investment/capital expenditure tags)
- Throw `ingestion_failed` when required series cannot be resolved.

**Step 4: Run tests to verify pass**

Run: `node --test tests/equity-valuation/providers/edgar/*.test.js`  
Expected: PASS.

**Step 5: Commit**

```bash
git add src/equity-valuation/providers/edgar tests/equity-valuation/providers/edgar tests/fixtures/equity-valuation/edgar
git commit -m "feat(provider-edgar): add US ingestion adapter with fixture-backed tests"
```

### Task 5: Implement JP Ingestion Adapter (EDINET + TDnet)

**Files:**
- Create: `src/equity-valuation/providers/jp/fetch-company-profile.js`
- Create: `src/equity-valuation/providers/jp/fetch-latest-statement.js`
- Create: `src/equity-valuation/providers/jp/extract-edinet-financials.js`
- Create: `tests/equity-valuation/providers/jp/fetch-latest-statement.test.js`
- Create: `tests/equity-valuation/providers/jp/extract-edinet-financials.test.js`
- Create: `tests/fixtures/equity-valuation/jp/edinet-doc-list.sample.json`
- Create: `tests/fixtures/equity-valuation/jp/edinet-xbrl.sample.xml`
- Create: `tests/fixtures/equity-valuation/jp/tdnet-company.sample.json`

**Step 1: Write the failing tests**

```js
test('fetchLatestStatement (JP) returns required normalized raw fields', async () => {
  const s = await fetchLatestStatement('7203', { useFixtures: true });
  assert.ok(s.revenue > 0);
  assert.ok(s.ebit > 0);
  assert.ok(s.capex > 0);
});

test('fetchCompanyProfile (JP) returns sector for eligibility gate', async () => {
  const p = await fetchCompanyProfile('7203', { useFixtures: true });
  assert.equal(typeof p.sector, 'string');
});
```

**Step 2: Run tests to verify failure**

Run: `node --test tests/equity-valuation/providers/jp/*.test.js`  
Expected: FAIL with missing modules.

**Step 3: Write minimal implementation**

- Use EDINET latest filing list and document retrieval as primary source.
- Use TDnet (or prepared fallback metadata source) for sector/profile enrichment when needed.
- Extract statement fields from JP filing payload into raw financial object.
- Throw `ingestion_failed` when source fetch/parse cannot complete.

**Step 4: Run tests to verify pass**

Run: `node --test tests/equity-valuation/providers/jp/*.test.js`  
Expected: PASS.

**Step 5: Commit**

```bash
git add src/equity-valuation/providers/jp tests/equity-valuation/providers/jp tests/fixtures/equity-valuation/jp
git commit -m "feat(provider-jp): add EDINET/TDnet ingestion adapter with fixture-backed tests"
```

### Task 6: Build Common Normalization and Eligibility Gate

**Files:**
- Create: `src/equity-valuation/domain/normalize-statement.js`
- Create: `src/equity-valuation/domain/validate-eligibility.js`
- Create: `tests/equity-valuation/domain/normalize-statement.test.js`
- Create: `tests/equity-valuation/domain/validate-eligibility.test.js`

**Step 1: Write the failing tests**

```js
test('normalizeStatement maps required and optional fields', () => {
  const out = normalizeStatement({ revenue: 100, ebit: 10, capex: 5 });
  assert.equal(out.revenue, 100);
  assert.equal(out.taxExpense, 0);
});

test('normalizeStatement throws missing_required_fields', () => {
  assert.throws(() => normalizeStatement({ revenue: 100 }), /missing_required_fields/);
});

test('validateEligibility rejects financial sectors', () => {
  assert.throws(() => validateEligibility({ sector: 'Banks' }), /unsupported_sector/);
});
```

**Step 2: Run tests to verify failure**

Run: `node --test tests/equity-valuation/domain/*.test.js`  
Expected: FAIL with missing modules.

**Step 3: Write minimal implementation**

- `normalizeStatement` must enforce required fields (`revenue`, `ebit`, `capex`) and default optional fields to zero.
- `validateEligibility` must block banks/insurance/securities families with `unsupported_sector`.

**Step 4: Run tests to verify pass**

Run: `node --test tests/equity-valuation/domain/*.test.js`  
Expected: PASS.

**Step 5: Commit**

```bash
git add src/equity-valuation/domain tests/equity-valuation/domain
git commit -m "feat(domain): add shared normalization and non-financial gate"
```

### Task 7: Implement Valuation Core (Assumptions, DCF, Simulation, Hybrid Score)

**Files:**
- Create: `src/equity-valuation/model/estimate-assumptions.js`
- Create: `src/equity-valuation/model/run-dcf.js`
- Create: `src/equity-valuation/model/run-simulation.js`
- Create: `src/equity-valuation/scoring/compute-hybrid-score.js`
- Create: `tests/equity-valuation/model/estimate-assumptions.test.js`
- Create: `tests/equity-valuation/model/run-dcf.test.js`
- Create: `tests/equity-valuation/model/run-simulation.test.js`
- Create: `tests/equity-valuation/scoring/compute-hybrid-score.test.js`

**Step 1: Write the failing tests**

```js
test('estimateAssumptions enforces wacc > terminalGrowth', () => {
  assert.throws(() => estimateAssumptions({ history: [{ revenue: 100 }, { revenue: 110 }] }, { wacc: 0.02, terminalGrowth: 0.03 }), /invalid_discount_constraints/);
});

test('runDcf returns positive valuation metrics for valid inputs', () => {
  const r = runDcf({ fcffBase: 100, assumptions: { revGrowth: 0.03, wacc: 0.09, terminalGrowth: 0.02 }, debt: 200, cash: 50, sharesOutstanding: 100 });
  assert.ok(r.valuePerShare > 0);
});

test('runSimulation returns ordered quantiles', () => {
  const q = runSimulation(() => 100, { iterations: 100, seed: 42 });
  assert.ok(q.p10 <= q.p50 && q.p50 <= q.p90);
});
```

**Step 2: Run tests to verify failure**

Run: `node --test tests/equity-valuation/model/*.test.js tests/equity-valuation/scoring/*.test.js`  
Expected: FAIL with missing modules.

**Step 3: Write minimal implementation**

- Implement deterministic assumption estimation with override merge.
- Implement 5-year FCFF DCF with terminal value.
- Implement seeded simulation helper (deterministic under test).
- Implement `computeHybridScore` as weighted average (start with 50/50).

**Step 4: Run tests to verify pass**

Run: `node --test tests/equity-valuation/model/*.test.js tests/equity-valuation/scoring/*.test.js`  
Expected: PASS.

**Step 5: Commit**

```bash
git add src/equity-valuation/model src/equity-valuation/scoring tests/equity-valuation/model tests/equity-valuation/scoring
git commit -m "feat(valuation): add DCF core, simulation, and hybrid score"
```

### Task 8: Build Pipeline Orchestrator and Success Reporter

**Files:**
- Create: `src/equity-valuation/pipeline/run-valuation.js`
- Create: `src/equity-valuation/providers/index.js`
- Create: `src/equity-valuation/output/write-report.js`
- Create: `tests/equity-valuation/pipeline/run-valuation.test.js`
- Create: `tests/equity-valuation/output/write-report.test.js`

**Step 1: Write the failing tests**

```js
test('runValuation returns point estimate and quantiles', async () => {
  const result = await runValuation({ ticker: 'AAPL' }, mockAdapters);
  assert.ok(result.valuePerShare > 0);
  assert.ok(result.p10 <= result.p50 && result.p50 <= result.p90);
});

test('writeReport writes json and csv files', () => {
  const files = writeReport('output/equity-valuation', { ticker: 'AAPL', valuePerShare: 123, p10: 100, p50: 120, p90: 140 });
  assert.equal(files.length, 2);
});
```

**Step 2: Run tests to verify failure**

Run: `node --test tests/equity-valuation/pipeline/run-valuation.test.js tests/equity-valuation/output/write-report.test.js`  
Expected: FAIL with missing modules.

**Step 3: Write minimal implementation**

- In `run-valuation.js`, connect resolver -> provider -> normalize -> eligibility -> valuation -> report payload.
- In `providers/index.js`, dispatch JP/US adapters by resolved market.
- In `write-report.js`, emit `result.json` and `result.csv`.

**Step 4: Run tests to verify pass**

Run: `node --test tests/equity-valuation/pipeline/run-valuation.test.js tests/equity-valuation/output/write-report.test.js`  
Expected: PASS.

**Step 5: Commit**

```bash
git add src/equity-valuation/pipeline src/equity-valuation/providers/index.js src/equity-valuation/output/write-report.js tests/equity-valuation/pipeline tests/equity-valuation/output
git commit -m "feat(pipeline): orchestrate valuation flow and success reporting"
```

### Task 9: Wire CLI End-to-End and Typed Failure Paths

**Files:**
- Modify: `src/equity-valuation/cli/main.js`
- Create: `tests/equity-valuation/cli/main.test.js`

**Step 1: Write the failing tests**

```js
test('CLI success path writes output files', async () => {
  const exitCode = await runCliForTest(['AAPL'], { adapters: mockAdapters });
  assert.equal(exitCode, 0);
});

test('CLI writes error.json on unsupported sector', async () => {
  const exitCode = await runCliForTest(['8306'], { adapters: mockFinancialSectorAdapters });
  assert.equal(exitCode, 1);
});
```

**Step 2: Run test to verify failure**

Run: `node --test tests/equity-valuation/cli/main.test.js`  
Expected: FAIL with missing handlers.

**Step 3: Write minimal implementation**

- Parse ticker and call `runValuation`.
- On success, call `writeReport`.
- On typed failure, call `writeErrorReport` and return non-zero exit code.

**Step 4: Run test to verify pass**

Run: `node --test tests/equity-valuation/cli/main.test.js`  
Expected: PASS.

**Step 5: Commit**

```bash
git add src/equity-valuation/cli/main.js tests/equity-valuation/cli/main.test.js
git commit -m "feat(cli): wire end-to-end flow with typed failure reporting"
```

### Task 10: Add Fixed-Ticker Regression Suite and Documentation

**Files:**
- Create: `tests/equity-valuation/regression/fixed-tickers.test.js`
- Create: `tests/fixtures/equity-valuation/regression/baseline.json`
- Create: `README.md`
- Modify: `package.json`

**Step 1: Write the failing regression test**

```js
test('three fixed tickers stay within tolerance window', async () => {
  const baseline = require('../../fixtures/equity-valuation/regression/baseline.json');
  for (const ticker of Object.keys(baseline)) {
    const result = await runValuation({ ticker }, fixtureAdapters);
    assert.ok(Math.abs(result.valuePerShare - baseline[ticker].valuePerShare) <= baseline[ticker].tolerance);
  }
});
```

**Step 2: Run regression test to verify failure**

Run: `node --test tests/equity-valuation/regression/fixed-tickers.test.js`  
Expected: FAIL until baseline fixture and glue are complete.

**Step 3: Add baseline fixture and README usage**

- Fill `baseline.json` with 3 fixed non-financial tickers (JP/US mix) and tolerance values.
- Add `README.md` sections:
  - install + run command
  - output file schema
  - known error codes
  - how to run regression tests

**Step 4: Add/verify npm scripts**

Ensure `package.json` includes:

```json
{
  "scripts": {
    "test:equity": "node --test tests/equity-valuation/**/*.test.js",
    "value:stock": "node src/equity-valuation/cli/main.js"
  }
}
```

**Step 5: Run full equity suite**

Run: `npm run test:equity`  
Expected: PASS all tests in `tests/equity-valuation`.

**Step 6: Commit**

```bash
git add tests/equity-valuation/regression tests/fixtures/equity-valuation/regression README.md package.json
git commit -m "chore(equity): add fixed-ticker regression suite and usage docs"
```

## Verification Checklist Before Completion

- Run: `npm run test:equity`
- Run: `npm run value:stock -- AAPL` (or JP ticker) and confirm `result.json`/`result.csv`
- Run one forced error case and confirm `error.json` structure
- Confirm regression test includes exactly 3 fixed tickers

## Implementation Notes

- Use `@test-driven-development` for every task.
- Use `@systematic-debugging` immediately when any test fails unexpectedly.
- Use `@verification-before-completion` before claiming success.
- Keep commits task-scoped and small.
