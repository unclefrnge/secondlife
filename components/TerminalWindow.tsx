'use client';

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';

import type { ChamberMode, LogMessage } from '@/engine/types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export interface CommandChip {
  label: string;
  command: string;
}

interface TerminalWindowProps {
  mode: ChamberMode;
  messages: LogMessage[];
  statusLine: string;
  commandChips: CommandChip[];
  onSubmitCommand: (command: string) => void;
}

function roleTone(role: LogMessage['role']): string {
  if (role === 'player') {
    return 'text-[#9debf5]';
  }
  if (role === 'system') {
    return 'text-[#7eb784]';
  }
  return 'text-[#b8f3bf]';
}

export function TerminalWindow({
  mode,
  messages,
  statusLine,
  commandChips,
  onSubmitCommand
}: TerminalWindowProps) {
  const [input, setInput] = useState('');
  const [showAllSuggestions, setShowAllSuggestions] = useState(false);
  const transcriptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!transcriptRef.current) {
      return;
    }
    transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
  }, [messages]);

  const visibleChips = useMemo(() => commandChips.slice(0, 8), [commandChips]);
  const compactSuggestions = useMemo(() => visibleChips.slice(0, mode === 'hardcore' ? 3 : 4), [mode, visibleChips]);

  useEffect(() => {
    setShowAllSuggestions(false);
  }, [messages.length, mode]);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = input.trim();
    if (!value) {
      return;
    }

    const numericChoice = Number(value);
    if (
      Number.isInteger(numericChoice) &&
      numericChoice > 0 &&
      numericChoice <= visibleChips.length
    ) {
      onSubmitCommand(visibleChips[numericChoice - 1].command);
      setInput('');
      return;
    }

    onSubmitCommand(value);
    setInput('');
  };

  return (
    <section className="grid h-full min-h-0 grid-rows-[minmax(0,1fr)_auto] gap-2">
      <div
        ref={transcriptRef}
        className="relative min-h-0 overflow-y-auto rounded-[4px] border border-[#2b3f2d] bg-[#050706] px-3 py-3 pr-2 font-mono text-[13px] leading-6"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-15"
          style={{
            backgroundImage:
              'repeating-linear-gradient(0deg, rgba(147,245,161,0.12), rgba(147,245,161,0.12) 1px, transparent 1px, transparent 3px)'
          }}
        />
        {messages.map((message) => (
          <p key={message.id} className={cn('relative whitespace-pre-wrap', roleTone(message.role))}>
            <span className="pr-2 text-[11px] uppercase tracking-[0.08em] text-[#6ea775]">{message.role}</span>
            {message.text}
          </p>
        ))}
      </div>

      <div className="grid shrink-0 gap-2 rounded-[4px] border border-[#2b3f2d] bg-[#070f0a] px-3 py-2">
        <div className="flex items-center justify-between gap-3 border border-[#2b3f2d] bg-black/45 px-2 py-1 font-mono text-[11px] text-[#7dcf89]">
          <p className="truncate">{statusLine}</p>
          <p className="shrink-0 text-[#67a96f]">mode: {mode}</p>
        </div>

        {compactSuggestions.length ? (
          <div className="flex items-center gap-2 overflow-hidden">
            <span className="shrink-0 font-mono text-[11px] uppercase tracking-[0.1em] text-[#6ea775]">suggest</span>
            <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto pb-1">
              {compactSuggestions.map((chip, index) => (
                <Button
                  key={chip.command}
                  variant="ghost"
                  size="sm"
                  type="button"
                  onClick={() => onSubmitCommand(chip.command)}
                  className="h-7 shrink-0 border border-[#2b3f2d] bg-black/30 px-2 font-mono text-[11px] text-[#8ed596] hover:border-[#61a86a] hover:bg-[#0f1c12] hover:text-[#afffb8]"
                >
                  [{index + 1}] {chip.label}
                </Button>
              ))}
            </div>
            {visibleChips.length > compactSuggestions.length ? (
              <Button
                variant="ghost"
                size="sm"
                type="button"
                onClick={() => setShowAllSuggestions((current) => !current)}
                className="h-7 shrink-0 border border-[#2b3f2d] bg-black/30 px-2 font-mono text-[11px] text-[#8ed596] hover:border-[#61a86a] hover:bg-[#0f1c12] hover:text-[#afffb8]"
              >
                {showAllSuggestions ? 'hide' : `+${visibleChips.length - compactSuggestions.length}`}
              </Button>
            ) : null}
          </div>
        ) : null}

        {showAllSuggestions ? (
          <div className="max-h-20 overflow-y-auto pr-1">
            <div className="flex flex-wrap gap-2">
              {visibleChips.map((chip, index) => (
                <Button
                  key={`full-${chip.command}`}
                  variant="ghost"
                  size="sm"
                  type="button"
                  onClick={() => onSubmitCommand(chip.command)}
                  className="h-7 border border-[#2b3f2d] bg-black/30 px-2 font-mono text-[11px] text-[#8ed596] hover:border-[#61a86a] hover:bg-[#0f1c12] hover:text-[#afffb8]"
                >
                  [{index + 1}] {chip.label}
                </Button>
              ))}
            </div>
          </div>
        ) : null}

        <form onSubmit={submit} className="flex items-center gap-2">
          <span className="font-mono text-sm text-[#8df29a]">{'>'}</span>
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="type or use [1]-[8]"
            className="h-10 w-full rounded-[2px] border border-[#2b3f2d] bg-black/55 px-3 font-mono text-sm text-[#adffb7] outline-none transition-colors duration-ui ease-calm placeholder:text-[#5f9666] focus:border-[#7ed488]"
          />
          <Button type="submit" variant="secondary" className="border-[#2b3f2d] bg-black/35 font-mono text-[#8ed596] hover:border-[#61a86a] hover:bg-[#0f1c12]">
            EXEC
          </Button>
        </form>
      </div>
    </section>
  );
}
