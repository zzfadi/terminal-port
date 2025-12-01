// Snake Game Easter Egg
(function() {
  'use strict';

  // DOM Elements
  const gameOverlay = document.getElementById('game-overlay');
  const gameCanvas = document.getElementById('game-canvas');
  const scoreDisplay = document.getElementById('score');
  const startBtn = document.getElementById('start-btn');
  const gameHint = document.getElementById('game-hint');
  const ctx = gameCanvas.getContext('2d');

  // Game Constants
  const GRID_SIZE = 20;
  const CANVAS_SIZE = gameCanvas.width;
  const CELL_COUNT = CANVAS_SIZE / GRID_SIZE;

  // Game State
  let snake = [];
  let food = { x: 0, y: 0 };
  let direction = { x: 1, y: 0 };
  let nextDirection = { x: 1, y: 0 };
  let score = 0;
  let gameLoop = null;
  let gameSpeed = 120;
  let isGameRunning = false;

  // Colors (matching CSS theme)
  const COLORS = {
    background: '#0a0a0a',
    snake: '#4ade80',
    snakeHead: '#86efac',
    food: '#ef4444',
    grid: '#1a1a1a'
  };

  // Initialize game
  function initGame() {
    snake = [
      { x: 5, y: Math.floor(CELL_COUNT / 2) },
      { x: 4, y: Math.floor(CELL_COUNT / 2) },
      { x: 3, y: Math.floor(CELL_COUNT / 2) }
    ];
    direction = { x: 1, y: 0 };
    nextDirection = { x: 1, y: 0 };
    score = 0;
    scoreDisplay.textContent = score;
    gameSpeed = 120;
    placeFood();
  }

  // Place food at random position
  function placeFood() {
    do {
      food = {
        x: Math.floor(Math.random() * CELL_COUNT),
        y: Math.floor(Math.random() * CELL_COUNT)
      };
    } while (snake.some(segment => segment.x === food.x && segment.y === food.y));
  }

  // Draw game
  function draw() {
    // Clear canvas
    ctx.fillStyle = COLORS.background;
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Draw grid (subtle)
    ctx.strokeStyle = COLORS.grid;
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= CELL_COUNT; i++) {
      ctx.beginPath();
      ctx.moveTo(i * GRID_SIZE, 0);
      ctx.lineTo(i * GRID_SIZE, CANVAS_SIZE);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * GRID_SIZE);
      ctx.lineTo(CANVAS_SIZE, i * GRID_SIZE);
      ctx.stroke();
    }

    // Draw food
    ctx.fillStyle = COLORS.food;
    ctx.beginPath();
    ctx.arc(
      food.x * GRID_SIZE + GRID_SIZE / 2,
      food.y * GRID_SIZE + GRID_SIZE / 2,
      GRID_SIZE / 2 - 2,
      0,
      Math.PI * 2
    );
    ctx.fill();

    // Draw snake
    snake.forEach((segment, index) => {
      ctx.fillStyle = index === 0 ? COLORS.snakeHead : COLORS.snake;
      ctx.beginPath();
      ctx.roundRect(
        segment.x * GRID_SIZE + 1,
        segment.y * GRID_SIZE + 1,
        GRID_SIZE - 2,
        GRID_SIZE - 2,
        4
      );
      ctx.fill();

      // Draw eyes on head
      if (index === 0) {
        ctx.fillStyle = COLORS.background;
        const eyeSize = 3;
        const eyeOffset = 5;
        
        if (direction.x === 1) {
          ctx.fillRect(segment.x * GRID_SIZE + GRID_SIZE - eyeOffset, segment.y * GRID_SIZE + 5, eyeSize, eyeSize);
          ctx.fillRect(segment.x * GRID_SIZE + GRID_SIZE - eyeOffset, segment.y * GRID_SIZE + GRID_SIZE - 8, eyeSize, eyeSize);
        } else if (direction.x === -1) {
          ctx.fillRect(segment.x * GRID_SIZE + eyeOffset - 2, segment.y * GRID_SIZE + 5, eyeSize, eyeSize);
          ctx.fillRect(segment.x * GRID_SIZE + eyeOffset - 2, segment.y * GRID_SIZE + GRID_SIZE - 8, eyeSize, eyeSize);
        } else if (direction.y === 1) {
          ctx.fillRect(segment.x * GRID_SIZE + 5, segment.y * GRID_SIZE + GRID_SIZE - eyeOffset, eyeSize, eyeSize);
          ctx.fillRect(segment.x * GRID_SIZE + GRID_SIZE - 8, segment.y * GRID_SIZE + GRID_SIZE - eyeOffset, eyeSize, eyeSize);
        } else {
          ctx.fillRect(segment.x * GRID_SIZE + 5, segment.y * GRID_SIZE + eyeOffset - 2, eyeSize, eyeSize);
          ctx.fillRect(segment.x * GRID_SIZE + GRID_SIZE - 8, segment.y * GRID_SIZE + eyeOffset - 2, eyeSize, eyeSize);
        }
      }
    });
  }

  // Update game state
  function update() {
    direction = nextDirection;

    // Calculate new head position
    const head = {
      x: snake[0].x + direction.x,
      y: snake[0].y + direction.y
    };

    // Check wall collision
    if (head.x < 0 || head.x >= CELL_COUNT || head.y < 0 || head.y >= CELL_COUNT) {
      gameOver();
      return;
    }

    // Check self collision
    if (snake.some(segment => segment.x === head.x && segment.y === head.y)) {
      gameOver();
      return;
    }

    // Add new head
    snake.unshift(head);

    // Check food collision
    if (head.x === food.x && head.y === food.y) {
      score += 10;
      scoreDisplay.textContent = score;
      placeFood();
      // Speed up slightly
      if (gameSpeed > 60) {
        gameSpeed -= 2;
      }
    } else {
      // Remove tail if no food eaten
      snake.pop();
    }
  }

  // Game over
  function gameOver() {
    isGameRunning = false;
    clearInterval(gameLoop);
    startBtn.textContent = 'Play Again';
    
    // Draw game over message
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    
    ctx.fillStyle = COLORS.food;
    ctx.font = '16px "Press Start 2P"';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', CANVAS_SIZE / 2, CANVAS_SIZE / 2 - 20);
    
    ctx.fillStyle = COLORS.snake;
    ctx.font = '10px "Press Start 2P"';
    ctx.fillText(`Score: ${score}`, CANVAS_SIZE / 2, CANVAS_SIZE / 2 + 20);
  }

  // Main game loop
  function gameLoopFn() {
    update();
    draw();
  }

  // Start game
  function startGame() {
    if (isGameRunning) return;
    
    initGame();
    isGameRunning = true;
    startBtn.textContent = 'Playing...';
    
    gameLoop = setInterval(gameLoopFn, gameSpeed);
  }

  // Show game overlay
  function showGame() {
    gameOverlay.classList.remove('hidden');
    gameHint.style.display = 'none';
    initGame();
    draw();
  }

  // Hide game overlay
  function hideGame() {
    gameOverlay.classList.add('hidden');
    gameHint.style.display = 'block';
    clearInterval(gameLoop);
    isGameRunning = false;
    startBtn.textContent = 'Start Game';
  }

  // Handle keyboard input
  function handleKeydown(e) {
    // Toggle game with 'S' key
    if (e.key.toLowerCase() === 's' && !isInputFocused()) {
      if (gameOverlay.classList.contains('hidden')) {
        showGame();
      }
      return;
    }

    // Close game with Escape
    if (e.key === 'Escape') {
      hideGame();
      return;
    }

    // Game controls (only when game overlay is visible)
    if (!gameOverlay.classList.contains('hidden') && isGameRunning) {
      switch (e.key) {
        case 'ArrowUp':
          if (direction.y !== 1) nextDirection = { x: 0, y: -1 };
          e.preventDefault();
          break;
        case 'ArrowDown':
          if (direction.y !== -1) nextDirection = { x: 0, y: 1 };
          e.preventDefault();
          break;
        case 'ArrowLeft':
          if (direction.x !== 1) nextDirection = { x: -1, y: 0 };
          e.preventDefault();
          break;
        case 'ArrowRight':
          if (direction.x !== -1) nextDirection = { x: 1, y: 0 };
          e.preventDefault();
          break;
      }
    }
  }

  // Check if an input element is focused
  function isInputFocused() {
    const active = document.activeElement;
    return active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA');
  }

  // Event listeners
  document.addEventListener('keydown', handleKeydown);
  startBtn.addEventListener('click', startGame);

  // Click outside game container to close
  gameOverlay.addEventListener('click', function(e) {
    if (e.target === gameOverlay) {
      hideGame();
    }
  });

  // Initial draw
  initGame();
  draw();

  // Smooth scrolling for nav links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // Hide hint after 10 seconds
  setTimeout(() => {
    gameHint.style.opacity = '0.5';
  }, 10000);
})();
