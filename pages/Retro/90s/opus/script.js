/**
 * ~*~ Fadi's Cyber Crib ~*~
 * 90s Retro Web Experience
 * Built with Claude Opus 4.5 (Preview)
 */

(function() {
  'use strict';

  // ==========================================
  // VISITOR COUNTER (Fake but authentic feeling)
  // ==========================================
  
  function initVisitorCounter() {
    const counterEl = document.querySelector('.counter');
    if (!counterEl) return;
    
    // Start with a "base" count and add some randomness
    const baseCount = 42000;
    const sessionAddition = Math.floor(Math.random() * 100);
    let currentCount = baseCount + sessionAddition;
    
    // Animate the counter on load
    const targetCount = currentCount;
    let displayCount = targetCount - 50;
    
    const counterInterval = setInterval(() => {
      displayCount++;
      counterEl.textContent = displayCount.toLocaleString();
      
      if (displayCount >= targetCount) {
        clearInterval(counterInterval);
      }
    }, 50);
    
    // Occasionally increment (as if someone else visited)
    setInterval(() => {
      if (Math.random() > 0.7) {
        currentCount++;
        counterEl.textContent = currentCount.toLocaleString();
        
        // Flash effect
        counterEl.style.color = '#ff00ff';
        setTimeout(() => {
          counterEl.style.color = '';
        }, 200);
      }
    }, 5000);
  }

  // ==========================================
  // SMOOTH SCROLL FOR NAV LINKS
  // ==========================================
  
  function initSmoothScroll() {
    const navLinks = document.querySelectorAll('.nav-btn[href^="#"]');
    
    navLinks.forEach(link => {
      link.addEventListener('click', function(e) {
        e.preventDefault();
        
        const targetId = this.getAttribute('href');
        const targetEl = document.querySelector(targetId);
        
        if (targetEl) {
          // Add some 90s flair with a flash effect
          targetEl.style.outline = '3px solid #00ffff';
          targetEl.style.outlineOffset = '5px';
          
          targetEl.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
          
          setTimeout(() => {
            targetEl.style.outline = '';
            targetEl.style.outlineOffset = '';
          }, 1000);
        }
      });
    });
  }

  // ==========================================
  // BUTTON PRESS SOUND EFFECT (Visual)
  // ==========================================
  
  function initButtonEffects() {
    const buttons = document.querySelectorAll('.nav-btn, .link-btn');
    
    buttons.forEach(btn => {
      btn.addEventListener('mousedown', function() {
        this.style.filter = 'brightness(0.8)';
      });
      
      btn.addEventListener('mouseup', function() {
        this.style.filter = '';
      });
      
      btn.addEventListener('mouseleave', function() {
        this.style.filter = '';
      });
    });
  }

  // ==========================================
  // TYPING EFFECT FOR MARQUEE
  // ==========================================
  
  function initMarquee() {
    const marquee = document.querySelector('.marquee span');
    if (!marquee) return;
    
    // Update the marquee text periodically with 90s messages
    const messages = [
      '★彡 WELCOME TO FADI\'S CYBER CRIB 彡★ --- Your #1 Source for Firmware & AI Excellence --- Hit Counter: 000042069 --- Best viewed in 800x600 --- ',
      '★彡 THANKS FOR STOPPING BY 彡★ --- Don\'t forget to sign the guestbook! --- ICQ: 123456789 --- AIM: FadiTech99 --- ',
      '★彡 UNDER CONSTRUCTION 彡★ --- New sections coming soon! --- Check back often! --- You are visitor #42069 --- ',
    ];
    
    let messageIndex = 0;
    
    setInterval(() => {
      messageIndex = (messageIndex + 1) % messages.length;
      marquee.textContent = messages[messageIndex];
    }, 30000);
  }

  // ==========================================
  // SKILL BARS ANIMATION ON SCROLL
  // ==========================================
  
  function initSkillBarsAnimation() {
    const skillBars = document.querySelectorAll('.skill-fill');
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.animation = 'fillBar 1s ease-out forwards';
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });
    
    skillBars.forEach(bar => {
      // Reset animation initially
      bar.style.width = '0';
      bar.style.animation = 'none';
      
      observer.observe(bar);
    });
    
    // Re-trigger animation after observation
    setTimeout(() => {
      skillBars.forEach(bar => {
        const fill = bar.style.getPropertyValue('--fill') || 
                     getComputedStyle(bar).getPropertyValue('--fill');
        bar.style.width = fill;
      });
    }, 100);
  }

  // ==========================================
  // CURSOR TRAIL EFFECT (90s classic!)
  // ==========================================
  
  function initCursorTrail() {
    const colors = ['#ff00ff', '#00ffff', '#ffff00', '#39ff14'];
    const particles = [];
    const maxParticles = 15;
    
    document.addEventListener('mousemove', (e) => {
      // Only create trail on desktop
      if (window.innerWidth < 640) return;
      
      const particle = document.createElement('div');
      particle.style.cssText = `
        position: fixed;
        pointer-events: none;
        z-index: 10000;
        width: 8px;
        height: 8px;
        background: ${colors[Math.floor(Math.random() * colors.length)]};
        left: ${e.clientX}px;
        top: ${e.clientY}px;
        border-radius: 0;
        transform: translate(-50%, -50%);
        opacity: 1;
        transition: opacity 0.5s, transform 0.5s;
      `;
      
      document.body.appendChild(particle);
      particles.push(particle);
      
      // Fade out and remove
      setTimeout(() => {
        particle.style.opacity = '0';
        particle.style.transform = 'translate(-50%, -50%) scale(0)';
      }, 50);
      
      setTimeout(() => {
        if (particle.parentNode) {
          particle.parentNode.removeChild(particle);
        }
        particles.shift();
      }, 550);
      
      // Limit particles
      if (particles.length > maxParticles) {
        const oldParticle = particles.shift();
        if (oldParticle && oldParticle.parentNode) {
          oldParticle.parentNode.removeChild(oldParticle);
        }
      }
    });
  }

  // ==========================================
  // RANDOM "NEW" BADGE BLINK
  // ==========================================
  
  function initRandomEffects() {
    // Make some elements randomly flash
    const flashElements = document.querySelectorAll('.project-card');
    
    flashElements.forEach((el, index) => {
      setInterval(() => {
        if (Math.random() > 0.9) {
          el.style.boxShadow = '0 0 20px rgba(255, 0, 255, 0.5)';
          setTimeout(() => {
            el.style.boxShadow = '';
          }, 200);
        }
      }, 3000 + (index * 500));
    });
  }

  // ==========================================
  // KONAMI CODE EASTER EGG
  // ==========================================
  
  function initKonamiCode() {
    const konamiCode = [
      'ArrowUp', 'ArrowUp', 
      'ArrowDown', 'ArrowDown', 
      'ArrowLeft', 'ArrowRight', 
      'ArrowLeft', 'ArrowRight', 
      'b', 'a'
    ];
    let konamiIndex = 0;
    
    document.addEventListener('keydown', (e) => {
      const key = e.key;
      
      if (key === konamiCode[konamiIndex]) {
        konamiIndex++;
        
        if (konamiIndex === konamiCode.length) {
          // Easter egg activated!
          activateKonamiEasterEgg();
          konamiIndex = 0;
        }
      } else {
        konamiIndex = 0;
      }
    });
  }
  
  function activateKonamiEasterEgg() {
    // 90s style rainbow mode!
    const style = document.createElement('style');
    style.id = 'konami-style';
    style.textContent = `
      @keyframes rainbow {
        0% { filter: hue-rotate(0deg); }
        100% { filter: hue-rotate(360deg); }
      }
      
      body {
        animation: rainbow 3s linear infinite !important;
      }
      
      * {
        cursor: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32'%3E%3Ctext y='24' font-size='24'%3E🎮%3C/text%3E%3C/svg%3E"), auto !important;
      }
    `;
    document.head.appendChild(style);
    
    // Show message
    const message = document.createElement('div');
    message.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: #000;
      border: 4px solid #ff00ff;
      padding: 20px 40px;
      z-index: 100000;
      font-family: 'Press Start 2P', monospace;
      font-size: 16px;
      color: #00ffff;
      text-align: center;
      animation: blink 0.5s step-end infinite;
    `;
    message.innerHTML = '🎮 CHEAT ACTIVATED! 🎮<br><br>+30 LIVES<br>ALL WEAPONS UNLOCKED';
    document.body.appendChild(message);
    
    // Remove after 5 seconds
    setTimeout(() => {
      message.remove();
      const konamiStyle = document.getElementById('konami-style');
      if (konamiStyle) {
        konamiStyle.remove();
      }
    }, 5000);
  }

  // ==========================================
  // INITIALIZATION
  // ==========================================
  
  function init() {
    initVisitorCounter();
    initSmoothScroll();
    initButtonEffects();
    initMarquee();
    initSkillBarsAnimation();
    initCursorTrail();
    initRandomEffects();
    initKonamiCode();
    
    // Console message (very 90s webmaster thing)
    console.log('%c~*~ Welcome to Fadi\'s Cyber Crib ~*~', 
      'font-size: 20px; color: #ff00ff; font-family: "Courier New"; background: #000; padding: 10px;');
    console.log('%cView source to see how this page was made!', 
      'font-size: 12px; color: #00ffff;');
    console.log('%cTry the Konami Code for a surprise! ↑↑↓↓←→←→BA', 
      'font-size: 12px; color: #ffff00;');
  }
  
  // Run when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
