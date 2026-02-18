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
