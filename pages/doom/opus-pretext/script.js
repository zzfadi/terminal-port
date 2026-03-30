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

  // Ambient glow behind viewport
  const now = performance.now();
  const glowHue = (now / 50) % 360;
  const g = ctx.createRadialGradient(W*.5, H*.4, 0, W*.5, H*.4, W*.5);
  g.addColorStop(0, `hsla(${glowHue}, 40%, 20%, 0.04)`);
  g.addColorStop(1, 'hsla(0,0%,0%,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

  const fontSize = Math.max(8, Math.min(Math.floor(W / (cols * 0.65)), Math.floor((H * 0.88) / (rows * 1.1))));
  const lh = Math.round(fontSize * 1.1);
  const font = mkFont(400, fontSize);
  const baseMaxW = Math.min(W * 0.92, cols * fontSize * 0.62);
  const marginX = Math.max(10, (W - baseMaxW) / 2);
  const topMargin = sz(8);

  // Build row texts and color maps
  const rowTexts = [], rowColorMaps = [];
  for (let r = 0; r < rows; r++) {
    let rowStr = '';
    const colors = [];
    for (let c = 0; c < cols; c++) {
      rowStr += state.charBuf[r * cols + c];
      colors.push(state.colorBuf[r * cols + c]);
    }
    rowTexts.push(rowStr.replace(/\s+$/, ''));
    rowColorMaps.push(colors);
  }

  ctx.font = font;
  ctx.textBaseline = 'top';

  for (let r = 0; r < rows; r++) {
    const text = rowTexts[r];
    if (!text || text.trim().length === 0) continue;

    const lineY = topMargin + r * lh;
    const d = gameViewportDisplace(lineY, r, rows, baseMaxW, now);
    if (d.w < 15) continue;

    // Render row: one Pretext-prepared layout per row, no sub-line wrapping
    let drawX = marginX + d.x;
    const drawY = lineY;

    // Color-batch the row for performance (group consecutive same-color chars)
    let batchStart = 0;
    let prevColor = rowColorMaps[r][0] || '#333';

    for (let i = 0; i <= text.length; i++) {
      const color = i < text.length ? (rowColorMaps[r][i] || '#333') : null;

      if (color !== prevColor || i === text.length) {
        // Flush batch
        if (batchStart < i) {
          const batch = text.slice(batchStart, i);
          const batchW = ctx.measureText(batch).width;
          if (drawX + batchW > marginX + d.x + d.w + 5) {
            // Clip to available width
            ctx.fillStyle = prevColor;
            ctx.save();
            ctx.beginPath();
            ctx.rect(marginX + d.x - 2, drawY - 1, d.w + 4, lh + 2);
            ctx.clip();
            ctx.fillText(batch, drawX, drawY);
            ctx.restore();
            break;
          }
          ctx.fillStyle = prevColor;
          ctx.fillText(batch, drawX, drawY);
          drawX += batchW;
        }
        prevColor = color;
        batchStart = i;
      }
    }
  }

  // Overlays
  renderWeaponOverlay(ctx, fontSize, lh, marginX, baseMaxW, now);
  renderHUDPretext(ctx, fontSize, lh, W, H);
  renderMinimapCanvas(ctx, W, H);
  if (state.shootTimer > 0) renderMuzzleFlashCanvas(ctx, W, H);
  if (state.damageFlash > 0) renderDamageGlow(ctx, W, H);
}

// ─── Game Viewport Displacement ─────────────────────────────
// This is where Pretext shines: per-line variable width creates
// organic text flow around game UI elements.

function gameViewportDisplace(lineY, row, totalRows, baseW, now) {
  let x = 0, w = baseW;
  const t = now / 2000;

  // Breathing wave — left edge undulates organically
  const wave1 = Math.sin(t * 0.8 + row * 0.12) * sz(25);
  const wave2 = Math.sin(t * 1.3 - row * 0.08) * sz(12);
  const breathe = wave1 + wave2;
  x += Math.max(0, breathe);
  w -= Math.abs(breathe) * 0.7;

  // Minimap exclusion — smooth elliptical curve, not hard cutoff
  const mmCenterRow = totalRows * 0.2;
  const mmRadiusR = totalRows * 0.3;
  const mmDist = (row - mmCenterRow) / mmRadiusR;
  if (mmDist < 1 && mmDist > -1) {
    // Elliptical: more shrink at center, smoothly fades at edges
    const curve = Math.sqrt(1 - mmDist * mmDist);
    const shrink = curve * (sz(140) + Math.sin(t * 1.5 + row * 0.15) * sz(8));
    w -= shrink;
  }

  // Weapon zone — smooth parabolic indent from bottom-center
  const weaponStart = totalRows * 0.75;
  if (row > weaponStart) {
    const p = (row - weaponStart) / (totalRows - weaponStart);
    const indent = p * p * sz(60);
    // Center the narrowing with slight wave
    const sway = Math.sin(t * 2 + p * 3) * indent * 0.15;
    x += indent * 0.25 + sway;
    w -= indent * 0.5;
  }

  // Damage scatter — dramatic text reflow on hit
  if (state.damageFlash > 0) {
    const df = state.damageFlash;
    const scatter = Math.sin(row * 0.6 + now / 60) * df * sz(40);
    const jitter = Math.cos(row * 1.1 + now / 40) * df * sz(15);
    x += scatter;
    w += jitter; // Width fluctuates
  }

  // Shoot recoil — vertical compression wave
  if (state.recoil > 0) {
    x += Math.sin(row * 0.4 + now / 40) * state.recoil * sz(12);
  }

  // Cursor interaction — bubble pushes text
  if (state.smoothX > -1000 && state.screen === 'game') {
    const dy = Math.abs(lineY - state.smoothY);
    if (dy < BUBBLE_R) {
      const p = 1 - dy / BUBBLE_R;
      const push = p * p * p * sz(50);
      const bias = (state.smoothX - state.W / 2) / (baseW / 2);
      x += push * Math.max(0, 0.5 - bias * 0.4);
      w -= push * 0.6;
    }
  }

  return { x, w: Math.max(sz(25), w) };
}

// ─── Weapon Overlay (Pretext text block) ────────────────────

function renderWeaponOverlay(ctx, fontSize, lh, marginX, baseW, now) {
  const bob = Math.sin(state.bobPhase * 2) * state.bobAmount * 2;
  const recoilY = state.recoil * -12;
  const weaponSize = Math.round(fontSize * 1.4);
  const weaponFont = mkFont(600, weaponSize);
  const weaponLh = Math.round(weaponSize * 1.05);

  const wx = state.W * 0.47;
  const wy = state.H * 0.76 + bob + recoilY;

  const weapon = ['  ║║  ', ' ╔╩╩╗ ', ' ║██║ ', ' ╚══╝ '];
  ctx.font = weaponFont;
  ctx.textBaseline = 'top';

  // Weapon glow
  const glow = ctx.createRadialGradient(wx + weaponSize, wy + weaponSize * 2, 0, wx + weaponSize, wy + weaponSize * 2, weaponSize * 3);
  glow.addColorStop(0, 'hsla(35, 30%, 40%, 0.06)');
  glow.addColorStop(1, 'hsla(0,0%,0%,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(wx - weaponSize * 2, wy - weaponSize, weaponSize * 6, weaponSize * 5);

  for (let i = 0; i < weapon.length; i++) {
    const sway = Math.sin(now / 800 + i * 0.5) * 1;
    ctx.fillStyle = `hsl(35, ${15 + i * 5}%, ${48 + Math.sin(now / 500 + i) * 8}%)`;
    ctx.fillText(weapon[i], wx + sway, wy + i * weaponLh);
  }
}

// ─── HUD as Pretext Text Block ──────────────────────────────

function renderHUDPretext(ctx, fontSize, lh, W, H) {
  const hudFont = mkFont(600, Math.round(fontSize * 0.9));
  const hudY = H - lh * 1.6;

  // Gradient separator line
  const grad = ctx.createLinearGradient(W * 0.1, 0, W * 0.9, 0);
  grad.addColorStop(0, 'transparent');
  grad.addColorStop(0.2, '#333');
  grad.addColorStop(0.8, '#333');
  grad.addColorStop(1, 'transparent');
  ctx.strokeStyle = grad; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(W*0.1, hudY - 6); ctx.lineTo(W*0.9, hudY - 6); ctx.stroke();

  // Build HUD segments with individual colors
  const segments = [
    { text: '♥ ' + state.health, color: state.health > 30 ? 'hsl(120,80%,55%)' : 'hsl(0,90%,60%)' },
    { text: '  ◆ ' + state.ammo, color: 'hsl(50,80%,60%)' },
    { text: '  LVL ' + (state.level + 1), color: 'hsl(200,60%,55%)' },
    { text: '  ·  ', color: '#333' },
    { text: 'SCORE: ' + state.score, color: '#aaa' },
    { text: '  ·  ', color: '#333' },
    { text: 'KILLS: ' + state.kills + '/' + state.totalEnemies, color: '#888' },
    { text: '  ·  ', color: '#333' },
    { text: state.fps + 'fps', color: '#555' },
  ];

  ctx.font = hudFont; ctx.textBaseline = 'top';
  const fullText = segments.map(s => s.text).join('');
  const fullW = ctx.measureText(fullText).width;
  let drawX = (W - fullW) / 2;

  for (const seg of segments) {
    ctx.fillStyle = seg.color;
    ctx.fillText(seg.text, drawX, hudY);
    drawX += ctx.measureText(seg.text).width;
  }
}

// ─── Minimap (canvas drawing) ───────────────────────────────

function renderMinimapCanvas(ctx, W, H) {
  const mmW = Math.min(state.mapW, 20), mmH = Math.min(state.mapH, 16);
  const cellSz = sz(8);
  const totalW = mmW * cellSz, totalH = mmH * cellSz;
  const ox = W - totalW - sz(12), oy = sz(10);
  const camX = Math.floor(state.px) - Math.floor(mmW/2), camY = Math.floor(state.py) - Math.floor(mmH/2);

  // Background with rounded corners
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.lineWidth = 1;
  const pad = 4;
  ctx.beginPath();
  ctx.roundRect(ox-pad, oy-pad, totalW+pad*2, totalH+pad*2, 4);
  ctx.fill(); ctx.stroke();

  for (let r = 0; r < mmH; r++) {
    for (let c = 0; c < mmW; c++) {
      const mx = camX+c, my = camY+r;
      if (mx<0||my<0||mx>=state.mapW||my>=state.mapH) continue;
      const tile = state.map[my][mx];
      if (tile > 0) {
        ctx.fillStyle = tile===4 ? 'hsl(40,40%,25%)' : tile===2 ? 'hsl(15,30%,25%)' : tile===3 ? 'hsl(200,30%,25%)' : 'hsl(220,15%,30%)';
        ctx.fillRect(ox+c*cellSz, oy+r*cellSz, cellSz-1, cellSz-1);
      } else {
        ctx.fillStyle = 'rgba(255,255,255,0.02)';
        ctx.fillRect(ox+c*cellSz, oy+r*cellSz, cellSz-1, cellSz-1);
      }
    }
  }

  // Player — green dot with direction
  const px = ox + (state.px-camX)*cellSz, py = oy + (state.py-camY)*cellSz;
  ctx.fillStyle = '#0f0'; ctx.shadowColor = '#0f0'; ctx.shadowBlur = 6;
  ctx.beginPath(); ctx.arc(px, py, cellSz*0.35, 0, Math.PI*2); ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = '#0f0'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(px, py);
  ctx.lineTo(px+Math.cos(state.angle)*cellSz*2, py+Math.sin(state.angle)*cellSz*2);
  ctx.stroke();

  // FOV cone
  ctx.strokeStyle = 'rgba(0,255,0,0.15)'; ctx.lineWidth = 1;
  const fovDist = cellSz * 4;
  ctx.beginPath(); ctx.moveTo(px, py);
  ctx.lineTo(px+Math.cos(state.angle-CFG.FOV/2)*fovDist, py+Math.sin(state.angle-CFG.FOV/2)*fovDist);
  ctx.moveTo(px, py);
  ctx.lineTo(px+Math.cos(state.angle+CFG.FOV/2)*fovDist, py+Math.sin(state.angle+CFG.FOV/2)*fovDist);
  ctx.stroke();

  // Enemies — color-coded with glow
  for (const e of state.enemies) {
    if (!e.alive) continue;
    const ec = ox+(e.x-camX)*cellSz, er = oy+(e.y-camY)*cellSz;
    if (ec < ox-5 || ec > ox+totalW+5 || er < oy-5 || er > oy+totalH+5) continue;
    const col = e.type==='demon'?'#c4f':e.type==='spectre'?'#4cf':'#f44';
    ctx.fillStyle = col; ctx.shadowColor = col; ctx.shadowBlur = 4;
    ctx.beginPath(); ctx.arc(ec, er, cellSz*0.25, 0, Math.PI*2); ctx.fill();
  }
  ctx.shadowBlur = 0;

  // Pickups
  for (const p of state.pickups) {
    if (!p.active) continue;
    const pc = ox+(p.x-camX)*cellSz, pr = oy+(p.y-camY)*cellSz;
    if (pc < ox-5 || pc > ox+totalW+5 || pr < oy-5 || pr > oy+totalH+5) continue;
    ctx.fillStyle = p.type==='health'?'#4f4':'#ff4';
    ctx.fillRect(pc-2, pr-2, 4, 4);
  }
}

// ─── Muzzle Flash (canvas overlay) ──────────────────────────

function renderMuzzleFlashCanvas(ctx, W, H) {
  const cx = W * 0.48, cy = H * 0.52;
  const intensity = state.shootTimer / 0.1;
  const r = intensity * sz(50);
  // Double flash — bright core + wide glow
  const g1 = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 0.3);
  g1.addColorStop(0, `hsla(45, 100%, 90%, ${intensity * 0.6})`);
  g1.addColorStop(1, `hsla(40, 100%, 60%, 0)`);
  ctx.fillStyle = g1;
  ctx.beginPath(); ctx.arc(cx, cy, r * 0.3, 0, Math.PI*2); ctx.fill();
  const g2 = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
  g2.addColorStop(0, `hsla(30, 100%, 60%, ${intensity * 0.15})`);
  g2.addColorStop(1, 'hsla(30, 100%, 50%, 0)');
  ctx.fillStyle = g2;
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2); ctx.fill();
}

function renderDamageGlow(ctx, W, H) {
  const a = state.damageFlash;
  // Heavy red vignette
  const g = ctx.createRadialGradient(W/2, H/2, W*0.2, W/2, H/2, W*0.65);
  g.addColorStop(0, 'hsla(0, 0%, 0%, 0)');
  g.addColorStop(0.7, `hsla(0, 70%, 20%, ${a * 0.15})`);
  g.addColorStop(1, `hsla(0, 80%, 15%, ${a * 0.5})`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  // Red flash on edges
  ctx.fillStyle = `hsla(0, 90%, 40%, ${a * 0.08})`;
  ctx.fillRect(0, 0, W * 0.03, H); ctx.fillRect(W * 0.97, 0, W * 0.03, H);
  ctx.fillRect(0, 0, W, H * 0.03); ctx.fillRect(0, H * 0.97, W, H * 0.03);
}

// ═══════════════════════════════════════════════════════════════
// Title Screen (Full Pretext: wave + particles + cursor)
// ═══════════════════════════════════════════════════════════════

function initTitleParticles() {
  state.titleParticles = [];
  const chars = 'DOOM█▓▒░ΨΩΦ×+◊•╬═║';
  for (let i = 0; i < 80; i++) {
    state.titleParticles.push({
      x: Math.random() * state.W, y: Math.random() * state.H,
      vx: (Math.random()-.5)*.5, vy: (Math.random()-.5)*.4,
      char: chars[i % chars.length],
      size: sz(10) + Math.random() * sz(22),
      hue: Math.random()*360, hueSpeed: .08+Math.random()*.25,
      alpha: .04 + Math.random()*.1,
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

  // "DOOM" title — render directly at large size, no wrapping
  const titleText = 'D O O M';
  const titleSize = sz(90);
  const titleFont = mkFont(800, titleSize);
  const titleY = H * 0.18;
  const baseW = Math.min(sz(700), W * 0.85);

  // Per-character title rendering with wave offset
  ctx.font = titleFont; ctx.textBaseline = 'top';
  const titleW = ctx.measureText(titleText).width;
  const titleStartX = (W - titleW) / 2;
  let tx = titleStartX;
  for (let i = 0; i < titleText.length; i++) {
    const ch = titleText[i];
    const waveY = Math.sin(t * 1.2 + i * 0.8) * sz(8);
    const h = (now / 25 + i * 25) % 360;
    ctx.fillStyle = `hsl(${h > 40 && h < 320 ? 0 : h}, 85%, ${50 + Math.sin(now/400+i*.5)*12}%)`;
    ctx.fillText(ch, tx, titleY + waveY);
    tx += ctx.measureText(ch).width;
  }

  // Subtitle with wave displacement
  const subText = '── TEXT EDITION · POWERED BY PRETEXT ──';
  const subSize = sz(13);
  const subFont = mkFont(600, subSize);
  const subY = titleY + titleSize * 1.3;
  ctx.font = subFont;
  const subW = ctx.measureText(subText).width;
  let sx = (W - subW) / 2;
  for (let i = 0; i < subText.length; i++) {
    const wOff = Math.sin(t * 1.5 + i * 0.2) * sz(3);
    ctx.fillStyle = `hsl(0,0%,${38 + Math.sin(now/300+i*0.3)*12}%)`;
    ctx.fillText(subText[i], sx + wOff, subY);
    sx += ctx.measureText(subText[i]).width;
  }

  // Tagline in circular flow — Pretext displacement
  const tagText = 'DOOM runs on everything. Even text. Every character is measured and laid out by Pretext. Variable-width typography meets first-person shooting. The viewport is flowing text.';
  const tagSize = sz(12);
  const tagFont = mkFont(400, tagSize);
  const tagLh = Math.round(tagSize * 1.55);
  const circR = sz(90) + Math.sin(now / 2500) * sz(8);
  const circCy = H * 0.56;
  renderPretextBlock(ctx, tagText, tagFont, tagLh, (W-baseW)/2, circCy - circR, baseW,
    (ly) => {
      const dy = ly - circCy;
      if (Math.abs(dy) > circR) return { x: 0, w: 0 };
      const chord = Math.sqrt(circR * circR - dy * dy) * 2;
      const cw = Math.min(chord, baseW * 0.75);
      return { x: (baseW - cw) / 2 + Math.sin(t + dy * 0.03) * sz(5), w: Math.max(sz(25), cw) };
    },
    (ly, i) => { const h = (200 + now/40 + i*4) % 360; return `hsl(${h}, 55%, ${50+Math.sin(now/500+i*.2)*10}%)`; }
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
