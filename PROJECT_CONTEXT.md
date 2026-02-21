# PROJECT_CONTEXT

## One-liner
Second Life is a Next.js web app that presents a stylized ChamberOS desktop with an embedded Winamp-style player and a built-in text quest.

## Current state
### Works
- Boot -> login -> desktop flow on `/` with local session persistence for the Knight profile.
- Desktop-style window manager: open, focus, drag (desktop), minimise, close, and restore windows.
- Core app windows are wired: Chamber Text Quest, Listen, Support, Steal, and utility windows.
- Listen now renders an embedded Winamp-style media player directly in the `listen` window.
- Legacy listening routes (`/chapters`, `/appendix`) redirect to `/`.
- Mobile window behavior now renders app windows as an overlay layer with internal window scrolling.

### Partial
- Download signup is simulated in-app (`submitPlaceholder`) rather than integrated with a real provider.
- Several outbound URLs are placeholders in config and need production values.

### Not started
- No backend/API layer in this repo for auth, subscriptions, or persistence beyond browser storage.

## Product intent
- Target user: listeners/fans entering a narrative album experience rather than a plain music link page.
- Core problem: provide a coherent, immersive playback and discovery UI that keeps users inside the project world.
- Non-goals:
  - Traditional account system or multi-user backend.
  - Generic CMS/admin panel.
  - Full operating-system simulation beyond the product experience.

## Tech stack and architecture
- Framework: Next.js 14 App Router with React 18 and TypeScript.
- Styling/UI: Tailwind CSS with CSS variable theme tokens in `app/globals.css`; Radix primitives for dialog/dropdown/separator/toggle.
- State model:
  - Local React state drives runtime UI (desktop windows, focus, drag, login stage).
  - Browser `localStorage` persists key progress/session data for desktop and text quest.
- Desktop architecture:
  - `app/page.tsx` is the orchestration layer for system stages, workspace sizing, shortcuts, and window actions.
  - `lib/windowStore.ts` defines `AppId`, `ChamberWindow`, window metadata, and pure window state transitions.
  - `components/windows/WindowManager.tsx` maps visible windows to app content and controls modal dialogs.
  - `components/windows/OSWindow.tsx` renders platform-specific window shells (desktop draggable vs mobile full-height panel).
- Configuration/content:
  - `lib/config.ts` is the single config source for project metadata, tracks, links, and download settings.

## Key decisions (with reasons)
- Keep all major experience state client-side with local storage fallback/persistence to avoid backend dependency for MVP.
- Use a faux desktop/window model on `/` to unify album navigation, utility links, and text quest in one interaction language.
- Centralize window contracts and transitions in `lib/windowStore.ts` to keep window behavior predictable and testable.
- Keep product links/content in `lib/config.ts` so release updates do not require component rewrites.
- Split mobile and desktop window shells in `OSWindow` because interaction constraints differ (touch scrolling vs drag/move windows).

## Interfaces/state/contracts
- Window identity and routing:
  - `AppId` in `lib/windowStore.ts` is the canonical list of openable app windows.
- Window state contract:
  - `ChamberWindow` in `lib/windowStore.ts` (`id`, `appId`, `title`, `zIndex`, `isMinimised`, `x`, `y`, `width`, `height`).
- Window transitions:
  - `createWindow`, `focusWindow`, `minimiseWindow`, `restoreWindow`, `closeWindow`, `bringAllToFront` in `lib/windowStore.ts`.
- Mobile breakpoint contract:
  - `useIsMobile` in `lib/hooks/use-is-mobile.ts` uses `(max-width: 767px)`.

## Running the project
- Requirements: Node.js (README recommends 18.18+).
- Install: `npm install`
- Dev server: `npm run dev`
- Typecheck: `npm run typecheck`
- Lint: `npm run lint`
- Production build: `npm run build` then `npm run start`
- Environment variables:
  - None required by current code paths.

## Current priorities
### Now
- Stabilize mobile UX for ChamberOS windows and verify behavior across iOS Safari viewport/footer constraints.
- Replace placeholder download/steal URLs with production destinations.

### Next
- Integrate real newsletter/signup flow for `/download` and handle success/error states from provider APIs.
- Tighten route-level QA for window navigation and persistence across `/`, `/download`, and `/chamber-text-quest`.

### Later
- Add automated tests around window state transitions and critical route state persistence.
- Consider extracting large page orchestrators into smaller feature modules for maintainability.

## Known issues and constraints
- `app/download/page.tsx` uses `submitPlaceholder` and does not call a real provider.
- `lib/config.ts` includes `example.com` placeholder URLs for download and some steal/support endpoints.
- `app/layout.tsx` metadata base URL is set to `https://second-life.example.com` and should match real deployment domain.
- Experience persistence is browser-local; state does not sync across devices/browsers.

## Change log (significant only)
- 2026-02-21: Replaced guided/direct listening flow with a single embedded Winamp-style player in the ChamberOS Listen window.
  - Behavior change: `listen` window now hosts the player directly instead of linking to mode routes.
  - Behavior change: `/chapters` and `/appendix` now redirect to `/`.
  - Cleanup: removed guided/direct components and local listening-progress hook/state modules.
- 2026-02-21: Adjusted Listen window chrome so the player is the primary visible surface.
  - Behavior change: removed window-body padding for `listen` so the Winamp UI sits flush (no extra “contained box” spacing).
  - Behavior change: updated default Listen window size to better match the player dimensions.
- 2026-02-21: Fixed mobile window rendering behavior in ChamberOS so opened windows no longer get pushed below the icon grid.
  - Behavior change: mobile window layer is now an absolute overlay container with touch scrolling.
  - Behavior change: mobile window body now fills available height and scrolls internally.
  - Stable references: `components/windows/WindowManager.tsx` (`WindowManager`), `components/windows/OSWindow.tsx` (`OSWindow`).
