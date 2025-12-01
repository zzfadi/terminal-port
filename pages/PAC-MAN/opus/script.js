/**
 * PAC-MAN Portfolio — Interactive Elements
 * Adds arcade-style interactivity and sound effects simulation
 */

document.addEventListener('DOMContentLoaded', () => {
  // Initialize components
  initPacmanAnimation();
  initScoreCounters();
  initGhostChase();
  initKeyboardNav();
});

/**
 * Enhanced PAC-MAN chomp animation
 */
function initPacmanAnimation() {
  const pacman = document.querySelector('.pacman');
  const dots = document.querySelectorAll('.dot');
  
  if (!pacman || !dots.length) return;
  
  let currentDot = 0;
  
  // Simulate eating dots
  setInterval(() => {
    if (currentDot < dots.length) {
      dots[currentDot].style.opacity = '0';
      dots[currentDot].style.transform = 'scale(0)';
      currentDot++;
    } else {
      // Reset dots
      dots.forEach(dot => {
        dot.style.opacity = '1';
        dot.style.transform = 'scale(1)';
      });
      currentDot = 0;
    }
  }, 800);
}

/**
 * Animated score counters
 */
function initScoreCounters() {
  const scoreValues = document.querySelectorAll('.score-item .value');
  
  scoreValues.forEach(scoreEl => {
    const finalValue = scoreEl.textContent;
    const numericValue = parseInt(finalValue);
    
    if (isNaN(numericValue)) return;
    
    // Animate from 0 to final value
    let current = 0;
    const increment = Math.ceil(numericValue / 30);
    const suffix = finalValue.replace(/[0-9]/g, '');
    
    scoreEl.textContent = '0' + suffix;
    
    const counter = setInterval(() => {
      current += increment;
      if (current >= numericValue) {
        current = numericValue;
        clearInterval(counter);
      }
      scoreEl.textContent = current + suffix;
    }, 50);
  });
}

/**
 * Ghost chase animation on scroll
 */
function initGhostChase() {
  const ghosts = document.querySelectorAll('.pacman-scene .ghost');
  
  if (!ghosts.length) return;
  
  // Add hover scatter effect
  const pacmanScene = document.querySelector('.pacman-scene');
  
  pacmanScene?.addEventListener('mouseenter', () => {
    ghosts.forEach((ghost, i) => {
      ghost.style.transition = 'transform 0.3s ease';
      ghost.style.transform = `translateX(${(i + 1) * 20}px) translateY(-10px)`;
    });
  });
  
  pacmanScene?.addEventListener('mouseleave', () => {
    ghosts.forEach(ghost => {
      ghost.style.transform = 'translateY(0)';
    });
  });
}

/**
 * Keyboard navigation for arcade feel
 */
function initKeyboardNav() {
  const sections = document.querySelectorAll('.maze-border');
  let currentSection = 0;
  
  document.addEventListener('keydown', (e) => {
    switch(e.key) {
      case 'ArrowDown':
      case 's':
        e.preventDefault();
        currentSection = Math.min(currentSection + 1, sections.length - 1);
        sections[currentSection]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        highlightSection(sections[currentSection]);
        break;
        
      case 'ArrowUp':
      case 'w':
        e.preventDefault();
        currentSection = Math.max(currentSection - 1, 0);
        sections[currentSection]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        highlightSection(sections[currentSection]);
        break;
        
      case 'Enter':
      case ' ':
        // Activate focused contact button
        const focusedBtn = document.querySelector('.contact-btn:focus');
        if (focusedBtn) {
          focusedBtn.click();
        }
        break;
    }
  });
}

/**
 * Highlight active section
 */
function highlightSection(section) {
  if (!section) return;
  
  // Remove previous highlights
  document.querySelectorAll('.maze-border').forEach(s => {
    s.style.boxShadow = 'none';
  });
  
  // Add highlight to current section
  section.style.boxShadow = '0 0 20px rgba(255, 255, 0, 0.3)';
  
  // Remove after delay
  setTimeout(() => {
    section.style.boxShadow = 'none';
  }, 1000);
}

/**
 * Add coin insert sound effect on contact click
 */
document.querySelectorAll('.contact-btn').forEach(btn => {
  btn.addEventListener('click', function() {
    // Visual feedback
    this.style.transform = 'scale(0.95)';
    setTimeout(() => {
      this.style.transform = 'scale(1.05)';
    }, 100);
  });
});

/**
 * Easter egg: Konami code
 */
const konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
let konamiIndex = 0;

document.addEventListener('keydown', (e) => {
  if (e.key === konamiCode[konamiIndex]) {
    konamiIndex++;
    if (konamiIndex === konamiCode.length) {
      activateKonamiMode();
      konamiIndex = 0;
    }
  } else {
    konamiIndex = 0;
  }
});

function activateKonamiMode() {
  // Rainbow mode!
  document.body.style.animation = 'rainbow 2s linear infinite';
  
  const style = document.createElement('style');
  style.textContent = `
    @keyframes rainbow {
      0% { filter: hue-rotate(0deg); }
      100% { filter: hue-rotate(360deg); }
    }
  `;
  document.head.appendChild(style);
  
  // Reset after 5 seconds
  setTimeout(() => {
    document.body.style.animation = 'none';
    style.remove();
  }, 5000);
}
