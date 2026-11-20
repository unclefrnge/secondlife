import styles from './pixel-moon.module.css';

export function PixelMoon({ fraction = 0, large = false }: { fraction?: number; large?: boolean }) {
  const frame = Math.round(fraction * 48) % 48;
  return <span aria-hidden="true" className={styles.moon} data-large={large}
    style={{ backgroundPositionX: `${frame / 47 * 100}%` }} />;
}
