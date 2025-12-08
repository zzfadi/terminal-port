/**
 * Gallery Navigation System v5
 * Two-level hierarchy: Categories → Designs → Models
 * Features: Compact design, stays open on desktop, professional-first start
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

  // ============================================
  // State
  // ============================================

  let config = null;
  let currentPageId = null;
  let currentDesignId = null;
  let currentCategoryId = null;
  let isOpen = false;
  let touchStartY = 0;
  let currentTheme = null;

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
  const paletteCategories = document.getElementById('palette-categories');
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
  // Utility: Check if mobile
  // ============================================

  function isMobile() {
    return window.innerWidth < 600;
  }

  // ============================================
  // Theme Management
  // ============================================

  function initTheme() {
    const savedTheme = localStorage.getItem('gallery-theme');
    if (savedTheme) {
      currentTheme = savedTheme;
    } else {
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
    frame.style.colorScheme = currentTheme;
    
    try {
      if (frame.contentDocument && frame.contentDocument.documentElement) {
        const doc = frame.contentDocument;
        const html = doc.documentElement;
        
        html.style.colorScheme = currentTheme;
        
        let themeStyle = doc.getElementById('gallery-theme-override');
        if (!themeStyle) {
          themeStyle = doc.createElement('style');
          themeStyle.id = 'gallery-theme-override';
          doc.head.appendChild(themeStyle);
        }
        
        if (currentTheme === 'dark') {
          themeStyle.textContent = `
            :root {
              color-scheme: dark !important;
              --bg: #0a0a0a !important;
              --bg-alt: #141414 !important;
              --text-primary: #f5f5f5 !important;
              --text-secondary: #a0a0a0 !important;
              --text-muted: #666666 !important;
              --accent-light: #1a2a3d !important;
              --border: #2a2a2a !important;
              --shadow: rgba(0, 0, 0, 0.3) !important;
            }
            html, body { color-scheme: dark !important; }
          `;
        } else {
          themeStyle.textContent = `
            :root {
              color-scheme: light !important;
              --bg: #fafafa !important;
              --bg-alt: #ffffff !important;
              --text-primary: #111111 !important;
              --text-secondary: #555555 !important;
              --text-muted: #888888 !important;
              --accent-light: #e6f0ff !important;
              --border: #e5e5e5 !important;
              --shadow: rgba(0, 0, 0, 0.06) !important;
            }
            html, body { color-scheme: light !important; }
          `;
        }
        
        html.setAttribute('data-theme', currentTheme);
      }
    } catch (e) {
      console.log('Could not inject theme into iframe (cross-origin)');
    }
  }

  // ============================================
  // Config Loading
  // ============================================

  async function loadConfig() {
    try {
      const response = await fetch('config.json?v=5');
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

    if (lower.includes('sonnet')) {
      return MODEL_BRANDS.sonnet;
    }

    if (lower.includes('opus') || lower.includes('claude')) {
      return MODEL_BRANDS.claude;
    }

    for (const [key, brand] of Object.entries(MODEL_BRANDS)) {
      if (brand.keywords.some(kw => lower.includes(kw))) {
        return brand;
      }
    }

    return { class: 'claude', icon: 'assets/icons/claude.svg' };
  }

  // ============================================
  // SVG Icon Creators
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
    for (const category of config.categories) {
      for (const design of category.designs) {
        const model = design.models.find(m => m.id === pageId);
        if (model) return { category, design, model };
      }
    }
    return null;
  }

  function getDesignById(designId) {
    for (const category of config.categories) {
      const design = category.designs.find(d => d.id === designId);
      if (design) return { design, category };
    }
    return null;
  }

  function getCategoryById(categoryId) {
    return config.categories.find(c => c.id === categoryId);
  }

  function getShortModelName(modelName) {
    let short = modelName;
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

    const { category, design, model } = result;

    loadingOverlay.classList.add('visible');
    frame.classList.add('loading');

    setHashForPage(pageId);

    currentPageId = pageId;
    currentDesignId = design.id;
    currentCategoryId = category.id;

    updateTrigger(design, model);

    frame.src = model.path;

    updateCategoryTabs();
    renderDesignTiles();
    renderModelList(design);
  }

  // ============================================
  // Category Tabs
  // ============================================

  function renderCategoryTabs() {
    if (!paletteCategories) return;
    
    clearElement(paletteCategories);

    config.categories.forEach(function(category) {
      const tab = document.createElement('button');
      tab.className = 'category-tab';
      tab.dataset.categoryId = category.id;
      tab.setAttribute('role', 'tab');
      tab.setAttribute('aria-selected', category.id === currentCategoryId);
      tab.textContent = category.label;

      tab.addEventListener('click', function() {
        selectCategory(category.id);
      });

      paletteCategories.appendChild(tab);
    });
  }

  function updateCategoryTabs() {
    const tabs = document.querySelectorAll('.category-tab');
    tabs.forEach(function(tab) {
      const isActive = tab.dataset.categoryId === currentCategoryId;
      tab.classList.toggle('active', isActive);
      tab.setAttribute('aria-selected', isActive);
    });
  }

  function selectCategory(categoryId) {
    currentCategoryId = categoryId;
    updateCategoryTabs();
    renderDesignTiles();
    
    const category = getCategoryById(categoryId);
    if (category && category.designs.length > 0) {
      const currentDesignInCategory = category.designs.find(d => d.id === currentDesignId);
      if (!currentDesignInCategory) {
        const firstDesign = category.designs[0];
        if (firstDesign.models.length > 0) {
          loadPage(firstDesign.models[0].id);
        }
      }
    }
  }

  // ============================================
  // Design Tiles
  // ============================================

  const GLIDER_CELLS = [2, 9, 16, 17, 18, 10, 3];

  function createDesignPreview(designId) {
    const preview = document.createElement('div');
    preview.className = 'design-tile-preview';
    preview.setAttribute('data-design', designId);

    const inner = document.createElement('div');
    inner.className = 'design-tile-preview-inner';

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

  function renderDesignTiles() {
    clearElement(paletteDesigns);

    const category = getCategoryById(currentCategoryId);
    if (!category) return;

    category.designs.forEach(function(design, index) {
      const tile = document.createElement('button');
      tile.className = 'design-tile';
      tile.dataset.designId = design.id;
      tile.setAttribute('role', 'tab');
      tile.setAttribute('aria-selected', design.id === currentDesignId);
      if (design.id === currentDesignId) {
        tile.classList.add('active');
      }
      tile.style.animationDelay = (index * 30) + 'ms';

      const preview = createDesignPreview(design.id);
      tile.appendChild(preview);

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
  }

  function updateDesignTiles() {
    const tiles = paletteDesigns.querySelectorAll('.design-tile');
    tiles.forEach(function(tile) {
      const isActive = tile.dataset.designId === currentDesignId;
      tile.classList.toggle('active', isActive);
      tile.setAttribute('aria-selected', isActive);
    });
  }

  function selectDesign(designId) {
    const result = getDesignById(designId);
    if (!result) return;

    const { design, category } = result;
    currentDesignId = designId;
    currentCategoryId = category.id;
    
    updateCategoryTabs();
    updateDesignTiles();
    renderModelList(design);

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
      card.style.animationDelay = (index * 20) + 'ms';

      const isActive = model.id === currentPageId;
      if (isActive) card.classList.add('active');
      card.setAttribute('aria-selected', isActive);

      const brand = detectBrand(model.model);
      const icon = document.createElement('div');
      icon.className = 'model-icon ' + brand.class;

      const iconImg = document.createElement('img');
      iconImg.src = brand.icon;
      iconImg.alt = model.model + ' icon';
      icon.appendChild(iconImg);

      card.appendChild(icon);

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

      const check = document.createElement('div');
      check.className = 'model-check';
      check.appendChild(createCheckIcon());
      card.appendChild(check);

      card.addEventListener('click', function() {
        loadPage(model.id);
        // Menu stays open - only closes on trigger click or click away
      });

      card.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          loadPage(model.id);
          // Menu stays open - only closes on trigger click or click away
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

    setTimeout(function() {
      const firstCard = paletteModels.querySelector('.model-card');
      if (firstCard) firstCard.focus();
    }, 100);

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
    
    // Dismiss welcome banner when closing palette
    dismissWelcome();
  }

  function togglePalette() {
    if (isOpen) closePalette();
    else openPalette();
  }

  // ============================================
  // First-time Welcome Banner
  // ============================================

  function showWelcomeBanner() {
    if (localStorage.getItem('gallery-welcomed')) return;
    
    const banner = document.createElement('div');
    banner.className = 'welcome-banner';
    banner.id = 'welcome-banner';
    banner.innerHTML = '<p>Hi, I\'m <strong>Fadi Al Zuabi</strong> and welcome to my site! Explore different designs made by different AI models and compare yourself!</p>';
    
    // Insert after header
    const header = palette.querySelector('.palette-header');
    if (header && header.nextSibling) {
      header.parentNode.insertBefore(banner, header.nextSibling);
    }
  }

  function dismissWelcome() {
    const banner = document.getElementById('welcome-banner');
    if (banner) {
      banner.remove();
      localStorage.setItem('gallery-welcomed', 'true');
    }
  }

  // ============================================
  // Keyboard Hint
  // ============================================

  function showKeyboardHint() {
    if (sessionStorage.getItem('gallery-hint-shown')) return;
    if (isMobile()) return;

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
    if (e.key === 'g' && !e.ctrlKey && !e.metaKey && !e.altKey) {
      if (document.activeElement === document.body ||
          document.activeElement === trigger ||
          palette.contains(document.activeElement)) {
        e.preventDefault();
        togglePalette();
        return;
      }
    }

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

    if (isOpen) {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        const category = getCategoryById(currentCategoryId);
        if (!category) return;
        
        const designIds = category.designs.map(function(d) { return d.id; });
        const currentIdx = designIds.indexOf(currentDesignId);
        var newIdx;
        if (e.key === 'ArrowLeft') {
          newIdx = currentIdx > 0 ? currentIdx - 1 : designIds.length - 1;
        } else {
          newIdx = currentIdx < designIds.length - 1 ? currentIdx + 1 : 0;
        }
        selectDesign(designIds[newIdx]);
      }

      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault();
        const result = getDesignById(currentDesignId);
        if (!result || result.design.models.length === 0) return;

        const modelIds = result.design.models.map(function(m) { return m.id; });
        const currentIdx = modelIds.indexOf(currentPageId);
        var newModelIdx;
        if (e.key === 'ArrowUp') {
          newModelIdx = currentIdx > 0 ? currentIdx - 1 : modelIds.length - 1;
        } else {
          newModelIdx = currentIdx < modelIds.length - 1 ? currentIdx + 1 : 0;
        }
        loadPage(modelIds[newModelIdx]);
      }

      if (e.key === 'Tab' && !e.shiftKey && e.ctrlKey) {
        e.preventDefault();
        const categoryIds = config.categories.map(function(c) { return c.id; });
        const currentIdx = categoryIds.indexOf(currentCategoryId);
        const newIdx = currentIdx < categoryIds.length - 1 ? currentIdx + 1 : 0;
        selectCategory(categoryIds[newIdx]);
      }

      if (e.key === 'Enter') {
        const focused = document.activeElement;
        if (focused && focused.classList.contains('model-card')) {
          e.preventDefault();
          const pageId = focused.dataset.pageId;
          if (pageId) {
            loadPage(pageId);
            // Menu stays open - only closes on trigger click or click away
          }
        }
      }
    }
  }

  // ============================================
  // Touch/Swipe Support for Mobile
  // ============================================

  function handleTouchStart(e) {
    if (!isOpen) return;
    touchStartY = e.touches[0].clientY;
  }

  function handleTouchMove(e) {
    if (!isOpen) return;

    const touchY = e.touches[0].clientY;
    const diff = touchY - touchStartY;

    if (diff > 0) {
      const translateY = Math.min(diff, 200);
      palette.style.transform = 'translateY(' + translateY + 'px)';
    }
  }

  function handleTouchEnd(e) {
    if (!isOpen) return;

    const touchY = e.changedTouches[0].clientY;
    const diff = touchY - touchStartY;

    palette.style.transform = '';

    if (diff > 100) {
      closePalette();
    }
  }

  // ============================================
  // Prompt Modal
  // ============================================

  async function openPromptModal() {
    const result = getDesignById(currentDesignId);
    if (!result || !result.design.prompt) {
      clearElement(promptModalContent);
      const noPrompt = document.createElement('div');
      noPrompt.className = 'prompt-loading';
      noPrompt.textContent = 'No prompt available for this design.';
      promptModalContent.appendChild(noPrompt);
      return;
    }

    promptModalTitle.textContent = result.design.label + ' Design Prompt';
    clearElement(promptModalContent);
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'prompt-loading';
    loadingDiv.textContent = 'Loading prompt...';
    promptModalContent.appendChild(loadingDiv);
    promptModalOverlay.classList.add('open');

    try {
      const response = await fetch(result.design.prompt);
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
    trigger.addEventListener('click', togglePalette);
    paletteClose.addEventListener('click', closePalette);
    themeToggleBtn.addEventListener('click', toggleTheme);
    
    // Backdrop click closes on both mobile and desktop
    backdrop.addEventListener('click', closePalette);

    promptBtn.addEventListener('click', openPromptModal);
    promptModalClose.addEventListener('click', closePromptModal);
    promptModalOverlay.addEventListener('click', function(e) {
      if (e.target === promptModalOverlay) closePromptModal();
    });

    document.addEventListener('keydown', handleKeydown);

    palette.addEventListener('touchstart', handleTouchStart, { passive: true });
    palette.addEventListener('touchmove', handleTouchMove, { passive: true });
    palette.addEventListener('touchend', handleTouchEnd, { passive: true });

    window.addEventListener('hashchange', function() {
      const pageId = getPageIdFromHash() || config.default;
      if (pageId !== currentPageId) {
        loadPage(pageId);
      }
    });

    frame.addEventListener('load', function() {
      loadingOverlay.classList.remove('visible');
      frame.classList.remove('loading');
      showKeyboardHint();
      applyThemeToFrame();
    });

    // Click outside palette to close (on iframe/page area)
    // This handles clicking on the site (iframe) to close the palette
    // Use mousedown instead of click to capture before DOM changes
    document.addEventListener('mousedown', function(e) {
      if (!isOpen) return;
      
      // Check if click is within palette bounds (in case DOM changed)
      const paletteRect = palette.getBoundingClientRect();
      const triggerRect = trigger.getBoundingClientRect();
      const x = e.clientX;
      const y = e.clientY;
      
      const inPalette = x >= paletteRect.left && x <= paletteRect.right &&
                        y >= paletteRect.top && y <= paletteRect.bottom;
      const inTrigger = x >= triggerRect.left && x <= triggerRect.right &&
                        y >= triggerRect.top && y <= triggerRect.bottom;
      
      if (!inPalette && !inTrigger) {
        closePalette();
      }
    });
  }

  // ============================================
  // Initialize
  // ============================================

  function getRandomProfessionalModel() {
    const professionalCategory = config.categories.find(c => c.id === 'professional');
    if (professionalCategory && professionalCategory.designs.length > 0) {
      const randomDesign = professionalCategory.designs[Math.floor(Math.random() * professionalCategory.designs.length)];
      if (randomDesign.models.length > 0) {
        return randomDesign.models[0].id;
      }
    }
    return config.default;
  }

  async function init() {
    initTheme();

    await loadConfig();
    if (!config) {
      console.error('Failed to initialize: no config');
      return;
    }

    renderCategoryTabs();
    setupEventListeners();

    const hashPageId = getPageIdFromHash();
    const isRootLanding = !hashPageId;

    const initialPageId = isRootLanding ? getRandomProfessionalModel() : (hashPageId || config.default);
    loadPage(initialPageId);

    // Show welcome banner and open palette for first-time or root landing
    if (isRootLanding) {
      setTimeout(function() {
        showWelcomeBanner();
        openPalette();
      }, 300);
    }
  }

  init();

})();
