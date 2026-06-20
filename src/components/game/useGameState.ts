import { useRef, useState, useCallback } from 'react';
import { MAZE_LAYOUT, ROWS, COLS, cellToWorld, worldToCell, isWall, CELL_SIZE } from './maze';

export type GhostMode = 'chase' | 'scatter' | 'frightened' | 'eaten';

export interface Ghost {
  id: number;
  color: string;
  pos: [number, number, number];
  row: number;
  col: number;
  mode: GhostMode;
  dir: [number, number];
  frightTimer: number;
}

export interface GameState {
  pacPos: [number, number, number];
  pacRow: number;
  pacCol: number;
  pacDir: [number, number];
  dots: Set<string>;
  powerPellets: Set<string>;
  score: number;
  lives: number;
  ghosts: Ghost[];
  phase: 'playing' | 'dead' | 'won' | 'start';
  frightened: boolean;
  frightenTimer: number;
  ghostEatenCount: number;
}

const GHOST_COLORS = ['#ff0000', '#ffb8de', '#00ffff', '#ffb852'];
const SCATTER_CORNERS: [number, number][] = [[1,1],[1,19],[20,1],[20,19]];

function initDots() {
  const dots = new Set<string>();
  const pellets = new Set<string>();
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (MAZE_LAYOUT[r][c] === 2) dots.add(`${r},${c}`);
      if (MAZE_LAYOUT[r][c] === 3) pellets.add(`${r},${c}`);
    }
  }
  return { dots, pellets };
}

function initGhosts(): Ghost[] {
  return GHOST_COLORS.map((color, i) => {
    const [r, c] = [9, 9 + i - 1];
    return {
      id: i,
      color,
      pos: cellToWorld(r, c),
      row: r,
      col: c,
      mode: 'scatter' as GhostMode,
      dir: [[0,1],[0,-1],[1,0],[-1,0]][i] as [number, number],
      frightTimer: 0,
    };
  });
}

function getNeighbors(row: number, col: number): [number, number][] {
  const dirs: [number, number][] = [[0,1],[0,-1],[1,0],[-1,0]];
  return dirs.filter(([dr, dc]) => {
    const nr = row + dr;
    const nc = col + dc;
    return nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && MAZE_LAYOUT[nr][nc] !== 1;
  }).map(([dr, dc]) => [dr, dc]);
}

function dist(r1: number, c1: number, r2: number, c2: number) {
  return Math.abs(r1 - r2) + Math.abs(c1 - c2);
}

export function useGameState() {
  const { dots: initDotsSet, pellets: initPelletsSet } = initDots();

  const [state, setState] = useState<GameState>({
    pacPos: cellToWorld(16, 10),
    pacRow: 16,
    pacCol: 10,
    pacDir: [0, 0],
    dots: initDotsSet,
    powerPellets: initPelletsSet,
    score: 0,
    lives: 3,
    ghosts: initGhosts(),
    phase: 'start',
    frightened: false,
    frightenTimer: 0,
    ghostEatenCount: 0,
  });

  const stateRef = useRef(state);
  stateRef.current = state;

  const keysRef = useRef<Set<string>>(new Set());
  const nextDirRef = useRef<[number, number]>([0, 0]);

  const handleKey = useCallback((e: KeyboardEvent, down: boolean) => {
    if (down) {
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') nextDirRef.current = [-1, 0];
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') nextDirRef.current = [1, 0];
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') nextDirRef.current = [0, -1];
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') nextDirRef.current = [0, 1];
    }
    if (down) keysRef.current.add(e.key);
    else keysRef.current.delete(e.key);
  }, []);

  const startGame = useCallback(() => {
    const { dots, pellets } = initDots();
    setState({
      pacPos: cellToWorld(16, 10),
      pacRow: 16,
      pacCol: 10,
      pacDir: [0, 0],
      dots,
      powerPellets: pellets,
      score: 0,
      lives: 3,
      ghosts: initGhosts(),
      phase: 'playing',
      frightened: false,
      frightenTimer: 0,
      ghostEatenCount: 0,
    });
    nextDirRef.current = [0, 0];
  }, []);

  const tick = useCallback((delta: number) => {
    setState(prev => {
      if (prev.phase !== 'playing') return prev;

      const SPEED = 4 * CELL_SIZE;
      const { pacPos, pacRow, pacCol, pacDir, lives } = prev;
      let { dots, powerPellets, score, ghosts, frightened, frightenTimer, ghostEatenCount } = prev;

      dots = new Set(dots);
      powerPellets = new Set(powerPellets);
      ghosts = ghosts.map(g => ({ ...g }));

      // --- Pacman movement ---
      const nd = nextDirRef.current;
      let [dr, dc] = pacDir;

      // Try requested direction
      if (nd[0] !== 0 || nd[1] !== 0) {
        const nr = pacRow + nd[0];
        const nc = pacCol + nd[1];
        if (!isWall(nr, nc)) {
          [dr, dc] = nd;
        }
      }

      let newX = pacPos[0] + dc * SPEED * delta;
      let newZ = pacPos[2] + dr * SPEED * delta;

      const [newRow, newCol] = worldToCell(newX, newZ);

      if (isWall(newRow, pacCol)) { newZ = pacPos[2]; }
      if (isWall(pacRow, newCol)) { newX = pacPos[0]; }

      const [snapRow, snapCol] = worldToCell(newX, newZ);
      const snapped = cellToWorld(snapRow, snapCol);

      const dotKey = `${snapRow},${snapCol}`;
      if (dots.has(dotKey)) { dots.delete(dotKey); score += 10; }
      if (powerPellets.has(dotKey)) {
        powerPellets.delete(dotKey);
        score += 50;
        frightened = true;
        frightenTimer = 10;
        ghostEatenCount = 0;
        ghosts = ghosts.map(g => g.mode !== 'eaten' ? { ...g, mode: 'frightened' as GhostMode, frightTimer: 10 } : g);
      }

      // --- Frighten timer ---
      if (frightened) {
        frightenTimer -= delta;
        if (frightenTimer <= 0) {
          frightened = false;
          frightenTimer = 0;
          ghosts = ghosts.map(g => g.mode === 'frightened' ? { ...g, mode: 'chase' as GhostMode } : g);
        }
      }

      // --- Ghost movement ---
      const GHOST_SPEED = frightened ? 1.5 * CELL_SIZE : 3.5 * CELL_SIZE;
      ghosts = ghosts.map((ghost) => {
        const g = { ...ghost };
        if (g.mode === 'eaten') {
          // return to ghost house
          const targetR = 9, targetC = 10;
          const neighbors = getNeighbors(g.row, g.col);
          if (neighbors.length > 0) {
            let best = neighbors[0];
            let bestD = Infinity;
            for (const n of neighbors) {
              const d = dist(g.row + n[0], g.col + n[1], targetR, targetC);
              if (d < bestD) { bestD = d; best = n; }
            }
            g.dir = best;
          }
          if (g.row === targetR && g.col === targetC) {
            g.mode = 'chase';
            g.dir = [0, 1];
          }
        } else if (g.mode === 'frightened') {
          // random movement
          const neighbors = getNeighbors(g.row, g.col).filter(n => n[0] !== -g.dir[0] || n[1] !== -g.dir[1]);
          if (neighbors.length > 0) {
            g.dir = neighbors[Math.floor(Math.random() * neighbors.length)];
          }
        } else if (g.mode === 'chase') {
          const neighbors = getNeighbors(g.row, g.col).filter(n => n[0] !== -g.dir[0] || n[1] !== -g.dir[1]);
          if (neighbors.length > 0) {
            let best = neighbors[0];
            let bestD = Infinity;
            const targetR = snapRow + (g.id === 1 ? (g.dir[0] * 4) : 0);
            const targetC = snapCol + (g.id === 1 ? (g.dir[1] * 4) : 0);
            for (const n of neighbors) {
              const d = dist(g.row + n[0], g.col + n[1], g.id === 0 ? snapRow : targetR, g.id === 0 ? snapCol : targetC);
              if (d < bestD) { bestD = d; best = n; }
            }
            g.dir = best;
          }
        } else if (g.mode === 'scatter') {
          const corner = SCATTER_CORNERS[g.id];
          const neighbors = getNeighbors(g.row, g.col).filter(n => n[0] !== -g.dir[0] || n[1] !== -g.dir[1]);
          if (neighbors.length > 0) {
            let best = neighbors[0];
            let bestD = Infinity;
            for (const n of neighbors) {
              const d = dist(g.row + n[0], g.col + n[1], corner[0], corner[1]);
              if (d < bestD) { bestD = d; best = n; }
            }
            g.dir = best;
          }
        }

        const gx = g.pos[0] + g.dir[1] * GHOST_SPEED * delta;
        const gz = g.pos[2] + g.dir[0] * GHOST_SPEED * delta;
        const [gr, gc] = worldToCell(gx, gz);

        if (!isWall(gr, g.col)) g.pos = [gx, g.pos[1], g.pos[2]];
        if (!isWall(g.row, gc)) g.pos = [g.pos[0], g.pos[1], gz];

        const [nr, nc] = worldToCell(g.pos[0], g.pos[2]);
        g.row = nr;
        g.col = nc;

        return g;
      });

      // --- Collision with ghosts ---
      let died = false;
      ghosts = ghosts.map(g => {
        if (g.mode === 'eaten') return g;
        const dx = Math.abs(g.pos[0] - newX);
        const dz = Math.abs(g.pos[2] - newZ);
        if (dx < CELL_SIZE * 0.8 && dz < CELL_SIZE * 0.8) {
          if (g.mode === 'frightened') {
            const pts = [200, 400, 800, 1600][Math.min(ghostEatenCount, 3)];
            score += pts;
            ghostEatenCount++;
            return { ...g, mode: 'eaten' as GhostMode };
          } else {
            died = true;
          }
        }
        return g;
      });

      if (died) {
        const newLives = lives - 1;
        if (newLives <= 0) return { ...prev, lives: 0, phase: 'dead' as const };
        return {
          ...prev,
          lives: newLives,
          pacPos: cellToWorld(16, 10),
          pacRow: 16,
          pacCol: 10,
          pacDir: [0, 0] as [number, number],
          ghosts: initGhosts(),
          frightened: false,
          frightenTimer: 0,
        };
      }

      const won = dots.size === 0 && powerPellets.size === 0;

      return {
        ...prev,
        pacPos: [newX, 0, newZ],
        pacRow: snapRow,
        pacCol: snapCol,
        pacDir: [dr, dc] as [number, number],
        dots,
        powerPellets,
        score,
        lives,
        ghosts,
        frightened,
        frightenTimer,
        ghostEatenCount,
        phase: won ? 'won' as const : 'playing' as const,
      };
    });
  }, []);

  return { state, handleKey, tick, startGame, keysRef };
}