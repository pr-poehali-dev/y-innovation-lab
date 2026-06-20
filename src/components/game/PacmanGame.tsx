import { useEffect, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { MAZE_LAYOUT, ROWS, COLS, cellToWorld, CELL_SIZE } from './maze';
import { useGameState } from './useGameState';

function MazeWalls() {
  const walls: JSX.Element[] = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (MAZE_LAYOUT[r][c] === 1) {
        const [x, , z] = cellToWorld(r, c);
        walls.push(
          <mesh key={`w${r}${c}`} position={[x, 0.5, z]} castShadow receiveShadow>
            <boxGeometry args={[CELL_SIZE, 1.2, CELL_SIZE]} />
            <meshStandardMaterial color="#1a1a6e" roughness={0.4} metalness={0.3} />
          </mesh>
        );
      }
    }
  }
  return <>{walls}</>;
}

function Floor() {
  const [cx, , cz] = cellToWorld(ROWS / 2, COLS / 2);
  return (
    <mesh position={[cx, -0.05, cz]} receiveShadow>
      <boxGeometry args={[COLS * CELL_SIZE, 0.1, ROWS * CELL_SIZE]} />
      <meshStandardMaterial color="#0a0a1a" roughness={0.8} />
    </mesh>
  );
}

function Dots({ dots, powerPellets }: { dots: Set<string>; powerPellets: Set<string> }) {
  const dotMeshes: JSX.Element[] = [];
  dots.forEach(key => {
    const [r, c] = key.split(',').map(Number);
    const [x, , z] = cellToWorld(r, c);
    dotMeshes.push(
      <mesh key={key} position={[x, 0.2, z]}>
        <sphereGeometry args={[0.12, 8, 8]} />
        <meshStandardMaterial color="#ffffaa" emissive="#ffff00" emissiveIntensity={0.8} />
      </mesh>
    );
  });
  powerPellets.forEach(key => {
    const [r, c] = key.split(',').map(Number);
    const [x, , z] = cellToWorld(r, c);
    dotMeshes.push(
      <mesh key={`p${key}`} position={[x, 0.25, z]}>
        <sphereGeometry args={[0.35, 12, 12]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffaa00" emissiveIntensity={1.5} />
      </mesh>
    );
  });
  return <>{dotMeshes}</>;
}

function Pacman({ pos, dir, frightMode }: { pos: [number, number, number]; dir: [number, number]; frightMode?: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const angle = Math.atan2(dir[1], dir[0]);

  useFrame(({ clock }) => {
    if (meshRef.current) {
      const t = clock.getElapsedTime();
      meshRef.current.rotation.y = angle;
      meshRef.current.scale.y = 1 + Math.sin(t * 12) * 0.08;
    }
  });

  return (
    <mesh ref={meshRef} position={[pos[0], 0.4, pos[2]]} castShadow>
      <sphereGeometry args={[0.45, 16, 16]} />
      <meshStandardMaterial color="#FFD700" emissive="#ff8800" emissiveIntensity={0.3} roughness={0.2} metalness={0.1} />
    </mesh>
  );
}

function GhostMesh({ ghost, frightened }: { ghost: { pos: [number, number, number]; color: string; mode: string }; frightened: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (meshRef.current) {
      meshRef.current.position.y = 0.4 + Math.sin(clock.getElapsedTime() * 3 + ghost.pos[0]) * 0.08;
    }
  });

  const isFrightened = ghost.mode === 'frightened';
  const isEaten = ghost.mode === 'eaten';
  const color = isFrightened ? '#2222ff' : isEaten ? '#ffffff' : ghost.color;

  return (
    <mesh ref={meshRef} position={[ghost.pos[0], 0.4, ghost.pos[2]]} castShadow>
      <sphereGeometry args={[0.4, 12, 12]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={isFrightened ? 0.5 : 0.2}
        roughness={0.3}
        transparent={isEaten}
        opacity={isEaten ? 0.3 : 1}
      />
    </mesh>
  );
}

function CameraFollowPacman({ pacPos }: { pacPos: [number, number, number] }) {
  const camRef = useRef<THREE.PerspectiveCamera>(null);
  useFrame(() => {
    if (camRef.current) {
      camRef.current.position.x = pacPos[0];
      camRef.current.position.y = pacPos[1] + 14;
      camRef.current.position.z = pacPos[2] + 10;
      camRef.current.lookAt(pacPos[0], 0, pacPos[2]);
    }
  });
  return <perspectiveCamera ref={camRef} fov={60} near={0.1} far={200} />;
}

function GameScene({ state, tick }: { state: ReturnType<typeof useGameState>['state']; tick: (d: number) => void }) {
  useFrame((_, delta) => {
    tick(delta);
  });

  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 20, 10]} intensity={1} castShadow shadow-mapSize={[1024, 1024]} />
      <pointLight position={[state.pacPos[0], 3, state.pacPos[2]]} intensity={2} color="#ffcc44" distance={12} decay={2} />

      <MazeWalls />
      <Floor />
      <Dots dots={state.dots} powerPellets={state.powerPellets} />
      <Pacman pos={state.pacPos} dir={state.pacDir} />
      {state.ghosts.map(g => (
        <GhostMesh key={g.id} ghost={g} frightened={state.frightened} />
      ))}
      <CameraFollowPacman pacPos={state.pacPos} />
    </>
  );
}

export default function PacmanGame() {
  const { state, handleKey, tick, startGame } = useGameState();

  useEffect(() => {
    const onDown = (e: KeyboardEvent) => handleKey(e, true);
    const onUp = (e: KeyboardEvent) => handleKey(e, false);
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
    };
  }, [handleKey]);

  return (
    <div className="relative w-full h-full bg-black" style={{ minHeight: '100vh' }}>
      <Canvas shadows gl={{ antialias: true }}>
        <GameScene state={state} tick={tick} />
      </Canvas>

      {/* HUD */}
      <div className="absolute top-4 left-4 right-4 flex justify-between items-start pointer-events-none z-10">
        <div className="bg-black/70 rounded-lg px-5 py-3 font-display text-yellow-400 border border-yellow-600/40">
          <div className="text-xs tracking-widest uppercase opacity-70">Счёт</div>
          <div className="text-3xl font-bold">{state.score}</div>
        </div>
        <div className="bg-black/70 rounded-lg px-5 py-3 font-display text-center border border-yellow-600/40">
          <div className="text-xs tracking-widest uppercase text-yellow-400/70">Жизни</div>
          <div className="flex gap-2 justify-center mt-1">
            {Array.from({ length: state.lives }).map((_, i) => (
              <div key={i} className="w-5 h-5 rounded-full bg-yellow-400" />
            ))}
          </div>
        </div>
        {state.frightened && (
          <div className="bg-blue-900/80 rounded-lg px-5 py-3 font-display text-blue-300 border border-blue-400/40 animate-pulse">
            <div className="text-xs tracking-widest uppercase opacity-70">Режим охоты</div>
            <div className="text-2xl font-bold">{Math.ceil(state.frightenTimer)}с</div>
          </div>
        )}
      </div>

      {/* Controls hint */}
      {state.phase === 'playing' && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 rounded-lg px-6 py-2 font-display text-yellow-400/60 text-xs tracking-widest pointer-events-none">
          WASD / Стрелки — движение
        </div>
      )}

      {/* Start Screen */}
      {state.phase === 'start' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/85 z-20">
          <div className="text-center">
            <div className="text-yellow-400 font-display text-7xl font-bold tracking-widest mb-2 animate-pulse">PAC-MAN</div>
            <div className="text-yellow-200/70 font-serif text-xl mb-10">3D Браузерная версия</div>
            <div className="mb-8 text-sm text-white/50 font-display space-y-1 tracking-wider">
              <div>WASD / Стрелки — движение</div>
              <div>Собери все точки · Избегай призраков</div>
              <div>Большие шары — режим охоты на призраков</div>
            </div>
            <button
              onClick={startGame}
              className="bg-yellow-400 text-black font-display font-bold text-xl px-12 py-4 rounded-lg tracking-widest uppercase hover:bg-yellow-300 transition-colors"
            >
              Начать игру
            </button>
          </div>
        </div>
      )}

      {/* Dead Screen */}
      {state.phase === 'dead' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/85 z-20">
          <div className="text-red-500 font-display text-6xl font-bold mb-4">GAME OVER</div>
          <div className="text-white/70 font-serif text-2xl mb-8">Счёт: {state.score}</div>
          <button
            onClick={startGame}
            className="bg-yellow-400 text-black font-display font-bold text-xl px-12 py-4 rounded-lg tracking-widest uppercase hover:bg-yellow-300 transition-colors"
          >
            Играть снова
          </button>
        </div>
      )}

      {/* Won Screen */}
      {state.phase === 'won' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/85 z-20">
          <div className="text-yellow-400 font-display text-6xl font-bold mb-4 animate-pulse">ПОБЕДА!</div>
          <div className="text-white/70 font-serif text-2xl mb-8">Счёт: {state.score}</div>
          <button
            onClick={startGame}
            className="bg-yellow-400 text-black font-display font-bold text-xl px-12 py-4 rounded-lg tracking-widest uppercase hover:bg-yellow-300 transition-colors"
          >
            Ещё раз
          </button>
        </div>
      )}
    </div>
  );
}
