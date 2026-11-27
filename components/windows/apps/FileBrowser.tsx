import Image from 'next/image';
import { useEffect, useLayoutEffect, useRef } from 'react';

import type { DesktopGame } from '@/lib/desktop-games';
import { getDesktopFile, getParentFolder } from '@/lib/desktop-files';
import { ContactMail, FrngeProfile, ListenDirectory, ReleaseDirectory } from '@/components/windows/apps/FrngeApps';

interface FileBrowserProps {
  entryId?: string;
  onNavigate: (id: string) => void;
  onPlayTrack: (trackId: string) => void;
  deliveredFileIds: string[];
  onGame: (game: DesktopGame) => void;
  onFileRead: (id: string) => void;
}

function FileGlyph({ folder }: { folder: boolean }) {
  return (
    <Image src={`/icons/breeze/${folder ? 'folder' : 'text-x-generic'}.svg`} width={22} height={22} alt="" unoptimized className="breeze-icon h-5 w-5 shrink-0" />
  );
}

export function FileBrowser({ entryId, onNavigate, onPlayTrack, deliveredFileIds, onFileRead, onGame }: FileBrowserProps) {
  const entry = getDesktopFile(entryId, deliveredFileIds);
  const parent = getDesktopFile(getParentFolder(entry.id));
  const children = (entry.children ?? []).map((id) => getDesktopFile(id, deliveredFileIds));
  const contentRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    contentRef.current?.focus({ preventScroll: true });
  }, [entry.id]);

  useEffect(() => { if (entry.delivery) onFileRead(entry.id); }, [entry.id, entry.delivery, onFileRead]);

  return (
    <section ref={contentRef} tabIndex={-1} aria-label={`Files: ${entry.name}`} className="space-y-4 outline-none">
      <nav className="flex min-h-9 flex-wrap items-center gap-2 border-b border-border pb-3 font-machine text-xs" aria-label="File location">
        <button type="button" className="file-nav-button" disabled={entry.id === 'desktop'} onClick={() => onNavigate(parent.id)} aria-label="Up one folder">↑</button>
        <button type="button" className="file-nav-button" onClick={() => onNavigate('desktop')}>desktop</button>
        {parent.id !== 'desktop' ? <><span aria-hidden="true">/</span><button type="button" className="file-nav-button" onClick={() => onNavigate(parent.id)}>{parent.name}</button></> : null}
        {entry.id !== 'desktop' ? <><span aria-hidden="true">/</span><span aria-current="page" className="break-all text-text">{entry.name}</span></> : null}
      </nav>

      {entry.kind === 'folder' ? (
        <>
          <div className="flex items-baseline justify-between gap-3 text-xs text-muted"><h2 className="font-machine text-text">{entry.name}</h2><span>{children.length} {children.length === 1 ? 'item' : 'items'}</span></div>
          {children.length > 0 ? (
            <ul className="divide-y divide-border">
              {children.map((file) => {
                const folder = file.kind === 'folder' || file.view === 'releases';
                const content = <>{file.game ? <img src={`/icons/games/${file.game}.png`} width="22" height="22" alt="" className="object-contain [image-rendering:pixelated]" /> : <FileGlyph folder={folder} />}<span className="min-w-0 flex-1 break-words text-left">{file.name}</span><span className="shrink-0 text-xs text-muted">{file.kind === 'audio' ? 'Play' : folder ? 'Folder' : file.game ? 'Game' : file.kind === 'link' ? 'Link ↗' : 'File'}</span></>;
                return (
                  <li key={file.id}>
                    {file.href ? <a href={file.href} target="_blank" rel="noreferrer" className="file-entry">{content}<span className="sr-only"> (opens in a new tab)</span></a> : (
                      <button type="button" className="file-entry" aria-label={`${file.kind === 'audio' ? 'Play' : 'Open'} ${file.name}`} onClick={() => {
                        if (file.game) onGame(file.game);
                        else if (file.trackId) onPlayTrack(file.trackId);
                        else onNavigate(file.id);
                      }}>{content}</button>
                    )}
                  </li>
                );
              })}
            </ul>
          ) : <p className="py-12 text-center text-sm text-muted">This folder is empty.</p>}
        </>
      ) : null}

      {entry.kind === 'text' ? (
        <article className="space-y-4">
          <p className="font-machine text-xs text-muted">desk fragment</p>
          <h2 className="font-machine text-sm text-text">{entry.name}</h2>
          <p className="whitespace-pre-wrap font-sans text-base leading-relaxed text-text">{entry.text}</p>
          {entry.source ? <a href={entry.source} target="_blank" rel="noreferrer" className="inline-block border-b border-border text-xs text-muted hover:text-text">Related record in Chamber Times ↗</a> : null}
        </article>
      ) : null}

      {entry.view === 'profile' ? <FrngeProfile /> : null}
      {entry.view === 'releases' ? <ReleaseDirectory /> : null}
      {entry.view === 'contact' ? <ContactMail /> : null}
      {entry.view === 'streams' ? <ListenDirectory /> : null}
    </section>
  );
}
