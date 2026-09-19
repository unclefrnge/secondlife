export function ChamberTextQuest() {
  return (
    <section className="space-y-3">
      <header>
        <h2 className="font-lore text-xl tracking-[0.04em] text-text">Chamber Text Quest</h2>
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
