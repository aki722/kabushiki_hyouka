(function universalModule(root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
    return;
  }
  root.DeckbuilderContent = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, () => {
  const CARD_TYPES = ['attack', 'defense', 'utility'];

  const CARD_POOL = Array.from({ length: 30 }, (_, i) => {
    const type = CARD_TYPES[i % CARD_TYPES.length];
    return {
      id: `card-${i + 1}`,
      name: `Card ${i + 1}`,
      type,
      cost: 1 + (i % 2),
      effect: {
        value: 4 + (i % 5),
      },
    };
  });

  function validateCardPool(cards) {
    const errors = [];
    const ids = new Set();

    for (const card of cards || []) {
      if (!card || !card.id || !card.type || card.cost == null || !card.effect) {
        errors.push(`invalid:${card && card.id ? card.id : 'no-id'}`);
        continue;
      }
      if (ids.has(card.id)) {
        errors.push(`dup:${card.id}`);
      }
      ids.add(card.id);
    }

    return { ok: errors.length === 0, errors };
  }

  return {
    CARD_POOL,
    validateCardPool,
  };
});
