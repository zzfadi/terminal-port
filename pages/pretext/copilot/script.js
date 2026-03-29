// ═══════════════════════════════════════════════════════════
// Magnetic Typography — Text that bends around you
// Uses Pretext layoutNextLine() for real-time text reflow
// around interactive orbs + kinetic hero characters
// ═══════════════════════════════════════════════════════════

const FONT = 'Space Grotesk';
const MONO = 'JetBrains Mono';

// ─── Content from profile.md ─────────────────────────────

const SECTIONS = {
  name: 'Fadi Zuabi',
  tagline: 'Firmware Engineer · AI Champion · Builder',
  bio: "I'm a firmware engineer who builds AI systems. UIUC grad, worked at GE Aerospace and Intel, now at Solidigm where I train engineers on AI tools and build systems that make firmware development smarter.",
  career: [
    { role: 'Senior Firmware Engineer & AI Champion', company: 'Solidigm (SK Hynix)', year: '2022–Now', detail: 'Leading AI adoption, 70% Copilot usage increase, trained 60+ engineers. GEN5 PCIe SSD tech lead.' },
    { role: 'Firmware Engineer, NAND Storage', company: 'Intel', year: '2021–2022', detail: 'SSD firmware, flash management, NVMe protocols, PCIe Gen4/Gen5.' },
    { role: 'Embedded Software Engineer', company: 'GE Aerospace', year: '2019–2021', detail: 'First 4G-LTE in aviation. CI/CD: 80–90% runtime reduction, $30k+ saved.' },
  ],
  education: 'B.S. Electrical Engineering — UIUC 2019',
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

// ─── State ───────────────────────────────────────────────

let pt = null; // pretext module
let canvas, ctx, dpr;
let W = 0, H = 0;
let mouse = { x: -9999, y: -9999 };
let smoothMouse = { x: -9999, y: -9999 };
let scrollY = 0;
let totalHeight = 0;
let hintHidden = false;
let isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
let time = 0;
let frameId = 0;

// Prepared text handles (Pretext)
const prepared = {};

// Orbs for text-reflow interaction
const orbs = [];

// Hero character positions
let heroChars = [];

// Background field particles
let fieldParticles = [];

// ─── Responsive helpers ──────────────────────────────────

function sz(base) {
  if (W < 640) return Math.round(base * 0.52);
  if (W < 900) return Math.round(base * 0.72);
  return Math.round(base);
}

function pad() {
  return W < 640 ? 20 : W < 900 ? 36 : Math.round(W * 0.08);
}

function contentW() {
  return Math.min(W - pad() * 2, 820);
}

// ─── Colors ──────────────────────────────────────────────

function getColors() {
  if (isDark) {
    return {
      bg: '#0a0a0f',
      text: '#e8e8f0',
      dim: '#3a3a4e',
      secondary: '#7a7a8e',
      accent: '#00d4aa',
      accentB: '#7c5cff',
      accentC: '#ff6b4a',
    };
  }
  return {
    bg: '#f4f4f8',
    text: '#1a1a2e',
    dim: '#b0b0c0',
    secondary: '#5a5a6e',
    accent: '#009975',
    accentB: '#5a3ed4',
    accentC: '#d94a2a',
  };
}

// ─── Gradient helpers ────────────────────────────────────

function lerpColor(a, b, t) {
  const ah = parseInt(a.slice(1), 16), bh = parseInt(b.slice(1), 16);
  const ar = (ah >> 16) & 0xff, ag = (ah >> 8) & 0xff, ab = ah & 0xff;
  const br = (bh >> 16) & 0xff, bg = (bh >> 8) & 0xff, bb = bh & 0xff;
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const b2 = Math.round(ab + (bb - ab) * t);
  return `rgb(${r},${g},${b2})`;
}

function hsl(h, s, l, a = 1) {
  return `hsla(${h % 360},${s}%,${l}%,${a})`;
}

// ═══════════════════════════════════════════════════════════
// Initialization
// ═══════════════════════════════════════════════════════════

async function init() {
  canvas = document.getElementById('canvas');
  ctx = canvas.getContext('2d');
  dpr = Math.min(window.devicePixelRatio || 1, 2);

  const isTouch = 'ontouchstart' in window;
  if (isTouch) document.getElementById('hint-text').textContent = 'tap & scroll';

  sizeCanvas();

  pt = await loadPretext();
  if (pt) prepareTexts();

  initOrbs();
  initHeroChars();
  initFieldParticles();

  // Events
  canvas.addEventListener('mousemove', (e) => {
    const r = canvas.getBoundingClientRect();
    mouse.x = e.clientX - r.left;
    mouse.y = e.clientY - r.top;
    hideHint();
  });
  canvas.addEventListener('mouseleave', () => { mouse.x = -9999; mouse.y = -9999; });

  canvas.addEventListener('touchmove', (e) => {
    const t = e.touches[0];
    const r = canvas.getBoundingClientRect();
    mouse.x = t.clientX - r.left;
    mouse.y = t.clientY - r.top;
    hideHint();
  }, { passive: true });
  canvas.addEventListener('touchend', () => { mouse.x = -9999; mouse.y = -9999; });

  window.addEventListener('scroll', () => { scrollY = window.scrollY; }, { passive: true });
  window.addEventListener('resize', onResize);

  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    isDark = e.matches;
  });

  loop(0);
}

async function loadPretext() {
  try {
    return await import('https://esm.sh/@chenglou/pretext@0.0.2?bundle');
  } catch {
    return null;
  }
}

function sizeCanvas() {
  W = window.innerWidth;
  H = window.innerHeight;
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  canvas.style.width = W + 'px';
  canvas.style.height = H + 'px';
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  totalHeight = H * 5;
  document.getElementById('scroll-spacer').style.height = totalHeight + 'px';
}

function onResize() {
  sizeCanvas();
  if (pt) prepareTexts();
  initOrbs();
  initHeroChars();
  initFieldParticles();
}

function hideHint() {
  if (!hintHidden) {
    hintHidden = true;
    document.getElementById('hint').classList.add('hidden');
  }
}

// ═══════════════════════════════════════════════════════════
// Pretext text preparation
// ═══════════════════════════════════════════════════════════

function prepareTexts() {
  const prep = pt.prepareWithSegments;

  prepared.name = prep(SECTIONS.name, `700 ${sz(72)}px "${FONT}"`);
  prepared.tagline = prep(SECTIONS.tagline, `400 ${sz(18)}px "${FONT}"`);
  prepared.bio = prep(SECTIONS.bio, `400 ${sz(16)}px "${FONT}"`);
  prepared.education = prep(SECTIONS.education, `400 ${sz(14)}px "${MONO}"`);

  prepared.career = SECTIONS.career.map(c => ({
    role: prep(c.role, `600 ${sz(18)}px "${FONT}"`),
    company: prep(c.company, `400 ${sz(14)}px "${MONO}"`),
    year: prep(c.year, `300 ${sz(13)}px "${MONO}"`),
    detail: prep(c.detail, `400 ${sz(14)}px "${FONT}"`),
  }));

  prepared.skills = SECTIONS.skills.map(s =>
    prep(s, `500 ${sz(13)}px "${MONO}"`)
  );

  prepared.stats = SECTIONS.stats.map(s => ({
    value: prep(s.value, `700 ${sz(42)}px "${FONT}"`),
    label: prep(s.label, `400 ${sz(12)}px "${MONO}"`),
  }));
}

// ═══════════════════════════════════════════════════════════
// Interactive orbs (obstacles for text reflow)
// ═══════════════════════════════════════════════════════════

function initOrbs() {
  orbs.length = 0;
  const count = W < 640 ? 2 : 3;
  for (let i = 0; i < count; i++) {
    orbs.push({
      x: pad() + contentW() * (0.3 + i * 0.25),
      y: H * 0.4 + i * 60,
      r: sz(40 + i * 12),
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.2,
      hue: [168, 252, 18][i],
      baseX: 0,
      baseY: 0,
    });
    orbs[i].baseX = orbs[i].x;
    orbs[i].baseY = orbs[i].y;
  }
}

function updateOrbs() {
  for (const o of orbs) {
    // Gentle floating
    o.x = o.baseX + Math.sin(time * 0.4 + o.hue) * sz(25);
    o.y = o.baseY + Math.cos(time * 0.3 + o.hue * 0.5) * sz(15);

    // Mouse repulsion
    const dx = o.x - smoothMouse.x;
    const dy = o.y - smoothMouse.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 200 && dist > 0) {
      const force = (200 - dist) / 200 * 30;
      o.x += (dx / dist) * force;
      o.y += (dy / dist) * force;
    }
  }
}

function drawOrbs(sectionOffset) {
  const c = getColors();
  for (const o of orbs) {
    const drawY = o.y - sectionOffset;
    if (drawY < -100 || drawY > H + 100) continue;

    // Glow
    const grad = ctx.createRadialGradient(o.x, drawY, 0, o.x, drawY, o.r * 2.5);
    grad.addColorStop(0, hsl(o.hue, 80, isDark ? 60 : 50, 0.15));
    grad.addColorStop(0.4, hsl(o.hue, 60, isDark ? 40 : 45, 0.06));
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(o.x, drawY, o.r * 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Core
    const coreGrad = ctx.createRadialGradient(o.x, drawY, 0, o.x, drawY, o.r);
    coreGrad.addColorStop(0, hsl(o.hue, 90, isDark ? 70 : 55, 0.5));
    coreGrad.addColorStop(0.7, hsl(o.hue, 70, isDark ? 50 : 40, 0.2));
    coreGrad.addColorStop(1, hsl(o.hue, 60, isDark ? 30 : 35, 0));
    ctx.fillStyle = coreGrad;
    ctx.beginPath();
    ctx.arc(o.x, drawY, o.r, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ═══════════════════════════════════════════════════════════
// Hero character physics
// ═══════════════════════════════════════════════════════════

function initHeroChars() {
  heroChars = [];
  const text = SECTIONS.name.toUpperCase();
  const fontSize = sz(90);
  ctx.font = `700 ${fontSize}px "${FONT}"`;

  let totalW = 0;
  const charWidths = [];
  for (const ch of text) {
    const w = ctx.measureText(ch).width;
    charWidths.push(w);
    totalW += w;
  }

  let x = (W - totalW) / 2;
  const y = H * 0.35;
  for (let i = 0; i < text.length; i++) {
    heroChars.push({
      char: text[i],
      homeX: x + charWidths[i] / 2,
      homeY: y,
      x: x + charWidths[i] / 2,
      y: y,
      vx: 0,
      vy: 0,
      w: charWidths[i],
      size: fontSize,
      angle: 0,
      angleV: 0,
    });
    x += charWidths[i];
  }
}

function updateHeroChars() {
  const scrollFade = Math.max(0, 1 - scrollY / (H * 0.6));
  for (const ch of heroChars) {
    // Mouse magnetic repulsion
    const dx = ch.x - smoothMouse.x;
    const dy = ch.y - smoothMouse.y + scrollY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const repulseR = sz(180);

    if (dist < repulseR && dist > 0 && scrollFade > 0.1) {
      const force = ((repulseR - dist) / repulseR) * 12;
      ch.vx += (dx / dist) * force;
      ch.vy += (dy / dist) * force;
      ch.angleV += (dx > 0 ? 1 : -1) * force * 0.003;
    }

    // Spring back to home
    const spring = 0.06;
    ch.vx += (ch.homeX - ch.x) * spring;
    ch.vy += (ch.homeY - ch.y) * spring;

    // Damping
    ch.vx *= 0.88;
    ch.vy *= 0.88;
    ch.angleV *= 0.92;

    ch.x += ch.vx;
    ch.y += ch.vy;
    ch.angle += ch.angleV;
    ch.angle *= 0.95; // angle spring back
  }
}

function drawHeroChars() {
  const scrollFade = Math.max(0, 1 - scrollY / (H * 0.6));
  if (scrollFade <= 0) return;

  const c = getColors();
  const accentColors = [c.accent, c.accentB, c.accentC];

  for (let i = 0; i < heroChars.length; i++) {
    const ch = heroChars[i];
    const drawY = ch.y - scrollY;
    if (drawY < -200 || drawY > H + 200) continue;

    const displacement = Math.sqrt((ch.x - ch.homeX) ** 2 + (ch.y - ch.homeY) ** 2);
    const colorMix = Math.min(displacement / 80, 1);
    const accentIdx = i % accentColors.length;

    ctx.save();
    ctx.translate(ch.x, drawY);
    ctx.rotate(ch.angle);
    ctx.font = `700 ${ch.size}px "${FONT}"`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.globalAlpha = scrollFade;

    // Shadow/glow when displaced
    if (colorMix > 0.05) {
      ctx.shadowColor = accentColors[accentIdx];
      ctx.shadowBlur = colorMix * 20;
    }

    ctx.fillStyle = lerpColor(
      isDark ? '#e8e8f0' : '#1a1a2e',
      accentColors[accentIdx],
      colorMix * 0.6
    );
    ctx.fillText(ch.char, 0, 0);
    ctx.shadowBlur = 0;
    ctx.restore();
  }
}

// ═══════════════════════════════════════════════════════════
// Background field particles
// ═══════════════════════════════════════════════════════════

const FIELD_CHARS = 'FIRMWARE·AI·DEBUG·CODE·SHIP·BUILD·SIGNAL·FLASH·NVMe·PCIe·ARM·GNN·SSD·NAND'.split('·');

function initFieldParticles() {
  fieldParticles = [];
  const count = W < 640 ? 30 : W < 900 ? 50 : 70;
  for (let i = 0; i < count; i++) {
    fieldParticles.push({
      x: Math.random() * W,
      y: Math.random() * totalHeight,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.2,
      text: FIELD_CHARS[i % FIELD_CHARS.length],
      size: sz(9) + Math.random() * sz(6),
      alpha: 0.03 + Math.random() * 0.05,
      hue: Math.random() * 360,
    });
  }
}

function drawFieldParticles() {
  ctx.font = `300 ${sz(10)}px "${MONO}"`;
  for (const p of fieldParticles) {
    p.x += p.vx;
    p.y += p.vy;
    if (p.x < -50) p.x = W + 50;
    if (p.x > W + 50) p.x = -50;
    const drawY = p.y - scrollY;
    if (drawY < -50 || drawY > H + 50) continue;

    // Subtle mouse proximity glow
    const dx = p.x - smoothMouse.x;
    const dy = drawY - smoothMouse.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const boost = dist < 200 ? (200 - dist) / 200 * 0.15 : 0;

    ctx.globalAlpha = p.alpha + boost;
    ctx.fillStyle = hsl(p.hue + time * 10, 50, isDark ? 60 : 40);
    ctx.font = `300 ${p.size}px "${MONO}"`;
    ctx.fillText(p.text, p.x, drawY);
  }
  ctx.globalAlpha = 1;
}

// ═══════════════════════════════════════════════════════════
// Section rendering with Pretext
// ═══════════════════════════════════════════════════════════

function sectionY(index) {
  return H * (0.8 + index * 0.85);
}

function sectionAlpha(y) {
  const viewY = y - scrollY;
  const enter = Math.min(1, Math.max(0, (H - viewY) / (H * 0.3)));
  const exit = Math.min(1, Math.max(0, (viewY + H * 0.5) / (H * 0.3)));
  return enter * exit;
}

// ─── Draw Bio with text reflow around orbs ───────────────

function drawBioSection() {
  if (!pt || !prepared.bio) return;

  const secY = sectionY(0);
  const alpha = sectionAlpha(secY);
  if (alpha <= 0) return;

  const c = getColors();
  const left = pad();
  const maxW = contentW();
  const lineH = sz(24);
  const viewOffset = scrollY;

  ctx.globalAlpha = alpha;

  // Section label
  ctx.font = `500 ${sz(12)}px "${MONO}"`;
  ctx.fillStyle = c.accent;
  ctx.fillText('ABOUT', left, secY - viewOffset);

  // Tagline
  const tagY = secY + sz(30) - viewOffset;
  ctx.font = `400 ${sz(18)}px "${FONT}"`;
  ctx.fillStyle = c.secondary;
  const { lines: tagLines } = pt.layoutWithLines(prepared.tagline, maxW, sz(28));
  for (let i = 0; i < tagLines.length; i++) {
    ctx.fillText(tagLines[i].text, left, tagY + i * sz(28));
  }

  // Bio text — reflow around orbs using layoutNextLine
  const bioY = tagY + tagLines.length * sz(28) + sz(24);
  ctx.font = `400 ${sz(16)}px "${FONT}"`;
  ctx.fillStyle = c.text;

  let cursor = { segmentIndex: 0, graphemeIndex: 0 };
  let y = bioY;
  let lineIdx = 0;

  while (lineIdx < 20) {
    // Calculate effective width at this y-position based on orb proximity
    let effectiveW = maxW;
    let xOffset = 0;

    for (const o of orbs) {
      const orbViewY = o.y;
      const dy = Math.abs(y - orbViewY);
      if (dy < o.r + lineH) {
        const indent = Math.sqrt(Math.max(0, (o.r + lineH) ** 2 - dy ** 2));
        if (o.x - left < maxW / 2) {
          // Orb on left side — indent from left
          const newLeft = o.x + indent;
          if (newLeft > left) {
            const shift = newLeft - left;
            effectiveW -= shift;
            xOffset = shift;
          }
        } else {
          // Orb on right side — reduce width
          effectiveW = Math.min(effectiveW, o.x - indent - left);
        }
      }
    }

    effectiveW = Math.max(effectiveW, 80);
    const line = pt.layoutNextLine(prepared.bio, cursor, effectiveW);
    if (!line) break;

    const drawY = y - viewOffset;
    if (drawY > -50 && drawY < H + 50) {
      ctx.fillText(line.text, left + xOffset, drawY);
    }

    cursor = line.end;
    y += lineH;
    lineIdx++;
  }

  ctx.globalAlpha = 1;
}

// ─── Draw Career timeline ───────────────────────────────

function drawCareerSection() {
  if (!pt || !prepared.career) return;

  const secY = sectionY(1);
  const alpha = sectionAlpha(secY);
  if (alpha <= 0) return;

  const c = getColors();
  const left = pad();
  const maxW = contentW();
  const viewOffset = scrollY;

  ctx.globalAlpha = alpha;

  // Section label
  ctx.font = `500 ${sz(12)}px "${MONO}"`;
  ctx.fillStyle = c.accent;
  ctx.fillText('EXPERIENCE', left, secY - viewOffset);

  let y = secY + sz(36);
  const timelineX = left + sz(3);

  for (let i = 0; i < prepared.career.length; i++) {
    const item = prepared.career[i];
    const drawY = y - viewOffset;
    const itemAlpha = Math.min(1, Math.max(0, (H * 0.8 - drawY) / (H * 0.2)));

    if (drawY > H + 100) break;
    if (drawY < -200) { y += sz(120); continue; }

    ctx.globalAlpha = alpha * itemAlpha;

    // Timeline dot
    ctx.fillStyle = hsl([168, 252, 18][i % 3], 80, isDark ? 60 : 45);
    ctx.beginPath();
    ctx.arc(timelineX, drawY + sz(10), sz(4), 0, Math.PI * 2);
    ctx.fill();

    // Timeline line
    if (i < prepared.career.length - 1) {
      ctx.strokeStyle = c.dim;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(timelineX, drawY + sz(18));
      ctx.lineTo(timelineX, drawY + sz(110));
      ctx.stroke();
    }

    const textLeft = left + sz(22);
    const textMaxW = maxW - sz(22);

    // Year
    ctx.font = `300 ${sz(13)}px "${MONO}"`;
    ctx.fillStyle = c.accent;
    const { lines: yearLines } = pt.layoutWithLines(item.year, textMaxW, sz(18));
    for (const ln of yearLines) ctx.fillText(ln.text, textLeft, drawY);

    // Role
    ctx.font = `600 ${sz(18)}px "${FONT}"`;
    ctx.fillStyle = c.text;
    const roleY = drawY + sz(22);
    const { lines: roleLines } = pt.layoutWithLines(item.role, textMaxW, sz(26));
    for (let j = 0; j < roleLines.length; j++) {
      ctx.fillText(roleLines[j].text, textLeft, roleY + j * sz(26));
    }

    // Company
    const compY = roleY + roleLines.length * sz(26) + sz(4);
    ctx.font = `400 ${sz(14)}px "${MONO}"`;
    ctx.fillStyle = c.secondary;
    const { lines: compLines } = pt.layoutWithLines(item.company, textMaxW, sz(20));
    for (const ln of compLines) ctx.fillText(ln.text, textLeft, compY);

    // Detail
    const detailY = compY + compLines.length * sz(20) + sz(8);
    ctx.font = `400 ${sz(14)}px "${FONT}"`;
    ctx.fillStyle = c.secondary;
    const { lines: detailLines } = pt.layoutWithLines(item.detail, textMaxW, sz(20));
    for (let j = 0; j < detailLines.length; j++) {
      ctx.fillText(detailLines[j].text, textLeft, detailY + j * sz(20));
    }

    y += sz(130) + detailLines.length * sz(10);
  }

  ctx.globalAlpha = 1;
}

// ─── Draw Skills cloud ──────────────────────────────────

function drawSkillsSection() {
  if (!pt || !prepared.skills) return;

  const secY = sectionY(2.4);
  const alpha = sectionAlpha(secY);
  if (alpha <= 0) return;

  const c = getColors();
  const left = pad();
  const viewOffset = scrollY;

  ctx.globalAlpha = alpha;

  // Section label
  ctx.font = `500 ${sz(12)}px "${MONO}"`;
  ctx.fillStyle = c.accent;
  ctx.fillText('SKILLS', left, secY - viewOffset);

  // Education
  const eduY = secY + sz(28) - viewOffset;
  ctx.font = `400 ${sz(14)}px "${MONO}"`;
  ctx.fillStyle = c.secondary;
  if (prepared.education) {
    const { lines } = pt.layoutWithLines(prepared.education, contentW(), sz(20));
    for (const ln of lines) ctx.fillText(ln.text, left, eduY);
  }

  // Skills as flowing tags
  let x = left;
  let y = secY + sz(60) - viewOffset;
  const gap = sz(10);
  const tagH = sz(28);
  const maxRight = left + contentW();

  for (let i = 0; i < SECTIONS.skills.length; i++) {
    const text = SECTIONS.skills[i];
    ctx.font = `500 ${sz(13)}px "${MONO}"`;
    const tw = ctx.measureText(text).width + sz(20);

    if (x + tw > maxRight && x > left) {
      x = left;
      y += tagH + gap;
    }

    const hueShift = (i / SECTIONS.skills.length) * 240 + time * 5;

    // Tag background
    const tagAlpha = 0.1 + (Math.sin(time + i * 0.5) * 0.05);
    ctx.fillStyle = hsl(hueShift, 60, isDark ? 40 : 55, tagAlpha);
    roundRect(ctx, x, y - tagH * 0.7, tw, tagH, sz(4));
    ctx.fill();

    // Tag border
    ctx.strokeStyle = hsl(hueShift, 50, isDark ? 50 : 45, 0.2);
    ctx.lineWidth = 1;
    roundRect(ctx, x, y - tagH * 0.7, tw, tagH, sz(4));
    ctx.stroke();

    // Tag text
    ctx.fillStyle = hsl(hueShift, 40, isDark ? 75 : 35, 0.9);
    ctx.fillText(text, x + sz(10), y);

    x += tw + gap;
  }

  ctx.globalAlpha = 1;
}

// ─── Draw Stats ─────────────────────────────────────────

function drawStatsSection() {
  if (!pt || !prepared.stats) return;

  const secY = sectionY(3.4);
  const alpha = sectionAlpha(secY);
  if (alpha <= 0) return;

  const c = getColors();
  const left = pad();
  const viewOffset = scrollY;
  const colW = contentW() / SECTIONS.stats.length;

  ctx.globalAlpha = alpha;

  // Section label
  ctx.font = `500 ${sz(12)}px "${MONO}"`;
  ctx.fillStyle = c.accent;
  ctx.fillText('BY THE NUMBERS', left, secY - viewOffset);

  const statsY = secY + sz(50) - viewOffset;
  const accentColors = [c.accent, c.accentB, c.accentC, c.accent];

  for (let i = 0; i < SECTIONS.stats.length; i++) {
    const stat = SECTIONS.stats[i];
    const x = left + i * colW + colW / 2;

    // Value
    ctx.font = `700 ${sz(42)}px "${FONT}"`;
    ctx.textAlign = 'center';
    ctx.fillStyle = accentColors[i % accentColors.length];

    // Subtle pulse effect
    const pulse = 1 + Math.sin(time * 2 + i) * 0.01;
    ctx.save();
    ctx.translate(x, statsY);
    ctx.scale(pulse, pulse);
    ctx.fillText(stat.value, 0, 0);
    ctx.restore();

    // Label
    ctx.font = `400 ${sz(12)}px "${MONO}"`;
    ctx.fillStyle = c.secondary;
    ctx.fillText(stat.label, x, statsY + sz(30));
  }

  ctx.textAlign = 'left';
  ctx.globalAlpha = 1;
}

// ═══════════════════════════════════════════════════════════
// Render loop
// ═══════════════════════════════════════════════════════════

function loop(t) {
  time = t * 0.001;

  // Smooth mouse
  const lerp = 0.08;
  smoothMouse.x += (mouse.x - smoothMouse.x) * lerp;
  smoothMouse.y += (mouse.y - smoothMouse.y) * lerp;

  const c = getColors();

  // Clear
  ctx.fillStyle = c.bg;
  ctx.fillRect(0, 0, W, H);

  // Background field
  drawFieldParticles();

  // Subtle radial gradient around mouse
  if (smoothMouse.x > 0 && smoothMouse.y > 0) {
    const grad = ctx.createRadialGradient(
      smoothMouse.x, smoothMouse.y, 0,
      smoothMouse.x, smoothMouse.y, sz(300)
    );
    grad.addColorStop(0, hsl(168 + time * 20, 60, isDark ? 30 : 60, 0.04));
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
  }

  // Update physics
  updateHeroChars();

  // Bio section orb offset
  const bioSecY = sectionY(0);
  updateOrbs();

  // Draw layers
  drawHeroChars();

  // Tagline under hero (static, fades with scroll)
  drawHeroTagline();

  drawOrbs(0);
  drawBioSection();
  drawCareerSection();
  drawSkillsSection();
  drawStatsSection();

  frameId = requestAnimationFrame(loop);
}

function drawHeroTagline() {
  const scrollFade = Math.max(0, 1 - scrollY / (H * 0.5));
  if (scrollFade <= 0) return;

  const c = getColors();
  ctx.globalAlpha = scrollFade * 0.7;
  ctx.font = `400 ${sz(16)}px "${FONT}"`;
  ctx.fillStyle = c.secondary;
  ctx.textAlign = 'center';
  ctx.fillText(SECTIONS.tagline, W / 2, H * 0.35 + sz(60) - scrollY);
  ctx.textAlign = 'left';
  ctx.globalAlpha = 1;
}

// ─── Utility ─────────────────────────────────────────────

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
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
// Boot
// ═══════════════════════════════════════════════════════════

init();
