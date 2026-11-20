'use client';

import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { ALL_LIT, fireflyBoards, flipFireflies } from '@/lib/firefly';
import styles from './games.module.css';

type Play = { level: number; board: number; moves: number };
const start = (level: number): Play => ({ level, board: fireflyBoards[level], moves: 0 });
const storageKey = 'chamber-firefly-v1';

export function Firefly() {
  const [play, setPlay] = useState(() => start(0));
  const [ready, setReady] = useState(false);
  const cells = useRef<(HTMLButtonElement | null)[]>([]);
  const next = useRef<HTMLButtonElement>(null);
  const solved = play.board === ALL_LIT;
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const v = JSON.parse(raw);
        if (Number.isInteger(v.level) && v.level >= 0 && v.level < fireflyBoards.length &&
          Number.isInteger(v.board) && v.board >= 0 && v.board <= ALL_LIT &&
          Number.isSafeInteger(v.moves) && v.moves >= 0) setPlay(v);
      }
    } catch { /* A round also works without storage. */ }
    setReady(true);
  }, []);
  function save(value: Play) {
    setPlay(value);
    try { localStorage.setItem(storageKey, JSON.stringify(value)); } catch { /* Play locally. */ }
  }
  function flip(cell: number) {
    if (!ready || solved) return;
    const board = flipFireflies(play.board, cell);
    save({ ...play, board, moves: play.moves + 1 });
    if (board === ALL_LIT) requestAnimationFrame(() => next.current?.focus());
  }
  function navigate(event: KeyboardEvent, cell: number) {
    const offsets: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -3, ArrowDown: 3 };
    if (!(event.key in offsets)) return;
    event.preventDefault();
    const target = cell + offsets[event.key];
    if (target < 0 || target > 8 || (Math.abs(offsets[event.key]) === 1 && Math.floor(target / 3) !== Math.floor(cell / 3))) return;
    cells.current[target]?.focus();
  }
  return <section className={styles.firefly} aria-label="Firefly puzzle">
    <header className={styles.puzzleHeading}><h2>fireflies</h2><span>pond {play.level + 1} / {fireflyBoards.length}</span></header>
    <p>Light all nine. Tap a firefly to switch it and its neighbours above, below and beside it.</p>
    <div className={styles.board} role="group" aria-label="Fireflies">
      {Array.from({ length: 9 }, (_, i) => {
        const lit = Boolean(play.board & (1 << i));
        return <button key={i} ref={el => { cells.current[i] = el; }} aria-label={`row ${Math.floor(i / 3) + 1}, column ${i % 3 + 1}`}
          aria-pressed={lit} disabled={!ready || solved} onKeyDown={e => navigate(e, i)} onClick={() => flip(i)}>
          <img src={lit ? '/icons/games/firefly.png' : '/icons/games/resting.png'} alt="" width="48" height="36" />
        </button>;
      })}
    </div>
    <footer className={styles.puzzleFooter}>
      <span role="status">{solved ? 'all nine lit' : `${play.moves} ${play.moves === 1 ? 'move' : 'moves'}`}</span>
      {solved ? <button ref={next} onClick={() => { save(start((play.level + 1) % fireflyBoards.length)); requestAnimationFrame(() => cells.current[0]?.focus()); }}>
        {play.level + 1 === fireflyBoards.length ? 'play again' : 'next pond'}</button>
        : <button disabled={!ready || play.moves === 0} onClick={() => save(start(play.level))}>start over</button>}
    </footer>
  </section>;
}
