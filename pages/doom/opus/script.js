// ═══════════════════════════════════════════════════════════════
// DOOM-TEXT — A playable DOOM-style raycaster rendered as ASCII
// through Pretext's canvas text engine. Every "pixel" is a
// character. The entire viewport is typography.
// ═══════════════════════════════════════════════════════════════

// ─── Configuration ──────────────────────────────────────────

const CFG = {
  COLS: 100,
  ROWS: 35,
  FOV: Math.PI / 3,
  MAX_DEPTH: 20,
  MOVE_SPEED: 3.0,
  STRAFE_SPEED: 2.5,
  ROT_SPEED: 2.0,
  MOUSE_SENS: 0.002,
  FONT: 'JetBrains Mono',
  FONT_FALLBACK: 'Courier New',
};

// ─── Maps ────────────────────────────────────────────────────
// 1=stone, 2=brick, 3=tech, 4=door
// E=imp, D=demon, F=spectre, H=health, A=ammo, P=player

const MAPS = [
  // Level 1
  [
    '1111111111111111111111111111111',
    '1..............1.............1',
    '1..............1.............1',
    '1......1.......1......E......1',
    '1......1.......4.............1',
    '1......1.......1.............1',
    '1..............1......H......1',
    '11111.11111111111111111.111111',
    '1..............1.............1',
    '1.......E......1.............1',
    '1..............1.......E.....1',
    '1..............4.............1',
    '1...H..........1.............1',
    '1..............1.............1',
    '1111111.1111111111111.1111111',
    '1............1..............A1',
    '1............1...............1',
    '1....P.......1........E......1',
    '1............1...............1',
    '1............1...............1',
    '1............1...............1',
    '111111111111111111111111111111',
  ],
  // Level 2 — tighter, more enemies, mixed wall types
  [
    '11111111111111111111111111',
    '1...........1...........1',
    '1.....E.....1.....D.....1',
    '1...........4...........1',
    '1...........1...........1',
    '1..H..2222211112222..A..1',
    '1.....2...........2.....1',
    '1.....2....E.F....2.....1',
    '1.....2...........2.....1',
    '111.112...........211.111',
    '1.....2...........2.....1',
    '1..F..2....D......2..F..1',
    '1.....2...........2.....1',
    '1.....2222233322222.....1',
    '1...........3...........1',
    '1...........3...........1',
    '1.....E.....3.....E.....1',
    '1...........3...........1',
    '1....P......4......H....1',
    '1...........3...........1',
    '1...........3.....D.....1',
    '1...........3...........1',
    '111111111111111111111111',
  ],
];

// ─── Game State ──────────────────────────────────────────────

const state = {
  px: 0, py: 0, angle: 0,
  health: 100, ammo: 25, score: 0, kills: 0, level: 0,
  totalEnemies: 0,
  shooting: false, shootTimer: 0, shootCooldown: 0,
  bobPhase: 0, bobAmount: 0,
  damageFlash: 0, screenShake: 0, recoil: 0,
  dead: false,
  map: [], mapW: 0, mapH: 0,
  enemies: [], pickups: [], deathParticles: [],
  charBuf: [], colorBuf: [],
  keys: {}, mouseDX: 0, pointerLocked: false,
  lastTime: 0, dt: 0, fps: 0, frameCount: 0, fpsTimer: 0,
  screen: 'title', titleBlink: 0, victoryTimer: 0,
  canvas: null, ctx: null, dpr: 1, W: 0, H: 0, charW: 0, charH: 0,
  // Pretext
  pt: null, ptReady: false, ptPrep: {},
  // Title particles
  titleParticles: [],
};

// ═══════════════════════════════════════════════════════════════
// Sound Effects (Web Audio API)
// ═══════════════════════════════════════════════════════════════

let audioCtx = null;

function initAudio() {
  if (audioCtx) return;
  try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch {}
}

function playNoise(duration, freq, type, vol) {
  if (!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type || 'sawtooth';
  osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(freq * 0.1, audioCtx.currentTime + duration);
  gain.gain.setValueAtTime(vol || 0.15, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
  osc.connect(gain).connect(audioCtx.destination);
  osc.start(); osc.stop(audioCtx.currentTime + duration);
}

function sfxShoot() {
  if (!audioCtx) return;
  const bufSize = audioCtx.sampleRate * 0.08;
  const buf = audioCtx.createBuffer(1, bufSize, audioCtx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufSize);
  const src = audioCtx.createBufferSource();
  const gain = audioCtx.createGain();
  src.buffer = buf;
  gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.08);
  src.connect(gain).connect(audioCtx.destination);
  src.start();
}

function sfxHit() { playNoise(0.15, 440, 'sawtooth', 0.1); }
function sfxEnemyDeath() { playNoise(0.3, 220, 'square', 0.12); }
function sfxPickup() { playNoise(0.1, 880, 'sine', 0.08); setTimeout(() => playNoise(0.1, 1320, 'sine', 0.08), 100); }
function sfxDamage() { playNoise(0.1, 60, 'square', 0.2); }

// ═══════════════════════════════════════════════════════════════
// Map Parsing
// ═══════════════════════════════════════════════════════════════

function parseMap(levelIdx) {
  const rows = MAPS[levelIdx || 0];
  state.mapH = rows.length;
  state.mapW = Math.max(...rows.map(r => r.length));
  state.map = [];
  state.enemies = [];
  state.pickups = [];
  state.deathParticles = [];

  for (let y = 0; y < state.mapH; y++) {
    state.map[y] = [];
    for (let x = 0; x < state.mapW; x++) {
      const ch = rows[y][x] || ' ';
      state.map[y][x] = 0;
      switch (ch) {
        case '1': case '2': case '3': case '4':
          state.map[y][x] = parseInt(ch); break;
        case 'P':
          state.px = x + 0.5; state.py = y + 0.5;
          state.angle = -Math.PI / 2; break;
        case 'E':
          state.enemies.push(makeEnemy(x, y, 'imp')); break;
        case 'D':
          state.enemies.push(makeEnemy(x, y, 'demon')); break;
        case 'F':
          state.enemies.push(makeEnemy(x, y, 'spectre')); break;
        case 'H':
          state.pickups.push({ x: x + 0.5, y: y + 0.5, type: 'health', active: true, char: '+' }); break;
        case 'A':
          state.pickups.push({ x: x + 0.5, y: y + 0.5, type: 'ammo', active: true, char: '¤' }); break;
      }
    }
  }
  state.totalEnemies = state.enemies.length;
}

function makeEnemy(x, y, type) {
  const base = { x: x + 0.5, y: y + 0.5, alive: true, attackTimer: 0, moveTimer: 0,
                 hitFlash: 0, visible: false, dist: 0, screenX: 0 };
  switch (type) {
    case 'imp':     return { ...base, type, health: 3, speed: 1.2, char: 'Ψ', damage: [5, 10], color: 0 };
    case 'demon':   return { ...base, type, health: 6, speed: 0.8, char: 'Ω', damage: [10, 20], color: 280 };
    case 'spectre': return { ...base, type, health: 2, speed: 2.5, char: 'Φ', damage: [3, 8], color: 180 };
    default:        return { ...base, type: 'imp', health: 3, speed: 1.2, char: 'Ψ', damage: [5, 10], color: 0 };
  }
}

function isWall(x, y) {
  const mx = Math.floor(x), my = Math.floor(y);
  if (mx < 0 || my < 0 || mx >= state.mapW || my >= state.mapH) return true;
  const t = state.map[my][mx];
  return t > 0 && t !== 4; // type 4 = door (walkable)
}

// ═══════════════════════════════════════════════════════════════
// Raycaster (DDA)
// ═══════════════════════════════════════════════════════════════

function castRay(angle) {
  const dirX = Math.cos(angle), dirY = Math.sin(angle);
  let mapX = Math.floor(state.px), mapY = Math.floor(state.py);
  const ddx = Math.abs(1 / dirX), ddy = Math.abs(1 / dirY);
  const stepX = dirX < 0 ? -1 : 1, stepY = dirY < 0 ? -1 : 1;
  let sdx = dirX < 0 ? (state.px - mapX) * ddx : (mapX + 1 - state.px) * ddx;
  let sdy = dirY < 0 ? (state.py - mapY) * ddy : (mapY + 1 - state.py) * ddy;
  let side = 0;

  for (let i = 0; i < 64; i++) {
    if (sdx < sdy) { sdx += ddx; mapX += stepX; side = 0; }
    else { sdy += ddy; mapY += stepY; side = 1; }
    if (mapX < 0 || mapY < 0 || mapX >= state.mapW || mapY >= state.mapH) break;
    if (state.map[mapY][mapX] > 0) {
      const wt = state.map[mapY][mapX];
      const dist = side === 0
        ? (mapX - state.px + (1 - stepX) / 2) / dirX
        : (mapY - state.py + (1 - stepY) / 2) / dirY;
      // Calculate wallX (fractional hit position for texturing)
      let wallX = side === 0
        ? state.py + Math.abs(dist) * dirY
        : state.px + Math.abs(dist) * dirX;
      wallX -= Math.floor(wallX);
      return { dist: Math.abs(dist), wallType: wt, side, wallX };
    }
  }
  return { dist: CFG.MAX_DEPTH, wallType: 0, side: 0, wallX: 0 };
}

// ═══════════════════════════════════════════════════════════════
// Scene Rendering
// ═══════════════════════════════════════════════════════════════

function renderScene() {
  const cols = CFG.COLS, rows = CFG.ROWS, half = rows / 2;
  const buf = state.charBuf, col = state.colorBuf;
  const shake = Math.round(state.screenShake * (Math.random() > 0.5 ? 1 : -1));

  for (let i = 0; i < cols * rows; i++) { buf[i] = ' '; col[i] = '#111'; }

  const depthBuf = new Float32Array(cols);
  const bob = Math.sin(state.bobPhase) * state.bobAmount;

  for (let c = 0; c < cols; c++) {
    const rayAngle = (state.angle - CFG.FOV / 2) + (c / cols) * CFG.FOV;
    const hit = castRay(rayAngle);
    const corrDist = hit.dist * Math.cos(rayAngle - state.angle);
    depthBuf[c] = corrDist;

    const wallH = Math.min(rows, Math.round(rows / corrDist));
    const wallTop = Math.round(half - wallH / 2 + bob + shake);
    const wallBot = wallTop + wallH;
    const wallColor = getWallColor(hit.wallType, hit.side, corrDist);

    for (let r = 0; r < rows; r++) {
      const idx = r * cols + c;
      if (r >= wallTop && r < wallBot) {
        buf[idx] = getWallChar(hit.wallType, hit.wallX, (r - wallTop) / wallH, corrDist);
        col[idx] = wallColor;
      } else if (r < wallTop) {
        const d = (half - r) / half;
        buf[idx] = d > 0.7 ? '·' : d > 0.4 ? '.' : ' ';
        col[idx] = `hsl(220, 10%, ${Math.round(3 + d * 6)}%)`;
      } else {
        const d = (r - half) / half;
        const checker = ((Math.floor(c * corrDist * 0.1) + Math.floor(r * 0.5)) & 1);
        buf[idx] = d > 0.7 ? (checker ? '·' : '∙') : d > 0.4 ? (checker ? ':' : '.') : '.';
        col[idx] = `hsl(25, ${checker ? 20 : 10}%, ${Math.round(10 + d * 20)}%)`;
      }
    }
  }

  renderSprites(depthBuf);
  renderDeathParticles();
  if (state.shootTimer > 0) renderMuzzleFlash();
  renderWeapon();
  renderHUD();
  if (state.damageFlash > 0) applyDamageOverlay();
}

// ─── Wall Characters (pseudo-texture) ───────────────────────

function getWallChar(wType, wallX, wallY, dist) {
  const distIdx = Math.min(8, Math.floor((dist / CFG.MAX_DEPTH) * 9));
  const far = '█▓▓▒▒░░·. ';

  switch (wType) {
    case 1: { // Stone — brick-like grid
      const bx = (wallX * 4) % 1, by = (wallY * 8) % 1;
      if (bx < 0.08 || by < 0.06) return distIdx < 4 ? '▒' : '░';
      return far[distIdx];
    }
    case 2: { // Brick — grid with accent
      const bx = (wallX * 3) % 1, by = (wallY * 6) % 1;
      if (bx < 0.1 && by < 0.1) return '╬';
      if (bx < 0.1) return '║';
      if (by < 0.08) return '═';
      return far[distIdx];
    }
    case 3: { // Tech — panels with accents
      const bx = (wallX * 5) % 1, by = (wallY * 5) % 1;
      if (bx > 0.45 && bx < 0.55 && by > 0.45 && by < 0.55) return '◊';
      if (bx < 0.05 || bx > 0.95 || by < 0.05 || by > 0.95) return '░';
      return far[distIdx];
    }
    case 4: { // Door — vertical stripes
      const stripe = (wallX * 8) % 1;
      return stripe < 0.5 ? '▐' : '▌';
    }
    default: return far[distIdx];
  }
}

function getWallColor(wType, side, dist) {
  const b = Math.max(20, Math.round((100 - dist * 5) * (side === 1 ? 0.7 : 1.0)));
  switch (wType) {
    case 1: return `hsl(0, 0%, ${b}%)`;
    case 2: return `hsl(15, 50%, ${Math.round(b * 0.6)}%)`;
    case 3: return `hsl(200, 60%, ${Math.round(b * 0.5)}%)`;
    case 4: return `hsl(40, 80%, ${Math.round(b * 0.7)}%)`;
    default: return `hsl(0, 0%, ${b}%)`;
  }
}

// ─── Sprites ────────────────────────────────────────────────

function renderSprites(depthBuf) {
  const cols = CFG.COLS, rows = CFG.ROWS, half = rows / 2;
  const sprites = [];
  const now = performance.now();

  for (const e of state.enemies) {
    if (!e.alive) continue;
    const dx = e.x - state.px, dy = e.y - state.py;
    const dist = Math.sqrt(dx * dx + dy * dy);
    let a = Math.atan2(dy, dx) - state.angle;
    while (a < -Math.PI) a += 2 * Math.PI;
    while (a > Math.PI) a -= 2 * Math.PI;
    if (Math.abs(a) < CFG.FOV / 2 + 0.1) {
      const sx = Math.round((0.5 + a / CFG.FOV) * cols);
      e.dist = dist; e.screenX = sx; e.visible = true;
      // Spectres flicker
      let ch = e.hitFlash > 0 ? '╬' : e.char;
      if (e.type === 'spectre' && Math.sin(now / 80) > 0.3) ch = '░';
      sprites.push({ type: 'enemy', obj: e, dist, screenX: sx, char: ch });
    } else { e.visible = false; }
  }

  for (const p of state.pickups) {
    if (!p.active) continue;
    const dx = p.x - state.px, dy = p.y - state.py;
    const dist = Math.sqrt(dx * dx + dy * dy);
    let a = Math.atan2(dy, dx) - state.angle;
    while (a < -Math.PI) a += 2 * Math.PI;
    while (a > Math.PI) a -= 2 * Math.PI;
    if (Math.abs(a) < CFG.FOV / 2 + 0.1) {
      sprites.push({ type: 'pickup', obj: p, dist, screenX: Math.round((0.5 + a / CFG.FOV) * cols), char: p.char });
    }
  }

  sprites.sort((a, b) => b.dist - a.dist);

  for (const sp of sprites) {
    if (sp.dist < 0.3) continue;
    const size = Math.min(rows, Math.round(rows / sp.dist));
    const spriteH = Math.max(1, Math.round(size * 0.6));
    const spriteW = Math.max(1, Math.round(size * 0.3));
    const topR = Math.round(half - spriteH / 2 + Math.sin(state.bobPhase) * state.bobAmount);
    const leftC = sp.screenX - Math.floor(spriteW / 2);

    let color;
    if (sp.type === 'enemy') {
      const e = sp.obj;
      color = e.hitFlash > 0 ? 'hsl(0, 100%, 80%)'
        : `hsl(${e.color}, 70%, ${Math.max(30, Math.round(70 - sp.dist * 3))}%)`;
    } else {
      color = sp.obj.type === 'health' ? 'hsl(120, 80%, 60%)' : 'hsl(50, 90%, 65%)';
    }

    for (let r = topR; r < topR + spriteH; r++) {
      for (let c = leftC; c < leftC + spriteW; c++) {
        if (r < 0 || r >= rows || c < 0 || c >= cols) continue;
        if (depthBuf[c] < sp.dist) continue;
        const idx = r * cols + c;
        state.charBuf[idx] = sp.char;
        state.colorBuf[idx] = color;
      }
    }
  }
}

// ─── Death Particles ────────────────────────────────────────

function renderDeathParticles() {
  const cols = CFG.COLS, rows = CFG.ROWS;
  for (const dp of state.deathParticles) {
    if (dp.life <= 0) continue;
    const r = Math.round(dp.r), c = Math.round(dp.c);
    if (r >= 0 && r < rows && c >= 0 && c < cols) {
      const idx = r * cols + c;
      state.charBuf[idx] = dp.char;
      state.colorBuf[idx] = `hsl(${dp.hue}, 80%, ${Math.round(dp.life * 70)}%)`;
    }
  }
}

// ─── Muzzle Flash / Weapon / HUD / Damage ───────────────────

function renderMuzzleFlash() {
  const cols = CFG.COLS, rows = CFG.ROWS;
  const cx = Math.floor(cols / 2), cy = Math.floor(rows * 0.55);
  const flashChars = '*+×•';
  const radius = Math.round(3 * state.shootTimer / 0.1);
  for (let dr = -radius; dr <= radius; dr++) {
    for (let dc = -radius; dc <= radius; dc++) {
      const r = cy + dr, c = cx + dc;
      if (r < 0 || r >= rows || c < 0 || c >= cols) continue;
      if (Math.abs(dr) + Math.abs(dc) > radius) continue;
      const idx = r * cols + c;
      state.charBuf[idx] = flashChars[Math.floor(Math.random() * flashChars.length)];
      state.colorBuf[idx] = `hsl(${30 + Math.random() * 30}, 100%, ${60 + Math.random() * 30}%)`;
    }
  }
}

function renderWeapon() {
  const cols = CFG.COLS, rows = CFG.ROWS;
  const bob = Math.sin(state.bobPhase * 2) * state.bobAmount * 0.5;
  const recoilOffset = Math.round(state.recoil * -3); // kick up on shoot

  const weapon = [
    '  ║║  ',
    '  ║║  ',
    ' ╔╩╩╗ ',
    ' ║██║ ',
    ' ╚══╝ ',
  ];

  const startR = rows - weapon.length - 1 + Math.round(bob) + recoilOffset;
  const startC = Math.floor(cols / 2) - 3;
  for (let r = 0; r < weapon.length; r++) {
    for (let c = 0; c < weapon[r].length; c++) {
      const gr = startR + r, gc = startC + c;
      if (gr < 0 || gr >= rows || gc < 0 || gc >= cols) continue;
      if (weapon[r][c] === ' ') continue;
      state.charBuf[gr * cols + gc] = weapon[r][c];
      state.colorBuf[gr * cols + gc] = 'hsl(35, 20%, 55%)';
    }
  }
}

function renderHUD() {
  const cols = CFG.COLS, rows = CFG.ROWS, last = rows - 1;
  const healthStr = `♥ ${state.health}`;
  const ammoStr = `◆ ${state.ammo}`;
  const lvlStr = `LVL ${state.level + 1}`;
  const scoreStr = `SCORE: ${state.score}`;
  const killStr = `KILLS: ${state.kills}/${state.totalEnemies}`;
  const fpsStr = `${state.fps}fps`;

  for (let c = 0; c < cols; c++) { state.charBuf[last * cols + c] = '─'; state.colorBuf[last * cols + c] = '#333'; }

  writeText(last, 1, healthStr, state.health > 30 ? 'hsl(120, 80%, 55%)' : 'hsl(0, 90%, 55%)');
  writeText(last, healthStr.length + 3, ammoStr, 'hsl(50, 80%, 60%)');
  writeText(last, healthStr.length + ammoStr.length + 6, lvlStr, 'hsl(200, 60%, 55%)');
  writeText(last, Math.floor(cols / 2) - Math.floor(scoreStr.length / 2), scoreStr, '#aaa');
  writeText(last, cols - killStr.length - fpsStr.length - 4, killStr, '#888');
  writeText(last, cols - fpsStr.length - 1, fpsStr, '#555');

  // Crosshair
  const cx = Math.floor(cols / 2), cy = Math.floor(rows / 2);
  if (cy > 0 && cy < rows - 1) {
    state.charBuf[cy * cols + cx] = '+';
    state.colorBuf[cy * cols + cx] = 'hsl(0, 0%, 90%)';
  }
}

function writeText(row, startCol, text, color) {
  const cols = CFG.COLS;
  for (let i = 0; i < text.length; i++) {
    const c = startCol + i;
    if (c >= 0 && c < cols) { state.charBuf[row * cols + c] = text[i]; state.colorBuf[row * cols + c] = color; }
  }
}

function applyDamageOverlay() {
  const cols = CFG.COLS, rows = CFG.ROWS, a = state.damageFlash;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const d = Math.min(c, cols - 1 - c, r, rows - 1 - r);
      if (d < 4 && Math.random() < (1 - d / 4) * a * 0.5) {
        const idx = r * cols + c;
        state.charBuf[idx] = '░';
        state.colorBuf[idx] = `hsl(0, 90%, ${30 + (1 - d / 4) * a * 40}%)`;
      }
    }
  }
}

// ═══════════════════════════════════════════════════════════════
// Game Logic
// ═══════════════════════════════════════════════════════════════

function update(dt) {
  if (state.screen !== 'game') return;
  if (state.dead) return;

  const s = state;
  s.angle += s.mouseDX * CFG.MOUSE_SENS; s.mouseDX = 0;
  if (s.keys['ArrowLeft'] || s.keys['q']) s.angle -= CFG.ROT_SPEED * dt;
  if (s.keys['ArrowRight'] || s.keys['e']) s.angle += CFG.ROT_SPEED * dt;

  let mx = 0, my = 0;
  const cos = Math.cos(s.angle), sin = Math.sin(s.angle);
  if (s.keys['w'] || s.keys['ArrowUp']) { mx += cos * CFG.MOVE_SPEED * dt; my += sin * CFG.MOVE_SPEED * dt; }
  if (s.keys['s'] || s.keys['ArrowDown']) { mx -= cos * CFG.MOVE_SPEED * dt; my -= sin * CFG.MOVE_SPEED * dt; }
  if (s.keys['a']) { mx += sin * CFG.STRAFE_SPEED * dt; my -= cos * CFG.STRAFE_SPEED * dt; }
  if (s.keys['d']) { mx -= sin * CFG.STRAFE_SPEED * dt; my += cos * CFG.STRAFE_SPEED * dt; }

  const margin = 0.2;
  if (!isWall(s.px + mx + Math.sign(mx) * margin, s.py)) s.px += mx;
  if (!isWall(s.px, s.py + my + Math.sign(my) * margin)) s.py += my;

  const moving = Math.abs(mx) + Math.abs(my) > 0.001;
  if (moving) { s.bobPhase += dt * 8; s.bobAmount = Math.min(1.5, s.bobAmount + dt * 6); }
  else { s.bobAmount = Math.max(0, s.bobAmount - dt * 4); }

  s.shootCooldown = Math.max(0, s.shootCooldown - dt);
  s.shootTimer = Math.max(0, s.shootTimer - dt);
  s.damageFlash = Math.max(0, s.damageFlash - dt * 3);
  s.screenShake = Math.max(0, s.screenShake - dt * 8);
  s.recoil = Math.max(0, s.recoil - dt * 8);

  if (s.shooting && s.shootCooldown <= 0 && s.ammo > 0) {
    shoot(); s.shootCooldown = 0.4; s.shootTimer = 0.1; s.ammo--; s.recoil = 1.0;
    sfxShoot();
  }

  updateEnemies(dt);
  updatePickups();
  updateDeathParticles(dt);

  // Win condition
  const alive = s.enemies.filter(e => e.alive).length;
  if (alive === 0 && s.enemies.length > 0) {
    s.screen = 'victory'; s.victoryTimer = 0;
  }
}

function shoot() {
  const hit = castRay(state.angle);
  for (const e of state.enemies) {
    if (!e.alive) continue;
    const dx = e.x - state.px, dy = e.y - state.py;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > hit.dist) continue;
    let a = Math.atan2(dy, dx) - state.angle;
    while (a < -Math.PI) a += 2 * Math.PI;
    while (a > Math.PI) a -= 2 * Math.PI;
    if (Math.abs(a) < CFG.FOV / 2 && Math.abs(a) < 0.15) {
      e.health--; e.hitFlash = 0.15; sfxHit();
      if (e.health <= 0) {
        e.alive = false; state.score += 100; state.kills++;
        sfxEnemyDeath();
        spawnDeathParticles(e);
      }
      break;
    }
  }
}

function spawnDeathParticles(enemy) {
  // Project enemy position to screen coords
  const dx = enemy.x - state.px, dy = enemy.y - state.py;
  const dist = Math.sqrt(dx * dx + dy * dy);
  let a = Math.atan2(dy, dx) - state.angle;
  while (a < -Math.PI) a += 2 * Math.PI;
  while (a > Math.PI) a -= 2 * Math.PI;
  const sc = (0.5 + a / CFG.FOV) * CFG.COLS;
  const sr = CFG.ROWS / 2;
  const chars = 'Ψ*+×•░▒';
  for (let i = 0; i < 12; i++) {
    state.deathParticles.push({
      r: sr + (Math.random() - 0.5) * 4,
      c: sc + (Math.random() - 0.5) * 6,
      vr: (Math.random() - 0.5) * 15,
      vc: (Math.random() - 0.5) * 20,
      char: chars[Math.floor(Math.random() * chars.length)],
      hue: enemy.color,
      life: 0.5 + Math.random() * 0.5,
    });
  }
}

function updateDeathParticles(dt) {
  for (let i = state.deathParticles.length - 1; i >= 0; i--) {
    const dp = state.deathParticles[i];
    dp.r += dp.vr * dt; dp.c += dp.vc * dt;
    dp.vr += 15 * dt; // gravity
    dp.life -= dt * 2;
    if (dp.life <= 0) state.deathParticles.splice(i, 1);
  }
}

function updateEnemies(dt) {
  for (const e of state.enemies) {
    if (!e.alive) continue;
    e.hitFlash = Math.max(0, e.hitFlash - dt);
    e.attackTimer += dt;
    const dx = state.px - e.x, dy = state.py - e.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 12 && dist > 1.5) {
      const speed = e.speed * dt;
      const nx = e.x + (dx / dist) * speed, ny = e.y + (dy / dist) * speed;
      if (!isWall(nx, e.y)) e.x = nx;
      if (!isWall(e.x, ny)) e.y = ny;
    }

    const atkCooldown = e.type === 'demon' ? 2.0 : e.type === 'spectre' ? 1.0 : 1.5;
    if (dist < 2.5 && e.attackTimer > atkCooldown) {
      e.attackTimer = 0;
      const dmg = e.damage[0] + Math.floor(Math.random() * (e.damage[1] - e.damage[0]));
      state.health -= dmg;
      state.damageFlash = 1.0;
      state.screenShake = 1.0;
      sfxDamage();
      if (state.health <= 0) { state.health = 0; state.dead = true; state.screen = 'dead'; }
    }
  }
}

function updatePickups() {
  for (const p of state.pickups) {
    if (!p.active) continue;
    const dx = state.px - p.x, dy = state.py - p.y;
    if (Math.sqrt(dx * dx + dy * dy) < 0.6) {
      p.active = false;
      if (p.type === 'health') state.health = Math.min(100, state.health + 25);
      else state.ammo += 12;
      state.score += 25;
      sfxPickup();
    }
  }
}

// ═══════════════════════════════════════════════════════════════
// Pretext Integration
// ═══════════════════════════════════════════════════════════════

async function loadPretext() {
  try {
    state.pt = await import('https://esm.sh/pretext@0.3.0');
    state.ptReady = true;
  } catch (e) { console.warn('Pretext unavailable:', e); }
}

function ptPrepare(text, font) {
  if (!state.ptReady) return null;
  const fn = state.pt.prepareWithSegments || state.pt.prepare;
  if (!fn) return null;
  try { return fn(text, font); } catch { return null; }
}

function ptLayoutLine(prepared, offset, maxW, lh) {
  if (!state.ptReady || !prepared || !state.pt.layoutNextLine) return null;
  try {
    const r = state.pt.layoutNextLine(prepared, offset, maxW, lh);
    if (!r) return null;
    const l = r.line || r;
    const text = typeof l === 'string' ? l : (l.text || l.content || '');
    const next = r.nextOffset != null ? r.nextOffset : offset + text.length;
    return next > offset ? { text: text.replace(/\n$/, ''), next } : null;
  } catch { return null; }
}

// ─── Title Particles ────────────────────────────────────────

function initTitleParticles() {
  state.titleParticles = [];
  const chars = 'DOOM█▓▒░ΨΩΦ×+◊•';
  for (let i = 0; i < 60; i++) {
    state.titleParticles.push({
      x: Math.random() * CFG.COLS,
      y: Math.random() * CFG.ROWS,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.2,
      char: chars[i % chars.length],
      hue: Math.random() * 360,
      hueSpeed: 0.1 + Math.random() * 0.3,
      alpha: 0.15 + Math.random() * 0.25,
    });
  }
}

function updateTitleParticles() {
  for (const p of state.titleParticles) {
    p.x += p.vx; p.y += p.vy;
    if (p.x < -1) p.x = CFG.COLS + 1;
    if (p.x > CFG.COLS + 1) p.x = -1;
    if (p.y < -1) p.y = CFG.ROWS + 1;
    if (p.y > CFG.ROWS + 1) p.y = -1;
    p.hue = (p.hue + p.hueSpeed) % 360;
  }
}

function drawTitleParticles() {
  for (const p of state.titleParticles) {
    const r = Math.round(p.y), c = Math.round(p.x);
    if (r >= 0 && r < CFG.ROWS && c >= 0 && c < CFG.COLS) {
      const idx = r * CFG.COLS + c;
      state.charBuf[idx] = p.char;
      state.colorBuf[idx] = `hsl(${p.hue}, 60%, ${Math.round(20 + p.alpha * 40)}%)`;
    }
  }
}

// ═══════════════════════════════════════════════════════════════
// Title Screen (with Pretext wave displacement)
// ═══════════════════════════════════════════════════════════════

function renderTitleScreen() {
  const cols = CFG.COLS, rows = CFG.ROWS;
  for (let i = 0; i < cols * rows; i++) { state.charBuf[i] = ' '; state.colorBuf[i] = '#111'; }

  updateTitleParticles();
  drawTitleParticles();

  const now = performance.now();
  const t = now / 2000;

  // DOOM title — each character displaced by sine wave
  const title = [
    '██████   ██████   ██████  ███    ███',
    '██   ██ ██    ██ ██    ██ ████  ████',
    '██   ██ ██    ██ ██    ██ ██ ████ ██',
    '██   ██ ██    ██ ██    ██ ██  ██  ██',
    '██████   ██████   ██████  ██      ██',
  ];

  const titleStartR = Math.floor(rows * 0.15);
  const baseTitleC = Math.floor(cols / 2) - Math.floor(title[0].length / 2);

  for (let r = 0; r < title.length; r++) {
    // Wave displacement per line — Pretext-style flowing text
    const wave = Math.sin(t + r * 0.8) * 3;
    const offsetC = Math.round(wave);

    for (let c = 0; c < title[r].length; c++) {
      if (title[r][c] === ' ') continue;
      const gr = titleStartR + r;
      const gc = baseTitleC + c + offsetC;
      if (gr >= 0 && gr < rows && gc >= 0 && gc < cols) {
        const idx = gr * cols + gc;
        state.charBuf[idx] = title[r][c];
        // Flowing hue gradient
        const hue = (now / 25 + c * 4 + r * 20) % 360;
        const light = 45 + Math.sin(now / 500 + c * 0.2) * 15;
        state.colorBuf[idx] = `hsl(${hue > 40 && hue < 320 ? 0 : hue}, 85%, ${Math.round(light)}%)`;
      }
    }
  }

  // Subtitle with wave
  const sub = '── TEXT EDITION ──';
  const subR = titleStartR + 7;
  const subBaseC = Math.floor(cols / 2) - Math.floor(sub.length / 2);
  for (let i = 0; i < sub.length; i++) {
    const waveOff = Math.round(Math.sin(t * 1.3 + i * 0.3) * 1.5);
    const gc = subBaseC + i + waveOff;
    if (gc >= 0 && gc < cols) {
      state.charBuf[subR * cols + gc] = sub[i];
      state.colorBuf[subR * cols + gc] = `hsl(0, 0%, ${40 + Math.sin(now / 400 + i * 0.4) * 15}%)`;
    }
  }

  // Pretext-rendered tagline (if available)
  const tagline = 'DOOM runs on everything. Even text. Powered by Pretext.';
  const tagR = titleStartR + 10;
  if (state.ptReady) {
    // Use Pretext to lay out text with variable width per line (circular/wave)
    const fontSize = Math.max(6, Math.floor(state.W / cols));
    const font = `400 ${fontSize}px "${CFG.FONT}", monospace`;
    const prep = ptPrepare(tagline, font);
    if (prep) {
      let offset = 0, line = 0;
      while (offset < tagline.length && line < 3) {
        // Variable width per line — sinusoidal
        const maxW = (cols * 0.5 + Math.sin(t + line * 1.2) * cols * 0.15) * state.charW;
        const result = ptLayoutLine(prep, offset, maxW, fontSize * 1.3);
        if (!result) break;
        const text = result.text;
        const lineC = Math.floor(cols / 2) - Math.floor(text.length / 2);
        const waveOff = Math.round(Math.sin(t * 0.8 + line * 1.5) * 2);
        for (let i = 0; i < text.length; i++) {
          const gc = lineC + i + waveOff;
          if (gc >= 0 && gc < cols) {
            state.charBuf[(tagR + line) * cols + gc] = text[i];
            const h = (180 + now / 50 + i * 3) % 360;
            state.colorBuf[(tagR + line) * cols + gc] = `hsl(${h}, 50%, 55%)`;
          }
        }
        offset = result.next; line++;
      }
    }
  } else {
    // Fallback: simple centered text
    writeText(tagR, Math.floor(cols / 2) - Math.floor(tagline.length / 2), tagline, '#444');
  }

  // Blinking prompt
  state.titleBlink += state.dt;
  if (Math.sin(state.titleBlink * 3) > 0) {
    const prompt = '[ CLICK TO START ]';
    writeText(titleStartR + 15, Math.floor(cols / 2) - Math.floor(prompt.length / 2), prompt, '#ccc');
  }

  // Controls
  const controls = [
    'WASD — Move    Mouse — Look    Click — Shoot',
    'Q/E  — Rotate  Arrow Keys — Also work',
  ];
  for (let i = 0; i < controls.length; i++) {
    writeText(titleStartR + 18 + i, Math.floor(cols / 2) - Math.floor(controls[i].length / 2), controls[i], '#444');
  }

  // Glow effect on canvas (drawn directly, not through char buffer)
  state._titleGlow = true;
}

// ═══════════════════════════════════════════════════════════════
// Death Screen
// ═══════════════════════════════════════════════════════════════

function renderDeathScreen() {
  const cols = CFG.COLS, rows = CFG.ROWS;
  const now = performance.now();

  // Corrupt the last game frame
  for (let i = 0; i < cols * rows; i++) {
    if (Math.random() < 0.3) {
      state.charBuf[i] = '░▒▓█'[Math.floor(Math.random() * 4)];
      state.colorBuf[i] = `hsl(0, ${40 + Math.random() * 40}%, ${8 + Math.random() * 15}%)`;
    }
  }

  const cy = Math.floor(rows / 2);

  // "YOU DIED" with scatter displacement
  const deathMsg = 'YOU DIED';
  for (let i = 0; i < deathMsg.length; i++) {
    const scatter = Math.sin(now / 200 + i * 1.5) * 1.5;
    const r = cy - 1 + Math.round(Math.sin(now / 300 + i) * 0.5);
    const c = Math.floor(cols / 2) - Math.floor(deathMsg.length / 2) + i + Math.round(scatter);
    if (r >= 0 && r < rows && c >= 0 && c < cols) {
      state.charBuf[r * cols + c] = deathMsg[i];
      state.colorBuf[r * cols + c] = `hsl(0, 90%, ${40 + Math.sin(now / 100 + i) * 15}%)`;
    }
  }

  const scoreMsg = `SCORE: ${state.score}  KILLS: ${state.kills}`;
  writeText(cy + 1, Math.floor(cols / 2) - Math.floor(scoreMsg.length / 2), scoreMsg, '#aaa');

  state.titleBlink += state.dt;
  if (Math.sin(state.titleBlink * 3) > 0) {
    const msg = '[ CLICK TO RESTART ]';
    writeText(cy + 3, Math.floor(cols / 2) - Math.floor(msg.length / 2), msg, '#888');
  }
}

// ═══════════════════════════════════════════════════════════════
// Victory Screen (with Pretext circular text)
// ═══════════════════════════════════════════════════════════════

function renderVictoryScreen() {
  const cols = CFG.COLS, rows = CFG.ROWS;
  const now = performance.now();

  for (let i = 0; i < cols * rows; i++) { state.charBuf[i] = ' '; state.colorBuf[i] = '#111'; }

  // Background particles
  updateTitleParticles();
  drawTitleParticles();

  state.victoryTimer += state.dt;

  // "LEVEL COMPLETE" with pulsing glow
  const title = 'LEVEL COMPLETE';
  const titleR = Math.floor(rows * 0.2);
  for (let i = 0; i < title.length; i++) {
    const c = Math.floor(cols / 2) - Math.floor(title.length / 2) + i;
    if (c >= 0 && c < cols) {
      state.charBuf[titleR * cols + c] = title[i];
      const h = (120 + now / 30 + i * 10) % 360;
      state.colorBuf[titleR * cols + c] = `hsl(${h}, 70%, ${50 + Math.sin(now / 300 + i * 0.5) * 15}%)`;
    }
  }

  // Stats in circular layout (Pretext-style)
  const stats = `SCORE: ${state.score} · KILLS: ${state.kills}/${state.totalEnemies} · HEALTH: ${state.health} · AMMO: ${state.ammo}`;
  const centerR = Math.floor(rows * 0.55);
  const centerC = Math.floor(cols / 2);
  const radius = Math.min(12, Math.floor(rows * 0.25));
  const pulse = Math.sin(now / 2000) * 1.5;
  const r = radius + pulse;

  // Lay out stats text in a circle
  let charIdx = 0;
  const totalChars = stats.length;
  for (let lineR = centerR - Math.ceil(r); lineR <= centerR + Math.ceil(r); lineR++) {
    if (lineR < 0 || lineR >= rows || charIdx >= totalChars) continue;
    const dy = lineR - centerR;
    if (Math.abs(dy) > r) continue;
    const halfChord = Math.sqrt(r * r - dy * dy);
    const lineW = Math.round(halfChord * 2);
    if (lineW < 2) continue;
    const startC = centerC - Math.floor(lineW / 2);

    // Fill this line with characters from stats
    for (let dc = 0; dc < lineW && charIdx < totalChars; dc++, charIdx++) {
      const gc = startC + dc;
      if (gc >= 0 && gc < cols) {
        state.charBuf[lineR * cols + gc] = stats[charIdx];
        const h = (180 + now / 40 + charIdx * 5) % 360;
        state.colorBuf[lineR * cols + gc] = `hsl(${h}, 60%, 65%)`;
      }
    }
  }

  // "Next level" / "You win" prompt
  if (state.victoryTimer > 2) {
    const hasNext = state.level + 1 < MAPS.length;
    const msg = hasNext ? '[ CLICK FOR NEXT LEVEL ]' : '[ YOU WIN — CLICK TO REPLAY ]';
    if (Math.sin(state.titleBlink * 3) > 0) {
      writeText(rows - 4, Math.floor(cols / 2) - Math.floor(msg.length / 2), msg, '#ccc');
    }
    state.titleBlink += state.dt;
  }
}

// ═══════════════════════════════════════════════════════════════
// Minimap
// ═══════════════════════════════════════════════════════════════

function renderMinimap() {
  if (state.screen !== 'game') return;
  const cols = CFG.COLS, rows = CFG.ROWS;
  const mmW = Math.min(state.mapW, 20), mmH = Math.min(state.mapH, 14);
  const startC = cols - mmW - 2, startR = 1;
  const camX = Math.floor(state.px) - Math.floor(mmW / 2);
  const camY = Math.floor(state.py) - Math.floor(mmH / 2);

  for (let r = 0; r < mmH; r++) {
    for (let c = 0; c < mmW; c++) {
      const mx = camX + c, my = camY + r;
      const gr = startR + r, gc = startC + c;
      if (gr >= rows || gc >= cols) continue;
      const idx = gr * cols + gc;
      if (mx < 0 || my < 0 || mx >= state.mapW || my >= state.mapH) {
        state.charBuf[idx] = ' '; state.colorBuf[idx] = '#111'; continue;
      }
      const tile = state.map[my][mx];
      if (tile > 0) { state.charBuf[idx] = '█'; state.colorBuf[idx] = '#334'; }
      else { state.charBuf[idx] = '·'; state.colorBuf[idx] = '#1a1a1a'; }
    }
  }

  // Player direction arrow — fixed for screen-coord Y-down
  const pC = startC + Math.floor(state.px) - camX;
  const pR = startR + Math.floor(state.py) - camY;
  if (pR >= 0 && pR < rows && pC >= 0 && pC < cols) {
    const arrows = '→↘↓↙←↖↑↗→';
    const aIdx = Math.round(((state.angle % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI)) / (Math.PI / 4));
    state.charBuf[pR * cols + pC] = arrows[aIdx] || '○';
    state.colorBuf[pR * cols + pC] = '#0f0';
  }

  // Enemy dots
  for (const e of state.enemies) {
    if (!e.alive) continue;
    const ec = startC + Math.floor(e.x) - camX, er = startR + Math.floor(e.y) - camY;
    if (er >= startR && er < startR + mmH && ec >= startC && ec < startC + mmW) {
      state.charBuf[er * cols + ec] = '•';
      state.colorBuf[er * cols + ec] = e.type === 'demon' ? '#c4f' : e.type === 'spectre' ? '#4cf' : '#f44';
    }
  }

  // Border
  for (let c = startC - 1; c <= startC + mmW; c++) {
    if (c >= 0 && c < cols) {
      if (startR - 1 >= 0) { state.charBuf[(startR - 1) * cols + c] = '─'; state.colorBuf[(startR - 1) * cols + c] = '#333'; }
      if (startR + mmH < rows) { state.charBuf[(startR + mmH) * cols + c] = '─'; state.colorBuf[(startR + mmH) * cols + c] = '#333'; }
    }
  }
  for (let r = startR; r < startR + mmH; r++) {
    if (startC - 1 >= 0) { state.charBuf[r * cols + startC - 1] = '│'; state.colorBuf[r * cols + startC - 1] = '#333'; }
    if (startC + mmW < cols) { state.charBuf[r * cols + startC + mmW] = '│'; state.colorBuf[r * cols + startC + mmW] = '#333'; }
  }
}

// ═══════════════════════════════════════════════════════════════
// Canvas Rendering
// ═══════════════════════════════════════════════════════════════

function measureFont() {
  const ctx = state.ctx;
  const s = getFontSize();
  ctx.font = `${s}px "${CFG.FONT}", "${CFG.FONT_FALLBACK}", monospace`;
  state.charW = ctx.measureText('M').width;
  state.charH = s * 1.15;
}

function getFontSize() {
  return Math.max(6, Math.min(Math.floor(state.W / CFG.COLS), Math.floor(state.H / CFG.ROWS)));
}

function renderToCanvas() {
  const ctx = state.ctx, dpr = state.dpr;
  const fontSize = getFontSize();
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = '#050505';
  ctx.fillRect(0, 0, state.W, state.H);

  // Title glow effect
  if (state._titleGlow || state.screen === 'victory') {
    const now = performance.now();
    const gx = state.W * 0.5 + Math.sin(now / 3000) * state.W * 0.1;
    const gy = state.H * 0.3 + Math.cos(now / 2500) * state.H * 0.05;
    const hue = (now / 30) % 360;
    const g = ctx.createRadialGradient(gx, gy, 0, gx, gy, state.W * 0.4);
    g.addColorStop(0, `hsla(${hue}, 80%, 50%, 0.06)`);
    g.addColorStop(0.5, `hsla(${hue}, 80%, 50%, 0.02)`);
    g.addColorStop(1, 'hsla(0, 0%, 0%, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, state.W, state.H);
    state._titleGlow = false;
  }

  ctx.font = `${fontSize}px "${CFG.FONT}", "${CFG.FONT_FALLBACK}", monospace`;
  ctx.textBaseline = 'top';
  ctx.textAlign = 'left';

  const cw = state.charW, ch = state.charH;
  const cols = CFG.COLS, rows = CFG.ROWS;
  const ox = Math.max(0, (state.W - cols * cw) / 2);
  const oy = Math.max(0, (state.H - rows * ch) / 2);

  const groups = {};
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const idx = r * cols + c;
      const ch2 = state.charBuf[idx];
      if (ch2 === ' ') continue;
      const color = state.colorBuf[idx];
      if (!groups[color]) groups[color] = [];
      groups[color].push({ ch: ch2, x: ox + c * cw, y: oy + r * ch });
    }
  }
  for (const color in groups) {
    ctx.fillStyle = color;
    for (const item of groups[color]) ctx.fillText(item.ch, item.x, item.y);
  }
}

// ═══════════════════════════════════════════════════════════════
// Main Loop
// ═══════════════════════════════════════════════════════════════

function gameLoop(timestamp) {
  requestAnimationFrame(gameLoop);
  if (!state.lastTime) state.lastTime = timestamp;
  state.dt = Math.min(0.05, (timestamp - state.lastTime) / 1000);
  state.lastTime = timestamp;

  state.frameCount++;
  state.fpsTimer += state.dt;
  if (state.fpsTimer >= 1) { state.fps = state.frameCount; state.frameCount = 0; state.fpsTimer = 0; }

  update(state.dt);

  switch (state.screen) {
    case 'title': renderTitleScreen(); break;
    case 'game': renderScene(); renderMinimap(); break;
    case 'dead': renderDeathScreen(); break;
    case 'victory': renderVictoryScreen(); break;
  }

  renderToCanvas();
}

// ═══════════════════════════════════════════════════════════════
// Input
// ═══════════════════════════════════════════════════════════════

function setupInput() {
  document.addEventListener('keydown', (e) => {
    state.keys[e.key.toLowerCase()] = true;
    if (e.key.startsWith('Arrow')) state.keys[e.key] = true;
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) e.preventDefault();
  });
  document.addEventListener('keyup', (e) => {
    state.keys[e.key.toLowerCase()] = false;
    if (e.key.startsWith('Arrow')) state.keys[e.key] = false;
  });

  state.canvas.addEventListener('click', () => {
    initAudio();
    if (state.screen === 'title') { startGame(); return; }
    if (state.screen === 'dead') { resetGame(state.level); return; }
    if (state.screen === 'victory') { advanceLevel(); return; }
    if (!state.pointerLocked) { try { state.canvas.requestPointerLock(); } catch {} }
  });

  document.addEventListener('pointerlockchange', () => {
    state.pointerLocked = document.pointerLockElement === state.canvas;
  });
  document.addEventListener('mousemove', (e) => {
    if (state.pointerLocked) state.mouseDX += e.movementX;
  });
  state.canvas.addEventListener('mousedown', (e) => {
    if (state.screen === 'game' && e.button === 0) state.shooting = true;
  });
  document.addEventListener('mouseup', (e) => { if (e.button === 0) state.shooting = false; });
  window.addEventListener('resize', () => { sizeCanvas(); measureFont(); });
}

// ═══════════════════════════════════════════════════════════════
// Game Flow
// ═══════════════════════════════════════════════════════════════

function startGame() {
  state.screen = 'game';
  state.level = 0;
  resetGame(0);
  try { state.canvas.requestPointerLock(); } catch {}
}

function resetGame(level) {
  parseMap(level);
  state.health = 100; state.ammo = 25; state.score = 0; state.kills = 0;
  state.dead = false; state.shooting = false;
  state.shootTimer = 0; state.shootCooldown = 0;
  state.bobPhase = 0; state.bobAmount = 0;
  state.damageFlash = 0; state.screenShake = 0; state.recoil = 0;
  state.screen = 'game'; state.titleBlink = 0;
}

function advanceLevel() {
  if (state.level + 1 < MAPS.length) {
    const prevScore = state.score;
    state.level++;
    parseMap(state.level);
    state.health = Math.min(100, state.health + 25); // Bonus health
    state.ammo += 10;
    state.score = prevScore; state.kills = 0; // Reset kills for new level
    state.dead = false; state.shooting = false;
    state.shootTimer = 0; state.shootCooldown = 0;
    state.bobPhase = 0; state.bobAmount = 0;
    state.damageFlash = 0; state.screenShake = 0; state.recoil = 0;
    state.screen = 'game'; state.titleBlink = 0;
    try { state.canvas.requestPointerLock(); } catch {}
  } else {
    // All levels complete — restart
    state.level = 0;
    resetGame(0);
  }
}

// ═══════════════════════════════════════════════════════════════
// Init
// ═══════════════════════════════════════════════════════════════

function sizeCanvas() {
  state.W = window.innerWidth; state.H = window.innerHeight;
  state.canvas.width = state.W * state.dpr; state.canvas.height = state.H * state.dpr;
}

async function init() {
  state.canvas = document.getElementById('canvas');
  state.ctx = state.canvas.getContext('2d');
  state.dpr = window.devicePixelRatio || 1;
  sizeCanvas();

  const total = CFG.COLS * CFG.ROWS;
  state.charBuf = new Array(total).fill(' ');
  state.colorBuf = new Array(total).fill('#111');

  await document.fonts.ready;
  measureFont();
  parseMap(0);
  initTitleParticles();
  setupInput();

  // Load Pretext in background (non-blocking)
  loadPretext();

  requestAnimationFrame(gameLoop);
}

init();
