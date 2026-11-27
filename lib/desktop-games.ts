export const desktopGames = ['till', 'firefly'] as const;
export type DesktopGame = typeof desktopGames[number];

export function chamberAppFilename(app: DesktopGame) {
  return `${app}.ch`;
}
