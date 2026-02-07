import { cn } from '@/lib/utils';

interface WindowControlsProps {
  onClose: () => void;
  onMinimize?: () => void;
  onToggleExpand?: () => void;
  expanded?: boolean;
  className?: string;
}

interface TrafficLightProps {
  colorClass: string;
  label: string;
  symbol: string;
  onClick: () => void;
}

function TrafficLight({ colorClass, label, symbol, onClick }: TrafficLightProps) {
  return (
    <button
      type="button"
      aria-label={label}
      onPointerDown={(event) => {
        event.stopPropagation();
      }}
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
      className={cn(
        'group/light relative inline-flex h-4 w-4 items-center justify-center rounded-full border border-black/30 text-[10px] text-black/75 transition-transform duration-ui ease-calm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
        colorClass,
        'hover:scale-105'
      )}
    >
      <span className="pointer-events-none opacity-0 transition-opacity duration-ui ease-calm group-hover/light:opacity-100">
        {symbol}
      </span>
    </button>
  );
}

export function WindowControls({
  onClose,
  onMinimize,
  onToggleExpand,
  expanded = false,
  className
}: WindowControlsProps) {
  return (
    <div className={cn('flex items-center gap-[7px]', className)} role="group" aria-label="Window controls">
      <TrafficLight colorClass="bg-[#ff5f57]" label="Close window" symbol="x" onClick={onClose} />
      <TrafficLight
        colorClass="bg-[#febc2e]"
        label="Minimize window"
        symbol="-"
        onClick={onMinimize ?? onClose}
      />
      <TrafficLight
        colorClass="bg-[#28c840]"
        label={expanded ? 'Restore window size' : 'Expand window'}
        symbol={expanded ? '<>' : '+'}
        onClick={onToggleExpand ?? (() => undefined)}
      />
    </div>
  );
}
