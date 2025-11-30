/**
 * Gallery Navigation System v2
 * Adaptive Command Palette with Model Brand Icons
 * Desktop: Center modal | Mobile: Bottom sheet with swipe
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

  // ============================================
  // Config Loading
  // ============================================

  async function loadConfig() {
    try {
      const response = await fetch('config.json');
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
  // Design Chips
  // ============================================

  function renderDesignChips() {
    clearElement(paletteDesigns);

    config.designs.forEach(function(design, index) {
      const chip = document.createElement('button');
      chip.className = 'design-chip';
      chip.dataset.designId = design.id;
      chip.setAttribute('role', 'tab');
      chip.setAttribute('aria-selected', design.id === currentDesignId);
      chip.style.animationDelay = (50 + index * 50) + 'ms';

      const icon = document.createElement('span');
      icon.className = 'design-chip-icon';
      icon.textContent = getDesignIcon(design.id);
      chip.appendChild(icon);

      const label = document.createElement('span');
      label.textContent = design.label;
      chip.appendChild(label);

      const count = document.createElement('span');
      count.className = 'design-chip-count';
      count.textContent = design.models.length;
      chip.appendChild(count);

      chip.addEventListener('click', function() {
        selectDesign(design.id);
      });

      paletteDesigns.appendChild(chip);
    });
  }

  function updateDesignChips() {
    const chips = paletteDesigns.querySelectorAll('.design-chip');
    chips.forEach(function(chip) {
      const isActive = chip.dataset.designId === currentDesignId;
      chip.classList.toggle('active', isActive);
      chip.setAttribute('aria-selected', isActive);
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
        closePalette();
      });

      // Keyboard support
      card.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          loadPage(model.id);
          closePalette();
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

  async function init() {
    await loadConfig();
    if (!config) {
      console.error('Failed to initialize: no config');
      return;
    }

    // Render design chips
    renderDesignChips();

    // Setup events
    setupEventListeners();

    // Load initial page
    const initialPageId = getPageIdFromHash() || config.default;
    loadPage(initialPageId);
  }

  init();

})();
