'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { chooseGrocerScene, grocerProgress, TILL_SLIP } from '@/lib/grocer-quest';
import { closeGate, deliveredFiles, emptyWorld, gateProgress, gateStage, HANDOVER_FILE, INTERCOM_KEY, nextGateUpdate, readHandover, readWorld, replyToGate, type ClosingChoice, type ReplyChoice, type WorldSave } from '@/lib/intercom';

export function useChamberWorld() {
  const [save, setSave] = useState<WorldSave>(emptyWorld);
  const [ready, setReady] = useState(false);
  const [durable, setDurable] = useState(true);
  const [now, setNow] = useState(0);
  const writable = useRef(true);

  useEffect(() => {
    try {
      const loaded = readWorld(window.localStorage.getItem(INTERCOM_KEY));
      writable.current = loaded.writable;
      setDurable(loaded.writable);
      setSave(loaded.save);
    } catch {
      writable.current = false;
      setDurable(false);
    }
    setNow(Date.now());
    setReady(true);

    const sync = (event: StorageEvent) => {
      if (event.key !== INTERCOM_KEY || event.storageArea !== window.localStorage) return;
      const loaded = readWorld(event.newValue);
      writable.current = loaded.writable;
      setDurable(loaded.writable);
      setSave(loaded.save);
      setNow(Date.now());
    };
    const resume = () => { if (!document.hidden) setNow(Date.now()); };
    window.addEventListener('storage', sync);
    document.addEventListener('visibilitychange', resume);
    return () => {
      window.removeEventListener('storage', sync);
      document.removeEventListener('visibilitychange', resume);
    };
  }, []);

  const stage = gateStage(save, now);
  const nextUpdate = nextGateUpdate(save, now);
  useEffect(() => {
    if (!ready || nextUpdate === null) return;
    const timer = window.setTimeout(() => setNow(Date.now()), Math.max(0, nextUpdate - Date.now()) + 30);
    return () => window.clearTimeout(timer);
  }, [ready, nextUpdate]);

  const commit = useCallback((change: (current: WorldSave, time: number) => WorldSave) => {
    const time = Date.now();
    setNow(time);
    setSave((current) => change(current, time));
  }, []);

  // Write only on actual choices/read events, never on a timer or an imported
  // storage event. This also avoids cross-tab storage echo loops.
  const latest = useRef(save);
  latest.current = save;
  const persist = useCallback((change: (current: WorldSave, time: number) => WorldSave) => {
    const time = Date.now();
    // A different tab may have made a choice since our last storage event.
    let current = latest.current;
    if (writable.current) {
      try {
        const loaded = readWorld(window.localStorage.getItem(INTERCOM_KEY));
        if (loaded.writable) current = loaded.save;
        else { writable.current = false; setDurable(false); }
      } catch { writable.current = false; setDurable(false); }
    }
    const updated = change(current, time);
    latest.current = updated;
    commit(() => updated);
    if (writable.current) {
      try { window.localStorage.setItem(INTERCOM_KEY, JSON.stringify(updated)); }
      catch { setDurable(false); writable.current = false; }
    }
  }, [commit]);

  const markFileRead = useCallback((id: string) => {
    if (id === HANDOVER_FILE) persist(readHandover);
  }, [persist]);

  const grocer = grocerProgress(save);
  const deliveredFileIds = deliveredFiles(save, now);
  if (grocer.hasSlip) deliveredFileIds.push(TILL_SLIP);
  return {
    ready, durable, stage, progress: gateProgress(save), deliveredFileIds, grocer,
    visitGrocer: (next: Parameters<typeof chooseGrocerScene>[1]) => persist(current => chooseGrocerScene(current, next)),
    reply: (choice: ReplyChoice) => persist((current, time) => replyToGate(current, choice, time)),
    close: (choice: ClosingChoice) => persist((current, time) => closeGate(current, choice, time)),
    markFileRead
  };
}
