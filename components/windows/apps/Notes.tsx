import { useState } from 'react';

interface NotesProps {
  heading?: string;
  hint?: string;
  initialText?: string;
  readOnly?: boolean;
  machine?: boolean;
}

export function Notes({
  heading = 'Notes',
  hint = 'Simple scratchpad',
  initialText = '',
  readOnly = false,
  machine = false
}: NotesProps) {
  const [value, setValue] = useState(initialText);

  return (
    <section className="space-y-3">
      <header>
        <h2 className="text-base font-medium text-text">{heading}</h2>
        <p className="text-xs text-muted">{hint}</p>
      </header>

      <textarea
        value={value}
        onChange={(event) => setValue(event.target.value)}
        readOnly={readOnly}
        className={`min-h-48 w-full resize-y rounded-md border border-border bg-black/25 p-3 text-sm text-text outline-none transition-colors duration-ui ease-calm focus:border-accent ${machine ? 'font-machine' : ''}`}
        placeholder="Type here..."
      />
    </section>
  );
}
