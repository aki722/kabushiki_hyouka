(function universalModule(root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./content.js'));
    return;
  }
  root.DeckbuilderEngine = factory(root.DeckbuilderContent || { CARD_POOL: [] });
})(typeof globalThis !== 'undefined' ? globalThis : this, (content) => {
  const CARD_POOL = Array.isArray(content.CARD_POOL) ? content.CARD_POOL : [];

  function seedToInt(seed) {
    let h = 2166136261;
    const text = String(seed || 'default');
    for (let i = 0; i < text.length; i += 1) {
      h ^= text.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function makeRng(seed) {
    let state = seedToInt(seed);
    return function rng() {
      state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
      return state / 4294967296;
    };
  }

  function shuffleWithSeed(items, seed) {
    const out = items.slice();
    const rng = makeRng(seed);
    for (let i = out.length - 1; i > 0; i -= 1) {
      const j = Math.floor(rng() * (i + 1));
      const tmp = out[i];
      out[i] = out[j];
      out[j] = tmp;
    }
    return out;
  }

  function createInitialRunState({ seed = 'default' } = {}) {
    const starterDeck = [
      ...Array.from({ length: 6 }, (_, i) => ({ id: `atk-${i}`, type: 'attack', cost: 1, value: 6 })),
      ...Array.from({ length: 4 }, (_, i) => ({ id: `blk-${i}`, type: 'defense', cost: 1, value: 5 })),
      ...Array.from({ length: 2 }, (_, i) => ({ id: `utl-${i}`, type: 'utility', cost: 1, value: 1 })),
    ];
    const deck = shuffleWithSeed(starterDeck, seed);

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
      totalDamage: 0,
      hand: deck.slice(0, 5),
      deck: deck.slice(5),
      discard: [],
    };
  }

  function cloneState(state) {
    return JSON.parse(JSON.stringify(state));
  }

  function playCardAtIndex(state, index) {
    const next = cloneState(state);
    const card = next.hand[index];
    if (!card) {
      return { state: next, errorCode: 'CARD_NOT_FOUND' };
    }
    if (card.cost > next.energy) {
      return { state: next, errorCode: 'INSUFFICIENT_ENERGY' };
    }

    next.energy -= card.cost;
    if (card.type === 'attack') {
      next.enemyHp = Math.max(0, next.enemyHp - card.value);
      next.totalDamage += card.value;
      next.combo += 1;
      next.maxCombo = Math.max(next.maxCombo, next.combo);
    } else if (card.type === 'defense') {
      next.block += card.value;
      next.combo = 0;
    } else {
      next.combo += card.value;
      next.maxCombo = Math.max(next.maxCombo, next.combo);
    }

    next.discard.push(card);
    next.hand.splice(index, 1);
    return { state: next, errorCode: null };
  }

  function endTurn(state) {
    const next = cloneState(state);
    next.turn += 1;
    next.remainingTurns = Math.max(0, next.remainingTurns - 1);
    next.energy = 3;
    next.block = 0;
    next.combo = 0;

    while (next.hand.length < 5 && (next.deck.length > 0 || next.discard.length > 0)) {
      if (next.deck.length === 0) {
        next.deck = shuffleWithSeed(next.discard, `${next.seed}:${next.turn}`);
        next.discard = [];
      }
      if (next.deck.length === 0) {
        break;
      }
      next.hand.push(next.deck.shift());
    }
    return next;
  }

  function toNonNegativeNumber(value) {
    const n = Number(value);
    if (!Number.isFinite(n) || n < 0) {
      return 0;
    }
    return n;
  }

  function computeFinalScore({
    totalDamage = 0,
    defeatBonus = 0,
    remainingHp = 0,
    maxCombo = 0,
  } = {}) {
    const damageScore = toNonNegativeNumber(totalDamage) * 10;
    const safeDefeatBonus = toNonNegativeNumber(defeatBonus);
    const hpBonus = toNonNegativeNumber(remainingHp) * 20;
    const comboBonus = toNonNegativeNumber(maxCombo) * 50;
    const totalScore = damageScore + safeDefeatBonus + hpBonus + comboBonus;

    return {
      damageScore,
      defeatBonus: safeDefeatBonus,
      hpBonus,
      comboBonus,
      totalScore,
    };
  }

  function buildDraftChoices(state, checkpointIndex) {
    if (CARD_POOL.length === 0) {
      return [];
    }
    const safeIndex = Math.max(0, Number(checkpointIndex) || 0);
    const base = seedToInt(`${state.seed}:${safeIndex}`) % CARD_POOL.length;
    const choices = [];
    for (let i = 0; i < 3; i += 1) {
      choices.push(CARD_POOL[(base + i) % CARD_POOL.length]);
    }
    return choices;
  }

  function applyDraftChoice(state, choices, index) {
    const next = cloneState(state);
    const chosen = choices && choices[index];
    if (!chosen) {
      return next;
    }
    next.discard.push(chosen);
    return next;
  }

  function runSeededSimulation({ seed = 'default' } = {}) {
    let state = createInitialRunState({ seed });
    const turnsPlayed = 5;

    for (let i = 0; i < turnsPlayed; i += 1) {
      let idx = state.hand.findIndex((card) => card.cost <= state.energy);
      while (idx >= 0) {
        const out = playCardAtIndex(state, idx);
        state = out.state;
        idx = state.hand.findIndex((card) => card.cost <= state.energy);
      }
      if (i < turnsPlayed - 1) {
        state = endTurn(state);
      }
    }

    const defeatBonus = state.enemyHp <= 0 ? 300 : 0;
    const summary = computeFinalScore({
      totalDamage: state.totalDamage,
      defeatBonus,
      remainingHp: state.hp,
      maxCombo: state.maxCombo,
    });

    return {
      seed,
      turnsPlayed,
      totalScore: summary.totalScore,
      signature: `${seed}:${turnsPlayed}`,
    };
  }

  return {
    createInitialRunState,
    playCardAtIndex,
    endTurn,
    computeFinalScore,
    buildDraftChoices,
    applyDraftChoice,
    runSeededSimulation,
  };
});
