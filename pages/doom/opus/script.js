// ═══════════════════════════════════════════════════════════════
// DOOM-TEXT — A playable DOOM-style raycaster rendered as ASCII
// through Pretext's canvas text engine. Every "pixel" is a
// character. The entire viewport is typography.
// ═══════════════════════════════════════════════════════════════

// ─── Configuration ──────────────────────────────────────────

const CFG = {
  // Grid resolution (characters)
  COLS: 100,
  ROWS: 35,

  FOV: Math.PI / 3,       // 60° field of view
  MAX_DEPTH: 20,           // Max ray distance
  RAY_STEP: 0.02,          // DDA step size

  MOVE_SPEED: 3.0,
  STRAFE_SPEED: 2.5,
  ROT_SPEED: 2.0,          // Keyboard rotation speed
  MOUSE_SENS: 0.002,

  // ASCII character palettes (near → far)
  WALL_CHARS:    '█▓▒░▒░·. ',
  FLOOR_CHARS:   '·∙:;,. ',
  CEILING_CHARS: ' .·',

  FONT: 'JetBrains Mono',
  FONT_FALLBACK: 'Courier New',
};

// ─── Map ─────────────────────────────────────────────────────
// 1=stone wall, 2=brick wall, 3=tech wall, 4=door, 0=empty
// E=enemy spawn, H=health, A=ammo, P=player start

const MAP_RAW = [
  '1111111111111111111111111111111',
  '1..............1.............1',
  '1..............1.............1',
  '1......1.......1......E......1',
  '1......1.......4.............1',
  '1......1.......1.............1',
  '1..............1......H......1',
  '11111.1111111111111111.1111111',
  '1..............1.............1',
  '1.......E......1.............1',
  '1..............1.......E.....1',
  '1..............4.............1',
  '1...H..........1.............1',
  '1..............1.............1',
  '1111111.111111111111.11111111',
  '1............1..............A1',
  '1............1...............1',
  '1....P.......1........E......1',
  '1............1...............1',
  '1............1...............1',
  '1............1...............1',
  '11111111111111111111111111111',
];

// ─── Game State ──────────────────────────────────────────────

const state = {
  // Player
  px: 0, py: 0,       // Position
  angle: 0,            // Facing direction (radians)
  health: 100,
  ammo: 25,
  score: 0,
  kills: 0,
  shooting: false,
  shootTimer: 0,
  shootCooldown: 0,
  bobPhase: 0,
  bobAmount: 0,
  damageFlash: 0,
  dead: false,

  // World
  map: [],
  mapW: 0,
  mapH: 0,
  enemies: [],
  pickups: [],

  // ASCII framebuffer
  charBuf: [],    // character at each cell
  colorBuf: [],   // color string at each cell
  bgBuf: [],      // background color at each cell

  // Input
  keys: {},
  mouseDX: 0,
  pointerLocked: false,

  // Timing
  lastTime: 0,
  dt: 0,
  fps: 0,
  frameCount: 0,
  fpsTimer: 0,

  // Screen
  screen: 'title',  // 'title', 'game', 'dead'
  titleBlink: 0,

  // Canvas
  canvas: null,
  ctx: null,
  dpr: 1,
  W: 0, H: 0,
  charW: 0, charH: 0,  // Measured character dimensions

  // Pretext
  pt: null,
};

// ═══════════════════════════════════════════════════════════════
// Map Parsing
// ═══════════════════════════════════════════════════════════════

function parseMap() {
  // Trim the map and find dimensions
  const rows = MAP_RAW.map(r => r);
  state.mapH = rows.length;
  state.mapW = Math.max(...rows.map(r => r.length));

  state.map = [];
  state.enemies = [];
  state.pickups = [];

  for (let y = 0; y < state.mapH; y++) {
    state.map[y] = [];
    for (let x = 0; x < state.mapW; x++) {
      const ch = rows[y][x] || ' ';
      switch (ch) {
        case '1': state.map[y][x] = 1; break;
        case '2': state.map[y][x] = 2; break;
        case '3': state.map[y][x] = 3; break;
        case '4': state.map[y][x] = 4; break;
        case 'P':
          state.map[y][x] = 0;
          state.px = x + 0.5;
          state.py = y + 0.5;
          state.angle = -Math.PI / 2;  // Face north toward the action
          break;
        case 'E':
          state.map[y][x] = 0;
          state.enemies.push({
            x: x + 0.5, y: y + 0.5,
            health: 3,
            alive: true,
            type: 'imp',
            attackTimer: 0,
            moveTimer: 0,
            speed: 1.2,
            char: 'Ψ',
            hitFlash: 0,
            visible: false,
            dist: 0,
            screenX: 0,
          });
          break;
        case 'H':
          state.map[y][x] = 0;
          state.pickups.push({ x: x + 0.5, y: y + 0.5, type: 'health', active: true, char: '+' });
          break;
        case 'A':
          state.map[y][x] = 0;
          state.pickups.push({ x: x + 0.5, y: y + 0.5, type: 'ammo', active: true, char: '¤' });
          break;
        default: state.map[y][x] = 0; break;
      }
    }
  }
}

function isWall(x, y) {
  const mx = Math.floor(x), my = Math.floor(y);
  if (mx < 0 || my < 0 || mx >= state.mapW || my >= state.mapH) return true;
  return state.map[my][mx] > 0;
}

function wallType(x, y) {
  const mx = Math.floor(x), my = Math.floor(y);
  if (mx < 0 || my < 0 || mx >= state.mapW || my >= state.mapH) return 1;
  return state.map[my][mx];
}

// ═══════════════════════════════════════════════════════════════
// Raycaster
// ═══════════════════════════════════════════════════════════════

function castRay(angle) {
  // DDA raycasting — steps exactly along grid lines for accuracy + speed
  const dirX = Math.cos(angle);
  const dirY = Math.sin(angle);

  let mapX = Math.floor(state.px);
  let mapY = Math.floor(state.py);

  const deltaDistX = Math.abs(1 / dirX);
  const deltaDistY = Math.abs(1 / dirY);

  const stepX = dirX < 0 ? -1 : 1;
  const stepY = dirY < 0 ? -1 : 1;

  let sideDistX = dirX < 0
    ? (state.px - mapX) * deltaDistX
    : (mapX + 1 - state.px) * deltaDistX;
  let sideDistY = dirY < 0
    ? (state.py - mapY) * deltaDistY
    : (mapY + 1 - state.py) * deltaDistY;

  let side = 0;
  let steps = 0;

  while (steps < 64) {
    if (sideDistX < sideDistY) {
      sideDistX += deltaDistX;
      mapX += stepX;
      side = 0;
    } else {
      sideDistY += deltaDistY;
      mapY += stepY;
      side = 1;
    }
    steps++;

    if (mapX < 0 || mapY < 0 || mapX >= state.mapW || mapY >= state.mapH) break;
    if (state.map[mapY][mapX] > 0) {
      const wt = state.map[mapY][mapX];
      const dist = side === 0
        ? (mapX - state.px + (1 - stepX) / 2) / dirX
        : (mapY - state.py + (1 - stepY) / 2) / dirY;
      return { dist: Math.abs(dist), wallType: wt, side };
    }
  }
  return { dist: CFG.MAX_DEPTH, wallType: 0, side: 0 };
}

function renderScene() {
  const cols = CFG.COLS;
  const rows = CFG.ROWS;
  const halfRows = rows / 2;
  const buf = state.charBuf;
  const col = state.colorBuf;

  // Clear buffers
  for (let i = 0; i < cols * rows; i++) {
    buf[i] = ' ';
    col[i] = '#111';
  }

  // Depth buffer for sprite clipping
  const depthBuf = new Float32Array(cols);

  // Head bob offset
  const bob = Math.sin(state.bobPhase) * state.bobAmount;

  // Cast rays for each column
  for (let c = 0; c < cols; c++) {
    const rayAngle = (state.angle - CFG.FOV / 2) + (c / cols) * CFG.FOV;
    const hit = castRay(rayAngle);

    // Fix fisheye
    const corrDist = hit.dist * Math.cos(rayAngle - state.angle);
    depthBuf[c] = corrDist;

    // Wall height on screen
    const wallH = Math.min(rows, Math.round(rows / corrDist));
    const wallTop = Math.round(halfRows - wallH / 2 + bob);
    const wallBot = wallTop + wallH;

    // Wall color based on type and distance
    const wallColor = getWallColor(hit.wallType, hit.side, corrDist);

    for (let r = 0; r < rows; r++) {
      const idx = r * cols + c;

      if (r >= wallTop && r < wallBot) {
        // Wall
        const charIdx = Math.min(
          CFG.WALL_CHARS.length - 1,
          Math.floor((corrDist / CFG.MAX_DEPTH) * CFG.WALL_CHARS.length)
        );
        buf[idx] = CFG.WALL_CHARS[charIdx];
        col[idx] = wallColor;
      } else if (r < wallTop) {
        // Ceiling
        const ceilDist = (halfRows - r) / halfRows;
        const ci = Math.min(
          CFG.CEILING_CHARS.length - 1,
          Math.floor((1 - ceilDist) * CFG.CEILING_CHARS.length)
        );
        buf[idx] = CFG.CEILING_CHARS[ci];
        col[idx] = `hsl(0, 0%, ${Math.round(5 + ceilDist * 8)}%)`;
      } else {
        // Floor
        const floorDist = (r - halfRows) / halfRows;
        const fi = Math.min(
          CFG.FLOOR_CHARS.length - 1,
          Math.floor((1 - floorDist) * CFG.FLOOR_CHARS.length)
        );
        buf[idx] = CFG.FLOOR_CHARS[fi];
        const brightness = Math.round(12 + floorDist * 18);
        col[idx] = `hsl(25, 15%, ${brightness}%)`;
      }
    }
  }

  // Render sprites (enemies + pickups)
  renderSprites(depthBuf);

  // Shooting flash
  if (state.shootTimer > 0) {
    renderMuzzleFlash();
  }

  // Weapon
  renderWeapon();

  // HUD
  renderHUD();

  // Damage flash overlay
  if (state.damageFlash > 0) {
    applyDamageOverlay();
  }
}

// ─── Wall Colors ────────────────────────────────────────────

function getWallColor(wType, side, dist) {
  const brightness = Math.max(20, Math.round(100 - dist * 5));
  const sideMod = side === 1 ? 0.7 : 1.0;
  const b = Math.round(brightness * sideMod);

  switch (wType) {
    case 1: return `hsl(0, 0%, ${b}%)`;           // Stone — grey
    case 2: return `hsl(15, 50%, ${b * 0.6}%)`;    // Brick — dark red
    case 3: return `hsl(200, 60%, ${b * 0.5}%)`;   // Tech — blue
    case 4: return `hsl(40, 80%, ${b * 0.7}%)`;    // Door — gold
    default: return `hsl(0, 0%, ${b}%)`;
  }
}

// ─── Sprites ────────────────────────────────────────────────

function renderSprites(depthBuf) {
  const cols = CFG.COLS;
  const rows = CFG.ROWS;
  const halfRows = rows / 2;

  // Collect all visible sprites
  const sprites = [];

  for (const e of state.enemies) {
    if (!e.alive) continue;
    const dx = e.x - state.px;
    const dy = e.y - state.py;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx) - state.angle;
    // Normalize angle
    let a = angle;
    while (a < -Math.PI) a += 2 * Math.PI;
    while (a > Math.PI) a -= 2 * Math.PI;

    if (Math.abs(a) < CFG.FOV / 2 + 0.1) {
      const screenX = Math.round((0.5 + a / CFG.FOV) * cols);
      e.dist = dist;
      e.screenX = screenX;
      e.visible = true;
      sprites.push({ type: 'enemy', obj: e, dist, screenX, char: e.hitFlash > 0 ? '╬' : e.char });
    } else {
      e.visible = false;
    }
  }

  for (const p of state.pickups) {
    if (!p.active) continue;
    const dx = p.x - state.px;
    const dy = p.y - state.py;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx) - state.angle;
    let a = angle;
    while (a < -Math.PI) a += 2 * Math.PI;
    while (a > Math.PI) a -= 2 * Math.PI;

    if (Math.abs(a) < CFG.FOV / 2 + 0.1) {
      const screenX = Math.round((0.5 + a / CFG.FOV) * cols);
      sprites.push({ type: 'pickup', obj: p, dist, screenX, char: p.char });
    }
  }

  // Sort back to front
  sprites.sort((a, b) => b.dist - a.dist);

  // Draw sprites
  for (const sp of sprites) {
    if (sp.dist < 0.3) continue;
    const size = Math.min(rows, Math.round(rows / sp.dist));
    const spriteH = Math.max(1, Math.round(size * 0.6));
    const spriteW = Math.max(1, Math.round(size * 0.3));
    const topR = Math.round(halfRows - spriteH / 2 + Math.sin(state.bobPhase) * state.bobAmount);
    const leftC = sp.screenX - Math.floor(spriteW / 2);

    let color;
    if (sp.type === 'enemy') {
      color = sp.obj.hitFlash > 0
        ? 'hsl(0, 100%, 80%)'
        : `hsl(0, 70%, ${Math.max(30, Math.round(70 - sp.dist * 3))}%)`;
    } else if (sp.obj.type === 'health') {
      color = 'hsl(120, 80%, 60%)';
    } else {
      color = 'hsl(50, 90%, 65%)';
    }

    for (let r = topR; r < topR + spriteH; r++) {
      for (let c = leftC; c < leftC + spriteW; c++) {
        if (r < 0 || r >= rows || c < 0 || c >= cols) continue;
        if (depthBuf[c] < sp.dist) continue;  // Behind a wall
        const idx = r * cols + c;
        state.charBuf[idx] = sp.char;
        state.colorBuf[idx] = color;
      }
    }
  }
}

// ─── Muzzle Flash ───────────────────────────────────────────

function renderMuzzleFlash() {
  const cols = CFG.COLS;
  const rows = CFG.ROWS;
  const cx = Math.floor(cols / 2);
  const cy = Math.floor(rows * 0.55);
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

// ─── Weapon Display ─────────────────────────────────────────

function renderWeapon() {
  const cols = CFG.COLS;
  const rows = CFG.ROWS;
  const bob = Math.sin(state.bobPhase * 2) * state.bobAmount * 0.5;

  // Simple shotgun ASCII art at bottom center
  const weapon = [
    '  ║║  ',
    '  ║║  ',
    ' ╔╩╩╗ ',
    ' ║██║ ',
    ' ╚══╝ ',
  ];

  const startR = rows - weapon.length - 1 + Math.round(bob);
  const startC = Math.floor(cols / 2) - 3;

  for (let r = 0; r < weapon.length; r++) {
    for (let c = 0; c < weapon[r].length; c++) {
      const gr = startR + r;
      const gc = startC + c;
      if (gr < 0 || gr >= rows || gc < 0 || gc >= cols) continue;
      if (weapon[r][c] === ' ') continue;
      const idx = gr * cols + gc;
      state.charBuf[idx] = weapon[r][c];
      state.colorBuf[idx] = 'hsl(35, 20%, 55%)';
    }
  }
}

// ─── HUD ────────────────────────────────────────────────────

function renderHUD() {
  const cols = CFG.COLS;
  const rows = CFG.ROWS;
  const lastRow = rows - 1;

  // Build HUD string
  const healthStr = `♥ ${state.health}`;
  const ammoStr = `◆ ${state.ammo}`;
  const scoreStr = `SCORE: ${state.score}`;
  const fpsStr = `${state.fps}fps`;
  const killStr = `KILLS: ${state.kills}`;

  // Background bar
  for (let c = 0; c < cols; c++) {
    const idx = lastRow * cols + c;
    state.charBuf[idx] = '─';
    state.colorBuf[idx] = '#333';
  }

  // Write HUD elements
  writeText(lastRow, 1, healthStr, state.health > 30 ? 'hsl(120, 80%, 55%)' : 'hsl(0, 90%, 55%)');
  writeText(lastRow, healthStr.length + 3, ammoStr, 'hsl(50, 80%, 60%)');
  writeText(lastRow, Math.floor(cols / 2) - Math.floor(scoreStr.length / 2), scoreStr, '#aaa');
  writeText(lastRow, cols - killStr.length - fpsStr.length - 4, killStr, '#888');
  writeText(lastRow, cols - fpsStr.length - 1, fpsStr, '#555');

  // Crosshair
  const cx = Math.floor(cols / 2);
  const cy = Math.floor(rows / 2);
  if (cy > 0 && cy < rows - 1 && cx > 0 && cx < cols - 1) {
    state.charBuf[cy * cols + cx] = '+';
    state.colorBuf[cy * cols + cx] = 'hsl(0, 0%, 90%)';
  }
}

function writeText(row, startCol, text, color) {
  const cols = CFG.COLS;
  for (let i = 0; i < text.length; i++) {
    const c = startCol + i;
    if (c < 0 || c >= cols) continue;
    const idx = row * cols + c;
    state.charBuf[idx] = text[i];
    state.colorBuf[idx] = color;
  }
}

// ─── Damage Overlay ─────────────────────────────────────────

function applyDamageOverlay() {
  const cols = CFG.COLS;
  const rows = CFG.ROWS;
  const alpha = state.damageFlash;

  // Tint edges red
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const edgeDist = Math.min(c, cols - 1 - c, r, rows - 1 - r);
      if (edgeDist < 4) {
        const intensity = (1 - edgeDist / 4) * alpha;
        if (Math.random() < intensity * 0.5) {
          const idx = r * cols + c;
          state.charBuf[idx] = '░';
          state.colorBuf[idx] = `hsl(0, 90%, ${30 + intensity * 40}%)`;
        }
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

  // Mouse rotation
  s.angle += s.mouseDX * CFG.MOUSE_SENS;
  s.mouseDX = 0;

  // Keyboard rotation
  if (s.keys['ArrowLeft'] || s.keys['q']) s.angle -= CFG.ROT_SPEED * dt;
  if (s.keys['ArrowRight'] || s.keys['e']) s.angle += CFG.ROT_SPEED * dt;

  // Movement
  let moveX = 0, moveY = 0;
  const cos = Math.cos(s.angle);
  const sin = Math.sin(s.angle);

  if (s.keys['w'] || s.keys['ArrowUp']) {
    moveX += cos * CFG.MOVE_SPEED * dt;
    moveY += sin * CFG.MOVE_SPEED * dt;
  }
  if (s.keys['s'] || s.keys['ArrowDown']) {
    moveX -= cos * CFG.MOVE_SPEED * dt;
    moveY -= sin * CFG.MOVE_SPEED * dt;
  }
  if (s.keys['a']) {
    moveX += sin * CFG.STRAFE_SPEED * dt;
    moveY -= cos * CFG.STRAFE_SPEED * dt;
  }
  if (s.keys['d']) {
    moveX -= sin * CFG.STRAFE_SPEED * dt;
    moveY += cos * CFG.STRAFE_SPEED * dt;
  }

  // Collision detection — slide along walls
  const margin = 0.2;
  if (!isWall(s.px + moveX + Math.sign(moveX) * margin, s.py)) s.px += moveX;
  if (!isWall(s.px, s.py + moveY + Math.sign(moveY) * margin)) s.py += moveY;

  // Head bob when moving
  const moving = Math.abs(moveX) + Math.abs(moveY) > 0.001;
  if (moving) {
    s.bobPhase += dt * 8;
    s.bobAmount = Math.min(1.5, s.bobAmount + dt * 6);
  } else {
    s.bobAmount = Math.max(0, s.bobAmount - dt * 4);
  }

  // Shooting
  s.shootCooldown = Math.max(0, s.shootCooldown - dt);
  s.shootTimer = Math.max(0, s.shootTimer - dt);
  s.damageFlash = Math.max(0, s.damageFlash - dt * 3);

  if (s.shooting && s.shootCooldown <= 0 && s.ammo > 0) {
    shoot();
    s.shootCooldown = 0.4;
    s.shootTimer = 0.1;
    s.ammo--;
  }

  // Enemies
  updateEnemies(dt);

  // Pickups
  updatePickups();
}

function shoot() {
  // Check if crosshair ray hits an enemy
  const hit = castRay(state.angle);
  for (const e of state.enemies) {
    if (!e.alive || !e.visible) continue;
    // Check if enemy is roughly centered and closer than the wall
    const dx = e.x - state.px;
    const dy = e.y - state.py;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > hit.dist) continue;

    const enemyAngle = Math.atan2(dy, dx) - state.angle;
    let a = enemyAngle;
    while (a < -Math.PI) a += 2 * Math.PI;
    while (a > Math.PI) a -= 2 * Math.PI;

    // Wider hit detection for shotgun spread
    if (Math.abs(a) < 0.15) {
      e.health--;
      e.hitFlash = 0.15;
      if (e.health <= 0) {
        e.alive = false;
        state.score += 100;
        state.kills++;
      }
      break;
    }
  }
}

function updateEnemies(dt) {
  for (const e of state.enemies) {
    if (!e.alive) continue;

    e.hitFlash = Math.max(0, e.hitFlash - dt);
    e.attackTimer += dt;
    e.moveTimer += dt;

    const dx = state.px - e.x;
    const dy = state.py - e.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // Move toward player if they can see the player
    if (dist < 12 && dist > 1.5) {
      const speed = e.speed * dt;
      const nx = e.x + (dx / dist) * speed;
      const ny = e.y + (dy / dist) * speed;
      if (!isWall(nx, e.y)) e.x = nx;
      if (!isWall(e.x, ny)) e.y = ny;
    }

    // Attack player when close
    if (dist < 2.5 && e.attackTimer > 1.5) {
      e.attackTimer = 0;
      const damage = 5 + Math.floor(Math.random() * 10);
      state.health -= damage;
      state.damageFlash = 1.0;
      if (state.health <= 0) {
        state.health = 0;
        state.dead = true;
        state.screen = 'dead';
      }
    }
  }
}

function updatePickups() {
  for (const p of state.pickups) {
    if (!p.active) continue;
    const dx = state.px - p.x;
    const dy = state.py - p.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 0.6) {
      p.active = false;
      if (p.type === 'health') {
        state.health = Math.min(100, state.health + 25);
      } else if (p.type === 'ammo') {
        state.ammo += 12;
      }
      state.score += 25;
    }
  }
}

// ═══════════════════════════════════════════════════════════════
// Title & Death Screens
// ═══════════════════════════════════════════════════════════════

function renderTitleScreen() {
  const cols = CFG.COLS;
  const rows = CFG.ROWS;
  const buf = state.charBuf;
  const col = state.colorBuf;

  for (let i = 0; i < cols * rows; i++) {
    buf[i] = ' ';
    col[i] = '#111';
  }

  // Background noise
  for (let i = 0; i < cols * rows; i++) {
    if (Math.random() < 0.03) {
      buf[i] = '·.,:;'[Math.floor(Math.random() * 5)];
      col[i] = `hsl(0, 70%, ${5 + Math.random() * 15}%)`;
    }
  }

  const title = [
    '██████   ██████   ██████  ███    ███',
    '██   ██ ██    ██ ██    ██ ████  ████',
    '██   ██ ██    ██ ██    ██ ██ ████ ██',
    '██   ██ ██    ██ ██    ██ ██  ██  ██',
    '██████   ██████   ██████  ██      ██',
  ];

  const titleStartR = Math.floor(rows * 0.2);
  const titleStartC = Math.floor(cols / 2) - Math.floor(title[0].length / 2);

  for (let r = 0; r < title.length; r++) {
    for (let c = 0; c < title[r].length; c++) {
      if (title[r][c] === ' ') continue;
      const gr = titleStartR + r;
      const gc = titleStartC + c;
      if (gr >= 0 && gr < rows && gc >= 0 && gc < cols) {
        const idx = gr * cols + gc;
        buf[idx] = title[r][c];
        const hue = (performance.now() / 20 + c * 3) % 360;
        col[idx] = `hsl(${hue > 30 && hue < 330 ? 0 : hue}, 80%, 55%)`;
      }
    }
  }

  // Subtitle
  const sub = '── TEXT EDITION ──';
  writeText(titleStartR + 7, Math.floor(cols / 2) - Math.floor(sub.length / 2), sub, '#666');

  // Blinking prompt
  state.titleBlink += state.dt;
  if (Math.sin(state.titleBlink * 3) > 0) {
    const prompt = 'CLICK TO START';
    writeText(titleStartR + 11, Math.floor(cols / 2) - Math.floor(prompt.length / 2), prompt, '#ccc');
  }

  // Controls
  const controls = [
    'WASD — Move    Mouse — Look    Click — Shoot',
    'Q/E  — Rotate  Arrow Keys — Also work',
  ];
  const ctrlStart = titleStartR + 15;
  for (let i = 0; i < controls.length; i++) {
    writeText(ctrlStart + i, Math.floor(cols / 2) - Math.floor(controls[i].length / 2), controls[i], '#555');
  }

  // Attribution
  const attr = 'DOOM runs on everything. Even text.';
  writeText(rows - 3, Math.floor(cols / 2) - Math.floor(attr.length / 2), attr, '#333');
}

function renderDeathScreen() {
  const cols = CFG.COLS;
  const rows = CFG.ROWS;

  // Keep the last game frame but tint it red
  for (let i = 0; i < cols * rows; i++) {
    if (Math.random() < 0.4) {
      state.charBuf[i] = '░▒▓█'[Math.floor(Math.random() * 4)];
      state.colorBuf[i] = `hsl(0, ${40 + Math.random() * 40}%, ${10 + Math.random() * 20}%)`;
    }
  }

  const deathMsg = 'YOU DIED';
  const scoreMsg = `SCORE: ${state.score}  KILLS: ${state.kills}`;
  const restartMsg = 'CLICK TO RESTART';

  const cy = Math.floor(rows / 2);
  writeText(cy - 1, Math.floor(cols / 2) - Math.floor(deathMsg.length / 2), deathMsg, 'hsl(0, 90%, 50%)');
  writeText(cy + 1, Math.floor(cols / 2) - Math.floor(scoreMsg.length / 2), scoreMsg, '#aaa');

  state.titleBlink += state.dt;
  if (Math.sin(state.titleBlink * 3) > 0) {
    writeText(cy + 3, Math.floor(cols / 2) - Math.floor(restartMsg.length / 2), restartMsg, '#888');
  }
}

// ═══════════════════════════════════════════════════════════════
// Canvas Rendering — Pretext or direct fillText
// ═══════════════════════════════════════════════════════════════

function measureFont() {
  const ctx = state.ctx;
  const testSize = getFontSize();
  ctx.font = `${testSize}px "${CFG.FONT}", "${CFG.FONT_FALLBACK}", monospace`;
  const m = ctx.measureText('M');
  state.charW = m.width;
  state.charH = testSize * 1.15;
}

function getFontSize() {
  // Scale font to fill the canvas
  const byW = Math.floor(state.W / CFG.COLS);
  const byH = Math.floor(state.H / CFG.ROWS);
  return Math.max(6, Math.min(byW, byH));
}

function renderToCanvas() {
  const ctx = state.ctx;
  const dpr = state.dpr;
  const fontSize = getFontSize();

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  // Black background
  ctx.fillStyle = '#050505';
  ctx.fillRect(0, 0, state.W, state.H);

  ctx.font = `${fontSize}px "${CFG.FONT}", "${CFG.FONT_FALLBACK}", monospace`;
  ctx.textBaseline = 'top';
  ctx.textAlign = 'left';

  const cw = state.charW;
  const ch = state.charH;
  const cols = CFG.COLS;
  const rows = CFG.ROWS;

  // Offset to center the grid
  const offsetX = Math.max(0, (state.W - cols * cw) / 2);
  const offsetY = Math.max(0, (state.H - rows * ch) / 2);

  // Batch characters by color to reduce context switches
  const colorGroups = {};
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const idx = r * cols + c;
      const ch2 = state.charBuf[idx];
      if (ch2 === ' ') continue;
      const color = state.colorBuf[idx];
      if (!colorGroups[color]) colorGroups[color] = [];
      colorGroups[color].push({ ch: ch2, x: offsetX + c * cw, y: offsetY + r * ch });
    }
  }

  for (const color in colorGroups) {
    ctx.fillStyle = color;
    for (const item of colorGroups[color]) {
      ctx.fillText(item.ch, item.x, item.y);
    }
  }
}

// ═══════════════════════════════════════════════════════════════
// Minimap (rendered into the char buffer)
// ═══════════════════════════════════════════════════════════════

function renderMinimap() {
  if (state.screen !== 'game') return;
  const cols = CFG.COLS;
  const rows = CFG.ROWS;
  const mapScale = 1; // 1 map tile = 1 character
  const mmW = Math.min(state.mapW, 20);
  const mmH = Math.min(state.mapH, 14);

  // Position in top-right corner
  const startC = cols - mmW - 2;
  const startR = 1;

  // Viewport of the map centered on player
  const camX = Math.floor(state.px) - Math.floor(mmW / 2);
  const camY = Math.floor(state.py) - Math.floor(mmH / 2);

  for (let r = 0; r < mmH; r++) {
    for (let c = 0; c < mmW; c++) {
      const mapX = camX + c;
      const mapY = camY + r;
      const gr = startR + r;
      const gc = startC + c;
      if (gr >= rows || gc >= cols) continue;

      const idx = gr * cols + gc;

      if (mapX < 0 || mapY < 0 || mapX >= state.mapW || mapY >= state.mapH) {
        state.charBuf[idx] = ' ';
        state.colorBuf[idx] = '#111';
        continue;
      }

      const tile = state.map[mapY][mapX];
      if (tile > 0) {
        state.charBuf[idx] = '█';
        state.colorBuf[idx] = '#334';
      } else {
        state.charBuf[idx] = '·';
        state.colorBuf[idx] = '#1a1a1a';
      }
    }
  }

  // Player dot
  const pScreenC = startC + Math.floor(state.px) - camX;
  const pScreenR = startR + Math.floor(state.py) - camY;
  if (pScreenR >= 0 && pScreenR < rows && pScreenC >= 0 && pScreenC < cols) {
    // Direction arrow
    const arrows = '→↗↑↖←↙↓↘→';
    const aIdx = Math.round(((state.angle % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI)) / (Math.PI / 4));
    state.charBuf[pScreenR * cols + pScreenC] = arrows[aIdx] || '○';
    state.colorBuf[pScreenR * cols + pScreenC] = '#0f0';
  }

  // Enemy dots on minimap
  for (const e of state.enemies) {
    if (!e.alive) continue;
    const ec = startC + Math.floor(e.x) - camX;
    const er = startR + Math.floor(e.y) - camY;
    if (er >= startR && er < startR + mmH && ec >= startC && ec < startC + mmW) {
      state.charBuf[er * cols + ec] = '•';
      state.colorBuf[er * cols + ec] = '#f44';
    }
  }

  // Border
  for (let c = startC - 1; c <= startC + mmW; c++) {
    if (c >= 0 && c < cols) {
      const topIdx = (startR - 1) * cols + c;
      const botIdx = (startR + mmH) * cols + c;
      if (startR - 1 >= 0 && topIdx >= 0) { state.charBuf[topIdx] = '─'; state.colorBuf[topIdx] = '#333'; }
      if (startR + mmH < rows && botIdx < cols * rows) { state.charBuf[botIdx] = '─'; state.colorBuf[botIdx] = '#333'; }
    }
  }
  for (let r = startR; r < startR + mmH; r++) {
    const lc = startC - 1;
    const rc = startC + mmW;
    if (lc >= 0) { state.charBuf[r * cols + lc] = '│'; state.colorBuf[r * cols + lc] = '#333'; }
    if (rc < cols) { state.charBuf[r * cols + rc] = '│'; state.colorBuf[r * cols + rc] = '#333'; }
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

  // FPS counter
  state.frameCount++;
  state.fpsTimer += state.dt;
  if (state.fpsTimer >= 1) {
    state.fps = state.frameCount;
    state.frameCount = 0;
    state.fpsTimer = 0;
  }

  update(state.dt);

  // Render to char buffer
  switch (state.screen) {
    case 'title':
      renderTitleScreen();
      break;
    case 'game':
      renderScene();
      renderMinimap();
      break;
    case 'dead':
      renderDeathScreen();
      break;
  }

  // Draw char buffer to canvas
  renderToCanvas();
}

// ═══════════════════════════════════════════════════════════════
// Input
// ═══════════════════════════════════════════════════════════════

function setupInput() {
  document.addEventListener('keydown', (e) => {
    state.keys[e.key.toLowerCase()] = true;
    // Prevent scrolling with arrow keys and WASD
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
      e.preventDefault();
    }
    // Also store original case for arrow keys
    if (e.key.startsWith('Arrow')) state.keys[e.key] = true;
  });

  document.addEventListener('keyup', (e) => {
    state.keys[e.key.toLowerCase()] = false;
    if (e.key.startsWith('Arrow')) state.keys[e.key] = false;
  });

  state.canvas.addEventListener('click', () => {
    if (state.screen === 'title') {
      startGame();
      return;
    }
    if (state.screen === 'dead') {
      resetGame();
      return;
    }
    // Request pointer lock (may fail in iframe)
    if (!state.pointerLocked) {
      try { state.canvas.requestPointerLock(); } catch {}
    }
  });

  document.addEventListener('pointerlockchange', () => {
    state.pointerLocked = document.pointerLockElement === state.canvas;
  });

  document.addEventListener('mousemove', (e) => {
    if (state.pointerLocked) {
      state.mouseDX += e.movementX;
    }
  });

  state.canvas.addEventListener('mousedown', (e) => {
    if (state.screen === 'game' && e.button === 0) {
      state.shooting = true;
    }
  });

  document.addEventListener('mouseup', (e) => {
    if (e.button === 0) {
      state.shooting = false;
    }
  });

  window.addEventListener('resize', () => {
    sizeCanvas();
    measureFont();
  });
}

// ═══════════════════════════════════════════════════════════════
// Game Start / Reset
// ═══════════════════════════════════════════════════════════════

function startGame() {
  state.screen = 'game';
  resetGame();
  try { state.canvas.requestPointerLock(); } catch {}
}

function resetGame() {
  parseMap();
  state.health = 100;
  state.ammo = 25;
  state.score = 0;
  state.kills = 0;
  state.dead = false;
  state.shooting = false;
  state.shootTimer = 0;
  state.shootCooldown = 0;
  state.bobPhase = 0;
  state.bobAmount = 0;
  state.damageFlash = 0;
  state.screen = 'game';
  state.titleBlink = 0;
}

// ═══════════════════════════════════════════════════════════════
// Init
// ═══════════════════════════════════════════════════════════════

function sizeCanvas() {
  state.W = window.innerWidth;
  state.H = window.innerHeight;
  state.canvas.width = state.W * state.dpr;
  state.canvas.height = state.H * state.dpr;
}

async function init() {
  state.canvas = document.getElementById('canvas');
  state.ctx = state.canvas.getContext('2d');
  state.dpr = window.devicePixelRatio || 1;

  sizeCanvas();

  // Allocate buffers
  const total = CFG.COLS * CFG.ROWS;
  state.charBuf = new Array(total).fill(' ');
  state.colorBuf = new Array(total).fill('#111');

  // Wait for font
  await document.fonts.ready;
  measureFont();

  // Parse map
  parseMap();

  // Set up input
  setupInput();

  // Start game loop
  requestAnimationFrame(gameLoop);
}

init();
