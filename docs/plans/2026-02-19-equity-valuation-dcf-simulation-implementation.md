# Equity Valuation DCF Simulation Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a CLI that ingests JP/US public filings and outputs DCF point value plus P10/P50/P90 valuation range for non-financial listed companies.

**Architecture:** Keep a pipeline-separated structure: ingest -> parse/normalize -> assumptions -> valuation -> simulation -> scoring -> report. Each stage is independently testable and can fail with typed errors. Initial implementation uses disclosure-driven execution, no web UI, and no paid data sources.

**Tech Stack:** Node.js (CommonJS), built-in `node:test`, `assert/strict`, `fs`, `path`, optional `fast-xml-parser` for XBRL parsing, CSV output via small local serializer.

---

### Task 1: CLI Scaffold and Argument Parsing

**Files:**
- Create: `src/equity-valuation/cli/parse-args.js`
- Create: `src/equity-valuation/cli/main.js`
- Test: `tests/equity-valuation/cli/parse-args.test.js`
- Modify: `package.json`

**Step 1: Write the failing test**

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const { parseArgs } = require('../../../src/equity-valuation/cli/parse-args');

test('parseArgs reads required flags', () => {
  const args = parseArgs(['--ticker', '7203', '--country', 'JP']);
  assert.equal(args.ticker, '7203');
  assert.equal(args.country, 'JP');
});
```

**Step 2: Run test to verify it fails**

Run: `node --test tests/equity-valuation/cli/parse-args.test.js`
Expected: FAIL with module not found.

**Step 3: Write minimal implementation**

```js
function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 2) {
    out[argv[i].replace('--', '')] = argv[i + 1];
  }
  if (!out.ticker || !out.country) throw new Error('missing_required_args');
  return out;
}
module.exports = { parseArgs };
```

**Step 4: Run test to verify it passes**

Run: `node --test tests/equity-valuation/cli/parse-args.test.js`
Expected: PASS.

**Step 5: Commit**

```bash
git add package.json src/equity-valuation/cli tests/equity-valuation/cli
git commit -m "feat(cli): add valuation CLI argument parser"
```

### Task 2: Common Financial Schema and Non-Financial Gate

**Files:**
- Create: `src/equity-valuation/domain/validate-company.js`
- Create: `src/equity-valuation/domain/normalize-statement.js`
- Test: `tests/equity-valuation/domain/validate-company.test.js`
- Test: `tests/equity-valuation/domain/normalize-statement.test.js`

**Step 1: Write the failing tests**

```js
test('validateCompany rejects financial sector entities', () => {
  assert.throws(() => validateCompany({ sector: 'Banks' }), /unsupported_sector/);
});

test('normalizeStatement maps required keys', () => {
  const normalized = normalizeStatement({ revenue: 100, ebit: 10, capex: 5 });
  assert.equal(normalized.revenue, 100);
  assert.equal(normalized.ebit, 10);
  assert.equal(normalized.capex, 5);
});
```

**Step 2: Run tests to verify failure**

Run: `node --test tests/equity-valuation/domain/*.test.js`
Expected: FAIL with missing modules.

**Step 3: Write minimal implementation**

```js
function validateCompany(company) {
  const blocked = new Set(['Banks', 'Insurance', 'Securities']);
  if (blocked.has(company.sector)) throw new Error('unsupported_sector');
}

function normalizeStatement(raw) {
  const required = ['revenue', 'ebit', 'capex'];
  for (const key of required) {
    if (raw[key] == null) throw new Error('missing_required_fields');
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
```

**Step 4: Run tests to verify pass**

Run: `node --test tests/equity-valuation/domain/*.test.js`
Expected: PASS.

**Step 5: Commit**

```bash
git add src/equity-valuation/domain tests/equity-valuation/domain
git commit -m "feat(domain): add non-financial guard and statement normalization"
```

### Task 3: Assumption Estimator with Overrides

**Files:**
- Create: `src/equity-valuation/model/estimate-assumptions.js`
- Test: `tests/equity-valuation/model/estimate-assumptions.test.js`

**Step 1: Write failing tests**

```js
test('estimateAssumptions returns auto values from history', () => {
  const assumptions = estimateAssumptions({ history: [{ revenue: 100 }, { revenue: 110 }] }, {});
  assert.ok(assumptions.revGrowth > 0);
  assert.ok(assumptions.wacc > assumptions.terminalGrowth);
});

test('manual override replaces auto value', () => {
  const assumptions = estimateAssumptions({ history: [{ revenue: 100 }, { revenue: 110 }] }, { wacc: 0.11 });
  assert.equal(assumptions.wacc, 0.11);
});
```

**Step 2: Run tests to verify failure**

Run: `node --test tests/equity-valuation/model/estimate-assumptions.test.js`
Expected: FAIL with missing module.

**Step 3: Write minimal implementation**

```js
function estimateAssumptions(input, overrides = {}) {
  const history = input.history;
  const first = history[0].revenue;
  const last = history[history.length - 1].revenue;
  const revGrowth = first > 0 ? (last / first) - 1 : 0;

  const auto = {
    revGrowth,
    ebitMargin: 0.12,
    reinvestmentRate: 0.35,
    wacc: 0.09,
    terminalGrowth: 0.02
  };

  const merged = { ...auto, ...overrides };
  if (merged.wacc <= merged.terminalGrowth) throw new Error('invalid_discount_constraints');
  return merged;
}
module.exports = { estimateAssumptions };
```

**Step 4: Run tests to verify pass**

Run: `node --test tests/equity-valuation/model/estimate-assumptions.test.js`
Expected: PASS.

**Step 5: Commit**

```bash
git add src/equity-valuation/model tests/equity-valuation/model
git commit -m "feat(model): add DCF assumption estimator with overrides"
```

### Task 4: DCF Core Engine (FCFF)

**Files:**
- Create: `src/equity-valuation/model/run-dcf.js`
- Test: `tests/equity-valuation/model/run-dcf.test.js`

**Step 1: Write failing tests**

```js
test('runDcf computes enterprise and equity value', () => {
  const result = runDcf({
    fcffBase: 100,
    assumptions: { revGrowth: 0.03, wacc: 0.09, terminalGrowth: 0.02 },
    debt: 200,
    cash: 50,
    sharesOutstanding: 100
  });
  assert.ok(result.enterpriseValue > 0);
  assert.ok(result.equityValue > 0);
  assert.ok(result.valuePerShare > 0);
});
```

**Step 2: Run tests to verify failure**

Run: `node --test tests/equity-valuation/model/run-dcf.test.js`
Expected: FAIL with missing module.

**Step 3: Write minimal implementation**

```js
function runDcf(input) {
  const years = 5;
  const { fcffBase, assumptions, debt, cash, sharesOutstanding } = input;
  const projected = [];
  for (let y = 1; y <= years; y += 1) {
    projected.push(fcffBase * Math.pow(1 + assumptions.revGrowth, y));
  }

  let pv = 0;
  for (let y = 1; y <= years; y += 1) {
    pv += projected[y - 1] / Math.pow(1 + assumptions.wacc, y);
  }

  const terminal = (projected[years - 1] * (1 + assumptions.terminalGrowth)) /
    (assumptions.wacc - assumptions.terminalGrowth);
  const terminalPv = terminal / Math.pow(1 + assumptions.wacc, years);

  const enterpriseValue = pv + terminalPv;
  const equityValue = enterpriseValue - debt + cash;
  const valuePerShare = equityValue / sharesOutstanding;

  return { enterpriseValue, equityValue, valuePerShare };
}
module.exports = { runDcf };
```

**Step 4: Run tests to verify pass**

Run: `node --test tests/equity-valuation/model/run-dcf.test.js`
Expected: PASS.

**Step 5: Commit**

```bash
git add src/equity-valuation/model/run-dcf.js tests/equity-valuation/model/run-dcf.test.js
git commit -m "feat(model): add FCFF-based DCF engine"
```

### Task 5: Simulation Quantiles and Hybrid Accuracy Score

**Files:**
- Create: `src/equity-valuation/model/run-simulation.js`
- Create: `src/equity-valuation/scoring/compute-hybrid-score.js`
- Test: `tests/equity-valuation/model/run-simulation.test.js`
- Test: `tests/equity-valuation/scoring/compute-hybrid-score.test.js`

**Step 1: Write failing tests**

```js
test('runSimulation returns p10 p50 p90 in ascending order', () => {
  const q = runSimulation(() => 100, { iterations: 200, seed: 42 });
  assert.ok(q.p10 <= q.p50 && q.p50 <= q.p90);
});

test('computeHybridScore combines tracking and fundamentals', () => {
  const score = computeHybridScore({ trackingScore: 0.7, fundamentalScore: 0.8 });
  assert.equal(score, 0.75);
});
```

**Step 2: Run tests to verify failure**

Run: `node --test tests/equity-valuation/model/run-simulation.test.js tests/equity-valuation/scoring/compute-hybrid-score.test.js`
Expected: FAIL with missing modules.

**Step 3: Write minimal implementation**

```js
function runSimulation(sampleFn, opts = {}) {
  const values = [];
  const iterations = opts.iterations ?? 1000;
  for (let i = 0; i < iterations; i += 1) values.push(sampleFn(i));
  values.sort((a, b) => a - b);

  const at = (p) => values[Math.floor((values.length - 1) * p)];
  return { p10: at(0.1), p50: at(0.5), p90: at(0.9) };
}

function computeHybridScore({ trackingScore, fundamentalScore }) {
  return Number(((trackingScore + fundamentalScore) / 2).toFixed(4));
}
```

**Step 4: Run tests to verify pass**

Run: `node --test tests/equity-valuation/model/run-simulation.test.js tests/equity-valuation/scoring/compute-hybrid-score.test.js`
Expected: PASS.

**Step 5: Commit**

```bash
git add src/equity-valuation/model/run-simulation.js src/equity-valuation/scoring/compute-hybrid-score.js tests/equity-valuation/model/run-simulation.test.js tests/equity-valuation/scoring/compute-hybrid-score.test.js
git commit -m "feat(model): add quantile simulation and hybrid scoring"
```

### Task 6: Pipeline Orchestrator and Report Output

**Files:**
- Create: `src/equity-valuation/pipeline/run-valuation.js`
- Create: `src/equity-valuation/output/write-report.js`
- Create: `tests/equity-valuation/pipeline/run-valuation.test.js`
- Create: `tests/equity-valuation/output/write-report.test.js`
- Modify: `src/equity-valuation/cli/main.js`

**Step 1: Write failing tests**

```js
test('runValuation returns point estimate and quantiles', async () => {
  const result = await runValuation({ ticker: '7203', country: 'JP' }, mockAdapters);
  assert.ok(result.valuePerShare > 0);
  assert.ok(result.p10 <= result.p50 && result.p50 <= result.p90);
});

test('writeReport writes json and csv outputs', () => {
  const files = writeReport('output/equity-valuation', { ticker: '7203', valuePerShare: 1234, p10: 1000, p50: 1200, p90: 1400 });
  assert.equal(files.length, 2);
});
```

**Step 2: Run tests to verify failure**

Run: `node --test tests/equity-valuation/pipeline/run-valuation.test.js tests/equity-valuation/output/write-report.test.js`
Expected: FAIL with missing modules.

**Step 3: Write minimal implementation**

```js
async function runValuation(args, adapters) {
  const company = await adapters.ingestCompany(args);
  adapters.validateCompany(company);

  const statement = await adapters.ingestStatement(args);
  const normalized = adapters.normalizeStatement(statement);
  const assumptions = adapters.estimateAssumptions({ history: [normalized] }, args.overrides || {});

  const point = adapters.runDcf({
    fcffBase: normalized.ebit * (1 - 0.3),
    assumptions,
    debt: normalized.debt,
    cash: normalized.cash,
    sharesOutstanding: company.sharesOutstanding
  });

  const quantiles = adapters.runSimulation(() => point.valuePerShare, { iterations: 500 });
  const hybridScore = adapters.computeHybridScore({ trackingScore: 0.7, fundamentalScore: 0.8 });

  return { ...point, ...quantiles, hybridScore, ticker: args.ticker };
}
```

**Step 4: Run tests to verify pass**

Run: `node --test tests/equity-valuation/pipeline/run-valuation.test.js tests/equity-valuation/output/write-report.test.js`
Expected: PASS.

**Step 5: Commit**

```bash
git add src/equity-valuation/pipeline src/equity-valuation/output src/equity-valuation/cli/main.js tests/equity-valuation/pipeline tests/equity-valuation/output
git commit -m "feat(pipeline): orchestrate valuation flow and reporting"
```

### Task 7: Disclosure-Triggered Update Command

**Files:**
- Create: `src/equity-valuation/jobs/check-disclosures.js`
- Create: `tests/equity-valuation/jobs/check-disclosures.test.js`
- Modify: `package.json`

**Step 1: Write failing test**

```js
test('checkDisclosures returns changed tickers from filing metadata', () => {
  const changed = checkDisclosures([
    { ticker: '7203', filingId: 'A' },
    { ticker: '7203', filingId: 'B' }
  ], { '7203': 'A' });
  assert.deepEqual(changed, ['7203']);
});
```

**Step 2: Run test to verify failure**

Run: `node --test tests/equity-valuation/jobs/check-disclosures.test.js`
Expected: FAIL with missing module.

**Step 3: Write minimal implementation**

```js
function checkDisclosures(latestFilings, lastSeenMap) {
  const changed = [];
  for (const filing of latestFilings) {
    if (lastSeenMap[filing.ticker] !== filing.filingId) changed.push(filing.ticker);
  }
  return [...new Set(changed)];
}
module.exports = { checkDisclosures };
```

**Step 4: Run test to verify pass**

Run: `node --test tests/equity-valuation/jobs/check-disclosures.test.js`
Expected: PASS.

**Step 5: Commit**

```bash
git add src/equity-valuation/jobs tests/equity-valuation/jobs package.json
git commit -m "feat(jobs): add disclosure-based update detection"
```

### Task 8: Final Verification Bundle

**Files:**
- Modify: `package.json`
- Modify: `README.md` (create if missing)

**Step 1: Write failing smoke test (if not present)**

```js
test('CLI smoke: returns report for mock ticker', async () => {
  // invoke main handler with fixture adapters and assert output paths
});
```

**Step 2: Run full test suite**

Run: `node --test tests/equity-valuation/**/*.test.js`
Expected: PASS all equity-valuation tests.

**Step 3: Add developer commands**

```json
{
  "scripts": {
    "test:equity": "node --test tests/equity-valuation/**/*.test.js",
    "value:stock": "node src/equity-valuation/cli/main.js"
  }
}
```

**Step 4: Re-run verification**

Run: `npm run test:equity`
Expected: PASS.

**Step 5: Commit**

```bash
git add package.json README.md tests/equity-valuation src/equity-valuation
git commit -m "chore(equity-valuation): finalize verification and developer scripts"
```

## Implementation Notes

- Use `@test-driven-development` for every task in this plan.
- Use `@verification-before-completion` before claiming final success.
- Keep each commit narrow and task-scoped.
- Do not include financial-sector logic in v1.
- Preserve deterministic test behavior by fixing random seeds in simulation tests.
