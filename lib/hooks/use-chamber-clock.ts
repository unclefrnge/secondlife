'use client';

import { useDeskPreferences } from './use-desk-preferences';
import { useEffect, useMemo, useState } from 'react';

const SYNODIC_MONTH_DAYS = 29.530588853;
// Approximate real lunar age, anchored to the 2000-01-06 new moon (UTC).
// Mean synodic period: https://eclipse.gsfc.nasa.gov/help/moonorbit.html
const KNOWN_NEW_MOON_UTC = Date.UTC(2000, 0, 6, 18, 14);
const CHAMBER_PHASES = [
  'black veil', 'veil rise', 'first gate', 'halo wax',
  'white chamber', 'halo fall', 'last gate', 'hollow wane'
] as const;

function getChamberCycle(date: Date) {
  const elapsedDays = (date.getTime() - KNOWN_NEW_MOON_UTC) / 86_400_000;
  const lunarAge = ((elapsedDays % SYNODIC_MONTH_DAYS) + SYNODIC_MONTH_DAYS) % SYNODIC_MONTH_DAYS;
  const phaseIndex = Math.floor((lunarAge / SYNODIC_MONTH_DAYS) * CHAMBER_PHASES.length + 0.5) % CHAMBER_PHASES.length;
  const lunarDay = Math.floor(lunarAge) + 1;

  const fraction = lunarAge / SYNODIC_MONTH_DAYS;
  // Only call the moon new, full or at quarter within half a day of that phase.
  const near = (phase: number) => Math.abs(fraction - phase) * SYNODIC_MONTH_DAYS <= .5;
  let phaseName: string;
  if (near(0) || near(1)) phaseName = 'new moon';
  else if (near(.25)) phaseName = 'first quarter';
  else if (near(.5)) phaseName = 'full moon';
  else if (near(.75)) phaseName = 'last quarter';
  else if (fraction < .25) phaseName = 'waxing crescent';
  else if (fraction < .5) phaseName = 'waxing gibbous';
  else if (fraction < .75) phaseName = 'waning gibbous';
  else phaseName = 'waning crescent';

  return { name: CHAMBER_PHASES[phaseIndex], phaseName, fraction, ageDays: Math.floor(lunarAge), code: `c${String(lunarDay).padStart(2, '0')}` };
}

export function useChamberClock() {
  const { clock, hours } = useDeskPreferences();
  const timeZone = clock === 'johannesburg' ? 'Africa/Johannesburg' : undefined;
  const hourCycle = hours === '24' ? 'h23' : hours === '12' ? 'h12' : undefined;
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    let timer: number;
    const updateClock = () => {
      const date = new Date();
      setNow(date);
      window.clearTimeout(timer);
      timer = window.setTimeout(updateClock, 60_000 - (date.getTime() % 60_000));
    };
    updateClock();
    document.addEventListener('visibilitychange', updateClock);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('visibilitychange', updateClock);
    };
  }, []);

  const chamberCycle = useMemo(() => (now ? getChamberCycle(now) : null), [now]);
  const localDate = now
    ? new Intl.DateTimeFormat(undefined, { day: '2-digit', month: 'short', year: 'numeric', timeZone }).format(now)
    : '-- --- ----';
  const localTime = now ? new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit', hourCycle, timeZone }).format(now) : '--:--';
  const day = now ? new Intl.DateTimeFormat('sv-SE', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now) : null;
  return { now, chamberCycle, localDate, localTime, day };
}
