# Second Life MVP

Minimalist listening experience for the six-track release, with Guided and Direct modes.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Local storage state persistence

## Aesthetic Direction

- Industrial Dark (near-black surfaces, restrained monochrome hierarchy, one subtle focus accent)

## Routes

- `/` Boot and mode selection
- `/chapters` Main listening experience with guided lead-ins and access modal
- `/download` Newsletter-gated download flow (placeholder integration)
- `/appendix` Locked extras, unlocked via guided completion
- `/privacy` Plain-language email data disclosure

## Core Behavior

- Guided mode shows SVG lead-ins on first open per track.
- Direct mode starts playback immediately.
- Progress persists via local storage when available.
- Appendix unlocks after all six tracks are completed in Guided mode.
- Interstitial pauses appear between guided chapters with a skip option.

## Configuration

Edit `lib/config.ts` for:

- Track titles/order/embed URLs
- Streaming and support links
- Download URLs
- Newsletter provider hosted link
- Appendix content

## Local Development

1. Install Node.js (18.18+ recommended).
2. Install dependencies:
   - `npm install`
3. Run dev server:
   - `npm run dev`

## Notes

- Download subscription submit is currently a placeholder function in `app/download/page.tsx`.
- Replace `https://example.com/...` links in `lib/config.ts` before production.
