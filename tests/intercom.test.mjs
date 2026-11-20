import test from 'node:test';
import assert from 'node:assert/strict';
import { emptyWorld, readWorld, replyToGate, deliveredFiles, readHandover, closeGate, gateStage, gateProgress, nextGateUpdate, GATE_ENCOUNTER, HANDOVER_FILE, REPLY_DELAY, FOLLOW_UP_DELAY } from '../lib/intercom.ts';

for (const choice of ['which-key', 'check-folder']) {
  test(`${choice}: reply, delivery, read, follow-up and completion survive reloads`, () => {
    const start = 1_000;
    let save = emptyWorld();
    assert.equal(gateStage(save, start), 'unanswered');
    assert.equal(nextGateUpdate(save, start), null);
    assert.equal(readHandover(save, start), save);
    save = replyToGate(save, choice, start);
    assert.equal(replyToGate(save, 'which-key', start + 1), save);
    assert.equal(gateStage(save, start), 'waiting');
    assert.deepEqual(deliveredFiles(save, start + REPLY_DELAY - 1), []);
    assert.equal(readHandover(save, start), save);
    assert.equal(nextGateUpdate(save, start), start + REPLY_DELAY);
    save = readWorld(JSON.stringify(save)).save;
    const arrival = start + REPLY_DELAY;
    assert.equal(gateStage(save, arrival), 'delivered');
    assert.deepEqual(deliveredFiles(save, arrival), [HANDOVER_FILE]);
    assert.equal(nextGateUpdate(save, arrival), null);
    assert.equal(closeGate(save, 'bring-usb', arrival + FOLLOW_UP_DELAY), save);
    save = readHandover(save, arrival);
    assert.equal(readHandover(save, arrival + 1), save);
    assert.equal(nextGateUpdate(save, arrival), arrival + FOLLOW_UP_DELAY);
    assert.equal(gateStage(save, arrival + FOLLOW_UP_DELAY - 1), 'delivered');
    save = readWorld(JSON.stringify(save)).save;
    const followUp = arrival + FOLLOW_UP_DELAY;
    assert.equal(gateStage(save, followUp), 'follow-up');
    for (const closingChoice of ['bring-usb', 'leave-with-sam']) {
      const closed = closeGate(save, closingChoice, followUp);
      const reloaded = readWorld(JSON.stringify(closed)).save;
      assert.equal(gateStage(reloaded, followUp + 1), 'closed');
      assert.equal(gateProgress(reloaded).choice, choice);
      assert.equal(gateProgress(reloaded).closingChoice, closingChoice);
      assert.deepEqual(deliveredFiles(reloaded, followUp + 1), [HANDOVER_FILE]);
      assert.equal(closeGate(reloaded, 'bring-usb', followUp + 1), reloaded);
      assert.equal(nextGateUpdate(reloaded, followUp + 1), null);
    }
  });
}

test('new content and unknown metadata survive progress updates', () => {
  const original = { version: 1, encounters: { future: { complete: true } }, contentRevision: 7 };
  const { save, writable } = readWorld(JSON.stringify(original));
  assert.equal(writable, true);
  const updated = replyToGate(save, 'check-folder', 10);
  assert.deepEqual(updated.encounters.future, original.encounters.future);
  assert.equal(updated.contentRevision, 7);
  assert.equal(original.encounters[GATE_ENCOUNTER], undefined);
});

test('unsupported or corrupt saves are protected from overwriting', () => {
  for (const raw of ['{broken', '{}', 'null', '{"version":2,"encounters":{}}', JSON.stringify({ version: 1, encounters: { [GATE_ENCOUNTER]: { choice: 'unknown' } } }), JSON.stringify({ version: 1, encounters: { [GATE_ENCOUNTER]: { choice: 'which-key' } } })]) {
    const loaded = readWorld(raw);
    assert.equal(loaded.writable, false);
    assert.deepEqual(loaded.save, emptyWorld());
  }
  assert.equal(readWorld(null).writable, true);
});
