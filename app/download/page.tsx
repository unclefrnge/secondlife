'use client';

import Link from 'next/link';
import { FormEvent, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { downloadConfig, newsletter } from '@/lib/config';

type SubmitStatus = 'idle' | 'submitting' | 'success';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function submitPlaceholder(email: string) {
  await new Promise((resolve) => window.setTimeout(resolve, 850));

  if (!navigator.onLine || email.includes('+offline')) {
    return { ok: false as const, reason: 'network' as const };
  }

  if (email.includes('+existing')) {
    return { ok: true as const, alreadySubscribed: true };
  }

  return { ok: true as const, alreadySubscribed: false };
}

export default function DownloadPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [status, setStatus] = useState<SubmitStatus>('idle');
  const [alreadySubscribed, setAlreadySubscribed] = useState(false);

  const helper = useMemo(() => {
    if (!alreadySubscribed) {
      return 'One or two emails a month. Unsubscribe any time.';
    }
    return 'You are already subscribed. Download is ready.';
  }, [alreadySubscribed]);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    const normalized = email.trim().toLowerCase();
    if (!EMAIL_REGEX.test(normalized)) {
      setError('Enter a valid email address.');
      return;
    }

    setStatus('submitting');

    const result = await submitPlaceholder(normalized);

    if (!result.ok) {
      setStatus('idle');
      setError('Network failure. Please try again in a moment.');
      return;
    }

    setAlreadySubscribed(result.alreadySubscribed);
    setStatus('success');
  };

  return (
    <main className="mx-auto min-h-dvh w-full max-w-3xl px-6 py-14 sm:px-10 sm:py-20">
      {status === 'success' ? (
      <section className="space-y-8">
          <header className="space-y-2">
            <p className="text-xs uppercase tracking-[0.12em] text-muted">SECOND LIFE</p>
            <h1 className="text-3xl font-medium text-text sm:text-4xl">Download ready</h1>
            <p className="text-sm text-muted">{helper}</p>
          </header>

          <div className="grid gap-3">
            <a
              href={downloadConfig.mp3Url}
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-border bg-surface px-4 py-2 text-sm text-text transition-colors duration-ui ease-calm hover:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              Download MP3
            </a>

            <a
              href={downloadConfig.wavUrl}
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-border bg-surface px-4 py-2 text-sm text-text transition-colors duration-ui ease-calm hover:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              Download WAV
            </a>

            <a
              href={downloadConfig.artworkUrl}
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-border bg-surface px-4 py-2 text-sm text-text transition-colors duration-ui ease-calm hover:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              Download artwork
            </a>
          </div>

          <Link
            href="/"
            className="inline-flex min-h-11 items-center rounded-md px-2 text-sm text-muted transition-colors duration-ui ease-calm hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            Return to listening
          </Link>
        </section>
      ) : (
        <section className="space-y-8">
          <header className="space-y-3">
            <p className="text-xs uppercase tracking-[0.12em] text-muted">SECOND LIFE</p>
            <h1 className="text-3xl font-medium text-text sm:text-4xl">Free download</h1>
            <p className="text-sm text-muted">
              Subscribe to the Chamber Collective newsletter to access the free download. One or two emails a month.
              Unsubscribe any time.
            </p>
          </header>

          <form className="space-y-4 rounded-md border border-border bg-surface p-4 sm:p-5" onSubmit={onSubmit} noValidate>
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-text">
                Email
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                hasError={Boolean(error)}
                autoComplete="email"
                aria-invalid={Boolean(error)}
                aria-describedby={error ? 'download-error' : undefined}
              />
              {error ? (
                <p id="download-error" className="text-sm text-danger">
                  {error}
                </p>
              ) : null}
            </div>

            <Button type="submit" variant="primary" loading={status === 'submitting'}>
              {newsletter.submitButtonLabel}
            </Button>
          </form>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/"
              className="inline-flex min-h-11 items-center rounded-md px-2 text-sm text-muted transition-colors duration-ui ease-calm hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              Return to listening
            </Link>
            <Link
              href="/privacy"
              className="inline-flex min-h-11 items-center rounded-md px-2 text-sm text-muted transition-colors duration-ui ease-calm hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              Privacy
            </Link>
            <a
              href={downloadConfig.providerHostedSignupUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-11 items-center rounded-md px-2 text-sm text-muted transition-colors duration-ui ease-calm hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              Hosted signup
            </a>
          </div>
        </section>
      )}
    </main>
  );
}
