import { featuredLinks, footerLinks, musicLinks } from '@/lib/home-links';
import styles from '@/app/home.module.css';

export function WelcomeContent() {
  return (
    <>
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
                    {link.sigil && <span className={styles.projectSigil} aria-hidden="true">{link.sigil}</span>}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        )}
        <nav id="listen" tabIndex={-1} className={styles.directory} aria-label="Listen to FRNGE">
          <h1>listen</h1>
          <ul>
            {musicLinks.map(link => (
              <li key={link.href}>
                <a href={link.href}>
                  <img className={styles.platform} src={'/icons/platforms/' + link.icon + '.png'} width="24" height="24" alt="" />
                  {link.label}
                  <span className={styles.sigil} aria-hidden="true">{link.sigil}</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <footer className={styles.footer}>
        {footerLinks.map(link => <a key={link.href} href={link.href}>{link.label}</a>)}
      </footer>
    </>
  );
}
