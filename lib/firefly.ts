// Cross move and reversible starting positions adapted from flip.c in Simon
// Tatham's Portable Puzzle Collection (20260923.616da16). MIT notice in
// public/licenses/portable-puzzles.txt. Each bit is one insect, in row order.
export const ALL_LIT = 0b111111111;
const cross = Array.from({ length: 9 }, (_, center) => {
  let mask = 0;
  for (let cell = 0; cell < 9; cell++) {
    const distance = Math.abs(cell % 3 - center % 3)
      + Math.abs(Math.floor(cell / 3) - Math.floor(center / 3));
    if (distance <= 1) mask |= 1 << cell;
  }
  return mask;
});
export function flipFireflies(board: number, cell: number) {
  return board ^ cross[cell];
}

// Introduce corner, edge and centre moves before combining them.
const openings = [[0], [1, 8], [4, 6, 8], [0, 1, 3, 8], [0, 2, 4, 6, 8]];
export const fireflyBoards = openings.map(moves => moves.reduce(flipFireflies, ALL_LIT));
