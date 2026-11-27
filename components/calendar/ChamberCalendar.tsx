'use client';

import { createElement, useContext, useEffect, useMemo, useRef, useState, type MouseEvent } from 'react';
import 'cally';
import type { CalendarDate } from 'cally';
import { PlayerContext, type Recording } from '@/app/work/Recordings';
import { calendarDay, displayDate, juneReading, type CalendarEntry } from '@/lib/calendar';
import styles from './calendar.module.css';

// Importing Cally registers the custom elements when the clock is first opened.
type Grid = InstanceType<typeof CalendarDate>;

export default function ChamberCalendar({ today, onChoose, onRecording }: {
  today: string; onChoose: () => void; onRecording?: (file: Recording) => void;
}) {
  const player = useContext(PlayerContext);
  const grid = useRef<Grid>(null);
  const [month, setMonth] = useState(today.slice(0, 7));
  const [selected, setSelected] = useState('');
  const [entries, setEntries] = useState<CalendarEntry[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setStatus('loading');
    fetch('/api/calendar', { signal: controller.signal }).then(response => {
      if (!response.ok) throw new Error('Calendar unavailable');
      return response.json() as Promise<CalendarEntry[]>;
    }).then(items => { setEntries(items); setStatus('ready'); })
      .catch(() => { if (!controller.signal.aborted) setStatus('error'); });
    return () => controller.abort();
  }, [retry]);

  useEffect(() => {
    const element = grid.current!;
    const dates = new Set(entries.map(entry => entry.date));
    element.getDayParts = day => dates.has(calendarDay(day)) ? 'has-entry' : '';
    function page(event: Event) {
      setMonth(calendarDay((event as CustomEvent<{ start: Date }>).detail.start).slice(0, 7));
      setSelected('');
      element.value = '';
    }
    function choose() { setSelected(element.value); }
    element.addEventListener('pagechange', page);
    element.addEventListener('change', choose);
    return () => {
      element.removeEventListener('pagechange', page);
      element.removeEventListener('change', choose);
    };
  }, [entries]);

  function jump(date: string) {
    if (!grid.current) return;
    grid.current.focusedDate = date.length === 7 ? date + '-01' : date;
    grid.current.value = '';
    setMonth(date.slice(0, 7));
    setSelected('');
  }
  function activate(event: MouseEvent<HTMLAnchorElement>, entry: CalendarEntry) {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    if (entry.recording && (onRecording || player)) {
      event.preventDefault();
      onChoose();
      if (onRecording) onRecording(entry.recording);
      else player!.open(entry.recording, event.currentTarget);
    } else onChoose();
  }

  const months = useMemo(() => {
    const all = new Set(entries.map(e => e.date.slice(0, 7)));
    all.add(today.slice(0, 7));
    all.add(today.slice(0, 4) + '-06');
    all.add(month);
    return [...all].sort().reverse();
  }, [entries, month, today]);
  const monthly = entries.filter(e => selected ? e.date === selected : e.date.startsWith(month));
  const current = month === today.slice(0, 7) && !selected;
  const next = current && entries.find(e => e.date >= today && !e.date.startsWith(month));
  const recent = current && !monthly.length && !next && entries.filter(e => e.date < today).at(-1);

  function row(entry: CalendarEntry) {
    const href = entry.recording?.href ?? entry.href;
    const content = <>{!selected && <span className={styles.entryDate}>{displayDate(entry.date, {
      ...(entry.date.length > 7 ? { day: 'numeric' } : {}), month: 'short', ...(entry.date.slice(0, 7) !== month ? { year: 'numeric' } : {})
    })}</span>}<span className={styles.entryText}>{entry.title}<small>{entry.kind}</small></span>
      {entry.recording && <span aria-hidden="true" className={styles.play}>▶</span>}</>;
    return <li key={entry.date + (href ?? '') + entry.title}>{href
      ? <a href={href} aria-label={(entry.recording ? 'Play ' : '') + entry.title}
          onClick={event => activate(event, entry)} target="_blank" rel="noreferrer">{content}</a>
      : <div>{content}</div>}</li>;
  }

  return <>
    {createElement('calendar-date', { ref: grid, today, locale: 'en-GB', 'first-day-of-week': '1', className: styles.grid },
      <select slot="heading" value={month} onChange={event => jump(event.target.value)} aria-label="Jump to month">
        {months.map(value => <option key={value} value={value}>{displayDate(value, { month: 'long', year: 'numeric' })}</option>)}
      </select>,
      <span slot="previous" aria-label="Previous month">‹</span>, <span slot="next" aria-label="Next month">›</span>,
      createElement('calendar-month', { className: styles.days })
    )}
    <div className={styles.agenda}>
      <header><h2>{selected ? displayDate(selected, { day: 'numeric', month: 'long' })
        : recent ? 'From the archive' : next && !monthly.length ? 'Coming up' : 'This month'}</h2>
        <button type="button" onClick={() => jump(today)}>Today</button></header>
      <div aria-live="polite">
        {status === 'error' ? <p className={styles.message}>Couldn’t load the entries. <button onClick={() => setRetry(n => n + 1)}>Try again</button></p>
          : status === 'loading' ? <p className={styles.message}>Loading entries…</p>
          : <>
            {monthly.length > 0 && <ul>{monthly.map(row)}</ul>}
            {next && <>{monthly.length > 0 && <h3>Coming up</h3>}<ul>{row(next)}</ul></>}
            {recent && <ul>{row(recent)}</ul>}
            {!monthly.length && !next && !recent && <p className={styles.message}>{selected ? 'No entries on this day.' : 'No dated entries this month.'}</p>}
          </>}
      </div>
      {month.endsWith('-06') && <a className={styles.reading} href={juneReading.href} target="_blank" rel="noreferrer" onClick={onChoose}>
        <small>June reading · Chamber Times</small>{juneReading.title}
      </a>}
    </div>
  </>;
}
