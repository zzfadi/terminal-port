import {
  layout,
  layoutNextLine,
  layoutWithLines,
  prepare,
  prepareWithSegments,
  walkLineRanges,
} from "https://esm.sh/@chenglou/pretext@0.0.2";

const profile = {
  name: "Fadi Zuabi",
  role: "Senior Firmware Engineer & AI Champion",
  company: "Solidigm (SK Hynix)",
  location: "Roseville, CA",
  tagline: "Building bridges between hardware and AI. Helping engineers ship faster with intelligent tools.",
  goal: "Make AI useful for people who build real systems.",
  bio: "I am a firmware engineer and AI builder. UIUC electrical engineering graduate. Career path from GE Aerospace to Intel and now Solidigm. I lead AI adoption programs, train engineering teams, and build intelligent systems that make firmware workflows faster and more reliable.",
  focus: "Leading AI adoption programs at Solidigm with 70% Copilot usage increase. Trained 60+ engineers. Built intelligent firmware debugging systems with DataIku, Snowflake, and graph neural networks. Technical Product Lead for GEN5 PCIe SSD delivery.",
  manifesto: "AI is a leverage multiplier for real-world engineering. The mission is not flashy demos. The mission is practical acceleration for teams shipping firmware, storage systems, and production infrastructure.",
  career: [
    {
      title: "Solidigm",
      span: "2022-Present",
      details: "Senior Firmware Engineer, AI Champion. Leading AI adoption and GEN5 PCIe SSD execution.",
    },
    {
      title: "Intel",
      span: "2021-2022",
      details: "Firmware Engineer focused on NAND storage systems and reliability.",
    },
    {
      title: "GE Aerospace",
      span: "2019-2021",
      details: "Embedded Software Engineer. Built cloud static analysis flow with 80-90% runtime reduction.",
    },
  ],
  skills: [
    "C/C++",
    "NVMe",
    "PCIe Gen5",
    "ARM",
    "Xtensa",
    "RTOS",
    "Linux Kernel",
    "LLM Integration",
    "RAG Systems",
    "GCP",
    "TypeScript",
    "React",
  ],
  stats: [
    { value: "5+", label: "Years in firmware engineering" },
    { value: "60+", label: "Engineers trained" },
    { value: "70%", label: "AI adoption increase" },
    { value: "80-90%", label: "CI/CD runtime reduction" },
  ],
  virtualCards: [
    {
      title: "AI Adoption Cohort",
      tag: "70% usage lift",
      body: "Predictive layout lets a feed know the card height before any hidden DOM probe. The viewport can schedule the row with stable scroll math from the start.",
    },
    {
      title: "Firmware Debug Agent",
      tag: "multi-LLM orchestration",
      body: "Longer operational notes can be measured in JS, windowed into a visible slice, and rendered only when they enter the simulated viewport.",
    },
    {
      title: "Engineer Training Runbook",
      tag: "60+ engineers trained",
      body: "Knowledge cards stay predictable across widths, so hydration and dynamic updates do not cause paragraph-height guesswork or jumpy layout.",
    },
    {
      title: "GEN5 Status Feed",
      tag: "technical product lead",
      body: "Row height is forecast with layout() first, then line detail is painted with rich layout only for rows that are actually visible to the user.",
    },
    {
      title: "CI/CD Incident Digest",
      tag: "80-90% runtime reduction",
      body: "This is the practical case: virtualization and layout-shift prevention become text geometry problems instead of DOM measurement loops.",
    },
  ],
};

const fieldCanvas = document.getElementById("fieldCanvas");
const heroCanvas = document.getElementById("heroCanvas");
const flowCanvas = document.getElementById("flowCanvas");
const radarCanvas = document.getElementById("radarCanvas");
const virtualCanvas = document.getElementById("virtualCanvas");
const balanceCanvas = document.getElementById("balanceCanvas");

const flowMetrics = document.getElementById("flowMetrics");
const radarMetrics = document.getElementById("radarMetrics");
const virtualMetrics = document.getElementById("virtualMetrics");
const balanceMetrics = document.getElementById("balanceMetrics");

const timelineEl = document.getElementById("careerTimeline");
const skillTagsEl = document.getElementById("skillTags");
const statGridEl = document.getElementById("statGrid");

const pointer = { x: -9999, y: -9999 };

const keywords = [
  "Firmware",
  "AI",
  "NVMe",
  "PCIe Gen5",
  "RAG",
  "Copilot",
  "DataIku",
  "Snowflake",
  "GNN",
  "Systems",
  "Storage",
  "Mentorship",
  "Automation",
  "Validation",
  "Reliability",
  "Leadership",
  "Scripting",
  "Architecture",
];

const flowNodes = [
  { x: 0.2, y: 0.18, r: 72, speed: 0.42, phase: 0.1 },
  { x: 0.55, y: 0.34, r: 84, speed: 0.52, phase: 1.3 },
  { x: 0.78, y: 0.56, r: 68, speed: 0.48, phase: 2.3 },
  { x: 0.32, y: 0.76, r: 74, speed: 0.57, phase: 0.7 },
];

const heroStatement = `${profile.tagline} ${profile.goal}`;
const flowNarrative = `${profile.bio} ${profile.focus}`;
const radarNarrative = `${profile.role}. ${profile.company}. Focus on firmware systems, enterprise AI adoption, and cross-functional execution.`;
const balanceStatement = profile.manifesto;

const state = {
  particles: [],
  heroGlyphs: [],
  heroHeight: 360,
  flowHeight: 440,
  balanceHeight: 230,
  balanced: null,
  prepared: null,
  radarData: [],
  radarBest: null,
  virtualRows: [],
  virtualHeight: 314,
  fonts: null,
  metrics: null,
  resizeTimer: null,
};

populateDomSections();
seedParticles();
bindEvents();
init();

async function init() {
  await waitForFonts();
  updateTypography();
  buildPreparedText();
  recomputeAllStaticLayouts();
  requestAnimationFrame(render);
}

function populateDomSections() {
  timelineEl.innerHTML = profile.career
    .map(
      (item) => `
      <li>
        <span class="timeline-dot" aria-hidden="true"></span>
        <div>
          <strong>${item.title} · ${item.span}</strong>
          <p>${item.details}</p>
        </div>
      </li>`,
    )
    .join("");

  skillTagsEl.innerHTML = profile.skills.map((skill) => `<li>${skill}</li>`).join("");

  statGridEl.innerHTML = profile.stats
    .map((stat) => `<div><dt>${stat.value}</dt><dd>${stat.label}</dd></div>`)
    .join("");
}

function bindEvents() {
  window.addEventListener("pointermove", (event) => {
    pointer.x = event.clientX;
    pointer.y = event.clientY;
  });

  window.addEventListener("pointerleave", () => {
    pointer.x = -9999;
    pointer.y = -9999;
  });

  window.addEventListener(
    "touchmove",
    (event) => {
      const touch = event.touches[0];
      if (touch) {
        pointer.x = touch.clientX;
        pointer.y = touch.clientY;
      }
    },
    { passive: true },
  );

  window.addEventListener("touchend", () => {
    pointer.x = -9999;
    pointer.y = -9999;
  });

  window.addEventListener("resize", () => {
    window.clearTimeout(state.resizeTimer);
    state.resizeTimer = window.setTimeout(() => {
      updateTypography();
      buildPreparedText();
      recomputeAllStaticLayouts();
    }, 120);
  });
}

function seedParticles() {
  state.particles = Array.from({ length: 86 }, () => ({
    x: Math.random(),
    y: Math.random(),
    vx: (Math.random() - 0.5) * 0.00068,
    vy: (Math.random() - 0.5) * 0.00062,
    word: keywords[Math.floor(Math.random() * keywords.length)],
    size: 11 + Math.random() * 13,
    hue: 160 + Math.random() * 95,
    depth: 0.4 + Math.random() * 1.2,
  }));
}

function updateTypography() {
  const viewport = Math.max(360, Math.min(1600, window.innerWidth));
  const heroSize = clamp(Math.round(viewport * 0.074), 34, 80);
  const flowSize = clamp(Math.round(viewport * 0.019), 15, 19);
  const balanceSize = clamp(Math.round(viewport * 0.028), 20, 29);
  const virtualTitleSize = clamp(Math.round(viewport * 0.017), 15, 20);
  const virtualBodySize = clamp(Math.round(viewport * 0.014), 12, 15);
  const fieldSize = clamp(Math.round(viewport * 0.011), 10, 13);

  state.fonts = {
    hero: `700 ${heroSize}px "Sora"`,
    flow: `500 ${flowSize}px "Sora"`,
    radar: `500 ${Math.max(12, flowSize - 2)}px "Space Mono"`,
    balance: `600 ${balanceSize}px "Sora"`,
    virtualTitle: `700 ${virtualTitleSize}px "Sora"`,
    virtualBody: `500 ${virtualBodySize}px "Sora"`,
    field: `600 ${fieldSize}px "Space Mono"`,
    tiny: '500 11px "Space Mono"',
  };

  state.metrics = {
    heroLineHeight: Math.round(heroSize * 1.17),
    flowLineHeight: Math.round(flowSize * 1.58),
    radarLineHeight: Math.round((flowSize - 2) * 1.58),
    balanceLineHeight: Math.round(balanceSize * 1.35),
    virtualTitleLineHeight: Math.round(virtualTitleSize * 1.25),
    virtualBodyLineHeight: Math.round(virtualBodySize * 1.52),
    fieldHeight: Math.round(fieldSize + 14),
  };
}

function buildPreparedText() {
  const fieldWords = new Map(
    keywords.map((word) => {
      const prepared = prepareWithSegments(word, state.fonts.field);
      let width = 0;
      walkLineRanges(prepared, 1000, (line) => {
        width = Math.max(width, line.width);
      });
      return [word, { prepared, width }];
    }),
  );

  state.prepared = {
    hero: prepareWithSegments(heroStatement, state.fonts.hero),
    flow: prepareWithSegments(flowNarrative, state.fonts.flow),
    flowMeasure: prepare(flowNarrative, state.fonts.flow),
    radarMeasure: prepare(radarNarrative, state.fonts.radar),
    balance: prepareWithSegments(balanceStatement, state.fonts.balance),
    fieldWords,
    virtualCards: profile.virtualCards.map((card) => ({
      ...card,
      tagRich: prepareWithSegments(card.tag, state.fonts.tiny),
      titleMeasure: prepare(card.title, state.fonts.virtualTitle),
      titleRich: prepareWithSegments(card.title, state.fonts.virtualTitle),
      bodyMeasure: prepare(card.body, state.fonts.virtualBody),
      bodyRich: prepareWithSegments(card.body, state.fonts.virtualBody),
    })),
  };
}

function recomputeAllStaticLayouts() {
  rebuildHeroGlyphs();
  recomputeRadarData();
  recomputeVirtualRows();
  recomputeBalancedBlock();
}

function rebuildHeroGlyphs() {
  const width = Math.max(300, heroCanvas.clientWidth || 300);
  const maxWidth = Math.max(200, width - 56);
  const lineHeight = state.metrics.heroLineHeight;
  const { lines } = layoutWithLines(state.prepared.hero, maxWidth, lineHeight);

  const scratch = document.createElement("canvas").getContext("2d");
  scratch.font = state.fonts.hero;
  state.heroGlyphs = [];

  lines.forEach((line, lineIndex) => {
    const baseY = 84 + lineIndex * lineHeight;
    const lineW = scratch.measureText(line.text).width;
    let x = (width - lineW) * 0.5;

    for (const ch of line.text) {
      const w = scratch.measureText(ch).width;
      state.heroGlyphs.push({
        ch,
        x,
        y: baseY,
        baseX: x,
        baseY,
        vx: 0,
        vy: 0,
        hue: 172 + ((lineIndex * 22 + x * 0.07) % 145),
      });
      x += w;
    }
  });

  state.heroHeight = Math.max(340, lines.length * lineHeight + 156);
}

function recomputeRadarData() {
  const width = Math.max(310, radarCanvas.clientWidth || 310);
  const minW = Math.max(180, Math.round(width * 0.34));
  const maxW = Math.max(minW + 60, width - 30);

  const points = [];
  for (let candidate = minW; candidate <= maxW; candidate += 10) {
    const measurement = layout(state.prepared.radarMeasure, candidate, state.metrics.radarLineHeight);
    let maxLine = 0;
    walkLineRanges(state.prepared.balance, candidate, (line) => {
      maxLine = Math.max(maxLine, line.width);
    });

    points.push({
      width: candidate,
      height: measurement.height,
      lines: measurement.lineCount,
      longestLine: maxLine,
    });
  }

  state.radarData = points;
  state.radarBest = points.reduce((best, point) => {
    if (!best) return point;
    const pointScore = Math.abs(point.lines - 4) * 32 + Math.abs(point.width - point.longestLine) * 0.6;
    const bestScore = Math.abs(best.lines - 4) * 32 + Math.abs(best.width - best.longestLine) * 0.6;
    return pointScore < bestScore ? point : best;
  }, null);

  if (state.radarBest) {
    radarMetrics.textContent = `Best predictive width: ${Math.round(state.radarBest.width)}px | Height: ${Math.round(state.radarBest.height)}px | Lines: ${state.radarBest.lines}`;
  }
}

function recomputeBalancedBlock() {
  const width = Math.max(300, balanceCanvas.clientWidth || 300);
  const minW = Math.max(200, Math.round(width * 0.48));
  const maxW = Math.max(minW + 20, width - 24);

  let best = null;

  for (let candidate = minW; candidate <= maxW; candidate += 8) {
    const lineWidths = [];
    walkLineRanges(state.prepared.balance, candidate, (line) => {
      lineWidths.push(line.width);
    });

    const count = lineWidths.length;
    if (!count) continue;

    const mean = lineWidths.reduce((sum, value) => sum + value, 0) / count;
    const variance = lineWidths.reduce((sum, value) => sum + (value - mean) ** 2, 0) / count;
    const widest = Math.max(...lineWidths);
    const score = Math.abs(count - 5) * 54 + variance * 0.06 + Math.abs(candidate - widest) * 0.9;

    if (!best || score < best.score) {
      best = { width: candidate, score, count };
    }
  }

  const selected = best || { width: maxW, score: 0, count: 0 };
  state.balanced = {
    ...selected,
    lines: layoutWithLines(state.prepared.balance, selected.width, state.metrics.balanceLineHeight).lines,
  };

  state.balanceHeight = Math.max(210, state.balanced.lines.length * state.metrics.balanceLineHeight + 90);
  balanceMetrics.textContent = `Shrink-wrap width: ${Math.round(state.balanced.width)}px | Lines: ${state.balanced.lines.length} | Balance score: ${Math.round(state.balanced.score)}`;
}

function recomputeVirtualRows() {
  const width = Math.max(300, virtualCanvas.clientWidth || 300);
  const viewportHeight = clamp(Math.round(width * 0.54), 230, 290);
  const contentWidth = Math.max(220, width - 52);
  let offsetY = 0;

  state.virtualRows = state.prepared.virtualCards.map((card, index) => {
    const tagWidth = measurePreparedWidth(card.tagRich) + 18;
    const titleWidth = Math.max(140, contentWidth - tagWidth - 18);
    const titleLayout = layoutWithLines(card.titleRich, titleWidth, state.metrics.virtualTitleLineHeight);
    const bodyLayout = layoutWithLines(card.bodyRich, contentWidth, state.metrics.virtualBodyLineHeight);
    const predictedTitle = layout(card.titleMeasure, titleWidth, state.metrics.virtualTitleLineHeight).height;
    const predictedBody = layout(card.bodyMeasure, contentWidth, state.metrics.virtualBodyLineHeight).height;
    const rowHeight = 44 + predictedTitle + predictedBody;

    const row = {
      ...card,
      index,
      y: offsetY,
      rowHeight,
      tagWidth,
      titleLines: titleLayout.lines,
      bodyLines: bodyLayout.lines,
    };

    offsetY += rowHeight + 14;
    return row;
  });

  state.virtualHeight = viewportHeight;
}

function render(time) {
  drawField(time);
  drawHero(time);
  drawFlow(time);
  drawRadar(time);
  drawVirtualization(time);
  drawBalance(time);
  requestAnimationFrame(render);
}

function fitCanvas(canvas, targetHeight) {
  const dpr = window.devicePixelRatio || 1;
  const bounds = canvas.getBoundingClientRect();
  const width = Math.max(1, Math.floor(bounds.width));
  const height = Math.max(1, Math.floor(targetHeight ?? bounds.height));

  if (canvas.width !== Math.floor(width * dpr) || canvas.height !== Math.floor(height * dpr)) {
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
  }

  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  return { ctx, width, height, bounds };
}

function drawField(time) {
  const { ctx, width, height } = fitCanvas(fieldCanvas, window.innerHeight);
  const t = time * 0.001;
  ctx.clearRect(0, 0, width, height);

  const radial = ctx.createRadialGradient(
    width * 0.44,
    height * 0.42,
    width * 0.1,
    width * 0.44,
    height * 0.42,
    width * 0.9,
  );
  radial.addColorStop(0, "rgba(36, 137, 120, 0.18)");
  radial.addColorStop(0.55, "rgba(31, 113, 197, 0.08)");
  radial.addColorStop(1, "rgba(219, 111, 58, 0.03)");
  ctx.fillStyle = radial;
  ctx.fillRect(0, 0, width, height);

  for (const p of state.particles) {
    const px = p.x * width;
    const py = p.y * height;
    const dx = px - pointer.x;
    const dy = py - pointer.y;
    const dist = Math.hypot(dx, dy);
    const repel = Math.max(0, 1 - dist / 170);

    p.vx += (Math.sin(t * 0.7 + p.hue) * 0.00009) / p.depth;
    p.vy += (Math.cos(t * 0.6 + p.hue) * 0.00007) / p.depth;
    p.vx += ((dx / (dist || 1)) * repel * 0.00095) / p.depth;
    p.vy += ((dy / (dist || 1)) * repel * 0.00095) / p.depth;
    p.vx *= 0.988;
    p.vy *= 0.988;

    p.x += p.vx;
    p.y += p.vy;

    if (p.x < -0.16) p.x = 1.14;
    if (p.x > 1.16) p.x = -0.14;
    if (p.y < -0.16) p.y = 1.14;
    if (p.y > 1.16) p.y = -0.14;

    const alpha = 0.08 + repel * 0.3;
    const metric = state.prepared.fieldWords.get(p.word);
    const pillW = (metric?.width || 44) + 18;
    const pillH = state.metrics.fieldHeight;
    const drawX = p.x * width - pillW * 0.5;
    const drawY = p.y * height - pillH * 0.5;
    const lightness = 55 + Math.sin(t * 1.2 + p.hue) * 10;

    ctx.fillStyle = `hsla(${p.hue + Math.sin(t + p.hue) * 12}, 82%, 58%, ${alpha * 0.42})`;
    roundRect(ctx, drawX, drawY, pillW, pillH, pillH * 0.5);
    ctx.fill();

    ctx.strokeStyle = `hsla(${p.hue}, 78%, 70%, ${alpha * 0.7})`;
    ctx.lineWidth = 1;
    roundRect(ctx, drawX, drawY, pillW, pillH, pillH * 0.5);
    ctx.stroke();

    ctx.font = state.fonts.field;
    ctx.textBaseline = "middle";
    ctx.fillStyle = `hsla(${p.hue + Math.sin(t + p.hue) * 12}, 82%, ${lightness}%, ${alpha + 0.18})`;
    ctx.fillText(p.word, drawX + 9, drawY + pillH * 0.5);
  }
}

function drawHero(time) {
  const { ctx, width, height, bounds } = fitCanvas(heroCanvas, state.heroHeight);
  const t = time * 0.001;
  const localPointer = {
    x: pointer.x - bounds.left,
    y: pointer.y - bounds.top,
  };

  ctx.clearRect(0, 0, width, height);

  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, "rgba(31, 113, 197, 0.2)");
  gradient.addColorStop(0.5, "rgba(29, 142, 124, 0.16)");
  gradient.addColorStop(1, "rgba(219, 111, 58, 0.2)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  ctx.globalAlpha = 0.16;
  for (let i = 0; i < 4; i += 1) {
    const y = height * (0.18 + i * 0.2) + Math.sin(t * 1.4 + i) * 14;
    ctx.strokeStyle = `hsl(${170 + i * 40}, 75%, 58%)`;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(0, y);
    for (let x = 0; x <= width; x += 28) {
      const offset = Math.sin(x * 0.02 + t * 2.1 + i * 0.8) * 9;
      ctx.lineTo(x, y + offset);
    }
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  ctx.font = state.fonts.hero;
  ctx.textBaseline = "alphabetic";

  for (const glyph of state.heroGlyphs) {
    const waveX = Math.sin(t * 1.9 + glyph.baseY * 0.025) * 5;
    const waveY = Math.cos(t * 2.1 + glyph.baseX * 0.014) * 4;
    const targetX = glyph.baseX + waveX;
    const targetY = glyph.baseY + waveY;

    const dx = glyph.x - localPointer.x;
    const dy = glyph.y - localPointer.y;
    const dist = Math.hypot(dx, dy);
    const repel = Math.max(0, 1 - dist / 150);

    if (repel > 0) {
      glyph.vx += (dx / (dist || 1)) * repel * 0.95;
      glyph.vy += (dy / (dist || 1)) * repel * 0.95;
    }

    glyph.vx += (targetX - glyph.x) * 0.078;
    glyph.vy += (targetY - glyph.y) * 0.078;
    glyph.vx *= 0.82;
    glyph.vy *= 0.82;
    glyph.x += glyph.vx;
    glyph.y += glyph.vy;

    const lightness = 55 + Math.sin(t * 1.6 + glyph.baseX * 0.01) * 12;
    ctx.fillStyle = `hsla(${glyph.hue}, 84%, ${lightness}%, 0.88)`;
    ctx.fillText(glyph.ch, glyph.x, glyph.y);
  }
}

function drawFlow(time) {
  const t = time * 0.001;
  const lineHeight = state.metrics.flowLineHeight;
  const baseline = layout(state.prepared.flowMeasure, Math.max(220, flowCanvas.clientWidth - 36), lineHeight).height;
  state.flowHeight = Math.max(430, baseline + 140);

  const { ctx, width, height, bounds } = fitCanvas(flowCanvas, state.flowHeight);
  const localPointer = {
    x: pointer.x - bounds.left,
    y: pointer.y - bounds.top,
  };

  ctx.clearRect(0, 0, width, height);

  const bg = ctx.createLinearGradient(0, 0, width, height);
  bg.addColorStop(0, "rgba(29, 142, 124, 0.14)");
  bg.addColorStop(0.5, "rgba(31, 113, 197, 0.12)");
  bg.addColorStop(1, "rgba(219, 111, 58, 0.14)");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  const left = 18;
  const right = width - 18;
  const top = 28;
  const bottom = height - 22;
  const centerX = width * 0.5;

  const nodes = flowNodes.map((node) => {
    const oscillationX = Math.sin(t * node.speed + node.phase) * 18;
    const oscillationY = Math.cos(t * (node.speed + 0.25) + node.phase) * 22;
    const pointerPushX = Math.max(-14, Math.min(14, (node.x * width - localPointer.x) * 0.03));
    const pointerPushY = Math.max(-10, Math.min(10, (node.y * height - localPointer.y) * 0.02));
    return {
      x: node.x * width + oscillationX + pointerPushX,
      y: node.y * height + oscillationY + pointerPushY,
      r: node.r,
    };
  });

  for (const node of nodes) {
    const glow = ctx.createRadialGradient(node.x, node.y, 10, node.x, node.y, node.r);
    glow.addColorStop(0, "rgba(219, 111, 58, 0.48)");
    glow.addColorStop(0.5, "rgba(31, 113, 197, 0.26)");
    glow.addColorStop(1, "rgba(31, 113, 197, 0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(node.x, node.y, node.r, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.font = state.fonts.flow;
  ctx.textBaseline = "alphabetic";

  let cursor = { segmentIndex: 0, graphemeIndex: 0 };
  let y = top;
  let lineIndex = 0;
  let drawn = 0;

  while (y < bottom) {
    const segments = computeFreeSegments(y, left, right, nodes, lineHeight);
    if (!segments.length) {
      y += lineHeight;
      continue;
    }

    const widest = segments.reduce((best, segment) => (segment.width > best.width ? segment : best), segments[0]);
    const direction = Math.sin(t * 0.9 + lineIndex * 0.55) > 0 ? 1 : -1;
    const directional =
      segments
        .filter((segment) => segment.width > widest.width * 0.58)
        .find((segment) => (direction > 0 ? segment.center > centerX : segment.center < centerX)) || widest;

    const maxWidth = Math.max(110, directional.width - 8);
    const line = layoutNextLine(state.prepared.flow, cursor, maxWidth);
    if (!line) break;

    let x = directional.start + 4;
    if (lineIndex % 5 >= 3) {
      x += Math.max(0, directional.width - line.width - 8);
    }

    const hue = 176 + Math.sin(t * 1.2 + lineIndex * 0.28) * 58;
    const lightness = 48 + Math.sin(t * 0.7 + lineIndex * 0.32) * 12;
    ctx.fillStyle = `hsla(${hue}, 88%, ${lightness}%, 0.93)`;
    ctx.fillText(line.text, x, y);

    cursor = line.end;
    y += lineHeight;
    lineIndex += 1;
    drawn += 1;
  }

  flowMetrics.textContent = `Baseline height via layout(): ${Math.round(baseline)}px | Dynamic lines rendered: ${drawn} | Width per line changed in real-time`;
}

function computeFreeSegments(y, left, right, nodes, lineHeight) {
  const blocked = [];

  for (const node of nodes) {
    const radius = node.r + lineHeight * 0.35;
    const dy = Math.abs(y - node.y);
    if (dy >= radius) continue;

    const dx = Math.sqrt(radius * radius - dy * dy);
    blocked.push({
      start: Math.max(left, node.x - dx),
      end: Math.min(right, node.x + dx),
    });
  }

  if (!blocked.length) {
    return [{ start: left, end: right, width: right - left, center: (left + right) * 0.5 }];
  }

  blocked.sort((a, b) => a.start - b.start);
  const merged = [];

  for (const current of blocked) {
    if (!merged.length || current.start > merged[merged.length - 1].end) {
      merged.push({ ...current });
      continue;
    }
    merged[merged.length - 1].end = Math.max(merged[merged.length - 1].end, current.end);
  }

  const free = [];
  let cursor = left;

  for (const span of merged) {
    if (span.start > cursor + 8) {
      const width = span.start - cursor;
      free.push({ start: cursor, end: span.start, width, center: cursor + width * 0.5 });
    }
    cursor = Math.max(cursor, span.end);
  }

  if (cursor < right - 8) {
    const width = right - cursor;
    free.push({ start: cursor, end: right, width, center: cursor + width * 0.5 });
  }

  return free;
}

function drawRadar(time) {
  const { ctx, width, height } = fitCanvas(radarCanvas, 260);
  const t = time * 0.001;
  ctx.clearRect(0, 0, width, height);

  const points = state.radarData;
  if (!points.length) return;

  const pad = { left: 28, right: 16, top: 18, bottom: 34 };
  const graphW = width - pad.left - pad.right;
  const graphH = height - pad.top - pad.bottom;
  const minH = Math.min(...points.map((point) => point.height));
  const maxH = Math.max(...points.map((point) => point.height));
  const minW = points[0].width;
  const maxW = points[points.length - 1].width;

  const background = ctx.createLinearGradient(0, 0, width, height);
  background.addColorStop(0, "rgba(31, 113, 197, 0.16)");
  background.addColorStop(1, "rgba(29, 142, 124, 0.12)");
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = "rgba(113, 150, 179, 0.42)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(pad.left, pad.top);
  ctx.lineTo(pad.left, pad.top + graphH);
  ctx.lineTo(pad.left + graphW, pad.top + graphH);
  ctx.stroke();

  const toX = (value) => pad.left + ((value - minW) / (maxW - minW || 1)) * graphW;
  const toY = (value) => pad.top + graphH - ((value - minH) / (maxH - minH || 1)) * graphH;

  ctx.strokeStyle = "rgba(122, 184, 255, 0.95)";
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  points.forEach((point, index) => {
    const x = toX(point.width);
    const y = toY(point.height);
    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();

  const tracer = points[Math.floor((Math.sin(t * 1.2) * 0.5 + 0.5) * (points.length - 1))];
  const tracerX = toX(tracer.width);
  const tracerY = toY(tracer.height);

  ctx.fillStyle = "rgba(219, 111, 58, 0.9)";
  ctx.beginPath();
  ctx.arc(tracerX, tracerY, 4.3, 0, Math.PI * 2);
  ctx.fill();

  ctx.font = state.fonts.tiny;
  ctx.fillStyle = "rgba(148, 165, 180, 0.94)";
  ctx.fillText("width", width - 42, height - 8);
  ctx.save();
  ctx.translate(9, 26);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText("height", 0, 0);
  ctx.restore();

  ctx.fillStyle = "rgba(230, 239, 246, 0.92)";
  ctx.fillText(`${Math.round(tracer.width)}px`, tracerX + 8, tracerY - 10);
}

function drawVirtualization(time) {
  const { ctx, width, height } = fitCanvas(virtualCanvas, state.virtualHeight);
  const t = time * 0.001;
  ctx.clearRect(0, 0, width, height);

  const rows = state.virtualRows;
  if (!rows.length) return;

  const viewportPad = 12;
  const viewportHeight = height - viewportPad * 2;
  const totalHeight = rows[rows.length - 1].y + rows[rows.length - 1].rowHeight;
  const maxScroll = Math.max(0, totalHeight - viewportHeight);
  const virtualScroll = maxScroll * (Math.sin(t * 0.36) * 0.5 + 0.5);
  const contentWidth = width - 28;

  const bg = ctx.createLinearGradient(0, 0, width, height);
  bg.addColorStop(0, "rgba(14, 95, 141, 0.18)");
  bg.addColorStop(1, "rgba(219, 111, 58, 0.16)");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = "rgba(122, 184, 255, 0.36)";
  ctx.lineWidth = 1.2;
  roundRect(ctx, viewportPad, viewportPad, width - viewportPad * 2, viewportHeight, 18);
  ctx.stroke();

  const visibleRows = rows.filter(
    (row) => row.y + row.rowHeight >= virtualScroll && row.y <= virtualScroll + viewportHeight,
  );

  visibleRows.forEach((row) => {
    const y = viewportPad + row.y - virtualScroll;
    const x = 14;

    const cardGradient = ctx.createLinearGradient(x, y, x + contentWidth, y + row.rowHeight);
    cardGradient.addColorStop(0, "rgba(255, 255, 255, 0.26)");
    cardGradient.addColorStop(1, "rgba(255, 255, 255, 0.08)");
    ctx.fillStyle = cardGradient;
    roundRect(ctx, x, y, contentWidth, row.rowHeight, 16);
    ctx.fill();

    ctx.strokeStyle = "rgba(148, 179, 203, 0.28)";
    ctx.lineWidth = 1;
    roundRect(ctx, x, y, contentWidth, row.rowHeight, 16);
    ctx.stroke();

    ctx.font = state.fonts.tiny;
    ctx.textBaseline = "middle";
    ctx.fillStyle = "rgba(22, 32, 38, 0.82)";
    const tagX = x + contentWidth - row.tagWidth - 14;
    roundRect(ctx, tagX, y + 14, row.tagWidth, 22, 11);
    ctx.fillStyle = "rgba(255, 255, 255, 0.56)";
    ctx.fill();
    ctx.fillStyle = "rgba(51, 82, 97, 0.9)";
    ctx.fillText(row.tag, tagX + 9, y + 25);

    ctx.font = state.fonts.virtualTitle;
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = "rgba(16, 28, 36, 0.96)";
    row.titleLines.forEach((line, index) => {
      ctx.fillText(line.text, x + 14, y + 32 + index * state.metrics.virtualTitleLineHeight);
    });

    ctx.font = state.fonts.virtualBody;
    ctx.fillStyle = "rgba(55, 74, 86, 0.95)";
    const bodyStartY = y + 54 + row.titleLines.length * state.metrics.virtualTitleLineHeight;
    row.bodyLines.forEach((line, index) => {
      ctx.fillText(line.text, x + 14, bodyStartY + index * state.metrics.virtualBodyLineHeight);
    });
  });

  ctx.fillStyle = "rgba(219, 111, 58, 0.86)";
  const barH = Math.max(34, (viewportHeight / totalHeight) * viewportHeight);
  const barY = viewportPad + (virtualScroll / (totalHeight || 1)) * (viewportHeight - barH);
  roundRect(ctx, width - 10, barY, 4, barH, 2);
  ctx.fill();

  virtualMetrics.textContent = `Predicted content height: ${Math.round(totalHeight)}px | Visible rows now: ${visibleRows.length}/${rows.length} | Windowed without DOM probes`;
}

function drawBalance(time) {
  if (!state.balanced) return;

  const { ctx, width, height } = fitCanvas(balanceCanvas, state.balanceHeight);
  const t = time * 0.001;
  ctx.clearRect(0, 0, width, height);

  const center = width * 0.5;
  const blockWidth = state.balanced.width;
  const left = center - blockWidth * 0.5;
  const top = 34;
  const blockHeight = state.balanced.lines.length * state.metrics.balanceLineHeight + 26;

  const blockGradient = ctx.createLinearGradient(left, top, left + blockWidth, top + blockHeight);
  blockGradient.addColorStop(0, "rgba(31, 113, 197, 0.2)");
  blockGradient.addColorStop(1, "rgba(219, 111, 58, 0.22)");
  ctx.fillStyle = blockGradient;
  ctx.fillRect(left - 14, top - 14, blockWidth + 28, blockHeight + 28);

  ctx.font = state.fonts.balance;
  ctx.textBaseline = "alphabetic";

  state.balanced.lines.forEach((line, index) => {
    const y = top + 30 + index * state.metrics.balanceLineHeight;
    const x = center - line.width * 0.5;

    const shimmer = Math.sin(t * 1.9 + index * 0.62) * 16;
    ctx.fillStyle = `hsla(${182 + index * 12}, 86%, ${53 + shimmer * 0.12}%, 0.95)`;
    ctx.fillText(line.text, x, y);

    ctx.strokeStyle = "rgba(122, 184, 255, 0.16)";
    ctx.beginPath();
    ctx.moveTo(x - 5, y + 7);
    ctx.lineTo(x + line.width + 5, y + 7);
    ctx.stroke();
  });
}

async function waitForFonts() {
  if (document.fonts && document.fonts.ready) {
    try {
      await document.fonts.ready;
      return;
    } catch (error) {
      return;
    }
  }

  await new Promise((resolve) => {
    window.setTimeout(resolve, 120);
  });
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function measurePreparedWidth(prepared) {
  let width = 0;
  walkLineRanges(prepared, 1000, (line) => {
    width = Math.max(width, line.width);
  });
  return width;
}

function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}
