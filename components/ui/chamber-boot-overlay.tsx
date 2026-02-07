import { cn } from '@/lib/utils';

interface ChamberBootOverlayProps {
  title: string;
  subtitle: string;
  progress: number;
  label?: string;
  className?: string;
}

export function ChamberBootOverlay({ title, subtitle, progress, label, className }: ChamberBootOverlayProps) {
  return (
    <div className={cn('fixed inset-0 z-[80] flex items-center justify-center bg-black/76 backdrop-blur-[1px]', className)}>
      <section className="w-[min(560px,calc(100%-2rem))] rounded-[12px] border border-border bg-[#0d0d0f] p-4 sm:p-5 animate-window-pop">
        {label ? <p className="text-xs uppercase tracking-[0.12em] text-muted">{label}</p> : null}
        <h2 className="mt-2 text-xl font-medium text-text">{title}</h2>
        <p className="mt-1 text-sm text-muted">{subtitle}</p>

        <div className="mt-4 flex justify-center">
          <svg width="132" height="84" viewBox="0 0 132 84" role="img" aria-label="Chamber logo boot animation">
            <path
              d="M16 70 L16 14 L44 14 L60 34 L60 70 Z"
              fill="none"
              stroke="rgba(243,241,234,0.88)"
              strokeWidth="2"
              className="chamber-logo-path"
            />
            <path
              d="M74 70 L74 14 L116 14"
              fill="none"
              stroke="rgba(243,241,234,0.88)"
              strokeWidth="2"
              className="chamber-logo-path chamber-logo-delay"
            />
            <circle cx="104" cy="70" r="10" fill="none" stroke="rgba(243,241,234,0.88)" strokeWidth="2" className="chamber-logo-path chamber-logo-delay-2" />
            <circle cx="104" cy="70" r="2.3" fill="rgba(243,241,234,0.9)" className="chamber-logo-dot" />
          </svg>
        </div>

        <div className="mt-3 h-[2px] overflow-hidden rounded bg-border">
          <div
            className="h-full bg-text transition-[width] duration-150 ease-linear"
            style={{ width: `${Math.round(Math.min(Math.max(progress, 0), 1) * 100)}%` }}
          />
        </div>
      </section>
    </div>
  );
}
