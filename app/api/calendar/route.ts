import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { addAnnouncement, archivedEntries } from '@/lib/calendar-catalogue';

export const dynamic = 'force-static';

export async function GET() {
  const entries = archivedEntries();
  const directory = path.join(process.cwd(), 'content/releases');
  const files = (await readdir(directory)).filter(name => name.endsWith('.json')).sort();
  for (const name of files) {
    try {
      await addAnnouncement(entries, JSON.parse(await readFile(path.join(directory, name), 'utf8')));
    } catch (error) {
      throw new Error('Check calendar release ' + name, { cause: error });
    }
  }
  return Response.json([...entries.values()].sort((a, b) => a.date.localeCompare(b.date) || a.title.localeCompare(b.title)));
}
