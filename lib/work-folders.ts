export const playerName = 'CH4MB3R Player';

export const workFolders = {
  selected: { name: 'Selected work', slug: 'selected-work' },
  releases: { name: 'Releases & radio', slug: 'releases-radio' },
  press: { name: 'Press', slug: 'press' }
} as const;

export const desktopWorkFolders = Object.values(workFolders);
