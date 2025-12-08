/**
 * 70s Retro Portfolio — Fadi Al Zuabi
 * Smooth scroll and intersection observer animations
 */

(function() {
  'use strict';

  // Intersection Observer for scroll animations
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  // Observe elements for animation
  function initAnimations() {
    const animatedElements = document.querySelectorAll(
      '.about-card, .timeline-item, .work-card, .skill-card, .contact-link'
    );
    
    animatedElements.forEach(el => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(30px)';
      el.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
      observer.observe(el);
    });
  }

  // Add in-view styles
  const style = document.createElement('style');
  style.textContent = `
    .in-view {
      opacity: 1 !important;
      transform: translateY(0) !important;
    }
  `;
  document.head.appendChild(style);

  // Smooth scroll for navigation links
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function(e) {
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
  }

  // Parallax effect for sunburst (subtle)
  function initParallax() {
    const sunburst = document.querySelector('.sunburst');
    if (!sunburst) return;

    let ticking = false;
    
    window.addEventListener('scroll', () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrolled = window.pageYOffset;
          sunburst.style.transform = `translateY(${scrolled * 0.3}px)`;
          ticking = false;
        });
        ticking = true;
      }
    });
  }

  // Header hide on scroll down, show on scroll up
  function initHeaderBehavior() {
    const header = document.querySelector('.header');
    if (!header) return;

    let lastScroll = 0;
    const threshold = 100;

    window.addEventListener('scroll', () => {
      const currentScroll = window.pageYOffset;
      
      if (currentScroll <= 0) {
        header.style.transform = 'translateY(0)';
        return;
      }

      if (currentScroll > lastScroll && currentScroll > threshold) {
        // Scrolling down
        header.style.transform = 'translateY(-100%)';
      } else {
        // Scrolling up
        header.style.transform = 'translateY(0)';
      }

      lastScroll = currentScroll;
    });

    header.style.transition = 'transform 0.3s ease';
  }

  // Stagger animation for stat bubbles
  function initStatBubbles() {
    const bubbles = document.querySelectorAll('.stat-bubble');
    bubbles.forEach((bubble, index) => {
      bubble.style.animationDelay = `${0.6 + index * 0.1}s`;
    });
  }

  // Initialize everything
  function init() {
    // Check for reduced motion preference
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      document.querySelectorAll('.about-card, .timeline-item, .work-card, .skill-card, .contact-link').forEach(el => {
        el.style.opacity = '1';
        el.style.transform = 'none';
      });
      return;
    }

    initAnimations();
    initSmoothScroll();
    initParallax();
    initHeaderBehavior();
    initStatBubbles();
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
