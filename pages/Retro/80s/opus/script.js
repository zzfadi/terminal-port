/**
 * 80s Retro Synthwave Portfolio - Interactive Enhancements
 * Fadi Al Zuabi
 */

(function() {
  'use strict';

  // Smooth scroll for navigation links
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      const targetId = this.getAttribute('href');
      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        targetElement.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });

  // Parallax effect for background elements
  let ticking = false;
  
  function updateParallax() {
    const scrollY = window.scrollY;
    const sun = document.querySelector('.sun');
    const gridBg = document.querySelector('.grid-bg');
    
    if (sun) {
      const sunOffset = scrollY * 0.3;
      sun.style.transform = `translateX(-50%) translateY(${sunOffset}px)`;
    }
    
    if (gridBg) {
      const gridOffset = scrollY * 0.1;
      gridBg.style.transform = `perspective(500px) rotateX(60deg) translateY(${gridOffset}px)`;
    }
    
    ticking = false;
  }

  window.addEventListener('scroll', function() {
    if (!ticking) {
      requestAnimationFrame(updateParallax);
      ticking = true;
    }
  });

  // Add neon glow effect on mouse hover for cards
  document.querySelectorAll('.work-card, .skill-block, .stat-card, .connect-link').forEach(card => {
    card.addEventListener('mousemove', function(e) {
      const rect = this.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      this.style.setProperty('--mouse-x', `${x}px`);
      this.style.setProperty('--mouse-y', `${y}px`);
    });
  });

  // Intersection Observer for fade-in animations
  const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.1
  };

  const fadeInObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        fadeInObserver.unobserve(entry.target);
      }
    });
  }, observerOptions);

  // Add fade-in animation to sections
  document.querySelectorAll('section').forEach((section, index) => {
    section.style.opacity = '0';
    section.style.transform = 'translateY(30px)';
    section.style.transition = `opacity 0.6s ease ${index * 0.1}s, transform 0.6s ease ${index * 0.1}s`;
    fadeInObserver.observe(section);
  });

  // Create style for visible class
  const style = document.createElement('style');
  style.textContent = `
    section.visible {
      opacity: 1 !important;
      transform: translateY(0) !important;
    }
  `;
  document.head.appendChild(style);

  // Add typing effect to hero tagline
  const tagline = document.querySelector('.hero-tagline');
  if (tagline) {
    const originalText = tagline.innerHTML;
    const lines = originalText.split('<br>');
    tagline.innerHTML = '';
    
    let lineIndex = 0;
    let charIndex = 0;
    
    function typeWriter() {
      if (lineIndex < lines.length) {
        if (charIndex < lines[lineIndex].length) {
          tagline.innerHTML += lines[lineIndex].charAt(charIndex);
          charIndex++;
          setTimeout(typeWriter, 30);
        } else {
          if (lineIndex < lines.length - 1) {
            tagline.innerHTML += '<br>';
          }
          lineIndex++;
          charIndex = 0;
          setTimeout(typeWriter, 100);
        }
      }
    }
    
    // Start typing after a short delay
    setTimeout(typeWriter, 1500);
  }

  // Random glitch effect on title
  const heroTitle = document.querySelector('.hero-title');
  if (heroTitle) {
    function triggerGlitch() {
      heroTitle.style.animation = 'none';
      heroTitle.offsetHeight; // Trigger reflow
      heroTitle.style.animation = '';
      
      // Schedule next glitch
      const nextGlitch = Math.random() * 5000 + 3000;
      setTimeout(triggerGlitch, nextGlitch);
    }
    
    setTimeout(triggerGlitch, 5000);
  }

  // Add VHS tracking effect on scroll
  let lastScrollY = window.scrollY;
  
  window.addEventListener('scroll', function() {
    const currentScrollY = window.scrollY;
    const scrollDelta = Math.abs(currentScrollY - lastScrollY);
    
    if (scrollDelta > 50) {
      document.body.classList.add('vhs-tracking');
      setTimeout(() => {
        document.body.classList.remove('vhs-tracking');
      }, 200);
    }
    
    lastScrollY = currentScrollY;
  });

  // Add VHS tracking style
  const vhsStyle = document.createElement('style');
  vhsStyle.textContent = `
    body.vhs-tracking::before {
      content: '';
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(
        transparent 0%,
        rgba(255, 42, 109, 0.05) 50%,
        transparent 51%,
        transparent 100%
      );
      background-size: 100% 4px;
      animation: vhsTrack 0.1s linear;
      pointer-events: none;
      z-index: 1001;
    }
    
    @keyframes vhsTrack {
      0% { transform: translateY(-10px); }
      100% { transform: translateY(10px); }
    }
  `;
  document.head.appendChild(vhsStyle);

  // Easter egg: Konami code triggers synthwave mode
  const konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
  let konamiIndex = 0;

  document.addEventListener('keydown', function(e) {
    if (e.key === konamiCode[konamiIndex]) {
      konamiIndex++;
      if (konamiIndex === konamiCode.length) {
        activateSynthwaveMode();
        konamiIndex = 0;
      }
    } else {
      konamiIndex = 0;
    }
  });

  function activateSynthwaveMode() {
    document.body.classList.toggle('synthwave-overdrive');
    
    const overdriveStyle = document.createElement('style');
    overdriveStyle.id = 'synthwave-overdrive-style';
    overdriveStyle.textContent = `
      body.synthwave-overdrive {
        animation: colorCycle 3s linear infinite;
      }
      
      @keyframes colorCycle {
        0%, 100% { filter: hue-rotate(0deg); }
        33% { filter: hue-rotate(60deg); }
        66% { filter: hue-rotate(-60deg); }
      }
      
      body.synthwave-overdrive .sun {
        animation: sunPulse 1s ease-in-out infinite;
      }
      
      @keyframes sunPulse {
        0%, 100% { transform: translateX(-50%) scale(1); }
        50% { transform: translateX(-50%) scale(1.1); }
      }
    `;
    
    if (document.body.classList.contains('synthwave-overdrive')) {
      document.head.appendChild(overdriveStyle);
      console.log('🌴 SYNTHWAVE OVERDRIVE ACTIVATED! 🌴');
    } else {
      const existingStyle = document.getElementById('synthwave-overdrive-style');
      if (existingStyle) existingStyle.remove();
    }
  }

  // Animate stats numbers on scroll into view
  const statNumbers = document.querySelectorAll('.stat-number');
  const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateNumber(entry.target);
        statsObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  statNumbers.forEach(stat => {
    statsObserver.observe(stat);
  });

  function animateNumber(element) {
    const text = element.textContent;
    const number = parseInt(text);
    const suffix = text.replace(/[0-9]/g, '');
    
    if (isNaN(number)) return;
    
    let current = 0;
    const increment = number / 30;
    const duration = 1000;
    const stepTime = duration / 30;
    
    const timer = setInterval(() => {
      current += increment;
      if (current >= number) {
        element.textContent = text;
        clearInterval(timer);
      } else {
        element.textContent = Math.floor(current) + suffix;
      }
    }, stepTime);
  }

  // Console branding
  console.log(`
%c ██████╗  ██████╗ ██╗███████╗
%c██╔═══██╗██╔═══██╗██║██╔════╝
%c╚█████╔╝ ██║   ██║██║███████╗
%c██╔═══██╗██║   ██║╚═╝╚════██║
%c╚██████╔╝╚██████╔╝   ███████║
%c ╚═════╝  ╚═════╝    ╚══════╝
%c
SYNTHWAVE PORTFOLIO - FADI AL ZUABI
Try the Konami Code for a surprise! ↑↑↓↓←→←→BA
  `, 
  'color: #ff2a6d', 
  'color: #d300c5', 
  'color: #05d9e8', 
  'color: #ff6b35', 
  'color: #f9f871',
  'color: #ff2a6d',
  'color: #05d9e8; font-weight: bold'
  );

})();
