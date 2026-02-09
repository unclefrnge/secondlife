const entries = [
  'Ghost of the Chamber',
  'Knight of the Chamber',
  'Seer Samuel',
  'Sister Crumb',
  'Clockkeeper Luma',
  'Analog Nomad Sigil'
];

export function LoreIndex() {
  return (
    <section className="space-y-3">
      <header>
        <h2 className="text-base font-medium text-text">Lore Index</h2>
        <p className="text-xs text-muted">Reference table. Expanded index pending.</p>
      </header>

      <ul className="space-y-2 rounded-md border border-border bg-black/20 p-3 text-sm text-text">
        {entries.map((entry) => (
          <li key={entry} className="border-b border-border pb-2 last:border-b-0 last:pb-0">
            {entry}
          </li>
        ))}
      </ul>
    </section>
  );
}
