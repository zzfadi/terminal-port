document.addEventListener('DOMContentLoaded', () => {
    const navBtns = document.querySelectorAll('.nav-btn');
    const sections = document.querySelectorAll('.game-section');
    const scoreValue = document.querySelector('.score-box:first-child .value');
    let score = 0;

    // Navigation Logic
    navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.getAttribute('data-target');
            
            // Update Buttons
            navBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Update Sections
            sections.forEach(section => {
                section.classList.remove('active');
                if (section.id === targetId) {
                    section.classList.add('active');
                }
            });

            // Play sound effect (simulated)
            playBlip();
            
            // Increment Score
            score += 100;
            updateScore();
        });
    });

    // Insert Coin / Start Logic
    const insertCoin = document.querySelector('.insert-coin');
    if (insertCoin) {
        insertCoin.addEventListener('click', () => {
            document.querySelector('.game-nav').scrollIntoView({ behavior: 'smooth' });
            playCoinSound();
            score += 500; // Bonus for starting
            updateScore();
        });
    }

    // Score Updater
    function updateScore() {
        scoreValue.textContent = score.toString().padStart(2, '0');
    }

    // Sound Simulation (Visual feedback in console for now, or actual Audio if we had assets)
    function playBlip() {
        // console.log('Blip!');
    }

    function playCoinSound() {
        // console.log('Coin!');
    }

    // Glitch effect randomizer
    const glitchText = document.querySelector('.glitch');
    if (glitchText) {
        setInterval(() => {
            const original = glitchText.getAttribute('data-text');
            if (Math.random() > 0.95) {
                glitchText.textContent = getRandomChars(original.length);
                setTimeout(() => {
                    glitchText.textContent = original;
                }, 100);
            }
        }, 2000);
    }

    function getRandomChars(length) {
        const chars = '!@#$%^&*()_+-=[]{}|;:,.<>?';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }
});
