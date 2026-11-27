import { Separator } from '@/components/ui/separator';
import { chamberBuild } from '@/lib/config';

const creditLink = 'underline decoration-border underline-offset-4 hover:decoration-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent';

export function AboutChamberOS() {
  return (
    <section className="mx-auto max-w-sm px-5 py-6 text-sm" aria-label="System information">
      <header className="mb-6 text-center">
        <img src="/icons/welcome-computer.png" width="80" height="80" alt="" className="mx-auto mb-3 [image-rendering:pixelated]" />
        <h2 className="font-identity text-3xl">ChamberOS</h2>
        <p className="mt-1 opacity-80">{chamberBuild}</p>
      </header>
      <dl className="mx-auto grid w-fit grid-cols-[auto_1fr] gap-x-5 gap-y-2">
        <dt className="opacity-75">Workspace</dt><dd>Second Life</dd>
        <dt className="opacity-75">Resident</dt><dd>Knight / FRNGE</dd>
        <dt className="opacity-75">Archive</dt>
        <dd><a className={creditLink} href="https://chamber-times.vercel.app/#entry=113" target="_blank" rel="noreferrer">Chamber Times</a></dd>
      </dl>
      <details className="mt-6 border-t border-current/25">
        <summary className="cursor-pointer py-3">Fonts and artwork</summary>
        <Credits />
      </details>
    </section>
  );
}

function Credits() {
  return (
    <div className="space-y-3 text-sm">
      <section className="space-y-1" aria-labelledby="credit-breeze">
        <h3 id="credit-breeze">KDE Breeze icons</h3>
        <p>Desktop, dock and file icons by Uri Herrera and the KDE Breeze contributors.</p>
        <p className="text-muted">Source SVGs bundled unmodified and coloured for this desktop.</p>
        <a className={creditLink} href="https://github.com/KDE/breeze-icons" target="_blank" rel="noreferrer">KDE / Breeze Icons</a>
        <p><a className={creditLink} href="/icons/breeze/COPYING-ICONS" target="_blank" rel="noreferrer">LGPL 3 or later · artwork terms</a></p>
      </section>
      <Separator />
      <section className="space-y-1" aria-labelledby="credit-geist">
        <h3 id="credit-geist" className="system-title">Geist Pixel Square</h3>
        <p>System titles by The Geist Project Authors.</p>
        <a className={creditLink} href="https://vercel.com/font" target="_blank" rel="noreferrer">Geist typefaces</a>
        <p><a className={creditLink} href="/fonts/GeistPixel-OFL.txt" target="_blank" rel="noreferrer">SIL Open Font License 1.1</a></p>
      </section>
      <Separator />
      <section className="space-y-1" aria-labelledby="credit-plex">
        <h3 id="credit-plex">IBM Plex Sans</h3>
        <p>Interface and reading typeface by IBM. Regular, Medium and Italic.</p>
        <a className={creditLink} href="https://github.com/IBM/plex" target="_blank" rel="noreferrer">IBM / Plex</a>
        <p><a className={creditLink} href="/fonts/IBMPlexSans-OFL.txt" target="_blank" rel="noreferrer">SIL Open Font License 1.1</a></p>
      </section>
      <Separator />
      <section className="space-y-1" aria-labelledby="credit-gothicbyte">
        <h3 id="credit-gothicbyte" className="font-lore text-3xl">GothicByte</h3>
        <p>Story display typeface by Igor Ovsyannykov / HipFonts.</p>
        <a className={creditLink} href="https://hipfonts.gumroad.com/l/ExtendedCommericalUseLicense" target="_blank" rel="noreferrer">HipFonts license details</a>
      </section>
      <Separator />
      <details className="space-y-3 text-muted">
        <summary className="cursor-pointer text-text">earlier typefaces</summary>
        <section className="space-y-1" aria-labelledby="credit-r95">
          <h3 id="credit-r95">R95 Fonts</h3>
          <p>Modern web conversion provided by the React95 R95-fonts project.</p>
          <a className={creditLink} href="https://github.com/React95/R95-fonts" target="_blank" rel="noreferrer">React95 / R95-fonts</a>
          <p className="text-muted">R95 Sans Serif is derived from Microsoft Windows 95 bitmap font data. Original bitmap data © Microsoft Corporation.</p>
          <p className="text-muted">The conversion tooling is MIT licensed; the original bitmap data remains copyrighted.</p>
        </section>
        <Separator />
        <section className="space-y-1" aria-labelledby="credit-sysfont">
          <h3 id="credit-sysfont">Macintosh Sysfont Chicago</h3>
          <p>Typeface recreation by NOW IN TIME.</p>
          <p>Based on the classic Macintosh system-font aesthetic associated with Susan Kare’s Chicago.</p>
          <p className="text-muted">Licensed under <a className={creditLink} href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">Creative Commons Attribution 4.0 International</a>. Font bundled unmodified.</p>
          <a className={creditLink} href="https://nowintime.itch.io/macintosh-sysfont-chicago-pixel-art-gameboy-font" target="_blank" rel="noreferrer">NOW IN TIME / Macintosh Sysfont Chicago</a>
        </section>
        <Separator />
        <section className="space-y-1" aria-labelledby="credit-old-english-pixel">
          <h3 id="credit-old-english-pixel">Old English Gothic Pixel</h3>
          <p>Pixel blackletter by ColorSwitchFan25.</p>
          <p className="text-muted">Licensed under the <a className={creditLink} href="/fonts/OldEnglishGothicPixel-OFL.txt" target="_blank" rel="noreferrer">SIL Open Font License 1.1</a>.</p>
          <a className={creditLink} href="https://fontstruct.com/fontstructions/show/1535174/old-english-gothic-pixel" target="_blank" rel="noreferrer">Old English Gothic Pixel on FontStruct</a>
        </section>
      </details>
    </div>
  );
}
