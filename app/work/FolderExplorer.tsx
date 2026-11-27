import Link from 'next/link';
import { FolderIcon } from '@/components/desktop/FolderIcon';
import { folderTrail, portfolio, type WorkFolder } from './directory';
import { RecordingLink } from './Recordings';
import styles from './work.module.css';

type Navigate = (href: string) => void;

export function FolderToolbar({ folder, back, forward, navigate }: {
  folder: WorkFolder; back?: string; forward?: string; navigate: (href: string, direction: 'back' | 'forward') => void;
}) {
  return <div className={styles.folderToolbar}>
    <div className={styles.history} role="group" aria-label="Folder history">
      {(['back', 'forward'] as const).map(direction => {
        const href = direction === 'back' ? back : forward;
        const name = href && folderTrail(href.split('/').slice(2))?.at(-1)?.name;
        const action = direction === 'back' ? 'Back' : 'Forward';
        const label = name ? action + ' to ' + name : action;
        return <button type="button" key={direction} data-direction={direction} disabled={!href}
          aria-label={label} title={label} onClick={() => href && navigate(href, direction)} />;
      })}
    </div>
    <h1 id={folder.slug + '-heading'} tabIndex={-1}>{folder.name}</h1>
  </div>;
}

function FolderTree({ folder, parent, current, navigate }: { folder: WorkFolder; parent: string; current: string; navigate: Navigate }) {
  if (!folder.folders?.length) return null;
  return <ul>
    {folder.folders.map(child => {
      const url = parent + '/' + child.slug;
      const active = url === current;
      const expanded = current.startsWith(url + '/');
      return <li key={url}>
        <Link href={url} scroll={false} onNavigate={() => navigate(url)} aria-current={active ? 'page' : undefined} data-branch={active || expanded}>
          <FolderIcon kind={child.slug} />{child.name}
        </Link>
        {expanded && <FolderTree folder={child} parent={url} current={current} navigate={navigate} />}
      </li>;
    })}
  </ul>;
}

function FolderList({ folders, href, navigate }: { folders: WorkFolder[]; href: string; navigate: Navigate }) {
  const illustrated = folders.some(child => child.artwork);
  return <ul className={illustrated ? styles.icons : styles.list} aria-label="Folders in this location">
    {folders.map(child => {
      const url = href + '/' + child.slug;
      return <li key={url}><Link href={url} scroll={false} onNavigate={() => navigate(url)}>
        <FolderIcon kind={child.slug}>{child.artwork && <img className={styles.folderPrint} src={child.artwork.src}
          data-logo={child.artwork.src.endsWith('.svg')} width={child.artwork.width} height={child.artwork.height} alt="" />}</FolderIcon>
        <span><span className={styles.folderName}>{child.name}</span>{child.detail && <small>{child.detail}</small>}</span>
        {child.date && <span className={illustrated ? styles.year : styles.date}>{child.date}</span>}
      </Link></li>;
    })}
  </ul>;
}

export function FolderExplorer({ folder, href, navigate }: { folder: WorkFolder; href: string; navigate: Navigate }) {
  const heading = folder.slug + '-heading';
  const folders = folder.folders ?? [];
  const files = folder.files ?? [];
  const dates = [...folders, ...files].flatMap(item => item.date ? [item.date] : []);
  const dateColumn = dates.every(date => /^\d{4}$/.test(date)) ? 'Year' : 'Date';
  const press = folder.slug === 'press';
  const showColumns = folder.slug !== 'releases-radio' && !folders.some(child => child.artwork);
  const groups = folder.slug === 'releases-radio'
    ? [{ title: 'Recorded music', folders: folders.filter(child => !child.radio) }, { title: 'Radio', folders: folders.filter(child => child.radio) }]
    : [{ title: '', folders }];
  const counts = [
    folders.length && folders.length + (folders.length === 1 ? ' folder' : ' folders'),
    files.length && files.length + (press ? ' articles' : files.length === 1 ? ' file' : ' files')
  ].filter(Boolean).join(' · ');

  return <div className={styles.explorer}>
    <aside className={styles.sidebar}><nav aria-label="Browse folders"><FolderTree folder={portfolio} parent="/work" current={href} navigate={navigate} /></nav></aside>
    <section key={href} className={styles.pane} aria-labelledby={heading}>
      {folder.note && <div className={styles.info}>
        {folder.artwork && <img className={styles.art} data-logo={folder.artwork.src.endsWith('.svg')}
          src={folder.artwork.src} alt="" width={folder.artwork.width} height={folder.artwork.height} />}
        <p>{folder.note}</p>
      </div>}
      {showColumns && <div className={styles.columnNames} data-press={press || undefined} aria-hidden="true">
        <span>{press ? 'Publication' : 'Name'}</span>{dates.length > 0 && <span>{dateColumn}</span>}
      </div>}
      {groups.map(group => group.folders.length > 0 && <div key={group.title} className={styles.folderGroup}>
        {group.title && <h2>{group.title}</h2>}
        <FolderList folders={group.folders} href={href} navigate={navigate} />
      </div>)}
      {files.length > 0 && <ul className={styles.list} data-press={press || undefined} aria-label={press ? 'Press coverage' : 'Files in this location'}>
        {files.map(file => {
          const contents = <>
            {press && file.mark ? <span className={styles.publisher}><img src={file.mark} alt="" width="36" height="36" /></span>
              : file.media ? <img className={styles.trackIcon} src="/icons/breeze/media-playback-start.svg" width="20" height="20" alt="" />
              : <i className={styles.pageIcon} aria-hidden="true" />}
            <span>{file.name}{file.detail && <small>{file.detail}</small>}</span>
            {file.date && <span className={styles.date}>{file.date}</span>}
          </>;
          return <li key={file.href}>{file.media ? <RecordingLink file={file} media={file.media}>{contents}</RecordingLink>
            : <a href={file.href} target="_blank" rel="noreferrer">{contents}</a>}</li>;
        })}
      </ul>}
    </section>
    <footer className={styles.status}><span>{counts}</span><Link href="/contact">Commission enquiries</Link></footer>
  </div>;
}
