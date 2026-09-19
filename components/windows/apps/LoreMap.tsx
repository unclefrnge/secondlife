const asciiMap = String.raw`
                           CHAMBER DISTRICT

   [Gogo's Grocer] ---- [CHMBR Bar] ---- [Festive Board]
         |                  |                 |
 [Market of Whispers]  [kakNET Studios]  [PENjan Station]
         |                  |                 |
 [Home Affairs Outpost] -- [Null-Lot] -- [Melville Forest Gate]
                                  \
                            [Belt of Kombucha Pipes]
`;

export function LoreMap() {
  return (
    <section className="space-y-3">
      <header>
        <h2 className="font-lore text-xl tracking-[0.04em] text-text">Lore Map</h2>
        <p className="text-xs text-muted">Topography index (ASCII draft).</p>
      </header>

      <pre className="overflow-x-auto rounded-md border border-border bg-black/30 p-3 text-xs leading-6 text-text">
        {asciiMap}
      </pre>
    </section>
  );
}
