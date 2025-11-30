const output = document.getElementById('output');
const input = document.getElementById('command-input');
const terminal = document.querySelector('main.terminal');

const commands = {
    help: {
        description: 'List available commands',
        execute: () => {
            return `Available commands:
  <span style="color: var(--text-warning)">bio</span>       - Display profile summary
  <span style="color: var(--text-warning)">projects</span>  - View notable work
  <span style="color: var(--text-warning)">skills</span>    - List technical expertise
  <span style="color: var(--text-warning)">connect</span>   - Show contact info
  <span style="color: var(--text-warning)">clear</span>     - Clear terminal output
  <span style="color: var(--text-warning)">help</span>      - Show this help message`;
        }
    },
    bio: {
        description: 'Display profile summary',
        execute: () => {
            return `<h1>Fadi Al Zuabi</h1>
Senior Firmware Engineer & AI Champion @ Solidigm
Roseville, CA

> Building bridges between hardware and AI. Helping engineers ship faster with intelligent tools.

I'm a firmware engineer who builds AI systems. UIUC grad, worked at GE Aerospace and Intel, now at Solidigm where I train engineers on AI tools and build systems that make firmware development smarter.

<span style="color: var(--text-secondary)">Type 'projects' to see what I've been working on.</span>`;
        }
    },
    projects: {
        description: 'View notable work',
        execute: () => {
            return `<h2>Notable Work</h2>

<span style="color: var(--text-primary)">Intelligent Firmware Debug Agent (Solidigm)</span>
AI-powered debugging system with multi-LLM orchestration and predictive capabilities.
Stack: DataIku, Snowflake, GNN, Multi-LLM

<span style="color: var(--text-primary)">GitHub Copilot Enterprise Deployment (Solidigm)</span>
Company-wide AI tool customization and adoption framework.
Impact: 70% adoption increase, trained 60+ senior engineers.

<span style="color: var(--text-primary)">GEN5 PCIe SSD (Solidigm)</span>
Technical Product Lead, primary liaison across firmware/validation/cross-company teams.

<span style="color: var(--text-primary)">CI/CD Optimization (GE Aerospace)</span>
Cloud-based static analysis automation.
Impact: 80-90% runtime reduction, $30k+ annual savings.`;
        }
    },
    skills: {
        description: 'List technical expertise',
        execute: () => {
            return `<h2>Skills</h2>

<span style="color: var(--text-warning)">Firmware & Embedded</span>
C/C++, NVMe, PCIe Gen4/Gen5, Multi-core (ARM, Xtensa), RTOS, Linux kernel, DO-178C, MISRA C/C++

<span style="color: var(--text-warning)">AI & Machine Learning</span>
LLM integration (GPT-4, Claude, Gemini), Prompt engineering, RAG systems, DataIku, Snowflake, Vertex AI

<span style="color: var(--text-warning)">Cloud & Development</span>
GCP, Firebase, Python, TypeScript, React, Next.js

<span style="color: var(--text-warning)">Leadership</span>
Technical Product Ownership, Cross-functional team leadership, AI Training`;
        }
    },
    connect: {
        description: 'Show contact info',
        execute: () => {
            return `<h2>Connect</h2>
<ul>
  <li>Email:    <a href="mailto:fadi.b.zuabi@gmail.com">fadi.b.zuabi@gmail.com</a></li>
  <li>GitHub:   <a href="https://github.com/zzfadi" target="_blank">@zzfadi</a></li>
  <li>LinkedIn: <a href="https://linkedin.com/in/fadi-zuabi" target="_blank">in/fadi-zuabi</a></li>
  <li>Twitter:  <a href="https://x.com/fadi_zuabi" target="_blank">@fadi_zuabi</a></li>
  <li>Website:  <a href="https://www.zuabi.dev" target="_blank">zuabi.dev</a></li>
</ul>`;
        }
    },
    clear: {
        description: 'Clear terminal output',
        execute: () => {
            output.innerHTML = '';
            return null;
        }
    }
};

function printOutput(text, command = '') {
    if (text === null) return; // For clear command

    const div = document.createElement('div');
    div.className = 'command-block';
    
    if (command) {
        const cmdLine = document.createElement('div');
        cmdLine.className = 'command-line';
        cmdLine.innerHTML = `<span class="prompt">guest@zuabi.dev:~$</span> ${command}`;
        div.appendChild(cmdLine);
    }

    const response = document.createElement('div');
    response.className = 'response';
    response.innerHTML = text;
    div.appendChild(response);

    output.appendChild(div);
    
    // Scroll to bottom
    window.scrollTo(0, document.body.scrollHeight);
}

input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        const cmd = input.value.trim().toLowerCase();
        input.value = '';
        
        if (cmd === '') {
            printOutput('', '');
            return;
        }

        if (commands[cmd]) {
            printOutput(commands[cmd].execute(), cmd);
        } else {
            printOutput(`Command not found: ${cmd}. Type <span style="color: var(--text-warning)">help</span> for available commands.`, cmd);
        }
    }
});

// Focus input when clicking anywhere
document.addEventListener('click', () => {
    input.focus();
});

// Initial welcome message
window.addEventListener('DOMContentLoaded', () => {
    const welcomeMsg = `Welcome to Fadi Al Zuabi's terminal portfolio v1.0.
Type <span style="color: var(--text-warning)">help</span> to see available commands.
`;
    printOutput(welcomeMsg);
    // Auto-run bio for better UX
    setTimeout(() => {
        printOutput(commands.bio.execute(), 'bio');
    }, 500);
});
