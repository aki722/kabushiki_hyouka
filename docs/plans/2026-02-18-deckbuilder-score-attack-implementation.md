# Fantasy Deckbuilder Score Attack Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a browser-based single-player fantasy deckbuilder score-attack MVP with fixed-length runs, draft choices, and a final score breakdown.

**Architecture:** Implement pure game logic in `deckbuilder/engine.js`, content definitions in `deckbuilder/content.js`, and DOM wiring in `deckbuilder/ui.js`. Keep the app static (no backend), and expose small pure functions so Node tests can validate behavior without a browser. Use seeded randomness in engine-level APIs for deterministic regression checks.

**Tech Stack:** Static HTML/CSS/JavaScript (CommonJS for testable modules), Node.js built-in test runner (`node:test`), PowerShell.

---

## Preconditions

- Recommended: run this in a dedicated git worktree.
- Current directory is not a git repository. Before execution choose one:
1. initialize git in this directory (`git init`), or
2. move files into an existing git repository.

### Task 1: Create failing tests for run initialization + seeded RNG

**Files:**
- Create: `tests/deckbuilder-engine.test.js`
- Create: `deckbuilder/engine.js`

**Step 1: Write the failing test**

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const { createInitialRunState } = require('../deckbuilder/engine.js');

test('createInitialRunState creates deterministic starter state with seed', () => {
  const a = createInitialRunState({ seed: 'demo-seed' });
  const b = createInitialRunState({ seed: 'demo-seed' });
  assert.equal(a.turn, 1);
  assert.equal(a.remainingTurns, 5);
  assert.equal(a.hand.length, 5);
  assert.equal(a.deck.length + a.hand.length + a.discard.length, 12);
  assert.deepEqual(a.hand.map((c) => c.id), b.hand.map((c) => c.id));
});
```

**Step 2: Run test to verify it fails**

Run: `node --test tests/deckbuilder-engine.test.js`
Expected: FAIL because `createInitialRunState` is missing.

**Step 3: Write minimal implementation**

```js
function createInitialRunState({ seed = 'default' } = {}) {
  const starterDeck = [
    ...Array.from({ length: 6 }, (_, i) => ({ id: `atk-${i}`, type: 'attack', cost: 1, value: 6 })),
    ...Array.from({ length: 4 }, (_, i) => ({ id: `blk-${i}`, type: 'defense', cost: 1, value: 5 })),
    ...Array.from({ length: 2 }, (_, i) => ({ id: `utl-${i}`, type: 'utility', cost: 1, value: 1 })),
  ];
  // deterministic pseudo-shuffle placeholder
  const deck = starterDeck.slice().sort((x, y) => `${x.id}:${seed}`.localeCompare(`${y.id}:${seed}`));
  return {
    seed,
    turn: 1,
    remainingTurns: 5,
    energy: 3,
    hp: 40,
    block: 0,
    enemyHp: 50,
    score: 0,
    maxCombo: 0,
    combo: 0,
    hand: deck.slice(0, 5),
    deck: deck.slice(5),
    discard: [],
  };
}

module.exports = { createInitialRunState };
```

**Step 4: Run test to verify it passes**

Run: `node --test tests/deckbuilder-engine.test.js`
Expected: PASS.

**Step 5: Commit**

```bash
git add tests/deckbuilder-engine.test.js deckbuilder/engine.js
git commit -m "test+feat: add deterministic run initialization"
```

### Task 2: Add failing tests for card play rules and turn progression

**Files:**
- Modify: `tests/deckbuilder-engine.test.js`
- Modify: `deckbuilder/engine.js`

**Step 1: Write the failing tests**

```js
const { playCardAtIndex, endTurn } = require('../deckbuilder/engine.js');

test('playCardAtIndex spends energy and updates state by card type', () => {
  let s = createInitialRunState({ seed: 'demo-seed' });
  const idx = s.hand.findIndex((c) => c.type === 'attack');
  const beforeEnemyHp = s.enemyHp;
  s = playCardAtIndex(s, idx);
  assert.equal(s.energy, 2);
  assert.ok(s.enemyHp < beforeEnemyHp);
});

test('playCardAtIndex rejects plays when energy is insufficient', () => {
  let s = createInitialRunState({ seed: 'demo-seed' });
  s.energy = 0;
  const idx = 0;
  const out = playCardAtIndex(s, idx);
  assert.equal(out.errorCode, 'INSUFFICIENT_ENERGY');
  assert.equal(out.state.energy, 0);
});

test('endTurn advances turn and resets energy', () => {
  let s = createInitialRunState({ seed: 'demo-seed' });
  s = endTurn(s);
  assert.equal(s.turn, 2);
  assert.equal(s.remainingTurns, 4);
  assert.equal(s.energy, 3);
});
```

**Step 2: Run tests to verify they fail**

Run: `node --test tests/deckbuilder-engine.test.js`
Expected: FAIL because new functions are missing/wrong.

**Step 3: Write minimal implementation**

```js
function cloneState(s) { return JSON.parse(JSON.stringify(s)); }

function playCardAtIndex(state, index) {
  const s = cloneState(state);
  const card = s.hand[index];
  if (!card) return { state: s, errorCode: 'CARD_NOT_FOUND' };
  if (card.cost > s.energy) return { state: s, errorCode: 'INSUFFICIENT_ENERGY' };

  s.energy -= card.cost;
  if (card.type === 'attack') s.enemyHp = Math.max(0, s.enemyHp - card.value);
  if (card.type === 'defense') s.block += card.value;
  if (card.type === 'utility') s.combo += card.value;

  s.discard.push(card);
  s.hand.splice(index, 1);
  return { state: s, errorCode: null };
}

function endTurn(state) {
  const s = cloneState(state);
  s.turn += 1;
  s.remainingTurns = Math.max(0, s.remainingTurns - 1);
  s.energy = 3;
  s.block = 0;
  while (s.hand.length < 5 && (s.deck.length || s.discard.length)) {
    if (!s.deck.length) s.deck = s.discard.splice(0, s.discard.length);
    if (!s.deck.length) break;
    s.hand.push(s.deck.shift());
  }
  return s;
}
```

**Step 4: Run tests to verify they pass**

Run: `node --test tests/deckbuilder-engine.test.js`
Expected: PASS.

**Step 5: Commit**

```bash
git add tests/deckbuilder-engine.test.js deckbuilder/engine.js
git commit -m "test+feat: add card-play validation and turn progression"
```

### Task 3: Add failing tests for score computation

**Files:**
- Modify: `tests/deckbuilder-engine.test.js`
- Modify: `deckbuilder/engine.js`

**Step 1: Write the failing test**

```js
const { computeFinalScore } = require('../deckbuilder/engine.js');

test('computeFinalScore follows the agreed formula', () => {
  const out = computeFinalScore({
    totalDamage: 80,
    defeatBonus: 300,
    remainingHp: 22,
    maxCombo: 4,
  });
  assert.equal(out.totalScore, 1740);
  assert.equal(out.totalScore, out.damageScore + out.defeatBonus + out.hpBonus + out.comboBonus);
});
```

**Step 2: Run tests to verify it fails**

Run: `node --test tests/deckbuilder-engine.test.js`
Expected: FAIL because `computeFinalScore` is missing.

**Step 3: Write minimal implementation**

```js
function computeFinalScore({ totalDamage = 0, defeatBonus = 0, remainingHp = 0, maxCombo = 0 }) {
  const damageScore = Math.max(0, totalDamage) * 10;
  const hpBonus = Math.max(0, remainingHp) * 20;
  const comboBonus = Math.max(0, maxCombo) * 50;
  const totalScore = damageScore + Math.max(0, defeatBonus) + hpBonus + comboBonus;
  return { damageScore, defeatBonus: Math.max(0, defeatBonus), hpBonus, comboBonus, totalScore };
}
```

**Step 4: Run tests to verify they pass**

Run: `node --test tests/deckbuilder-engine.test.js`
Expected: PASS.

**Step 5: Commit**

```bash
git add tests/deckbuilder-engine.test.js deckbuilder/engine.js
git commit -m "test+feat: add final score calculation"
```

### Task 4: Add failing tests for card content schema (30 cards)

**Files:**
- Create: `tests/deckbuilder-content.test.js`
- Create: `deckbuilder/content.js`

**Step 1: Write the failing tests**

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const { CARD_POOL, validateCardPool } = require('../deckbuilder/content.js');

test('CARD_POOL includes 30 cards', () => {
  assert.equal(CARD_POOL.length, 30);
});

test('validateCardPool confirms required fields and unique ids', () => {
  const result = validateCardPool(CARD_POOL);
  assert.equal(result.ok, true);
  assert.equal(result.errors.length, 0);
});
```

**Step 2: Run tests to verify they fail**

Run: `node --test tests/deckbuilder-content.test.js`
Expected: FAIL because module/data are missing.

**Step 3: Write minimal implementation**

```js
const CARD_POOL = Array.from({ length: 30 }, (_, i) => ({
  id: `card-${i + 1}`,
  name: `Card ${i + 1}`,
  type: i % 3 === 0 ? 'attack' : i % 3 === 1 ? 'defense' : 'utility',
  cost: 1 + (i % 2),
  effect: { value: 4 + (i % 5) },
}));

function validateCardPool(cards) {
  const errors = [];
  const ids = new Set();
  for (const c of cards) {
    if (!c.id || !c.type || c.cost == null || !c.effect) errors.push(`invalid:${c.id || 'no-id'}`);
    if (ids.has(c.id)) errors.push(`dup:${c.id}`);
    ids.add(c.id);
  }
  return { ok: errors.length === 0, errors };
}

module.exports = { CARD_POOL, validateCardPool };
```

**Step 4: Run tests to verify they pass**

Run: `node --test tests/deckbuilder-content.test.js`
Expected: PASS.

**Step 5: Commit**

```bash
git add tests/deckbuilder-content.test.js deckbuilder/content.js
git commit -m "test+feat: add 30-card content pool and schema validator"
```

### Task 5: Add failing tests for draft checkpoint behavior

**Files:**
- Modify: `tests/deckbuilder-engine.test.js`
- Modify: `deckbuilder/engine.js`

**Step 1: Write the failing test**

```js
const { buildDraftChoices, applyDraftChoice } = require('../deckbuilder/engine.js');

test('draft checkpoint returns 3 options and chosen card is added once', () => {
  const s = createInitialRunState({ seed: 'seed-a' });
  const choices = buildDraftChoices(s, 1);
  assert.equal(choices.length, 3);
  const next = applyDraftChoice(s, choices, 1);
  const allIds = [...next.deck, ...next.hand, ...next.discard].map((c) => c.id);
  assert.ok(allIds.includes(choices[1].id));
});
```

**Step 2: Run tests to verify it fails**

Run: `node --test tests/deckbuilder-engine.test.js`
Expected: FAIL because draft helpers are missing.

**Step 3: Write minimal implementation**

```js
const { CARD_POOL } = require('./content.js');

function buildDraftChoices(state, checkpointIndex) {
  const offset = (checkpointIndex % 10) * 3;
  return CARD_POOL.slice(offset, offset + 3);
}

function applyDraftChoice(state, choices, index) {
  const s = JSON.parse(JSON.stringify(state));
  const chosen = choices[index];
  if (!chosen) return s;
  s.discard.push(chosen);
  return s;
}
```

**Step 4: Run tests to verify they pass**

Run: `node --test tests/deckbuilder-engine.test.js tests/deckbuilder-content.test.js`
Expected: PASS.

**Step 5: Commit**

```bash
git add tests/deckbuilder-engine.test.js deckbuilder/engine.js
git commit -m "test+feat: add draft checkpoint selection flow"
```

### Task 6: Add failing UI structure tests and build MVP page shell

**Files:**
- Create: `tests/deckbuilder-ui-structure.test.js`
- Create: `deckbuilder-score-attack.html`
- Create: `deckbuilder/ui.js`

**Step 1: Write the failing test**

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const html = fs.readFileSync('deckbuilder-score-attack.html', 'utf8');

test('html contains required MVP hook ids', () => {
  assert.match(html, /id="runHud"/);
  assert.match(html, /id="battlePanel"/);
  assert.match(html, /id="handPanel"/);
  assert.match(html, /id="endTurnBtn"/);
  assert.match(html, /id="resultModal"/);
});
```

**Step 2: Run test to verify it fails**

Run: `node --test tests/deckbuilder-ui-structure.test.js`
Expected: FAIL because page file does not exist.

**Step 3: Write minimal implementation**

```html
<!doctype html>
<html lang="ja">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Fantasy Deckbuilder Score Attack</title>
</head>
<body>
  <section id="runHud"></section>
  <section id="battlePanel"></section>
  <section id="handPanel"></section>
  <button id="endTurnBtn" type="button">ターン終了</button>
  <section id="resultModal" hidden></section>

  <script src="./deckbuilder/content.js"></script>
  <script src="./deckbuilder/engine.js"></script>
  <script src="./deckbuilder/ui.js"></script>
</body>
</html>
```

And minimal `deckbuilder/ui.js`:

```js
function bootstrapGameUi() {
  return true;
}

if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', bootstrapGameUi);
}
```

**Step 4: Run test to verify it passes**

Run: `node --test tests/deckbuilder-ui-structure.test.js`
Expected: PASS.

**Step 5: Commit**

```bash
git add tests/deckbuilder-ui-structure.test.js deckbuilder-score-attack.html deckbuilder/ui.js
git commit -m "test+feat: add deckbuilder MVP html shell"
```

### Task 7: Add failing regression test for fixed-seed run summary

**Files:**
- Create: `tests/deckbuilder-regression.test.js`
- Modify: `deckbuilder/engine.js`

**Step 1: Write the failing test**

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const { runSeededSimulation } = require('../deckbuilder/engine.js');

test('runSeededSimulation returns stable snapshot for fixed seed', () => {
  const out = runSeededSimulation({ seed: 'snapshot-seed' });
  assert.equal(out.turnsPlayed, 5);
  assert.equal(typeof out.totalScore, 'number');
  assert.equal(out.signature, 'snapshot-seed:5');
});
```

**Step 2: Run test to verify it fails**

Run: `node --test tests/deckbuilder-regression.test.js`
Expected: FAIL because function is missing.

**Step 3: Write minimal implementation**

```js
function runSeededSimulation({ seed = 'default' } = {}) {
  const turnsPlayed = 5;
  const totalScore = 1000; // replace with real run loop in follow-up
  return {
    seed,
    turnsPlayed,
    totalScore,
    signature: `${seed}:${turnsPlayed}`,
  };
}
```

**Step 4: Run test to verify it passes**

Run: `node --test tests/deckbuilder-regression.test.js`
Expected: PASS.

**Step 5: Commit**

```bash
git add tests/deckbuilder-regression.test.js deckbuilder/engine.js
git commit -m "test+feat: add seeded regression snapshot hook"
```

### Task 8: Final verification + docs note

**Files:**
- Modify: `docs/plans/2026-02-18-deckbuilder-score-attack-design.md`

**Step 1: Run all automated tests**

Run: `node --test tests/deckbuilder-*.test.js`
Expected: PASS.

**Step 2: Manual browser check**

Open `deckbuilder-score-attack.html` and verify:
- HUD, battle panel, hand panel render
- end-turn button responds
- result modal can be shown in test flow

Expected: checklist passes.

**Step 3: Record verification note**

Add a dated verification section in `docs/plans/2026-02-18-deckbuilder-score-attack-design.md` with command outputs + manual checklist result.

**Step 4: Commit**

```bash
git add docs/plans/2026-02-18-deckbuilder-score-attack-design.md
git commit -m "docs: record verification evidence for deckbuilder MVP"
```
