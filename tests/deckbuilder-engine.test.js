const test = require('node:test');
const assert = require('node:assert/strict');

const {
  createInitialRunState,
  playCardAtIndex,
  endTurn,
  computeFinalScore,
  buildDraftChoices,
  applyDraftChoice,
} = require('../deckbuilder/engine.js');

test('createInitialRunState creates deterministic starter state with seed', () => {
  const a = createInitialRunState({ seed: 'demo-seed' });
  const b = createInitialRunState({ seed: 'demo-seed' });

  assert.equal(a.turn, 1);
  assert.equal(a.remainingTurns, 5);
  assert.equal(a.hand.length, 5);
  assert.equal(a.deck.length + a.hand.length + a.discard.length, 12);
  assert.deepEqual(a.hand.map((c) => c.id), b.hand.map((c) => c.id));
});

test('playCardAtIndex spends energy and updates enemy hp for attack cards', () => {
  const s = createInitialRunState({ seed: 'demo-seed' });
  const idx = s.hand.findIndex((c) => c.type === 'attack');
  assert.ok(idx >= 0);

  const beforeEnemyHp = s.enemyHp;
  const out = playCardAtIndex(s, idx);

  assert.equal(out.errorCode, null);
  assert.equal(out.state.energy, 2);
  assert.ok(out.state.enemyHp < beforeEnemyHp);
});

test('playCardAtIndex rejects plays when energy is insufficient', () => {
  const s = createInitialRunState({ seed: 'demo-seed' });
  s.energy = 0;

  const out = playCardAtIndex(s, 0);
  assert.equal(out.errorCode, 'INSUFFICIENT_ENERGY');
  assert.equal(out.state.energy, 0);
});

test('endTurn advances turn and resets energy', () => {
  const s = createInitialRunState({ seed: 'demo-seed' });
  s.energy = 1;

  const out = endTurn(s);
  assert.equal(out.turn, 2);
  assert.equal(out.remainingTurns, 4);
  assert.equal(out.energy, 3);
});

test('computeFinalScore follows the agreed formula', () => {
  const out = computeFinalScore({
    totalDamage: 80,
    defeatBonus: 300,
    remainingHp: 22,
    maxCombo: 4,
  });

  assert.equal(out.totalScore, 1740);
  assert.equal(
    out.totalScore,
    out.damageScore + out.defeatBonus + out.hpBonus + out.comboBonus
  );
});

test('draft checkpoint returns 3 options and chosen card is added once', () => {
  const s = createInitialRunState({ seed: 'seed-a' });
  const choices = buildDraftChoices(s, 1);
  assert.equal(choices.length, 3);

  const next = applyDraftChoice(s, choices, 1);
  const allIds = [...next.deck, ...next.hand, ...next.discard].map((c) => c.id);
  assert.ok(allIds.includes(choices[1].id));
});
