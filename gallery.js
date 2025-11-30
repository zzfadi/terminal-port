/**
 * Gallery Navigation System
 * Two-level navigation: Design Tabs + Model Radio buttons
 */

(function() {
  'use strict';

  // ============================================
  // State
  // ============================================

  let config = null;
  let currentPageId = null;
  let currentDesignId = null;
  let isExpanded = false;

  // ============================================
  // DOM Elements
  // ============================================

  const frame = document.getElementById('page-frame');
  const selector = document.getElementById('gallery-selector');
  const toggle = document.getElementById('selector-toggle');
  const panel = document.getElementById('selector-panel');
  const currentDesignEl = document.getElementById('current-design');
  const currentModelEl = document.getElementById('current-model');
  const designTabs = document.getElementById('design-tabs');
  const modelList = document.getElementById('model-list');
  const loadingOverlay = document.getElementById('loading-overlay');
  const keyboardHint = document.getElementById('keyboard-hint');
  const viewPromptBtn = document.getElementById('view-prompt-btn');
  const promptModalOverlay = document.getElementById('prompt-modal-overlay');
  const promptModalTitle = document.getElementById('prompt-modal-title');
  const promptModalContent = document.getElementById('prompt-modal-content');
  const promptModalClose = document.getElementById('prompt-modal-close');

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
    let short = modelName.toLowerCase();
    short = short.replace('claude ', '');
    short = short.replace('openai ', '');
    short = short.replace('google ', '');
    short = short.replace('gemini ', '');
    return short;
  }

  // ============================================
  // URL Routing
  // ============================================

  function getPageIdFromHash() {
    const hash = window.location.hash.slice(1);
    return hash || null;
  }

  function setHashForPage(pageId) {
    history.pushState(null, '', `#${pageId}`);
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

    // Update toggle display
    currentDesignEl.textContent = design.label;
    currentModelEl.textContent = getShortModelName(model.model);

    // Load page in iframe
    frame.src = model.path;

    // Update UI states
    updateDesignTabs();
    renderModelList(design);
  }

  // ============================================
  // Design Tabs
  // ============================================

  function renderDesignTabs() {
    designTabs.innerHTML = '';

    config.designs.forEach(design => {
      const tab = document.createElement('button');
      tab.className = 'design-tab';
      tab.textContent = design.label;
      tab.dataset.designId = design.id;
      tab.setAttribute('role', 'tab');
      tab.setAttribute('aria-selected', design.id === currentDesignId);

      tab.addEventListener('click', () => selectDesign(design.id));

      designTabs.appendChild(tab);
    });
  }

  function updateDesignTabs() {
    const tabs = designTabs.querySelectorAll('.design-tab');
    tabs.forEach(tab => {
      const isActive = tab.dataset.designId === currentDesignId;
      tab.classList.toggle('active', isActive);
      tab.setAttribute('aria-selected', isActive);
    });
  }

  function selectDesign(designId) {
    const design = getDesignById(designId);
    if (!design) return;

    currentDesignId = designId;
    updateDesignTabs();
    renderModelList(design);

    // If current page isn't in this design, load first model
    const currentInDesign = design.models.find(m => m.id === currentPageId);
    if (!currentInDesign && design.models.length > 0) {
      loadPage(design.models[0].id);
    }
  }

  // ============================================
  // Model List
  // ============================================

  function renderModelList(design) {
    modelList.innerHTML = '';

    if (design.models.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'model-empty';
      empty.textContent = 'No implementations yet';
      modelList.appendChild(empty);
      return;
    }

    design.models.forEach(model => {
      const item = document.createElement('div');
      item.className = 'model-item';
      item.dataset.pageId = model.id;
      item.setAttribute('role', 'radio');
      item.setAttribute('tabindex', '0');

      const isActive = model.id === currentPageId;
      if (isActive) item.classList.add('active');
      item.setAttribute('aria-checked', isActive);

      // Radio circle
      const radio = document.createElement('div');
      radio.className = 'model-item-radio';
      item.appendChild(radio);

      // Info
      const info = document.createElement('div');
      info.className = 'model-item-info';

      const name = document.createElement('div');
      name.className = 'model-item-name';
      name.textContent = model.model;
      info.appendChild(name);

      if (model.date) {
        const date = document.createElement('div');
        date.className = 'model-item-date';
        date.textContent = model.date;
        info.appendChild(date);
      }

      item.appendChild(info);

      // Arrow
      const arrow = document.createElement('span');
      arrow.className = 'model-item-arrow';
      arrow.textContent = '←';
      item.appendChild(arrow);

      // Click handler
      item.addEventListener('click', () => {
        loadPage(model.id);
        closePanel();
      });

      modelList.appendChild(item);
    });
  }

  function updateModelList() {
    const items = modelList.querySelectorAll('.model-item');
    items.forEach(item => {
      const isActive = item.dataset.pageId === currentPageId;
      item.classList.toggle('active', isActive);
      item.setAttribute('aria-checked', isActive);
    });
  }

  // ============================================
  // Panel Toggle
  // ============================================

  function openPanel() {
    isExpanded = true;
    toggle.setAttribute('aria-expanded', 'true');
    panel.classList.add('open');

    if (keyboardHint) {
      keyboardHint.classList.remove('visible');
      sessionStorage.setItem('gallery-hint-shown', 'true');
    }
  }

  function closePanel() {
    isExpanded = false;
    toggle.setAttribute('aria-expanded', 'false');
    panel.classList.remove('open');
  }

  function togglePanel() {
    if (isExpanded) closePanel();
    else openPanel();
  }

  // ============================================
  // Keyboard Hint
  // ============================================

  function showKeyboardHint() {
    if (sessionStorage.getItem('gallery-hint-shown')) return;

    setTimeout(() => {
      if (keyboardHint) {
        keyboardHint.classList.add('visible');
        setTimeout(() => {
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
      if (document.activeElement === document.body || document.activeElement === toggle) {
        e.preventDefault();
        togglePanel();
        return;
      }
    }

    if (e.key === 'Escape') {
      if (promptModalOverlay.classList.contains('open')) {
        e.preventDefault();
        closePromptModal();
        return;
      }
      if (isExpanded) {
        e.preventDefault();
        closePanel();
        return;
      }
    }

    // Left/Right to switch designs when panel is open
    if (isExpanded && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
      e.preventDefault();
      const designIds = config.designs.map(d => d.id);
      const currentIdx = designIds.indexOf(currentDesignId);
      let newIdx;
      if (e.key === 'ArrowLeft') {
        newIdx = currentIdx > 0 ? currentIdx - 1 : designIds.length - 1;
      } else {
        newIdx = currentIdx < designIds.length - 1 ? currentIdx + 1 : 0;
      }
      selectDesign(designIds[newIdx]);
    }

    // Up/Down to switch models when panel is open
    if (isExpanded && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
      e.preventDefault();
      const design = getDesignById(currentDesignId);
      if (!design || design.models.length === 0) return;

      const modelIds = design.models.map(m => m.id);
      const currentIdx = modelIds.indexOf(currentPageId);
      let newIdx;
      if (e.key === 'ArrowUp') {
        newIdx = currentIdx > 0 ? currentIdx - 1 : modelIds.length - 1;
      } else {
        newIdx = currentIdx < modelIds.length - 1 ? currentIdx + 1 : 0;
      }
      loadPage(modelIds[newIdx]);
    }
  }

  // ============================================
  // Prompt Modal
  // ============================================

  async function openPromptModal() {
    const design = getDesignById(currentDesignId);
    if (!design || !design.prompt) {
      promptModalContent.innerHTML = '<div class="prompt-loading">No prompt available for this design.</div>';
      return;
    }

    promptModalTitle.textContent = `${design.label} Design Prompt`;
    promptModalContent.innerHTML = '<div class="prompt-loading">Loading prompt...</div>';
    promptModalOverlay.classList.add('open');

    try {
      const response = await fetch(design.prompt);
      const text = await response.text();
      promptModalContent.innerHTML = `<pre>${escapeHtml(text)}</pre>`;
    } catch (error) {
      promptModalContent.innerHTML = '<div class="prompt-loading">Failed to load prompt.</div>';
    }
  }

  function closePromptModal() {
    promptModalOverlay.classList.remove('open');
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // ============================================
  // Event Listeners
  // ============================================

  function setupEventListeners() {
    toggle.addEventListener('click', togglePanel);

    viewPromptBtn.addEventListener('click', openPromptModal);
    promptModalClose.addEventListener('click', closePromptModal);
    promptModalOverlay.addEventListener('click', (e) => {
      if (e.target === promptModalOverlay) closePromptModal();
    });

    document.addEventListener('click', (e) => {
      if (isExpanded && !selector.contains(e.target)) {
        closePanel();
      }
    });

    document.addEventListener('keydown', handleKeydown);

    window.addEventListener('hashchange', () => {
      const pageId = getPageIdFromHash() || config.default;
      if (pageId !== currentPageId) {
        loadPage(pageId);
      }
    });

    frame.addEventListener('load', () => {
      loadingOverlay.classList.remove('visible');
      frame.classList.remove('loading');
      showKeyboardHint();
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

    // Render design tabs
    renderDesignTabs();

    // Setup events
    setupEventListeners();

    // Load initial page
    const initialPageId = getPageIdFromHash() || config.default;
    loadPage(initialPageId);
  }

  init();

})();
