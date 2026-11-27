# FRNGE / Second Life

FRNGE’s personal website, centred on **Second Life, his debut album**, with a ChamberOS desktop, CH4MB3R Player listening window and Chamber Text Quest.

The public home opens to the music links. To promote a project above “listen”, add its title, URL and optional cover artwork and caption to `featuredLinks`. An empty list hides the section. Add, remove or reorder entries in [the home link list](lib/home-links.ts). At `/desktop`, the skippable boot ends at the closed resident login. The public build leaves `CHAMBER_DESKTOP_OPEN` unset. To restore the interactive resident session, set it to `true` before building.

- [Creative direction](docs/CREATIVE-DIRECTION.md)
- [Selected typography direction](docs/TYPOGRAPHY.md)
- [Current creative/UX audit](output/creative-audit-2026-11-14/REVIEW.md)
- [Lightweight Chamber source index](docs/CHAMBER-SOURCES.md)

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Local storage state persistence

## Aesthetic Direction

Chamber story references and desktop content boundaries are recorded in [docs/LORE.md](docs/LORE.md).

- Industrial Dark (near-black surfaces, restrained monochrome hierarchy, one subtle focus accent)

## Routes

- `/` Public music links
- `/desktop` ChamberOS workspace
- `/chamber-text-quest` Chamber Text Quest (retro parser game)
- `/chapters` Legacy route; redirects to `/`
- `/download` Newsletter-gated download flow (placeholder integration)
- `/appendix` Legacy route; redirects to `/`
- `/privacy` Plain-language email data disclosure

## Core Behavior

- CH4MB3R Player opens a compact ChamberOS window with a green recording display, silver-green transport and a selectable track list. The portfolio uses the same face for externally hosted recordings.
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

## Publish a release on the clock calendar

**On this Mac:** open the [release form](scripts/release-editor.html) in a browser. Enter the title and release date, and add a listening link when one is available. Tick **Show on the calendar** and choose **Save release file**. Save in this repository’s `content/releases` folder. If your browser downloads the file, move it there. The development preview reads it when you reopen the clock. The public site picks it up when the file is committed and the site is rebuilt and deployed.

**Online:** once these changes are on GitHub, open [Pages CMS](https://app.pagescms.org), sign in, and give its GitHub App access to `unclefrnge/secondlife`. Select the site branch, then **Release calendar → New entry**. The form writes the same files to the repository. Open an existing entry to change its date, add its listening link or remove it from the calendar. Saving a future date with visibility on announces it straight away on the next deployment. [Pages CMS setup](https://pagescms.org/docs/quick-start/)

Leave the visibility switch off for a draft. Draft content is excluded from the site’s calendar feed. For an embargoed announcement, keep the draft file local until you’re ready to share its contents with people who can read the repository.

Bandcamp album and track pages, YouTube watch links, Apple Music song and album links, and Mixcloud show links can open CH4MB3R Player. The calendar uses the public release page if a provider has no available embed. Entries without a link still display the title and date. The existing Releases & radio archive supplies historical entries automatically.

## Local Development

Chamber Line continuity checks: `node --test tests/intercom.test.mjs` (verified with Node 24). These cover both reply branches, delivery timing, read prerequisites, reloads and protected saves. Lore and ecosystem decisions live in [docs/LORE.md](docs/LORE.md).

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
