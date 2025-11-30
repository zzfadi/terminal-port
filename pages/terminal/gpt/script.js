const outputEl = document.getElementById("terminal-output");
const formEl = document.getElementById("terminal-form");
const inputEl = document.getElementById("terminal-input");
const shortcutButtons = document.querySelectorAll("[data-command]");

const profile = {
  name: "Fadi Al Zuabi",
  role: "Senior Firmware Engineer & AI Champion",
  location: "Roseville, CA",
  company: "Solidigm (SK Hynix)",
  mission:
    "Building bridges between hardware and AI. Helping engineers ship faster with intelligent tools.",
  focus: [
    "Leading AI adoption programs with a 70% Copilot usage increase",
    "Training engineers to ship faster with intelligent tools (60+ trained)",
    "Building intelligent firmware debugging systems using DataIku, Snowflake, and Graph Neural Networks",
    "Technical Product Lead for GEN5 PCIe SSD delivery"
  ],
  projects: [
    {
      name: "Intelligent Firmware Debug Agent",
      org: "Solidigm",
      details:
        "Multi-LLM orchestration with predictive analytics accelerates root-cause analysis. Tech: DataIku, Snowflake, Graph Neural Networks."
    },
    {
      name: "GitHub Copilot Enterprise Deployment",
      org: "Solidigm",
      details:
        "Customized AI workflows that increased adoption to 70% and trained 60+ senior engineers."
    },
    {
      name: "GEN5 PCIe SSD Delivery",
      org: "Solidigm",
      details:
        "Technical Product Lead synchronizing firmware, validation, and partner teams for PCIe Gen5 launches."
    },
    {
      name: "CI/CD Optimization",
      org: "GE Aerospace",
      details:
        "Cloud-based static analysis automation achieved 80-90% runtime reduction and $30k+ annual savings."
    },
    {
      name: "First 4G-LTE Module in Aviation",
      org: "GE Aerospace",
      details:
        "Brought cellular connectivity to aviation health monitoring, unlocking live diagnostics."
    }
  ],
  skills: {
    firmware:
      "C/C++, NVMe, PCIe Gen4/Gen5, ARM & Xtensa multicore, RTOS, Linux kernel, DO-178C, MISRA C/C++",
    ai: "LLM integration (GPT-4, Claude, Gemini), prompt engineering, RAG, DataIku, Snowflake, Vertex AI",
    cloud: "GCP, Firebase, Python, TypeScript, React, Next.js",
    leadership: "Scaled AI enablement to 60+ engineers, cross-functional ownership, product leadership"
  },
  stats: [
    "5+ years in firmware engineering",
    "60+ engineers trained on AI tools",
    "70% AI adoption increase achieved",
    "80-90% CI/CD runtime reduction"
  ],
  links: {
    email: "fadi.b.zuabi@gmail.com",
    github: "https://github.com/zzfadi",
    linkedin: "https://linkedin.com/in/fadi-zuabi",
    twitter: "https://x.com/fadi_zuabi",
    site: "https://www.zuabi.dev"
  }
};

const history = [];
let historyIndex = -1;

const commands = {
  help() {
    return [
      linePair("about", "Profile overview"),
      linePair("focus", "Pillars of the 2025 roadmap"),
      linePair("projects", "Key programs shipped"),
      linePair("skills", "Deep-tech stacks that matter"),
      linePair("stats", "Quick brag sheet"),
      linePair("connect", "Links & contact"),
      linePair("clear", "Wipe the terminal")
    ];
  },
  about() {
    return [
      `${profile.name} — ${profile.role}`,
      `${profile.location} · ${profile.company}`,
      profile.mission,
      "Bio: AI is the biggest leverage multiplier I've seen; I pair firmware depth with intelligent tooling to unblock teams fast."
    ];
  },
  focus() {
    return profile.focus.map(point => `• ${point}`);
  },
  projects() {
    return profile.projects.map(
      project => `<strong>${project.name}</strong> (${project.org}) — ${project.details}`
    );
  },
  skills() {
    return [
      sectionLabel("Firmware & Embedded", profile.skills.firmware),
      sectionLabel("AI & Machine Learning", profile.skills.ai),
      sectionLabel("Cloud & Dev", profile.skills.cloud),
      sectionLabel("Leadership", profile.skills.leadership)
    ];
  },
  stats() {
    return profile.stats.map(stat => `› ${stat}`);
  },
  connect() {
    return [
      linkLine("Email", profile.links.email, `mailto:${profile.links.email}`),
      linkLine("GitHub", profile.links.github, profile.links.github),
      linkLine("LinkedIn", profile.links.linkedin, profile.links.linkedin),
      linkLine("X/Twitter", profile.links.twitter, profile.links.twitter),
      linkLine("Website", profile.links.site, profile.links.site)
    ];
  },
  clear() {
    outputEl.innerHTML = "";
    return [];
  }
};

function linePair(cmd, description) {
  return `<strong>${cmd}</strong> — ${description}`;
}

function sectionLabel(title, content) {
  return `<strong>${title}:</strong> ${content}`;
}

function linkLine(label, value, href) {
  return `<strong>${label}:</strong> <a href="${href}" target="_blank" rel="noreferrer noopener">${value}</a>`;
}

function writeLine(text, className = "") {
  const line = document.createElement("p");
  line.className = `terminal__line ${className}`.trim();
  line.innerHTML = text;
  outputEl.appendChild(line);
  outputEl.scrollTop = outputEl.scrollHeight;
}

function promptLine(command) {
  const label = `<span class="terminal__prompt-label">&gt;</span> ${command}`;
  writeLine(label);
}

function executeCommand(rawInput) {
  const input = rawInput.trim();
  if (!input) {
    return;
  }

  promptLine(input);
  const key = input.toLowerCase();
  const handler = commands[key];

  if (!handler) {
    writeLine(`Unknown command: ${key}. Type <strong>help</strong> to explore.`, "terminal__line--warning");
    return;
  }

  const result = handler();
  result.forEach(text => writeLine(text));
}

function bootSequence() {
  const welcome = [
    "// connected to zuabi.dev",
    `// model: GPT-5.1-Codex · ${new Date().getFullYear()}`,
    `Welcome, operator. You're looking at ${profile.name}'s mission control.`,
    "Type <strong>help</strong> to discover the available commands."
  ];
  welcome.forEach(text => writeLine(text));
}

formEl.addEventListener("submit", event => {
  event.preventDefault();
  const value = inputEl.value;
  executeCommand(value);
  if (value.trim()) {
    history.push(value.trim());
    historyIndex = history.length;
  }
  inputEl.value = "";
});

inputEl.addEventListener("keydown", event => {
  if (event.key === "ArrowUp") {
    event.preventDefault();
    if (historyIndex > 0) {
      historyIndex -= 1;
      inputEl.value = history[historyIndex];
    }
  } else if (event.key === "ArrowDown") {
    event.preventDefault();
    if (historyIndex < history.length - 1) {
      historyIndex += 1;
      inputEl.value = history[historyIndex];
    } else {
      historyIndex = history.length;
      inputEl.value = "";
    }
  }
});

shortcutButtons.forEach(button => {
  button.addEventListener("click", () => {
    const cmd = button.dataset.command;
    inputEl.value = cmd;
    executeCommand(cmd);
    inputEl.value = "";
    inputEl.focus();
  });
});

bootSequence();
inputEl.focus();
