'use client';

import { useState } from 'react';
import { setDeskPreference as change, useDeskPreferences } from '@/lib/hooks/use-desk-preferences';
import { useChamberClock } from '@/lib/hooks/use-chamber-clock';
import { usePrefersReducedMotion } from '@/lib/hooks/use-prefers-reduced-motion';
import { ReceiptPaper } from '@/components/games/ReceiptPaper';
import { PixelMoon } from '@/components/topbar/PixelMoon';
import { WallpaperCanvas } from './WallpaperCanvas';
import { wallpapers, type Wallpaper } from './wallpapers';
import styles from './settings.module.css';

const sections = ['desktop', 'clock', 'till printer'] as const;

export function SystemSettings() {
  const [section, setSection] = useState<typeof sections[number]>('desktop');
  const [printCount, print] = useState(0);
  const settings = useDeskPreferences();
  const { chamberCycle, localTime, localDate } = useChamberClock();
  const reduced = usePrefersReducedMotion();

  return <section className={styles.settings} aria-label="System preferences">
    <nav className={styles.sections} aria-label="Settings sections">
      {sections.map(name => <button key={name} aria-pressed={name === section} onClick={() => setSection(name)}>{name}</button>)}
    </nav>
    <div className={styles.sheet}>
      {section === 'desktop' && <>
        <div className={styles.monitor} data-plate={settings.iconPlate}>
          <WallpaperCanvas scene={settings.wallpaper} running={settings.animate} className={styles.landscape} />
          <img src="/icons/games/till.png" alt="" width="36" height="30" />
        </div>
        <label className={styles.row}>wallpaper
          <select value={settings.wallpaper} onChange={e => change('wallpaper', e.target.value as Wallpaper)}>
            {Object.entries(wallpapers).map(([id, label]) => <option value={id} key={id}>{label}</option>)}
          </select>
        </label>
        <label className={styles.check}><input type="checkbox" checked={settings.animate && !reduced} disabled={reduced}
          onChange={e => change('animate', e.target.checked)} />animate wallpaper</label>
        {reduced && <p className={styles.hint}>Motion is off in your device settings.</p>}
        <label className={styles.check}><input type="checkbox" checked={settings.iconPlate}
          onChange={e => change('iconPlate', e.target.checked)} />solid backing behind icons</label>
      </>}
      {section === 'clock' && <>
        <div className={styles.clockFace}><PixelMoon fraction={chamberCycle?.fraction} /><div><strong>{localTime}</strong><small>{localDate}</small></div></div>
        <label className={styles.row}>time zone<select value={settings.clock} onChange={e => change('clock', e.target.value === 'johannesburg' ? 'johannesburg' : 'device')}>
          <option value="device">device time</option><option value="johannesburg">Johannesburg</option>
        </select></label>
        <label className={styles.row}>clock format<select value={settings.hours} onChange={e => change('hours', e.target.value as typeof settings.hours)}>
          <option value="device">device format</option><option value="12">12 hour</option><option value="24">24 hour</option>
        </select></label>
      </>}
      {section === 'till printer' && <>
        <div className={styles.testSlip}><ReceiptPaper key={printCount}>
          <p>brown loaf <span>× 2</span></p>
          <small>test slip {String(printCount + 1).padStart(2, '0')}</small>
        </ReceiptPaper></div>
        <label className={styles.row}>paper stock<select value={settings.paper} onChange={e => change('paper', e.target.value as typeof settings.paper)}>
          <option value="cream">till roll</option><option value="pink">pink duplicate</option><option value="green">green order pad</option>
        </select></label>
        <label className={styles.row}>rubber stamp<select value={settings.stamp} onChange={e => change('stamp', e.target.value as typeof settings.stamp)}>
          <option value="none">no stamp</option><option>customer copy</option><option>bakery copy</option>
        </select></label>
        <label className={styles.row}>paper feed<select value={settings.feed} onChange={e => change('feed', e.target.value === 'instant' ? 'instant' : 'roller')}>
          <option value="roller">roller</option><option value="instant">instant</option>
        </select></label>
        <button className={styles.testButton} onClick={() => print(value => value + 1)}>print test slip</button>
      </>}
    </div>
  </section>;
}
