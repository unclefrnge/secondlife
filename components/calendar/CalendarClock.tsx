'use client';

import dynamic from 'next/dynamic';
import { useEffect, useId, useRef, useState } from 'react';
import type { useChamberClock } from '@/lib/hooks/use-chamber-clock';
import type { Recording } from '@/app/work/Recordings';
import styles from './calendar.module.css';

const Calendar = dynamic(() => import('./ChamberCalendar'), {
  ssr: false, loading: () => <p className={styles.message} role="status">Opening calendar…</p>
});

type Props = {
  clock: ReturnType<typeof useChamberClock>;
  onRecording?: (recording: Recording) => void;
};

export function CalendarClock({ clock, onRecording }: Props) {
  const [open, setOpen] = useState(false);
  const group = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLElement>(null);
  const id = useId();

  useEffect(() => {
    if (!open) return;
    panel.current?.focus({ preventScroll: true });
    function outside(event: Event) {
      if (!event.composedPath().includes(group.current!)) setOpen(false);
    }
    function key(event: KeyboardEvent) {
      if (event.key !== 'Escape') return;
      event.stopPropagation();
      setOpen(false);
      trigger.current?.focus({ preventScroll: true });
    }
    document.addEventListener('pointerdown', outside, true);
    document.addEventListener('focusin', outside, true);
    document.addEventListener('keydown', key, true);
    return () => {
      document.removeEventListener('pointerdown', outside, true);
      document.removeEventListener('focusin', outside, true);
      document.removeEventListener('keydown', key, true);
    };
  }, [open]);

  return <div className={styles.clock} ref={group}>
    <button type="button" ref={trigger} className={styles.trigger} aria-label={'Calendar, ' + clock.localDate}
      aria-expanded={open} aria-haspopup="dialog" aria-controls={open ? id : undefined} title="Calendar"
      onClick={() => setOpen(value => !value)}>
      <time dateTime={clock.now?.toISOString()}><span>{clock.localDate}</span>{clock.localTime}</time>
    </button>
    {open && <section id={id} ref={panel} className={styles.panel} role="dialog" aria-label="Calendar" tabIndex={-1}>
      {clock.day && <Calendar today={clock.day} onRecording={onRecording} onChoose={() => {
        setOpen(false);
        trigger.current?.focus({ preventScroll: true });
      }} />}
    </section>}
  </div>;
}
