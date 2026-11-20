import { featuredLinks, footerLinks, musicLinks } from '@/lib/home-links';
import styles from './home.module.css';

export default function HomePage() {
  return (
    <main className={styles.page}>
      <div className={styles.window}>
        <header className={styles.bar}>
          <span><img src="/chamber-logo.svg" alt="" width="34" height="18" />welcome</span>
          <span>ChamberOS</span>
        </header>
        <div className={styles.content}>
          {featuredLinks.length > 0 && (
            <nav className={styles.featured} aria-label="Featured projects">
              <ul>
                {featuredLinks.map(link => (
                  <li key={link.href}>
                    <a href={link.href}>
                      {link.artwork && <img src={link.artwork} width="96" height="96" alt="" />}
                      <span className={styles.projectTitle}>
                        {link.caption && <small>{link.caption}</small>}
                        {link.label}
                      </span>
                      <span className={styles.projectArrow} aria-hidden="true">↗</span>
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          )}
          <nav className={styles.directory} aria-label="Listen to FRNGE">
            <h1>listen</h1>
            <ul>
              {musicLinks.map(link => (
                <li key={link.href}>
                  <a href={link.href}>
                    <img className={styles.platform} src={'/icons/platforms/' + link.icon + '.png'} width="24" height="24" alt="" />
                    {link.label}
                    <span className={styles.arrow} aria-hidden="true">↗</span>
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <a className={styles.enter} href="/desktop">
            <img src="/icons/welcome-computer.png" width="32" height="32" alt="" />
            enter desktop
          </a>
        </div>
        <footer className={styles.footer}>
          {footerLinks.map(link => <a key={link.href} href={link.href}>{link.label}</a>)}
        </footer>
      </div>
    </main>
  );
}
