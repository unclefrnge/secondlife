'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile';
import { submitInquiry } from './actions';
import styles from './contact.module.css';

export default function ContactForm({ siteKey, preview }: { siteKey: string; preview: boolean }) {
  const widget = useRef<TurnstileInstance>(undefined);
  const requestId = useRef('');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string }>();
  const [challengeError, setChallengeError] = useState(false);

  const [compact, setCompact] = useState(false);
  useEffect(() => {
    const narrow = window.matchMedia('(max-width: 375px)');
    const resize = () => setCompact(narrow.matches);
    resize();
    narrow.addEventListener('change', resize);
    return () => narrow.removeEventListener('change', resize);
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending) return;
    const data = new FormData(event.currentTarget);
    if (!data.get('cf-turnstile-response')) {
      setResult({ ok: false, message: 'Complete the spam check before sending.' });
      return;
    }
    requestId.current ||= crypto.randomUUID();
    data.set('requestId', requestId.current);
    setResult(undefined);
    setSending(true);
    try {
      const response = await submitInquiry(data);
      setResult(response);
      if (!response.ok) widget.current?.reset();
    } catch {
      setResult({ ok: false, message: 'The connection was interrupted. Please try again.' });
      widget.current?.reset();
    } finally {
      setSending(false);
    }
  }

  if (result?.ok) return <p role="status" className={styles.confirmation}>{result.message}</p>;
  return (
    <form className={styles.form} onSubmit={submit}>
      {preview && <p className={styles.note}>Local preview · test inquiries are saved on this computer.</p>}
      <noscript>Enable JavaScript to complete the spam check and send an inquiry.</noscript>
      <label>your email<input type="email" name="email" autoComplete="email" maxLength={254} required /></label>
      <label>message<textarea name="message" rows={5} maxLength={4000} required /></label>
      <div className={styles.trap} aria-hidden="true">
        <label>website<input name="website" tabIndex={-1} autoComplete="off" /></label>
      </div>
      <Turnstile ref={widget} siteKey={siteKey} options={{ action: 'contact', theme: 'dark', size: compact ? 'compact' : 'flexible' }}
        scriptOptions={{ onError: () => setChallengeError(true) }}
        onError={() => setChallengeError(true)} onUnsupported={() => setChallengeError(true)}
        onSuccess={() => setChallengeError(false)} />
      {challengeError && <p role="status">The spam check couldn’t load. Refresh this page to try again.</p>}
      {result && <p role="alert">{result.message}</p>}
      <button type="submit" disabled={sending}>{sending ? 'sending…' : 'send inquiry'}</button>
    </form>
  );
}
