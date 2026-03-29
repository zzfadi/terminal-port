import { prepareWithSegments, layoutWithLines } from 'https://esm.sh/@chenglou/pretext@0.0.2';

const content = {
  intro: `Fadi Zuabi\nSenior Firmware Engineer & AI Champion\nBuilding bridges between hardware and AI.\nSolidigm (SK Hynix)`,
  focus: `Current Focus\n\n- Leading AI adoption (70% Copilot increase)\n- Training engineers (60+ trained)\n- Building intelligent firmware systems`,
  skills: `Core Expertise\n\nFirmware: C/C++, NVMe, PCIe Gen5, RTOS\nAI/ML: LLMs, Prompt Eng, DataIku, Snowflake\nCloud: GCP, Python, React`,
  projects: `Notable Work\n\nIntelligent Firmware Debug Agent\nGitHub Copilot Enterprise Deployment\nGEN5 PCIe SSD Tech Lead`
};

const canvas = document.getElementById('pretext-canvas');
const ctx = canvas.getContext('2d', { alpha: false });
let width, height;

// Mouse interaction
const mouse = { x: -1000, y: -1000, radius: 150 };

window.addEventListener('mousemove', (e) => {
  mouse.x = e.clientX;
  mouse.y = e.clientY;
});
window.addEventListener('mouseout', () => {
  mouse.x = -1000;
  mouse.y = -1000;
});

window.addEventListener('touchmove', (e) => {
  mouse.x = e.touches[0].clientX;
  mouse.y = e.touches[0].clientY;
});

function resize() {
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = width * window.devicePixelRatio;
  canvas.height = height * window.devicePixelRatio;
  canvas.style.width = width + 'px';
  canvas.style.height = height + 'px';
  ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
  createParticles();
}

window.addEventListener('resize', resize);

let currentSection = 'intro';
let particles = [];
let targetLines = [];

// Prepare the text via pretext
function createParticles() {
  const text = content[currentSection];
  const isMobile = width < 640;
  const fontSize = isMobile ? 20 : 40;
  const lineHeight = fontSize * 1.5;
  const fontStr = `bold ${fontSize}px "Space Grotesk", sans-serif`;
  
  // Use pretext to layout the text (pre-wrap avoids squishing spaces)
  const prepared = prepareWithSegments(text, fontStr, { whiteSpace: 'pre-wrap' });
  const maxW = isMobile ? width * 0.9 : width * 0.7;
  
  // layoutWithLines returns exactly how lines should break
  const { lines, height: totalH } = layoutWithLines(prepared, maxW, lineHeight);
  
  targetLines = [];
  const startY = (height - totalH) / 2 + fontSize/2;
  
  lines.forEach((line, i) => {
    // Basic centering
    const startX = (width - line.width) / 2;
    targetLines.push({
      text: line.text,
      x: startX,
      y: startY + i * lineHeight,
      w: line.width
    });
  });

  const newParticles = [];
  
  targetLines.forEach((line) => {
    ctx.font = fontStr;
    let currX = line.x;
    for(let i = 0; i < line.text.length; i++) {
        const char = line.text[i];
        const meas = ctx.measureText(char);
        if (char.trim() !== '') {
            newParticles.push({
                char,
                tx: currX,       // Target X
                ty: line.y,      // Target Y
                x: width / 2 + (Math.random() - 0.5) * width, // Start random somewhat central
                y: height / 2 + (Math.random() - 0.5) * height,
                vx: 0,
                vy: 0,
                // Make first line distinct in color if we want, or a gradient
                color: '#5e6ad2' 
            });
        }
        currX += meas.width;
    }
  });

  particles = newParticles;
}

let colorModeDark = true;

function render() {
  // Querying theme continuously can be slow, but for pure visual sake it's fine.
  // We'll cache the property outside ideally, but let's just do it simple:
  colorModeDark = !matchMedia('(prefers-color-scheme: light)').matches;
  
  ctx.fillStyle = colorModeDark ? '#050505' : '#f5f5f7';
  ctx.fillRect(0, 0, width, height);

  const isMobile = width < 640;
  const fontSize = isMobile ? 20 : 40;
  ctx.font = `bold ${fontSize}px "Space Grotesk", sans-serif`;
  ctx.textBaseline = 'middle';
  
  const baseTColor = colorModeDark ? '#ededed' : '#121212';
  
  particles.forEach(p => {
    const dxT = p.tx - p.x;
    const dyT = p.ty - p.y;
    
    const dxM = mouse.x - p.x;
    const dyM = mouse.y - p.y;
    const distM = Math.sqrt(dxM*dxM + dyM*dyM);
    
    // Spring physics towards target
    let ax = dxT * 0.08;
    let ay = dyT * 0.08;
    
    // Mouse repulsion
    if (distM < mouse.radius) {
      const force = (mouse.radius - distM) / mouse.radius;
      ax -= (dxM / distM) * force * 20;
      ay -= (dyM / distM) * force * 20;
      
      ctx.fillStyle = p.color; // Highlight color when disturbed
    } else {
      ctx.fillStyle = baseTColor;
    }
    
    p.vx += ax;
    p.vy += ay;
    
    // Friction
    p.vx *= 0.75;
    p.vy *= 0.75;
    
    p.x += p.vx;
    p.y += p.vy;
    
    ctx.fillText(p.char, p.x, p.y);
  });
  
  requestAnimationFrame(render);
}

// Nav controls
document.querySelectorAll('.controls button').forEach(btn => {
  btn.addEventListener('click', (e) => {
    document.querySelector('.controls button.active')?.classList.remove('active');
    e.target.classList.add('active');
    currentSection = e.target.dataset.section;
    createParticles();
  });
});

// Since we use document.fonts.ready, we wait for full load to measure correctly
document.fonts.ready.then(() => {
  resize();
  render();
});
