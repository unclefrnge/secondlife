import type { ReactNode } from 'react';
import styles from './folder-icon.module.css';

const stamps: Record<string, string> = {
  'selected-work': 'M2 5h3V3h6v2h3v8H2z M6 5h4V4H6z M3 8v1h4v1h2V9h4V8z',
  'releases-radio': 'M6 2h4v1h2v2h2v6h-2v2h-2v1H6v-1H4v-2H2V5h2V3h2z M6 6v4h4V6z',
  'own-releases': 'M6 2h4v1h2v2h2v6h-2v2h-2v1H6v-1H4v-2H2V5h2V3h2z M6 6v4h4V6z',
  'production-credits': 'M3 2h1v4h2v3H4v5H3V9H1V6h2z M8 2h1v7h2v3H9v2H8v-2H6V9h2z M13 2h1v2h2v3h-2v7h-1V7h-2V4h2z',
  'distortion-chamber': 'M2 6h12v8H2z M4 8v2h4V8z M10 9v3h2V9z M3 5l8-4 1 1-8 4z',
  'radio-appearances': 'M7 2h3v7H7z M4 6h1v4h1v1h5v-1h1V6h1v5h-1v1H9v2h3v1H5v-1h3v-2H5v-1H4z',
  press: 'M3 2h7l3 3v9H3z M5 6h5V5H5z M5 8v1h6V8z M5 11v1h5v-1z'
};

export function FolderIcon({ children, kind }: { children?: ReactNode; kind?: string }) {
  const mark = kind && stamps[kind];
  return <i className={styles.folder} aria-hidden="true">
    {mark && <svg className={styles.stamp} viewBox="0 0 16 16" shapeRendering="crispEdges" aria-hidden="true">
      <path d={mark} fill="currentColor" fillRule="evenodd" />
    </svg>}
    {children}
  </i>;
}
