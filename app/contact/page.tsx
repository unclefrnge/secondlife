import { frnge } from '@/lib/config';
import { contactSettings } from '@/lib/contact-settings';
import shell from '../home.module.css';
import styles from './contact.module.css';
import ContactForm from './ContactForm';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'contact · FRNGE' };

export default function ContactPage() {
  const settings = contactSettings();
  return (
    <main className={shell.page}>
      <div className={shell.window}>
        <header className={shell.bar}>
          <h1 className={styles.title}><img src="/chamber-logo.svg" alt="" width="34" height="18" />contact</h1>
          <span>ChamberOS</span>
        </header>
        <section className={styles.body}>
          <a className={styles.back} href="/">← back to links</a>
          {settings.mode === 'offline' ? (
            <p>The inquiry form is temporarily unavailable. You can reach me at <a href={'mailto:' + frnge.email}>{frnge.email}</a>.</p>
          ) : (
            <ContactForm siteKey={settings.siteKey} preview={settings.mode === 'preview'} />
          )}
        </section>
      </div>
    </main>
  );
}
