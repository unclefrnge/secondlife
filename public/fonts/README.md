# ChamberOS bundled fonts

## Active fonts — selected 14 November 2026

- `GeistPixel-Square.woff2`: Geist Pixel Square by The Geist Project Authors, unmodified. SIL Open Font License 1.1; see `GeistPixel-OFL.txt`. System titles and identity headings. Source: https://github.com/vercel/geist-font at commit `ef2597cfc42f4797676df105517ccc0a1cfa6569`, `fonts/GeistPixel/webfonts/GeistPixel-Square.woff2`.
- `IBMPlexSans-Regular.woff2`, `IBMPlexSans-Medium.woff2`, `IBMPlexSans-Italic.woff2`: IBM Plex Sans by IBM, unmodified. SIL Open Font License 1.1; see `IBMPlexSans-OFL.txt`. Reading and interface text. Source: https://github.com/IBM/plex at commit `bc6a7e4b37634eb79785d59781893db63ee3edcb`, `packages/plex-sans/fonts/complete/woff2/`.
- `GothicByte.ttf`: retained for occasional story headings; attribution below.

## Retained source records

Chicago, R95, Old English Gothic Pixel and Pixelspace are inactive in the current shared shell. Their files and attributions are retained for continuity.

- `sysfont.otf`: Macintosh Sysfont Chicago recreation by NOW IN TIME, copied unmodified from the user's downloaded font in `~/Library/Fonts`. CC BY 4.0 International: https://creativecommons.org/licenses/by/4.0/
  Source: https://nowintime.itch.io/macintosh-sysfont-chicago-pixel-art-gameboy-font
  The recreation follows the classic Macintosh aesthetic associated with Susan Kare's original Chicago; NOW IN TIME is credited for the recreation.
- `Pixelspace-Regular.woff2`: inactive candidate retained for comparison. Unmodified official Pixelspace web font by Kumar Anirudha. SIL Open Font License 1.1; see `Pixelspace-OFL.txt` (includes copyright notice).
  Source: https://github.com/anistark/pixelspace/tree/main/fonts
  https://pixelspace.anirudha.dev
- R95 Sans Serif: previously imported from `@react95/fonts/sans-serif/8pt`, `/10pt`, `/12pt`; those imports have been removed. These npm CSS files embed WOFF2/TTF data URLs. Native sizes: 13px, 16px, 20px. Source: https://github.com/React95/R95-fonts
  R95 Sans Serif is derived from Microsoft Windows 95 bitmap font data. Original bitmap data © Microsoft Corporation. Only the conversion tooling is MIT licensed, not the font data.
- `GothicByte.ttf`: GothicByte by Igor Ovsyannykov / HipFonts, copied unmodified from the user's installed font. Credited use for this non-commercial personal project; obtain an appropriate license before commercial use.
  Commercial license: https://hipfonts.gumroad.com/l/ExtendedCommericalUseLicense
- `OldEnglishGothicPixel-Regular.ttf`: Old English Gothic Pixel by ColorSwitchFan25, copied unmodified from the user's installed font. SIL Open Font License 1.1; see `OldEnglishGothicPixel-OFL.txt`.
  Source: https://fontstruct.com/fontstructions/show/1535174/old-english-gothic-pixel

CSS uses web-only aliases and no `local()` source. Font Book is not required.
The active interface uses Geist Pixel Square for system titles, IBM Plex Sans for reading and UI, and GothicByte for occasional story headings. Native monospace remains available for actual preformatted content. See `docs/TYPOGRAPHY.md`.
