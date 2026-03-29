// ═══════════════════════════════════════════════════════
// Liquid Typography — Full-page Pretext canvas experience
// Floating character particles · gradient text · circular
// skills · variable-width layout at 60fps
// ═══════════════════════════════════════════════════════

const FONT = 'Syne';
const BUBBLE_R = 220;
const NUM_PARTICLES = 90;

// ─── Content ─────────────────────────────────────────

const HERO = [
  { key: 'name', text: 'Fadi Al Zuabi', sizeRatio: 1, weight: 800, lh: 1.05, gap: 0.18 },
  { key: 'role', text: 'Firmware Engineer. AI Champion. Builder.', sizeRatio: 0.3, weight: 500, lh: 1.35, gap: 0.4 },
  { key: 'bio', text: "I'm a firmware engineer who builds AI systems. UIUC grad, worked at GE Aerospace and Intel, now at Solidigm where I train engineers on AI tools and build systems that make firmware development smarter.", sizeRatio: 0.19, weight: 400, lh: 1.7, gap: 0 },
];

const CAREER = [
  { title: 'Solidigm — Senior Firmware Engineer & AI Champion', date: '2022–Present', desc: 'Leading AI adoption, 70% Copilot usage increase, trained 60+ engineers. GEN5 PCIe SSD tech lead. AI debug agent with DataIku, Snowflake, GNN.' },
  { title: 'Intel — Firmware Engineer, NAND Storage', date: '2021–2022', desc: 'SSD firmware. Flash management, NVMe protocols, PCIe Gen4/Gen5.' },
  { title: 'GE Aerospace — Embedded Software Engineer', date: '2019–2021', desc: 'First 4G-LTE in aviation. CI/CD: 80–90% runtime reduction, $30k+ saved.' },
  { title: 'UIUC — B.S. Electrical Engineering', date: '2019', desc: 'Embedded Systems & Digital Design.' },
];

const SKILLS_TEXT = 'C/C++ · NVMe · PCIe Gen5 · RTOS · ARM · Xtensa · Linux Kernel · LLM Integration · Prompt Engineering · RAG Systems · GNN · Python · TypeScript · React · GCP · Firebase · DataIku · Snowflake · Vertex AI · DO-178C · MISRA C · NAND Flash · Leadership · Training · AI Adoption';

const PARTICLE_SOURCE = 'FIRMWARE AI DEBUG CODE SHIP BUILD SIGNAL FLASH NVMe PCIe ARM GNN ADOPT TRAIN LEAD';

// ─── State ───────────────────────────────────────────

let pt = null, canvas, ctx, dpr;
let W = 0, H = 0;
let mouseX = -9999, mouseY = -9999;
let smoothX = -9999, smoothY = -9999;
let isHovering = false, lastMouse = 0, hintGone = false;
let scrollY = 0, prevScrollY = 0;
let prep = {};
let particles = [];

// ─── Responsive sizing ──────────────────────────────

function sz(base) {
  if (W < 500) return Math.round(base * 0.5);
  if (W < 800) return Math.round(base * 0.7);
  return Math.round(base);
}

function margin() { return W < 500 ? 20 : W < 800 ? 32 : Math.round(W * 0.1); }
function baseMaxW() { return Math.min(sz(780), W - margin() * 2); }

// ═══════════════════════════════════════════════════════
// Init
// ═══════════════════════════════════════════════════════

async function init() {
  canvas = document.getElementById('canvas');
  ctx = canvas.getContext('2d');
  dpr = window.devicePixelRatio || 1;

  const isTouch = 'ontouchstart' in window;
  if (isTouch) document.getElementById('hint-text').textContent = 'scroll';

  const [, loaded] = await Promise.all([document.fonts.ready, loadPretext()]);
  sizeCanvas();
  initParticles();
  if (loaded) prepareAll();

  canvas.addEventListener('mouseenter', () => { isHovering = true; });
  canvas.addEventListener('mousemove', (e) => {
    const r = canvas.getBoundingClientRect();
    mouseX = e.clientX - r.left; mouseY = e.clientY - r.top;
    lastMouse = performance.now(); hideHint();
  });
  canvas.addEventListener('mouseleave', () => { isHovering = false; mouseX = -9999; mouseY = -9999; });

  canvas.addEventListener('touchmove', (e) => {
    const t = e.touches[0], r = canvas.getBoundingClientRect();
    mouseX = t.clientX - r.left; mouseY = t.clientY - r.top;
    isHovering = true; lastMouse = performance.now(); hideHint();
  }, { passive: true });
  canvas.addEventListener('touchend', () => { isHovering = false; mouseX = -9999; mouseY = -9999; });

  window.addEventListener('scroll', () => { scrollY = window.scrollY; }, { passive: true });
  window.addEventListener('resize', () => { sizeCanvas(); initParticles(); if (pt) prepareAll(); });

  loop();
}

function hideHint() {
  if (!hintGone) { hintGone = true; document.getElementById('hint').classList.add('hidden'); }
}

// ═══════════════════════════════════════════════════════
// Floating Character Particles
// ═══════════════════════════════════════════════════════

function initParticles() {
  particles = [];
  const chars = PARTICLE_SOURCE.replace(/ /g, '');
  for (let i = 0; i < NUM_PARTICLES; i++) {
    particles.push({
      x: Math.random() * W,
      y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      char: chars[i % chars.length],
      size: sz(10) + Math.random() * sz(18),
      alpha: 0.025 + Math.random() * 0.055,
      hue: Math.random() * 360,
      hueSpeed: 0.05 + Math.random() * 0.15,
    });
  }
}

function updateParticles() {
  for (const p of particles) {
    p.x += p.vx;
    p.y += p.vy;

    // Wrap
    if (p.x < -30) p.x = W + 30;
    if (p.x > W + 30) p.x = -30;
    if (p.y < -30) p.y = H + 30;
    if (p.y > H + 30) p.y = -30;

    // Cursor repulsion
    if (smoothX > -1000) {
      const dx = p.x - smoothX, dy = p.y - smoothY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 250 && dist > 1) {
        const force = (250 - dist) / 250 * 0.6;
        p.vx += (dx / dist) * force;
        p.vy += (dy / dist) * force;
      }
    }

    // Gentle drift toward center (prevents all particles drifting off-screen)
    p.vx += (W / 2 - p.x) * 0.00003;
    p.vy += (H / 2 - p.y) * 0.00003;

    // Damping
    p.vx *= 0.995;
    p.vy *= 0.995;

    // Color drift
    p.hue = (p.hue + p.hueSpeed) % 360;
  }
}

function drawParticles() {
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';
  for (const p of particles) {
    ctx.font = p.size + 'px ' + FONT;
    ctx.fillStyle = 'hsla(' + p.hue + ', 60%, 65%, ' + p.alpha + ')';
    ctx.fillText(p.char, p.x, p.y);
  }
}

// ═══════════════════════════════════════════════════════
// Pretext
// ═══════════════════════════════════════════════════════

async function loadPretext() {
  try { pt = await import('https://esm.sh/pretext@0.3.0'); return true; }
  catch (e) { console.warn('Pretext unavailable:', e); return false; }
}

function mkFont(weight, size) { return weight + ' ' + size + 'px ' + FONT; }

function prepareAll() {
  const fn = pt.prepareWithSegments || pt.prepare;
  if (!fn) return;

  for (const b of HERO) {
    const size = Math.round(sz(88) * b.sizeRatio);
    try { prep[b.key] = fn(b.text, mkFont(b.weight, size)); } catch {}
  }

  CAREER.forEach((c, i) => {
    try {
      prep['ct' + i] = fn(c.title, mkFont(600, sz(16)));
      prep['cd' + i] = fn(c.desc, mkFont(400, sz(14)));
    } catch {}
  });

  try { prep.skills = fn(SKILLS_TEXT, mkFont(500, sz(18))); } catch {}
}

function sizeCanvas() {
  W = window.innerWidth; H = window.innerHeight;
  canvas.width = W * dpr; canvas.height = H * dpr;
}

// ═══════════════════════════════════════════════════════
// Render Loop
// ═══════════════════════════════════════════════════════

function loop() {
  requestAnimationFrame(loop);

  if (isHovering && mouseX > -1000) {
    smoothX += (mouseX - smoothX) * 0.1;
    smoothY += (mouseY - smoothY) * 0.1;
  } else {
    smoothX = -9999; smoothY = -9999;
  }

  updateParticles();
  render();
  prevScrollY = scrollY;
}

function render() {
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#050505';
  ctx.fillRect(0, 0, W, H);

  const vh = H;

  // Section visibility
  const heroA   = clamp(1 - scrollY / (vh * 0.6));
  const careerT = clamp((scrollY - vh * 0.5) / (vh * 1.2));
  const careerA = careerT < 0.08 ? careerT / 0.08 : careerT > 0.85 ? clamp((1 - careerT) / 0.15) : 1;
  const skillsT = clamp((scrollY - vh * 1.8) / (vh * 1.2));
  const skillsA = skillsT < 0.08 ? skillsT / 0.08 : skillsT > 0.85 ? clamp((1 - skillsT) / 0.15) : 1;

  // Background particles (always visible)
  drawParticles();

  // Sections
  if (heroA > 0.01) { ctx.globalAlpha = heroA; drawGlow(); renderHero(); }
  if (careerA > 0.01 && careerT > 0) { ctx.globalAlpha = careerA; renderCareer(careerT); }
  if (skillsA > 0.01 && skillsT > 0) { ctx.globalAlpha = skillsA; renderSkills(skillsT); }
  ctx.globalAlpha = 1;
}

// ═══════════════════════════════════════════════════════
// Color helpers
// ═══════════════════════════════════════════════════════

function heroColor(lineY) {
  // Violet → blue → cyan gradient based on Y position
  const hue = 260 - (lineY / H) * 80; // 260 → 180
  return 'hsl(' + hue + ', 75%, 85%)';
}

function careerTitleColor(lineY) {
  const hue = 35 + (lineY / H) * 20; // warm orange-gold
  return 'hsl(' + hue + ', 80%, 78%)';
}

function careerDescColor() {
  return 'hsl(35, 30%, 60%)';
}

function skillsColor(lineY) {
  const now = performance.now();
  const hue = (180 + (lineY / H) * 60 + now / 50) % 360; // shifting cyan-spectrum
  return 'hsl(' + hue + ', 70%, 75%)';
}

// ═══════════════════════════════════════════════════════
// Hero Section — sinusoidal wave + cursor displacement
// ═══════════════════════════════════════════════════════

function renderHero() {
  const m = margin(), maxW = baseMaxW();
  let y = H * 0.18;

  for (const b of HERO) {
    const size = Math.round(sz(88) * b.sizeRatio);
    const f = mkFont(b.weight, size);
    const lh = Math.round(size * b.lh);
    renderBlock(b.text, b.key, f, lh, m, y, maxW, heroDisplace, heroColor);
    y += renderBlock.lastHeight + Math.round(size * b.gap);
  }
}

function heroDisplace(lineY, baseMaxW) {
  const now = performance.now();
  const t = now / 2500;

  const w1 = Math.sin(lineY / 80 + t) * 0.5 + 0.5;
  const w2 = Math.sin(lineY / 45 - t * 1.3) * 0.35 + 0.35;
  const wave = Math.min(1, w1 + w2 * 0.6);
  let waveIndent = wave * sz(320);

  let cursorIndent = 0, cursorBias = 0;
  if (smoothX > -1000) {
    const dy = Math.abs(lineY - smoothY);
    if (dy < BUBBLE_R) {
      const p = 1 - dy / BUBBLE_R;
      cursorIndent = p * p * p * sz(340);
      cursorBias = Math.max(-1, Math.min(1, (smoothX - W / 2) / (baseMaxW / 2)));
    }
  }

  const indent = Math.max(waveIndent, cursorIndent);
  const leftShare = cursorIndent > waveIndent ? Math.max(0, 0.5 - cursorBias * 0.4) : wave * 0.4;
  return { x: indent * leftShare, w: Math.max(sz(60), baseMaxW - indent) };
}

// ═══════════════════════════════════════════════════════
// Career Section — zigzag wave with warm colors
// ═══════════════════════════════════════════════════════

function renderCareer(progress) {
  const m = margin(), maxW = baseMaxW();
  const titleSize = sz(16), descSize = sz(14);
  const titleFont = mkFont(600, titleSize);
  const dateFont = mkFont(500, sz(11));
  const descFont = mkFont(400, descSize);
  const titleLh = Math.round(titleSize * 1.35);
  const descLh = Math.round(descSize * 1.7);

  drawLabel('CAREER', m, 36);

  let y = 64;
  const revealedEntries = Math.ceil(progress * (CAREER.length + 1));

  CAREER.forEach((c, i) => {
    if (i >= revealedEntries) return;
    const entryAlpha = Math.min(1, (revealedEntries - i) * 0.8);
    ctx.globalAlpha *= entryAlpha;

    // Date
    ctx.font = dateFont;
    ctx.fillStyle = 'hsl(35, 40%, 35%)';
    ctx.textBaseline = 'alphabetic';
    ctx.textAlign = 'left';
    ctx.fillText(c.date, m, y + sz(10) * 0.78);
    y += sz(18);

    // Title
    renderBlock(c.title, 'ct' + i, titleFont, titleLh, m, y, maxW,
      (ly) => zigzagDisplace(ly, maxW, i), careerTitleColor);
    y += renderBlock.lastHeight + 6;

    // Description
    renderBlock(c.desc, 'cd' + i, descFont, descLh, m, y, maxW,
      (ly) => zigzagDisplace(ly, maxW, i), careerDescColor);
    y += renderBlock.lastHeight + sz(32);

    ctx.globalAlpha /= entryAlpha;
  });
}

function zigzagDisplace(lineY, baseMaxW, seed) {
  const now = performance.now();
  const t = now / 3000 + seed * 1.5;
  const period = 100;
  const phase = ((lineY / period + t) % 1 + 1) % 1;
  const tri = phase < 0.5 ? phase * 2 : 2 - phase * 2;
  const indent = tri * sz(200);
  return { x: indent, w: Math.max(sz(80), baseMaxW - indent * 0.4) };
}

// ═══════════════════════════════════════════════════════
// Skills Section — circular text with shifting colors
// ═══════════════════════════════════════════════════════

function renderSkills(progress) {
  const maxW = baseMaxW();
  const font = mkFont(500, sz(18));
  const lh = Math.round(sz(18) * 1.6);

  drawLabel('SKILLS', margin(), 36);

  const cy = H / 2;
  const maxRadius = Math.min(sz(240), (H - 120) / 2, (W - 40) / 2);
  const radius = maxRadius * Math.min(1, progress * 2.5);
  const pulse = Math.sin(performance.now() / 3000) * sz(15);
  const r = radius + pulse;

  renderBlock(SKILLS_TEXT, 'skills', font, lh, 0, cy - r, maxW,
    (lineY) => circleDisplace(lineY, cy, r, maxW), skillsColor);
}

function circleDisplace(lineY, centerY, radius, baseMaxW) {
  const dy = lineY - centerY;
  if (Math.abs(dy) > radius) return { x: 0, w: 0 };
  const halfChord = Math.sqrt(radius * radius - dy * dy);
  const chordW = Math.min(halfChord * 2, baseMaxW);
  const xShift = (baseMaxW - chordW) / 2 + margin();
  return { x: xShift, w: Math.max(sz(40), chordW) };
}

// ═══════════════════════════════════════════════════════
// Generic text block renderer
// ═══════════════════════════════════════════════════════

renderBlock.lastHeight = 0;

function renderBlock(text, prepKey, fontStr, lh, startX, startY, bMaxW, displaceFn, colorFn) {
  let offset = 0, y = startY, safety = 120, lineIdx = 0;

  while (offset < text.length && safety-- > 0) {
    const mid = y + lh * 0.5;
    const d = displaceFn(mid, bMaxW);

    if (d.w < sz(30)) {
      y += lh;
      if (y > H + lh) break;
      continue;
    }

    const result = layoutLine(text, prepKey, offset, fontStr, d.w, lh);
    if (!result || result.next <= offset) break;

    ctx.font = fontStr;
    ctx.textBaseline = 'alphabetic';
    ctx.textAlign = 'left';

    // Per-line color or default
    if (colorFn) {
      const c = typeof colorFn === 'function' ? colorFn(y, lineIdx) : colorFn;
      ctx.fillStyle = c;
    }

    ctx.fillText(result.text, startX + d.x, y + lh * 0.78);

    offset = result.next;
    y += lh;
    lineIdx++;
  }

  renderBlock.lastHeight = y - startY;
  return renderBlock.lastHeight;
}

// ═══════════════════════════════════════════════════════
// Line layout — Pretext or fallback
// ═══════════════════════════════════════════════════════

function layoutLine(text, prepKey, offset, fontStr, maxW, lh) {
  if (offset >= text.length) return null;
  const p = prep[prepKey];

  if (pt && pt.layoutNextLine && p) {
    try {
      const r = pt.layoutNextLine(p, offset, maxW, lh);
      if (r) {
        const t = extractText(r, text, offset);
        const next = r.nextOffset != null ? r.nextOffset : offset + t.length;
        if (next > offset) return { text: t, next };
      }
    } catch {}
  }

  return manualLine(text, offset, fontStr, maxW);
}

function extractText(result, orig, off) {
  const l = result.line || result;
  if (typeof l === 'string') return l.replace(/\n$/, '');
  if (l.text != null) return l.text.replace(/\n$/, '');
  if (l.content != null) return l.content.replace(/\n$/, '');
  if (l.startOffset != null) return orig.slice(l.startOffset, l.endOffset).replace(/\n$/, '');
  if (result.nextOffset != null) return orig.slice(off, result.nextOffset).replace(/\n$/, '').trimEnd();
  return String(l);
}

function manualLine(text, offset, fontStr, maxW) {
  ctx.font = fontStr;
  let end = offset, lastSp = -1;
  while (end < text.length) {
    if (text[end] === ' ') lastSp = end;
    if (ctx.measureText(text.slice(offset, end + 1)).width > maxW && end > offset) {
      const bp = lastSp > offset ? lastSp : end;
      return { text: text.slice(offset, bp).trimEnd(), next: text[bp] === ' ' ? bp + 1 : bp };
    }
    end++;
  }
  return { text: text.slice(offset).trimEnd(), next: text.length };
}

// ═══════════════════════════════════════════════════════
// Visual effects
// ═══════════════════════════════════════════════════════

function drawGlow() {
  const now = performance.now();
  const gx = smoothX > -1000 ? smoothX : W * 0.4 + Math.sin(now / 4000) * W * 0.12;
  const gy = smoothX > -1000 ? smoothY : H * 0.35 + Math.cos(now / 3000) * H * 0.1;
  const intensity = smoothX > -1000 ? 0.1 : 0.05;

  // Shifting hue glow
  const glowHue = (260 + now / 30) % 360;
  const r = BUBBLE_R * 1.5;
  const g = ctx.createRadialGradient(gx, gy, 0, gx, gy, r);
  g.addColorStop(0, 'hsla(' + glowHue + ', 80%, 65%, ' + intensity + ')');
  g.addColorStop(0.5, 'hsla(' + glowHue + ', 80%, 65%, ' + intensity * 0.2 + ')');
  g.addColorStop(1, 'hsla(' + glowHue + ', 80%, 65%, 0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(gx, gy, r, 0, Math.PI * 2);
  ctx.fill();

  // Second glow — complementary color, offset
  const g2x = smoothX > -1000 ? smoothX + 60 : W * 0.6 + Math.cos(now / 5000) * W * 0.1;
  const g2y = smoothX > -1000 ? smoothY - 40 : H * 0.5 + Math.sin(now / 4500) * H * 0.08;
  const hue2 = (glowHue + 120) % 360;
  const g2 = ctx.createRadialGradient(g2x, g2y, 0, g2x, g2y, r * 0.7);
  g2.addColorStop(0, 'hsla(' + hue2 + ', 70%, 60%, ' + intensity * 0.5 + ')');
  g2.addColorStop(1, 'hsla(' + hue2 + ', 70%, 60%, 0)');
  ctx.fillStyle = g2;
  ctx.beginPath();
  ctx.arc(g2x, g2y, r * 0.7, 0, Math.PI * 2);
  ctx.fill();

  // Cursor dot
  if (smoothX > -1000) {
    const g3 = ctx.createRadialGradient(smoothX, smoothY, 0, smoothX, smoothY, 10);
    g3.addColorStop(0, 'hsla(' + glowHue + ', 90%, 85%, 0.4)');
    g3.addColorStop(1, 'hsla(' + glowHue + ', 90%, 85%, 0)');
    ctx.fillStyle = g3;
    ctx.beginPath();
    ctx.arc(smoothX, smoothY, 10, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawLabel(text, x, y) {
  ctx.font = mkFont(600, sz(10));
  ctx.fillStyle = '#363636';
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';
  let cx = x;
  for (const ch of text) {
    ctx.fillText(ch, cx, y);
    cx += ctx.measureText(ch).width + sz(3);
  }
}

function clamp(v) { return Math.max(0, Math.min(1, v)); }

// ═══════════════════════════════════════════════════════
// Start
// ═══════════════════════════════════════════════════════
init();
