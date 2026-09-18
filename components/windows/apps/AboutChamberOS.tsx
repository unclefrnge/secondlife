import { Separator } from '@/components/ui/separator';

const creditLink = 'underline decoration-border underline-offset-4 hover:decoration-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent';

export function AboutChamberOS() {
  return (
    <section className="space-y-3 text-sm text-text" aria-label="ChamberOS font credits">
      <header>
        <h2 className="font-identity text-base">About ChamberOS</h2>
        <p className="font-machine mt-1 text-muted">WEBOS BUILD 0002 · DMZ</p>
        <p className="mt-1 text-muted">Three voices. One haunted cache.</p>
      </header>
      <Separator />
      <section className="space-y-1" aria-labelledby="credit-r95">
        <h3 id="credit-r95">R95 Fonts</h3>
        <p>Modern web conversion provided by the React95 R95-fonts project.</p>
        <a className={creditLink} href="https://github.com/React95/R95-fonts" target="_blank" rel="noreferrer">React95 / R95-fonts</a>
        <p className="text-muted">R95 Sans Serif is derived from Microsoft Windows 95 bitmap font data. Original bitmap data © Microsoft Corporation.</p>
        <p className="text-muted">The conversion tooling is MIT licensed; the original bitmap data remains copyrighted.</p>
      </section>
      <Separator />
      <section className="space-y-1" aria-labelledby="credit-sysfont">
        <h3 id="credit-sysfont" className="font-identity">Macintosh Sysfont Chicago</h3>
        <p>Typeface recreation by NOW IN TIME.</p>
        <p>Based on the classic Macintosh system-font aesthetic associated with Susan Kare’s Chicago.</p>
        <p className="text-muted">Licensed under <a className={creditLink} href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">Creative Commons Attribution 4.0 International</a>. Font bundled unmodified.</p>
        <a className={creditLink} href="https://nowintime.itch.io/macintosh-sysfont-chicago-pixel-art-gameboy-font" target="_blank" rel="noreferrer">NOW IN TIME / Macintosh Sysfont Chicago</a>
      </section>
      <Separator />
      <section className="space-y-1" aria-labelledby="credit-pixelspace">
        <h3 id="credit-pixelspace" className="font-machine">Pixelspace</h3>
        <p>Set in Pixelspace, a 5×7 pixel typeface by Kumar Anirudha.</p>
        <p className="text-muted">Licensed under the <a className={creditLink} href="/fonts/Pixelspace-OFL.txt" target="_blank" rel="noreferrer">SIL Open Font License 1.1</a>.</p>
        <p className="flex flex-wrap gap-x-3 gap-y-1">
          <a className={creditLink} href="https://pixelspace.anirudha.dev" target="_blank" rel="noreferrer">pixelspace.anirudha.dev</a>
          <a className={creditLink} href="https://github.com/anistark/pixelspace" target="_blank" rel="noreferrer">anistark / pixelspace</a>
        </p>
      </section>
    </section>
  );
}
