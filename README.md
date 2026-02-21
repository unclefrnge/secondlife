# Second Life MVP

Minimalist listening experience for the six-track release with an embedded Winamp-style player in ChamberOS.
Now includes **Chamber Text Quest**, a desktop shortcut parser game inside Chamber OS.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Local storage state persistence

## Aesthetic Direction

- Industrial Dark (near-black surfaces, restrained monochrome hierarchy, one subtle focus accent)

## Routes

- `/` Boot and mode selection
- `/chamber-text-quest` Chamber Text Quest (retro parser game)
- `/chapters` Legacy route; redirects to `/`
- `/download` Newsletter-gated download flow (placeholder integration)
- `/appendix` Legacy route; redirects to `/`
- `/privacy` Plain-language email data disclosure

## Core Behavior

- Listen window opens a Winamp-style media player directly inside ChamberOS.
- Legacy listening routes (`/chapters`, `/appendix`) now route users back to desktop (`/`).
- Desktop includes a **Chamber Text Quest** shortcut with a dedicated launch window.
- Desktop quest app runs in a popup window (`iframe`) so users remain inside the Chamber OS desktop.

## Chamber Text Quest

### Command syntax

- Core: `look`, `go [place]`, `talk [npc]`, `take [item]`, `use [item]`, `inventory`, `status`, `help`
- Ritual: `sniff bread`, `salt-flash`, `wordle`, `pray`, `file form`, `hum b-flat`
- Utility: `undo` (one-step, in-memory)
- Input quality-of-life: numeric quick picks (`1`-`8`) trigger visible choice actions.

### Modes

- `guided`: suggested command chips and softer DC
- `free`: exploration-first sandbox
- `hardcore`: fewer hints and harsher DC

### LocalStorage keys used

- `chamber_mode`: `"guided" | "free" | "hardcore"`
- `chamber_opened_tracks`: `string[]`
- `chamber_completed_tracks`: `string[]`
- `chamber_appendix_unlocked`: `boolean`
- `chamber_save_v1`: full save object (`version: 1`)

If `localStorage` is unavailable, the game falls back to in-memory storage and shows a warning banner.

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
