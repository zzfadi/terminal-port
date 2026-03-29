// ═══════════════════════════════════════════════════════════════════
// Magnetic Typography — Pretext Capability Showcase
//
// Each section demonstrates a specific Pretext capability:
//  1. HERO    → Canvas/SVG text without DOM measurement hacks
//  2. BIO     → Text flowing around draggable shapes (layoutNextLine)
//  3. CAREER  → Per-line changing widths (tapered paragraph)
//  4. PROJECT → Shrink-wrapped balanced text (walkLineRanges)
//  5. SKILLS  → Paragraph height prediction (layout → masonry)
//  6. STATS   → Predictable measurement for virtualization
// ═══════════════════════════════════════════════════════════════════

const FONT = 'Space Grotesk';
const MONO = 'JetBrains Mono';

// ─── Content from profile.md ─────────────────────────────

const SECTIONS = {
  name: 'Fadi Zuabi',
  tagline: 'Firmware Engineer · AI Champion · Builder',
  bio: "I'm a firmware engineer who builds AI systems. UIUC grad, worked at GE Aerospace and Intel, now at Solidigm where I train engineers on AI tools and build systems that make firmware development smarter. AI is the biggest leverage multiplier I've seen in my engineering career. I watched junior engineers become 2-3x more productive with the right tools.",
  career: [
    { role: 'Senior Firmware Engineer & AI Champion', company: 'Solidigm (SK Hynix)', year: '2022–Now', detail: 'Leading AI adoption programs — 70% Copilot usage increase, trained 60+ senior engineers. Technical Product Lead for GEN5 PCIe SSD delivery. Building intelligent firmware debugging systems with DataIku, Snowflake, and Graph Neural Networks.' },
    { role: 'Firmware Engineer, NAND Storage', company: 'Intel', year: '2021–2022', detail: 'SSD firmware development, flash management, NVMe protocols, PCIe Gen4/Gen5 multi-core ARM and Xtensa architectures.' },
    { role: 'Embedded Software Engineer, Aircraft Systems', company: 'GE Aerospace', year: '2019–2021', detail: 'First 4G-LTE module integration in aviation health monitoring. Cloud-based CI/CD optimization achieving 80–90% runtime reduction and $30k+ annual savings.' },
  ],
  education: 'B.S. Electrical Engineering — University of Illinois at Urbana-Champaign, 2019',
  projects: [
    { name: 'Intelligent Firmware Debug Agent', tech: 'DataIku · Snowflake · GNN · Multi-LLM', desc: 'AI-powered debugging system with multi-LLM orchestration and predictive capabilities for firmware failure analysis.' },
    { name: 'GitHub Copilot Enterprise Deployment', tech: 'GitHub Copilot · Enterprise API', desc: 'Company-wide AI tool customization and adoption framework. 70% adoption increase, trained 60+ senior engineers.' },
    { name: 'GEN5 PCIe SSD', tech: 'NVMe · PCIe Gen5 · ARM · C/C++', desc: 'Technical Product Lead, primary liaison across firmware, validation, and cross-company teams at Solidigm.' },
    { name: 'CI/CD Optimization', tech: 'Cloud · Static Analysis · Python', desc: 'Cloud-based static analysis automation at GE Aerospace. 80-90% runtime reduction, $30k+ annual savings.' },
  ],
  skills: [
    'C/C++', 'NVMe', 'PCIe Gen5', 'RTOS', 'ARM', 'Xtensa', 'Linux Kernel',
    'LLM Integration', 'Prompt Engineering', 'RAG Systems', 'GNN',
    'Python', 'TypeScript', 'React', 'GCP', 'Firebase',
    'DataIku', 'Snowflake', 'Vertex AI', 'DO-178C', 'MISRA C',
  ],
  stats: [
    { value: '5+', label: 'Years Firmware' },
    { value: '60+', label: 'Engineers Trained' },
    { value: '70%', label: 'AI Adoption ↑' },
    { value: '90%', label: 'CI/CD Faster' },
  ],
};

// ─── Capability labels (shown as badges when section scrolls into view) ──

const CAPABILITIES = [
  '① Canvas text — zero DOM hacks',
  '② Height prediction before render',
  '③ Text flows around shapes',
  '④ Per-line variable widths',
  '⑤ Shrink-wrapped balanced text',
  '⑥ Predictive virtualized layout',
];

// ─── State ───────────────────────────────────────────────

let pt = null;
let canvas, ctx, dpr;
let W = 0, H = 0;
let mouse = { x: -9999, y: -9999 };
let smoothMouse = { x: -9999, y: -9999 };
let scrollY = 0;
let totalHeight = 0;
let hintHidden = false;
let isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
let time = 0;

const prepared = {};
const orbs = [];
let heroChars = [];
let fieldParticles = [];
let dragOrb = null; // currently dragged orb
let activeBadges = new Set();

// ─── Responsive ──────────────────────────────────────────

function sz(base) {
  if (W < 640) return Math.round(base * 0.52);
  if (W < 900) return Math.round(base * 0.72);
  return Math.round(base);
}
function pad() { return W < 640 ? 20 : W < 900 ? 36 : Math.round(W * 0.08); }
function contentW() { return Math.min(W - pad() * 2, 820); }

// ─── Colors ──────────────────────────────────────────────

function getColors() {
  return isDark ? {
    bg: '#0a0a0f', text: '#e8e8f0', dim: '#3a3a4e',
    secondary: '#7a7a8e', accent: '#00d4aa', accentB: '#7c5cff', accentC: '#ff6b4a',
  } : {
    bg: '#f4f4f8', text: '#1a1a2e', dim: '#b0b0c0',
    secondary: '#5a5a6e', accent: '#009975', accentB: '#5a3ed4', accentC: '#d94a2a',
  };
}

function hsl(h, s, l, a = 1) { return `hsla(${h % 360},${s}%,${l}%,${a})`; }

function lerpColor(a, b, t) {
  const ah = parseInt(a.slice(1), 16), bh = parseInt(b.slice(1), 16);
  const ar = (ah >> 16) & 0xff, ag = (ah >> 8) & 0xff, ab = ah & 0xff;
  const br = (bh >> 16) & 0xff, bg_ = (bh >> 8) & 0xff, bb = bh & 0xff;
  return `rgb(${Math.round(ar + (br - ar) * t)},${Math.round(ag + (bg_ - ag) * t)},${Math.round(ab + (bb - ab) * t)})`;
}

// ═══════════════════════════════════════════════════════════
// Init
// ═══════════════════════════════════════════════════════════

async function init() {
  canvas = document.getElementById('canvas');
  ctx = canvas.getContext('2d');
  dpr = Math.min(window.devicePixelRatio || 1, 2);

  const isTouch = 'ontouchstart' in window;
  if (isTouch) document.getElementById('hint-text').textContent = 'drag orbs · scroll';

  sizeCanvas();
  pt = await loadPretext();
  if (pt) prepareTexts();
  initOrbs();
  initHeroChars();
  initFieldParticles();
  initBadges();

  // Mouse
  canvas.addEventListener('mousemove', onPointerMove);
  canvas.addEventListener('mouseleave', () => { mouse.x = -9999; mouse.y = -9999; if (dragOrb) dragOrb = null; });
  canvas.addEventListener('mousedown', onPointerDown);
  canvas.addEventListener('mouseup', () => { dragOrb = null; });

  // Touch
  canvas.addEventListener('touchstart', (e) => {
    const t = e.touches[0], r = canvas.getBoundingClientRect();
    mouse.x = t.clientX - r.left; mouse.y = t.clientY - r.top;
    onPointerDown({ clientX: t.clientX, clientY: t.clientY });
  }, { passive: true });
  canvas.addEventListener('touchmove', (e) => {
    const t = e.touches[0], r = canvas.getBoundingClientRect();
    mouse.x = t.clientX - r.left; mouse.y = t.clientY - r.top;
    if (dragOrb) { dragOrb.x = mouse.x; dragOrb.y = mouse.y + scrollY; dragOrb.baseX = dragOrb.x; dragOrb.baseY = dragOrb.y; }
    hideHint();
  }, { passive: true });
  canvas.addEventListener('touchend', () => { mouse.x = -9999; mouse.y = -9999; dragOrb = null; });

  window.addEventListener('scroll', () => { scrollY = window.scrollY; }, { passive: true });
  window.addEventListener('resize', onResize);
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => { isDark = e.matches; });

  loop(0);
}

async function loadPretext() {
  try { return await import('https://esm.sh/@chenglou/pretext@0.0.2?bundle'); }
  catch { return null; }
}

function sizeCanvas() {
  W = window.innerWidth; H = window.innerHeight;
  canvas.width = W * dpr; canvas.height = H * dpr;
  canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  totalHeight = H * 6.5;
  document.getElementById('scroll-spacer').style.height = totalHeight + 'px';
}

function onResize() {
  sizeCanvas();
  if (pt) prepareTexts();
  initOrbs(); initHeroChars(); initFieldParticles();
}

function hideHint() {
  if (!hintHidden) { hintHidden = true; document.getElementById('hint').classList.add('hidden'); }
}

function onPointerMove(e) {
  const r = canvas.getBoundingClientRect();
  mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
  if (dragOrb) {
    dragOrb.x = mouse.x; dragOrb.y = mouse.y + scrollY;
    dragOrb.baseX = dragOrb.x; dragOrb.baseY = dragOrb.y;
  }
  hideHint();
}

function onPointerDown(e) {
  const r = canvas.getBoundingClientRect();
  const mx = (e.clientX || e.touches?.[0]?.clientX) - r.left;
  const my = (e.clientY || e.touches?.[0]?.clientY) - r.top;
  // Check if clicking an orb
  for (const o of orbs) {
    const dy = o.y - scrollY - my;
    const dx = o.x - mx;
    if (Math.sqrt(dx * dx + dy * dy) < o.r + 20) {
      dragOrb = o;
      canvas.style.cursor = 'grabbing';
      return;
    }
  }
  canvas.style.cursor = 'crosshair';
}

// ═══════════════════════════════════════════════════════════
// Capability badges
// ═══════════════════════════════════════════════════════════

function initBadges() {
  const container = document.getElementById('badges');
  for (let i = 0; i < CAPABILITIES.length; i++) {
    const el = document.createElement('div');
    el.className = 'cap-badge';
    el.textContent = CAPABILITIES[i];
    el.dataset.index = i;
    container.appendChild(el);
  }
}

function showBadge(index) {
  if (activeBadges.has(index)) return;
  activeBadges.add(index);
  const badges = document.querySelectorAll('.cap-badge');
  if (badges[index]) badges[index].classList.add('visible');
}

// ═══════════════════════════════════════════════════════════
// Pretext text preparation
// ═══════════════════════════════════════════════════════════

function prepareTexts() {
  const P = pt.prepareWithSegments;
  const p = pt.prepare;

  // Hero (Capability 1: canvas text without DOM hacks)
  prepared.name = P(SECTIONS.name, `700 ${sz(72)}px "${FONT}"`);
  prepared.tagline = P(SECTIONS.tagline, `400 ${sz(18)}px "${FONT}"`);

  // Bio (Capability 3: text flowing around shapes)
  prepared.bio = P(SECTIONS.bio, `400 ${sz(15)}px "${FONT}"`);

  // Career (Capability 4: per-line changing widths)
  prepared.career = SECTIONS.career.map(c => ({
    role: P(c.role, `600 ${sz(17)}px "${FONT}"`),
    company: P(c.company, `400 ${sz(13)}px "${MONO}"`),
    year: P(c.year, `300 ${sz(12)}px "${MONO}"`),
    detail: P(c.detail, `400 ${sz(14)}px "${FONT}"`),
  }));

  // Projects (Capability 5: shrink-wrapped balanced text)
  prepared.projects = SECTIONS.projects.map(proj => ({
    name: P(proj.name, `600 ${sz(16)}px "${FONT}"`),
    tech: P(proj.tech, `400 ${sz(11)}px "${MONO}"`),
    desc: P(proj.desc, `400 ${sz(13)}px "${FONT}"`),
    // Also prepare with basic prepare() for height prediction
    descHeight: p(proj.desc, `400 ${sz(13)}px "${FONT}"`),
  }));

  // Skills (Capability 2: paragraph height prediction → masonry)
  prepared.skillBlocks = SECTIONS.skills.map(s => ({
    text: s,
    prep: p(s, `500 ${sz(13)}px "${MONO}"`),
    prepSeg: P(s, `500 ${sz(13)}px "${MONO}"`),
  }));

  // Stats (Capability 6: predictable measurement for virtualization)
  prepared.stats = SECTIONS.stats.map(s => ({
    value: P(s.value, `700 ${sz(40)}px "${FONT}"`),
    label: P(s.label, `400 ${sz(12)}px "${MONO}"`),
    valueHeight: p(s.value, `700 ${sz(40)}px "${FONT}"`),
    labelHeight: p(s.label, `400 ${sz(12)}px "${MONO}"`),
  }));

  prepared.education = P(SECTIONS.education, `400 ${sz(13)}px "${MONO}"`);
}

// ═══════════════════════════════════════════════════════════
// Draggable orbs — obstacles for text reflow
// ═══════════════════════════════════════════════════════════

function initOrbs() {
  orbs.length = 0;
  const bioY = sectionY(1);
  const count = W < 640 ? 2 : 3;
  for (let i = 0; i < count; i++) {
    const x = pad() + contentW() * (0.25 + i * 0.28);
    const y = bioY + sz(80) + i * sz(50);
    orbs.push({
      x, y, r: sz(35 + i * 10),
      baseX: x, baseY: y,
      hue: [168, 252, 18][i],
    });
  }
}

function updateOrbs() {
  for (const o of orbs) {
    if (o === dragOrb) continue;
    // Gentle drift
    o.x = o.baseX + Math.sin(time * 0.4 + o.hue) * sz(20);
    o.y = o.baseY + Math.cos(time * 0.3 + o.hue * 0.5) * sz(12);
  }
}

function drawOrbs() {
  for (const o of orbs) {
    const drawY = o.y - scrollY;
    if (drawY < -150 || drawY > H + 150) continue;
    // Glow
    const grad = ctx.createRadialGradient(o.x, drawY, 0, o.x, drawY, o.r * 2.5);
    grad.addColorStop(0, hsl(o.hue, 80, isDark ? 60 : 50, 0.18));
    grad.addColorStop(0.5, hsl(o.hue, 60, isDark ? 40 : 45, 0.06));
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.arc(o.x, drawY, o.r * 2.5, 0, Math.PI * 2); ctx.fill();
    // Core
    const cg = ctx.createRadialGradient(o.x, drawY, 0, o.x, drawY, o.r);
    cg.addColorStop(0, hsl(o.hue, 90, isDark ? 70 : 55, o === dragOrb ? 0.7 : 0.45));
    cg.addColorStop(0.7, hsl(o.hue, 70, isDark ? 50 : 40, 0.2));
    cg.addColorStop(1, hsl(o.hue, 60, isDark ? 30 : 35, 0));
    ctx.fillStyle = cg;
    ctx.beginPath(); ctx.arc(o.x, drawY, o.r, 0, Math.PI * 2); ctx.fill();
    // Drag indicator ring
    if (o === dragOrb) {
      ctx.strokeStyle = hsl(o.hue, 80, isDark ? 70 : 50, 0.4);
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(o.x, drawY, o.r + 6, 0, Math.PI * 2); ctx.stroke();
    }
  }
}

// ═══════════════════════════════════════════════════════════
// CAPABILITY 1: Canvas text without DOM measurement hacks
// Hero characters rendered on canvas, measured by Pretext
// ═══════════════════════════════════════════════════════════

function initHeroChars() {
  heroChars = [];
  const text = SECTIONS.name.toUpperCase();
  const fontSize = sz(90);
  ctx.font = `700 ${fontSize}px "${FONT}"`;
  let totalW = 0;
  const charWidths = [];
  for (const ch of text) { const w = ctx.measureText(ch).width; charWidths.push(w); totalW += w; }
  let x = (W - totalW) / 2;
  const y = H * 0.32;
  for (let i = 0; i < text.length; i++) {
    heroChars.push({
      char: text[i], homeX: x + charWidths[i] / 2, homeY: y,
      x: x + charWidths[i] / 2, y, vx: 0, vy: 0,
      w: charWidths[i], size: fontSize, angle: 0, angleV: 0,
    });
    x += charWidths[i];
  }
}

function updateHeroChars() {
  const scrollFade = Math.max(0, 1 - scrollY / (H * 0.6));
  for (const ch of heroChars) {
    const dx = ch.x - smoothMouse.x, dy = ch.y - smoothMouse.y + scrollY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const repR = sz(180);
    if (dist < repR && dist > 0 && scrollFade > 0.1) {
      const f = ((repR - dist) / repR) * 12;
      ch.vx += (dx / dist) * f; ch.vy += (dy / dist) * f;
      ch.angleV += (dx > 0 ? 1 : -1) * f * 0.003;
    }
    ch.vx += (ch.homeX - ch.x) * 0.06; ch.vy += (ch.homeY - ch.y) * 0.06;
    ch.vx *= 0.88; ch.vy *= 0.88; ch.angleV *= 0.92;
    ch.x += ch.vx; ch.y += ch.vy; ch.angle += ch.angleV; ch.angle *= 0.95;
  }
}

function drawHero() {
  const scrollFade = Math.max(0, 1 - scrollY / (H * 0.6));
  if (scrollFade <= 0) return;
  showBadge(0);

  const c = getColors();
  const accents = [c.accent, c.accentB, c.accentC];

  for (let i = 0; i < heroChars.length; i++) {
    const ch = heroChars[i];
    const drawY = ch.y - scrollY;
    if (drawY < -200 || drawY > H + 200) continue;
    const disp = Math.sqrt((ch.x - ch.homeX) ** 2 + (ch.y - ch.homeY) ** 2);
    const mix = Math.min(disp / 80, 1);
    ctx.save();
    ctx.translate(ch.x, drawY); ctx.rotate(ch.angle);
    ctx.font = `700 ${ch.size}px "${FONT}"`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.globalAlpha = scrollFade;
    if (mix > 0.05) { ctx.shadowColor = accents[i % 3]; ctx.shadowBlur = mix * 20; }
    ctx.fillStyle = lerpColor(isDark ? '#e8e8f0' : '#1a1a2e', accents[i % 3], mix * 0.6);
    ctx.fillText(ch.char, 0, 0);
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  // Tagline below hero — uses Pretext layoutWithLines for wrapping
  if (pt && prepared.tagline) {
    ctx.globalAlpha = scrollFade * 0.7;
    ctx.font = `400 ${sz(18)}px "${FONT}"`;
    ctx.fillStyle = c.secondary;
    ctx.textAlign = 'center';
    const { lines } = pt.layoutWithLines(prepared.tagline, contentW(), sz(28));
    const baseY = H * 0.32 + sz(65) - scrollY;
    for (let i = 0; i < lines.length; i++) ctx.fillText(lines[i].text, W / 2, baseY + i * sz(28));
    ctx.textAlign = 'left';
    ctx.globalAlpha = 1;
  }
}

// ═══════════════════════════════════════════════════════════
// CAPABILITY 2: Paragraph height prediction before render
// Skills masonry — compute all block heights with layout()
// then arrange in columns without any DOM measurement
// ═══════════════════════════════════════════════════════════

function drawSkillsMasonry() {
  if (!pt || !prepared.skillBlocks) return;

  const secY = sectionY(2);
  const alpha = sectionAlpha(secY);
  if (alpha <= 0) return;
  showBadge(1);

  const c = getColors();
  const left = pad();
  const maxW = contentW();
  const cols = W < 640 ? 2 : W < 900 ? 3 : 4;
  const gap = sz(10);
  const colW = (maxW - gap * (cols - 1)) / cols;
  const tagPad = sz(10);
  const lineH = sz(20);

  ctx.globalAlpha = alpha;

  // Section label
  ctx.font = `500 ${sz(12)}px "${MONO}"`;
  ctx.fillStyle = c.accent;
  ctx.fillText('SKILLS — height predicted by layout()', left, secY - scrollY);

  // Education line
  const eduY = secY + sz(26) - scrollY;
  ctx.font = `400 ${sz(13)}px "${MONO}"`;
  ctx.fillStyle = c.secondary;
  if (prepared.education) {
    const { lines } = pt.layoutWithLines(prepared.education, maxW, sz(20));
    for (const ln of lines) ctx.fillText(ln.text, left, eduY);
  }

  // Masonry layout — use layout() to predict each skill block's height
  // before placing them, demonstrating zero-DOM height prediction
  const colHeights = new Array(cols).fill(0);
  const startY = secY + sz(55);
  const placements = [];

  for (let i = 0; i < prepared.skillBlocks.length; i++) {
    const block = prepared.skillBlocks[i];
    // ★ PRETEXT: predict text height without rendering
    const { height } = pt.layout(block.prep, colW - tagPad * 2, lineH);
    const blockH = height + tagPad * 2;

    // Pick shortest column
    let minCol = 0;
    for (let c = 1; c < cols; c++) { if (colHeights[c] < colHeights[minCol]) minCol = c; }

    const bx = left + minCol * (colW + gap);
    const by = startY + colHeights[minCol];
    colHeights[minCol] += blockH + gap;

    placements.push({ bx, by, blockH, colW, block, index: i });
  }

  // Draw all skill blocks
  for (const { bx, by, blockH, colW: cw, block, index: i } of placements) {
    const drawY = by - scrollY;
    if (drawY > H + 50 || drawY + blockH < -50) continue;

    const hueShift = (i / SECTIONS.skills.length) * 260 + time * 5;

    // Card background
    ctx.fillStyle = hsl(hueShift, 50, isDark ? 20 : 90, 0.3);
    roundRect(ctx, bx, drawY, cw, blockH, sz(5));
    ctx.fill();

    // Border
    ctx.strokeStyle = hsl(hueShift, 50, isDark ? 45 : 50, 0.25);
    ctx.lineWidth = 1;
    roundRect(ctx, bx, drawY, cw, blockH, sz(5));
    ctx.stroke();

    // Text — rendered via layoutWithLines
    ctx.font = `500 ${sz(13)}px "${MONO}"`;
    ctx.fillStyle = hsl(hueShift, 40, isDark ? 75 : 30, 0.9);
    const { lines } = pt.layoutWithLines(block.prepSeg, cw - tagPad * 2, lineH);
    for (let j = 0; j < lines.length; j++) {
      ctx.fillText(lines[j].text, bx + tagPad, drawY + tagPad + j * lineH + lineH * 0.7);
    }
  }

  ctx.globalAlpha = 1;
}

// ═══════════════════════════════════════════════════════════
// CAPABILITY 3: Text flowing around shapes
// Bio section — text reflows around draggable orbs in real
// time using layoutNextLine() with per-line width changes
// ═══════════════════════════════════════════════════════════

function drawBioReflow() {
  if (!pt || !prepared.bio) return;

  const secY = sectionY(1);
  const alpha = sectionAlpha(secY);
  if (alpha <= 0) return;
  showBadge(2);

  const c = getColors();
  const left = pad();
  const maxW = contentW();
  const lineH = sz(23);

  ctx.globalAlpha = alpha;

  // Section label
  ctx.font = `500 ${sz(12)}px "${MONO}"`;
  ctx.fillStyle = c.accent;
  ctx.fillText('ABOUT — text reflows around draggable orbs', left, secY - scrollY);

  // ★ PRETEXT: layoutNextLine with per-line width that changes based on orb positions
  const bioStartY = secY + sz(32);
  ctx.font = `400 ${sz(15)}px "${FONT}"`;
  ctx.fillStyle = c.text;

  let cursor = { segmentIndex: 0, graphemeIndex: 0 };
  let y = bioStartY;

  for (let lineIdx = 0; lineIdx < 30; lineIdx++) {
    let effectiveW = maxW;
    let xOffset = 0;

    // For each orb, compute the indent at this y-position
    for (const o of orbs) {
      const dy = Math.abs(y - o.y);
      if (dy < o.r + lineH) {
        const carve = Math.sqrt(Math.max(0, (o.r + lineH) ** 2 - dy ** 2));
        if (o.x - left < maxW * 0.5) {
          const newLeft = o.x + carve;
          if (newLeft > left) { const shift = newLeft - left; effectiveW -= shift; xOffset = Math.max(xOffset, shift); }
        } else {
          effectiveW = Math.min(effectiveW, Math.max(80, o.x - carve - left));
        }
      }
    }

    effectiveW = Math.max(effectiveW, 60);
    const line = pt.layoutNextLine(prepared.bio, cursor, effectiveW);
    if (!line) break;

    const drawY = y - scrollY;
    if (drawY > -50 && drawY < H + 50) {
      // Color lines that are displaced differently
      const displaced = xOffset > 5 || effectiveW < maxW - 10;
      ctx.fillStyle = displaced ? c.accent : c.text;
      ctx.globalAlpha = alpha * (displaced ? 0.85 : 1);
      ctx.fillText(line.text, left + xOffset, drawY);
    }

    cursor = line.end;
    y += lineH;
  }

  ctx.globalAlpha = 1;
}

// ═══════════════════════════════════════════════════════════
// CAPABILITY 4: Per-line changing widths — tapered paragraphs
// Career detail text narrows on each line, creating a
// diagonal/funnel shape — only possible with layoutNextLine
// ═══════════════════════════════════════════════════════════

function drawCareerTapered() {
  if (!pt || !prepared.career) return;

  const secY = sectionY(3);
  const alpha = sectionAlpha(secY);
  if (alpha <= 0) return;
  showBadge(3);

  const c = getColors();
  const left = pad();
  const maxW = contentW();

  ctx.globalAlpha = alpha;

  ctx.font = `500 ${sz(12)}px "${MONO}"`;
  ctx.fillStyle = c.accent;
  ctx.fillText('EXPERIENCE — per-line variable widths', left, secY - scrollY);

  let y = secY + sz(34);
  const dotX = left + sz(3);

  for (let i = 0; i < prepared.career.length; i++) {
    const item = prepared.career[i];
    const src = SECTIONS.career[i];
    const drawY = y - scrollY;
    if (drawY > H + 100) break;
    if (drawY < -250) { y += sz(160); continue; }

    const entryAlpha = Math.min(1, Math.max(0, (H * 0.85 - drawY) / (H * 0.2)));
    ctx.globalAlpha = alpha * entryAlpha;

    // Timeline dot
    ctx.fillStyle = hsl([168, 252, 18][i % 3], 80, isDark ? 60 : 45);
    ctx.beginPath(); ctx.arc(dotX, drawY + sz(10), sz(4), 0, Math.PI * 2); ctx.fill();

    // Timeline line
    if (i < prepared.career.length - 1) {
      ctx.strokeStyle = c.dim; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(dotX, drawY + sz(18)); ctx.lineTo(dotX, drawY + sz(145)); ctx.stroke();
    }

    const tLeft = left + sz(20);
    const tMaxW = maxW - sz(20);

    // Year
    ctx.font = `300 ${sz(12)}px "${MONO}"`;
    ctx.fillStyle = c.accent;
    ctx.fillText(src.year, tLeft, drawY);

    // Role
    ctx.font = `600 ${sz(17)}px "${FONT}"`;
    ctx.fillStyle = c.text;
    const { lines: roleLines } = pt.layoutWithLines(item.role, tMaxW, sz(24));
    for (let j = 0; j < roleLines.length; j++) ctx.fillText(roleLines[j].text, tLeft, drawY + sz(20) + j * sz(24));

    // Company
    const compY = drawY + sz(20) + roleLines.length * sz(24) + sz(4);
    ctx.font = `400 ${sz(13)}px "${MONO}"`;
    ctx.fillStyle = c.secondary;
    ctx.fillText(src.company, tLeft, compY);

    // ★ PRETEXT CAPABILITY 4: Detail with tapered line widths
    // Each successive line gets narrower, creating a funnel/diagonal edge
    const detailY = compY + sz(22);
    ctx.font = `400 ${sz(14)}px "${FONT}"`;
    ctx.fillStyle = c.secondary;

    let cursor = { segmentIndex: 0, graphemeIndex: 0 };
    let lineIdx = 0;
    let ly = detailY;
    const taperRate = sz(30); // pixels narrower per line

    while (lineIdx < 10) {
      const lineW = Math.max(tMaxW * 0.3, tMaxW - lineIdx * taperRate);
      const line = pt.layoutNextLine(item.detail, cursor, lineW);
      if (!line) break;

      // Draw a subtle guide line showing the taper boundary
      const guideX = tLeft + lineW;
      ctx.strokeStyle = hsl([168, 252, 18][i % 3], 40, isDark ? 30 : 70, 0.15);
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(guideX, ly - sz(12)); ctx.lineTo(guideX, ly + sz(5)); ctx.stroke();

      ctx.fillStyle = c.secondary;
      ctx.fillText(line.text, tLeft, ly);

      cursor = line.end;
      ly += sz(20);
      lineIdx++;
    }

    y += sz(160) + lineIdx * sz(6);
  }

  ctx.globalAlpha = 1;
}

// ═══════════════════════════════════════════════════════════
// CAPABILITY 5: Shrink-wrapped / balanced text blocks
// Project cards — use walkLineRanges to binary-search the
// tightest width that still fits N lines, then render
// ═══════════════════════════════════════════════════════════

function drawProjectCards() {
  if (!pt || !prepared.projects) return;

  const secY = sectionY(4);
  const alpha = sectionAlpha(secY);
  if (alpha <= 0) return;
  showBadge(4);

  const c = getColors();
  const left = pad();
  const maxW = contentW();
  const cardGap = sz(16);
  const cols = W < 640 ? 1 : 2;
  const cardMaxW = cols === 1 ? maxW : (maxW - cardGap) / 2;
  const cardPad = sz(14);

  ctx.globalAlpha = alpha;

  ctx.font = `500 ${sz(12)}px "${MONO}"`;
  ctx.fillStyle = c.accent;
  ctx.fillText('PROJECTS — shrink-wrapped balanced text', left, secY - scrollY);

  let colTops = [secY + sz(34), secY + sz(34)];

  for (let i = 0; i < prepared.projects.length; i++) {
    const proj = prepared.projects[i];
    const src = SECTIONS.projects[i];
    const col = cols === 1 ? 0 : (colTops[0] <= colTops[1] ? 0 : 1);
    const cardX = left + col * (cardMaxW + cardGap);
    const cardY = colTops[col];

    // ★ PRETEXT CAPABILITY 5: Shrink-wrap the description
    // Binary search for the narrowest width that keeps the same line count
    const fullW = cardMaxW - cardPad * 2;
    let bestW = fullW;
    let lineCount = 0;
    pt.walkLineRanges(proj.desc, fullW, () => { lineCount++; });

    if (lineCount > 0) {
      let lo = fullW * 0.3, hi = fullW;
      for (let step = 0; step < 8; step++) {
        const mid = (lo + hi) / 2;
        let midLines = 0;
        pt.walkLineRanges(proj.desc, mid, () => { midLines++; });
        if (midLines <= lineCount) { bestW = mid; hi = mid; }
        else { lo = mid; }
      }
    }

    // Calculate card height components
    const nameLineH = sz(22);
    const techLineH = sz(18);
    const descLineH = sz(19);
    const { lines: nameLines } = pt.layoutWithLines(proj.name, fullW, nameLineH);
    const { lines: techLines } = pt.layoutWithLines(proj.tech, fullW, techLineH);
    const { lines: descLines } = pt.layoutWithLines(proj.desc, bestW, descLineH);

    const cardH = cardPad + nameLines.length * nameLineH + sz(4) +
                  techLines.length * techLineH + sz(8) +
                  descLines.length * descLineH + cardPad;

    const dy = cardY - scrollY;
    if (dy < H + 100 && dy + cardH > -50) {
      // Card background
      ctx.fillStyle = isDark ? 'rgba(18,18,28,0.7)' : 'rgba(234,234,240,0.7)';
      roundRect(ctx, cardX, dy, cardMaxW, cardH, sz(6));
      ctx.fill();

      // Accent top border
      ctx.fillStyle = hsl([168, 252, 18, 200][i % 4], 70, isDark ? 55 : 45, 0.6);
      roundRect(ctx, cardX, dy, cardMaxW, 3, sz(6));
      ctx.fill();

      let textY = dy + cardPad;

      // Project name
      ctx.font = `600 ${sz(16)}px "${FONT}"`;
      ctx.fillStyle = c.text;
      for (const ln of nameLines) { ctx.fillText(ln.text, cardX + cardPad, textY + nameLineH * 0.75); textY += nameLineH; }
      textY += sz(4);

      // Tech stack
      ctx.font = `400 ${sz(11)}px "${MONO}"`;
      ctx.fillStyle = c.accent;
      for (const ln of techLines) { ctx.fillText(ln.text, cardX + cardPad, textY + techLineH * 0.7); textY += techLineH; }
      textY += sz(8);

      // Description — shrink-wrapped width!
      ctx.font = `400 ${sz(13)}px "${FONT}"`;
      ctx.fillStyle = c.secondary;
      for (const ln of descLines) { ctx.fillText(ln.text, cardX + cardPad, textY + descLineH * 0.7); textY += descLineH; }

      // Show the shrink-wrap boundary as a subtle dotted line
      const wrapX = cardX + cardPad + bestW;
      if (bestW < fullW - 5) {
        ctx.setLineDash([2, 3]);
        ctx.strokeStyle = hsl(168, 40, isDark ? 40 : 60, 0.2);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(wrapX, dy + cardPad + nameLines.length * nameLineH + techLines.length * techLineH + sz(12));
        ctx.lineTo(wrapX, dy + cardH - cardPad);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    colTops[col] = cardY + cardH + cardGap;
  }

  ctx.globalAlpha = 1;
}

// ═══════════════════════════════════════════════════════════
// CAPABILITY 6: Predictable measurement for virtualization
// Stats — layout() pre-computes heights, only render if
// the block is within the viewport (virtual scroll)
// ═══════════════════════════════════════════════════════════

function drawStatsVirtualized() {
  if (!pt || !prepared.stats) return;

  const secY = sectionY(5);
  const alpha = sectionAlpha(secY);
  if (alpha <= 0) return;
  showBadge(5);

  const c = getColors();
  const left = pad();
  const colW = contentW() / SECTIONS.stats.length;

  ctx.globalAlpha = alpha;

  ctx.font = `500 ${sz(12)}px "${MONO}"`;
  ctx.fillStyle = c.accent;
  ctx.fillText('BY THE NUMBERS — virtualized with layout()', left, secY - scrollY);

  const statsY = secY + sz(50);
  const accents = [c.accent, c.accentB, c.accentC, c.accent];

  for (let i = 0; i < SECTIONS.stats.length; i++) {
    const stat = SECTIONS.stats[i];
    const pStat = prepared.stats[i];

    // ★ PRETEXT CAPABILITY 6: pre-compute exact block height
    const { height: valH } = pt.layout(pStat.valueHeight, colW, sz(48));
    const { height: lblH } = pt.layout(pStat.labelHeight, colW, sz(18));
    const blockH = valH + lblH + sz(8);
    const blockTop = statsY;
    const blockBot = statsY + blockH;

    // Virtualization: skip rendering if entirely off-screen
    const screenTop = blockTop - scrollY;
    const screenBot = blockBot - scrollY;
    if (screenBot < -20 || screenTop > H + 20) continue;

    const x = left + i * colW + colW / 2;
    const drawStatY = statsY - scrollY + sz(10);

    // Value
    ctx.font = `700 ${sz(40)}px "${FONT}"`;
    ctx.textAlign = 'center';
    ctx.fillStyle = accents[i];
    const pulse = 1 + Math.sin(time * 2 + i) * 0.015;
    ctx.save();
    ctx.translate(x, drawStatY);
    ctx.scale(pulse, pulse);
    ctx.fillText(stat.value, 0, 0);
    ctx.restore();

    // Label
    ctx.font = `400 ${sz(12)}px "${MONO}"`;
    ctx.fillStyle = c.secondary;
    ctx.fillText(stat.label, x, drawStatY + sz(30));

    // Show computed height as a debug annotation
    ctx.font = `300 ${sz(9)}px "${MONO}"`;
    ctx.fillStyle = c.dim;
    ctx.fillText(`h=${Math.round(blockH)}px`, x, drawStatY + sz(48));
  }

  ctx.textAlign = 'left';
  ctx.globalAlpha = 1;
}

// ═══════════════════════════════════════════════════════════
// Background field particles
// ═══════════════════════════════════════════════════════════

const FIELD_WORDS = 'FIRMWARE·AI·DEBUG·CODE·SHIP·BUILD·FLASH·NVMe·PCIe·ARM·GNN·SSD'.split('·');

function initFieldParticles() {
  fieldParticles = [];
  const count = W < 640 ? 25 : W < 900 ? 40 : 60;
  for (let i = 0; i < count; i++) {
    fieldParticles.push({
      x: Math.random() * W, y: Math.random() * totalHeight,
      vx: (Math.random() - 0.5) * 0.25, vy: (Math.random() - 0.5) * 0.15,
      text: FIELD_WORDS[i % FIELD_WORDS.length],
      size: sz(8) + Math.random() * sz(5),
      alpha: 0.025 + Math.random() * 0.04, hue: Math.random() * 360,
    });
  }
}

function drawFieldParticles() {
  for (const p of fieldParticles) {
    p.x += p.vx; p.y += p.vy;
    if (p.x < -50) p.x = W + 50;
    if (p.x > W + 50) p.x = -50;
    const drawY = p.y - scrollY;
    if (drawY < -50 || drawY > H + 50) continue;
    const dx = p.x - smoothMouse.x, dy = drawY - smoothMouse.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const boost = dist < 180 ? (180 - dist) / 180 * 0.12 : 0;
    ctx.globalAlpha = p.alpha + boost;
    ctx.font = `300 ${p.size}px "${MONO}"`;
    ctx.fillStyle = hsl(p.hue + time * 8, 45, isDark ? 55 : 40);
    ctx.fillText(p.text, p.x, drawY);
  }
  ctx.globalAlpha = 1;
}

// ═══════════════════════════════════════════════════════════
// Section helpers
// ═══════════════════════════════════════════════════════════

function sectionY(idx) { return H * (0.8 + idx * 0.9); }

function sectionAlpha(y) {
  const viewY = y - scrollY;
  const enter = Math.min(1, Math.max(0, (H - viewY) / (H * 0.3)));
  const exit = Math.min(1, Math.max(0, (viewY + H * 0.5) / (H * 0.3)));
  return enter * exit;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// ═══════════════════════════════════════════════════════════
// Render loop
// ═══════════════════════════════════════════════════════════

function loop(t) {
  time = t * 0.001;
  smoothMouse.x += (mouse.x - smoothMouse.x) * 0.08;
  smoothMouse.y += (mouse.y - smoothMouse.y) * 0.08;
  const c = getColors();

  // Clear
  ctx.fillStyle = c.bg;
  ctx.fillRect(0, 0, W, H);

  drawFieldParticles();

  // Mouse spotlight
  if (smoothMouse.x > 0 && smoothMouse.y > 0) {
    const g = ctx.createRadialGradient(smoothMouse.x, smoothMouse.y, 0, smoothMouse.x, smoothMouse.y, sz(280));
    g.addColorStop(0, hsl(168 + time * 20, 55, isDark ? 28 : 58, 0.04));
    g.addColorStop(1, 'transparent');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }

  updateHeroChars();
  updateOrbs();

  // Draw all sections
  drawHero();                // Cap 1: Canvas text, no DOM hacks
  drawOrbs();
  drawBioReflow();           // Cap 3: Text around shapes (+ Cap 4 implicit per-line widths)
  drawSkillsMasonry();       // Cap 2: Height prediction → masonry
  drawCareerTapered();       // Cap 4: Per-line changing widths
  drawProjectCards();        // Cap 5: Shrink-wrapped balanced text
  drawStatsVirtualized();    // Cap 6: Predictable measurement / virtualization

  requestAnimationFrame(loop);
}

// ═══════════════════════════════════════════════════════════
// Boot
// ═══════════════════════════════════════════════════════════

init();
