export const portfolioData = {
  profile: {
    name: "Fadi Al Zuabi",
    title: "Senior Firmware Engineer",
    company: "Solidigm (Intel)",
    location: "San Francisco Bay Area",
    email: "fadialzuabi@gmail.com",
    linkedin: "https://linkedin.com/in/fadizuabi",
    github: "https://github.com/fadialzuabi",
    summary: "Senior Firmware Engineer with 10+ years experience in embedded systems, NVMe SSDs, and AI/ML integration. Currently leading Gen5 SSD firmware development at Solidigm, achieving 14GB/s throughput and 40% latency reduction."
  },
  skills: {
    languages: ["C", "C++", "Python", "TypeScript", "JavaScript", "ARM Assembly", "Rust", "Go"],
    firmware: ["NVMe Protocol", "PCIe Gen5", "FreeRTOS", "ARM Cortex-M/R", "DMA", "Interrupt Handling", "Power Management"],
    web: ["React", "Next.js", "Node.js", "TypeScript", "WebAssembly", "Three.js"],
    ai: ["TensorFlow", "PyTorch", "Transformers", "LLMs", "Computer Vision", "Edge AI"],
    tools: ["Git", "Docker", "Kubernetes", "Jenkins", "JIRA", "Perforce"],
    cloud: ["AWS", "GCP", "Azure", "Firebase", "Vercel"]
  },
  experience: [
    {
      company: "Solidigm (Intel)",
      role: "Senior Firmware Engineer",
      period: "2021 - Present",
      location: "Rancho Cordova, CA",
      highlights: [
        "Lead firmware development for Gen5 NVMe SSDs achieving 14GB/s throughput",
        "Reduced latency by 40% through optimized interrupt handling",
        "Implemented AI-driven predictive maintenance reducing failures by 25%",
        "Architected power management system improving efficiency by 30%"
      ]
    },
    {
      company: "General Electric Aviation",
      role: "Firmware Engineer II",
      period: "2018 - 2021",
      location: "Cincinnati, OH",
      highlights: [
        "Developed real-time diagnostics for LEAP jet engine controllers",
        "Implemented safety-critical systems meeting DO-178C standards",
        "Created predictive maintenance algorithms using sensor fusion",
        "Reduced diagnostic response time from 2s to 50ms"
      ]
    },
    {
      company: "Tesla",
      role: "Embedded Software Engineer",
      period: "2016 - 2018",
      location: "Palo Alto, CA",
      highlights: [
        "Developed battery management firmware for Model S/X",
        "Implemented thermal management algorithms improving range by 5%",
        "Created OTA update system for MCU firmware",
        "Optimized CAN bus communication reducing latency by 60%"
      ]
    },
    {
      company: "Apple",
      role: "Software Engineering Intern",
      period: "2015 - 2016",
      location: "Cupertino, CA",
      highlights: [
        "Contributed to iOS kernel optimizations for iPhone 7",
        "Implemented power-efficient background task scheduling",
        "Developed unit tests improving code coverage by 35%"
      ]
    }
  ],
  education: [
    {
      degree: "M.S. Computer Engineering",
      school: "Stanford University",
      year: "2016",
      gpa: "3.9/4.0",
      focus: "Embedded Systems & Machine Learning"
    },
    {
      degree: "B.S. Electrical Engineering",
      school: "UC Berkeley",
      year: "2014",
      gpa: "3.8/4.0",
      honors: "Magna Cum Laude"
    }
  ],
  projects: [
    {
      name: "NVMe AI Accelerator",
      description: "Hardware-accelerated ML inference engine integrated with SSD controller",
      technologies: ["C++", "FPGA", "TensorFlow Lite", "ARM Cortex-R"],
      impact: "50x faster inference for edge AI workloads",
      link: "github.com/fadialzuabi/nvme-ai"
    },
    {
      name: "Distributed Firmware Update System",
      description: "Zero-downtime firmware update system for enterprise SSDs",
      technologies: ["C", "Python", "gRPC", "Kubernetes"],
      impact: "Reduced update time from hours to minutes"
    },
    {
      name: "Real-time Telemetry Dashboard",
      description: "Web-based monitoring system for SSD health metrics",
      technologies: ["React", "WebSocket", "D3.js", "Node.js"],
      impact: "Enabled predictive failure detection with 95% accuracy"
    },
    {
      name: "Embedded ML Framework",
      description: "Lightweight ML inference library for microcontrollers",
      technologies: ["C", "ARM Assembly", "TensorFlow Lite"],
      impact: "10x reduction in memory footprint for edge AI"
    },
    {
      name: "RTOS Task Scheduler",
      description: "Priority-based preemptive scheduler for safety-critical systems",
      technologies: ["C", "FreeRTOS", "ARM Cortex-R"],
      impact: "Guaranteed <1ms worst-case response time"
    }
  ]
};

export function formatPortfolioForAI(): string {
  return `
PROFESSIONAL PROFILE:
${portfolioData.profile.name} - ${portfolioData.profile.title} at ${portfolioData.profile.company}
${portfolioData.profile.summary}

CONTACT:
Email: ${portfolioData.profile.email}
LinkedIn: ${portfolioData.profile.linkedin}
GitHub: ${portfolioData.profile.github}
Location: ${portfolioData.profile.location}

TECHNICAL SKILLS:
Programming Languages: ${portfolioData.skills.languages.join(", ")}
Firmware & Embedded: ${portfolioData.skills.firmware.join(", ")}
Web Technologies: ${portfolioData.skills.web.join(", ")}
AI/ML: ${portfolioData.skills.ai.join(", ")}
Tools & Platforms: ${portfolioData.skills.tools.join(", ")}
Cloud Services: ${portfolioData.skills.cloud.join(", ")}

PROFESSIONAL EXPERIENCE:
${portfolioData.experience.map(exp =>
  `${exp.company} - ${exp.role} (${exp.period})
  Location: ${exp.location}
  Key Achievements:
  ${exp.highlights.map(h => `  - ${h}`).join("\n")}`
).join("\n\n")}

EDUCATION:
${portfolioData.education.map(edu =>
  `${edu.degree} - ${edu.school} (${edu.year})
  GPA: ${edu.gpa}${edu.focus ? `\n  Focus: ${edu.focus}` : ""}${edu.honors ? `\n  Honors: ${edu.honors}` : ""}`
).join("\n\n")}

KEY PROJECTS:
${portfolioData.projects.map(proj =>
  `${proj.name}
  Description: ${proj.description}
  Technologies: ${proj.technologies.join(", ")}
  Impact: ${proj.impact}${proj.link ? `\n  Link: ${proj.link}` : ""}`
).join("\n\n")}
`;
}