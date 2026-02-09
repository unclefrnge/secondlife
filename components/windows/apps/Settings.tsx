import { useState } from 'react';

import { Button } from '@/components/ui/button';

export function Settings() {
  const [ritualWarnings, setRitualWarnings] = useState(true);
  const [quietNotifications, setQuietNotifications] = useState(true);

  return (
    <section className="space-y-3">
      <header>
        <h2 className="text-base font-medium text-text">Settings</h2>
        <p className="text-xs text-muted">Desktop preferences (local, mock only).</p>
      </header>

      <div className="space-y-2 rounded-md border border-border bg-black/20 p-3 text-sm text-text">
        <div className="flex items-center justify-between gap-3">
          <span>Ritual warnings</span>
          <Button type="button" size="sm" variant="ghost" onClick={() => setRitualWarnings((value) => !value)}>
            {ritualWarnings ? 'On' : 'Off'}
          </Button>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span>Quiet notifications</span>
          <Button type="button" size="sm" variant="ghost" onClick={() => setQuietNotifications((value) => !value)}>
            {quietNotifications ? 'On' : 'Off'}
          </Button>
        </div>
      </div>
    </section>
  );
}
