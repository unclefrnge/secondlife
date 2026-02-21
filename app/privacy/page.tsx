import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <main className="mx-auto min-h-dvh w-full max-w-3xl px-6 py-14 sm:px-10 sm:py-20">
      <section className="space-y-6">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-[0.12em] text-muted">SECOND LIFE</p>
          <h1 className="text-3xl font-medium text-text sm:text-4xl">Privacy</h1>
        </header>

        <div className="space-y-2 text-sm text-muted">
          <p>We collect your email only when you subscribe for the free download.</p>
          <p>We send one or two emails a month. Each email includes an unsubscribe link.</p>
          <p>We do not sell your data.</p>
          <p>Questions: hello@chambercollective.example</p>
        </div>

        <Link
          href="/"
          className="inline-flex min-h-11 items-center rounded-md px-2 text-sm text-muted transition-colors duration-ui ease-calm hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          Return to listening
        </Link>
      </section>
    </main>
  );
}
