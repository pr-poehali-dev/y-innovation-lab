export const CELL_SIZE = 2;

// 0 = path, 1 = wall, 2 = dot, 3 = power pellet, 4 = ghost house
export const MAZE_LAYOUT = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,3,2,2,2,2,2,2,2,2,1,2,2,2,2,2,2,2,2,3,1],
  [1,2,1,1,2,1,1,1,2,1,1,1,2,1,1,1,2,1,1,2,1],
  [1,2,1,1,2,1,1,1,2,1,1,1,2,1,1,1,2,1,1,2,1],
  [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
  [1,2,1,1,2,1,2,1,1,1,1,1,1,1,2,1,2,1,1,2,1],
  [1,2,2,2,2,1,2,2,2,2,1,2,2,2,2,1,2,2,2,2,1],
  [1,1,1,1,2,1,1,1,0,0,0,0,0,1,1,1,2,1,1,1,1],
  [0,0,0,1,2,1,0,0,4,4,4,4,4,0,0,1,2,1,0,0,0],
  [1,1,1,1,2,1,0,0,4,4,4,4,4,0,0,1,2,1,1,1,1],
  [0,0,0,0,2,0,0,0,4,4,4,4,4,0,0,0,2,0,0,0,0],
  [1,1,1,1,2,1,0,0,0,0,0,0,0,0,0,1,2,1,1,1,1],
  [0,0,0,1,2,1,0,1,1,1,1,1,1,1,0,1,2,1,0,0,0],
  [1,1,1,1,2,1,0,0,0,0,0,0,0,0,0,1,2,1,1,1,1],
  [1,2,2,2,2,2,2,2,2,2,1,2,2,2,2,2,2,2,2,2,1],
  [1,2,1,1,2,1,1,1,2,1,1,1,2,1,1,1,2,1,1,2,1],
  [1,3,2,1,2,2,2,2,2,2,0,2,2,2,2,2,2,1,2,3,1],
  [1,1,2,1,2,1,2,1,1,1,1,1,1,1,2,1,2,1,2,1,1],
  [1,2,2,2,2,1,2,2,2,2,1,2,2,2,2,1,2,2,2,2,1],
  [1,2,1,1,1,1,1,1,2,1,1,1,2,1,1,1,1,1,1,2,1],
  [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
];

export const ROWS = MAZE_LAYOUT.length;
export const COLS = MAZE_LAYOUT[0].length;

export function cellToWorld(row: number, col: number): [number, number, number] {
  const x = (col - COLS / 2) * CELL_SIZE;
  const z = (row - ROWS / 2) * CELL_SIZE;
  return [x, 0, z];
}

export function worldToCell(x: number, z: number): [number, number] {
  const col = Math.round(x / CELL_SIZE + COLS / 2);
  const row = Math.round(z / CELL_SIZE + ROWS / 2);
  return [row, col];
}

export function isWall(row: number, col: number): boolean {
  if (row < 0 || row >= ROWS || col < 0 || col >= COLS) return true;
  return MAZE_LAYOUT[row][col] === 1;
}

export function canMove(row: number, col: number): boolean {
  if (row < 0 || row >= ROWS || col < 0 || col >= COLS) return false;
  return MAZE_LAYOUT[row][col] !== 1;
}
