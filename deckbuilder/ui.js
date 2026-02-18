(function setupDeckbuilderUi(root) {
  const engine = root.DeckbuilderEngine;
  if (!engine) {
    return;
  }

  const elements = {};
  let state = null;
  let frameClockMs = 0;

  function getCardLabel(card) {
    if (!card) {
      return '';
    }
    return `${card.id} / ${card.type} / cost:${card.cost}`;
  }

  function computeRunSummary(currentState) {
    const defeatBonus = currentState.enemyHp <= 0 ? 300 : 0;
    return engine.computeFinalScore({
      totalDamage: currentState.totalDamage,
      defeatBonus,
      remainingHp: currentState.hp,
      maxCombo: currentState.maxCombo,
    });
  }

  function renderHud() {
    elements.runHud.innerHTML = `
      <div class="row">
        <strong>Turn</strong>: ${state.turn}
        <strong>Remaining</strong>: ${state.remainingTurns}
        <strong>Energy</strong>: ${state.energy}
        <strong>Score</strong>: ${state.score}
      </div>
    `;
  }

  function renderBattle() {
    elements.battlePanel.innerHTML = `
      <div class="row">
        <strong>Player HP</strong>: ${state.hp}
        <strong>Block</strong>: ${state.block}
        <strong>Enemy HP</strong>: ${state.enemyHp}
        <strong>Total Damage</strong>: ${state.totalDamage}
      </div>
    `;
  }

  function drawCanvas() {
    const canvas = elements.gameCanvas;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#d2c4a4';
    ctx.fillRect(20, 20, canvas.width - 40, canvas.height - 40);

    ctx.fillStyle = '#0d6b52';
    ctx.fillRect(90, 140, 90, 40);
    ctx.fillStyle = '#a0312f';
    ctx.fillRect(710, 60, 120, 60);

    ctx.fillStyle = '#1e1b16';
    ctx.font = '16px sans-serif';
    ctx.fillText(`P HP ${state.hp}`, 90, 135);
    ctx.fillText(`E HP ${state.enemyHp}`, 710, 55);
    ctx.fillText(`Turn ${state.turn} / Rem ${state.remainingTurns}`, 330, 36);
  }

  function renderHand() {
    const cardButtons = state.hand
      .map((card, idx) => {
        const disabled = card.cost > state.energy ? 'disabled' : '';
        return `<button class="card-btn" data-card-index="${idx}" ${disabled}>${getCardLabel(card)}</button>`;
      })
      .join('');

    elements.handPanel.innerHTML = `<div class="row">${cardButtons || '<span>手札なし</span>'}</div>`;
    elements.handPanel.querySelectorAll('[data-card-index]').forEach((node) => {
      node.addEventListener('click', () => {
        const index = Number(node.getAttribute('data-card-index'));
        const out = engine.playCardAtIndex(state, index);
        state = out.state;
        rerender();
      });
    });
  }

  function renderResult() {
    const summary = computeRunSummary(state);
    elements.resultModal.innerHTML = `
      <h3>Result</h3>
      <div>総合スコア: ${summary.totalScore}</div>
      <div>ダメージ点: ${summary.damageScore}</div>
      <div>撃破ボーナス: ${summary.defeatBonus}</div>
      <div>残HPボーナス: ${summary.hpBonus}</div>
      <div>コンボボーナス: ${summary.comboBonus}</div>
    `;
  }

  function rerender() {
    renderHud();
    renderBattle();
    renderHand();
    drawCanvas();
    renderResult();
    elements.resultModal.hidden = state.remainingTurns > 0;
  }

  function onEndTurn() {
    state = engine.endTurn(state);
    const summary = computeRunSummary(state);
    state.score = summary.totalScore;
    rerender();
  }

  function onRestart() {
    state = engine.createInitialRunState({ seed: 'ui-seed' });
    rerender();
  }

  function bootstrapGameUi() {
    elements.gameCanvas = document.getElementById('gameCanvas');
    elements.runHud = document.getElementById('runHud');
    elements.battlePanel = document.getElementById('battlePanel');
    elements.handPanel = document.getElementById('handPanel');
    elements.endTurnBtn = document.getElementById('endTurnBtn');
    elements.restartBtn = document.getElementById('restartBtn');
    elements.resultModal = document.getElementById('resultModal');

    state = engine.createInitialRunState({ seed: 'ui-seed' });

    elements.endTurnBtn.addEventListener('click', onEndTurn);
    elements.restartBtn.addEventListener('click', onRestart);
    rerender();
  }

  root.render_game_to_text = () => JSON.stringify({
    coordinateSystem: 'origin=(0,0) at top-left, +x right, +y down',
    mode: state && state.remainingTurns > 0 ? 'running' : 'result',
    frameClockMs,
    player: {
      hp: state ? state.hp : 0,
      block: state ? state.block : 0,
      energy: state ? state.energy : 0,
    },
    enemy: {
      hp: state ? state.enemyHp : 0,
    },
    turn: state ? state.turn : 0,
    remainingTurns: state ? state.remainingTurns : 0,
    hand: state ? state.hand.map((c) => ({ id: c.id, type: c.type, cost: c.cost })) : [],
    score: state ? state.score : 0,
  });

  root.advanceTime = (ms) => {
    const delta = Number(ms) || 0;
    frameClockMs += Math.max(0, delta);
    drawCanvas();
  };

  if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', bootstrapGameUi);
  }
})(typeof window !== 'undefined' ? window : globalThis);
