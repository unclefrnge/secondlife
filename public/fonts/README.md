# ChamberOS bundled fonts

- `sysfont.otf`: Macintosh Sysfont Chicago recreation by NOW IN TIME, copied unmodified from the user's downloaded font in `~/Library/Fonts`. CC BY 4.0 International: https://creativecommons.org/licenses/by/4.0/
  Source: https://nowintime.itch.io/macintosh-sysfont-chicago-pixel-art-gameboy-font
  The recreation follows the classic Macintosh aesthetic associated with Susan Kare's original Chicago; NOW IN TIME is credited for the recreation.
- `Pixelspace-Regular.woff2`: inactive candidate retained for comparison. Unmodified official Pixelspace web font by Kumar Anirudha. SIL Open Font License 1.1; see `Pixelspace-OFL.txt` (includes copyright notice).
  Source: https://github.com/anistark/pixelspace/tree/main/fonts
  https://pixelspace.anirudha.dev
- R95 Sans Serif: imported from `@react95/fonts/sans-serif/8pt`, `/10pt`, `/12pt`. These npm CSS files embed WOFF2/TTF data URLs; there are no external font requests. Native sizes: 13px, 16px, 20px. Source: https://github.com/React95/R95-fonts
  R95 Sans Serif is derived from Microsoft Windows 95 bitmap font data. Original bitmap data © Microsoft Corporation. Only the conversion tooling is MIT licensed, not the font data.
- `GothicByte.ttf`: GothicByte by Igor Ovsyannykov / HipFonts, copied unmodified from the user's installed font. Credited use for this non-commercial personal project; obtain an appropriate license before commercial use.
  Commercial license: https://hipfonts.gumroad.com/l/ExtendedCommericalUseLicense
- `OldEnglishGothicPixel-Regular.ttf`: Old English Gothic Pixel by ColorSwitchFan25, copied unmodified from the user's installed font. SIL Open Font License 1.1; see `OldEnglishGothicPixel-OFL.txt`.
  Source: https://fontstruct.com/fontstructions/show/1535174/old-english-gothic-pixel

CSS uses web-only aliases and no `local()` source. Font Book is not required.
The active interface uses R95 Sans Serif for body and machine text, Sysfont for identity and window-title roles, GothicByte for major lore headings, and Old English Gothic Pixel for secondary lore markers.
