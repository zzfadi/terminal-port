const profile = {
    name: "Fadi Al Zuabi",
    role: "Senior Firmware Engineer & AI Champion",
    company: "Solidigm (SK Hynix)",
    location: "Roseville, CA",
    languages: "English (fluent), Arabic (native)",
    education: "University of Illinois at Urbana-Champaign (UIUC), B.S. Electrical Engineering, 2019, Focus: Embedded Systems, Digital Design",
    career: ["Solidigm (2022–Present): Senior Firmware Engineer, AI Champion", "Intel (2021–2022): Firmware Engineer, NAND Storage", "GE Aerospace (2019–2021): Embedded Software Engineer, Aircraft Systems"],
    links: {
        email: "fadi.b.zuabi@gmail.com",
        github: "https://github.com/zzfadi",
        linkedin: "https://linkedin.com/in/fadi-zuabi",
        twitter: "https://x.com/fadi_zuabi",
        website: "https://www.zuabi.dev"
    },
    tagline: "Building bridges between hardware and AI. Helping engineers ship faster with intelligent tools.",
    currentFocus: [
        "Leading AI adoption programs at Solidigm (70% Copilot usage increase)",
        "Training engineers to ship faster with AI tools (60+ trained)",
        "Building intelligent firmware debugging systems (DataIku, Snowflake, GNN)",
        "Technical Product Lead for GEN5 PCIe SSD delivery",
        "Goal: Make AI useful for people who build real systems."
    ],
    notableWork: [
        {
            title: "Intelligent Firmware Debug Agent (Solidigm)",
            desc: "AI-powered debugging system with multi-LLM orchestration and predictive capabilities",
            tech: "DataIku, Snowflake, Graph Neural Networks, Multi-LLM"
        },
        {
            title: "GitHub Copilot Enterprise Deployment (Solidigm)",
            desc: "Company-wide AI tool customization and adoption framework",
            impact: "70% adoption increase, trained 60+ senior engineers"
        },
        {
            title: "GEN5 PCIe SSD (Solidigm)",
            desc: "Technical Product Lead, primary liaison across firmware/validation/cross-company teams"
        },
        {
            title: "CI/CD Optimization (GE Aerospace)",
            desc: "Cloud-based static analysis automation",
            impact: "80-90% runtime reduction, $30k+ annual savings"
        },
        {
            title: "First 4G-LTE Module in Aviation (GE Aerospace)",
            desc: "First cellular module integration in aviation health monitoring industry"
        }
    ],
    skills: {
        firmware: {
            exp: "5+ years",
            tech: "C/C++, NVMe, PCIe Gen4/Gen5, Multi-core (ARM, Xtensa), RTOS, Linux kernel",
            domains: "SSD firmware, NAND flash management, aircraft systems, hardware-software integration",
            standards: "DO-178C (aviation safety), MISRA C/C++"
        },
        ai: {
            exp: "1.5+ years (accelerated)",
            tech: "LLM integration (GPT-4, Claude, Gemini), Prompt engineering, RAG systems",
            platforms: "DataIku, Snowflake, Vertex AI",
            focus: "Enterprise AI adoption, AI tool customization, multi-LLM evaluation"
        },
        cloud: {
            exp: "2+ years",
            tech: "GCP, Firebase, Python, TypeScript, React, Next.js"
        },
        leadership: {
            exp: "3+ years",
            scope: "Trained 60+ engineers, cross-functional team leadership, technical product ownership"
        }
    },
    stats: {
        yearsFirmware: "5+",
        engineersTrained: "60+",
        adoptionIncrease: "70%",
        cicdReduction: "80-90%"
    },
    bio: {
        short: "Firmware engineer. AI builder. Bridging hardware and intelligence.",
        medium: "I'm a firmware engineer who builds AI systems. UIUC grad, worked at GE Aerospace and Intel, now at Solidigm where I train engineers on AI tools and build systems that make firmware development smarter.",
        extended: "AI is the biggest leverage multiplier I've seen in my engineering career. I watched junior engineers become 2-3x more productive with the right tools. That's why I champion AI adoption at Solidigm—turning skeptics into believers, one workflow at a time. My superpower is bridging deep firmware expertise with cutting-edge AI capabilities."
    }
};

const output = document.getElementById('output');
const input = document.getElementById('command-input');
const promptText = 'fadi@portfolio:~$ ';
let commandHistory = [];
let historyIndex = -1;

function typeText(text, callback) {
    let i = 0;
    const span = document.createElement('span');
    span.className = 'result';
    output.appendChild(span);
    const interval = setInterval(() => {
        span.textContent += text[i];
        i++;
        if (i >= text.length) {
            clearInterval(interval);
            newLine();
            if (callback) callback();
        }
    }, 30);
}

function appendOutput(text, className = '') {
    const span = document.createElement('span');
    span.className = className;
    span.textContent = text;
    output.appendChild(span);
    output.scrollTop = output.scrollHeight;
}

function newLine() {
    output.appendChild(document.createElement('br'));
}

function processCommand(cmd) {
    cmd = cmd.trim();
    if (cmd) {
        commandHistory.push(cmd);
        historyIndex = commandHistory.length;
    }
    appendOutput(cmd + '\n', 'command');
    let result = '';
    let resultClass = 'result';
    const lowerCmd = cmd.toLowerCase();
    switch(lowerCmd) {
        case 'help':
            result = `Available commands:\n  help     - Show this help\n  about    - About me\n  projects - Notable work\n  skills   - Skills and expertise\n  connect  - Contact links\n  stats    - Key statistics\n  clear    - Clear terminal\n  whoami   - Who am I\n  exit     - Exit terminal\n\n`;
            break;
        case 'about':
            result = `${profile.bio.medium}\n\nTagline: ${profile.tagline}\n\nCurrent Focus:\n${profile.currentFocus.map(f => `  - ${f}`).join('\n')}\n\n`;
            break;
        case 'projects':
            result = 'Notable Work:\n' + profile.notableWork.map(p => `  ${p.title}\n    ${p.desc}\n    Tech: ${p.tech || 'N/A'}\n    Impact: ${p.impact || 'N/A'}\n`).join('\n') + '\n';
            break;
        case 'skills':
            result = 'Skills:\n' +
                `Firmware & Embedded (${profile.skills.firmware.exp}):\n  Tech: ${profile.skills.firmware.tech}\n  Domains: ${profile.skills.firmware.domains}\n  Standards: ${profile.skills.firmware.standards}\n\n` +
                `AI & Machine Learning (${profile.skills.ai.exp}):\n  Tech: ${profile.skills.ai.tech}\n  Platforms: ${profile.skills.ai.platforms}\n  Focus: ${profile.skills.ai.focus}\n\n` +
                `Cloud & Development (${profile.skills.cloud.exp}):\n  Tech: ${profile.skills.cloud.tech}\n\n` +
                `Leadership (${profile.skills.leadership.exp}):\n  Scope: ${profile.skills.leadership.scope}\n\n`;
            break;
        case 'connect':
            result = 'Connect:\n' +
                `  Email: ${profile.links.email}\n` +
                `  GitHub: ${profile.links.github}\n` +
                `  LinkedIn: ${profile.links.linkedin}\n` +
                `  X/Twitter: ${profile.links.twitter}\n` +
                `  Website: ${profile.links.website}\n\n`;
            break;
        case 'stats':
            result = `Key Stats:\n  ${profile.stats.yearsFirmware} years in firmware engineering\n  ${profile.stats.engineersTrained} engineers trained on AI tools\n  ${profile.stats.adoptionIncrease} AI adoption increase achieved\n  ${profile.stats.cicdReduction} CI/CD runtime reduction\n\n`;
            break;
        case 'whoami':
            result = `${profile.name}\n${profile.role} at ${profile.company}\nLocation: ${profile.location}\nLanguages: ${profile.languages}\n\n`;
            break;
        case 'clear':
            output.innerHTML = '';
            return;
        case 'exit':
            result = 'Exiting terminal...\n';
            appendOutput(result, resultClass);
            setTimeout(() => location.reload(), 1000);
            return;
        default:
            result = `Command not found: ${cmd}. Type 'help' for commands.\n\n`;
            resultClass = 'error';
    }
    appendOutput(result, resultClass);
}

input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        const cmd = input.value;
        processCommand(cmd);
        input.value = '';
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
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const welcomeText = 'Welcome to Fadi Al Zuabi\'s Terminal Portfolio\nType \'help\' for available commands.\n\n';
    typeText(welcomeText, () => {
        appendOutput(promptText, 'prompt');
    });
});