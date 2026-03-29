const profile = {
  name: "Fadi Zuabi",
  role: "Senior Firmware Engineer & AI Champion",
  tagline: "Building bridges between hardware and AI.",
  mediumBio:
    "UIUC-trained firmware engineer building AI systems, shipping SSD platforms, and helping engineering teams move faster with practical tools.",
  goal: "Make AI useful for people who build real systems.",
  location: "Roseville, CA",
  stats: ["5+ years firmware", "60+ engineers trained", "70% adoption lift"],
  trajectory: [
    "Solidigm (2022-Present) - Senior Firmware Engineer, AI Champion, and technical lead across GEN5 PCIe SSD delivery.",
    "Intel (2021-2022) - Firmware Engineer focused on NAND storage systems.",
    "GE Aerospace (2019-2021) - Embedded Software Engineer shipping aircraft systems and automation.",
  ],
  systems:
    "Core firmware: C/C++, NVMe, PCIe Gen4 and Gen5, ARM, Xtensa, RTOS, Linux kernel. AI systems: GPT-4, Claude, Gemini, prompt engineering, RAG, DataIku, Snowflake, Vertex AI, graph models. Delivery stack: GCP, Firebase, Python, TypeScript, React, Next.js. Leadership: trained 60+ engineers, raised Copilot adoption by 70 percent, and translated AI into everyday engineering workflows.",
  projects: [
    "Debug agent",
    "Copilot adoption",
    "GEN5 SSD",
    "CI/CD acceleration",
  ],
};

const canvas = document.getElementById("stage");
const ctx = canvas.getContext("2d");
const engineLabel = document.getElementById("engineLabel");
const sectionLabel = document.getElementById("sectionLabel");
const navButtons = Array.from(document.querySelectorAll(".section-nav button"));
const chapters = Array.from(document.querySelectorAll(".chapter"));
const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
const colorSchemeQuery = window.matchMedia("(prefers-color-scheme: dark)");

const DISPLAY_FONT = '"Bricolage Grotesque", sans-serif';
const BODY_FONT = '"Literata", serif';
const glyphPool = Array.from("FADI ZUABI AI FIRMWARE NVME PCIE DEBUG GPT CLAUDE GEMINI SOLIDIGM ");
const preparedCache = new Map();
const widthCache = new Map();

const state = {
  width: window.innerWidth,
  height: window.innerHeight,
  dpr: Math.min(window.devicePixelRatio || 1, 2),
  targetScroll: window.scrollY,
  scroll: window.scrollY,
  pointer: {
    x: window.innerWidth * 0.72,
    y: window.innerHeight * 0.36,
    targetX: window.innerWidth * 0.72,
    targetY: window.innerHeight * 0.36,
    active: false,
  },
  sectionMetrics: [],
  theme: {},
  pretext: null,
  fontsReady: false,
  engineMode: "loading",
  currentSection: "origin",
  particles: [],
};

bootstrap();

function bootstrap() {
  syncTheme();
  resizeCanvas();
  bindEvents();
  buildParticles();
  updateSectionMetrics();
  document.fonts.ready.then(() => {
    state.fontsReady = true;
    preparedCache.clear();
    widthCache.clear();
  });
  loadPretext();
  requestAnimationFrame(frame);
}

async function loadPretext() {
  try {
    state.pretext = await import("https://esm.sh/@chenglou/pretext@0.0.2?bundle");
    state.engineMode = "pretext";
    engineLabel.textContent = "Pretext live";
    preparedCache.clear();
    widthCache.clear();
  } catch (error) {
    console.warn("Pretext failed to load, using canvas fallback.", error);
    state.engineMode = "fallback";
    engineLabel.textContent = "Canvas fallback";
  }
}

function bindEvents() {
  window.addEventListener(
    "resize",
    () => {
      resizeCanvas();
      updateSectionMetrics();
      buildParticles();
    },
    { passive: true },
  );

  window.addEventListener(
    "scroll",
    () => {
      state.targetScroll = window.scrollY;
    },
    { passive: true },
  );

  window.addEventListener("pointermove", handlePointerMove);
  window.addEventListener("pointerleave", clearPointer);
  window.addEventListener("pointercancel", clearPointer);
  window.addEventListener("touchstart", handleTouchMove, { passive: true });
  window.addEventListener("touchmove", handleTouchMove, { passive: true });
  window.addEventListener("touchend", clearPointer, { passive: true });

  reducedMotionQuery.addEventListener("change", () => {
    if (reducedMotionQuery.matches) {
      state.pointer.active = false;
    }
  });
  colorSchemeQuery.addEventListener("change", syncTheme);

  navButtons.forEach(button => {
    button.addEventListener("click", () => {
      const target = document.getElementById(button.dataset.target);
      if (!target) return;
      window.scrollTo({ top: target.offsetTop, behavior: reducedMotionQuery.matches ? "auto" : "smooth" });
    });
  });
}

function handlePointerMove(event) {
  state.pointer.active = true;
  state.pointer.targetX = event.clientX;
  state.pointer.targetY = event.clientY;
}

function handleTouchMove(event) {
  const touch = event.touches[0];
  if (!touch) return;
  state.pointer.active = true;
  state.pointer.targetX = touch.clientX;
  state.pointer.targetY = touch.clientY;
}

function clearPointer() {
  state.pointer.active = false;
}

function resizeCanvas() {
  state.width = window.innerWidth;
  state.height = window.innerHeight;
  state.dpr = Math.min(window.devicePixelRatio || 1, 2);

  canvas.width = Math.round(state.width * state.dpr);
  canvas.height = Math.round(state.height * state.dpr);
  canvas.style.width = `${state.width}px`;
  canvas.style.height = `${state.height}px`;
  ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
}

function syncTheme() {
  const styles = getComputedStyle(document.documentElement);
  state.theme = {
    bg: styles.getPropertyValue("--bg").trim(),
    bg2: styles.getPropertyValue("--bg-2").trim(),
    pill: styles.getPropertyValue("--pill").trim(),
    line: styles.getPropertyValue("--line").trim(),
    lineStrong: styles.getPropertyValue("--line-strong").trim(),
    ink: styles.getPropertyValue("--ink").trim(),
    muted: styles.getPropertyValue("--muted").trim(),
    accent: styles.getPropertyValue("--accent").trim(),
    accentStrong: styles.getPropertyValue("--accent-strong").trim(),
    accent2: styles.getPropertyValue("--accent-2").trim(),
    accent3: styles.getPropertyValue("--accent-3").trim(),
    glowA: styles.getPropertyValue("--glow-a").trim(),
    glowB: styles.getPropertyValue("--glow-b").trim(),
    glowC: styles.getPropertyValue("--glow-c").trim(),
    grid: styles.getPropertyValue("--grid").trim(),
  };
}

function updateSectionMetrics() {
  state.sectionMetrics = chapters.map(chapter => ({
    id: chapter.id,
    label: chapter.dataset.label || chapter.id,
    top: chapter.offsetTop,
    height: chapter.offsetHeight,
    center: chapter.offsetTop + chapter.offsetHeight / 2,
  }));
}

function buildParticles() {
  const particleCount = state.width < 640 ? 40 : state.width < 900 ? 58 : 82;
  const random = mulberry32(Math.floor(state.width * 13 + state.height * 17));

  state.particles = Array.from({ length: particleCount }, (_, index) => ({
    char: glyphPool[index % glyphPool.length],
    x: random() * state.width,
    y: random() * state.height,
    vx: (random() - 0.5) * 0.38,
    vy: (random() - 0.5) * 0.38,
    size: lerp(12, 28, random()),
    alpha: lerp(0.06, 0.18, random()),
    phase: random() * Math.PI * 2,
  }));
}

function frame(now) {
  const time = now * 0.001;
  const easing = reducedMotionQuery.matches ? 1 : 0.08;
  state.scroll += (state.targetScroll - state.scroll) * easing;

  if (!state.pointer.active && !reducedMotionQuery.matches) {
    state.pointer.targetX = state.width * (0.66 + 0.14 * Math.cos(time * 0.31));
    state.pointer.targetY = state.height * (0.38 + 0.18 * Math.sin(time * 0.24));
  }

  state.pointer.x += (state.pointer.targetX - state.pointer.x) * (reducedMotionQuery.matches ? 1 : 0.12);
  state.pointer.y += (state.pointer.targetY - state.pointer.y) * (reducedMotionQuery.matches ? 1 : 0.12);

  drawScene(time);
  requestAnimationFrame(frame);
}

function drawScene(time) {
  ctx.clearRect(0, 0, state.width, state.height);
  drawBackground(time);
  updateAndDrawParticles(time);

  const influences = getSectionInfluences();
  const strongest = influences.reduce((best, entry) => (entry.amount > best.amount ? entry : best), influences[0]);
  if (strongest) {
    state.currentSection = strongest.id;
    sectionLabel.textContent = strongest.label;
    navButtons.forEach(button => button.classList.toggle("is-active", button.dataset.target === strongest.id));
  }

  const hero = influences.find(entry => entry.id === "origin")?.amount || 0;
  const trajectory = influences.find(entry => entry.id === "trajectory")?.amount || 0;
  const systems = influences.find(entry => entry.id === "systems")?.amount || 0;
  const connect = influences.find(entry => entry.id === "connect")?.amount || 0;

  renderHero(hero, time);
  renderTrajectory(trajectory, time);
  renderSystems(systems, time);
  renderConnect(connect, time);
}

function drawBackground(time) {
  const background = ctx.createLinearGradient(0, 0, state.width, state.height);
  background.addColorStop(0, state.theme.bg);
  background.addColorStop(1, state.theme.bg2);
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, state.width, state.height);

  const focus = getFocusOrb();
  drawRadialGlow(focus.x, focus.y, state.width * 0.34, state.theme.glowA);
  drawRadialGlow(state.width * 0.2 + Math.sin(time * 0.4) * 36, state.height * 0.18, state.width * 0.26, state.theme.glowB);
  drawRadialGlow(state.width * 0.76 + Math.cos(time * 0.32) * 46, state.height * 0.78, state.width * 0.22, state.theme.glowC);

  ctx.save();
  ctx.strokeStyle = state.theme.grid;
  ctx.lineWidth = 1;
  ctx.globalAlpha = 0.8;
  const gap = state.width < 640 ? 34 : 52;
  for (let x = gap / 2; x < state.width; x += gap) {
    const offset = Math.sin(time * 0.22 + x * 0.01) * 4;
    ctx.beginPath();
    ctx.moveTo(x + offset, 0);
    ctx.lineTo(x - offset, state.height);
    ctx.stroke();
  }
  for (let y = gap / 2; y < state.height; y += gap) {
    const offset = Math.cos(time * 0.18 + y * 0.015) * 4;
    ctx.beginPath();
    ctx.moveTo(0, y + offset);
    ctx.lineTo(state.width, y - offset);
    ctx.stroke();
  }
  ctx.restore();
}

function updateAndDrawParticles(time) {
  const focus = getFocusOrb();
  const radius = focus.radius * 1.15;

  ctx.save();
  ctx.textBaseline = "middle";
  state.particles.forEach((particle, index) => {
    const dx = particle.x - focus.x;
    const dy = particle.y - focus.y;
    const distance = Math.hypot(dx, dy) || 1;
    if (distance < radius) {
      const force = (1 - distance / radius) * 0.12;
      particle.vx += (dx / distance) * force;
      particle.vy += (dy / distance) * force;
    }

    particle.vx += Math.sin(time * 0.4 + particle.phase) * 0.004;
    particle.vy += Math.cos(time * 0.3 + particle.phase * 1.2) * 0.004;
    particle.vx *= 0.985;
    particle.vy *= 0.985;
    particle.x = wrap(particle.x + particle.vx, state.width);
    particle.y = wrap(particle.y + particle.vy, state.height);

    ctx.font = `${particle.size}px ${DISPLAY_FONT}`;
    ctx.fillStyle = index % 3 === 0 ? state.theme.accent : index % 3 === 1 ? state.theme.accent2 : state.theme.accent3;
    ctx.globalAlpha = particle.alpha;
    ctx.fillText(particle.char, particle.x, particle.y);
  });
  ctx.restore();
}

function getSectionInfluences() {
  const viewportCenter = state.scroll + state.height * 0.5;
  return state.sectionMetrics.map(metric => {
    const radius = Math.max(metric.height * 0.72, state.height * 0.84);
    const distance = Math.abs(viewportCenter - metric.center);
    const amount = smoothstep(0, 1, clamp(1 - distance / radius, 0, 1));
    return { id: metric.id, label: metric.label, amount };
  });
}

function renderHero(amount, time) {
  if (amount <= 0.01) return;

  const scale = getScale();
  const nameFont = `800 ${Math.round(84 * scale)}px ${DISPLAY_FONT}`;
  const nameLineHeight = Math.round(74 * scale);
  const roleFont = `700 ${Math.round(24 * scale)}px ${DISPLAY_FONT}`;
  const roleLineHeight = Math.round(30 * scale);
  const bodyFont = `500 ${Math.round(19 * scale)}px ${BODY_FONT}`;
  const bodyLineHeight = Math.round(30 * scale);
  const labelFont = `700 ${Math.round(12 * scale)}px ${DISPLAY_FONT}`;
  const pillFont = `700 ${Math.round(12 * scale)}px ${DISPLAY_FONT}`;

  const left = state.width < 900 ? state.width * 0.08 : state.width * 0.08;
  const top = state.height * (state.width < 900 ? 0.15 : 0.14);
  const width = state.width < 900 ? state.width * 0.84 : state.width * 0.55;
  const heroText = `${profile.tagline} ${profile.mediumBio} ${profile.goal}`;

  drawMeasuredTag("ORIGIN", left, top - 40 * scale, labelFont, amount);

  const nameLines = layoutParagraph(
    profile.name,
    nameFont,
    nameLineHeight,
    { x: left, y: top, width, height: 220 * scale },
    () => ({ x: left, width: width * (state.width < 640 ? 0.92 : 0.88), align: "left" }),
  );

  renderLines(nameLines, {
    font: nameFont,
    lineHeight: nameLineHeight,
    alpha: amount,
    shadowBlur: 28,
    barOpacity: 0.16,
    textColor: index => (index === 0 ? state.theme.ink : state.theme.accent2),
  });

  const roleY = top + nameLines.length * nameLineHeight + 12 * scale;
  const roleLines = layoutParagraph(
    profile.role,
    roleFont,
    roleLineHeight,
    { x: left, y: roleY, width, height: 90 * scale },
    () => ({ x: left + 4, width: width * 0.72, align: "left" }),
  );

  renderLines(roleLines, {
    font: roleFont,
    lineHeight: roleLineHeight,
    alpha: amount,
    barOpacity: 0.1,
    textColor: () => state.theme.accentStrong,
  });

  const bodyY = roleY + roleLines.length * roleLineHeight + 26 * scale;
  const bodyRegion = { x: left, y: bodyY, width, height: state.height * 0.46 };
  const focus = getFocusOrb();
  const bodyLines = layoutParagraph(heroText, bodyFont, bodyLineHeight, bodyRegion, (lineIndex, y) => {
    const centerY = y + bodyLineHeight * 0.5;
    const dy = centerY - focus.y;
    const clearance = focus.radius * 1.08;
    const baseWidth = width * (0.92 + 0.04 * Math.sin(time * 1.3 + lineIndex * 0.45));
    if (Math.abs(dy) < clearance) {
      const cut = Math.sqrt(Math.max(clearance * clearance - dy * dy, 0));
      const gap = 22 * scale;
      const leftStop = clamp(focus.x - cut - gap, bodyRegion.x + 80 * scale, bodyRegion.x + bodyRegion.width);
      const rightStart = clamp(focus.x + cut + gap, bodyRegion.x, bodyRegion.x + bodyRegion.width - 80 * scale);
      const leftWidth = leftStop - bodyRegion.x;
      const rightWidth = bodyRegion.x + bodyRegion.width - rightStart;
      const minimum = Math.max(140 * scale, bodyRegion.width * 0.28);
      if (leftWidth > rightWidth && leftWidth > minimum) {
        return { x: bodyRegion.x, width: leftWidth, align: "left" };
      }
      if (rightWidth > minimum) {
        return { x: rightStart, width: rightWidth, align: "left" };
      }
    }
    return { x: bodyRegion.x, width: baseWidth, align: "left" };
  });

  renderLines(bodyLines, {
    font: bodyFont,
    lineHeight: bodyLineHeight,
    alpha: amount,
    barOpacity: 0.14,
    textColor: index => (index % 4 === 1 ? state.theme.accent : state.theme.ink),
  });

  drawFocusOrb(focus, amount);
  drawPillRow(profile.stats, left, Math.min(state.height - 94, bodyY + bodyLines.length * bodyLineHeight + 20 * scale), width, pillFont, amount);
}

function renderTrajectory(amount, time) {
  if (amount <= 0.01) return;

  const scale = getScale();
  const labelFont = `700 ${Math.round(12 * scale)}px ${DISPLAY_FONT}`;
  const titleFont = `800 ${Math.round(34 * scale)}px ${DISPLAY_FONT}`;
  const titleLineHeight = Math.round(38 * scale);
  const bodyFont = `500 ${Math.round(18 * scale)}px ${BODY_FONT}`;
  const bodyLineHeight = Math.round(28 * scale);
  const pillFont = `700 ${Math.round(12 * scale)}px ${DISPLAY_FONT}`;

  const x = state.width < 900 ? state.width * 0.09 : state.width * 0.46;
  const y = state.height * 0.18;
  const width = state.width < 900 ? state.width * 0.82 : state.width * 0.42;

  drawMeasuredTag("TRAJECTORY", x, y - 40 * scale, labelFont, amount);
  const heading = layoutParagraph(
    "From aircraft systems to AI-enabled storage.",
    titleFont,
    titleLineHeight,
    { x, y, width, height: 90 * scale },
    () => ({ x, width: width * 0.92, align: "left" }),
  );

  renderLines(heading, {
    font: titleFont,
    lineHeight: titleLineHeight,
    alpha: amount,
    barOpacity: 0.12,
    textColor: index => (index === 0 ? state.theme.accent2 : state.theme.ink),
  });

  drawPillRow(
    ["2019 GE Aerospace", "2021 Intel", "2022 Solidigm"],
    x,
    y + heading.length * titleLineHeight + 12 * scale,
    width,
    pillFont,
    amount,
  );

  const bodyY = y + heading.length * titleLineHeight + 68 * scale;
  const bodyText = profile.trajectory.join(" ");
  const bodyLines = layoutParagraph(bodyText, bodyFont, bodyLineHeight, { x, y: bodyY, width, height: state.height * 0.52 }, (lineIndex, lineY) => {
    const local = lineY - bodyY;
    const ratio = clamp(local / (state.height * 0.44), 0, 1);
    const widthFactor = 0.58 + 0.28 * (0.5 + 0.5 * Math.sin(time * 1.1 + lineIndex * 0.72));
    const bandWidth = Math.max(width * 0.42, width * widthFactor);
    const offsetFactor = 0.08 + 0.32 * triangleWave(lineIndex * 0.24 + ratio * 0.4 + time * 0.18);
    const bandX = x + (width - bandWidth) * offsetFactor;
    return { x: bandX, width: bandWidth, align: "left" };
  });

  renderLines(bodyLines, {
    font: bodyFont,
    lineHeight: bodyLineHeight,
    alpha: amount,
    barOpacity: 0.16,
    textColor: index => {
      if (index % 5 === 0) return state.theme.accent;
      if (index % 3 === 0) return state.theme.accent2;
      return state.theme.ink;
    },
  });
}

function renderSystems(amount, time) {
  if (amount <= 0.01) return;

  const scale = getScale();
  const labelFont = `700 ${Math.round(12 * scale)}px ${DISPLAY_FONT}`;
  const titleFont = `800 ${Math.round(34 * scale)}px ${DISPLAY_FONT}`;
  const titleLineHeight = Math.round(38 * scale);
  const bodyFont = `500 ${Math.round(18 * scale)}px ${BODY_FONT}`;
  const bodyLineHeight = Math.round(28 * scale);
  const pillFont = `700 ${Math.round(12 * scale)}px ${DISPLAY_FONT}`;

  const x = state.width < 900 ? state.width * 0.08 : state.width * 0.22;
  const y = state.height * 0.17;
  const width = state.width < 900 ? state.width * 0.84 : state.width * 0.56;

  drawMeasuredTag("SYSTEMS", x, y - 40 * scale, labelFont, amount);
  const heading = layoutParagraph(
    "Firmware depth, AI leverage, delivery discipline.",
    titleFont,
    titleLineHeight,
    { x, y, width, height: 92 * scale },
    () => ({ x, width: width * 0.94, align: "left" }),
  );

  renderLines(heading, {
    font: titleFont,
    lineHeight: titleLineHeight,
    alpha: amount,
    barOpacity: 0.12,
    textColor: index => (index === 0 ? state.theme.accent : state.theme.ink),
  });

  const bodyY = y + heading.length * titleLineHeight + 24 * scale;
  const regionHeight = state.height * 0.5;
  const bodyLines = layoutParagraph(profile.systems, bodyFont, bodyLineHeight, { x, y: bodyY, width, height: regionHeight }, (lineIndex, lineY) => {
    const local = lineY - bodyY;
    const center = regionHeight * 0.46;
    const distance = Math.abs(local - center) / center;
    const pulse = 0.92 + 0.08 * Math.sin(time * 1.35 + lineIndex * 0.56);
    const bandWidth = Math.max(width * 0.3, width * (1 - distance * 0.74) * pulse);
    return {
      x: x + (width - bandWidth) / 2,
      width: bandWidth,
      align: "center",
    };
  });

  renderLines(bodyLines, {
    font: bodyFont,
    lineHeight: bodyLineHeight,
    alpha: amount,
    barOpacity: 0.18,
    textColor: index => {
      if (index % 6 === 0) return state.theme.accent3;
      if (index % 4 === 0) return state.theme.accent;
      return state.theme.ink;
    },
  });

  drawPillRow(profile.projects, x, Math.min(state.height - 94, bodyY + bodyLines.length * bodyLineHeight + 18 * scale), width, pillFont, amount);
}

function renderConnect(amount, time) {
  if (amount <= 0.01) return;

  const scale = getScale();
  const labelFont = `700 ${Math.round(12 * scale)}px ${DISPLAY_FONT}`;
  const quoteFont = `800 ${Math.round(32 * scale)}px ${DISPLAY_FONT}`;
  const quoteLineHeight = Math.round(36 * scale);
  const bodyFont = `500 ${Math.round(17 * scale)}px ${BODY_FONT}`;
  const bodyLineHeight = Math.round(27 * scale);

  const x = state.width < 900 ? state.width * 0.09 : state.width * 0.56;
  const y = state.height * 0.56;
  const width = state.width < 900 ? state.width * 0.82 : state.width * 0.32;

  drawMeasuredTag("CONNECT", x, y - 38 * scale, labelFont, amount);
  const quoteLines = layoutParagraph(
    profile.goal,
    quoteFont,
    quoteLineHeight,
    { x, y, width, height: 120 * scale },
    () => ({ x, width, align: "left" }),
  );

  renderLines(quoteLines, {
    font: quoteFont,
    lineHeight: quoteLineHeight,
    alpha: amount,
    shadowBlur: 18,
    barOpacity: 0.14,
    textColor: index => (index % 2 === 0 ? state.theme.accent2 : state.theme.ink),
  });

  const noteY = y + quoteLines.length * quoteLineHeight + 16 * scale;
  const noteLines = layoutParagraph(
    "The full contact surface and project details live in the closing cards below, keeping the kinetic canvas focused on motion and signal.",
    bodyFont,
    bodyLineHeight,
    { x, y: noteY, width, height: 120 * scale },
    () => ({ x, width: width * (0.96 + 0.03 * Math.sin(time)), align: "left" }),
  );

  renderLines(noteLines, {
    font: bodyFont,
    lineHeight: bodyLineHeight,
    alpha: amount,
    barOpacity: 0.1,
    textColor: () => state.theme.ink,
  });
}

function drawFocusOrb(focus, alpha) {
  ctx.save();
  ctx.globalAlpha = alpha * 0.5;
  ctx.strokeStyle = state.theme.lineStrong;
  ctx.lineWidth = 1.25;
  ctx.beginPath();
  ctx.arc(focus.x, focus.y, focus.radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(focus.x, focus.y, focus.radius * 0.56, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(focus.x - focus.radius - 16, focus.y);
  ctx.lineTo(focus.x + focus.radius + 16, focus.y);
  ctx.moveTo(focus.x, focus.y - focus.radius - 16);
  ctx.lineTo(focus.x, focus.y + focus.radius + 16);
  ctx.stroke();
  ctx.restore();
}

function drawMeasuredTag(text, x, y, font, alpha) {
  const width = measureSingleLine(text, font);
  const height = getFontSize(font) + 16;
  ctx.save();
  ctx.globalAlpha = alpha;
  drawRoundRect(x, y, width + 18, height, height / 2);
  ctx.fillStyle = state.theme.pill;
  ctx.fill();
  ctx.strokeStyle = state.theme.line;
  ctx.stroke();
  ctx.font = font;
  ctx.textBaseline = "top";
  ctx.fillStyle = state.theme.accentStrong;
  ctx.fillText(text, x + 9, y + 8);
  ctx.restore();
}

function drawPillRow(labels, startX, startY, maxWidth, font, alpha) {
  const height = Math.max(30, getFontSize(font) + 18);
  let x = startX;
  let y = startY;

  labels.forEach(label => {
    const width = measureSingleLine(label, font) + 24;
    if (x + width > startX + maxWidth) {
      x = startX;
      y += height + 10;
    }

    ctx.save();
    ctx.globalAlpha = alpha;
    drawRoundRect(x, y, width, height, height / 2);
    ctx.fillStyle = state.theme.pill;
    ctx.fill();
    ctx.strokeStyle = state.theme.line;
    ctx.stroke();
    ctx.font = font;
    ctx.textBaseline = "middle";
    ctx.fillStyle = state.theme.ink;
    ctx.fillText(label, x + 12, y + height / 2);
    ctx.restore();

    x += width + 10;
  });
}

function renderLines(lines, options) {
  const {
    font,
    lineHeight,
    alpha,
    textColor,
    barOpacity = 0.12,
    shadowBlur = 0,
  } = options;

  ctx.save();
  ctx.font = font;
  ctx.textBaseline = "top";
  ctx.lineWidth = 1;
  lines.forEach((line, index) => {
    const color = typeof textColor === "function" ? textColor(index, line) : textColor;
    if (barOpacity > 0) {
      ctx.globalAlpha = alpha * barOpacity;
      drawRoundRect(line.x - 10, line.y + lineHeight * 0.77, line.width + 20, 3, 2);
      ctx.fillStyle = state.theme.lineStrong;
      ctx.fill();
    }

    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = shadowBlur;
    ctx.fillText(line.text, line.x, line.y);
  });
  ctx.restore();
}

function layoutParagraph(text, font, lineHeight, region, getSlot) {
  const prepared = getPrepared(text, font);
  if (prepared) {
    const lines = [];
    let cursor = { segmentIndex: 0, graphemeIndex: 0 };
    for (let lineIndex = 0; lineIndex < 160; lineIndex += 1) {
      const y = region.y + lineIndex * lineHeight;
      if (y > region.y + region.height) break;
      const slot = getSlot(lineIndex, y);
      if (!slot || slot.width < 22) continue;
      const line = state.pretext.layoutNextLine(prepared, cursor, slot.width);
      if (!line) break;
      lines.push({
        text: line.text,
        width: line.width,
        x: resolveLineX(slot, line.width),
        y,
      });
      cursor = line.end;
    }
    return lines;
  }

  return layoutParagraphFallback(text, font, lineHeight, region, getSlot);
}

function layoutParagraphFallback(text, font, lineHeight, region, getSlot) {
  const tokens = text.trim().split(/\s+/);
  const lines = [];
  let tokenIndex = 0;

  ctx.save();
  ctx.font = font;
  ctx.textBaseline = "top";

  for (let lineIndex = 0; lineIndex < 160 && tokenIndex < tokens.length; lineIndex += 1) {
    const y = region.y + lineIndex * lineHeight;
    if (y > region.y + region.height) break;
    const slot = getSlot(lineIndex, y);
    if (!slot || slot.width < 22) continue;

    let lineText = "";
    let lineWidth = 0;

    while (tokenIndex < tokens.length) {
      const token = tokens[tokenIndex];
      const candidate = lineText ? `${lineText} ${token}` : token;
      const candidateWidth = ctx.measureText(candidate).width;

      if (candidateWidth <= slot.width) {
        lineText = candidate;
        lineWidth = candidateWidth;
        tokenIndex += 1;
        continue;
      }

      if (!lineText) {
        const broken = breakTokenToFit(token, slot.width);
        lineText = broken.fit;
        lineWidth = ctx.measureText(lineText).width;
        if (broken.rest) {
          tokens.splice(tokenIndex + 1, 0, broken.rest);
        }
        tokenIndex += 1;
      }
      break;
    }

    if (!lineText) continue;
    lines.push({ text: lineText, width: lineWidth, x: resolveLineX(slot, lineWidth), y });
  }

  ctx.restore();
  return lines;
}

function breakTokenToFit(token, maxWidth) {
  const graphemes = Array.from(token);
  let fit = graphemes[0] || token;

  for (let index = 1; index < graphemes.length; index += 1) {
    const candidate = fit + graphemes[index];
    if (ctx.measureText(candidate).width <= maxWidth) {
      fit = candidate;
    } else {
      return {
        fit,
        rest: graphemes.slice(index).join(""),
      };
    }
  }

  return { fit: token, rest: "" };
}

function getPrepared(text, font) {
  if (!state.pretext || !state.fontsReady) return null;
  const key = `${font}::${text}`;
  if (preparedCache.has(key)) return preparedCache.get(key);

  try {
    const prepared = state.pretext.prepareWithSegments(text, font);
    preparedCache.set(key, prepared);
    return prepared;
  } catch (error) {
    console.warn("Pretext prepare failed, using fallback layout for this session.", error);
    state.pretext = null;
    state.engineMode = "fallback";
    engineLabel.textContent = "Canvas fallback";
    preparedCache.clear();
    widthCache.clear();
    return null;
  }
}

function measureSingleLine(text, font) {
  const key = `${font}::${text}`;
  if (widthCache.has(key)) return widthCache.get(key);

  let width = 0;
  const prepared = getPrepared(text, font);
  if (prepared) {
    state.pretext.walkLineRanges(prepared, 100000, line => {
      width = Math.max(width, line.width);
    });
  } else {
    ctx.save();
    ctx.font = font;
    width = ctx.measureText(text).width;
    ctx.restore();
  }

  widthCache.set(key, width);
  return width;
}

function resolveLineX(slot, lineWidth) {
  if (slot.align === "center") {
    return slot.x + (slot.width - lineWidth) / 2;
  }
  if (slot.align === "right") {
    return slot.x + slot.width - lineWidth;
  }
  return slot.x;
}

function getFocusOrb() {
  return {
    x: state.pointer.x,
    y: state.pointer.y,
    radius: Math.min(state.width, state.height) * (state.width < 640 ? 0.16 : 0.14),
  };
}

function drawRadialGlow(x, y, radius, color) {
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
  gradient.addColorStop(0, color);
  gradient.addColorStop(1, "transparent");
  ctx.fillStyle = gradient;
  ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
}

function drawRoundRect(x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

function getScale() {
  if (state.width < 640) return 0.76;
  if (state.width < 900) return 0.88;
  return 1;
}

function getFontSize(font) {
  const match = /([0-9]+)px/.exec(font);
  return match ? Number(match[1]) : 16;
}

function triangleWave(value) {
  return 1 - Math.abs(((value % 1) + 1) % 1 * 2 - 1);
}

function wrap(value, limit) {
  if (value < -40) return limit + 40;
  if (value > limit + 40) return -40;
  return value;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function lerp(start, end, amount) {
  return start + (end - start) * amount;
}

function smoothstep(edge0, edge1, value) {
  const t = clamp((value - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

function mulberry32(seed) {
  let value = seed >>> 0;
  return function next() {
    value += 0x6d2b79f5;
    let result = value;
    result = Math.imul(result ^ (result >>> 15), result | 1);
    result ^= result + Math.imul(result ^ (result >>> 7), result | 61);
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
  };
}