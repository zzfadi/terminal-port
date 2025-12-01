document.addEventListener('DOMContentLoaded', () => {
    const overlay = document.getElementById('game-overlay');
    const closeBtn = document.getElementById('close-game');
    const canvas = document.getElementById('snake-canvas');
    const ctx = canvas.getContext('2d');
    const scoreEl = document.getElementById('score');

    let gameInterval;
    let isGameRunning = false;
    
    // Game Config
    const gridSize = 20;
    const tileCount = canvas.width / gridSize;
    
    let velocityX = 0;
    let velocityY = 0;
    let playerX = 10;
    let playerY = 10;
    
    let trail = [];
    let tail = 5;
    
    let appleX = 15;
    let appleY = 15;
    
    let score = 0;

    // Key Listeners
    document.addEventListener('keydown', (e) => {
        // Toggle Game with 'S'
        if (e.key.toLowerCase() === 's' && !isGameRunning && overlay.classList.contains('hidden')) {
            startGame();
        }
        
        // Game Controls
        if (isGameRunning) {
            switch(e.key) {
                case 'ArrowLeft':
                    if (velocityX !== 1) { velocityX = -1; velocityY = 0; }
                    break;
                case 'ArrowUp':
                    if (velocityY !== 1) { velocityX = 0; velocityY = -1; }
                    break;
                case 'ArrowRight':
                    if (velocityX !== -1) { velocityX = 1; velocityY = 0; }
                    break;
                case 'ArrowDown':
                    if (velocityY !== -1) { velocityX = 0; velocityY = 1; }
                    break;
                case 'Escape':
                    stopGame();
                    break;
            }
        }
    });

    closeBtn.addEventListener('click', stopGame);

    function startGame() {
        overlay.classList.remove('hidden');
        isGameRunning = true;
        resetGame();
        gameInterval = setInterval(gameLoop, 1000/10); // 10 FPS
    }

    function stopGame() {
        overlay.classList.add('hidden');
        isGameRunning = false;
        clearInterval(gameInterval);
    }

    function resetGame() {
        playerX = 10;
        playerY = 10;
        velocityX = 1; // Start moving right
        velocityY = 0;
        trail = [];
        tail = 5;
        score = 0;
        scoreEl.innerText = score;
        spawnApple();
    }

    function spawnApple() {
        appleX = Math.floor(Math.random() * tileCount);
        appleY = Math.floor(Math.random() * tileCount);
    }

    function gameLoop() {
        playerX += velocityX;
        playerY += velocityY;

        // Wrap around screen
        if (playerX < 0) playerX = tileCount - 1;
        if (playerX > tileCount - 1) playerX = 0;
        if (playerY < 0) playerY = tileCount - 1;
        if (playerY > tileCount - 1) playerY = 0;

        // Background
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Snake
        ctx.fillStyle = '#4af626';
        for (let i = 0; i < trail.length; i++) {
            ctx.fillRect(trail[i].x * gridSize, trail[i].y * gridSize, gridSize - 2, gridSize - 2);
            
            // Self collision
            if (trail[i].x === playerX && trail[i].y === playerY) {
                tail = 5;
                score = 0;
                scoreEl.innerText = score;
            }
        }

        trail.push({x: playerX, y: playerY});
        while (trail.length > tail) {
            trail.shift();
        }

        // Apple
        ctx.fillStyle = '#ff0055';
        ctx.fillRect(appleX * gridSize, appleY * gridSize, gridSize - 2, gridSize - 2);

        // Eat Apple
        if (appleX === playerX && appleY === playerY) {
            tail++;
            score += 10;
            scoreEl.innerText = score;
            spawnApple();
        }
    }
});
