// ═══════════════════════════════════════════════════════════════
// DOOM-TEXT: PRETEXT EDITION
// A playable DOOM raycaster where the entire viewport is rendered
// through Pretext's text layout engine. Text flows around the
// weapon, minimap, and HUD using displacement functions.
// Non-monospace font (Syne) with per-glyph measurement.
// Damage causes live text reflow via displacement scatter.
// ═══════════════════════════════════════════════════════════════

const FONT = 'Syne';
const BUBBLE_R = 200;

const CFG = {
  COLS: 90, ROWS: 32,
  FOV: Math.PI / 3, MAX_DEPTH: 20,
  MOVE_SPEED: 3.0, STRAFE_SPEED: 2.5, ROT_SPEED: 2.0, MOUSE_SENS: 0.002,
};

// ─── Maps ────────────────────────────────────────────────────

const MAPS = [
  [
    '111111111111111111111111111111',
    '1..............1.............1',
    '1..............1.............1',
    '1......1.......1......E......1',
    '1......1.......4.............1',
    '1......1.......1.............1',
    '1..............1......H......1',
    '11111.11111111111111111.11111',
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
    '1111111111111111111111111111',
  ],
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

// ─── State ──────────────────────────────────────────────────

const state = {
  px: 0, py: 0, angle: 0,
  health: 100, ammo: 25, score: 0, kills: 0, level: 0, totalEnemies: 0,
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
  canvas: null, ctx: null, dpr: 1, W: 0, H: 0,
  // Pretext
  pt: null, ptReady: false, ptPrep: {},
  // Mouse for cursor interaction
  mouseX: -9999, mouseY: -9999, smoothX: -9999, smoothY: -9999, isHovering: false,
  // Title particles
  titleParticles: [],
};

// ═══════════════════════════════════════════════════════════════
// Sound Effects
// ═══════════════════════════════════════════════════════════════

let audioCtx = null;
function initAudio() { if (!audioCtx) try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch {} }
function playNoise(dur, freq, type, vol) {
  if (!audioCtx) return;
  const o = audioCtx.createOscillator(), g = audioCtx.createGain();
  o.type = type || 'sawtooth';
  o.frequency.setValueAtTime(freq, audioCtx.currentTime);
  o.frequency.exponentialRampToValueAtTime(freq * 0.1, audioCtx.currentTime + dur);
  g.gain.setValueAtTime(vol || 0.15, audioCtx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
  o.connect(g).connect(audioCtx.destination); o.start(); o.stop(audioCtx.currentTime + dur);
}
function sfxShoot() {
  if (!audioCtx) return;
  const n = audioCtx.sampleRate * 0.08, b = audioCtx.createBuffer(1, n, audioCtx.sampleRate), d = b.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
  const s = audioCtx.createBufferSource(), g = audioCtx.createGain(); s.buffer = b;
  g.gain.setValueAtTime(0.2, audioCtx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.08);
  s.connect(g).connect(audioCtx.destination); s.start();
}
function sfxHit() { playNoise(0.15, 440, 'sawtooth', 0.1); }
function sfxEnemyDeath() { playNoise(0.3, 220, 'square', 0.12); }
function sfxPickup() { playNoise(0.1, 880, 'sine', 0.08); setTimeout(() => playNoise(0.1, 1320, 'sine', 0.08), 100); }
function sfxDamage() { playNoise(0.1, 60, 'square', 0.2); }

// ═══════════════════════════════════════════════════════════════
// Map + Entities (identical to base version)
// ═══════════════════════════════════════════════════════════════

function parseMap(lvl) {
  const rows = MAPS[lvl || 0];
  state.mapH = rows.length; state.mapW = Math.max(...rows.map(r => r.length));
  state.map = []; state.enemies = []; state.pickups = []; state.deathParticles = [];
  for (let y = 0; y < state.mapH; y++) {
    state.map[y] = [];
    for (let x = 0; x < state.mapW; x++) {
      const ch = rows[y][x] || ' '; state.map[y][x] = 0;
      if ('1234'.includes(ch)) state.map[y][x] = parseInt(ch);
      else if (ch === 'P') { state.px = x + 0.5; state.py = y + 0.5; state.angle = -Math.PI / 2; }
      else if (ch === 'E') state.enemies.push(mkEnemy(x, y, 'imp'));
      else if (ch === 'D') state.enemies.push(mkEnemy(x, y, 'demon'));
      else if (ch === 'F') state.enemies.push(mkEnemy(x, y, 'spectre'));
      else if (ch === 'H') state.pickups.push({ x: x + 0.5, y: y + 0.5, type: 'health', active: true, char: '+' });
      else if (ch === 'A') state.pickups.push({ x: x + 0.5, y: y + 0.5, type: 'ammo', active: true, char: '¤' });
    }
  }
  state.totalEnemies = state.enemies.length;
}
function mkEnemy(x, y, t) {
  const b = { x: x+.5, y: y+.5, alive: true, attackTimer: 0, hitFlash: 0, visible: false, dist: 0, screenX: 0 };
  if (t === 'demon') return { ...b, type: t, health: 6, speed: 0.8, char: 'Ω', damage: [10,20], color: 280 };
  if (t === 'spectre') return { ...b, type: t, health: 2, speed: 2.5, char: 'Φ', damage: [3,8], color: 180 };
  return { ...b, type: 'imp', health: 3, speed: 1.2, char: 'Ψ', damage: [5,10], color: 0 };
}
function isWall(x, y) {
  const mx = Math.floor(x), my = Math.floor(y);
  if (mx < 0 || my < 0 || mx >= state.mapW || my >= state.mapH) return true;
  const t = state.map[my][mx]; return t > 0 && t !== 4;
}

// ═══════════════════════════════════════════════════════════════
// Raycaster (DDA) — identical
// ═══════════════════════════════════════════════════════════════

function castRay(angle) {
  const dx = Math.cos(angle), dy = Math.sin(angle);
  let mx = Math.floor(state.px), my = Math.floor(state.py);
  const ddx = Math.abs(1/dx), ddy = Math.abs(1/dy);
  const sx = dx<0?-1:1, sy = dy<0?-1:1;
  let sdx = dx<0?(state.px-mx)*ddx:(mx+1-state.px)*ddx;
  let sdy = dy<0?(state.py-my)*ddy:(my+1-state.py)*ddy;
  let side = 0;
  for (let i = 0; i < 64; i++) {
    if (sdx < sdy) { sdx += ddx; mx += sx; side = 0; } else { sdy += ddy; my += sy; side = 1; }
    if (mx<0||my<0||mx>=state.mapW||my>=state.mapH) break;
    if (state.map[my][mx] > 0) {
      const wt = state.map[my][mx];
      const dist = side===0 ? (mx-state.px+(1-sx)/2)/dx : (my-state.py+(1-sy)/2)/dy;
      let wallX = side===0 ? state.py+Math.abs(dist)*dy : state.px+Math.abs(dist)*dx;
      wallX -= Math.floor(wallX);
      return { dist: Math.abs(dist), wallType: wt, side, wallX };
    }
  }
  return { dist: CFG.MAX_DEPTH, wallType: 0, side: 0, wallX: 0 };
}

// ═══════════════════════════════════════════════════════════════
// Scene Buffer Fill (fills charBuf/colorBuf, same logic)
// ═══════════════════════════════════════════════════════════════

function fillSceneBuffer() {
  const cols = CFG.COLS, rows = CFG.ROWS, half = rows / 2;
  const buf = state.charBuf, col = state.colorBuf;
  const shake = Math.round(state.screenShake * (Math.random() > 0.5 ? 1 : -1));

  for (let i = 0; i < cols * rows; i++) { buf[i] = ' '; col[i] = '#111'; }

  const depthBuf = new Float32Array(cols);
  const bob = Math.sin(state.bobPhase) * state.bobAmount;

  for (let c = 0; c < cols; c++) {
    const ra = (state.angle - CFG.FOV/2) + (c/cols) * CFG.FOV;
    const hit = castRay(ra);
    const cd = hit.dist * Math.cos(ra - state.angle);
    depthBuf[c] = cd;
    const wh = Math.min(rows, Math.round(rows / cd));
    const wt = Math.round(half - wh/2 + bob + shake), wb = wt + wh;
    const wColor = getWallColor(hit.wallType, hit.side, cd);

    for (let r = 0; r < rows; r++) {
      const idx = r * cols + c;
      if (r >= wt && r < wb) {
        buf[idx] = getWallChar(hit.wallType, hit.wallX, (r-wt)/wh, cd);
        col[idx] = wColor;
      } else if (r < wt) {
        const d = (half-r)/half;
        buf[idx] = d > 0.7 ? '·' : d > 0.4 ? '.' : ' ';
        col[idx] = `hsl(220,10%,${Math.round(3+d*6)}%)`;
      } else {
        const d = (r-half)/half;
        const ck = ((Math.floor(c*cd*0.1)+Math.floor(r*0.5))&1);
        buf[idx] = d > 0.7 ? (ck?'·':'∙') : d > 0.4 ? (ck?':':'.') : '.';
        col[idx] = `hsl(25,${ck?20:10}%,${Math.round(10+d*20)}%)`;
      }
    }
  }

  fillSprites(depthBuf);
  fillDeathParticles();

  // Crosshair
  const cx = Math.floor(cols/2), cy = Math.floor(rows/2);
  if (cy > 0 && cy < rows-1) { buf[cy*cols+cx] = '+'; col[cy*cols+cx] = '#ddd'; }
}

function getWallChar(wt, wx, wy, dist) {
  const di = Math.min(8, Math.floor((dist/CFG.MAX_DEPTH)*9));
  const far = '█▓▓▒▒░░·. ';
  switch(wt) {
    case 1: { const bx=(wx*4)%1,by=(wy*8)%1; return (bx<.08||by<.06) ? (di<4?'▒':'░') : far[di]; }
    case 2: { const bx=(wx*3)%1,by=(wy*6)%1; return bx<.1&&by<.1?'╬':bx<.1?'║':by<.08?'═':far[di]; }
    case 3: { const bx=(wx*5)%1,by=(wy*5)%1; return bx>.45&&bx<.55&&by>.45&&by<.55?'◊':(bx<.05||bx>.95||by<.05||by>.95)?'░':far[di]; }
    case 4: return (wx*8)%1<.5?'▐':'▌';
    default: return far[di];
  }
}

function getWallColor(wt, side, dist) {
  const b = Math.max(20, Math.round((100-dist*5)*(side===1?.7:1)));
  switch(wt) {
    case 1: return `hsl(0,0%,${b}%)`;
    case 2: return `hsl(15,50%,${Math.round(b*.6)}%)`;
    case 3: return `hsl(200,60%,${Math.round(b*.5)}%)`;
    case 4: return `hsl(40,80%,${Math.round(b*.7)}%)`;
    default: return `hsl(0,0%,${b}%)`;
  }
}

function fillSprites(depthBuf) {
  const cols = CFG.COLS, rows = CFG.ROWS, half = rows/2, now = performance.now();
  const sprites = [];
  for (const e of state.enemies) {
    if (!e.alive) continue;
    const dx=e.x-state.px, dy=e.y-state.py, dist=Math.sqrt(dx*dx+dy*dy);
    let a=Math.atan2(dy,dx)-state.angle; while(a<-Math.PI)a+=2*Math.PI; while(a>Math.PI)a-=2*Math.PI;
    if (Math.abs(a)<CFG.FOV/2+.1) {
      const sx=Math.round((.5+a/CFG.FOV)*cols); e.dist=dist; e.screenX=sx; e.visible=true;
      let ch=e.hitFlash>0?'╬':e.char; if(e.type==='spectre'&&Math.sin(now/80)>.3) ch='░';
      sprites.push({type:'enemy',obj:e,dist,screenX:sx,char:ch});
    } else e.visible=false;
  }
  for (const p of state.pickups) {
    if (!p.active) continue;
    const dx=p.x-state.px,dy=p.y-state.py,dist=Math.sqrt(dx*dx+dy*dy);
    let a=Math.atan2(dy,dx)-state.angle; while(a<-Math.PI)a+=2*Math.PI; while(a>Math.PI)a-=2*Math.PI;
    if (Math.abs(a)<CFG.FOV/2+.1) sprites.push({type:'pickup',obj:p,dist,screenX:Math.round((.5+a/CFG.FOV)*cols),char:p.char});
  }
  sprites.sort((a,b)=>b.dist-a.dist);
  for (const sp of sprites) {
    if (sp.dist<.3) continue;
    const sz=Math.min(rows,Math.round(rows/sp.dist)), sh=Math.max(1,Math.round(sz*.6)), sw=Math.max(1,Math.round(sz*.3));
    const tr=Math.round(half-sh/2+Math.sin(state.bobPhase)*state.bobAmount), lc=sp.screenX-Math.floor(sw/2);
    let color; if(sp.type==='enemy'){const e=sp.obj;color=e.hitFlash>0?'hsl(0,100%,80%)':`hsl(${e.color},70%,${Math.max(30,Math.round(70-sp.dist*3))}%)`;}
    else color=sp.obj.type==='health'?'hsl(120,80%,60%)':'hsl(50,90%,65%)';
    for(let r=tr;r<tr+sh;r++) for(let c=lc;c<lc+sw;c++){
      if(r<0||r>=rows||c<0||c>=cols||depthBuf[c]<sp.dist) continue;
      state.charBuf[r*cols+c]=sp.char; state.colorBuf[r*cols+c]=color;
    }
  }
}

function fillDeathParticles() {
  const cols=CFG.COLS, rows=CFG.ROWS;
  for (const dp of state.deathParticles) {
    if(dp.life<=0) continue;
    const r=Math.round(dp.r),c=Math.round(dp.c);
    if(r>=0&&r<rows&&c>=0&&c<cols) { state.charBuf[r*cols+c]=dp.char; state.colorBuf[r*cols+c]=`hsl(${dp.hue},80%,${Math.round(dp.life*70)}%)`; }
  }
}

// ═══════════════════════════════════════════════════════════════
// Pretext Loading & Helpers
// ═══════════════════════════════════════════════════════════════

async function loadPretext() {
  try { state.pt = await import('https://esm.sh/pretext@0.3.0'); state.ptReady = true; }
  catch(e) { console.warn('Pretext unavailable:', e); }
}

function ptPrepare(text, font) {
  if (!state.ptReady) return null;
  const fn = state.pt.prepareWithSegments || state.pt.prepare;
  try { return fn(text, font); } catch { return null; }
}

function ptLayout(prep, offset, maxW, lh) {
  if (!state.ptReady || !prep || !state.pt.layoutNextLine) return null;
  try {
    const r = state.pt.layoutNextLine(prep, offset, maxW, lh);
    if (!r) return null;
    const l = r.line || r;
    const text = typeof l === 'string' ? l : (l.text || l.content || '');
    const next = r.nextOffset != null ? r.nextOffset : offset + text.length;
    return next > offset ? { text: text.replace(/\n$/, ''), next } : null;
  } catch { return null; }
}

function mkFont(weight, size) { return weight + ' ' + size + 'px ' + FONT; }

function sz(base) {
  if (state.W < 500) return Math.round(base * 0.5);
  if (state.W < 800) return Math.round(base * 0.7);
  return Math.round(base);
}

// ═══════════════════════════════════════════════════════════════
// PRETEXT VIEWPORT RENDERER
// The core innovation: renders the ASCII raycaster output through
// Pretext's text layout engine with displacement functions.
// ═══════════════════════════════════════════════════════════════

function renderViewportPretext() {
  const ctx = state.ctx, dpr = state.dpr;
  const W = state.W, H = state.H;
  const cols = CFG.COLS, rows = CFG.ROWS;

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = '#050505';
  ctx.fillRect(0, 0, W, H);

  const fontSize = Math.max(8, Math.min(Math.floor(W / (cols * 0.7)), Math.floor(H / (rows * 1.2))));
  const lh = Math.round(fontSize * 1.15);
  const font = mkFont(400, fontSize);
  const baseMaxW = Math.min(W * 0.95, cols * fontSize * 0.65);
  const marginX = Math.max(10, (W - baseMaxW) / 2);

  // Build the full scene text — one row per line, separated by newlines
  let sceneText = '';
  const rowTexts = [];
  const rowColorMaps = []; // maps char index in row → color

  for (let r = 0; r < rows; r++) {
    let rowStr = '';
    const colors = [];
    for (let c = 0; c < cols; c++) {
      const ch = state.charBuf[r * cols + c];
      rowStr += ch;
      colors.push(state.colorBuf[r * cols + c]);
    }
    // Trim trailing spaces for Pretext (it measures actual content)
    const trimmed = rowStr.replace(/\s+$/, '');
    rowTexts.push(trimmed);
    rowColorMaps.push(colors);
  }

  // Prepare each row with Pretext for variable-width layout
  const now = performance.now();

  for (let r = 0; r < rows; r++) {
    const text = rowTexts[r];
    if (!text || text.trim().length === 0) continue;

    const lineY = marginX * 0.3 + r * lh;

    // Game displacement function — text flows around elements
    const d = gameViewportDisplace(lineY, r, rows, baseMaxW, now);

    if (d.w < 10) continue;

    // Use Pretext to measure and lay out this row
    const prep = ptPrepare(text, font);

    if (prep) {
      // Pretext layout — handles variable character widths
      let offset = 0;
      let subLine = 0;
      const maxSubLines = 3; // Allow text to wrap if displaced too narrow

      while (offset < text.length && subLine < maxSubLines) {
        const lineW = subLine === 0 ? d.w : d.w * 0.9;
        const result = ptLayout(prep, offset, lineW, lh);
        if (!result) break;

        const layoutText = result.text;
        const drawY = lineY + subLine * lh;

        // Draw each character with its color from the raycaster
        ctx.font = font;
        ctx.textBaseline = 'top';
        let drawX = marginX + d.x;

        for (let i = 0; i < layoutText.length; i++) {
          const ch = layoutText[i];
          const origIdx = offset + i;
          const color = origIdx < rowColorMaps[r].length ? rowColorMaps[r][origIdx] : '#333';

          ctx.fillStyle = color;
          ctx.fillText(ch, drawX, drawY);

          // Pretext-measured character advance (variable width!)
          drawX += ctx.measureText(ch).width;
        }

        offset = result.next;
        subLine++;
      }
    } else {
      // Fallback: manual layout with measureText (still variable-width via Syne)
      ctx.font = font;
      ctx.textBaseline = 'top';
      let drawX = marginX + d.x;
      const drawY = lineY;

      for (let i = 0; i < text.length; i++) {
        const ch = text[i];
        const color = rowColorMaps[r][i] || '#333';
        const cw = ctx.measureText(ch).width;

        // Stop if we exceed available width
        if (drawX + cw > marginX + d.x + d.w) break;

        ctx.fillStyle = color;
        ctx.fillText(ch, drawX, drawY);
        drawX += cw;
      }
    }
  }

  // Render weapon as separate text block (not in the flowing text)
  renderWeaponOverlay(ctx, fontSize, lh, marginX, baseMaxW, now);

  // Render HUD as Pretext text block at bottom
  renderHUDPretext(ctx, fontSize, lh, W, H);

  // Render minimap directly on canvas (spatial data, not text)
  renderMinimapCanvas(ctx, W);

  // Muzzle flash overlay
  if (state.shootTimer > 0) renderMuzzleFlashCanvas(ctx, W, H);

  // Damage glow
  if (state.damageFlash > 0) renderDamageGlow(ctx, W, H);
}

// ─── Game Viewport Displacement ─────────────────────────────
// This is where Pretext shines: per-line variable width creates
// organic text flow around game UI elements.

function gameViewportDisplace(lineY, row, totalRows, baseW, now) {
  let x = 0, w = baseW;
  const t = now / 2000;

  // Sinusoidal edge wave — text breathes
  const breathe = Math.sin(t + row * 0.15) * sz(15);
  x += breathe * 0.3;
  w -= Math.abs(breathe) * 0.5;

  // Minimap exclusion zone (top-right area, first ~40% of rows)
  if (row < totalRows * 0.45) {
    const minimapShrink = sz(120) + Math.sin(t * 1.3 + row * 0.2) * sz(10);
    w -= minimapShrink;
  }

  // Weapon exclusion zone (bottom-center)
  if (row > totalRows * 0.7) {
    const proximity = (row - totalRows * 0.7) / (totalRows * 0.3);
    const weaponIndent = proximity * proximity * sz(80);
    // Push from center — indent from both sides
    x += weaponIndent * 0.3;
    w -= weaponIndent * 0.6;
  }

  // Damage scatter — Pretext-powered live text reflow!
  if (state.damageFlash > 0) {
    const scatter = Math.sin(row * 0.8 + now / 80) * state.damageFlash * sz(30);
    x += scatter;
    // Width jitter on damage
    w += Math.cos(row * 1.3 + now / 60) * state.damageFlash * sz(20);
  }

  // Shoot recoil — brief upward squeeze
  if (state.recoil > 0) {
    const recoilWave = Math.sin(row * 0.3 + now / 50) * state.recoil * sz(8);
    x += recoilWave;
  }

  // Cursor interaction — text pushes away from mouse (like pretext portfolio)
  if (state.smoothX > -1000 && state.screen === 'game') {
    const dy = Math.abs(lineY - state.smoothY);
    if (dy < BUBBLE_R) {
      const p = 1 - dy / BUBBLE_R;
      const cursorPush = p * p * sz(40);
      const bias = Math.max(-1, Math.min(1, (state.smoothX - state.W / 2) / (baseW / 2)));
      x += cursorPush * (0.5 - bias * 0.3);
      w -= cursorPush * 0.5;
    }
  }

  return { x, w: Math.max(sz(30), w) };
}

// ─── Weapon Overlay (Pretext text block) ────────────────────

function renderWeaponOverlay(ctx, fontSize, lh, marginX, baseW, now) {
  const weaponText = '║║ ╔╩╩╗ ║██║ ╚══╝';
  const bob = Math.sin(state.bobPhase * 2) * state.bobAmount * 2;
  const recoilY = state.recoil * -8;

  const wx = marginX + baseW * 0.42;
  const wy = state.H * 0.78 + bob + recoilY;

  const weaponFont = mkFont(600, Math.round(fontSize * 1.2));

  // Use Pretext for weapon text with tight layout
  const prep = ptPrepare(weaponText, weaponFont);
  if (prep) {
    let offset = 0, line = 0;
    while (offset < weaponText.length && line < 4) {
      const result = ptLayout(prep, offset, sz(80), lh * 1.2);
      if (!result) break;
      ctx.font = weaponFont;
      ctx.textBaseline = 'top';
      ctx.fillStyle = `hsl(35, 20%, ${45 + Math.sin(now / 500) * 10}%)`;
      ctx.fillText(result.text, wx, wy + line * lh * 1.1);
      offset = result.next; line++;
    }
  } else {
    ctx.font = weaponFont;
    ctx.fillStyle = 'hsl(35, 20%, 55%)';
    ctx.textBaseline = 'top';
    ctx.fillText('║║', wx + 5, wy);
    ctx.fillText('╔╩╩╗', wx, wy + lh);
    ctx.fillText('║██║', wx, wy + lh * 2);
    ctx.fillText('╚══╝', wx, wy + lh * 3);
  }
}

// ─── HUD as Pretext Text Block ──────────────────────────────

function renderHUDPretext(ctx, fontSize, lh, W, H) {
  const hudText = `♥ ${state.health}  ◆ ${state.ammo}  LVL ${state.level+1}  ·  SCORE: ${state.score}  ·  KILLS: ${state.kills}/${state.totalEnemies}  ·  ${state.fps}fps`;
  const hudFont = mkFont(600, Math.round(fontSize * 0.85));
  const hudY = H - lh * 1.5;

  // Separator line
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(20, hudY - 4);
  ctx.lineTo(W - 20, hudY - 4);
  ctx.stroke();

  // Use Pretext for HUD layout — variable-width stat labels
  const prep = ptPrepare(hudText, hudFont);
  if (prep) {
    const result = ptLayout(prep, 0, W * 0.9, lh);
    if (result) {
      ctx.font = hudFont;
      ctx.textBaseline = 'top';
      let drawX = (W - ctx.measureText(result.text).width) / 2;

      for (let i = 0; i < result.text.length; i++) {
        const ch = result.text[i];
        // Color code HUD elements
        if (ch === '♥') ctx.fillStyle = state.health > 30 ? 'hsl(120,80%,55%)' : 'hsl(0,90%,55%)';
        else if (ch === '◆') ctx.fillStyle = 'hsl(50,80%,60%)';
        else if ('0123456789'.includes(ch)) ctx.fillStyle = '#bbb';
        else if (ch === '·') ctx.fillStyle = '#333';
        else ctx.fillStyle = '#777';

        ctx.fillText(ch, drawX, hudY);
        drawX += ctx.measureText(ch).width;
      }
    }
  } else {
    ctx.font = hudFont;
    ctx.fillStyle = '#777';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(hudText, W / 2, hudY);
    ctx.textAlign = 'left';
  }
}

// ─── Minimap (canvas drawing) ───────────────────────────────

function renderMinimapCanvas(ctx, W) {
  const mmW = Math.min(state.mapW, 18), mmH = Math.min(state.mapH, 12);
  const cellSz = sz(6);
  const ox = W - mmW * cellSz - sz(15), oy = sz(12);
  const camX = Math.floor(state.px) - Math.floor(mmW/2), camY = Math.floor(state.py) - Math.floor(mmH/2);

  // Background
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(ox - 2, oy - 2, mmW * cellSz + 4, mmH * cellSz + 4);

  for (let r = 0; r < mmH; r++) {
    for (let c = 0; c < mmW; c++) {
      const mx = camX+c, my = camY+r;
      if (mx<0||my<0||mx>=state.mapW||my>=state.mapH) continue;
      const tile = state.map[my][mx];
      if (tile > 0) {
        ctx.fillStyle = tile===4 ? '#554' : '#445';
        ctx.fillRect(ox+c*cellSz, oy+r*cellSz, cellSz-1, cellSz-1);
      }
    }
  }

  // Player
  const px = ox + (state.px - camX) * cellSz, py = oy + (state.py - camY) * cellSz;
  ctx.fillStyle = '#0f0';
  ctx.beginPath(); ctx.arc(px, py, cellSz*0.4, 0, Math.PI*2); ctx.fill();
  // Direction line
  ctx.strokeStyle = '#0f0'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(px, py);
  ctx.lineTo(px + Math.cos(state.angle)*cellSz*1.5, py + Math.sin(state.angle)*cellSz*1.5);
  ctx.stroke();

  // Enemies
  for (const e of state.enemies) {
    if (!e.alive) continue;
    ctx.fillStyle = e.type==='demon'?'#c4f':e.type==='spectre'?'#4cf':'#f44';
    ctx.beginPath();
    ctx.arc(ox+(e.x-camX)*cellSz, oy+(e.y-camY)*cellSz, cellSz*0.3, 0, Math.PI*2);
    ctx.fill();
  }
}

// ─── Muzzle Flash (canvas overlay) ──────────────────────────

function renderMuzzleFlashCanvas(ctx, W, H) {
  const cx = W * 0.5, cy = H * 0.55;
  const r = state.shootTimer / 0.1 * sz(30);
  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
  g.addColorStop(0, `hsla(40, 100%, 70%, ${state.shootTimer * 5})`);
  g.addColorStop(1, 'hsla(40, 100%, 70%, 0)');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2); ctx.fill();
}

// ─── Damage Glow ────────────────────────────────────────────

function renderDamageGlow(ctx, W, H) {
  const a = state.damageFlash * 0.3;
  // Red vignette
  const g = ctx.createRadialGradient(W/2, H/2, W*0.3, W/2, H/2, W*0.7);
  g.addColorStop(0, 'hsla(0, 0%, 0%, 0)');
  g.addColorStop(1, `hsla(0, 80%, 30%, ${a})`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}

// ═══════════════════════════════════════════════════════════════
// Title Screen (Full Pretext: wave + particles + cursor)
// ═══════════════════════════════════════════════════════════════

function initTitleParticles() {
  state.titleParticles = [];
  const chars = 'DOOM█▓▒░ΨΩΦ×+◊•';
  for (let i = 0; i < 70; i++) {
    state.titleParticles.push({
      x: Math.random() * state.W, y: Math.random() * state.H,
      vx: (Math.random()-.5)*.4, vy: (Math.random()-.5)*.3,
      char: chars[i % chars.length],
      size: sz(10) + Math.random() * sz(16),
      hue: Math.random()*360, hueSpeed: .1+Math.random()*.2,
      alpha: .03 + Math.random()*.06,
    });
  }
}

function updateAndDrawParticles(ctx) {
  for (const p of state.titleParticles) {
    p.x += p.vx; p.y += p.vy;
    if (p.x<-20) p.x = state.W+20; if (p.x>state.W+20) p.x = -20;
    if (p.y<-20) p.y = state.H+20; if (p.y>state.H+20) p.y = -20;
    p.hue = (p.hue + p.hueSpeed) % 360;

    // Cursor repulsion
    if (state.smoothX > -1000) {
      const dx = p.x-state.smoothX, dy = p.y-state.smoothY;
      const dist = Math.sqrt(dx*dx+dy*dy);
      if (dist < 200 && dist > 1) {
        const f = (200-dist)/200 * .5;
        p.vx += (dx/dist)*f; p.vy += (dy/dist)*f;
      }
    }
    p.vx *= .995; p.vy *= .995;

    ctx.font = p.size + 'px ' + FONT;
    ctx.fillStyle = `hsla(${p.hue}, 60%, 65%, ${p.alpha})`;
    ctx.textBaseline = 'middle'; ctx.textAlign = 'center';
    ctx.fillText(p.char, p.x, p.y);
  }
}

function renderTitlePretext() {
  const ctx = state.ctx, dpr = state.dpr;
  const W = state.W, H = state.H;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = '#050505';
  ctx.fillRect(0, 0, W, H);

  const now = performance.now();
  const t = now / 2500;

  // Glow
  const gx = W*.5+Math.sin(now/3000)*W*.1, gy = H*.3+Math.cos(now/2500)*H*.05;
  const hue = (now/30) % 360;
  const g = ctx.createRadialGradient(gx, gy, 0, gx, gy, W*.4);
  g.addColorStop(0, `hsla(${hue},80%,50%,.07)`);
  g.addColorStop(1, 'hsla(0,0%,0%,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

  // Cursor glow
  if (state.smoothX > -1000) {
    const cg = ctx.createRadialGradient(state.smoothX, state.smoothY, 0, state.smoothX, state.smoothY, 80);
    cg.addColorStop(0, `hsla(${hue},90%,70%,.08)`);
    cg.addColorStop(1, 'hsla(0,0%,0%,0)');
    ctx.fillStyle = cg;
    ctx.beginPath(); ctx.arc(state.smoothX, state.smoothY, 80, 0, Math.PI*2); ctx.fill();
  }

  // Particles
  updateAndDrawParticles(ctx);

  // "DOOM" title with Pretext wave displacement
  const titleText = 'D O O M';
  const titleSize = sz(88);
  const titleFont = mkFont(800, titleSize);
  const titleLh = Math.round(titleSize * 1.1);
  const baseW = Math.min(sz(600), W * 0.8);
  const titleY = H * 0.2;

  renderPretextBlock(ctx, titleText, titleFont, titleLh, (W-baseW)/2, titleY, baseW,
    (ly) => titleWaveDisplace(ly, baseW, t),
    (ly, i) => {
      const h = (now/25 + i*15) % 360;
      return `hsl(${h > 40 && h < 320 ? 0 : h}, 85%, ${50+Math.sin(now/500+i*.3)*15}%)`;
    }
  );

  // Subtitle with zigzag
  const subText = '── TEXT EDITION · POWERED BY PRETEXT ──';
  const subSize = sz(14);
  const subFont = mkFont(600, subSize);
  const subLh = Math.round(subSize * 1.4);
  renderPretextBlock(ctx, subText, subFont, subLh, (W-baseW)/2, titleY + titleLh * 1.8, baseW,
    (ly) => ({ x: Math.sin(t*1.5+ly/50)*sz(20), w: baseW * 0.7 }),
    () => `hsl(0,0%,${40+Math.sin(now/400)*10}%)`
  );

  // Tagline with circular flow
  const tagText = 'DOOM runs on everything. Even text. Every character is measured by Pretext — variable-width typography meets first-person shooting.';
  const tagSize = sz(13);
  const tagFont = mkFont(400, tagSize);
  const tagLh = Math.round(tagSize * 1.6);
  const circR = sz(100) + Math.sin(now/3000)*sz(10);
  const circCy = H * 0.55;
  renderPretextBlock(ctx, tagText, tagFont, tagLh, (W-baseW)/2, circCy - circR, baseW,
    (ly) => {
      const dy = ly - circCy;
      if (Math.abs(dy) > circR) return { x: 0, w: 0 };
      const chord = Math.sqrt(circR*circR - dy*dy) * 2;
      const cw = Math.min(chord, baseW * 0.8);
      return { x: (baseW - cw) / 2, w: Math.max(sz(30), cw) };
    },
    (ly, i) => { const h = (180+now/50+i*3)%360; return `hsl(${h},50%,55%)`; }
  );

  // Blinking prompt
  state.titleBlink += state.dt;
  if (Math.sin(state.titleBlink * 3) > 0) {
    ctx.font = mkFont(600, sz(16));
    ctx.fillStyle = '#ccc';
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.fillText('[ CLICK TO START ]', W/2, H * 0.82);
    ctx.textAlign = 'left';
  }

  // Controls
  ctx.font = mkFont(400, sz(11));
  ctx.fillStyle = '#444'; ctx.textAlign = 'center';
  ctx.fillText('WASD — Move    Mouse — Look    Click — Shoot', W/2, H * 0.88);
  ctx.fillText('Q/E — Rotate    Arrow Keys — Also work', W/2, H * 0.92);
  ctx.textAlign = 'left';
}

// ─── Wave displacement for title ────────────────────────────

function titleWaveDisplace(lineY, baseW, t) {
  const w1 = Math.sin(lineY / 60 + t) * 0.5 + 0.5;
  const w2 = Math.sin(lineY / 35 - t * 1.3) * 0.35 + 0.35;
  const wave = Math.min(1, w1 + w2 * 0.6);
  let indent = wave * sz(200);

  // Cursor interaction
  if (state.smoothX > -1000) {
    const dy = Math.abs(lineY - state.smoothY);
    if (dy < BUBBLE_R) {
      const p = 1 - dy / BUBBLE_R;
      indent = Math.max(indent, p * p * p * sz(250));
    }
  }

  const leftShare = wave * 0.4;
  return { x: indent * leftShare, w: Math.max(sz(40), baseW - indent) };
}

// ─── Generic Pretext Block Renderer ─────────────────────────

function renderPretextBlock(ctx, text, fontStr, lh, startX, startY, baseW, displaceFn, colorFn) {
  const prep = ptPrepare(text, fontStr);
  let offset = 0, y = startY, safety = 60, lineIdx = 0;

  while (offset < text.length && safety-- > 0) {
    const mid = y + lh * 0.5;
    const d = displaceFn(mid, baseW);
    if (d.w < sz(20)) { y += lh; continue; }

    let result;
    if (prep) {
      result = ptLayout(prep, offset, d.w, lh);
    }
    if (!result) {
      // Manual fallback
      ctx.font = fontStr;
      let end = offset, lastSp = -1;
      while (end < text.length) {
        if (text[end] === ' ') lastSp = end;
        if (ctx.measureText(text.slice(offset, end+1)).width > d.w && end > offset) {
          const bp = lastSp > offset ? lastSp : end;
          result = { text: text.slice(offset, bp).trimEnd(), next: text[bp]===' ' ? bp+1 : bp };
          break;
        }
        end++;
      }
      if (!result) result = { text: text.slice(offset).trimEnd(), next: text.length };
    }
    if (!result || result.next <= offset) break;

    ctx.font = fontStr;
    ctx.textBaseline = 'top';

    // Per-character rendering with variable color
    let drawX = startX + d.x;
    for (let i = 0; i < result.text.length; i++) {
      const ch = result.text[i];
      const color = typeof colorFn === 'function' ? colorFn(y, lineIdx * 20 + i) : colorFn;
      ctx.fillStyle = color;
      ctx.fillText(ch, drawX, y);
      drawX += ctx.measureText(ch).width;
    }

    offset = result.next;
    y += lh;
    lineIdx++;
  }
}

// ═══════════════════════════════════════════════════════════════
// Death & Victory Screens
// ═══════════════════════════════════════════════════════════════

function renderDeathPretext() {
  const ctx = state.ctx, dpr = state.dpr, W = state.W, H = state.H, now = performance.now();
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = '#0a0000'; ctx.fillRect(0, 0, W, H);

  // Red vignette
  const g = ctx.createRadialGradient(W/2,H/2,0,W/2,H/2,W*.6);
  g.addColorStop(0, 'hsla(0,50%,15%,.3)'); g.addColorStop(1, 'hsla(0,80%,5%,.8)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

  updateAndDrawParticles(ctx);

  // "YOU DIED" with scatter displacement
  const deathText = 'YOU DIED';
  const deathSize = sz(72);
  const deathFont = mkFont(800, deathSize);
  const baseW = sz(500);
  const t = now / 1000;

  renderPretextBlock(ctx, deathText, deathFont, deathSize * 1.1, (W-baseW)/2, H*0.3, baseW,
    (ly) => {
      const scatter = Math.sin(ly*0.1 + t*3) * sz(40) + Math.cos(ly*0.07 + t*2) * sz(20);
      return { x: scatter, w: baseW - Math.abs(scatter)*0.5 };
    },
    (ly, i) => `hsl(0, 90%, ${35 + Math.sin(now/200+i)*15}%)`
  );

  // Stats
  const statsText = `SCORE: ${state.score}  ·  KILLS: ${state.kills}`;
  ctx.font = mkFont(600, sz(16)); ctx.fillStyle = '#aaa'; ctx.textAlign = 'center';
  ctx.fillText(statsText, W/2, H*0.55); ctx.textAlign = 'left';

  state.titleBlink += state.dt;
  if (Math.sin(state.titleBlink*3) > 0) {
    ctx.font = mkFont(600, sz(14)); ctx.fillStyle = '#888'; ctx.textAlign = 'center';
    ctx.fillText('[ CLICK TO RESTART ]', W/2, H*0.65); ctx.textAlign = 'left';
  }
}

function renderVictoryPretext() {
  const ctx = state.ctx, dpr = state.dpr, W = state.W, H = state.H, now = performance.now();
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = '#050505'; ctx.fillRect(0, 0, W, H);

  // Green/gold glow
  const gx = W*.5, gy = H*.35;
  const g = ctx.createRadialGradient(gx,gy,0,gx,gy,W*.4);
  g.addColorStop(0, 'hsla(120,60%,40%,.06)'); g.addColorStop(1, 'hsla(0,0%,0%,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

  updateAndDrawParticles(ctx);
  state.victoryTimer += state.dt;

  // "LEVEL COMPLETE" with wave
  const titleText = 'LEVEL COMPLETE';
  const titleSize = sz(56);
  const baseW = sz(600);
  renderPretextBlock(ctx, titleText, mkFont(800, titleSize), titleSize*1.1, (W-baseW)/2, H*.2, baseW,
    (ly) => ({ x: Math.sin(now/2000+ly/40)*sz(15), w: baseW*.9 }),
    (ly, i) => { const h=(120+now/30+i*10)%360; return `hsl(${h},70%,${50+Math.sin(now/300+i*.5)*15}%)`; }
  );

  // Stats in circular layout via Pretext
  const statsText = `SCORE: ${state.score} · KILLS: ${state.kills}/${state.totalEnemies} · HEALTH: ${state.health} · AMMO: ${state.ammo} · Powered by Pretext`;
  const statsSize = sz(14);
  const circR = sz(90) + Math.sin(now/2000)*sz(8);
  const cy = H * 0.55;
  renderPretextBlock(ctx, statsText, mkFont(500, statsSize), statsSize*1.5, (W-baseW)/2, cy-circR, baseW,
    (ly) => {
      const dy = ly - cy;
      if (Math.abs(dy) > circR) return { x: 0, w: 0 };
      const chord = Math.sqrt(circR*circR-dy*dy)*2;
      return { x: (baseW-Math.min(chord,baseW*.8))/2, w: Math.max(sz(20), Math.min(chord,baseW*.8)) };
    },
    (ly, i) => { const h=(180+now/40+i*5)%360; return `hsl(${h},60%,65%)`; }
  );

  if (state.victoryTimer > 2) {
    const hasNext = state.level+1 < MAPS.length;
    const msg = hasNext ? '[ CLICK FOR NEXT LEVEL ]' : '[ YOU WIN — CLICK TO REPLAY ]';
    state.titleBlink += state.dt;
    if (Math.sin(state.titleBlink*3) > 0) {
      ctx.font = mkFont(600, sz(14)); ctx.fillStyle = '#ccc'; ctx.textAlign = 'center';
      ctx.fillText(msg, W/2, H*.85); ctx.textAlign = 'left';
    }
  }
}

// ═══════════════════════════════════════════════════════════════
// Game Logic (identical to base version)
// ═══════════════════════════════════════════════════════════════

function update(dt) {
  // Smooth cursor
  if (state.isHovering && state.mouseX > -1000) {
    state.smoothX += (state.mouseX - state.smoothX) * 0.1;
    state.smoothY += (state.mouseY - state.smoothY) * 0.1;
  } else { state.smoothX = -9999; state.smoothY = -9999; }

  if (state.screen !== 'game' || state.dead) return;
  const s = state;
  s.angle += s.mouseDX * CFG.MOUSE_SENS; s.mouseDX = 0;
  if (s.keys['ArrowLeft']||s.keys['q']) s.angle -= CFG.ROT_SPEED*dt;
  if (s.keys['ArrowRight']||s.keys['e']) s.angle += CFG.ROT_SPEED*dt;
  let mx=0,my=0; const cos=Math.cos(s.angle),sin=Math.sin(s.angle);
  if(s.keys['w']||s.keys['ArrowUp']){mx+=cos*CFG.MOVE_SPEED*dt;my+=sin*CFG.MOVE_SPEED*dt;}
  if(s.keys['s']||s.keys['ArrowDown']){mx-=cos*CFG.MOVE_SPEED*dt;my-=sin*CFG.MOVE_SPEED*dt;}
  if(s.keys['a']){mx+=sin*CFG.STRAFE_SPEED*dt;my-=cos*CFG.STRAFE_SPEED*dt;}
  if(s.keys['d']){mx-=sin*CFG.STRAFE_SPEED*dt;my+=cos*CFG.STRAFE_SPEED*dt;}
  const m=.2;
  if(!isWall(s.px+mx+Math.sign(mx)*m,s.py))s.px+=mx;
  if(!isWall(s.px,s.py+my+Math.sign(my)*m))s.py+=my;
  const moving=Math.abs(mx)+Math.abs(my)>.001;
  if(moving){s.bobPhase+=dt*8;s.bobAmount=Math.min(1.5,s.bobAmount+dt*6);}else s.bobAmount=Math.max(0,s.bobAmount-dt*4);
  s.shootCooldown=Math.max(0,s.shootCooldown-dt);
  s.shootTimer=Math.max(0,s.shootTimer-dt);
  s.damageFlash=Math.max(0,s.damageFlash-dt*3);
  s.screenShake=Math.max(0,s.screenShake-dt*8);
  s.recoil=Math.max(0,s.recoil-dt*8);
  if(s.shooting&&s.shootCooldown<=0&&s.ammo>0){shoot();s.shootCooldown=.4;s.shootTimer=.1;s.ammo--;s.recoil=1;sfxShoot();}
  updateEnemies(dt); updatePickups(); updateDeathParticles(dt);
  if(s.enemies.filter(e=>e.alive).length===0&&s.enemies.length>0){s.screen='victory';s.victoryTimer=0;}
}

function shoot() {
  const hit=castRay(state.angle);
  for(const e of state.enemies){
    if(!e.alive)continue;
    const dx=e.x-state.px,dy=e.y-state.py,dist=Math.sqrt(dx*dx+dy*dy);
    if(dist>hit.dist)continue;
    let a=Math.atan2(dy,dx)-state.angle;while(a<-Math.PI)a+=2*Math.PI;while(a>Math.PI)a-=2*Math.PI;
    if(Math.abs(a)<CFG.FOV/2&&Math.abs(a)<.15){
      e.health--;e.hitFlash=.15;sfxHit();
      if(e.health<=0){e.alive=false;state.score+=100;state.kills++;sfxEnemyDeath();spawnDP(e);}
      break;
    }
  }
}
function spawnDP(enemy) {
  const dx=enemy.x-state.px,dy=enemy.y-state.py;
  let a=Math.atan2(dy,dx)-state.angle;while(a<-Math.PI)a+=2*Math.PI;while(a>Math.PI)a-=2*Math.PI;
  const sc=(.5+a/CFG.FOV)*CFG.COLS,sr=CFG.ROWS/2,chars='Ψ*+×•░▒';
  for(let i=0;i<12;i++) state.deathParticles.push({r:sr+(Math.random()-.5)*4,c:sc+(Math.random()-.5)*6,
    vr:(Math.random()-.5)*15,vc:(Math.random()-.5)*20,char:chars[Math.floor(Math.random()*chars.length)],
    hue:enemy.color,life:.5+Math.random()*.5});
}
function updateDeathParticles(dt){for(let i=state.deathParticles.length-1;i>=0;i--){const p=state.deathParticles[i];p.r+=p.vr*dt;p.c+=p.vc*dt;p.vr+=15*dt;p.life-=dt*2;if(p.life<=0)state.deathParticles.splice(i,1);}}
function updateEnemies(dt){
  for(const e of state.enemies){if(!e.alive)continue;e.hitFlash=Math.max(0,e.hitFlash-dt);e.attackTimer+=dt;
    const dx=state.px-e.x,dy=state.py-e.y,dist=Math.sqrt(dx*dx+dy*dy);
    if(dist<12&&dist>1.5){const sp=e.speed*dt,nx=e.x+(dx/dist)*sp,ny=e.y+(dy/dist)*sp;if(!isWall(nx,e.y))e.x=nx;if(!isWall(e.x,ny))e.y=ny;}
    const cd=e.type==='demon'?2:e.type==='spectre'?1:1.5;
    if(dist<2.5&&e.attackTimer>cd){e.attackTimer=0;const dmg=e.damage[0]+Math.floor(Math.random()*(e.damage[1]-e.damage[0]));
      state.health-=dmg;state.damageFlash=1;state.screenShake=1;sfxDamage();
      if(state.health<=0){state.health=0;state.dead=true;state.screen='dead';}}
  }
}
function updatePickups(){for(const p of state.pickups){if(!p.active)continue;const dx=state.px-p.x,dy=state.py-p.y;
  if(Math.sqrt(dx*dx+dy*dy)<.6){p.active=false;if(p.type==='health')state.health=Math.min(100,state.health+25);else state.ammo+=12;state.score+=25;sfxPickup();}}}

// ═══════════════════════════════════════════════════════════════
// Main Loop
// ═══════════════════════════════════════════════════════════════

function gameLoop(ts) {
  requestAnimationFrame(gameLoop);
  if(!state.lastTime) state.lastTime = ts;
  state.dt = Math.min(.05, (ts-state.lastTime)/1000);
  state.lastTime = ts;
  state.frameCount++;
  state.fpsTimer += state.dt;
  if(state.fpsTimer >= 1){state.fps=state.frameCount;state.frameCount=0;state.fpsTimer=0;}

  update(state.dt);

  switch(state.screen) {
    case 'title': renderTitlePretext(); break;
    case 'game': fillSceneBuffer(); renderViewportPretext(); break;
    case 'dead': renderDeathPretext(); break;
    case 'victory': renderVictoryPretext(); break;
  }
}

// ═══════════════════════════════════════════════════════════════
// Input
// ═══════════════════════════════════════════════════════════════

function setupInput() {
  document.addEventListener('keydown', e => {
    state.keys[e.key.toLowerCase()] = true;
    if(e.key.startsWith('Arrow')) state.keys[e.key] = true;
    if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key)) e.preventDefault();
  });
  document.addEventListener('keyup', e => { state.keys[e.key.toLowerCase()]=false; if(e.key.startsWith('Arrow'))state.keys[e.key]=false; });

  state.canvas.addEventListener('click', () => {
    initAudio();
    if(state.screen==='title'){startGame();return;}
    if(state.screen==='dead'){resetGame(state.level);return;}
    if(state.screen==='victory'){advanceLevel();return;}
    if(!state.pointerLocked) try{state.canvas.requestPointerLock();}catch{}
  });

  document.addEventListener('pointerlockchange', () => { state.pointerLocked = document.pointerLockElement === state.canvas; });
  document.addEventListener('mousemove', e => {
    if(state.pointerLocked) state.mouseDX += e.movementX;
    else {
      const r = state.canvas.getBoundingClientRect();
      state.mouseX = e.clientX - r.left; state.mouseY = e.clientY - r.top;
      state.isHovering = true;
    }
  });
  state.canvas.addEventListener('mouseenter', () => { state.isHovering = true; });
  state.canvas.addEventListener('mouseleave', () => { state.isHovering = false; state.mouseX = -9999; state.mouseY = -9999; });
  state.canvas.addEventListener('mousedown', e => { if(state.screen==='game'&&e.button===0) state.shooting=true; });
  document.addEventListener('mouseup', e => { if(e.button===0)state.shooting=false; });
  window.addEventListener('resize', () => sizeCanvas());
}

// ═══════════════════════════════════════════════════════════════
// Game Flow
// ═══════════════════════════════════════════════════════════════

function startGame() { state.screen='game'; state.level=0; resetGame(0); try{state.canvas.requestPointerLock();}catch{} }
function resetGame(lvl) {
  parseMap(lvl); state.health=100;state.ammo=25;state.score=0;state.kills=0;
  state.dead=false;state.shooting=false;state.shootTimer=0;state.shootCooldown=0;
  state.bobPhase=0;state.bobAmount=0;state.damageFlash=0;state.screenShake=0;state.recoil=0;
  state.screen='game';state.titleBlink=0;
}
function advanceLevel() {
  if(state.level+1<MAPS.length) {
    const ps=state.score; state.level++; parseMap(state.level);
    state.health=Math.min(100,state.health+25);state.ammo+=10;state.score=ps;state.kills=0;
    state.dead=false;state.shooting=false;state.shootTimer=0;state.shootCooldown=0;
    state.bobPhase=0;state.bobAmount=0;state.damageFlash=0;state.screenShake=0;state.recoil=0;
    state.screen='game';state.titleBlink=0;try{state.canvas.requestPointerLock();}catch{}
  } else { state.level=0; resetGame(0); }
}

// ═══════════════════════════════════════════════════════════════
// Init
// ═══════════════════════════════════════════════════════════════

function sizeCanvas() {
  state.W=window.innerWidth;state.H=window.innerHeight;
  state.canvas.width=state.W*state.dpr;state.canvas.height=state.H*state.dpr;
}

async function init() {
  state.canvas=document.getElementById('canvas');
  state.ctx=state.canvas.getContext('2d');
  state.dpr=window.devicePixelRatio||1;
  sizeCanvas();
  state.charBuf=new Array(CFG.COLS*CFG.ROWS).fill(' ');
  state.colorBuf=new Array(CFG.COLS*CFG.ROWS).fill('#111');
  await document.fonts.ready;
  parseMap(0);
  initTitleParticles();
  setupInput();
  loadPretext();
  requestAnimationFrame(gameLoop);
}

init();
