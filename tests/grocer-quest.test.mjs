import test from 'node:test';
import assert from 'node:assert/strict';
import { emptyWorld, gateProgress, readWorld, replyToGate } from '../lib/intercom.ts';
import { chooseGrocerScene, grocerProgress, grocerScenes } from '../lib/grocer-quest.ts';

test('every route reaches an ending, survives reloads and preserves the intercom and slip', () => {
  const original = replyToGate(emptyWorld(), 'which-key', 1_000);
  const visited = new Set();
  function walk(save, path) {
    const { scene, hasSlip } = grocerProgress(save);
    assert(!path.includes(scene));
    visited.add(scene);
    const choices = grocerScenes[scene].choices;
    if (!choices) {
      assert(path.length >= 5);
      assert(hasSlip);
      const replay = chooseGrocerScene(save, 'counter');
      assert.deepEqual(grocerProgress(replay), { scene: 'counter', hasSlip: true });
      assert.deepEqual(gateProgress(replay), gateProgress(original));
      return;
    }
    assert.equal(choices.length, 2);
    assert.equal(chooseGrocerScene(save, 'counter'), save);
    for (const [, next] of choices) {
      const loaded = readWorld(JSON.stringify(chooseGrocerScene(save, next))).save;
      assert.equal(grocerProgress(loaded).scene, next);
      walk(loaded, [...path, scene]);
    }
  }
  walk(original, []);
  assert.equal(visited.size, Object.keys(grocerScenes).length);
});

test('an ending saved by the shorter game still offers replay and retains its receipt', () => {
  for (const scene of ['track-id', 'side-b', 'rehearsal', 'exchange']) {
    const save = { version: 1, encounters: { 'gogos-till-01': { scene, hasSlip: true } } };
    assert.deepEqual(grocerProgress(readWorld(JSON.stringify(save)).save), { scene, hasSlip: true });
    assert.deepEqual(grocerProgress(chooseGrocerScene(save, 'counter')), { scene: 'counter', hasSlip: true });
  }
});
