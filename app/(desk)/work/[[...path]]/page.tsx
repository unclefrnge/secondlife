import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { workFolders } from '@/lib/work-folders';
import { folderPaths, folderTrail } from '@/app/work/directory';

type Props = { params: Promise<{ path?: string[] }> };

export function generateStaticParams() {
  return folderPaths().map(path => ({ path }));
}

export const dynamicParams = false;

async function directory({ params }: Props) {
  const { path = [] } = await params;
  if (!path.length) redirect('/work/' + workFolders.selected.slug);
  const trail = folderTrail(path);
  if (!trail) notFound();
  return { folder: trail[trail.length - 1], href: ['/work', ...path].join('/') };
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { folder, href } = await directory(props);
  const title = folder.name + ' · FRNGE';
  const description = folder.note ?? folder.detail ?? 'Projects, releases, radio and press from Francois Maritz.';
  const image = { url: '/work/dissipate.webp', width: 1280, height: 720, alt: 'Dissipate, with music by FRNGE' };
  return {
    title, description, alternates: { canonical: href },
    openGraph: { title, description, url: href, type: 'website', images: [image] },
    twitter: { card: 'summary_large_image', title, description, images: [image.url] }
  };
}

export default async function FolderPage(props: Props) {
  await directory(props);
  return null;
}
