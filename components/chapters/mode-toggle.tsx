'use client';

import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import type { ListeningMode } from '@/lib/types';

interface ModeToggleProps {
  mode: ListeningMode;
  onModeChange: (mode: ListeningMode) => void;
}

export function ModeToggle({ mode, onModeChange }: ModeToggleProps) {
  return (
    <ToggleGroup
      type="single"
      value={mode}
      onValueChange={(value) => {
        if (value === 'guided' || value === 'direct') {
          onModeChange(value);
        }
      }}
      className="p-1"
      aria-label="Mode"
    >
      {(['guided', 'direct'] as const).map((item) => (
        <ToggleGroupItem key={item} value={item} className="capitalize">
          {item}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
