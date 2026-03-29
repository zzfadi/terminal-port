// ═══════════════════════════════════════════════════════
// Liquid Typography — Full-page Pretext canvas experience
// Every line of text is laid out by Pretext with variable
// widths, creating effects impossible with DOM layout.
// ═══════════════════════════════════════════════════════

const FONT = 'Syne';
const BUBBLE_R = 220;

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

// ─── State ───────────────────────────────────────────

let pt = null, canvas, ctx, dpr;
let W = 0, H = 0;
let mouseX = -9999, mouseY = -9999;
let smoothX = -9999, smoothY = -9999;
let isHovering = false, lastMouse = 0, hintGone = false;
let scrollY = 0, prevScrollY = 0;
let prep = {};

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
  if (loaded) prepareAll();

  // Events
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
  window.addEventListener('resize', () => { sizeCanvas(); if (pt) prepareAll(); });

  loop();
}

function hideHint() {
  if (!hintGone) { hintGone = true; document.getElementById('hint').classList.add('hidden'); }
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

  // Hero blocks
  for (const b of HERO) {
    const size = Math.round(sz(88) * b.sizeRatio);
    try { prep[b.key] = fn(b.text, mkFont(b.weight, size)); } catch {}
  }

  // Career blocks
  CAREER.forEach((c, i) => {
    const titleSize = sz(16);
    const descSize = sz(14);
    try {
      prep['ct' + i] = fn(c.title, mkFont(600, titleSize));
      prep['cd' + i] = fn(c.desc, mkFont(400, descSize));
    } catch {}
  });

  // Skills
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

  // Smooth cursor
  if (isHovering && mouseX > -1000) {
    smoothX += (mouseX - smoothX) * 0.1;
    smoothY += (mouseY - smoothY) * 0.1;
  } else {
    smoothX = -9999; smoothY = -9999;
  }

  render();
  prevScrollY = scrollY;
}

function render() {
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#050505';
  ctx.fillRect(0, 0, W, H);

  const vh = H;

  // ─── Section visibility ───────────────────────
  const heroA   = clamp(1 - scrollY / (vh * 0.6));
  const careerT = clamp((scrollY - vh * 0.5) / (vh * 1.2));
  const careerA = careerT < 0.08 ? careerT / 0.08 : careerT > 0.85 ? clamp((1 - careerT) / 0.15) : 1;
  const skillsT = clamp((scrollY - vh * 1.8) / (vh * 1.2));
  const skillsA = skillsT < 0.08 ? skillsT / 0.08 : skillsT > 0.85 ? clamp((1 - skillsT) / 0.15) : 1;

  // ─── Draw sections ────────────────────────────
  if (heroA > 0.01) { ctx.globalAlpha = heroA; drawGlow(); renderHero(); }
  if (careerA > 0.01 && careerT > 0) { ctx.globalAlpha = careerA; renderCareer(careerT); }
  if (skillsA > 0.01 && skillsT > 0) { ctx.globalAlpha = skillsA; renderSkills(skillsT); }
  ctx.globalAlpha = 1;
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
    ctx.fillStyle = '#e5e5e5';
    const height = renderBlock(b.text, b.key, f, lh, m, y, maxW, heroDisplace);
    y += height + Math.round(size * b.gap);
  }
}

function heroDisplace(lineY, baseMaxW) {
  const now = performance.now();
  const t = now / 2500;

  // Wave
  const w1 = Math.sin(lineY / 80 + t) * 0.5 + 0.5;
  const w2 = Math.sin(lineY / 45 - t * 1.3) * 0.35 + 0.35;
  const wave = Math.min(1, w1 + w2 * 0.6);
  let waveIndent = wave * sz(320);

  // Cursor
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
// Career Section — zigzag / diagonal wave
// ═══════════════════════════════════════════════════════

function renderCareer(progress) {
  const m = margin(), maxW = baseMaxW();
  const titleSize = sz(16), descSize = sz(14);
  const titleFont = mkFont(600, titleSize);
  const dateFont = mkFont(500, sz(11));
  const descFont = mkFont(400, descSize);
  const titleLh = Math.round(titleSize * 1.35);
  const descLh = Math.round(descSize * 1.7);

  // Section label
  drawLabel('CAREER', m, 36);

  let y = 64;
  const revealedEntries = Math.ceil(progress * (CAREER.length + 1));

  CAREER.forEach((c, i) => {
    if (i >= revealedEntries) return;
    const entryAlpha = Math.min(1, (revealedEntries - i) * 0.8);
    ctx.globalAlpha *= entryAlpha;

    // Date
    ctx.font = dateFont;
    ctx.fillStyle = '#525252';
    ctx.textBaseline = 'alphabetic';
    ctx.textAlign = 'left';
    ctx.fillText(c.date, m, y + sz(10) * 0.78);
    y += sz(18);

    // Title with zigzag
    ctx.fillStyle = '#e5e5e5';
    const titleH = renderBlock(c.title, 'ct' + i, titleFont, titleLh, m, y, maxW, (ly) => zigzagDisplace(ly, maxW, i));
    y += titleH + 6;

    // Description with zigzag
    ctx.fillStyle = '#a3a3a3';
    const descH = renderBlock(c.desc, 'cd' + i, descFont, descLh, m, y, maxW, (ly) => zigzagDisplace(ly, maxW, i));
    y += descH + sz(32);

    ctx.globalAlpha /= entryAlpha;
  });
}

function zigzagDisplace(lineY, baseMaxW, seed) {
  const now = performance.now();
  const t = now / 3000 + seed * 1.5;

  // Triangular wave — bounces left-right
  const period = 100;
  const phase = ((lineY / period + t) % 1 + 1) % 1;
  const tri = phase < 0.5 ? phase * 2 : 2 - phase * 2;
  const indent = tri * sz(200);

  return { x: indent, w: Math.max(sz(80), baseMaxW - indent * 0.4) };
}

// ═══════════════════════════════════════════════════════
// Skills Section — circular text shape
// ═══════════════════════════════════════════════════════

function renderSkills(progress) {
  const maxW = baseMaxW();
  const font = mkFont(500, sz(18));
  const lh = Math.round(sz(18) * 1.6);

  drawLabel('SKILLS', margin(), 36);

  // Circle parameters
  const cx = W / 2;
  const cy = H / 2;
  const maxRadius = Math.min(sz(240), (H - 120) / 2, (W - 40) / 2);
  const radius = maxRadius * Math.min(1, progress * 2.5);
  const pulse = Math.sin(performance.now() / 3000) * sz(15);
  const r = radius + pulse;

  // Render skills text in circular shape
  ctx.fillStyle = '#e5e5e5';
  renderBlock(SKILLS_TEXT, 'skills', font, lh, 0, cy - r, maxW, (lineY) => {
    return circleDisplace(lineY, cy, r, maxW);
  });
}

function circleDisplace(lineY, centerY, radius, baseMaxW) {
  const dy = lineY - centerY;
  if (Math.abs(dy) > radius) return { x: 0, w: 0 }; // outside circle

  const halfChord = Math.sqrt(radius * radius - dy * dy);
  const chordW = Math.min(halfChord * 2, baseMaxW);
  const xShift = (baseMaxW - chordW) / 2 + margin();

  return { x: xShift, w: Math.max(sz(40), chordW) };
}

// ═══════════════════════════════════════════════════════
// Generic text block renderer (Pretext-powered)
// ═══════════════════════════════════════════════════════

function renderBlock(text, prepKey, fontStr, lh, startX, startY, bMaxW, displaceFn) {
  let offset = 0, y = startY, safety = 120;

  while (offset < text.length && safety-- > 0) {
    const mid = y + lh * 0.5;
    const d = displaceFn(mid, bMaxW);

    if (d.w < sz(30)) {
      // Too narrow — skip this line position (for circle edges)
      y += lh;
      if (y > H + lh) break;
      continue;
    }

    const result = layoutLine(text, prepKey, offset, fontStr, d.w, lh);
    if (!result || result.next <= offset) break;

    ctx.font = fontStr;
    ctx.textBaseline = 'alphabetic';
    ctx.textAlign = 'left';
    ctx.fillText(result.text, startX + d.x, y + lh * 0.78);

    offset = result.next;
    y += lh;
  }

  return y - startY;
}

// ═══════════════════════════════════════════════════════
// Line layout — Pretext layoutNextLine or manual fallback
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
// Visual helpers
// ═══════════════════════════════════════════════════════

function drawGlow() {
  const now = performance.now();
  const gx = smoothX > -1000 ? smoothX : W * 0.4 + Math.sin(now / 4000) * W * 0.12;
  const gy = smoothX > -1000 ? smoothY : H * 0.35 + Math.cos(now / 3000) * H * 0.1;
  const intensity = smoothX > -1000 ? 0.09 : 0.04;

  const r = BUBBLE_R * 1.5;
  const g = ctx.createRadialGradient(gx, gy, 0, gx, gy, r);
  g.addColorStop(0, 'rgba(139, 92, 246, ' + intensity + ')');
  g.addColorStop(0.5, 'rgba(139, 92, 246, ' + intensity * 0.25 + ')');
  g.addColorStop(1, 'rgba(139, 92, 246, 0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(gx, gy, r, 0, Math.PI * 2);
  ctx.fill();

  if (smoothX > -1000) {
    const g2 = ctx.createRadialGradient(smoothX, smoothY, 0, smoothX, smoothY, 8);
    g2.addColorStop(0, 'rgba(196, 181, 253, 0.35)');
    g2.addColorStop(1, 'rgba(196, 181, 253, 0)');
    ctx.fillStyle = g2;
    ctx.beginPath();
    ctx.arc(smoothX, smoothY, 8, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawLabel(text, x, y) {
  ctx.font = mkFont(600, sz(10));
  ctx.fillStyle = '#363636';
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';
  // Manual letter spacing
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
