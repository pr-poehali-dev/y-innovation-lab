import { useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';

const CELL = 2;
const MAZE = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,3,2,2,2,2,2,2,2,2,1,2,2,2,2,2,2,2,2,3,1],
  [1,2,1,1,2,1,1,1,2,1,1,1,2,1,1,1,2,1,1,2,1],
  [1,2,1,1,2,1,1,1,2,1,1,1,2,1,1,1,2,1,1,2,1],
  [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
  [1,2,1,1,2,1,2,1,1,1,1,1,1,1,2,1,2,1,1,2,1],
  [1,2,2,2,2,1,2,2,2,2,1,2,2,2,2,1,2,2,2,2,1],
  [1,1,1,1,2,1,1,1,0,0,0,0,0,1,1,1,2,1,1,1,1],
  [1,1,1,1,2,1,0,0,0,0,0,0,0,0,0,1,2,1,1,1,1],
  [1,1,1,1,2,1,0,0,0,0,0,0,0,0,0,1,2,1,1,1,1],
  [0,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,2,0,0,0,0],
  [1,1,1,1,2,1,0,0,0,0,0,0,0,0,0,1,2,1,1,1,1],
  [1,1,1,1,2,1,0,0,0,0,0,0,0,0,0,1,2,1,1,1,1],
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
const ROWS = MAZE.length;
const COLS = MAZE[0].length;
const GHOST_COLORS = [0xff2222, 0xff88cc, 0x44ffff, 0xff9922];

function cellXZ(row: number, col: number): [number, number] {
  return [(col - COLS / 2) * CELL, (row - ROWS / 2) * CELL];
}
function xzToCell(x: number, z: number): [number, number] {
  return [Math.round(z / CELL + ROWS / 2), Math.round(x / CELL + COLS / 2)];
}
function isWall(r: number, c: number) {
  if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return true;
  return MAZE[r][c] === 1;
}

type Ghost = { mesh: THREE.Mesh; row: number; col: number; dir: [number,number]; mode: string; frightTimer: number };
type GameRef = {
  scene: THREE.Scene; renderer: THREE.WebGLRenderer; camera: THREE.PerspectiveCamera;
  pacman: THREE.Mesh; ghosts: Ghost[]; dotMeshes: Map<string,THREE.Mesh>; pelletMeshes: Map<string,THREE.Mesh>;
  pacRow: number; pacCol: number; pacDir: [number,number]; nextDir: [number,number];
  score: number; lives: number; frightened: boolean; frightenTimer: number; ghostEatenCount: number;
  phase: string; pacLight: THREE.PointLight; animId: number; clock: THREE.Clock;
};

export default function GamePage() {
  const mountRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<GameRef | null>(null);

  const updateHUD = useCallback(() => {
    const g = gameRef.current; if (!g) return;
    const s = document.getElementById('hud-score'); if (s) s.textContent = String(g.score);
    const lv = document.getElementById('hud-lives');
    if (lv) lv.innerHTML = Array.from({ length: Math.max(0,g.lives) }).map(() => '<span style="display:inline-block;width:14px;height:14px;border-radius:50%;background:#FFD700;margin:0 2px"></span>').join('');
    const fr = document.getElementById('hud-frighten');
    if (fr) { fr.style.display = g.frightened&&g.frightenTimer>0?'block':'none'; fr.textContent = `🔵 ${Math.ceil(g.frightenTimer)}с`; }
  }, []);

  const showOverlay = useCallback((title: string, score: number, btn: string) => {
    const o = document.getElementById('game-overlay'); if (o) o.style.display='flex';
    const t = document.getElementById('overlay-title'); if (t) t.textContent=title;
    const sc = document.getElementById('overlay-score'); if (sc) sc.textContent = score>0?`Счёт: ${score}`:'';
    const b = document.getElementById('overlay-btn'); if (b) b.textContent=btn;
  }, []);

  const startGame = useCallback(() => {
    const g = gameRef.current; if (!g) return;
    g.dotMeshes.forEach(m => g.scene.remove(m)); g.dotMeshes.clear();
    g.pelletMeshes.forEach(m => g.scene.remove(m)); g.pelletMeshes.clear();
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const [x, z] = cellXZ(r, c);
        if (MAZE[r][c] === 2) { const m = new THREE.Mesh(new THREE.SphereGeometry(0.1,8,8), new THREE.MeshStandardMaterial({color:0xffffaa,emissive:0xffff00,emissiveIntensity:1})); m.position.set(x,0.2,z); g.scene.add(m); g.dotMeshes.set(`${r},${c}`,m); }
        if (MAZE[r][c] === 3) { const m = new THREE.Mesh(new THREE.SphereGeometry(0.32,12,12), new THREE.MeshStandardMaterial({color:0xffffff,emissive:0xff8800,emissiveIntensity:2})); m.position.set(x,0.3,z); g.scene.add(m); g.pelletMeshes.set(`${r},${c}`,m); }
      }
    }
    const [px,pz] = cellXZ(16,10); g.pacman.position.set(px,0.45,pz); g.pacRow=16; g.pacCol=10; g.pacDir=[0,0]; g.nextDir=[0,0];
    g.ghosts.forEach((gh,i) => { const [gx,gz]=cellXZ(9,9+i); gh.mesh.position.set(gx,0.45,gz); gh.row=9; gh.col=9+i; gh.dir=[[0,1],[0,-1],[1,0],[-1,0]][i] as [number,number]; gh.mode='scatter'; gh.frightTimer=0; const mat=gh.mesh.material as THREE.MeshStandardMaterial; mat.color.setHex(GHOST_COLORS[i]); mat.emissive.setHex(GHOST_COLORS[i]); mat.transparent=false; mat.opacity=1; });
    g.score=0; g.lives=3; g.frightened=false; g.frightenTimer=0; g.ghostEatenCount=0; g.phase='playing';
    const o = document.getElementById('game-overlay'); if (o) o.style.display='none';
    updateHUD();
  }, [updateHUD]);

  useEffect(() => {
    const mount = mountRef.current!;
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.setClearColor(0x000000);
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000011, 0.016);
    const camera = new THREE.PerspectiveCamera(60, mount.clientWidth/mount.clientHeight, 0.1, 200);
    camera.position.set(0,16,12); camera.lookAt(0,0,0);

    scene.add(new THREE.AmbientLight(0x223355, 1.2));
    const dir = new THREE.DirectionalLight(0xffffff,0.8); dir.position.set(10,20,10); dir.castShadow=true; scene.add(dir);
    const pacLight = new THREE.PointLight(0xffcc44,3,14,2); scene.add(pacLight);

    const floor = new THREE.Mesh(new THREE.PlaneGeometry(COLS*CELL,ROWS*CELL), new THREE.MeshStandardMaterial({color:0x070714,roughness:0.9}));
    floor.rotation.x=-Math.PI/2; floor.receiveShadow=true; scene.add(floor);

    const wallMat = new THREE.MeshStandardMaterial({color:0x1a1a6e,roughness:0.4,metalness:0.3});
    for (let r=0;r<ROWS;r++) for (let c=0;c<COLS;c++) if (MAZE[r][c]===1) { const [x,z]=cellXZ(r,c); const w=new THREE.Mesh(new THREE.BoxGeometry(CELL,1.4,CELL),wallMat); w.position.set(x,0.7,z); w.castShadow=true; scene.add(w); }

    const dotMeshes = new Map<string,THREE.Mesh>();
    const pelletMeshes = new Map<string,THREE.Mesh>();
    for (let r=0;r<ROWS;r++) for (let c=0;c<COLS;c++) {
      const [x,z]=cellXZ(r,c);
      if (MAZE[r][c]===2) { const m=new THREE.Mesh(new THREE.SphereGeometry(0.1,8,8),new THREE.MeshStandardMaterial({color:0xffffaa,emissive:0xffff00,emissiveIntensity:1})); m.position.set(x,0.2,z); scene.add(m); dotMeshes.set(`${r},${c}`,m); }
      if (MAZE[r][c]===3) { const m=new THREE.Mesh(new THREE.SphereGeometry(0.32,12,12),new THREE.MeshStandardMaterial({color:0xffffff,emissive:0xff8800,emissiveIntensity:2})); m.position.set(x,0.3,z); scene.add(m); pelletMeshes.set(`${r},${c}`,m); }
    }

    const [px0,pz0]=cellXZ(16,10);
    const pacman = new THREE.Mesh(new THREE.SphereGeometry(0.45,16,16), new THREE.MeshStandardMaterial({color:0xFFD700,emissive:0xff8800,emissiveIntensity:0.4,roughness:0.2}));
    pacman.position.set(px0,0.45,pz0); pacman.castShadow=true; scene.add(pacman);

    const ghosts: Ghost[] = GHOST_COLORS.map((color,i) => {
      const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.4,12,12), new THREE.MeshStandardMaterial({color,emissive:color,emissiveIntensity:0.2,roughness:0.3}));
      const [gx,gz]=cellXZ(9,9+i); mesh.position.set(gx,0.45,gz); mesh.castShadow=true; scene.add(mesh);
      return { mesh, row:9, col:9+i, dir:([[0,1],[0,-1],[1,0],[-1,0]][i]) as [number,number], mode:'scatter', frightTimer:0 };
    });

    const onKeyDown = (e: KeyboardEvent) => {
      const g = gameRef.current; if (!g) return;
      if (e.key==='ArrowUp'||e.key==='w'||e.key==='W') g.nextDir=[-1,0];
      if (e.key==='ArrowDown'||e.key==='s'||e.key==='S') g.nextDir=[1,0];
      if (e.key==='ArrowLeft'||e.key==='a'||e.key==='A') g.nextDir=[0,-1];
      if (e.key==='ArrowRight'||e.key==='d'||e.key==='D') g.nextDir=[0,1];
    };
    window.addEventListener('keydown', onKeyDown);

    const clock = new THREE.Clock();
    gameRef.current = { scene, renderer, camera, pacman, ghosts, dotMeshes, pelletMeshes, pacRow:16, pacCol:10, pacDir:[0,0], nextDir:[0,0], score:0, lives:3, frightened:false, frightenTimer:0, ghostEatenCount:0, phase:'start', pacLight, animId:0, clock };

    const getNeighbors = (r:number,c:number,back:[number,number]):[number,number][] =>
      ([[0,1],[0,-1],[1,0],[-1,0]] as [number,number][]).filter(([dr,dc])=>{
        if(dr===-back[0]&&dc===-back[1]) return false;
        const nr=r+dr,nc=c+dc; return nr>=0&&nr<ROWS&&nc>=0&&nc<COLS&&MAZE[nr][nc]!==1;
      });

    function animate() {
      const g = gameRef.current!;
      g.animId = requestAnimationFrame(animate);
      const delta = Math.min(clock.getDelta(), 0.05);
      const t = clock.getElapsedTime();

      pelletMeshes.forEach(m => { m.scale.setScalar(1+Math.sin(t*4)*0.15); });

      if (g.phase !== 'playing') { renderer.render(scene,camera); return; }

      const SPEED = 4*CELL, GSPEED = g.frightened ? 1.5*CELL : 3.2*CELL;

      // Pacman
      const nd = g.nextDir; let [dr,dc] = g.pacDir;
      if ((nd[0]!==0||nd[1]!==0) && !isWall(g.pacRow+nd[0],g.pacCol+nd[1])) { [dr,dc]=nd; g.pacDir=nd; }
      let nx=pacman.position.x+dc*SPEED*delta, nz=pacman.position.z+dr*SPEED*delta;
      const [nr2,nc2]=xzToCell(nx,nz);
      if(isWall(nr2,g.pacCol)) nz=pacman.position.z;
      if(isWall(g.pacRow,nc2)) nx=pacman.position.x;
      pacman.position.x=nx; pacman.position.z=nz;
      pacman.rotation.y=Math.atan2(dc,dr); pacman.scale.y=1+Math.sin(t*14)*0.07;
      const [sr,sc]=xzToCell(nx,nz); g.pacRow=sr; g.pacCol=sc;
      pacLight.position.set(nx,3,nz);

      // Collect
      const dk=`${sr},${sc}`;
      if(dotMeshes.has(dk)){scene.remove(dotMeshes.get(dk)!);dotMeshes.delete(dk);g.score+=10;updateHUD();}
      if(pelletMeshes.has(dk)){
        scene.remove(pelletMeshes.get(dk)!);pelletMeshes.delete(dk);g.score+=50;
        g.frightened=true;g.frightenTimer=10;g.ghostEatenCount=0;
        ghosts.forEach(gh=>{
          if(gh.mode!=='eaten'){
            gh.mode='frightened';
            const mat=gh.mesh.material as THREE.MeshStandardMaterial;
            mat.color.setHex(0x0044ff);
            mat.emissive.setHex(0x0022ff);
            mat.emissiveIntensity=1.5;
          }
        });
        updateHUD();
      }

      if(g.frightened){
        g.frightenTimer-=delta;
        if(g.frightenTimer<=0){g.frightened=false;g.frightenTimer=0;ghosts.forEach((gh,i)=>{if(gh.mode==='frightened'){gh.mode='chase';const mat=gh.mesh.material as THREE.MeshStandardMaterial;mat.color.setHex(GHOST_COLORS[i]);mat.emissive.setHex(GHOST_COLORS[i]);}});}
        updateHUD();
      }

      // Ghosts
      const corners:[number,number][]= [[1,1],[1,19],[20,1],[20,19]];
      ghosts.forEach((gh,i)=>{
        gh.mesh.position.y=0.45+Math.sin(t*3+i)*0.07;
        // пульсация в режиме страха
        if(gh.mode==='frightened'){
          const mat=gh.mesh.material as THREE.MeshStandardMaterial;
          const pulse=0.5+Math.abs(Math.sin(t*6))*1.5;
          mat.emissiveIntensity=pulse;
          // мигание белым когда осталось мало времени
          if(g.frightenTimer<3){
            mat.color.setHex(Math.sin(t*12)>0?0x0044ff:0xffffff);
          }
        }
        // пересчитываем направление только при смене клетки
        const [curR,curC]=xzToCell(gh.mesh.position.x,gh.mesh.position.z);
        const cellChanged = curR!==gh.row || curC!==gh.col;
        gh.row=curR; gh.col=curC;
        const back:[number,number]=[-gh.dir[0],-gh.dir[1]];
        if(cellChanged){
          if(gh.mode==='eaten'){
            const nb=getNeighbors(gh.row,gh.col,back);
            if(nb.length){let best=nb[0],bd=Infinity;for(const n of nb){const d=Math.abs(gh.row+n[0]-9)+Math.abs(gh.col+n[1]-10);if(d<bd){bd=d;best=n;}}gh.dir=best;}
            if(gh.row===9&&(gh.col>=9&&gh.col<=10)){gh.mode='chase';const mat=gh.mesh.material as THREE.MeshStandardMaterial;mat.color.setHex(GHOST_COLORS[i]);mat.emissive.setHex(GHOST_COLORS[i]);mat.emissiveIntensity=0.2;mat.transparent=false;mat.opacity=1;}
          } else if(gh.mode==='frightened'){
            // убегает от Пакмана — выбирает направление подальше
            const nb=getNeighbors(gh.row,gh.col,back);
            if(nb.length){
              let best=nb[0],bd=-1;
              for(const n of nb){const d=Math.abs(gh.row+n[0]-sr)+Math.abs(gh.col+n[1]-sc);if(d>bd){bd=d;best=n;}}
              gh.dir=best;
            }
          } else {
            const tgt=gh.mode==='scatter'?corners[i]:[sr+(i===1?gh.dir[0]*4:0),sc+(i===1?gh.dir[1]*4:0)];
            const nb=getNeighbors(gh.row,gh.col,back);
            if(nb.length){let best=nb[0],bd=Infinity;for(const n of nb){const d=Math.abs(gh.row+n[0]-tgt[0])+Math.abs(gh.col+n[1]-tgt[1]);if(d<bd){bd=d;best=n;}}gh.dir=best;}
          }
        }
        let gx=gh.mesh.position.x+gh.dir[1]*GSPEED*delta,gz=gh.mesh.position.z+gh.dir[0]*GSPEED*delta;
        const [gr,gc]=xzToCell(gx,gz);
        if(isWall(gr,gh.col)) { gz=gh.mesh.position.z; gh.dir=[gh.dir[0]===0?[-1,1][Math.floor(Math.random()*2)]:0, 0] as [number,number]; }
        if(isWall(gh.row,gc)) { gx=gh.mesh.position.x; gh.dir=[0, gh.dir[1]===0?[-1,1][Math.floor(Math.random()*2)]:0] as [number,number]; }
        gh.mesh.position.x=gx;gh.mesh.position.z=gz;
      });

      // Collision — euclidean distance for reliable ghost eating
      let died=false;
      ghosts.forEach((gh,i)=>{
        if(gh.mode==='eaten') return;
        const dx=gh.mesh.position.x-nx, dz=gh.mesh.position.z-nz;
        const dist=Math.sqrt(dx*dx+dz*dz);
        if(dist < CELL*1.0){
          if(g.frightened && gh.mode==='frightened'){
            g.score+=[200,400,800,1600][Math.min(g.ghostEatenCount,3)];
            g.ghostEatenCount++;
            gh.mode='eaten';
            const mat=gh.mesh.material as THREE.MeshStandardMaterial;
            mat.transparent=true; mat.opacity=0.25;
            updateHUD();
          } else if(gh.mode!=='frightened'&&!died){
            died=true;
          }
        }
      });

      if(died){
        g.lives--;
        if(g.lives<=0){g.phase='dead';showOverlay('GAME OVER',g.score,'Играть снова');updateHUD();return;}
        const [rpx,rpz]=cellXZ(16,10);pacman.position.set(rpx,0.45,rpz);g.pacRow=16;g.pacCol=10;g.pacDir=[0,0];g.nextDir=[0,0];
        ghosts.forEach((gh,i)=>{const[gx2,gz2]=cellXZ(9,9+i);gh.mesh.position.set(gx2,0.45,gz2);gh.row=9;gh.col=9+i;gh.dir=([[0,1],[0,-1],[1,0],[-1,0]][i]) as [number,number];gh.mode='scatter';const mat=gh.mesh.material as THREE.MeshStandardMaterial;mat.color.setHex(GHOST_COLORS[i]);mat.emissive.setHex(GHOST_COLORS[i]);mat.transparent=false;mat.opacity=1;});
        g.frightened=false;g.frightenTimer=0;updateHUD();
      }

      if(dotMeshes.size===0&&pelletMeshes.size===0){g.phase='won';showOverlay('ПОБЕДА! 🎉',g.score,'Ещё раз');updateHUD();}

      camera.position.x=nx; camera.position.y=16; camera.position.z=nz+10;
      camera.lookAt(nx,0,nz);
      renderer.render(scene,camera);
    }
    animate();

    const onResize=()=>{camera.aspect=mount.clientWidth/mount.clientHeight;camera.updateProjectionMatrix();renderer.setSize(mount.clientWidth,mount.clientHeight);};
    window.addEventListener('resize',onResize);
    return ()=>{window.removeEventListener('keydown',onKeyDown);window.removeEventListener('resize',onResize);cancelAnimationFrame(gameRef.current?.animId??0);renderer.dispose();if(mount.contains(renderer.domElement))mount.removeChild(renderer.domElement);};
  }, [updateHUD, showOverlay]);

  return (
    <div style={{width:'100vw',height:'100vh',background:'#000',overflow:'hidden',position:'relative'}}>
      <div ref={mountRef} style={{width:'100%',height:'100%'}} />

      <div style={{position:'absolute',top:16,left:16,right:16,display:'flex',justifyContent:'space-between',alignItems:'flex-start',pointerEvents:'none',zIndex:10}}>
        <div style={{background:'rgba(0,0,0,0.75)',border:'1px solid rgba(212,169,58,0.4)',borderRadius:10,padding:'10px 20px',color:'#FFD700',fontFamily:'Oswald,sans-serif'}}>
          <div style={{fontSize:11,letterSpacing:3,opacity:0.7,textTransform:'uppercase'}}>Счёт</div>
          <div id="hud-score" style={{fontSize:32,fontWeight:700}}>0</div>
        </div>
        <div id="hud-frighten" style={{display:'none',background:'rgba(20,20,120,0.85)',border:'1px solid #4488ff',borderRadius:10,padding:'10px 20px',color:'#88ccff',fontFamily:'Oswald,sans-serif',fontSize:22,fontWeight:700,letterSpacing:2}} />
        <div style={{background:'rgba(0,0,0,0.75)',border:'1px solid rgba(212,169,58,0.4)',borderRadius:10,padding:'10px 20px',textAlign:'center',fontFamily:'Oswald,sans-serif'}}>
          <div style={{fontSize:11,letterSpacing:3,opacity:0.7,color:'#FFD700',textTransform:'uppercase'}}>Жизни</div>
          <div id="hud-lives" style={{marginTop:6}} />
        </div>
      </div>

      <div style={{position:'absolute',bottom:16,left:'50%',transform:'translateX(-50%)',background:'rgba(0,0,0,0.6)',borderRadius:8,padding:'6px 18px',color:'rgba(255,200,50,0.6)',fontFamily:'Oswald,sans-serif',fontSize:13,letterSpacing:2,pointerEvents:'none',zIndex:10}}>
        WASD / Стрелки — движение
      </div>

      <div id="game-overlay" style={{position:'absolute',inset:0,background:'rgba(0,0,0,0.9)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',zIndex:20}}>
        <div id="overlay-title" style={{color:'#FFD700',fontFamily:'Oswald,sans-serif',fontSize:72,fontWeight:800,letterSpacing:8,textAlign:'center',marginBottom:8}}>PAC-MAN</div>
        <div style={{color:'rgba(255,220,100,0.6)',fontFamily:'Cormorant,serif',fontSize:20,marginBottom:12}}>3D Браузерная версия</div>
        <div id="overlay-score" style={{color:'rgba(255,255,255,0.5)',fontFamily:'Oswald,sans-serif',fontSize:22,marginBottom:36,letterSpacing:2}} />
        <div style={{color:'rgba(255,255,255,0.4)',fontFamily:'Oswald,sans-serif',fontSize:13,letterSpacing:3,marginBottom:36,textAlign:'center',lineHeight:2}}>
          WASD / Стрелки — движение<br/>
          Собери все точки · Избегай призраков<br/>
          Большие шары → режим охоты на призраков
        </div>
        <button id="overlay-btn" onClick={startGame} style={{background:'#FFD700',color:'#000',fontFamily:'Oswald,sans-serif',fontWeight:700,fontSize:22,padding:'14px 48px',borderRadius:8,border:'none',cursor:'pointer',letterSpacing:4,textTransform:'uppercase'}}>
          Начать игру
        </button>
      </div>
    </div>
  );
}