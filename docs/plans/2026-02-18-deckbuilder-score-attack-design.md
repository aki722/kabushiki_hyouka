# Fantasy Deckbuilder Score Attack Design

Date: 2026-02-18
Status: Approved
Target platform: Browser (`HTML/CSS/JS`)

## 1. Scope

Build a single-player fantasy deckbuilder game for score attack with a 15-30 minute run time.

Confirmed decisions:
- Category: game
- Genre: card/board-like (card-focused)
- Players: single-player
- Core loop: deckbuilding-focused
- Platform: browser
- Session length: 15-30 minutes
- Progression model: undecided -> MVP uses run-complete model
- Theme: fantasy
- Difficulty: balanced
- Primary success metric: replayability
- Win condition: high score within turn limit
- Initial scope: 1-2 week MVP

## 2. Product Requirements

### Functional requirements

1. Run-based score attack gameplay:
- run initializes from a starter deck
- player takes turn actions via cards
- run ends after fixed turn budget

2. Deckbuilding variability for replayability:
- two draft checkpoints per run
- each checkpoint offers 3 card options and player picks 1

3. Battle + score model:
- one enemy archetype in MVP
- card categories: attack, defense, utility
- score output includes clear breakdown components

4. Result and retry flow:
- show final score and scoring breakdown
- allow immediate restart

### Non-functional requirements

- Keep implementation as static web app (`HTML/CSS/JS`) without backend.
- Keep architecture modular so card/enemy content scales by data updates.
- Keep MVP complexity constrained to 1-2 weeks.

## 3. Approach Options

### Approach A (selected): Score-attack-first run loop

Fixed-length run with deterministic core loop and simple draft injections.
- Pros: fits 1-2 week scope; fast balancing; strong replay loop
- Cons: less spectacle than full battle campaigns

### Approach B: HP race battle mode with score layer

Traditional enemy HP race with score as secondary output.
- Pros: familiar to players
- Cons: balancing burden is heavier for MVP timeline

### Approach C: Quest-condition scoring mode

Score from rotating quest conditions each run.
- Pros: high long-term variety
- Cons: higher UI and onboarding complexity early

## 4. Selected Design

Approach A is selected.

### 4.1 Architecture

Split into four layers:
- `game-engine`: pure turn rules, enemy behavior, score calculation
- `content-data`: card/enemy/stat tables (MVP: 30 cards, 1 enemy)
- `state-store`: runtime state for deck/hand/discard/player/enemy/score
- `ui-renderer`: DOM rendering and event wiring

### 4.2 UI Components (MVP)

1. `Run HUD`
- turn index, remaining turns, score, target score, remaining deck

2. `Battle Panel`
- enemy status (HP + intent) and player status (HP/block/buffs)

3. `Hand Panel`
- 5-card hand; clickable play actions; disabled state for invalid plays

4. `Deck Controls`
- `End Turn`, `Card Details`, `Restart`

5. `Result Modal`
- final score and breakdown (damage, defeat bonus, HP bonus, max combo)

### 4.3 Data Flow

Run flow:
`init -> starter deck -> 5-turn combat loop -> final score -> result modal`

Turn flow:
1. draw phase
2. player action phase
3. enemy action phase
4. end-turn cleanup

Scoring formula (MVP):
`totalScore = totalDamage * 10 + defeatBonus + remainingHP * 20 + maxCombo * 50`

Randomness:
- two draft checkpoints (3 choices each, pick one)
- optional debug seed mode for reproducibility

### 4.4 Content Boundaries

MVP content limits:
- cards: ~30
- enemy archetypes: 1
- turn budget: fixed (5 turns)
- no permanent meta progression yet

## 5. Error Handling

1. State integrity guard:
- if deck/hand/discard invariant breaks, stop run and show recoverable error

2. Invalid action guard:
- if insufficient energy or invalid target, block action and keep state unchanged

3. Save-data resilience:
- if local data parse fails, restore defaults and warn once

4. Reproducibility mode:
- allow optional seed input for debugging reports

## 6. Test Strategy

1. Engine unit tests:
- card effect execution
- turn progression
- enemy behavior
- run end conditions
- score formula correctness

2. Content schema tests:
- required card fields: `id`, `cost`, `type`, `effect`
- no duplicate card IDs

3. Minimal UI integration tests:
- HUD/hand/turn-end/result rendering and baseline interaction flow

4. Regression seed tests:
- fixed seed produces stable score + outcome signature

## 7. Out of Scope (MVP)

- multiplayer
- permanent progression tree
- multiple enemy classes/boss ladder
- backend services
- monetization

## 8. Rollout Notes

Incremental implementation order:
1. pure engine + tests
2. content data + validation tests
3. UI wiring for core loop
4. scoring/result modal
5. polish + balancing pass

## 9. Approval Log

- 2026-02-18: user approved architecture, components, data flow, error handling, and testing strategy.

## 10. Verification (2026-02-18)

Automated tests:
- `node --test tests/deckbuilder-*.test.js` -> PASS (10/10)
  - includes: engine, content schema, UI structure, fixed-seed regression

Playwright/manual-equivalent verification:
- Ran web-game client on `deckbuilder-score-attack.html` and reviewed generated artifacts in:
  - `output/web-game`
  - `output/web-game-card`
  - `output/web-game-endturn`
- Confirmed from `state-*.json` and screenshots:
  - card click updates state (`energy: 3 -> 2`, `enemy.hp: 50 -> 44`)
  - end-turn action updates state (`turn: 1 -> 2`, `remainingTurns: 5 -> 4`)
  - no console/page errors emitted in these runs
- Additional Playwright check clicked `#endTurnBtn` five times:
  - `resultModalVisible: true`
  - `render_game_to_text.mode: "result"`
  - screenshot captured at `output/web-game-result/shot-result.png`
