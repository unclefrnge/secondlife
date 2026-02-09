export function ChamberTextQuest() {
  return (
    <section className="space-y-3">
      <header>
        <h2 className="text-base font-medium text-text">Chamber Text Quest</h2>
        <p className="text-xs text-muted">Runs in-window. No external browser tab.</p>
      </header>

      <div className="overflow-hidden rounded-md border border-border bg-black">
        <iframe
          src="/chamber-text-quest?embedded=1"
          title="Chamber Text Quest"
          loading="lazy"
          className="h-[58dvh] min-h-[320px] w-full"
        />
      </div>
    </section>
  );
}
