/**
 * Consolidated Portfolio Data - Single Source of Truth
 * Merged from portfolio-master, portfolio-enriched, and portfolio-extended
 * Last updated: 2025-01-28
 */

export const portfolioData = {
  // Metadata
  metadata: {
    version: "1.0.0",
    lastUpdated: "2025-01-28",
    schemaVersion: "1.0",
    dataClassification: "public",
    type: "professional-portfolio",
    subject: "fadi-al-zuabi",
    tags: ["firmware", "embedded", "ai", "ml", "engineering", "leadership"],
    language: "en",
    confidence: 1.0
  },

  // Personal Information
  personal: {
    name: {
      full: "Fadi Al Zuabi",
      display: "Fadi Al Zuabi"
    },
    title: "Senior Firmware Engineer & AI Flow Engineer",
    location: {
      city: "Roseville",
      state: "California",
      country: "USA"
    },
    contact: {
      email: "fadi.b.zuabi@gmail.com",
      website: "https://www.zuabi.dev",
      linkedin: "https://linkedin.com/in/fadi-zuabi",
      github: "https://github.com/fadialzuabi",
      portfolio: "https://terminal.zuabi.dev"
    },
    languages: [
      { name: "English", proficiency: "Fluent" },
      { name: "Arabic", proficiency: "Native" }
    ]
  },

  // Professional Summary
  professional: {
    currentTitle: "Senior Firmware Engineer & AI Flow Engineer",
    yearsExperience: 6,
    startDate: "2019-08-01",
    currentEmployer: "SK Hynix / Solidigm",
    specializations: {
      primary: [
        "Firmware Development",
        "Embedded Systems",
        "AI/ML Integration"
      ],
      secondary: [
        "Technical Leadership",
        "Full-Stack Development",
        "System Architecture"
      ]
    },
    clearanceEligible: true,

    // Professional Update 2024-2025
    summary: `Fadi Al Zuabi is a Firmware and Embedded Software Engineer who now serves as an AI Flow Engineer, blending deep embedded expertise with modern AI adoption. With 5+ years of experience delivering enterprise SSD firmware and leading AI transformation programs, he excels at rapid learning, technical leadership, and shipping scalable systems that leverage AI to accelerate development and empower teams.`,

    keyRoles: {
      technicalProductLead: {
        project: "GEN5 PCIe SSD",
        period: "2024-2025",
        achievements: [
          "Directed cross-company teams to deliver GEN5 PCIe SSD firmware",
          "Balanced architecture, implementation, validation, and customer requirements",
          "Managed feature integration with sister organizations",
          "Led complex bug triage and sustained execution velocity",
          "Guided performance optimization workstreams",
          "Enabled successful product launch and adoption"
        ]
      },
      aiFlowEngineer: {
        period: "2024-2025",
        responsibilities: [
          "Established AI strategy, proof-of-concepts, and documentation for firmware workflows",
          "Primary AI consultant for firmware teams",
          "Advising on tool selection, implementation tactics, and measurable outcomes"
        ]
      }
    }
  },

  // Education
  education: {
    degree: "Bachelor of Science",
    major: "Electrical Engineering",
    university: "University of Illinois at Urbana-Champaign, Urbana, IL",
    graduationYear: 2019,
    gpa: 3.67,
    gpaScale: 4.0,
    honors: ["Dean's List"],
    relevantCoursework: [
      "Embedded Systems Design",
      "Computer Architecture",
      "Digital Signal Processing",
      "Real-Time Operating Systems"
    ]
  },

  // Experience
  experience: [
    {
      id: "solidigm-senior",
      company: "SK Hynix / Solidigm",
      location: {
        city: "Rancho Cordova",
        state: "CA"
      },
      duration: {
        start: "2022-01-01",
        end: "present"
      },
      positions: [
        {
          title: "Senior Firmware Engineer & AI Flow Engineer",
          period: "2024-01 to present",
          current: true,
          responsibilities: [
            "Lead AI transformation initiatives across firmware organization",
            "Drive technical product delivery for enterprise SSD solutions",
            "Architect AI-powered development workflows and tools"
          ],
          achievements: [
            {
              description: "Trained engineering teams on AI tools",
              metric: "60+ engineers",
              impact: "70% adoption rate"
            },
            {
              description: "Developed AI customization framework",
              impact: "Improved development velocity"
            },
            {
              description: "Led GEN5 PCIe SSD technical delivery",
              impact: "Successful product launch"
            }
          ],
          tags: ["leadership", "ai", "firmware", "product"],
          keyMetrics: {
            engineersTrained: 60,
            adoptionRate: 0.7,
            debugImprovement: 0.8
          }
        },
        {
          title: "Firmware Engineer",
          period: "2022-01 to 2024-01",
          current: false,
          responsibilities: [
            "Develop enterprise SSD firmware features",
            "Debug complex system-level issues",
            "Collaborate with cross-functional teams"
          ],
          achievements: [
            {
              description: "Optimized firmware validation processes",
              impact: "Significant cost savings"
            },
            {
              description: "Reduced bug resolution time",
              impact: "80% improvement"
            }
          ],
          tags: ["firmware", "ssd", "nvme", "debugging"],
          keyMetrics: undefined
        }
      ],
      note: "Continuity from Intel acquisition - same team and role"
    },
    {
      id: "intel",
      company: "Intel Corporation",
      location: {
        city: "Folsom",
        state: "CA"
      },
      duration: {
        start: "2021-06-01",
        end: "2021-12-31"
      },
      positions: [
        {
          title: "Firmware Engineer",
          period: "2021-06 to 2021-12",
          current: false,
          responsibilities: [
            "Developed firmware for enterprise SSD products",
            "Implemented NVMe protocol features",
            "Conducted system-level debugging"
          ],
          achievements: [
            {
              description: "Delivered critical firmware features",
              impact: "On-time product release"
            }
          ],
          tags: ["firmware", "ssd", "nvme"],
          keyMetrics: undefined
        }
      ],
      note: "Team acquired by SK Hynix, became Solidigm"
    },
    {
      id: "ge-aviation",
      company: "GE Aviation",
      location: {
        city: "Grand Rapids",
        state: "MI"
      },
      duration: {
        start: "2019-08-01",
        end: "2021-06-01"
      },
      positions: [
        {
          title: "Embedded Software Engineer",
          period: "2019-08 to 2021-06",
          current: false,
          responsibilities: [
            "Developed safety-critical embedded software",
            "Implemented DO-178C compliant systems",
            "Conducted hardware-software integration"
          ],
          achievements: [
            {
              description: "Led critical certification efforts",
              impact: "Met regulatory requirements"
            },
            {
              description: "Improved testing coverage",
              impact: "Enhanced system reliability"
            }
          ],
          tags: ["embedded", "safety-critical", "do178c", "avionics"],
          keyMetrics: undefined
        }
      ]
    }
  ],

  // Skills
  skills: {
    technical: {
      programmingLanguages: {
        expert: ["C", "C++", "Python"],
        proficient: ["Assembly (ARM, x86)", "Shell Scripting (Bash)", "JavaScript/TypeScript"],
        familiar: ["SystemVerilog", "Verilog HDL"]
      },
      firmwareEmbedded: {
        protocols: ["NVMe", "PCIe", "I2C", "SPI", "UART"],
        tools: ["JTAG/SWD Debugging", "Logic Analyzers", "GDB", "Git/Perforce"],
        platforms: ["ARM Cortex", "x86 Architecture", "Custom RTOS", "Linux Kernel"],
        standards: ["MISRA C/C++", "DO-178C"]
      },
      aiMl: {
        frameworks: ["LangChain", "Vertex AI", "Hugging Face"],
        llms: ["GPT-4", "Claude", "Gemini", "Llama"],
        techniques: ["RAG (Retrieval-Augmented Generation)", "Prompt Engineering", "Fine-tuning", "Vector Embeddings"],
        tools: ["GitHub Copilot", "DataIku", "Jupyter Notebooks"],
        capabilities: [
          "Multi-agent orchestration",
          "Neural and graph-based models",
          "MLOps",
          "Evaluation frameworks"
        ]
      },
      fullStack: {
        frontend: ["React", "Next.js", "TypeScript", "Tailwind CSS", "HTML/CSS"],
        backend: ["Node.js", "Python (FastAPI, Flask)", "PostgreSQL", "Serverless functions"],
        cloud: ["Google Cloud Platform", "Firebase", "Docker", "Kubernetes basics"],
        data: ["Firestore", "PostgreSQL", "Vector databases", "Snowflake"]
      },
      cloudDevOps: {
        gcp: [
          "Firebase (Auth, Firestore, Hosting, Functions)",
          "Cloud Run",
          "Cloud Storage",
          "Kubernetes Engine",
          "App Hosting",
          "Gemini API"
        ],
        apis: ["REST", "GraphQL", "WebSockets", "API Gateway"],
        infrastructure: ["Terraform", "Cloud Build", "GitHub Actions", "CI/CD pipelines"]
      },
      dataEngineering: {
        platforms: ["Snowflake", "Dataiku", "BigQuery"],
        expertise: ["ETL", "Batch/stream processing", "Analytics", "Visualization", "Event-driven integration"]
      }
    },
    topSkills: [
      { name: "Firmware Development", level: "Expert", years: 6 },
      { name: "AI/ML Integration", level: "Advanced", years: 2 },
      { name: "Technical Leadership", level: "Advanced", years: 2 },
      { name: "Embedded Systems", level: "Expert", years: 6 },
      { name: "Python", level: "Expert", years: 5 }
    ],
    softSkills: [
      "Technical Leadership",
      "Cross-functional Collaboration",
      "Rapid Learning",
      "Innovation & Problem Solving",
      "Technical Communication",
      "Mentoring & Teaching"
    ]
  },

  // AI Initiatives
  aiInitiatives: {
    majorProjects: [
      {
        name: "GitHub Copilot Customization Framework",
        description: "Designed firmware-focused prompt guidelines, templates, and implementation guides",
        impact: "Increased Copilot usage by 70%, reinforced through telemetry-driven feedback loops",
        status: "Deployed"
      },
      {
        name: "Enterprise AI Training Program",
        description: "Authored modular curriculum covering AI fundamentals, prompt engineering, and advanced applications grounded in real firmware use cases",
        achievements: [
          "Presented to executives and secured buy-in",
          "Introduced adoption/ROI metrics"
        ],
        status: "Active"
      },
      {
        name: "GitHub Copilot Mastery Workshop",
        description: "Built immersive workshop with trainer guides, hands-on labs, and assessment rubrics",
        impact: "Trained 60+ senior engineers, launched train-the-trainer model with continuous improvement",
        status: "Deployed"
      },
      {
        name: "Intelligent Firmware Debug Agent",
        status: "In Development",
        description: "Architecting AI agent that automates bug analysis, hypothesis generation, and recommendations",
        technologies: [
          "Dataiku (workflow orchestration)",
          "Snowflake (data warehouse)",
          "Jira (workflow automation)",
          "Multi-LLM evaluation stack",
          "Graph neural networks",
          "Predictive bug prevention",
          "CI/CD integration",
          "Knowledge graph construction"
        ]
      }
    ],
    championRole: {
      responsibilities: [
        "Lead firmware organization's AI adoption strategy",
        "Pinpoint workflows where AI improves efficiency, performance, and innovation",
        "Cross-functional liaison aligning AI with product roadmaps",
        "Align with validation priorities and executive objectives"
      ],
      enablementActivities: [
        "Deliver company-wide AI trainings",
        "Showcase internal AI tools and demonstrate capabilities",
        "Conduct interactive workshops with hands-on experience",
        "Provide direct AI support and troubleshooting",
        "Create reusable documentation and best practices",
        "Establish feedback loops for continuous evolution"
      ],
      toolEvaluation: [
        "GitHub Copilot for development acceleration",
        "Custom instruction frameworks for firmware tasks",
        "RAG systems blending factual retrieval with generation",
        "Multi-channel proxy architectures for complex workflows",
        "Focus on developer experience and automation opportunities"
      ]
    }
  },

  // Projects
  projects: {
    professional: [
      {
        id: "intelligent-debug-agent",
        name: "Intelligent Firmware Debug Agent",
        status: "In Development",
        description: "AI-powered system for automated bug analysis and resolution",
        technologies: ["Multi-LLM Architecture", "Graph Neural Networks", "Workflow Automation"],
        impact: "Accelerating debug cycles from days to hours",
        tags: ["ai", "automation", "debugging", "multi-llm"]
      },
      {
        id: "copilot-framework",
        name: "GitHub Copilot Enterprise Framework",
        status: "Deployed",
        description: "Customized AI coding assistant for firmware development",
        technologies: ["Prompt Engineering", "Custom Instructions", "Telemetry Analytics"],
        impact: "70% developer adoption",
        metrics: { adoption: 0.7, userCount: 60 },
        tags: ["ai", "developer-tools", "training"]
      },
      {
        id: "ai-training-program",
        name: "AI Training Program",
        status: "Active",
        description: "Enterprise-wide AI education initiative",
        technologies: ["Modular curriculum", "Hands-on workshops", "Assessment framework"],
        deliverables: ["Modular curriculum", "Hands-on workshops", "Assessment framework"],
        impact: "60+ engineers trained",
        tags: ["education", "ai", "training"]
      }
    ],
    personal: [
      {
        id: "terminal-portfolio",
        name: "Terminal Portfolio",
        url: "https://terminal.zuabi.dev",
        description: "Interactive terminal-based portfolio website",
        technologies: ["Vanilla JavaScript", "CSS Animations", "AI Integration (v2)"],
        status: "Production",
        tags: ["web", "interactive", "ai-powered"]
      },
      {
        id: "ai-service-platform",
        name: "AI-Powered Service Platform",
        description: "End-to-end business platform built with AI assistance",
        technologies: ["Full-stack development", "Cloud deployment", "AI workflow automation"],
        status: "Development",
        tags: ["ai", "full-stack", "cloud"],
        highlights: [
          "Active GitHub portfolio with AI-powered projects",
          "Production-ready service business platform built entirely via AI",
          "Web applications created from scratch using AI agents",
          "Automated workflows and real-time LLM integrations",
          "AI-enhanced web platforms on modern cloud infrastructure"
        ]
      }
    ]
  },

  // Achievements
  achievements: {
    quantified: [
      {
        metric: "Engineers Trained",
        value: 60,
        unit: "people",
        context: "AI adoption program"
      },
      {
        metric: "Adoption Rate",
        value: 70,
        unit: "percent",
        context: "GitHub Copilot implementation"
      },
      {
        metric: "Bug Resolution Improvement",
        value: 80,
        unit: "percent",
        context: "Process optimization"
      },
      {
        metric: "Development Velocity",
        value: "Significant increase",
        context: "AI tool integration"
      },
      {
        metric: "Years Experience",
        value: 6,
        unit: "years"
      }
    ],
    recognition: [
      "AI Champion - SK Hynix Solidigm",
      "Technical Lead - GEN5 PCIe SSD",
      "Dean's List - CSU Sacramento"
    ]
  },

  // Learning & Development
  continuousLearning: {
    philosophy: "Champions 'learning how to learn' as the defining skill in the AI era",
    approach: [
      "Rapidly acquires and applies new technologies through systematic evaluation",
      "Prototype proof-of-concepts and detailed documentation",
      "Shares knowledge through best practices, trainings, and mentoring",
      "Stays current with AI research, industry news, and community discussions"
    ],
    recentAchievements: [
      "Google Cloud professional certifications in AI/ML engineering (in progress)",
      "Google Cloud Skills Boost paths completed",
      "Google I/O 2025 invited attendee - AI/ML tracks",
      "Early access to emerging Google AI technologies"
    ],
    certifications: {
      completed: [
        "Google Cloud Skills Boost - Machine Learning on Google Cloud",
        "Building AI Applications with Gemini",
        "Kubernetes and Cloud Run deployment strategies"
      ],
      inProgress: [
        "Google Cloud Professional ML Engineer",
        "Advanced cloud architecture patterns"
      ]
    }
  },

  // Career Progression
  careerProgression: {
    timeline: [
      {
        period: "2019-08 to 2021-06",
        company: "GE Aviation",
        role: "Embedded Software Engineer",
        focus: "Safety-critical systems, DO-178C compliance"
      },
      {
        period: "2021-06 to 2021-12",
        company: "Intel Corporation",
        role: "Firmware Engineer",
        focus: "Enterprise SSD firmware development"
      },
      {
        period: "2022-01 to 2024-01",
        company: "SK Hynix/Solidigm",
        role: "Firmware Engineer",
        focus: "NVMe protocol, debugging, optimization"
      },
      {
        period: "2024-01 to Present",
        company: "SK Hynix/Solidigm",
        role: "Senior Firmware Engineer & AI Flow Engineer",
        focus: "Technical leadership, AI transformation"
      }
    ],
    growthNarrative: "Journey from embedded systems to AI leadership, individual contributor to organizational influencer, consuming tools to creating frameworks, local impact to company-wide transformation"
  },

  // Professional Attributes
  professionalAttributes: {
    core: [
      "Adaptive learner who rapidly masters emergent AI tooling",
      "Drives organizational change with strategic vision and hands-on delivery",
      "Synthesizes firmware discipline with AI/ML innovation",
      "Innovation catalyst multiplying team capability",
      "Measures outcomes, communicates impact, anticipates technology shifts"
    ],
    differentiators: [
      "Rare combination of deep firmware + AI expertise",
      "Proven impact with quantified metrics",
      "Full journey: IC → Leader, Embedded → AI, Consumer → Creator",
      "Practical application - built and deployed real systems",
      "Continuous learning - active in latest AI/ML developments"
    ],
    communicationStyle: [
      "Technical but accessible",
      "Data-driven with metrics",
      "Focus on practical outcomes",
      "Bridge between hardware and software",
      "Professional, approachable, confident"
    ]
  },

  // Context Prompts for Different Scenarios
  contextPrompts: {
    oneLiner: "Fadi Al Zuabi is a Senior Firmware Engineer and AI Flow Engineer with 6 years of experience, currently leading AI transformation at SK Hynix Solidigm while maintaining deep technical expertise in embedded systems.",

    elevatorPitch: "Fadi Al Zuabi combines rare firmware expertise with AI leadership capabilities. Starting in safety-critical avionics at GE Aviation, he now drives 70% AI adoption across engineering teams at SK Hynix Solidigm. He's trained 60+ engineers, improved debug efficiency by 80%, and led the GEN5 PCIe SSD technical delivery—all while building AI-powered solutions that multiply engineering capability.",

    technicalSummary: "Expert firmware engineer proficient in C/C++/Python with deep NVMe/PCIe protocol knowledge. Experienced with ARM Cortex, x86 architectures, and RTOS/Linux kernel development. Advanced AI/ML practitioner using GPT-4, Claude, Gemini with LangChain, RAG, and prompt engineering techniques.",

    leadershipSummary: "Technical leader who successfully transitioned from individual contributor to organizational transformer. Led GEN5 PCIe SSD product delivery, created enterprise AI framework achieving 70% adoption, and built comprehensive training programs impacting 60+ senior engineers.",

    scenarioSpecific: {
      technicalInterviews: "6 years firmware development, expert C/C++/Python, deep protocol knowledge (NVMe, PCIe), safety-critical systems (DO-178C at GE Aviation), hands-on debugging with JTAG/SWD/Logic Analyzers. Unique combination of low-level embedded with high-level AI/ML capabilities.",

      aimlRoles: "Architecting multi-LLM systems, implementing RAG pipelines, custom GitHub Copilot frameworks, training 60+ engineers with 70% adoption rate, building intelligent automation reducing debug cycles by 80%. Practical AI application, not just theory.",

      leadershipPositions: "Progression from IC to leader: Technical Product Lead for GEN5 SSD, AI Champion driving organizational change, creator of training programs and frameworks, cross-company integration management, bridging technical depth with strategic vision.",

      startupRoles: "Built terminal portfolio from scratch, created AI-powered service platform, rapid prototyping skills, full-stack capabilities when needed, self-directed learning, vision for multiplying human capability through AI."
    }
  },

  // Knowledge Graph Relationships
  knowledgeGraph: {
    keyRelationships: [
      { entity: "SK Hynix/Solidigm", relationship: "WORKS_AT", since: "2022-01", current: true },
      { entity: "GEN5 PCIe SSD", relationship: "LED", role: "Technical Product Lead" },
      { entity: "AI Training Program", relationship: "CREATED", impact: "60+ engineers trained" },
      { entity: "GitHub Copilot Framework", relationship: "IMPLEMENTED", impact: "70% adoption" },
      { entity: "Intelligent Debug Agent", relationship: "ARCHITECTING", status: "In Development" }
    ],
    technicalDomains: [
      { domain: "Firmware Development", level: "Expert", years: 6 },
      { domain: "AI/ML Engineering", level: "Advanced", years: 2 },
      { domain: "Embedded Systems", level: "Expert", years: 6 },
      { domain: "Technical Leadership", level: "Advanced", years: 2 }
    ],
    impactMetrics: {
      engineersInfluenced: 60,
      adoptionRate: 0.7,
      efficiencyGain: 0.8,
      productsDelivered: ["GEN5 PCIe SSD"],
      frameworksCreated: ["GitHub Copilot Enterprise", "AI Training Program"]
    }
  },

  // Interests
  interests: {
    technical: [
      "AI/ML Applications in Embedded Systems",
      "Edge Computing",
      "Hardware Acceleration",
      "Open Source Development"
    ],
    personal: [
      "Continuous Learning",
      "Technical Writing",
      "Community Building"
    ]
  },

  // Vision & Availability
  visionAndAvailability: {
    visionStatement: `In an era where AI capabilities evolve daily, the most valuable skill is not what you know, but how quickly you can learn and apply new knowledge. I've positioned myself at the forefront of the AI revolution, not just as a consumer of AI tools, but as an architect of AI-powered solutions and an enabler of organizational transformation. My goal is to bridge the gap between traditional engineering excellence and AI-augmented innovation, creating systems and workflows that multiply human capability rather than replace it.`,

    availability: {
      status: "Open to opportunities",
      preferences: [
        "AI/ML Engineering roles",
        "Technical Leadership positions",
        "Innovation-focused teams"
      ],
      locationPreference: "California (Remote friendly)"
    }
  },

  // AI Response Guidelines
  aiResponseGuidelines: {
    emphasis: [
      "Both firmware expertise AND AI leadership",
      "Specific metrics when available",
      "Unique firmware-to-AI journey",
      "Enabling others through technology",
      "Balance technical depth with business impact"
    ],
    toneGuidelines: [
      "Professional: Clear, concise, metric-driven",
      "Approachable: Technical but accessible",
      "Confident: Backed by concrete achievements",
      "Forward-thinking: Emphasizes innovation",
      "Humble: Credits team success, focuses on enabling others"
    ]
  },

  // Search Optimization
  searchableText: "Fadi Al Zuabi Senior Firmware Engineer AI Flow Engineer 6 years experience firmware embedded systems NVMe PCIe SSD C C++ Python AI ML machine learning GPT Claude Gemini LangChain RAG prompt engineering technical leadership SK Hynix Solidigm Intel GE Aviation California Sacramento",

  embeddingHint: "Focus on: firmware to AI journey, technical leadership, 70% adoption rate, 60 engineers trained, enterprise SSD, safety-critical systems, full-stack capabilities"
};