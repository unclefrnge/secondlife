import type { HTMLAttributes, ReactNode, Ref } from 'react';
import styles from '@/components/welcome/welcome-window.module.css';

interface Props {
  title: string;
  icon: ReactNode;
  children?: ReactNode;
  expanded: boolean;
  handle: HTMLAttributes<HTMLElement>;
  onClose: () => void;
  onMinimise: () => void;
  minimiseLabel?: string;
  onToggleSize: () => void;
  closeRef?: Ref<HTMLButtonElement>;
  minimiseRef?: Ref<HTMLButtonElement>;
}

export function PublicWindowBar({ title, icon, children, expanded, handle, onClose, onMinimise, minimiseLabel = "Minimize window", onToggleSize, closeRef, minimiseRef }: Props) {
  const sizeLabel = expanded ? 'Restore window size' : 'Enter full screen';
  return (
    <header {...handle} className={styles.chrome} aria-label={`Move ${title} window`}>
      <div className={styles.controls} data-expanded={expanded}>
        <button type="button" ref={closeRef} aria-label="Close window" title="Close window" onClick={onClose}><span aria-hidden="true"><i>×</i></span></button>
        <button type="button" ref={minimiseRef} aria-label={minimiseLabel} title={minimiseLabel} onClick={onMinimise}><span aria-hidden="true"><i>−</i></span></button>
        <button type="button" aria-label={sizeLabel} title={sizeLabel} onClick={onToggleSize}><span aria-hidden="true"><i className={styles.sizeGlyph} /></span></button>
      </div>
      {children ?? <span className={styles.caption}>{icon}{title}</span>}
    </header>
  );
}
