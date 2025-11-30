/**
 * THE TERMINAL — fadi@bridge
 * Interactive terminal with AI chat
 * Uses safe DOM manipulation (no innerHTML with user input)
 */

(function() {
  'use strict';

  // ============================================
  // Configuration
  // ============================================

  const CONFIG = {
    useAI: false,
    aiEndpoint: '/api/chat',
    typingDelay: 30,
    responseDelay: 500,
  };

  // ============================================
  // Fadi's context
  // ============================================

  const FADI_CONTEXT = {
    name: 'Fadi Al Zuabi',
    role: 'Senior Firmware Engineer & AI Champion',
    location: 'Roseville, CA',
    company: 'Solidigm (SK Hynix)',
    links: {
      github: 'https://github.com/zzfadi',
      linkedin: 'https://linkedin.com/in/fadialzuabi',
      x: 'https://x.com/fadialzuabi',
      email: 'fadi@alzuabi.dev'
    }
  };

  // ============================================
  // DOM Elements
  // ============================================

  const output = document.getElementById('output');
  const input = document.getElementById('terminal-input');
  const terminalBody = document.getElementById('terminal-body');
  const timeEl = document.getElementById('time');

  let commandHistory = [];
  let historyIndex = -1;

  // ============================================
  // Safe DOM Helpers
  // ============================================

  function createLine(className) {
    const line = document.createElement('div');
    line.className = 'output-line ' + (className || '');
    return line;
  }

  function createSpan(text, className) {
    const span = document.createElement('span');
    span.className = className || '';
    span.textContent = text;
    return span;
  }

  function createLink(text, href) {
    const a = document.createElement('a');
    a.href = href;
    a.textContent = text;
    a.target = '_blank';
    a.rel = 'noopener';
    return a;
  }

  function appendToOutput(element) {
    output.appendChild(element);
    scrollToBottom();
  }

  function scrollToBottom() {
    terminalBody.scrollTop = terminalBody.scrollHeight;
  }

  // ============================================
  // Print Functions
  // ============================================

  function printText(text, className) {
    const line = createLine(className);
    line.textContent = text;
    appendToOutput(line);
  }

  function printCommand(cmd) {
    const line = createLine('command');
    const prompt = createSpan('fadi@bridge:~$ ', 'prompt');
    line.appendChild(prompt);
    line.appendChild(document.createTextNode(cmd));
    appendToOutput(line);
  }

  function printHelp() {
    const lines = [
      '',
      { text: 'Available commands:', highlight: true },
      '',
      '  projects    What I\'m building',
      '  now         What I\'m focused on right now',
      '  connect     Ways to reach me',
      '  skills      Technical expertise',
      '  clear       Clear terminal',
      '  help        Show this message',
      '',
      { text: 'Or just type naturally — I\'ll respond.', dim: true },
      ''
    ];

    lines.forEach(item => {
      const line = createLine('response');
      if (typeof item === 'string') {
        line.textContent = item;
      } else if (item.highlight) {
        line.appendChild(createSpan(item.text, 'highlight'));
      } else if (item.dim) {
        line.appendChild(createSpan(item.text, 'dim'));
      }
      appendToOutput(line);
    });
  }

  function printProjects() {
    const projects = [
      { name: 'Jenna Beauty', desc: 'Full-stack booking platform for permanent makeup business', tech: 'Next.js, TypeScript, Firebase', url: 'https://jennabeauty.com' },
      { name: 'co-flow', desc: 'Personal knowledge management system with AI', tech: 'GCP, Firestore, Vertex AI', url: 'https://github.com/zzfadi/co-flow' },
      { name: 'AI Debug Agent', desc: 'Intelligent firmware debugging system', tech: 'DataIku, Snowflake, Multi-LLM', url: null }
    ];

    printText('');
    const header = createLine('response');
    header.appendChild(createSpan('Current Projects:', 'highlight'));
    appendToOutput(header);
    printText('');

    projects.forEach(p => {
      const nameLine = createLine('response');
      nameLine.appendChild(createSpan('→ ' + p.name, 'highlight'));
      appendToOutput(nameLine);

      printText('  ' + p.desc, 'response');

      const techLine = createLine('response');
      techLine.appendChild(createSpan('  ' + p.tech, 'dim'));
      appendToOutput(techLine);

      if (p.url) {
        const urlLine = createLine('response');
        urlLine.appendChild(document.createTextNode('  '));
        urlLine.appendChild(createLink(p.url, p.url));
        appendToOutput(urlLine);
      }
      printText('', 'response');
    });
  }

  function printNow() {
    const lines = [
      '',
      { text: 'Right now:', highlight: true },
      '',
      '→ Building AI adoption programs at Solidigm',
      '→ Training engineers to ship faster with AI tools',
      '→ Experimenting with intelligent debugging systems',
      '→ Connecting firmware expertise with AI capabilities',
      '',
      { text: 'The goal: make AI useful for people who build real systems.', dim: true },
      ''
    ];

    lines.forEach(item => {
      const line = createLine('response');
      if (typeof item === 'string') {
        line.textContent = item;
      } else if (item.highlight) {
        line.appendChild(createSpan(item.text, 'highlight'));
      } else if (item.dim) {
        line.appendChild(createSpan(item.text, 'dim'));
      }
      appendToOutput(line);
    });
  }

  function printConnect() {
    printText('');
    const header = createLine('response');
    header.appendChild(createSpan('Let\'s connect:', 'highlight'));
    appendToOutput(header);
    printText('');

    const contacts = [
      { label: 'email', value: FADI_CONTEXT.links.email, href: 'mailto:' + FADI_CONTEXT.links.email },
      { label: 'github', value: '@zzfadi', href: FADI_CONTEXT.links.github },
      { label: 'linkedin', value: '/in/fadialzuabi', href: FADI_CONTEXT.links.linkedin },
      { label: 'x', value: '@fadialzuabi', href: FADI_CONTEXT.links.x }
    ];

    contacts.forEach(c => {
      const line = createLine('response');
      line.appendChild(document.createTextNode('  '));
      line.appendChild(createSpan(c.label.padEnd(10), 'highlight'));
      line.appendChild(createLink(c.value, c.href));
      appendToOutput(line);
    });

    printText('');
    const footer = createLine('response');
    footer.appendChild(createSpan('Prefer email for anything serious.', 'dim'));
    appendToOutput(footer);
    printText('');
  }

  function printSkills() {
    printText('');
    const header = createLine('response');
    header.appendChild(createSpan('Technical Expertise:', 'highlight'));
    appendToOutput(header);
    printText('');

    const skills = [
      { title: 'Firmware & Embedded', years: '5+ years', items: 'C/C++, NVMe, PCIe, Multi-core, RTOS, Linux kernel' },
      { title: 'AI & ML', years: '1.5+ years, accelerated', items: 'LLM integration, Prompt engineering, RAG systems, Enterprise AI adoption' },
      { title: 'Cloud & Full-Stack', years: '2+ years', items: 'GCP, Firebase, React, Next.js, TypeScript' }
    ];

    skills.forEach(s => {
      const titleLine = createLine('response');
      titleLine.appendChild(createSpan(s.title, 'highlight'));
      titleLine.appendChild(document.createTextNode(' '));
      titleLine.appendChild(createSpan('(' + s.years + ')', 'dim'));
      appendToOutput(titleLine);

      printText('  ' + s.items, 'response');
      printText('');
    });

    const footer = createLine('response');
    footer.appendChild(createSpan('I build things that connect hardware to intelligence.', 'dim'));
    appendToOutput(footer);
    printText('');
  }

  function showThinking() {
    const line = createLine('thinking-container');
    const thinking = document.createElement('div');
    thinking.className = 'thinking';
    for (let i = 0; i < 3; i++) {
      thinking.appendChild(document.createElement('span'));
    }
    line.appendChild(thinking);
    appendToOutput(line);
    return line;
  }

  // ============================================
  // AI Responses (fallback)
  // ============================================

  function getAIResponse(query) {
    const q = query.toLowerCase().trim();

    const responses = {
      'hello': "Hey! I'm Fadi. Type 'help' to see what you can explore, or just ask me anything.",
      'hi': "Hey! I'm Fadi. Type 'help' to see what you can explore, or just ask me anything.",
      'hey': "Hey! I'm Fadi. Type 'help' to see what you can explore, or just ask me anything.",
      'who are you': "I'm Fadi Al Zuabi — a firmware engineer who builds AI systems. I work at Solidigm where I train engineers on AI tools. Type 'skills' or 'projects' to learn more.",
      'what do you do': "I build bridges between hardware and AI. Day job: firmware engineering at Solidigm. Side quest: training 60+ engineers on AI tools and building systems that make firmware development smarter.",
      'where do you work': "Solidigm — it's SK Hynix's SSD division in Silicon Valley. I'm a Senior Firmware Engineer and AI Champion there.",
      'are you available': "Depends what for. I'm currently employed at Solidigm, but always interested in interesting conversations. Email me: fadi@alzuabi.dev",
      'can i hire you': "I'm currently at Solidigm, but open to conversations about interesting opportunities. Email me: fadi@alzuabi.dev",
      'why ai': "AI is the biggest leverage multiplier I've seen in 10 years of engineering. I watched junior engineers become 2-3x more productive with the right tools. That's why I do it."
    };

    // Check exact matches
    if (responses[q]) return responses[q];

    // Check partial matches
    for (const [key, response] of Object.entries(responses)) {
      if (q.includes(key)) return response;
    }

    // Keywords
    if (q.includes('project')) return 'COMMAND:projects';
    if (q.includes('skill') || q.includes('tech')) return 'COMMAND:skills';
    if (q.includes('contact') || q.includes('email') || q.includes('reach')) return 'COMMAND:connect';
    if (q.includes('focus') || q.includes('now') || q.includes('current')) return 'COMMAND:now';

    return "Interesting question. I'm a firmware engineer who builds AI systems. Type 'help' to see commands, or ask about my projects, skills, or what I'm working on.";
  }

  // ============================================
  // Command Processing
  // ============================================

  async function processCommand(cmd) {
    const trimmed = cmd.trim();
    if (!trimmed) return;

    commandHistory.push(trimmed);
    historyIndex = commandHistory.length;

    printCommand(trimmed);

    const command = trimmed.split(' ')[0].toLowerCase();

    await delay(CONFIG.responseDelay);

    switch (command) {
      case 'help':
        printHelp();
        break;
      case 'projects':
        printProjects();
        break;
      case 'now':
        printNow();
        break;
      case 'connect':
        printConnect();
        break;
      case 'skills':
        printSkills();
        break;
      case 'clear':
        output.textContent = '';
        break;
      case 'whoami':
        printText(FADI_CONTEXT.name + ' — ' + FADI_CONTEXT.role, 'response');
        break;
      case 'pwd':
        printText('/home/fadi/bridge', 'response');
        break;
      case 'ls':
        printText('projects/  skills/  connect/', 'response');
        break;
      case 'sudo':
        printText('Nice try.', 'error');
        break;
      case 'exit':
        printText('Goodbye.', 'response');
        setTimeout(() => {
          document.body.style.opacity = '0';
          document.body.style.transition = 'opacity 1s';
        }, 500);
        break;
      default:
        // Natural language - AI chat
        const thinking = showThinking();
        await delay(800 + Math.random() * 400);
        thinking.remove();

        const response = getAIResponse(trimmed);
        if (response.startsWith('COMMAND:')) {
          const subCmd = response.replace('COMMAND:', '');
          await processCommand(subCmd);
        } else {
          printText(response, 'response');
        }
        break;
    }
  }

  function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ============================================
  // Boot Sequence
  // ============================================

  async function boot() {
    await delay(300);
    printText('Initializing...', 'dim');
    await delay(200);
    printText('Loading context...', 'dim');
    await delay(200);
    printText('Ready.', 'success');
    printText('');

    const welcomeLine = createLine('response');
    welcomeLine.appendChild(document.createTextNode('Welcome to '));
    welcomeLine.appendChild(createSpan('fadi@bridge', 'highlight'));
    appendToOutput(welcomeLine);

    const helpLine = createLine('response');
    helpLine.appendChild(document.createTextNode('Type '));
    helpLine.appendChild(createSpan('help', 'highlight'));
    helpLine.appendChild(document.createTextNode(' for commands, or just ask me anything.'));
    appendToOutput(helpLine);

    printText('');
    input.focus();
  }

  // ============================================
  // Event Listeners
  // ============================================

  input.addEventListener('keydown', async (e) => {
    if (e.key === 'Enter') {
      const cmd = input.value;
      input.value = '';
      await processCommand(cmd);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (historyIndex > 0) {
        historyIndex--;
        input.value = commandHistory[historyIndex];
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex < commandHistory.length - 1) {
        historyIndex++;
        input.value = commandHistory[historyIndex];
      } else {
        historyIndex = commandHistory.length;
        input.value = '';
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      const partial = input.value.toLowerCase();
      const cmds = ['help', 'projects', 'now', 'connect', 'skills', 'clear'];
      const matches = cmds.filter(c => c.startsWith(partial));
      if (matches.length === 1) {
        input.value = matches[0];
      }
    } else if (e.key === 'l' && e.ctrlKey) {
      e.preventDefault();
      output.textContent = '';
    }
  });

  document.addEventListener('click', () => input.focus());

  // Update time
  function updateTime() {
    const now = new Date();
    timeEl.textContent = now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  }
  updateTime();
  setInterval(updateTime, 1000);

  // ============================================
  // Initialize
  // ============================================

  boot();

})();
