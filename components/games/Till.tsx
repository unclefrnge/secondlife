'use client';

import { useEffect, useRef } from 'react';
import { grocerScenes } from '@/lib/grocer-quest';
import type { useChamberWorld } from '@/lib/hooks/use-chamber-world';
import { ReceiptPaper } from './ReceiptPaper';
import styles from './games.module.css';

export type TillProgress = Pick<ReturnType<typeof useChamberWorld>, 'ready' | 'grocer' | 'visitGrocer'>;

export function Till({ ready, grocer, visitGrocer }: TillProgress) {
  const scene = grocerScenes[grocer.scene];
  const heading = useRef<HTMLHeadingElement>(null);
  const played = useRef(false);
  useEffect(() => {
    if (played.current) heading.current?.focus({ preventScroll: true });
  }, [grocer.scene]);
  function choose(next: Parameters<typeof visitGrocer>[0]) {
    played.current = true;
    visitGrocer(next);
  }
  if (!ready) return <p className={styles.loading}>opening till…</p>;
  return <section className={styles.till} aria-label="Gogo’s Grocer story">
    <ReceiptPaper key={grocer.scene}>
      <h2 ref={heading} tabIndex={-1}>{scene.title}</h2>
      <p>{scene.text}</p>
    </ReceiptPaper>
    <div className={styles.choices}>
      {scene.choices ? scene.choices.map(([label, next]) =>
        <button key={next} onClick={() => choose(next)}>{label}</button>
      ) : <button onClick={() => choose('counter')}>play again</button>}
    </div>
  </section>;
}
