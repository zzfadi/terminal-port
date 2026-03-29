import {
  prepareWithSegments,
  layoutWithLines,
  layoutNextLine,
  walkLineRanges,
} from 'https://esm.sh/@chenglou/pretext@0.0.2';

// ── Section Data ───────────────────────────────────────────────────────────────

const SECTIONS = [
  {
    id: 'identity',
    label: 'IDENTITY',
    accent: '#0ea5e9',
    accentRgb: '14,165,233',
    body:
      `Senior Firmware Engineer & AI Champion at Solidigm (SK Hynix), Roseville CA.\n\nBuilding bridges between hardware and AI. Helping engineers ship faster with intelligent tools.\n\nUIUC Electrical Engineering graduate (2019). Fluent in English and Arabic.`,
    ring: ['Solidigm', 'SK Hynix', 'Roseville', 'UIUC', 'EE 2019', 'AI Champion'],
  },
  {
    id: 'career',
    label: 'CAREER',
    accent: '#10b981',
    accentRgb: '16,185,129',
    body:
      `GE Aerospace (2019–2021): Embedded Software Engineer on aircraft systems. Led first 4G-LTE cellular module integration in aviation health monitoring. 80–90% CI/CD runtime reduction.\n\nIntel (2021–2022): Firmware Engineer on NAND storage products, PCIe interface.\n\nSolidigm (2022–Present): Senior Firmware Engineer and AI Champion. Technical Product Lead for GEN5 PCIe SSD across firmware, validation, and cross-company teams.`,
    ring: ['GE', '2019–21', 'Intel', '2021–22', 'Solidigm', '2022–Now'],
  },
  {
    id: 'skills',
    label: 'SKILLS',
    accent: '#f59e0b',
    accentRgb: '245,158,11',
    body:
      `Firmware & Embedded (5+ yrs): C/C++, NVMe, PCIe Gen4/Gen5, multi-core ARM and Xtensa, RTOS, Linux kernel. DO-178C aviation safety standard, MISRA C/C++.\n\nAI & ML (1.5+ yrs): LLM integration (GPT-4, Claude, Gemini), prompt engineering, RAG systems. DataIku, Snowflake, Vertex AI, Graph Neural Networks.\n\nCloud & Dev: GCP, Firebase, Python, TypeScript, React, Next.js.`,
    ring: ['C/C++', 'NVMe', 'PCIe 5', 'LLMs', 'RAG', 'GCP', 'Python'],
  },
  {
    id: 'projects',
    label: 'PROJECTS',
    accent: '#a78bfa',
    accentRgb: '167,139,250',
    body:
      `Intelligent Firmware Debug Agent: AI-powered multi-LLM orchestration system with Graph Neural Networks for predictive firmware debugging. Built on DataIku and Snowflake.\n\nGitHub Copilot Enterprise Deployment: Company-wide AI adoption framework at Solidigm. 70% adoption increase, 60+ senior engineers trained.\n\nGEN5 PCIe SSD: Technical Product Lead bridging firmware, validation, and cross-company teams.\n\nCI/CD Optimization (GE Aerospace): $30k+ annual savings, 80–90% runtime reduction via cloud-based static analysis.`,
    ring: ['Debug Agent', 'GNN', 'Copilot', '70%+', 'GEN5 SSD', '$30k saved'],
  },
];

const STATS = [
  { value: '5+', label: 'YRS FIRMWARE' },
  { value: '60+', label: 'ENGRS TRAINED' },
  { value: '70%', label: 'AI ADOPTION' },
  { value: '80-90%', label: 'CI/CD SAVED' },
];

// ── Canvas & State ─────────────────────────────────────────────────────────────

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d', { alpha: false });

let W = 0;
let H = 0;
let dpr = 1;
let currentSection = 0;
let computedLayout = null;
const mouse = { x: 0, y: 0 };

// ── Font Helpers ───────────────────────────────────────────────────────────────

const DISPLAY = 'Barlow Condensed';
const MONO = 'JetBrains Mono';

function df(size, weight = 700) {
  return `${weight} ${size}px '${DISPLAY}', sans-serif`;
}

function mf(size, weight = 400) {
  return `${weight} ${size}px '${MONO}', monospace`;
}

// ── Color Scheme ───────────────────────────────────────────────────────────────

function isDark() {
  return !window.matchMedia('(prefers-color-scheme: light)').matches;
}

function scheme() {
  const dark = isDark();
  return {
    bg: dark ? '#050914' : '#f0f4fa',
    grid: dark ? 'rgba(13,31,53,0.8)' : 'rgba(196,214,230,0.6)',
    textPrimary: dark ? '#dce8f5' : '#0d1426',
    textBody: dark ? '#7a9cb8' : '#3a5878',
    textMuted: dark ? '#2e4a66' : '#8ab0cc',
    innerCircle: dark ? '#0a1428' : '#ddeaf7',
    outerGlow: dark ? '#050914' : '#f0f4fa',
  };
}

// ── Pretext Layout Computation ─────────────────────────────────────────────────
//
// Showcases three Pretext APIs:
// 1. walkLineRanges   → binary search for shrink-wrapped name block
// 2. layoutNextLine   → body text with per-line varying widths around a circle
// 3. layoutWithLines  → balanced stat items at fixed widths

function computeLayout() {
  if (!W || !H) return;

  const section = SECTIONS[currentSection];
  const narrow = W < 640;

  // Radial element: positioned in right side of canvas
  const circleX = narrow ? W * 0.72 : W * 0.67;
  const circleY = H * 0.42;
  const circleR = narrow
    ? Math.min(W * 0.24, 110)
    : Math.min(W * 0.18, 200);

  // Text column
  const textLeft = narrow ? 22 : 52;
  const nameTopY = narrow ? 76 : 100;
  const nameFS = narrow ? 72 : Math.min(Math.floor(W * 0.095), 148);
  const nameLH = nameFS * 1.02;
  const nameFont = df(nameFS, 900);

  // ── 1. Shrink-wrap name using walkLineRanges binary search ─────────────────
  // Goal: find the minimum box width where "FADI ZUABI" fits exactly 2 lines.
  const namePrepared = prepareWithSegments('FADI\nZUABI', nameFont, { whiteSpace: 'pre-wrap' });

  let low = nameFS * 1.5;
  let high = W * 0.65;
  for (let i = 0; i < 24; i++) {
    const mid = (low + high) / 2;
    let lc = 0;
    walkLineRanges(namePrepared, mid, () => { lc++; });
    if (lc <= 2) high = mid;
    else low = mid;
  }
  const nameWidth = Math.ceil(high) + 2; // shrink-wrapped width
  const { lines: nameLines } = layoutWithLines(namePrepared, nameWidth, nameLH);
  const nameBlockH = nameLines.length * nameLH;

  // ── Role line ──────────────────────────────────────────────────────────────
  const roleFS = narrow ? 11 : 15;
  const roleLH = roleFS * 1.9;
  const roleY = nameTopY + nameBlockH + 8;

  // Measure role text width precisely
  ctx.font = mf(roleFS, 400);
  const roleText = narrow
    ? 'Firmware Engineer · AI Champion'
    : 'Senior Firmware Engineer & AI Champion';

  // ── 2. Body text flowing around circle via layoutNextLine ──────────────────
  // Each call gets the available line width at that Y, avoiding the circle.
  const bodyFS = narrow ? 12 : 13;
  const bodyLH = bodyFS * 1.85;
  const defaultWidth = narrow ? W - textLeft - 10 : W * 0.56;

  const bodyPrepared = prepareWithSegments(section.body, mf(bodyFS));
  const bodyStartY = roleY + roleLH + (narrow ? 12 : 18);

  let cursor = { segmentIndex: 0, graphemeIndex: 0 };
  let lineY = bodyStartY + bodyLH / 2;
  const bodyLines = [];
  const stopY = H - (narrow ? 90 : 100);

  while (lineY < stopY) {
    const avail = availableWidth(lineY, bodyLH, circleX, circleY, circleR, textLeft, defaultWidth);
    const line = layoutNextLine(bodyPrepared, cursor, Math.max(avail, 60));
    if (line === null) break;
    bodyLines.push({ text: line.text, x: textLeft, y: lineY, w: line.width });
    cursor = line.end;
    lineY += bodyLH;
  }

  // ── 3. Shrink-wrapped stat blocks using walkLineRanges ─────────────────────
  const statFS = narrow ? 9 : 10;
  const statLH = statFS * 1.8;
  const statLayouts = STATS.map(stat => {
    const t = `${stat.value}\n${stat.label}`;
    const p = prepareWithSegments(t, mf(statFS, 700), { whiteSpace: 'pre-wrap' });
    // Binary search: tightest width where block fits 2 lines
    let lo = 10, hi = 180;
    for (let i = 0; i < 18; i++) {
      const m = (lo + hi) / 2;
      let c = 0;
      walkLineRanges(p, m, () => { c++; });
      if (c <= 2) hi = m;
      else lo = m;
    }
    const w = Math.ceil(hi) + 1;
    const { lines } = layoutWithLines(p, w, statLH);
    return { lines, w, stat };
  });

  computedLayout = {
    section,
    narrow,
    circleX, circleY, circleR,
    textLeft,
    nameTopY, nameFont, nameLines, nameLH, nameBlockH, nameWidth,
    roleText, roleY, roleLH, roleFS,
    bodyFont: mf(bodyFS),
    bodyLines, bodyLH,
    statFont: mf(statFS, 700),
    statLH, statFS,
    statLayouts,
  };
}

// Returns available line width at lineY, reducing left-ward when a circle
// overlaps the text region from the right.
function availableWidth(lineY, lineH, cx, cy, cr, textX, defW) {
  let minW = defW;
  for (let t = -0.4; t <= 0.41; t += 0.4) {
    const y = lineY + t * lineH;
    const dy = y - cy;
    if (Math.abs(dy) < cr) {
      const dx = Math.sqrt(cr * cr - dy * dy);
      const circleLeft = cx - dx;
      if (circleLeft > textX && circleLeft < textX + defW) {
        minW = Math.min(minW, circleLeft - textX - 16);
      }
    }
  }
  return Math.max(minW, 60);
}

// ── Canvas Resize ──────────────────────────────────────────────────────────────

function resize() {
  dpr = window.devicePixelRatio || 1;
  W = window.innerWidth;
  H = window.innerHeight;
  mouse.x = W / 2;
  mouse.y = H / 2;
  canvas.width = Math.round(W * dpr);
  canvas.height = Math.round(H * dpr);
  canvas.style.width = W + 'px';
  canvas.style.height = H + 'px';
  ctx.scale(dpr, dpr);
  computeLayout();
}

window.addEventListener('resize', resize);
window.addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; });
window.addEventListener('touchmove', e => {
  mouse.x = e.touches[0].clientX;
  mouse.y = e.touches[0].clientY;
}, { passive: true });

// ── Render Loop ────────────────────────────────────────────────────────────────

let rafTime = 0;

function render(ts) {
  rafTime = ts / 1000;
  requestAnimationFrame(render);
  if (!computedLayout) return;

  const { section, narrow, circleX, circleY, circleR } = computedLayout;
  const c = scheme();

  // Parallax offset from mouse
  const px = (mouse.x / W - 0.5) * 18;
  const py = (mouse.y / H - 0.5) * 12;

  // ── Background ──────────────────────────────────────────────────────────────
  ctx.fillStyle = c.bg;
  ctx.fillRect(0, 0, W, H);
  drawGrid(c.grid);

  // ── Radial Element ──────────────────────────────────────────────────────────
  drawRadial(circleX + px * 0.85, circleY + py * 0.85, circleR, section, c, rafTime);

  // ── Name (shrink-wrapped via walkLineRanges) ─────────────────────────────────
  const { nameFont, nameLines, nameLH, nameTopY, nameBlockH, nameWidth, textLeft } = computedLayout;
  ctx.save();
  ctx.font = nameFont;
  ctx.textBaseline = 'top';
  ctx.fillStyle = c.textPrimary;
  nameLines.forEach((line, i) => {
    ctx.fillText(line.text, textLeft, nameTopY + i * nameLH);
  });
  ctx.restore();

  // Accent underline spanning exactly the shrink-wrapped name block width
  const accentColor = section.accent;
  const underY = nameTopY + nameBlockH + 3;
  ctx.save();
  ctx.strokeStyle = accentColor;
  ctx.lineWidth = 2;
  ctx.shadowColor = accentColor;
  ctx.shadowBlur = 10;
  ctx.beginPath();
  ctx.moveTo(textLeft, underY);
  ctx.lineTo(textLeft + nameWidth, underY);
  ctx.stroke();
  ctx.restore();

  // ── Role ────────────────────────────────────────────────────────────────────
  const { roleText, roleY, roleLH, roleFS } = computedLayout;
  ctx.save();
  ctx.font = mf(roleFS, 400);
  ctx.textBaseline = 'top';
  ctx.fillStyle = accentColor;
  ctx.fillText(roleText, textLeft, roleY);
  ctx.restore();

  // ── Body text (layoutNextLine, varying widths around circle) ────────────────
  const { bodyFont, bodyLines } = computedLayout;
  ctx.save();
  ctx.font = bodyFont;
  ctx.textBaseline = 'middle';
  ctx.fillStyle = c.textBody;
  bodyLines.forEach(line => {
    ctx.fillText(line.text, line.x, line.y);
  });
  ctx.restore();

  // ── Stats bar (layoutWithLines shrink-wrapped blocks) ───────────────────────
  drawStats(c, accentColor);
}

function drawGrid(color) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 0.5;
  const gx = 44;
  const gy = 44;
  for (let x = gx; x < W; x += gx) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
  }
  for (let y = gy; y < H; y += gy) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }
  // Dot intersections
  ctx.fillStyle = color.replace('0.8', '1').replace('0.6', '1');
  for (let x = gx; x < W; x += gx) {
    for (let y = gy; y < H; y += gy) {
      ctx.beginPath();
      ctx.arc(x, y, 0.8, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

function drawRadial(cx, cy, r, section, c, t) {
  const accent = section.accent;
  const rgb = section.accentRgb;

  // Outer ambient glow
  const outerGrad = ctx.createRadialGradient(cx, cy, r * 0.4, cx, cy, r * 1.8);
  outerGrad.addColorStop(0, `rgba(${rgb},0.12)`);
  outerGrad.addColorStop(1, `rgba(${rgb},0)`);
  ctx.fillStyle = outerGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 1.8, 0, Math.PI * 2);
  ctx.fill();

  // Filled circle background
  const innerGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
  innerGrad.addColorStop(0, c.innerCircle);
  innerGrad.addColorStop(1, c.bg);
  ctx.fillStyle = innerGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();

  // Circle border
  ctx.save();
  ctx.strokeStyle = accent;
  ctx.lineWidth = 1;
  ctx.shadowColor = accent;
  ctx.shadowBlur = 14;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // Inner dashed ring at 0.7r
  ctx.save();
  ctx.strokeStyle = `rgba(${rgb},0.25)`;
  ctx.lineWidth = 0.75;
  ctx.setLineDash([3, 5]);
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.7, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // Radar sweep
  const sweepA = (t * 0.55) % (Math.PI * 2);
  ctx.save();
  ctx.globalAlpha = 0.6;
  const sweepGrad = ctx.createLinearGradient(
    cx, cy,
    cx + Math.cos(sweepA) * r,
    cy + Math.sin(sweepA) * r
  );
  sweepGrad.addColorStop(0, `rgba(${rgb},0)`);
  sweepGrad.addColorStop(1, `rgba(${rgb},0.5)`);
  ctx.strokeStyle = sweepGrad;
  ctx.lineWidth = 1.2;
  ctx.shadowColor = accent;
  ctx.shadowBlur = 6;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + Math.cos(sweepA) * r, cy + Math.sin(sweepA) * r);
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.restore();

  // Orbiting ring labels
  const items = section.ring;
  items.forEach((item, i) => {
    const angle = (i / items.length) * Math.PI * 2 + t * 0.28;
    const orbitR = r * 1.3;
    const dotX = cx + Math.cos(angle) * orbitR;
    const dotY = cy + Math.sin(angle) * orbitR;

    // Connector line
    ctx.save();
    ctx.strokeStyle = `rgba(${rgb},0.2)`;
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r);
    ctx.lineTo(dotX, dotY);
    ctx.stroke();
    ctx.restore();

    // Dot
    ctx.save();
    ctx.fillStyle = accent;
    ctx.shadowColor = accent;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(dotX, dotY, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Label (skip on narrow)
    if (W >= 640) {
      const labelR = r * 1.62;
      const lx = cx + Math.cos(angle) * labelR;
      const ly = cy + Math.sin(angle) * labelR;
      ctx.save();
      ctx.font = mf(9, 400);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = `rgba(${rgb},0.75)`;
      ctx.fillText(item, lx, ly);
      ctx.restore();
    }
  });

  // Center initials
  const iFS = Math.floor(r * 0.52);
  ctx.save();
  ctx.font = df(iFS, 900);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = c.textPrimary;
  ctx.shadowColor = accent;
  ctx.shadowBlur = 24;
  ctx.fillText('FZ', cx, cy);
  ctx.restore();
}

function drawStats(c, accentColor) {
  if (!computedLayout) return;
  const { statLayouts, statFont, statLH, statFS, narrow } = computedLayout;
  const n = statLayouts.length;
  const colW = W / n;
  const baseY = H - (narrow ? 68 : 80);

  statLayouts.forEach(({ lines, w, stat }, i) => {
    const centerX = colW * i + colW / 2;

    // Shrink-fit bounding box outline
    const boxW = w + 14;
    const boxH = lines.length * statLH + 10;
    const boxX = centerX - boxW / 2;
    ctx.save();
    ctx.strokeStyle = c.textMuted;
    ctx.lineWidth = 0.5;
    ctx.strokeRect(boxX, baseY - 6, boxW, boxH);
    ctx.restore();

    // Stat value (first line, larger)
    const valFS = narrow ? 18 : 24;
    ctx.save();
    ctx.font = mf(valFS, 700);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = accentColor;
    ctx.shadowColor = accentColor;
    ctx.shadowBlur = 10;
    ctx.fillText(stat.value, centerX, baseY);
    ctx.restore();

    // Label (second line, smaller)
    ctx.save();
    ctx.font = mf(narrow ? 7 : 8, 400);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = c.textBody;
    ctx.fillText(stat.label, centerX, baseY + (narrow ? 22 : 28));
    ctx.restore();

    // Divider
    if (i > 0) {
      ctx.save();
      ctx.strokeStyle = c.textMuted;
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(colW * i, baseY - 10);
      ctx.lineTo(colW * i, baseY + (narrow ? 34 : 42));
      ctx.stroke();
      ctx.restore();
    }
  });
}

// ── Section Nav ────────────────────────────────────────────────────────────────

function setSection(idx) {
  currentSection = idx;
  document.querySelectorAll('.nav-btn').forEach((btn, i) => {
    btn.classList.toggle('active', i === idx);
  });
  // Update active button accent to match section color
  const accent = SECTIONS[idx].accent;
  document.querySelectorAll('.nav-btn.active').forEach(btn => {
    btn.style.color = accent;
    btn.style.borderColor = accent;
    btn.style.background = `rgba(${SECTIONS[idx].accentRgb},0.08)`;
  });
  computeLayout();
}

// ── Init ───────────────────────────────────────────────────────────────────────

document.querySelectorAll('.nav-btn').forEach(btn => {
  const idx = parseInt(btn.dataset.idx, 10);
  btn.addEventListener('click', () => setSection(idx));
});

// Wait for fonts before computing layout to ensure accurate measurements
document.fonts.ready.then(() => {
  resize();
  requestAnimationFrame(render);
});
