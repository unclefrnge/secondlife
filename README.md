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

- `/` Public FRNGE music and project links
- `/desktop` Green simulated boot and closed visitor login
- `/contact` Artist inquiries
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

## Contact form

Production uses FormSubmit’s standard HTML endpoint with its hosted reCAPTCHA and a hidden honeypot. The first submission requests activation at the artist email address. After a successful submission, visitors return to `/contact?submitted=1`.

For the alternative Resend transport, configure the following server environment variables and restart the app. Use a Cloudflare Turnstile widget restricted to the site’s hostnames and a sender address verified in Resend.

| Variable | Purpose |
| --- | --- |
| `TURNSTILE_SITE_KEY` | Public widget key |
| `TURNSTILE_SECRET_KEY` | Private server verification key |
| `RESEND_API_KEY` | Sending API key |
| `CONTACT_FROM_EMAIL` | Verified sender address |

Mail goes to the artist address in `lib/config.ts`. Reply addresses come from the form. A server-side spam check precedes delivery. The form confirms submission after Resend accepts the message.

For a local rehearsal, set `CONTACT_PREVIEW_INBOX` to a private directory outside the checkout and bind the server to loopback. This mode uses Cloudflare’s test widget and saves each test inquiry as a private JSON file. Leave the variable unset on public servers. Outside production, the contact page shows the artist’s email address when neither transport is configured.
