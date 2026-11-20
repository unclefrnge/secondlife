'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';

type BootPhase = 'post' | 'manager' | 'loader' | 'handoff';
const BOOT_TOTAL_MS = 4000;
const BOOT_PHASE_TIMING = {
  postEnd: Math.round(BOOT_TOTAL_MS * (1700 / 7000)),
  managerEnd: Math.round(BOOT_TOTAL_MS * (2600 / 7000)),
  loaderEnd: Math.round(BOOT_TOTAL_MS * (6800 / 7000)),
  handoffEnd: BOOT_TOTAL_MS
} as const;

const POST_LINES = [
  'CHAMBER BIOS v0.2.13',
  'CPU: EMU CORE OK',
  'MEM: 16384MB OK',
  'VIDEO: VGA OK',
  'USB: 2 devices detected',
  'SATA0: CHMBR_DRIVE_01 OK',
  'NET: LINK UP',
  '[POST] salt integrity........ OK',
  '[POST] kombucha viscosity..... OK',
] as const;

const LOADER_LINES = [
  'initialising kernel...',
  'mounting /archive...',
  'loading drivers...',
  'applying edicts...',
  'starting services...',
  'starting login service...'
] as const;

function getBootPhase(elapsedMs: number): BootPhase {
  if (elapsedMs < BOOT_PHASE_TIMING.postEnd) {
    return 'post';
  }
  if (elapsedMs < BOOT_PHASE_TIMING.managerEnd) {
    return 'manager';
  }
  if (elapsedMs < BOOT_PHASE_TIMING.loaderEnd) {
    return 'loader';
  }
  return 'handoff';
}

export function BootSequence({ onComplete }: { onComplete: () => void }) {
  const [bootElapsedMs, setBootElapsedMs] = useState(0);
  useEffect(() => {
    const start = performance.now();
    const timer = window.setInterval(() => {
      const elapsed = performance.now() - start;
      if (elapsed >= BOOT_TOTAL_MS) {
        window.clearInterval(timer);
        onComplete();
      } else {
        setBootElapsedMs(elapsed);
      }
    }, 50);
    return () => window.clearInterval(timer);
  }, [onComplete]);

  const bootPhase = getBootPhase(bootElapsedMs);
  const bootProgress = Math.min(1, bootElapsedMs / BOOT_TOTAL_MS);
  const managerCountdown = Math.max(0, Math.ceil((BOOT_PHASE_TIMING.managerEnd - bootElapsedMs) / 1000));
  const loaderProgress = Math.min(1, Math.max(0,
    (bootElapsedMs - BOOT_PHASE_TIMING.managerEnd) / (BOOT_PHASE_TIMING.loaderEnd - BOOT_PHASE_TIMING.managerEnd)
  ));
  const loaderVisibleCount = Math.max(1, Math.ceil(loaderProgress * LOADER_LINES.length));

  return (
      <main className="relative min-h-dvh overflow-hidden bg-[#11150f] text-[#c4d59c]">
        <div className="pointer-events-none absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(165,190,134,.035)_1px,transparent_1px),linear-gradient(90deg,rgba(165,190,134,.025)_1px,transparent_1px)] [background-size:100%_24px,24px_100%]" />
        <section className="min-h-dvh flex p-4 sm:p-7">
          <div className="mx-auto grid w-full max-w-[1080px] grid-rows-[auto_minmax(0,1fr)_auto] border-y border-[#535c4a] font-machine">
            <header className="flex items-start justify-between gap-4 border-b border-[#424c3c] py-3">
              <Image src="/chamber-star.svg" alt="Chamber Star" width={210} height={75} className="h-auto w-[150px] [filter:sepia(.6)_hue-rotate(22deg)_saturate(1.4)] opacity-90 sm:w-[190px]" priority />
              <div className="grid grid-cols-2 gap-x-5 text-right text-[11px] uppercase leading-5 tracking-[0.08em] text-[#a0ad90]">
                <span>node</span><span className="text-[#d0dac0]">chmbr-077</span>
                <span>build</span><span className="text-[#d0dac0]">0206.314</span>
                <span>clock</span><span className="text-[#d0dac0]">02:17:13</span>
              </div>
            </header>

            <div className="grid min-h-0 grid-cols-1 gap-8 py-6 md:grid-cols-[minmax(0,1.45fr)_minmax(220px,.55fr)] md:py-10">
              <div className="min-h-0 overflow-hidden text-[13px] leading-6 text-[#ced8c1]">
                <p className="mb-5 text-[11px] uppercase tracking-[0.18em] text-[#a4b398]">resident boot ledger / {bootPhase}</p>

                {bootPhase === 'post' ? (
                  <div className="space-y-0.5">
                    {POST_LINES.map((line) => <p key={line}>{line}</p>)}
                  </div>
                ) : null}

                {bootPhase === 'manager' ? (
                  <div className="space-y-1">
                    <p>CHAMBER BOOT MANAGER</p>
                    <p>default volume........ RESIDENT</p>
                    <p>archive mount......... READ / WRITE</p>
                    <p>handoff in............ {managerCountdown}</p>
                  </div>
                ) : null}

                {bootPhase === 'loader' ? (
                  <div className="space-y-1">
                    {LOADER_LINES.slice(0, loaderVisibleCount).map((line, index) => (
                      <p key={line}><span className="mr-3 text-[#a4b398]">{String(index + 1).padStart(2, '0')}</span>{line}</p>
                    ))}
                  </div>
                ) : null}

                {bootPhase === 'handoff' ? (
                  <div className="flex items-center gap-3">
                    <span className="grid grid-cols-3 gap-1" aria-hidden="true">
                      {[0, 1, 2].map((index) => <span key={index} className="h-2 w-2 motion-safe:animate-pulse bg-[#c4d59c]" style={{ animationDelay: `${index * 120}ms` }} />)}
                    </span>
                    <p className="tracking-[0.12em] text-[#e5e8dc]">OPENING LOGIN</p>
                  </div>
                ) : null}
              </div>

              <aside className="hidden md:block border-l border-[#424c3c] pl-5 text-[11px] uppercase leading-6 tracking-[0.08em] text-[#a4b398]">
                <p className="text-[#c4d59c]">machine notes</p>
                <p className="mt-3">signal........ 2/3</p>
                <p>salt geometry. stable</p>
                <p>kaknet relay... intermittent</p>
                <p>queue token.... 17B</p>
                <p>time drift..... +00:43</p>
                <p className="mt-5 text-[#b2c4a0]">no metrics / no masters</p>
              </aside>
            </div>

            <footer className="grid grid-cols-[1fr_auto] items-end gap-4 border-t border-[#424c3c] py-3">
              <div>
                <div className="mb-2 flex justify-between text-[10px] uppercase tracking-[0.12em] text-[#a4b398]">
                  <span>memory scan</span><span>{Math.round(bootProgress * 100)}%</span>
                </div>
                <div className="h-[3px] overflow-hidden bg-[#353e2e]">
                  <div className="h-full bg-[#c4d59c] motion-safe:transition-[width] duration-75 ease-linear" style={{ width: `${Math.round(bootProgress * 100)}%` }} />
                </div>
              </div>
              <button
                type="button"
                onClick={onComplete}
                aria-label="Skip boot and go to login"
                className="min-h-10 border border-[#535c4a] px-3 text-[11px] uppercase tracking-[0.1em] text-[#bdc9ad] hover:border-[#c4d59c] hover:text-[#e5e8dc] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#c4d59c]"
              >
                skip boot
              </button>
            </footer>
          </div>
        </section>
      </main>
    );
}
