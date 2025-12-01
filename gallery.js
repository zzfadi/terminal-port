/**
 * Gallery Navigation System v3
 * Attached Panel Switcher with Model Brand Icons
 * Desktop: Anchored panel | Mobile: Bottom sheet with swipe
 */

(function() {
  'use strict';

  // ============================================
  // Configuration
  // ============================================

  const MODEL_BRANDS = {
    claude: { class: 'claude', icon: 'assets/icons/claude.svg', keywords: ['claude', 'opus', 'haiku'] },
    gpt: { class: 'gpt', icon: 'assets/icons/gpt.svg', keywords: ['gpt', 'openai', 'codex'] },
    gemini: { class: 'gemini', icon: 'assets/icons/gemini.svg', keywords: ['gemini', 'google', 'bard'] },
    grok: { class: 'grok', icon: 'assets/icons/grok.svg', keywords: ['grok', 'xai'] },
    sonnet: { class: 'sonnet', icon: 'assets/icons/sonnet.svg', keywords: ['sonnet'] },
    raptor: { class: 'raptor', icon: 'assets/icons/raptor.svg', keywords: ['raptor'] }
  };

  const DESIGN_ICONS = {
    terminal: '⌘',
    minimal: '◯',
    signal: '〰',
    default: '◆'
  };

  // ============================================
  // State
  // ============================================

  let config = null;
  let currentPageId = null;
  let currentDesignId = null;
  let isOpen = false;
  let touchStartY = 0;
  let currentTheme = null; // null = system, 'light', 'dark'

  // ============================================
  // DOM Elements
  // ============================================

  const frame = document.getElementById('page-frame');
  const trigger = document.getElementById('gallery-trigger');
  const triggerDesign = document.getElementById('trigger-design');
  const triggerModelIcon = document.getElementById('trigger-model-icon');
  const triggerModelName = document.getElementById('trigger-model-name');
  const backdrop = document.getElementById('gallery-backdrop');
  const palette = document.getElementById('gallery-palette');
  const paletteClose = document.getElementById('palette-close');
  const paletteDesigns = document.getElementById('palette-designs');
  const paletteModels = document.getElementById('palette-models');
  const promptBtn = document.getElementById('palette-prompt-btn');
  const promptModalOverlay = document.getElementById('prompt-modal-overlay');
  const promptModalTitle = document.getElementById('prompt-modal-title');
  const promptModalContent = document.getElementById('prompt-modal-content');
  const promptModalClose = document.getElementById('prompt-modal-close');
  const loadingOverlay = document.getElementById('loading-overlay');
  const keyboardHint = document.getElementById('keyboard-hint');
  const themeToggleBtn = document.getElementById('theme-toggle');

  // ============================================
  // Theme Management (controls iframe pages)
  // ============================================

  function initTheme() {
    const savedTheme = localStorage.getItem('gallery-theme');
    if (savedTheme) {
      currentTheme = savedTheme;
    } else {
      // Default to system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      currentTheme = prefersDark ? 'dark' : 'light';
    }
    applyThemeToFrame();
    updateThemeButton();
  }

  function toggleTheme() {
    currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('gallery-theme', currentTheme);
    applyThemeToFrame();
    updateThemeButton();
  }

  function updateThemeButton() {
    themeToggleBtn.classList.toggle('light-mode', currentTheme === 'light');
  }

  function applyThemeToFrame() {
    // Method 1: Apply color-scheme to iframe (works in Chrome)
    frame.style.colorScheme = currentTheme;
    
    // Method 2: Try to inject into iframe document if same-origin (works in Safari)
    try {
      if (frame.contentDocument && frame.contentDocument.documentElement) {
        const doc = frame.contentDocument;
        const html = doc.documentElement;
        
        // Set color-scheme on html element
        html.style.colorScheme = currentTheme;
        
        // Add/update a style tag that forces theme by overriding CSS variables
        // This is the most reliable cross-browser method
        let themeStyle = doc.getElementById('gallery-theme-override');
        if (!themeStyle) {
          themeStyle = doc.createElement('style');
          themeStyle.id = 'gallery-theme-override';
          doc.head.appendChild(themeStyle);
        }
        
        // For Safari: Override CSS variables commonly used in pages
        // This approach directly sets the CSS custom properties that pages use
        if (currentTheme === 'dark') {
          themeStyle.textContent = `
            :root {
              color-scheme: dark !important;
              /* Common dark theme overrides for minimal pages */
              --bg: #0a0a0a !important;
              --bg-alt: #141414 !important;
              --text-primary: #f5f5f5 !important;
              --text-secondary: #a0a0a0 !important;
              --text-muted: #666666 !important;
              --accent-light: #1a2a3d !important;
              --border: #2a2a2a !important;
              --shadow: rgba(0, 0, 0, 0.3) !important;
            }
            html, body {
              color-scheme: dark !important;
            }
          `;
        } else {
          themeStyle.textContent = `
            :root {
              color-scheme: light !important;
              /* Common light theme overrides for minimal pages */
              --bg: #fafafa !important;
              --bg-alt: #ffffff !important;
              --text-primary: #111111 !important;
              --text-secondary: #555555 !important;
              --text-muted: #888888 !important;
              --accent-light: #e6f0ff !important;
              --border: #e5e5e5 !important;
              --shadow: rgba(0, 0, 0, 0.06) !important;
            }
            html, body {
              color-scheme: light !important;
            }
          `;
        }
        
        // Also set data attribute for pages that use it
        html.setAttribute('data-theme', currentTheme);
      }
    } catch (e) {
      // Cross-origin iframe, can only rely on color-scheme style on iframe element
      console.log('Could not inject theme into iframe (cross-origin)');
    }
  }

  // ============================================
  // Config Loading
  // ============================================

  async function loadConfig() {
    try {
      const response = await fetch('config.json?v=2');
      config = await response.json();
      return config;
    } catch (error) {
      console.error('Failed to load config:', error);
      return null;
    }
  }

  // ============================================
  // Brand Detection
  // ============================================

  function detectBrand(modelName) {
    const lower = modelName.toLowerCase();

    // Special case: Sonnet is Claude family but has its own color
    if (lower.includes('sonnet')) {
      return MODEL_BRANDS.sonnet;
    }

    // Special case: Opus is Claude family
    if (lower.includes('opus') || lower.includes('claude')) {
      return MODEL_BRANDS.claude;
    }

    for (const [key, brand] of Object.entries(MODEL_BRANDS)) {
      if (brand.keywords.some(kw => lower.includes(kw))) {
        return brand;
      }
    }

    return { class: 'claude', icon: 'assets/icons/claude.svg' }; // Fallback
  }

  function getDesignIcon(designId) {
    return DESIGN_ICONS[designId] || DESIGN_ICONS.default;
  }

  // ============================================
  // SVG Icon Creators (Safe DOM methods)
  // ============================================

  function createCalendarIcon() {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '2');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');

    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', '3');
    rect.setAttribute('y', '4');
    rect.setAttribute('width', '18');
    rect.setAttribute('height', '18');
    rect.setAttribute('rx', '2');
    rect.setAttribute('ry', '2');
    svg.appendChild(rect);

    const line1 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line1.setAttribute('x1', '16');
    line1.setAttribute('y1', '2');
    line1.setAttribute('x2', '16');
    line1.setAttribute('y2', '6');
    svg.appendChild(line1);

    const line2 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line2.setAttribute('x1', '8');
    line2.setAttribute('y1', '2');
    line2.setAttribute('x2', '8');
    line2.setAttribute('y2', '6');
    svg.appendChild(line2);

    const line3 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line3.setAttribute('x1', '3');
    line3.setAttribute('y1', '10');
    line3.setAttribute('x2', '21');
    line3.setAttribute('y2', '10');
    svg.appendChild(line3);

    return svg;
  }

  function createCheckIcon() {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '3');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');

    const polyline = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
    polyline.setAttribute('points', '20 6 9 17 4 12');
    svg.appendChild(polyline);

    return svg;
  }

  // ============================================
  // Helpers
  // ============================================

  function findPageById(pageId) {
    for (const design of config.designs) {
      const model = design.models.find(m => m.id === pageId);
      if (model) return { design, model };
    }
    return null;
  }

  function getDesignById(designId) {
    return config.designs.find(d => d.id === designId);
  }

  function getShortModelName(modelName) {
    let short = modelName;
    // Remove common prefixes
    short = short.replace(/^Claude\s+/i, '');
    short = short.replace(/^OpenAI\s+/i, '');
    short = short.replace(/^Google\s+/i, '');
    return short;
  }

  function clearElement(element) {
    while (element.firstChild) {
      element.removeChild(element.firstChild);
    }
  }

  // ============================================
  // URL Routing
  // ============================================

  function getPageIdFromHash() {
    const hash = window.location.hash.slice(1);
    return hash || null;
  }

  function setHashForPage(pageId) {
    history.pushState(null, '', '#' + pageId);
  }

  // ============================================
  // Trigger Button Updates
  // ============================================

  function updateTrigger(design, model) {
    triggerDesign.textContent = design.label;

    const brand = detectBrand(model.model);
    triggerModelIcon.className = 'trigger-model-icon model-icon ' + brand.class;

    // Clear and add icon
    clearElement(triggerModelIcon);
    const iconImg = document.createElement('img');
    iconImg.src = brand.icon;
    iconImg.alt = model.model + ' icon';
    triggerModelIcon.appendChild(iconImg);

    triggerModelName.textContent = getShortModelName(model.model);
  }

  // ============================================
  // Page Loading
  // ============================================

  function loadPage(pageId) {
    const result = findPageById(pageId);
    if (!result) {
      console.error('Page not found:', pageId);
      return;
    }

    const { design, model } = result;

    // Show loading
    loadingOverlay.classList.add('visible');
    frame.classList.add('loading');

    // Update URL
    setHashForPage(pageId);

    // Update state
    currentPageId = pageId;
    currentDesignId = design.id;

    // Update trigger display
    updateTrigger(design, model);

    // Load page in iframe
    frame.src = model.path;

    // Update UI states
    updateDesignChips();
    renderModelList(design);
  }

  // ============================================
  // Design Tiles
  // ============================================

  // Glider pattern for Game of Life preview
  const GLIDER_CELLS = [2, 9, 16, 17, 18, 10, 3]; // indices for a glider in 8x6 grid

  function createDesignPreview(designId) {
    const preview = document.createElement('div');
    preview.className = 'design-tile-preview';
    preview.setAttribute('data-design', designId);

    const inner = document.createElement('div');
    inner.className = 'design-tile-preview-inner';

    // Special case for game-of-life: add grid cells
    if (designId === 'game-of-life') {
      for (let i = 0; i < 48; i++) {
        const cell = document.createElement('div');
        cell.className = 'cell' + (GLIDER_CELLS.includes(i) ? ' alive' : '');
        inner.appendChild(cell);
      }
    }

    preview.appendChild(inner);
    return preview;
  }

  function renderDesignChips() {
    clearElement(paletteDesigns);

    config.designs.forEach(function(design, index) {
      const tile = document.createElement('button');
      tile.className = 'design-tile';
      tile.dataset.designId = design.id;
      tile.setAttribute('role', 'tab');
      tile.setAttribute('aria-selected', design.id === currentDesignId);
      tile.style.animationDelay = (index * 40) + 'ms';

      // Create visual preview
      const preview = createDesignPreview(design.id);
      tile.appendChild(preview);

      // Label container
      const labelContainer = document.createElement('div');
      labelContainer.className = 'design-tile-label';

      const name = document.createElement('span');
      name.className = 'design-tile-name';
      name.textContent = design.label;
      labelContainer.appendChild(name);

      const count = document.createElement('span');
      count.className = 'design-tile-count';
      count.textContent = design.models.length + (design.models.length === 1 ? ' model' : ' models');
      labelContainer.appendChild(count);

      tile.appendChild(labelContainer);

      tile.addEventListener('click', function() {
        selectDesign(design.id);
      });

      paletteDesigns.appendChild(tile);
    });

    // Setup scroll indicators
    setupScrollIndicators();
  }

  function setupScrollIndicators() {
    const leftIndicator = document.getElementById('scroll-indicator-left');
    const rightIndicator = document.getElementById('scroll-indicator-right');

    if (!leftIndicator || !rightIndicator) return;

    function updateScrollIndicators() {
      const scrollLeft = paletteDesigns.scrollLeft;
      const scrollWidth = paletteDesigns.scrollWidth;
      const clientWidth = paletteDesigns.clientWidth;
      const maxScroll = scrollWidth - clientWidth;

      // Show left indicator if scrolled right
      leftIndicator.classList.toggle('visible', scrollLeft > 10);

      // Show right indicator if there's more to scroll
      rightIndicator.classList.toggle('visible', scrollLeft < maxScroll - 10);
    }

    // Initial check
    setTimeout(updateScrollIndicators, 100);

    // Update on scroll
    paletteDesigns.addEventListener('scroll', updateScrollIndicators, { passive: true });

    // Update on resize
    window.addEventListener('resize', updateScrollIndicators, { passive: true });
  }

  function updateDesignChips() {
    const tiles = paletteDesigns.querySelectorAll('.design-tile');
    tiles.forEach(function(tile) {
      const isActive = tile.dataset.designId === currentDesignId;
      tile.classList.toggle('active', isActive);
      tile.setAttribute('aria-selected', isActive);
    });
  }

  function selectDesign(designId) {
    const design = getDesignById(designId);
    if (!design) return;

    currentDesignId = designId;
    updateDesignChips();
    renderModelList(design);

    // If current page isn't in this design, load first model
    const currentInDesign = design.models.find(function(m) {
      return m.id === currentPageId;
    });
    if (!currentInDesign && design.models.length > 0) {
      loadPage(design.models[0].id);
    }
  }

  // ============================================
  // Model List
  // ============================================

  function renderModelList(design) {
    clearElement(paletteModels);

    if (design.models.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'models-empty';
      empty.textContent = 'No implementations yet';
      paletteModels.appendChild(empty);
      return;
    }

    design.models.forEach(function(model, index) {
      const card = document.createElement('div');
      card.className = 'model-card';
      card.dataset.pageId = model.id;
      card.setAttribute('role', 'option');
      card.setAttribute('tabindex', '0');
      card.style.animationDelay = (index * 30) + 'ms';

      const isActive = model.id === currentPageId;
      if (isActive) card.classList.add('active');
      card.setAttribute('aria-selected', isActive);

      // Model Icon
      const brand = detectBrand(model.model);
      const icon = document.createElement('div');
      icon.className = 'model-icon ' + brand.class;

      const iconImg = document.createElement('img');
      iconImg.src = brand.icon;
      iconImg.alt = model.model + ' icon';
      icon.appendChild(iconImg);

      card.appendChild(icon);

      // Model Info
      const info = document.createElement('div');
      info.className = 'model-info';

      const name = document.createElement('div');
      name.className = 'model-name';
      name.textContent = model.model;
      info.appendChild(name);

      const meta = document.createElement('div');
      meta.className = 'model-meta';

      if (model.date) {
        const date = document.createElement('span');
        date.className = 'model-date';
        date.appendChild(createCalendarIcon());
        const dateText = document.createTextNode(model.date);
        date.appendChild(dateText);
        meta.appendChild(date);
      }

      info.appendChild(meta);
      card.appendChild(info);

      // Checkmark
      const check = document.createElement('div');
      check.className = 'model-check';
      check.appendChild(createCheckIcon());
      card.appendChild(check);

      // Click handler
      card.addEventListener('click', function() {
        loadPage(model.id);

        // Auto-close on mobile only (desktop stays open)
        if (window.innerWidth < 768) {
          closePalette();
        }
      });

      // Keyboard support
      card.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          loadPage(model.id);

          // Auto-close on mobile only
          if (window.innerWidth < 768) {
            closePalette();
          }
        }
      });

      paletteModels.appendChild(card);
    });
  }

  // ============================================
  // Palette Open/Close
  // ============================================

  function openPalette() {
    isOpen = true;
    trigger.setAttribute('aria-expanded', 'true');
    trigger.classList.add('active');
    backdrop.classList.add('open');
    palette.classList.add('open');

    // Focus first model card
    setTimeout(function() {
      const firstCard = paletteModels.querySelector('.model-card');
      if (firstCard) firstCard.focus();
    }, 100);

    // Hide keyboard hint
    if (keyboardHint) {
      keyboardHint.classList.remove('visible');
      sessionStorage.setItem('gallery-hint-shown', 'true');
    }
  }

  function closePalette() {
    isOpen = false;
    trigger.setAttribute('aria-expanded', 'false');
    trigger.classList.remove('active');
    backdrop.classList.remove('open');
    palette.classList.remove('open');
    trigger.focus();
  }

  function togglePalette() {
    if (isOpen) closePalette();
    else openPalette();
  }

  // ============================================
  // Keyboard Hint
  // ============================================

  function showKeyboardHint() {
    if (sessionStorage.getItem('gallery-hint-shown')) return;
    if (window.innerWidth < 768) return; // Don't show on mobile

    setTimeout(function() {
      if (keyboardHint) {
        keyboardHint.classList.add('visible');
        setTimeout(function() {
          keyboardHint.classList.remove('visible');
          sessionStorage.setItem('gallery-hint-shown', 'true');
        }, 4000);
      }
    }, 2000);
  }

  // ============================================
  // Keyboard Navigation
  // ============================================

  function handleKeydown(e) {
    // G to toggle palette
    if (e.key === 'g' && !e.ctrlKey && !e.metaKey && !e.altKey) {
      if (document.activeElement === document.body ||
          document.activeElement === trigger ||
          palette.contains(document.activeElement)) {
        e.preventDefault();
        togglePalette();
        return;
      }
    }

    // Escape to close
    if (e.key === 'Escape') {
      if (promptModalOverlay.classList.contains('open')) {
        e.preventDefault();
        closePromptModal();
        return;
      }
      if (isOpen) {
        e.preventDefault();
        closePalette();
        return;
      }
    }

    // Arrow navigation when palette is open
    if (isOpen) {
      // Left/Right to switch designs
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        const designIds = config.designs.map(function(d) { return d.id; });
        const currentIdx = designIds.indexOf(currentDesignId);
        var newIdx;
        if (e.key === 'ArrowLeft') {
          newIdx = currentIdx > 0 ? currentIdx - 1 : designIds.length - 1;
        } else {
          newIdx = currentIdx < designIds.length - 1 ? currentIdx + 1 : 0;
        }
        selectDesign(designIds[newIdx]);
      }

      // Up/Down to switch models
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault();
        const design = getDesignById(currentDesignId);
        if (!design || design.models.length === 0) return;

        const modelIds = design.models.map(function(m) { return m.id; });
        const currentIdx = modelIds.indexOf(currentPageId);
        var newModelIdx;
        if (e.key === 'ArrowUp') {
          newModelIdx = currentIdx > 0 ? currentIdx - 1 : modelIds.length - 1;
        } else {
          newModelIdx = currentIdx < modelIds.length - 1 ? currentIdx + 1 : 0;
        }
        loadPage(modelIds[newModelIdx]);
      }

      // Enter to select focused model
      if (e.key === 'Enter') {
        const focused = document.activeElement;
        if (focused && focused.classList.contains('model-card')) {
          e.preventDefault();
          const pageId = focused.dataset.pageId;
          if (pageId) {
            loadPage(pageId);
            closePalette();
          }
        }
      }
    }
  }

  // ============================================
  // Touch/Swipe Support for Mobile Bottom Sheet
  // ============================================

  function handleTouchStart(e) {
    if (!isOpen) return;
    touchStartY = e.touches[0].clientY;
  }

  function handleTouchMove(e) {
    if (!isOpen) return;

    const touchY = e.touches[0].clientY;
    const diff = touchY - touchStartY;

    // Only allow downward swipe
    if (diff > 0) {
      const translateY = Math.min(diff, 200);
      palette.style.transform = 'translateY(' + translateY + 'px)';
    }
  }

  function handleTouchEnd(e) {
    if (!isOpen) return;

    const touchY = e.changedTouches[0].clientY;
    const diff = touchY - touchStartY;

    // Reset transform
    palette.style.transform = '';

    // If swiped down more than 100px, close
    if (diff > 100) {
      closePalette();
    }
  }

  // ============================================
  // Prompt Modal
  // ============================================

  async function openPromptModal() {
    const design = getDesignById(currentDesignId);
    if (!design || !design.prompt) {
      clearElement(promptModalContent);
      const noPrompt = document.createElement('div');
      noPrompt.className = 'prompt-loading';
      noPrompt.textContent = 'No prompt available for this design.';
      promptModalContent.appendChild(noPrompt);
      return;
    }

    promptModalTitle.textContent = design.label + ' Design Prompt';
    clearElement(promptModalContent);
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'prompt-loading';
    loadingDiv.textContent = 'Loading prompt...';
    promptModalContent.appendChild(loadingDiv);
    promptModalOverlay.classList.add('open');

    try {
      const response = await fetch(design.prompt);
      const text = await response.text();
      clearElement(promptModalContent);
      const pre = document.createElement('pre');
      pre.textContent = text;
      promptModalContent.appendChild(pre);
    } catch (error) {
      clearElement(promptModalContent);
      const errorDiv = document.createElement('div');
      errorDiv.className = 'prompt-loading';
      errorDiv.textContent = 'Failed to load prompt.';
      promptModalContent.appendChild(errorDiv);
    }
  }

  function closePromptModal() {
    promptModalOverlay.classList.remove('open');
  }

  // ============================================
  // Event Listeners
  // ============================================

  function setupEventListeners() {
    // Trigger button
    trigger.addEventListener('click', togglePalette);

    // Close button
    paletteClose.addEventListener('click', closePalette);

    // Theme toggle
    themeToggleBtn.addEventListener('click', toggleTheme);

    // Backdrop click
    backdrop.addEventListener('click', closePalette);

    // Prompt modal
    promptBtn.addEventListener('click', openPromptModal);
    promptModalClose.addEventListener('click', closePromptModal);
    promptModalOverlay.addEventListener('click', function(e) {
      if (e.target === promptModalOverlay) closePromptModal();
    });

    // Keyboard
    document.addEventListener('keydown', handleKeydown);

    // Touch events for mobile bottom sheet
    palette.addEventListener('touchstart', handleTouchStart, { passive: true });
    palette.addEventListener('touchmove', handleTouchMove, { passive: true });
    palette.addEventListener('touchend', handleTouchEnd, { passive: true });

    // Hash change
    window.addEventListener('hashchange', function() {
      const pageId = getPageIdFromHash() || config.default;
      if (pageId !== currentPageId) {
        loadPage(pageId);
      }
    });

    // Frame load complete
    frame.addEventListener('load', function() {
      loadingOverlay.classList.remove('visible');
      frame.classList.remove('loading');
      showKeyboardHint();
      // Apply theme to newly loaded frame
      applyThemeToFrame();
    });

    // Click outside palette to close
    document.addEventListener('click', function(e) {
      if (isOpen && !palette.contains(e.target) && !trigger.contains(e.target) && !backdrop.contains(e.target)) {
        closePalette();
      }
    });
  }

  // ============================================
  // Initialize
  // ============================================

  function getRandomFirstModel() {
    // Pick a random design and return its first model's ID
    const designs = config.designs;
    const randomDesign = designs[Math.floor(Math.random() * designs.length)];
    return randomDesign.models[0].id;
  }

  async function init() {
    // Initialize theme first to prevent flash
    initTheme();

    await loadConfig();
    if (!config) {
      console.error('Failed to initialize: no config');
      return;
    }

    // Render design chips
    renderDesignChips();

    // Setup events
    setupEventListeners();

    // Check if landing on root (no hash)
    const hashPageId = getPageIdFromHash();
    const isRootLanding = !hashPageId;

    // If root landing, pick random design's first model; otherwise use hash or default
    const initialPageId = isRootLanding ? getRandomFirstModel() : (hashPageId || config.default);
    loadPage(initialPageId);

    // Auto-open gallery on root landing
    if (isRootLanding) {
      // Small delay to let page render first
      setTimeout(function() {
        openPalette();
      }, 300);
    }
  }

  init();

})();
