(() => {
  const canvas = document.getElementById('fireCanvas');
  const ctx = canvas.getContext('2d');

  // Fire grid dimensions (character cells)
  let cols, rows;
  const CHAR_W = 10;
  const CHAR_H = 16;

  // Fire intensity buffer
  let firePixels;

  // Fire palette: 37 colors from black through red/orange/yellow to white
  const PALETTE = [
    [0x07, 0x07, 0x07],
    [0x1F, 0x07, 0x07],
    [0x2F, 0x0F, 0x07],
    [0x47, 0x0F, 0x07],
    [0x57, 0x17, 0x07],
    [0x67, 0x1F, 0x07],
    [0x77, 0x1F, 0x07],
    [0x8F, 0x27, 0x07],
    [0x9F, 0x2F, 0x07],
    [0xAF, 0x3F, 0x07],
    [0xBF, 0x47, 0x07],
    [0xC7, 0x47, 0x07],
    [0xDF, 0x4F, 0x07],
    [0xDF, 0x57, 0x07],
    [0xDF, 0x57, 0x07],
    [0xD7, 0x5F, 0x07],
    [0xD7, 0x5F, 0x07],
    [0xD7, 0x67, 0x0F],
    [0xCF, 0x6F, 0x0F],
    [0xCF, 0x77, 0x0F],
    [0xCF, 0x7F, 0x0F],
    [0xCF, 0x87, 0x17],
    [0xC7, 0x87, 0x17],
    [0xC7, 0x8F, 0x17],
    [0xC7, 0x97, 0x1F],
    [0xBF, 0x9F, 0x1F],
    [0xBF, 0x9F, 0x1F],
    [0xBF, 0xA7, 0x27],
    [0xBF, 0xA7, 0x27],
    [0xBF, 0xAF, 0x2F],
    [0xB7, 0xAF, 0x2F],
    [0xB7, 0xB7, 0x2F],
    [0xB7, 0xB7, 0x37],
    [0xCF, 0xCF, 0x6F],
    [0xDF, 0xDF, 0x9F],
    [0xEF, 0xEF, 0xC7],
    [0xFF, 0xFF, 0xFF],
  ];
  const MAX_FIRE = PALETTE.length - 1;

  // God mode palette (blue/cyan)
  const PALETTE_GOD = [
    [0x07, 0x07, 0x07],
    [0x07, 0x07, 0x1F],
    [0x07, 0x0F, 0x2F],
    [0x07, 0x0F, 0x47],
    [0x07, 0x17, 0x57],
    [0x07, 0x1F, 0x67],
    [0x07, 0x1F, 0x77],
    [0x07, 0x27, 0x8F],
    [0x07, 0x2F, 0x9F],
    [0x07, 0x3F, 0xAF],
    [0x07, 0x47, 0xBF],
    [0x07, 0x47, 0xC7],
    [0x07, 0x4F, 0xDF],
    [0x07, 0x57, 0xDF],
    [0x07, 0x57, 0xDF],
    [0x07, 0x5F, 0xD7],
    [0x07, 0x5F, 0xD7],
    [0x0F, 0x67, 0xD7],
    [0x0F, 0x6F, 0xCF],
    [0x0F, 0x77, 0xCF],
    [0x0F, 0x7F, 0xCF],
    [0x17, 0x87, 0xCF],
    [0x17, 0x87, 0xC7],
    [0x17, 0x8F, 0xC7],
    [0x1F, 0x97, 0xC7],
    [0x1F, 0x9F, 0xBF],
    [0x1F, 0x9F, 0xBF],
    [0x27, 0xA7, 0xBF],
    [0x27, 0xA7, 0xBF],
    [0x2F, 0xAF, 0xBF],
    [0x2F, 0xAF, 0xB7],
    [0x2F, 0xB7, 0xB7],
    [0x37, 0xB7, 0xB7],
    [0x6F, 0xCF, 0xCF],
    [0x9F, 0xDF, 0xDF],
    [0xC7, 0xEF, 0xEF],
    [0xFF, 0xFF, 0xFF],
  ];

  // Block characters for different intensities
  const FIRE_CHARS = ' .,:;░░▒▒▓▓██';

  let godMode = false;
  let mouseX = -1;
  let mouseY = -1;

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    cols = Math.ceil(canvas.width / CHAR_W);
    rows = Math.ceil(canvas.height / CHAR_H);
    initFire();
  }

  function initFire() {
    firePixels = new Uint8Array(cols * rows);
    // Set bottom row to max
    for (let x = 0; x < cols; x++) {
      firePixels[(rows - 1) * cols + x] = MAX_FIRE;
    }
  }

  function spreadFire() {
    for (let y = 1; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const src = y * cols + x;
        const below = firePixels[src];

        if (below === 0) {
          firePixels[(y - 1) * cols + x] = 0;
        } else {
          // Random decay and wind
          const rand = Math.random() * 3.0 | 0;
          const wind = (rand & 1);
          const destX = Math.min(Math.max(x - wind + (Math.random() > 0.5 ? 1 : 0), 0), cols - 1);
          const dst = (y - 1) * cols + destX;
          firePixels[dst] = Math.max(0, below - (rand & 1));
        }
      }
    }

    // Mouse interaction: intensify fire near cursor
    if (mouseX >= 0 && mouseY >= 0) {
      const cx = Math.floor(mouseX / CHAR_W);
      const cy = Math.floor(mouseY / CHAR_H);
      const radius = 5;
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const nx = cx + dx;
          const ny = cy + dy;
          if (nx >= 0 && nx < cols && ny >= 0 && ny < rows) {
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < radius) {
              const idx = ny * cols + nx;
              const boost = Math.floor((radius - dist) / radius * MAX_FIRE * 0.6);
              firePixels[idx] = Math.min(MAX_FIRE, firePixels[idx] + boost);
            }
          }
        }
      }
    }
  }

  function renderFire() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const palette = godMode ? PALETTE_GOD : PALETTE;
    const fontSize = CHAR_H - 2;
    ctx.font = `${fontSize}px monospace`;
    ctx.textBaseline = 'top';

    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const intensity = firePixels[y * cols + x];
        if (intensity === 0) continue;

        const color = palette[intensity];
        const charIdx = Math.floor(intensity / MAX_FIRE * (FIRE_CHARS.length - 1));
        const ch = FIRE_CHARS[charIdx];

        ctx.fillStyle = `rgb(${color[0]},${color[1]},${color[2]})`;
        ctx.fillText(ch, x * CHAR_W, y * CHAR_H);
      }
    }
  }

  function animate() {
    spreadFire();
    renderFire();
    requestAnimationFrame(animate);
  }

  // Mouse interaction
  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  document.addEventListener('mouseleave', () => {
    mouseX = -1;
    mouseY = -1;
  });

  // Click to burst fire
  document.addEventListener('click', (e) => {
    const cx = Math.floor(e.clientX / CHAR_W);
    const cy = Math.floor(e.clientY / CHAR_H);
    const radius = 10;
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const nx = cx + dx;
        const ny = cy + dy;
        if (nx >= 0 && nx < cols && ny >= 0 && ny < rows) {
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < radius) {
            firePixels[ny * cols + nx] = MAX_FIRE;
          }
        }
      }
    }
  });

  // IDDQD god mode
  let cheatBuffer = '';
  document.addEventListener('keydown', (e) => {
    cheatBuffer += e.key.toLowerCase();
    if (cheatBuffer.length > 10) {
      cheatBuffer = cheatBuffer.slice(-10);
    }
    if (cheatBuffer.includes('iddqd')) {
      godMode = !godMode;
      document.body.classList.toggle('god-mode', godMode);
      cheatBuffer = '';
    }
  });

  // Init
  window.addEventListener('resize', resize);
  resize();
  animate();
})();
