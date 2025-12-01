/**
 * Game of Life Portfolio — Interactive Background
 * Conway's Game of Life simulation running behind the portfolio content
 */

class GameOfLife {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.cellSize = 15; // Smaller cells = more activity
    this.running = true;
    this.generation = 0;
    this.lastUpdate = 0;
    this.updateInterval = 100; // Faster updates
    this.lastInjection = 0;
    this.injectionInterval = 3000; // Inject new patterns every 3 seconds
    this.isDrawing = false; // Track mouse drag for continuous drawing
    this.currentPatternIndex = 0; // Cycle through patterns on click
    
    // Colors
    this.colors = {
      alive: getComputedStyle(document.documentElement).getPropertyValue('--cell-alive').trim() || '#4ade80',
      dead: 'transparent',
      grid: 'rgba(74, 222, 128, 0.03)'
    };
    
    // Famous patterns library
    this.patterns = {
      // Gliders (move diagonally)
      gliderSE: [[0,1], [1,2], [2,0], [2,1], [2,2]],
      gliderSW: [[0,1], [1,0], [2,0], [2,1], [2,2]],
      gliderNE: [[0,0], [0,1], [0,2], [1,2], [2,1]],
      gliderNW: [[0,0], [0,1], [0,2], [1,0], [2,1]],
      
      // Lightweight Spaceship (moves horizontally)
      lwss: [[0,1], [0,4], [1,0], [2,0], [2,4], [3,0], [3,1], [3,2], [3,3]],
      
      // R-pentomino (chaotic, creates lots of activity)
      rpentomino: [[0,1], [0,2], [1,0], [1,1], [2,1]],
      
      // Acorn (takes 5206 generations to stabilize!)
      acorn: [[0,1], [1,3], [2,0], [2,1], [2,4], [2,5], [2,6]],
      
      // Diehard (vanishes after 130 generations)
      diehard: [[0,6], [1,0], [1,1], [2,1], [2,5], [2,6], [2,7]],
      
      // Gosper Glider Gun (creates infinite gliders)
      gliderGun: [
        [0,24], [1,22], [1,24], [2,12], [2,13], [2,20], [2,21], [2,34], [2,35],
        [3,11], [3,15], [3,20], [3,21], [3,34], [3,35], [4,0], [4,1], [4,10],
        [4,16], [4,20], [4,21], [5,0], [5,1], [5,10], [5,14], [5,16], [5,17],
        [5,22], [5,24], [6,10], [6,16], [6,24], [7,11], [7,15], [8,12], [8,13]
      ],
      
      // Pulsar (oscillator)
      pulsar: [
        [0,2], [0,3], [0,4], [0,8], [0,9], [0,10],
        [2,0], [2,5], [2,7], [2,12], [3,0], [3,5], [3,7], [3,12],
        [4,0], [4,5], [4,7], [4,12], [5,2], [5,3], [5,4], [5,8], [5,9], [5,10],
        [7,2], [7,3], [7,4], [7,8], [7,9], [7,10],
        [8,0], [8,5], [8,7], [8,12], [9,0], [9,5], [9,7], [9,12],
        [10,0], [10,5], [10,7], [10,12], [12,2], [12,3], [12,4], [12,8], [12,9], [12,10]
      ],
      
      // Pentadecathlon (oscillator with period 15)
      pentadecathlon: [[0,1], [1,1], [2,0], [2,2], [3,1], [4,1], [5,1], [6,1], [7,0], [7,2], [8,1], [9,1]]
    };
    
    // Interactive patterns (for clicking)
    this.clickPatterns = [
      'gliderSE', 'gliderSW', 'gliderNE', 'gliderNW', 
      'lwss', 'rpentomino', 'acorn', 'pulsar'
    ];
    
    this.init();
    this.setupEventListeners();
  }
  
  init() {
    this.resize();
    this.initGrid();
    this.seedPatterns();
    this.animate();
  }
  
  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.cols = Math.ceil(this.canvas.width / this.cellSize);
    this.rows = Math.ceil(this.canvas.height / this.cellSize);
  }
  
  initGrid() {
    this.grid = Array(this.rows).fill(null).map(() => 
      Array(this.cols).fill(0)
    );
    this.nextGrid = Array(this.rows).fill(null).map(() => 
      Array(this.cols).fill(0)
    );
  }
  
  addPattern(patternName, startRow, startCol, flipH = false, flipV = false) {
    const pattern = this.patterns[patternName];
    if (!pattern) return;
    
    pattern.forEach(([r, c]) => {
      let row = flipV ? startRow - r : startRow + r;
      let col = flipH ? startCol - c : startCol + c;
      row = (row + this.rows) % this.rows;
      col = (col + this.cols) % this.cols;
      this.grid[row][col] = 1;
    });
  }
  
  seedPatterns() {
    // Add multiple gliders traveling in different directions
    const margin = 5;
    
    // Gliders from corners
    this.addPattern('gliderSE', margin, margin);
    this.addPattern('gliderSW', margin, this.cols - margin);
    this.addPattern('gliderNE', this.rows - margin, margin);
    this.addPattern('gliderNW', this.rows - margin, this.cols - margin);
    
    // Add a glider gun in the top area (if space permits)
    if (this.cols > 40 && this.rows > 20) {
      this.addPattern('gliderGun', 5, 5);
    }
    
    // Add some R-pentominos for chaos
    for (let i = 0; i < 3; i++) {
      const row = Math.floor(Math.random() * (this.rows - 20)) + 10;
      const col = Math.floor(Math.random() * (this.cols - 20)) + 10;
      this.addPattern('rpentomino', row, col);
    }
    
    // Add spaceships
    for (let i = 0; i < 2; i++) {
      const row = Math.floor(Math.random() * (this.rows - 10)) + 5;
      this.addPattern('lwss', row, 5);
    }
    
    // Add some oscillators
    const pulsarRow = Math.floor(this.rows / 2);
    const pulsarCol = Math.floor(this.cols / 2);
    this.addPattern('pulsar', pulsarRow, pulsarCol);
    
    // Scatter some random gliders
    for (let i = 0; i < 8; i++) {
      const row = Math.floor(Math.random() * this.rows);
      const col = Math.floor(Math.random() * this.cols);
      const gliderTypes = ['gliderSE', 'gliderSW', 'gliderNE', 'gliderNW'];
      this.addPattern(gliderTypes[Math.floor(Math.random() * 4)], row, col);
    }
  }
  
  injectLife() {
    // Periodically add new patterns to keep things interesting
    const patterns = ['gliderSE', 'gliderSW', 'gliderNE', 'gliderNW', 'lwss', 'rpentomino'];
    const patternName = patterns[Math.floor(Math.random() * patterns.length)];
    
    // Add from edges
    const edge = Math.floor(Math.random() * 4);
    let row, col;
    
    switch(edge) {
      case 0: // Top
        row = 2;
        col = Math.floor(Math.random() * this.cols);
        break;
      case 1: // Right
        row = Math.floor(Math.random() * this.rows);
        col = this.cols - 5;
        break;
      case 2: // Bottom
        row = this.rows - 5;
        col = Math.floor(Math.random() * this.cols);
        break;
      case 3: // Left
        row = Math.floor(Math.random() * this.rows);
        col = 2;
        break;
    }
    
    this.addPattern(patternName, row, col);
  }
  
  countNeighbors(row, col) {
    let count = 0;
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        if (i === 0 && j === 0) continue;
        
        const newRow = (row + i + this.rows) % this.rows;
        const newCol = (col + j + this.cols) % this.cols;
        count += this.grid[newRow][newCol];
      }
    }
    return count;
  }
  
  update() {
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        const neighbors = this.countNeighbors(row, col);
        const alive = this.grid[row][col];
        
        if (alive) {
          // Rule 1 & 3: Underpopulation (<2) or overpopulation (>3)
          this.nextGrid[row][col] = (neighbors === 2 || neighbors === 3) ? 1 : 0;
        } else {
          // Rule 4: Reproduction (exactly 3 neighbors)
          this.nextGrid[row][col] = (neighbors === 3) ? 1 : 0;
        }
      }
    }
    
    // Swap grids
    [this.grid, this.nextGrid] = [this.nextGrid, this.grid];
    this.generation++;
    
    // Update generation counter in UI
    const counter = document.getElementById('generation-count');
    if (counter) {
      counter.textContent = this.generation.toLocaleString();
    }
    
    // Count alive cells
    let aliveCount = 0;
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        aliveCount += this.grid[row][col];
      }
    }
    
    // If population is getting too low, inject new life
    const minPopulation = Math.floor((this.rows * this.cols) * 0.005); // 0.5% of grid
    if (aliveCount < minPopulation) {
      this.injectLife();
      this.injectLife();
    }
  }
  
  draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Draw grid lines (subtle)
    this.ctx.strokeStyle = this.colors.grid;
    this.ctx.lineWidth = 0.5;
    
    for (let col = 0; col <= this.cols; col++) {
      this.ctx.beginPath();
      this.ctx.moveTo(col * this.cellSize, 0);
      this.ctx.lineTo(col * this.cellSize, this.canvas.height);
      this.ctx.stroke();
    }
    
    for (let row = 0; row <= this.rows; row++) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, row * this.cellSize);
      this.ctx.lineTo(this.canvas.width, row * this.cellSize);
      this.ctx.stroke();
    }
    
    // Draw cells
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        if (this.grid[row][col]) {
          const x = col * this.cellSize;
          const y = row * this.cellSize;
          
          // Cell glow effect
          const gradient = this.ctx.createRadialGradient(
            x + this.cellSize / 2, y + this.cellSize / 2, 0,
            x + this.cellSize / 2, y + this.cellSize / 2, this.cellSize
          );
          gradient.addColorStop(0, this.colors.alive);
          gradient.addColorStop(0.5, this.colors.alive + '80');
          gradient.addColorStop(1, 'transparent');
          
          this.ctx.fillStyle = gradient;
          this.ctx.fillRect(
            x - this.cellSize / 2, 
            y - this.cellSize / 2, 
            this.cellSize * 2, 
            this.cellSize * 2
          );
          
          // Solid cell
          this.ctx.fillStyle = this.colors.alive;
          this.ctx.fillRect(
            x + 2, 
            y + 2, 
            this.cellSize - 4, 
            this.cellSize - 4
          );
        }
      }
    }
  }
  
  animate(timestamp = 0) {
    if (this.running && timestamp - this.lastUpdate > this.updateInterval) {
      this.update();
      this.lastUpdate = timestamp;
    }
    
    // Periodic injection of new patterns
    if (this.running && timestamp - this.lastInjection > this.injectionInterval) {
      this.injectLife();
      this.lastInjection = timestamp;
    }
    
    this.draw();
    requestAnimationFrame((t) => this.animate(t));
  }
  
  toggle() {
    this.running = !this.running;
    return this.running;
  }
  
  addCellAtPosition(x, y) {
    const col = Math.floor(x / this.cellSize);
    const row = Math.floor(y / this.cellSize);
    
    if (row >= 0 && row < this.rows && col >= 0 && col < this.cols) {
      // Cycle through different patterns on each click
      const patternName = this.clickPatterns[this.currentPatternIndex];
      this.addPattern(patternName, row, col);
      this.currentPatternIndex = (this.currentPatternIndex + 1) % this.clickPatterns.length;
    }
  }
  
  drawAtPosition(x, y) {
    // For drag drawing - just toggle individual cells
    const col = Math.floor(x / this.cellSize);
    const row = Math.floor(y / this.cellSize);
    
    if (row >= 0 && row < this.rows && col >= 0 && col < this.cols) {
      // Draw a small cluster
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const newRow = (row + dr + this.rows) % this.rows;
          const newCol = (col + dc + this.cols) % this.cols;
          if (Math.random() > 0.3) { // 70% chance to fill each cell
            this.grid[newRow][newCol] = 1;
          }
        }
      }
    }
  }
  
  setupEventListeners() {
    // Resize handler
    window.addEventListener('resize', () => {
      const oldGrid = this.grid;
      this.resize();
      this.initGrid();
      
      // Copy old grid data to new grid
      for (let row = 0; row < Math.min(oldGrid.length, this.rows); row++) {
        for (let col = 0; col < Math.min(oldGrid[0].length, this.cols); col++) {
          this.grid[row][col] = oldGrid[row][col];
        }
      }
    });
    
    // Click on document to add patterns (clicks pass through to canvas coordinates)
    document.addEventListener('click', (e) => {
      // Ignore clicks on interactive elements
      const interactive = ['A', 'BUTTON', 'INPUT', 'TEXTAREA', 'SELECT'];
      if (interactive.includes(e.target.tagName)) return;
      if (e.target.closest('a, button, input, textarea, select, .nav, .connect-card')) return;
      
      const x = e.clientX;
      const y = e.clientY;
      this.addCellAtPosition(x, y);
    });
    
    // Mouse drag to draw cells on the whole document
    document.addEventListener('mousedown', (e) => {
      // Ignore on interactive elements
      const interactive = ['A', 'BUTTON', 'INPUT', 'TEXTAREA', 'SELECT'];
      if (interactive.includes(e.target.tagName)) return;
      if (e.target.closest('a, button, input, textarea, select, .nav, .connect-card')) return;
      
      if (e.button === 0) { // Left click
        this.isDrawing = true;
        this.drawAtPosition(e.clientX, e.clientY);
      }
    });
    
    document.addEventListener('mousemove', (e) => {
      if (this.isDrawing) {
        this.drawAtPosition(e.clientX, e.clientY);
      }
    });
    
    document.addEventListener('mouseup', () => {
      this.isDrawing = false;
    });
    
    // Touch support for mobile
    document.addEventListener('touchstart', (e) => {
      const interactive = ['A', 'BUTTON', 'INPUT', 'TEXTAREA', 'SELECT'];
      if (interactive.includes(e.target.tagName)) return;
      if (e.target.closest('a, button, input, textarea, select, .nav, .connect-card')) return;
      
      this.isDrawing = true;
      const touch = e.touches[0];
      this.addCellAtPosition(touch.clientX, touch.clientY);
    }, { passive: true });
    
    document.addEventListener('touchmove', (e) => {
      if (this.isDrawing) {
        const touch = e.touches[0];
        this.drawAtPosition(touch.clientX, touch.clientY);
      }
    }, { passive: true });
    
    document.addEventListener('touchend', () => {
      this.isDrawing = false;
    });
    
    // Toggle button
    const toggleBtn = document.getElementById('toggle-game');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent document click
        const isRunning = this.toggle();
        toggleBtn.querySelector('.control-icon').textContent = isRunning ? '⏸' : '▶';
      });
    }
    
    // Update colors when theme changes
    if (window.matchMedia) {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
        this.colors.alive = getComputedStyle(document.documentElement)
          .getPropertyValue('--cell-alive').trim() || '#4ade80';
      });
    }
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.key === ' ' && e.target.tagName !== 'INPUT') {
        e.preventDefault();
        const isRunning = this.toggle();
        const toggleBtn = document.getElementById('toggle-game');
        if (toggleBtn) {
          toggleBtn.querySelector('.control-icon').textContent = isRunning ? '⏸' : '▶';
        }
      }
      // 'c' to clear
      if (e.key === 'c' && e.target.tagName !== 'INPUT') {
        this.initGrid();
        this.generation = 0;
      }
      // 'r' to reset with new random patterns
      if (e.key === 'r' && e.target.tagName !== 'INPUT') {
        this.initGrid();
        this.generation = 0;
        this.seedPatterns();
      }
    });
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('game-of-life');
  if (canvas) {
    new GameOfLife(canvas);
  }
  
  // Smooth scroll for navigation
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });
});
