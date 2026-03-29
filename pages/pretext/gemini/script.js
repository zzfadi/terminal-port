import {
  layout,
  layoutNextLine,
  layoutWithLines,
  prepare,
  prepareWithSegments,
  walkLineRanges,
} from 'https://esm.sh/@chenglou/pretext@0.0.2?bundle';

const profile = {
  name: 'Fadi Zuabi',
  role: 'Senior Firmware Engineer & AI Champion',
  company: 'Solidigm (SK Hynix)',
  location: 'Roseville, CA',
  tagline: 'Building bridges between hardware and AI. Helping engineers ship faster with intelligent tools.',
  flow: 'AI is the biggest leverage multiplier in engineering when it is grounded in real systems. This paragraph is routed one line at a time around moving nodes so each row can have a different available width.',
  balance: 'Make AI useful for people who build real systems.',
  skills: ['NVMe', 'PCIe Gen5', 'RAG', 'Firmware', 'DataIku', 'Snowflake', 'Mentorship', 'Automation', 'GCP', 'React'],
  forecastCards: [
    {
      title: 'AI adoption cohort',
      tag: '70% usage lift',
      body: 'Card height is predicted with layout() before render, then only the visible rows are painted into the viewport.',
    },
    {
      title: 'Firmware debug queue',
      tag: 'multi-LLM routing',
      body: 'Long summaries can be windowed into a visible slice while keeping scroll and spacing deterministic from measured text.',
    },
    {
      title: 'Engineer training digest',
      tag: '60+ engineers',
      body: 'Row heights stay stable across widths because the line count is computed in JavaScript instead of guessed from the DOM.',
    },
    {
      title: 'GEN5 execution log',
      tag: 'delivery lead',
      body: 'Virtualization becomes a text geometry problem: total height first, visible lines second, DOM probes never.',
    },
  ],
};

const sectionMeta = {
  intro: {
    title: 'Intro',
    kicker: 'Canvas text without DOM probes',
    copy: 'layoutWithLines() drives the centered headline and measured pill widths.',
  },
  flow: {
    title: 'Flow',
    kicker: 'Text flows around moving shapes',
    copy: 'layoutNextLine() recalculates each row against live obstacles and changing available widths.',
  },
  forecast: {
    title: 'Forecast',
    kicker: 'Predictive viewport math',
    copy: 'layout() predicts row heights before render so only the visible window is painted.',
  },
  balance: {
    title: 'Balance',
    kicker: 'Shrink-wrapped in JavaScript',
    copy: 'walkLineRanges() scores candidate widths, then the best multiline block is rendered on canvas.',
  },
};

const canvas = document.getElementById('pretext-canvas');
const ctx = canvas.getContext('2d');
const buttons = Array.from(document.querySelectorAll('.controls button'));
const sectionLabel = document.getElementById('sectionLabel');
const metricTitle = document.getElementById('metricTitle');
const metricText = document.getElementById('metricText');

const state = {
  width: window.innerWidth,
  height: window.innerHeight,
  dpr: Math.min(window.devicePixelRatio || 1, 2),
  currentSection: 'intro',
  pointer: { x: window.innerWidth * 0.5, y: window.innerHeight * 0.5, active: false },
  pills: [],
  cache: new Map(),
  forecast: { key: '', rows: [], totalHeight: 0, viewportHeight: 0 },
};

init();

async function init() {
  await document.fonts.ready;
  resize();
  seedPills();
  bindEvents();
  requestAnimationFrame(render);
}

function bindEvents() {
  window.addEventListener('resize', () => {
    state.cache.clear();
    state.forecast.key = '';
    resize();
    seedPills();
  }, { passive: true });

  window.addEventListener('pointermove', (event) => {
    state.pointer.x = event.clientX;
    state.pointer.y = event.clientY;
    state.pointer.active = true;
  });

  window.addEventListener('pointerleave', () => {
    state.pointer.active = false;
  });

  window.addEventListener('touchmove', (event) => {
    const touch = event.touches[0];
    if (!touch) return;
    state.pointer.x = touch.clientX;
    state.pointer.y = touch.clientY;
    state.pointer.active = true;
  }, { passive: true });

  window.addEventListener('touchend', () => {
    state.pointer.active = false;
  }, { passive: true });

  buttons.forEach((button) => {
    button.addEventListener('click', () => {
      buttons.forEach((candidate) => candidate.classList.remove('active'));
      button.classList.add('active');
      state.currentSection = button.dataset.section;
      updateSectionCopy();
    });
  });

  updateSectionCopy();
}

function resize() {
  state.width = window.innerWidth;
  state.height = window.innerHeight;
  state.dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.floor(state.width * state.dpr);
  canvas.height = Math.floor(state.height * state.dpr);
  canvas.style.width = `${state.width}px`;
  canvas.style.height = `${state.height}px`;
  ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
}

function seedPills() {
  const tokens = profile.skills;
  const count = state.width < 640 ? 14 : state.width < 900 ? 18 : 24;
  state.pills = Array.from({ length: count }, (_, index) => ({
    word: tokens[index % tokens.length],
    x: Math.random() * state.width,
    y: Math.random() * state.height,
    vx: (Math.random() - 0.5) * 0.3,
    vy: (Math.random() - 0.5) * 0.3,
    alpha: 0.08 + Math.random() * 0.12,
    hue: 165 + Math.random() * 110,
  }));
}

function fonts() {
  const viewport = Math.max(360, Math.min(1600, state.width));
  return {
    hero: `800 ${clamp(Math.round(viewport * 0.08), 32, 88)}px "Syne"`,
    sub: `600 ${clamp(Math.round(viewport * 0.022), 16, 24)}px "Syne"`,
    body: `500 ${clamp(Math.round(viewport * 0.018), 14, 19)}px "Syne"`,
    mono: `500 ${clamp(Math.round(viewport * 0.0115), 11, 13)}px "IBM Plex Mono"`,
    balance: `700 ${clamp(Math.round(viewport * 0.038), 20, 34)}px "Syne"`,
    title: `700 ${clamp(Math.round(viewport * 0.018), 15, 20)}px "Syne"`,
  };
}

function linesFor(text, font, maxWidth, lineHeight) {
  const key = `lines:${font}:${maxWidth}:${lineHeight}:${text}`;
  if (state.cache.has(key)) return state.cache.get(key);
  const lines = layoutWithLines(prepareWithSegments(text, font), maxWidth, lineHeight).lines;
  state.cache.set(key, lines);
  return lines;
}

function predictHeight(text, font, maxWidth, lineHeight) {
  const key = `height:${font}:${maxWidth}:${lineHeight}:${text}`;
  if (state.cache.has(key)) return state.cache.get(key);
  const value = layout(prepare(text, font), maxWidth, lineHeight).height;
  state.cache.set(key, value);
  return value;
}

function measureWidth(text, font) {
  const key = `width:${font}:${text}`;
  if (state.cache.has(key)) return state.cache.get(key);
  const prepared = prepareWithSegments(text, font);
  let width = 0;
  walkLineRanges(prepared, 1000, (line) => {
    width = Math.max(width, line.width);
  });
  state.cache.set(key, width);
  return width;
}

function updateSectionCopy() {
  const meta = sectionMeta[state.currentSection];
  sectionLabel.textContent = meta.title;
  metricTitle.textContent = meta.kicker;
  metricText.textContent = meta.copy;
}

function render(now) {
  const time = now * 0.001;
  drawBackground(time);

  if (state.currentSection === 'intro') renderIntro(time);
  if (state.currentSection === 'flow') renderFlow(time);
  if (state.currentSection === 'forecast') renderForecast(time);
  if (state.currentSection === 'balance') renderBalance(time);

  requestAnimationFrame(render);
}

function drawBackground(time) {
  const bg = ctx.createLinearGradient(0, 0, state.width, state.height);
  bg.addColorStop(0, getCss('--bg'));
  bg.addColorStop(1, getCss('--bg-2'));
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, state.width, state.height);

  const orbX = state.pointer.active ? state.pointer.x : state.width * (0.5 + Math.cos(time * 0.3) * 0.18);
  const orbY = state.pointer.active ? state.pointer.y : state.height * (0.46 + Math.sin(time * 0.22) * 0.14);
  const glow = ctx.createRadialGradient(orbX, orbY, 0, orbX, orbY, state.width * 0.28);
  glow.addColorStop(0, 'rgba(116, 226, 209, 0.22)');
  glow.addColorStop(1, 'transparent');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, state.width, state.height);

  const pillFont = fonts().mono;
  const pillHeight = getFontSize(pillFont) + 14;
  ctx.font = pillFont;
  ctx.textBaseline = 'middle';

  state.pills.forEach((pill) => {
    const dx = pill.x - orbX;
    const dy = pill.y - orbY;
    const dist = Math.hypot(dx, dy) || 1;
    if (dist < 160) {
      const force = (1 - dist / 160) * 0.12;
      pill.vx += (dx / dist) * force;
      pill.vy += (dy / dist) * force;
    }

    pill.vx += Math.sin(time * 0.4 + pill.hue) * 0.003;
    pill.vy += Math.cos(time * 0.33 + pill.hue) * 0.003;
    pill.vx *= 0.988;
    pill.vy *= 0.988;
    pill.x = wrap(pill.x + pill.vx, state.width, 70);
    pill.y = wrap(pill.y + pill.vy, state.height, 28);

    const pillWidth = measureWidth(pill.word, pillFont) + 18;
    const x = pill.x - pillWidth / 2;
    const y = pill.y - pillHeight / 2;

    ctx.globalAlpha = pill.alpha * 0.45;
    ctx.fillStyle = `hsla(${pill.hue}, 80%, 58%, 1)`;
    roundRect(x, y, pillWidth, pillHeight, pillHeight / 2);
    ctx.fill();
    ctx.strokeStyle = getCss('--line');
    ctx.stroke();

    ctx.globalAlpha = pill.alpha + 0.18;
    ctx.fillStyle = getCss('--text-primary');
    ctx.fillText(pill.word, x + 9, y + pillHeight / 2);
  });

  ctx.globalAlpha = 1;
}

function renderIntro(time) {
  const f = fonts();
  const titleLH = Math.round(getFontSize(f.hero) * 1.05);
  const subLH = Math.round(getFontSize(f.sub) * 1.35);
  const maxWidth = state.width < 900 ? state.width * 0.82 : state.width * 0.66;
  const titleLines = linesFor(profile.name, f.hero, maxWidth, titleLH);
  const subLines = linesFor(`${profile.role} · ${profile.location} · ${profile.company}`, f.sub, maxWidth, subLH);
  const proofFont = f.mono;
  const startY = state.height * 0.28;

  ctx.font = f.hero;
  ctx.textBaseline = 'top';
  titleLines.forEach((line, index) => {
    const x = (state.width - line.width) / 2 + Math.sin(time * 1.2 + index * 0.4) * 8;
    const y = startY + index * titleLH;
    ctx.fillStyle = index % 2 === 0 ? getCss('--accent') : getCss('--accent-c');
    ctx.fillText(line.text, x, y);
  });

  ctx.font = f.sub;
  subLines.forEach((line, index) => {
    const x = (state.width - line.width) / 2;
    const y = startY + titleLines.length * titleLH + 22 + index * subLH;
    ctx.fillStyle = getCss('--text-muted');
    ctx.fillText(line.text, x, y);
  });

  const proofY = startY + titleLines.length * titleLH + subLines.length * subLH + 54;
  drawProofPills([
    'Canvas text with deterministic measurement',
    'Shrink-wrapped labels in JS',
    'No hidden DOM probes',
  ], proofFont, proofY);
}

function renderFlow(time) {
  const f = fonts();
  const titleFont = f.sub;
  const bodyFont = f.body;
  const titleY = state.height * 0.18;
  const left = state.width < 900 ? state.width * 0.08 : state.width * 0.12;
  const right = state.width - left;
  const bodyTop = titleY + 80;
  const lineHeight = Math.round(getFontSize(bodyFont) * 1.55);

  const headingLines = linesFor('Text that routes around live nodes.', titleFont, state.width * 0.58, Math.round(getFontSize(titleFont) * 1.2));
  ctx.font = titleFont;
  ctx.textBaseline = 'top';
  headingLines.forEach((line, index) => {
    ctx.fillStyle = getCss('--accent-b');
    ctx.fillText(line.text, left, titleY + index * 28);
  });

  const nodes = [
    { x: state.width * 0.28 + Math.sin(time * 0.8) * 24, y: state.height * 0.42 + Math.cos(time * 0.6) * 24, r: 66 },
    { x: state.width * 0.64 + Math.cos(time * 0.7) * 28, y: state.height * 0.57 + Math.sin(time * 0.52) * 28, r: 82 },
  ];

  nodes.forEach((node, index) => {
    const glow = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, node.r * 1.8);
    glow.addColorStop(0, index === 0 ? 'rgba(124, 166, 255, 0.35)' : 'rgba(255, 157, 102, 0.3)');
    glow.addColorStop(1, 'transparent');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(node.x, node.y, node.r * 1.8, 0, Math.PI * 2);
    ctx.fill();
  });

  const prepared = prepareWithSegments(profile.flow, bodyFont);
  const baseline = layout(prepare(profile.flow, bodyFont), right - left, lineHeight).height;
  let cursor = { segmentIndex: 0, graphemeIndex: 0 };
  let y = bodyTop;
  let lineCount = 0;
  ctx.font = bodyFont;
  ctx.fillStyle = getCss('--text-primary');

  while (y < state.height - 80) {
    const segments = computeFreeSegments(y, left, right, nodes, lineHeight);
    if (!segments.length) {
      y += lineHeight;
      continue;
    }
    const slot = segments.reduce((best, segment) => (segment.width > best.width ? segment : best), segments[0]);
    const line = layoutNextLine(prepared, cursor, Math.max(120, slot.width - 10));
    if (!line) break;
    ctx.fillText(line.text, slot.start + 5, y);
    cursor = line.end;
    y += lineHeight;
    lineCount += 1;
  }

  metricText.textContent = `Baseline height from layout(): ${Math.round(baseline)}px · Rendered lines: ${lineCount} · Each row width is recomputed live.`;
}

function renderForecast(time) {
  const f = fonts();
  const viewportWidth = Math.min(state.width * 0.76, 760);
  const viewportHeight = clamp(state.height * 0.42, 250, 360);
  const x = (state.width - viewportWidth) / 2;
  const y = state.height * 0.24;
  const rows = buildForecast(viewportWidth - 28, viewportHeight);
  const maxScroll = Math.max(0, rows.totalHeight - viewportHeight + 18);
  const scroll = maxScroll * (0.5 + 0.5 * Math.sin(time * 0.26));
  const visible = rows.rows.filter((row) => row.y + row.height >= scroll && row.y <= scroll + viewportHeight);

  ctx.fillStyle = getCss('--panel-strong');
  roundRect(x, y, viewportWidth, viewportHeight, 22);
  ctx.fill();
  ctx.strokeStyle = getCss('--line');
  ctx.stroke();

  ctx.save();
  ctx.beginPath();
  ctx.rect(x + 8, y + 8, viewportWidth - 16, viewportHeight - 16);
  ctx.clip();

  visible.forEach((row) => {
    const rowY = y + 14 + row.y - scroll;
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    roundRect(x + 12, rowY, viewportWidth - 28, row.height - 10, 16);
    ctx.fill();
    ctx.strokeStyle = getCss('--line');
    ctx.stroke();

    const tagX = x + viewportWidth - row.tagWidth - 28;
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    roundRect(tagX, rowY + 12, row.tagWidth, 22, 11);
    ctx.fill();

    ctx.font = f.mono;
    ctx.textBaseline = 'middle';
    ctx.fillStyle = getCss('--accent-c');
    ctx.fillText(row.tag, tagX + 9, rowY + 23);

    ctx.font = f.title;
    ctx.textBaseline = 'top';
    ctx.fillStyle = getCss('--text-primary');
    row.titleLines.forEach((line, index) => {
      ctx.fillText(line.text, x + 24, rowY + 14 + index * row.titleLineHeight);
    });

    ctx.font = f.body;
    ctx.fillStyle = getCss('--text-muted');
    const bodyY = rowY + 18 + row.titleLines.length * row.titleLineHeight + 10;
    row.bodyLines.forEach((line, index) => {
      ctx.fillText(line.text, x + 24, bodyY + index * row.bodyLineHeight);
    });
  });
  ctx.restore();

  ctx.fillStyle = getCss('--accent-b');
  const thumbHeight = Math.max(36, (viewportHeight / rows.totalHeight) * viewportHeight);
  const thumbY = y + 10 + (scroll / rows.totalHeight) * Math.max(0, viewportHeight - thumbHeight - 18);
  roundRect(x + viewportWidth - 10, thumbY, 4, thumbHeight, 2);
  ctx.fill();

  metricText.textContent = `Predicted content height: ${Math.round(rows.totalHeight)}px · Visible rows: ${visible.length}/${rows.rows.length} · No hidden probes.`;
}

function renderBalance() {
  const f = fonts();
  const statement = profile.balance;
  const prepared = prepareWithSegments(statement, f.balance);
  const lineHeight = Math.round(getFontSize(f.balance) * 1.28);
  const minWidth = Math.max(180, state.width * 0.28);
  const maxWidth = Math.min(state.width * 0.7, 620);

  let best = null;
  for (let candidate = minWidth; candidate <= maxWidth; candidate += 8) {
    const widths = [];
    walkLineRanges(prepared, candidate, (line) => widths.push(line.width));
    if (!widths.length) continue;
    const mean = widths.reduce((sum, value) => sum + value, 0) / widths.length;
    const variance = widths.reduce((sum, value) => sum + (value - mean) ** 2, 0) / widths.length;
    const score = Math.abs(widths.length - 4) * 40 + variance * 0.08;
    if (!best || score < best.score) {
      best = { width: candidate, score };
    }
  }

  const lines = layoutWithLines(prepared, best.width, lineHeight).lines;
  const x = (state.width - best.width) / 2;
  const y = state.height * 0.28;
  const totalHeight = lines.length * lineHeight;

  ctx.fillStyle = getCss('--panel-strong');
  roundRect(x - 20, y - 24, best.width + 40, totalHeight + 56, 28);
  ctx.fill();
  ctx.strokeStyle = getCss('--line');
  ctx.stroke();

  ctx.font = f.balance;
  ctx.textBaseline = 'top';
  lines.forEach((line, index) => {
    const lineX = (state.width - line.width) / 2;
    const lineY = y + index * lineHeight;
    ctx.fillStyle = index % 2 === 0 ? getCss('--accent') : getCss('--accent-b');
    ctx.fillText(line.text, lineX, lineY);
    ctx.strokeStyle = 'rgba(124, 166, 255, 0.16)';
    ctx.beginPath();
    ctx.moveTo(lineX - 6, lineY + lineHeight - 4);
    ctx.lineTo(lineX + line.width + 6, lineY + lineHeight - 4);
    ctx.stroke();
  });

  drawProofPills(profile.skills.slice(0, 6), f.mono, y + totalHeight + 36);
  metricText.textContent = `Chosen width: ${Math.round(best.width)}px · Lines: ${lines.length} · Balanced with walkLineRanges().`;
}

function drawProofPills(labels, font, startY) {
  let x = (state.width - Math.min(state.width * 0.74, 760)) / 2;
  let y = startY;
  const maxWidth = state.width - x * 2;
  const pillHeight = getFontSize(font) + 14;
  ctx.font = font;
  ctx.textBaseline = 'middle';

  labels.forEach((label, index) => {
    const pillWidth = measureWidth(label, font) + 18;
    if (x + pillWidth > maxWidth + (state.width - maxWidth) / 2) {
      x = (state.width - Math.min(state.width * 0.74, 760)) / 2;
      y += pillHeight + 10;
    }
    ctx.fillStyle = index % 2 === 0 ? 'rgba(124, 166, 255, 0.12)' : 'rgba(255, 157, 102, 0.12)';
    roundRect(x, y, pillWidth, pillHeight, pillHeight / 2);
    ctx.fill();
    ctx.strokeStyle = getCss('--line');
    ctx.stroke();
    ctx.fillStyle = getCss('--text-primary');
    ctx.fillText(label, x + 9, y + pillHeight / 2);
    x += pillWidth + 10;
  });
}

function buildForecast(contentWidth, viewportHeight) {
  const key = `${Math.round(contentWidth)}:${Math.round(viewportHeight)}:${state.width}`;
  if (state.forecast.key === key) return state.forecast;

  const f = fonts();
  const titleLineHeight = Math.round(getFontSize(f.title) * 1.2);
  const bodyLineHeight = Math.round(getFontSize(f.body) * 1.55);
  const rows = [];
  let totalHeight = 0;

  profile.forecastCards.forEach((card) => {
    const tagWidth = measureWidth(card.tag, f.mono) + 18;
    const titleWidth = Math.max(140, contentWidth - tagWidth - 12);
    const titleLines = linesFor(card.title, f.title, titleWidth, titleLineHeight);
    const bodyLines = linesFor(card.body, f.body, contentWidth - 12, bodyLineHeight);
    const titleHeight = predictHeight(card.title, f.title, titleWidth, titleLineHeight);
    const bodyHeight = predictHeight(card.body, f.body, contentWidth - 12, bodyLineHeight);
    const height = 42 + titleHeight + bodyHeight + 14;

    rows.push({
      tag: card.tag,
      tagWidth,
      titleLines,
      bodyLines,
      titleLineHeight,
      bodyLineHeight,
      y: totalHeight,
      height,
    });
    totalHeight += height + 12;
  });

  state.forecast = { key, rows, totalHeight, viewportHeight };
  return state.forecast;
}

function computeFreeSegments(y, left, right, nodes, lineHeight) {
  const blocked = [];
  nodes.forEach((node) => {
    const radius = node.r + lineHeight * 0.35;
    const dy = Math.abs(y - node.y);
    if (dy >= radius) return;
    const dx = Math.sqrt(radius * radius - dy * dy);
    blocked.push({ start: Math.max(left, node.x - dx), end: Math.min(right, node.x + dx) });
  });

  if (!blocked.length) {
    return [{ start: left, end: right, width: right - left }];
  }

  blocked.sort((a, b) => a.start - b.start);
  const free = [];
  let cursor = left;
  blocked.forEach((span) => {
    if (span.start > cursor + 8) {
      free.push({ start: cursor, end: span.start, width: span.start - cursor });
    }
    cursor = Math.max(cursor, span.end);
  });
  if (cursor < right - 8) {
    free.push({ start: cursor, end: right, width: right - cursor });
  }
  return free;
}

function getCss(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function getFontSize(font) {
  const match = /([0-9]+)px/.exec(font);
  return match ? Number(match[1]) : 16;
}

function roundRect(x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

function wrap(value, limit, pad) {
  if (value < -pad) return limit + pad;
  if (value > limit + pad) return -pad;
  return value;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
