// DOOM Fire Portfolio — Powered by Pretext text measurement engine
// All text is measured/laid out by Pretext and rendered to canvas

let pt = null; // pretext module
const preparedCache = new Map();

// ── Pretext import ──────────────────────────────────────────────
async function loadPretext() {
  try {
    pt = await import('https://esm.sh/pretext@0.3.0');
    return true;
  } catch (e1) {
    try {
      pt = await import('https://esm.sh/@chenglou/pretext@0.0.2?bundle');
      return true;
    } catch (e2) {
      console.warn('Pretext unavailable, using fallback', e2);
      return false;
    }
  }
}

function getPrepared(text, font) {
  const key = `${font}::${text}`;
  if (preparedCache.has(key)) return preparedCache.get(key);
  try {
    const prepared = pt.prepareWithSegments
      ? pt.prepareWithSegments(text, font)
      : pt.prepare(text, font);
    preparedCache.set(key, prepared);
    return prepared;
  } catch {
    return null;
  }
}

// Lay out text into lines using pretext's layoutNextLine
function layoutLines(text, font, maxWidth) {
  const prepared = getPrepared(text, font);
  if (!prepared) return fallbackLayout(text, font, maxWidth);

  const lines = [];
  let cursor = { segmentIndex: 0, graphemeIndex: 0 };
  for (let i = 0; i < 200; i++) {
    let result;
    try {
      result = pt.layoutNextLine(prepared, cursor, maxWidth);
    } catch {
      break;
    }
    if (!result) break;
    lines.push({ text: result.text, width: result.width });
    cursor = result.end;
  }
  return lines.length > 0 ? lines : fallbackLayout(text, font, maxWidth);
}

// Canvas-based fallback when pretext unavailable
function fallbackLayout(text, font, maxWidth) {
  const measureCtx = document.createElement('canvas').getContext('2d');
  measureCtx.font = font;
  const words = text.split(' ');
  const lines = [];
  let current = '';
  for (const word of words) {
    const test = current ? current + ' ' + word : word;
    if (measureCtx.measureText(test).width > maxWidth && current) {
      lines.push({ text: current, width: measureCtx.measureText(current).width });
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push({ text: current, width: measureCtx.measureText(current).width });
  return lines;
}

// ── Fire Engine ─────────────────────────────────────────────────
const fireCanvas = document.getElementById('fireCanvas');
const fireCtx = fireCanvas.getContext('2d');
const textCanvas = document.getElementById('textCanvas');
const textCtx = textCanvas.getContext('2d');

const CHAR_W = 10;
const CHAR_H = 16;
let cols, rows;
let firePixels;

// Classic DOOM fire palette (37 entries)
const PALETTE = [
  [0x07,0x07,0x07],[0x1F,0x07,0x07],[0x2F,0x0F,0x07],[0x47,0x0F,0x07],
  [0x57,0x17,0x07],[0x67,0x1F,0x07],[0x77,0x1F,0x07],[0x8F,0x27,0x07],
  [0x9F,0x2F,0x07],[0xAF,0x3F,0x07],[0xBF,0x47,0x07],[0xC7,0x47,0x07],
  [0xDF,0x4F,0x07],[0xDF,0x57,0x07],[0xDF,0x57,0x07],[0xD7,0x5F,0x07],
  [0xD7,0x5F,0x07],[0xD7,0x67,0x0F],[0xCF,0x6F,0x0F],[0xCF,0x77,0x0F],
  [0xCF,0x7F,0x0F],[0xCF,0x87,0x17],[0xC7,0x87,0x17],[0xC7,0x8F,0x17],
  [0xC7,0x97,0x1F],[0xBF,0x9F,0x1F],[0xBF,0x9F,0x1F],[0xBF,0xA7,0x27],
  [0xBF,0xA7,0x27],[0xBF,0xAF,0x2F],[0xB7,0xAF,0x2F],[0xB7,0xB7,0x2F],
  [0xB7,0xB7,0x37],[0xCF,0xCF,0x6F],[0xDF,0xDF,0x9F],[0xEF,0xEF,0xC7],
  [0xFF,0xFF,0xFF],
];

// God mode palette (blue/cyan)
const PALETTE_GOD = [
  [0x07,0x07,0x07],[0x07,0x07,0x1F],[0x07,0x0F,0x2F],[0x07,0x0F,0x47],
  [0x07,0x17,0x57],[0x07,0x1F,0x67],[0x07,0x1F,0x77],[0x07,0x27,0x8F],
  [0x07,0x2F,0x9F],[0x07,0x3F,0xAF],[0x07,0x47,0xBF],[0x07,0x47,0xC7],
  [0x07,0x4F,0xDF],[0x07,0x57,0xDF],[0x07,0x57,0xDF],[0x07,0x5F,0xD7],
  [0x07,0x5F,0xD7],[0x0F,0x67,0xD7],[0x0F,0x6F,0xCF],[0x0F,0x77,0xCF],
  [0x0F,0x7F,0xCF],[0x17,0x87,0xCF],[0x17,0x87,0xC7],[0x17,0x8F,0xC7],
  [0x1F,0x97,0xC7],[0x1F,0x9F,0xBF],[0x1F,0x9F,0xBF],[0x27,0xA7,0xBF],
  [0x27,0xA7,0xBF],[0x2F,0xAF,0xBF],[0x2F,0xAF,0xB7],[0x2F,0xB7,0xB7],
  [0x37,0xB7,0xB7],[0x6F,0xCF,0xCF],[0x9F,0xDF,0xDF],[0xC7,0xEF,0xEF],
  [0xFF,0xFF,0xFF],
];

const MAX_FIRE = PALETTE.length - 1;
const FIRE_CHARS = ' .·:;░░▒▒▓▓██';

let godMode = false;
let mouseX = -1, mouseY = -1;
let scrollY = 0;

function resizeFire() {
  fireCanvas.width = window.innerWidth;
  fireCanvas.height = window.innerHeight;
  textCanvas.width = window.innerWidth;
  textCanvas.height = window.innerHeight;
  cols = Math.ceil(fireCanvas.width / CHAR_W);
  rows = Math.ceil(fireCanvas.height / CHAR_H);
  firePixels = new Uint8Array(cols * rows);
  for (let x = 0; x < cols; x++) {
    firePixels[(rows - 1) * cols + x] = MAX_FIRE;
  }
  preparedCache.clear();
}

function spreadFire() {
  // Classic DOOM: iterate top-down, sample from the row below
  for (let y = 0; y < rows - 1; y++) {
    for (let x = 0; x < cols; x++) {
      const belowIdx = (y + 1) * cols + x;
      const below = firePixels[belowIdx];
      if (below === 0) {
        firePixels[y * cols + x] = 0;
      } else {
        const rand = Math.random() * 3.0 | 0;
        const wind = rand & 1;
        const destX = Math.min(Math.max(x - wind + (Math.random() > 0.5 ? 1 : 0), 0), cols - 1);
        firePixels[y * cols + destX] = Math.max(0, below - (rand & 1));
      }
    }
  }
  // Mouse heat
  if (mouseX >= 0 && mouseY >= 0) {
    const cx = Math.floor(mouseX / CHAR_W);
    const cy = Math.floor(mouseY / CHAR_H);
    const r = 5;
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        const nx = cx + dx, ny = cy + dy;
        if (nx >= 0 && nx < cols && ny >= 0 && ny < rows) {
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < r) {
            const idx = ny * cols + nx;
            firePixels[idx] = Math.min(MAX_FIRE, firePixels[idx] + Math.floor((r - dist) / r * MAX_FIRE * 0.6));
          }
        }
      }
    }
  }
}

function renderFire() {
  fireCtx.fillStyle = '#000';
  fireCtx.fillRect(0, 0, fireCanvas.width, fireCanvas.height);
  const palette = godMode ? PALETTE_GOD : PALETTE;
  const fontSize = CHAR_H - 2;
  fireCtx.font = `${fontSize}px monospace`;
  fireCtx.textBaseline = 'top';
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const intensity = firePixels[y * cols + x];
      if (intensity === 0) continue;
      const color = palette[intensity];
      const charIdx = Math.floor(intensity / MAX_FIRE * (FIRE_CHARS.length - 1));
      fireCtx.fillStyle = `rgb(${color[0]},${color[1]},${color[2]})`;
      fireCtx.fillText(FIRE_CHARS[charIdx], x * CHAR_W, y * CHAR_H);
    }
  }
}

// ── Portfolio Content (all laid out by Pretext) ─────────────────

const SECTIONS = [
  {
    type: 'title',
    text: 'FADI ZUABI',
    font: '48px "Press Start 2P", monospace',
    color: '#cc0000',
    glow: 'rgba(255, 68, 0, 0.6)',
    align: 'center',
    marginBottom: 20,
  },
  {
    type: 'subtitle',
    text: 'SENIOR FIRMWARE ENGINEER & AI CHAMPION',
    font: '12px "Press Start 2P", monospace',
    color: '#ff6600',
    glow: 'rgba(255, 102, 0, 0.4)',
    align: 'center',
    marginBottom: 10,
  },
  {
    type: 'text',
    text: 'Building bridges between hardware and AI. Helping engineers ship faster with intelligent tools.',
    font: '15px "Share Tech Mono", monospace',
    color: '#888888',
    align: 'center',
    marginBottom: 30,
  },
  {
    type: 'divider',
    text: '☠  ☠  ☠',
    font: '24px monospace',
    color: '#cc0000',
    glow: 'rgba(204, 0, 0, 0.5)',
    align: 'center',
    marginBottom: 50,
  },
  // ── STATUS BAR ──
  {
    type: 'heading',
    text: '[ STATUS BAR ]',
    font: '14px "Press Start 2P", monospace',
    color: '#ff6600',
    glow: 'rgba(255, 102, 0, 0.4)',
    marginBottom: 20,
  },
  {
    type: 'stats',
    items: [
      { label: 'EXP', value: '5+', desc: 'YRS FIRMWARE' },
      { label: 'ARMY', value: '60+', desc: 'ENGINEERS' },
      { label: 'PWR', value: '70%', desc: 'AI ADOPTION' },
      { label: 'SPD', value: '90%', desc: 'CI/CD BOOST' },
    ],
    marginBottom: 50,
  },
  // ── WEAPONS ──
  {
    type: 'heading',
    text: '[ WEAPONS INVENTORY ]',
    font: '14px "Press Start 2P", monospace',
    color: '#ff6600',
    glow: 'rgba(255, 102, 0, 0.4)',
    marginBottom: 20,
  },
  {
    type: 'weapons',
    items: [
      { key: '1', name: 'C/C++', ammo: '█████' },
      { key: '2', name: 'NVMe / PCIe Gen4/Gen5', ammo: '█████' },
      { key: '3', name: 'RTOS / Linux Kernel', ammo: '████▄' },
      { key: '4', name: 'LLM Integration (GPT-4, Claude, Gemini)', ammo: '████▄' },
      { key: '5', name: 'Python / TypeScript / React', ammo: '████' },
      { key: '6', name: 'GCP / Firebase / DataIku', ammo: '███' },
      { key: '7', name: 'ARM / Xtensa Multi-core', ammo: '█████' },
    ],
    marginBottom: 50,
  },
  // ── LEVELS ──
  {
    type: 'heading',
    text: '[ LEVEL PROGRESSION ]',
    font: '14px "Press Start 2P", monospace',
    color: '#ff6600',
    glow: 'rgba(255, 102, 0, 0.4)',
    marginBottom: 20,
  },
  {
    type: 'levels',
    items: [
      {
        num: 'E1M1', name: 'GE AEROSPACE', detail: 'Embedded Software Engineer · Aircraft Systems · 2019-2021',
        achievements: ['First 4G-LTE Module in Aviation', 'CI/CD: 80-90% runtime reduction, $30k+ saved'],
      },
      {
        num: 'E1M2', name: 'INTEL', detail: 'Firmware Engineer · NAND Storage · 2021-2022',
        achievements: [],
      },
      {
        num: 'E1M3', name: 'SOLIDIGM (SK HYNIX)', detail: 'Senior Firmware Engineer · AI Champion · 2022-Present',
        achievements: ['GEN5 PCIe SSD Technical Product Lead', 'Intelligent Firmware Debug Agent', 'GitHub Copilot Enterprise Deployment'],
        current: true,
      },
    ],
    marginBottom: 50,
  },
  // ── KILL COUNT ──
  {
    type: 'heading',
    text: '[ KILL COUNT ]',
    font: '14px "Press Start 2P", monospace',
    color: '#ff6600',
    glow: 'rgba(255, 102, 0, 0.4)',
    marginBottom: 20,
  },
  {
    type: 'achievements',
    items: [
      { name: 'Intelligent Firmware Debug Agent', desc: 'AI-powered debugging · Multi-LLM orchestration · DataIku + Snowflake + GNN' },
      { name: 'GitHub Copilot Enterprise Deployment', desc: '70% adoption increase · 60+ senior engineers trained' },
      { name: 'GEN5 PCIe SSD', desc: 'Technical Product Lead · Cross-company firmware/validation liaison' },
    ],
    marginBottom: 50,
  },
  // ── TRAINING ──
  {
    type: 'heading',
    text: '[ TRAINING FACILITY ]',
    font: '14px "Press Start 2P", monospace',
    color: '#ff6600',
    glow: 'rgba(255, 102, 0, 0.4)',
    marginBottom: 20,
  },
  {
    type: 'text',
    text: 'UNIVERSITY OF ILLINOIS AT URBANA-CHAMPAIGN',
    font: '11px "Press Start 2P", monospace',
    color: '#ffcc00',
    marginBottom: 8,
  },
  {
    type: 'text',
    text: 'B.S. Electrical Engineering, 2019 — Focus: Embedded Systems, Digital Design',
    font: '14px "Share Tech Mono", monospace',
    color: '#cccccc',
    marginBottom: 50,
  },
  // ── WARP ZONES ──
  {
    type: 'heading',
    text: '[ WARP ZONES ]',
    font: '14px "Press Start 2P", monospace',
    color: '#ff6600',
    glow: 'rgba(255, 102, 0, 0.4)',
    marginBottom: 20,
  },
  {
    type: 'text',
    text: '[F1] GitHub: github.com/zzfadi   [F2] LinkedIn: linkedin.com/in/fadi-zuabi   [F3] X: x.com/fadi_zuabi   [F4] Email: fadi.b.zuabi@gmail.com   [F5] Web: zuabi.dev',
    font: '13px "Share Tech Mono", monospace',
    color: '#cccccc',
    marginBottom: 40,
  },
  // ── CHEAT ──
  {
    type: 'text',
    text: '--- Type IDDQD for GOD MODE ---',
    font: '11px "Press Start 2P", monospace',
    color: '#555555',
    align: 'center',
    marginBottom: 60,
  },
];

// Total content height calculated by pretext
let totalContentHeight = 0;
let contentLayoutCache = null;

function layoutAllContent() {
  const W = Math.min(textCanvas.width - 60, 860);
  const offsetX = (textCanvas.width - W) / 2;
  let y = 80;
  const laid = [];

  for (const section of SECTIONS) {
    if (section.type === 'stats') {
      // Stats: laid out as a grid row using pretext for each value
      const cellW = W / section.items.length;
      for (let i = 0; i < section.items.length; i++) {
        const s = section.items[i];
        const cx = offsetX + cellW * i + cellW / 2;
        // Label
        const labelFont = '9px "Press Start 2P", monospace';
        laid.push({ type: 'centeredText', text: s.label, font: labelFont, color: '#bb8800', x: cx, y, glow: null });
        // Value
        const valFont = '24px "Press Start 2P", monospace';
        laid.push({ type: 'centeredText', text: s.value, font: valFont, color: '#00cc00', x: cx, y: y + 18, glow: 'rgba(0, 204, 0, 0.5)' });
        // Desc
        const descFont = '9px "Share Tech Mono", monospace';
        laid.push({ type: 'centeredText', text: s.desc, font: descFont, color: '#888888', x: cx, y: y + 50 });
      }
      y += 70 + (section.marginBottom || 0);
      continue;
    }

    if (section.type === 'weapons') {
      const wFont = '13px "Share Tech Mono", monospace';
      const kFont = '10px "Press Start 2P", monospace';
      for (const w of section.items) {
        // Key
        laid.push({ type: 'text', text: `[${w.key}]`, font: kFont, color: '#ffcc00', x: offsetX, y });
        // Name — use pretext to lay out
        const nameLines = layoutLines(w.name, wFont, W - 200);
        for (const line of nameLines) {
          laid.push({ type: 'text', text: line.text, font: wFont, color: '#cccccc', x: offsetX + 50, y });
          y += 18;
        }
        y -= 18; // undo last increment to put ammo on same first line
        // Ammo bar
        laid.push({ type: 'text', text: w.ammo, font: '11px monospace', color: '#ff6600', x: offsetX + W - 80, y });
        y += 26;
      }
      y += section.marginBottom || 0;
      continue;
    }

    if (section.type === 'levels') {
      const numFont = '10px "Press Start 2P", monospace';
      const nameFont = '10px "Press Start 2P", monospace';
      const detailFont = '13px "Share Tech Mono", monospace';
      const achFont = '12px "Share Tech Mono", monospace';
      for (const lv of section.items) {
        const borderColor = lv.current ? '#ff6600' : '#551100';
        laid.push({ type: 'line', x1: offsetX, y1: y, x2: offsetX + 3, y2: y + 80, color: borderColor });
        laid.push({ type: 'text', text: lv.num, font: numFont, color: '#cc0000', x: offsetX + 12, y: y + 4 });
        laid.push({ type: 'text', text: lv.name, font: nameFont, color: '#ffcc00', x: offsetX + 80, y: y + 4 });
        // Detail — use pretext layout
        const detailLines = layoutLines(lv.detail, detailFont, W - 90);
        let dy = y + 24;
        for (const line of detailLines) {
          laid.push({ type: 'text', text: line.text, font: detailFont, color: '#888888', x: offsetX + 80, y: dy });
          dy += 18;
        }
        for (const ach of lv.achievements) {
          const achLines = layoutLines('★ ' + ach, achFont, W - 90);
          for (const line of achLines) {
            laid.push({ type: 'text', text: line.text, font: achFont, color: '#bb8800', x: offsetX + 80, y: dy });
            dy += 17;
          }
        }
        y = dy + 16;
      }
      y += section.marginBottom || 0;
      continue;
    }

    if (section.type === 'achievements') {
      const nameFont = '14px "Share Tech Mono", monospace';
      const descFont = '13px "Share Tech Mono", monospace';
      for (const a of section.items) {
        laid.push({ type: 'text', text: '☠', font: '22px monospace', color: '#cc0000', x: offsetX, y, glow: 'rgba(204,0,0,0.5)' });
        // Name
        const nameLines = layoutLines(a.name, nameFont, W - 40);
        let ny = y;
        for (const line of nameLines) {
          laid.push({ type: 'text', text: line.text, font: nameFont, color: '#ff6600', x: offsetX + 35, y: ny });
          ny += 19;
        }
        // Desc — pretext layout
        const descLines = layoutLines(a.desc, descFont, W - 40);
        for (const line of descLines) {
          laid.push({ type: 'text', text: line.text, font: descFont, color: '#888888', x: offsetX + 35, y: ny });
          ny += 17;
        }
        y = ny + 16;
      }
      y += section.marginBottom || 0;
      continue;
    }

    // Text, title, subtitle, heading, divider — all use pretext layout
    const font = section.font;
    const lines = layoutLines(section.text, font, W);
    const lineHeight = parseInt(font) * 1.4;

    for (const line of lines) {
      let x = offsetX;
      if (section.align === 'center') {
        x = (textCanvas.width - line.width) / 2;
      }
      laid.push({
        type: 'text',
        text: line.text,
        font,
        color: section.color || '#cccccc',
        glow: section.glow || null,
        x,
        y,
      });
      y += lineHeight;
    }
    y += section.marginBottom || 0;
  }

  totalContentHeight = y + 100;
  contentLayoutCache = laid;

  // Set body height for scrolling
  document.body.style.minHeight = (totalContentHeight + window.innerHeight * 0.5) + 'px';
}

function renderContent() {
  textCtx.clearRect(0, 0, textCanvas.width, textCanvas.height);
  if (!contentLayoutCache) return;

  const viewY = scrollY;
  const viewBottom = viewY + textCanvas.height;

  for (const item of contentLayoutCache) {
    const itemY = item.y - viewY;

    // Cull offscreen items
    if (itemY > textCanvas.height + 50 || itemY < -80) continue;

    if (item.type === 'line') {
      textCtx.strokeStyle = item.color;
      textCtx.lineWidth = 3;
      textCtx.beginPath();
      textCtx.moveTo(item.x1, item.y1 - viewY);
      textCtx.lineTo(item.x2, item.y2 - viewY);
      textCtx.stroke();
      continue;
    }

    // All text items — rendered via canvas after pretext layout
    if (item.glow) {
      textCtx.shadowColor = item.glow;
      textCtx.shadowBlur = 12;
    } else {
      textCtx.shadowColor = 'transparent';
      textCtx.shadowBlur = 0;
    }

    textCtx.font = item.font;
    textCtx.fillStyle = item.color;
    textCtx.textBaseline = 'top';

    if (item.type === 'centeredText') {
      textCtx.textAlign = 'center';
      textCtx.fillText(item.text, item.x, itemY);
      textCtx.textAlign = 'left';
    } else {
      textCtx.textAlign = 'left';
      textCtx.fillText(item.text, item.x, itemY);
    }
  }

  // Reset shadow
  textCtx.shadowColor = 'transparent';
  textCtx.shadowBlur = 0;
}

// ── Input ───────────────────────────────────────────────────────
document.addEventListener('mousemove', (e) => { mouseX = e.clientX; mouseY = e.clientY; });
document.addEventListener('mouseleave', () => { mouseX = -1; mouseY = -1; });

document.addEventListener('click', (e) => {
  const cx = Math.floor(e.clientX / CHAR_W);
  const cy = Math.floor(e.clientY / CHAR_H);
  const r = 10;
  for (let dy = -r; dy <= r; dy++) {
    for (let dx = -r; dx <= r; dx++) {
      const nx = cx + dx, ny = cy + dy;
      if (nx >= 0 && nx < cols && ny >= 0 && ny < rows) {
        if (Math.sqrt(dx * dx + dy * dy) < r) {
          firePixels[ny * cols + nx] = MAX_FIRE;
        }
      }
    }
  }
});

// IDDQD
let cheatBuffer = '';
document.addEventListener('keydown', (e) => {
  cheatBuffer += e.key.toLowerCase();
  if (cheatBuffer.length > 10) cheatBuffer = cheatBuffer.slice(-10);
  if (cheatBuffer.includes('iddqd')) {
    godMode = !godMode;
    cheatBuffer = '';
  }
});

window.addEventListener('scroll', () => {
  scrollY = window.scrollY;
  const hint = document.getElementById('scroll-hint');
  if (hint) hint.style.opacity = scrollY > 100 ? '0' : '';
}, { passive: true });

// ── Main Loop ───────────────────────────────────────────────────
function animate() {
  spreadFire();
  renderFire();
  renderContent();
  requestAnimationFrame(animate);
}

async function init() {
  resizeFire();
  const loaded = await loadPretext();

  // Wait for web fonts before measuring text
  await document.fonts.ready;

  document.getElementById('loading').classList.add('hidden');

  if (loaded) {
    console.log('Pretext loaded — all text measured and laid out by Pretext');
  } else {
    console.log('Running with canvas measureText fallback');
  }

  layoutAllContent();

  window.addEventListener('resize', () => {
    resizeFire();
    layoutAllContent();
  });

  animate();
}

init();
