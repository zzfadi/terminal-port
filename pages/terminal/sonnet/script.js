// Terminal Portfolio - Fadi Al Zuabi
const output = document.getElementById('output');
const input = document.getElementById('command-input');

const profile = {
    name: 'Fadi Al Zuabi',
    role: 'Senior Firmware Engineer & AI Champion',
    company: 'Solidigm (SK Hynix)',
    location: 'Roseville, CA',
    email: 'fadi.b.zuabi@gmail.com',
    github: 'https://github.com/zzfadi',
    linkedin: 'https://linkedin.com/in/fadi-zuabi',
    twitter: 'https://x.com/fadi_zuabi',
    website: 'https://www.zuabi.dev',
    tagline: 'Building bridges between hardware and AI. Helping engineers ship faster with intelligent tools.',
    
    projects: [
        {
            name: 'Intelligent Firmware Debug Agent',
            description: 'AI-powered debugging system with multi-LLM orchestration and predictive capabilities',
            tech: 'DataIku, Snowflake, GNN, Multi-LLM',
            company: 'Solidigm'
        },
        {
            name: 'GitHub Copilot Enterprise Deployment',
            description: 'Company-wide AI tool customization and adoption framework',
            impact: '70% adoption increase, trained 60+ engineers',
            company: 'Solidigm'
        },
        {
            name: 'GEN5 PCIe SSD',
            description: 'Technical Product Lead, primary liaison across firmware/validation teams',
            company: 'Solidigm'
        },
        {
            name: 'CI/CD Optimization',
            description: 'Cloud-based static analysis automation',
            impact: '80-90% runtime reduction, $30k+ annual savings',
            company: 'GE Aerospace'
        },
        {
            name: 'First 4G-LTE Module in Aviation',
            description: 'First cellular module integration in aviation health monitoring industry',
            company: 'GE Aerospace'
        }
    ],
    
    skills: {
        'Firmware & Embedded': {
            years: '5+',
            tech: ['C/C++', 'NVMe', 'PCIe Gen4/Gen5', 'ARM/Xtensa', 'RTOS', 'Linux kernel'],
            standards: ['DO-178C', 'MISRA C/C++']
        },
        'AI & Machine Learning': {
            years: '1.5+',
            tech: ['LLM Integration', 'RAG Systems', 'Prompt Engineering'],
            platforms: ['DataIku', 'Snowflake', 'Vertex AI']
        },
        'Cloud & Development': {
            years: '2+',
            tech: ['GCP', 'Firebase', 'Python', 'TypeScript', 'React', 'Next.js']
        }
    },
    
    stats: {
        'Firmware Engineering': '5+ years',
        'Engineers Trained': '60+',
        'AI Adoption Increase': '70%',
        'CI/CD Optimization': '80-90%'
    }
};

const commands = {
    help: () => {
        return [
            { text: 'Available commands:', class: 'header' },
            { text: '' },
            { text: '  help       Show this message', class: 'dim' },
            { text: '  about      Who am I?', class: 'dim' },
            { text: '  projects   Notable work & impact', class: 'dim' },
            { text: '  skills     Technical expertise', class: 'dim' },
            { text: '  stats      Career highlights', class: 'dim' },
            { text: '  connect    Get in touch', class: 'dim' },
            { text: '  clear      Clear terminal', class: 'dim' },
            { text: '' },
            { text: 'Pro tip: Tab completion and arrow keys work!', class: 'warning' }
        ];
    },
    
    about: () => {
        return [
            { text: profile.name, class: 'header' },
            { text: profile.role, class: 'success' },
            { text: `${profile.company} • ${profile.location}`, class: 'dim' },
            { text: '' },
            { text: profile.tagline },
            { text: '' },
            { text: 'Current Focus:', class: 'header' },
            { text: '  → Leading AI adoption programs at Solidigm (70% Copilot usage increase)' },
            { text: '  → Training engineers to ship faster with AI tools (60+ trained)' },
            { text: '  → Building intelligent firmware debugging systems' },
            { text: '  → Technical Product Lead for GEN5 PCIe SSD delivery' },
            { text: '' },
            { text: 'Education:', class: 'header' },
            { text: '  University of Illinois at Urbana-Champaign (UIUC)', class: 'dim' },
            { text: '  B.S. Electrical Engineering, 2019', class: 'dim' },
            { text: '' },
            { text: 'Career Timeline:', class: 'header' },
            { text: '  2022–Present  Solidigm (Senior Firmware Engineer, AI Champion)', class: 'dim' },
            { text: '  2021–2022     Intel (Firmware Engineer, NAND Storage)', class: 'dim' },
            { text: '  2019–2021     GE Aerospace (Embedded Software Engineer)', class: 'dim' }
        ];
    },
    
    projects: () => {
        const lines = [
            { text: 'Notable Projects', class: 'header' },
            { text: '' }
        ];
        
        profile.projects.forEach((project, idx) => {
            lines.push({ text: `${idx + 1}. ${project.name}`, class: 'success' });
            lines.push({ text: `   ${project.description}` });
            if (project.tech) {
                lines.push({ text: `   Tech: ${project.tech}`, class: 'dim' });
            }
            if (project.impact) {
                lines.push({ text: `   Impact: ${project.impact}`, class: 'warning' });
            }
            lines.push({ text: `   Company: ${project.company}`, class: 'dim' });
            lines.push({ text: '' });
        });
        
        return lines;
    },
    
    skills: () => {
        const lines = [
            { text: 'Technical Skills', class: 'header' },
            { text: '' }
        ];
        
        Object.entries(profile.skills).forEach(([category, data]) => {
            lines.push({ text: `${category} (${data.years} experience)`, class: 'success' });
            data.tech.forEach(tech => {
                lines.push({ text: `  → ${tech}` });
            });
            if (data.platforms) {
                lines.push({ text: '  Platforms:', class: 'dim' });
                data.platforms.forEach(platform => {
                    lines.push({ text: `    • ${platform}`, class: 'dim' });
                });
            }
            if (data.standards) {
                lines.push({ text: '  Standards:', class: 'dim' });
                data.standards.forEach(standard => {
                    lines.push({ text: `    • ${standard}`, class: 'dim' });
                });
            }
            lines.push({ text: '' });
        });
        
        return lines;
    },
    
    stats: () => {
        return [
            { text: 'Career Highlights', class: 'header' },
            { text: '' },
            ...Object.entries(profile.stats).map(([key, value]) => ({
                text: `  ${key.padEnd(25)} ${value}`,
                class: 'success'
            })),
            { text: '' },
            { text: 'Goal: Make AI useful for people who build real systems.', class: 'warning' }
        ];
    },
    
    connect: () => {
        return [
            { text: 'Connect with me', class: 'header' },
            { text: '' },
            { text: `  Email:    ${profile.email}`, html: `  Email:    <a href="mailto:${profile.email}">${profile.email}</a>` },
            { text: `  GitHub:   ${profile.github}`, html: `  GitHub:   <a href="${profile.github}" target="_blank">@zzfadi</a>` },
            { text: `  LinkedIn: ${profile.linkedin}`, html: `  LinkedIn: <a href="${profile.linkedin}" target="_blank">fadi-zuabi</a>` },
            { text: `  Twitter:  ${profile.twitter}`, html: `  Twitter:  <a href="${profile.twitter}" target="_blank">@fadi_zuabi</a>` },
            { text: `  Website:  ${profile.website}`, html: `  Website:  <a href="${profile.website}" target="_blank">zuabi.dev</a>` }
        ];
    },
    
    clear: () => {
        output.innerHTML = '';
        return [];
    }
};

function printOutput(lines) {
    lines.forEach(line => {
        const div = document.createElement('div');
        div.className = `output-line ${line.class || ''}`;
        
        if (line.html) {
            div.innerHTML = line.html;
        } else {
            div.textContent = line.text;
        }
        
        output.appendChild(div);
    });
    
    // Scroll to bottom
    output.parentElement.scrollTop = output.parentElement.scrollHeight;
}

function printCommand(cmd) {
    const div = document.createElement('div');
    div.className = 'output-line command';
    div.textContent = cmd;
    output.appendChild(div);
}

function executeCommand(cmd) {
    const trimmed = cmd.trim().toLowerCase();
    
    if (!trimmed) return;
    
    printCommand(cmd);
    
    if (commands[trimmed]) {
        const result = commands[trimmed]();
        if (result.length > 0) {
            printOutput(result);
        }
    } else {
        printOutput([
            { text: `Command not found: ${cmd}`, class: 'error' },
            { text: 'Type "help" for available commands', class: 'dim' }
        ]);
    }
}

// Input handling
input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        const cmd = input.value;
        input.value = '';
        executeCommand(cmd);
    } else if (e.key === 'Tab') {
        e.preventDefault();
        const partial = input.value.toLowerCase();
        const matches = Object.keys(commands).filter(cmd => cmd.startsWith(partial));
        
        if (matches.length === 1) {
            input.value = matches[0];
        } else if (matches.length > 1) {
            printCommand(input.value);
            printOutput(matches.map(cmd => ({ text: `  ${cmd}`, class: 'dim' })));
        }
    }
});

// Keep focus on input
document.addEventListener('click', () => {
    input.focus();
});

// Welcome message
window.addEventListener('load', () => {
    printOutput([
        { text: '╔═══════════════════════════════════════════════════════════╗', class: 'accent' },
        { text: '║  Welcome to Fadi Al Zuabi\'s Terminal Portfolio           ║', class: 'accent' },
        { text: '║  Senior Firmware Engineer & AI Champion                  ║', class: 'accent' },
        { text: '╚═══════════════════════════════════════════════════════════╝', class: 'accent' },
        { text: '' },
        { text: 'Type "help" to see available commands', class: 'success' },
        { text: '' }
    ]);
    
    input.focus();
});