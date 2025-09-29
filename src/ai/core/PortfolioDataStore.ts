/**
 * Unified Portfolio Data Store
 * Central source of truth for all portfolio data across V1/V2
 * Supports versioning, validation, and synchronization
 */

import { portfolioData } from '../../data/portfolio-data';

export interface PortfolioMetadata {
  version: string;
  lastUpdated: string;
  schemaVersion: string;
  dataClassification: string;
  tags: string[];
  confidence: number;
}

export interface PersonalInfo {
  fullName: string;
  displayName: string;
  title: string;
  location: {
    city: string;
    state: string;
    country: string;
  };
  contact: {
    email: string;
    website: string;
    linkedin: string;
    github: string;
    portfolio?: string;
  };
  languages: Array<{
    name: string;
    proficiency: string;
  }>;
}

export interface ExperienceItem {
  id: string;
  company: string;
  title: string;
  location: string;
  startDate: string;
  endDate: string | null;
  current: boolean;
  responsibilities: string[];
  achievements: Array<{
    description: string;
    metric?: string | number;
    impact: string;
  }>;
  tags: string[];
  keyMetrics?: {
    [key: string]: number | string;
  };
}

export interface SkillCategory {
  name: string;
  skills: Array<{
    name: string;
    level: 'expert' | 'proficient' | 'familiar';
    years?: number;
  }>;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  status: 'production' | 'deployed' | 'in-development' | 'development';
  type: 'professional' | 'personal';
  technologies: string[];
  impact?: string;
  url?: string;
  metrics?: {
    [key: string]: number | string;
  };
  tags: string[];
}

export interface Achievement {
  type: 'quantified' | 'recognition';
  metric?: string;
  value?: number | string;
  unit?: string;
  context?: string;
  description?: string;
}

export interface PortfolioSection {
  id: string;
  title: string;
  content: string;
  metadata?: {
    lastUpdated?: string;
    relevance?: number;
    tokens?: number;
  };
}

export class PortfolioDataStore {
  private static instance: PortfolioDataStore;
  private metadata!: PortfolioMetadata;
  private personal!: PersonalInfo;
  private experience!: ExperienceItem[];
  private skills!: SkillCategory[];
  private projects!: Project[];
  private achievements!: Achievement[];
  private sections: Map<string, PortfolioSection>;
  private searchableText!: string;
  private embeddingHints!: string[];
  private lastSync: Date;

  private constructor() {
    this.sections = new Map();
    this.lastSync = new Date();
    this.loadData();
  }

  static getInstance(): PortfolioDataStore {
    if (!PortfolioDataStore.instance) {
      PortfolioDataStore.instance = new PortfolioDataStore();
    }
    return PortfolioDataStore.instance;
  }

  private loadData(): void {
    // Load from consolidated data source
    this.metadata = {
      version: portfolioData.metadata.version,
      lastUpdated: portfolioData.metadata.lastUpdated,
      schemaVersion: portfolioData.metadata.schemaVersion,
      dataClassification: portfolioData.metadata.dataClassification,
      tags: portfolioData.metadata.tags,
      confidence: portfolioData.metadata.confidence
    };

    this.personal = {
      fullName: portfolioData.personal.name.full,
      displayName: portfolioData.personal.name.display,
      title: portfolioData.personal.title,
      location: portfolioData.personal.location,
      contact: portfolioData.personal.contact,
      languages: portfolioData.personal.languages
    };

    this.experience = this.mergeExperience();
    this.skills = this.organizeSkills();
    this.projects = this.mergeProjects();
    this.achievements = this.mergeAchievements();
    this.searchableText = this.generateSearchableText();
    this.embeddingHints = this.generateEmbeddingHints();
    this.buildSections();
  }

  private mergeExperience(): ExperienceItem[] {
    const experiences: ExperienceItem[] = [];

    // Load from consolidated data source
    portfolioData.experience.forEach(exp => {
      exp.positions.forEach(pos => {
        experiences.push({
          id: exp.id || `${exp.company.toLowerCase().replace(/\s+/g, '-')}-${pos.title.toLowerCase().replace(/\s+/g, '-')}`,
          company: exp.company,
          title: pos.title,
          location: `${exp.location.city}, ${exp.location.state}`,
          startDate: pos.period.split(' to ')[0],
          endDate: pos.period.includes('present') ? null : pos.period.split(' to ')[1],
          current: pos.current || pos.period.includes('present'),
          responsibilities: pos.responsibilities,
          achievements: pos.achievements,
          tags: pos.tags || [],
          keyMetrics: pos.keyMetrics
        });
      });
    });

    return experiences;
  }

  private organizeSkills(): SkillCategory[] {
    const categories: SkillCategory[] = [];
    const skillData = portfolioData.skills.technical;

    // Programming Languages
    categories.push({
      name: 'Programming Languages',
      skills: [
        ...skillData.programmingLanguages.expert.map(s => ({ name: s, level: 'expert' as const })),
        ...skillData.programmingLanguages.proficient.map(s => ({ name: s, level: 'proficient' as const })),
        ...skillData.programmingLanguages.familiar.map(s => ({ name: s, level: 'familiar' as const }))
      ]
    });

    // Firmware & Embedded
    categories.push({
      name: 'Firmware & Embedded',
      skills: [
        ...skillData.firmwareEmbedded.protocols.map(s => ({ name: s, level: 'expert' as const })),
        ...skillData.firmwareEmbedded.platforms.map(s => ({ name: s, level: 'expert' as const }))
      ]
    });

    // AI/ML
    categories.push({
      name: 'AI & Machine Learning',
      skills: [
        ...skillData.aiMl.llms.map(s => ({ name: s, level: 'expert' as const })),
        ...skillData.aiMl.frameworks.map(s => ({ name: s, level: 'proficient' as const })),
        ...skillData.aiMl.techniques.map(s => ({ name: s, level: 'proficient' as const }))
      ]
    });

    // Full Stack
    categories.push({
      name: 'Full Stack Development',
      skills: [
        ...skillData.fullStack.frontend.map(s => ({ name: s, level: 'proficient' as const })),
        ...skillData.fullStack.backend.map(s => ({ name: s, level: 'proficient' as const })),
        ...skillData.fullStack.cloud.map(s => ({ name: s, level: 'familiar' as const }))
      ]
    });

    // Add years of experience from top skills
    const topSkills = portfolioData.skills.topSkills;
    categories.forEach(cat => {
      cat.skills.forEach(skill => {
        const match = topSkills.find(ts => ts.name.includes(skill.name));
        if (match) {
          skill.years = match.years;
        }
      });
    });

    return categories;
  }

  private mergeProjects(): Project[] {
    const projects: Project[] = [];

    // Professional projects
    portfolioData.projects.professional.forEach(proj => {
      projects.push({
        id: proj.id || proj.name.toLowerCase().replace(/\s+/g, '-'),
        name: proj.name,
        description: proj.description,
        status: (proj.status || 'in-development').toLowerCase().replace(' ', '-') as any,
        type: 'professional',
        technologies: proj.technologies || proj.deliverables || [],
        impact: proj.impact,
        metrics: proj.metrics,
        tags: proj.tags || []
      });
    });

    // Personal projects
    portfolioData.projects.personal.forEach(proj => {
      projects.push({
        id: proj.id || proj.name.toLowerCase().replace(/\s+/g, '-'),
        name: proj.name,
        description: proj.description,
        status: (proj.status || 'development').toLowerCase() as any,
        type: 'personal',
        technologies: proj.technologies || [],
        url: proj.url,
        tags: proj.tags || []
      });
    });

    return projects;
  }

  private mergeAchievements(): Achievement[] {
    const achievements: Achievement[] = [];

    // Quantified achievements
    portfolioData.achievements.quantified.forEach(ach => {
      achievements.push({
        type: 'quantified',
        metric: ach.metric,
        value: ach.value,
        unit: ach.unit,
        context: ach.context
      });
    });

    // Recognition achievements
    portfolioData.achievements.recognition.forEach(rec => {
      achievements.push({
        type: 'recognition',
        description: rec
      });
    });

    return achievements;
  }

  private generateSearchableText(): string {
    const parts = [
      this.personal.fullName,
      this.personal.title,
      ...this.experience.map(e => `${e.company} ${e.title}`),
      ...this.skills.flatMap(c => c.skills.map(s => s.name)),
      ...this.projects.map(p => `${p.name} ${p.description}`),
      portfolioData.visionAndAvailability.visionStatement
    ];
    return parts.join(' ');
  }

  private generateEmbeddingHints(): string[] {
    return [
      'firmware to AI journey',
      'technical leadership',
      '70% adoption rate',
      '60 engineers trained',
      'enterprise SSD',
      'safety-critical systems',
      'full-stack capabilities',
      portfolioData.embeddingHint
    ];
  }

  private buildSections(): void {
    // Build semantic sections for retrieval
    this.sections.set('overview', {
      id: 'overview',
      title: 'Professional Overview',
      content: this.formatOverview(),
      metadata: {
        relevance: 1.0,
        tokens: 200
      }
    });

    this.sections.set('experience', {
      id: 'experience',
      title: 'Work Experience',
      content: this.formatExperience(),
      metadata: {
        relevance: 0.9,
        tokens: 800
      }
    });

    this.sections.set('skills', {
      id: 'skills',
      title: 'Technical Skills',
      content: this.formatSkills(),
      metadata: {
        relevance: 0.8,
        tokens: 400
      }
    });

    this.sections.set('projects', {
      id: 'projects',
      title: 'Projects',
      content: this.formatProjects(),
      metadata: {
        relevance: 0.85,
        tokens: 600
      }
    });

    this.sections.set('achievements', {
      id: 'achievements',
      title: 'Achievements',
      content: this.formatAchievements(),
      metadata: {
        relevance: 0.75,
        tokens: 300
      }
    });

    this.sections.set('vision', {
      id: 'vision',
      title: 'Vision Statement',
      content: portfolioData.visionAndAvailability.visionStatement,
      metadata: {
        relevance: 0.7,
        tokens: 150
      }
    });

    // Add extended rich sections
    this.sections.set('ai_leadership', {
      id: 'ai_leadership',
      title: 'AI Leadership & Transformation',
      content: this.formatAILeadership(),
      metadata: {
        relevance: 0.95,
        tokens: 500
      }
    });

    this.sections.set('technical_leadership', {
      id: 'technical_leadership',
      title: 'Technical Product Leadership',
      content: this.formatTechnicalLeadership(),
      metadata: {
        relevance: 0.85,
        tokens: 400
      }
    });

    this.sections.set('learning_development', {
      id: 'learning_development',
      title: 'Continuous Learning & Development',
      content: this.formatLearningDevelopment(),
      metadata: {
        relevance: 0.7,
        tokens: 300
      }
    });

    this.sections.set('career_progression', {
      id: 'career_progression',
      title: 'Career Growth Narrative',
      content: this.formatCareerProgression(),
      metadata: {
        relevance: 0.75,
        tokens: 350
      }
    });

    this.sections.set('context_prompts', {
      id: 'context_prompts',
      title: 'Context-Specific Information',
      content: this.formatContextPrompts(),
      metadata: {
        relevance: 0.8,
        tokens: 400
      }
    });
  }

  // Formatting methods for different contexts
  private formatOverview(): string {
    const extended = portfolioData.professional.summary;
    const base = `${this.personal.fullName} is a ${this.personal.title} based in ${this.personal.location.city}, ${this.personal.location.state}. With ${portfolioData.professional.yearsExperience} years of experience, specializing in ${portfolioData.professional.specializations.primary.join(', ')}. Currently ${portfolioData.visionAndAvailability.availability.status.toLowerCase()} for ${portfolioData.visionAndAvailability.availability.preferences.join(', ')}.`;
    return `${extended}\n\n${base}`;
  }

  private formatExperience(): string {
    return this.experience.map(exp => {
      const achievements = exp.achievements.map(a => `- ${a.description}: ${a.impact}`).join('\n');
      return `${exp.title} at ${exp.company} (${exp.startDate} - ${exp.endDate || 'Present'})\n${exp.responsibilities.join('\n')}\nKey Achievements:\n${achievements}`;
    }).join('\n\n');
  }

  private formatSkills(): string {
    return this.skills.map(cat => {
      const skills = cat.skills.map(s => `${s.name} (${s.level}${s.years ? `, ${s.years} years` : ''})`).join(', ');
      return `${cat.name}: ${skills}`;
    }).join('\n');
  }

  private formatProjects(): string {
    return this.projects.map(proj => {
      const tech = proj.technologies.join(', ');
      return `${proj.name} (${proj.status}): ${proj.description}\nTechnologies: ${tech}${proj.impact ? `\nImpact: ${proj.impact}` : ''}`;
    }).join('\n\n');
  }

  private formatAchievements(): string {
    const quantified = this.achievements
      .filter(a => a.type === 'quantified')
      .map(a => `- ${a.metric}: ${a.value}${a.unit ? ` ${a.unit}` : ''}${a.context ? ` (${a.context})` : ''}`);

    const recognition = this.achievements
      .filter(a => a.type === 'recognition')
      .map(a => `- ${a.description}`);

    return `Quantified Results:\n${quantified.join('\n')}\n\nRecognition:\n${recognition.join('\n')}`;
  }

  // New formatting methods for extended content
  private formatAILeadership(): string {
    const initiatives = portfolioData.aiInitiatives.majorProjects;
    const role = portfolioData.aiInitiatives.championRole;

    let content = `AI Flow Engineer & AI Champion (2024-Present)\n\n`;
    content += `Responsibilities:\n${role.responsibilities.map(r => `- ${r}`).join('\n')}\n\n`;
    content += `Major AI Initiatives:\n`;

    initiatives.forEach(init => {
      content += `\n${init.name}:\n`;
      content += `- ${init.description}\n`;
      if (init.impact) content += `- Impact: ${init.impact}\n`;
      if (init.status) content += `- Status: ${init.status}\n`;
    });

    content += `\nEnablement Activities:\n${role.enablementActivities.slice(0, 5).map(a => `- ${a}`).join('\n')}`;

    return content;
  }

  private formatTechnicalLeadership(): string {
    const lead = portfolioData.professional.keyRoles.technicalProductLead;

    let content = `Technical Product Lead - ${lead.project} (${lead.period})\n\n`;
    content += `Key Achievements:\n`;
    content += lead.achievements.map(a => `- ${a}`).join('\n');
    content += `\n\nThis role demonstrated ability to manage complex technical programs, coordinate cross-company teams, and deliver enterprise-grade products on schedule.`;

    return content;
  }

  private formatLearningDevelopment(): string {
    const learning = portfolioData.continuousLearning;

    let content = `Learning Philosophy: ${learning.philosophy}\n\n`;
    content += `Approach:\n${learning.approach.map(a => `- ${a}`).join('\n')}\n\n`;
    content += `Recent Achievements:\n${learning.recentAchievements.map(a => `- ${a}`).join('\n')}\n\n`;
    content += `Certifications:\n`;
    content += `Completed: ${learning.certifications.completed.join(', ')}\n`;
    content += `In Progress: ${learning.certifications.inProgress.join(', ')}`;

    return content;
  }

  private formatCareerProgression(): string {
    const progression = portfolioData.careerProgression;

    let content = `Career Journey:\n\n`;
    progression.timeline.forEach(stage => {
      content += `${stage.period}: ${stage.role} at ${stage.company}\n`;
      content += `Focus: ${stage.focus}\n\n`;
    });

    content += `Growth Narrative: ${progression.growthNarrative}`;

    return content;
  }

  private formatContextPrompts(): string {
    const prompts = portfolioData.contextPrompts;

    let content = `Context-Specific Summaries:\n\n`;
    content += `Elevator Pitch: ${prompts.elevatorPitch}\n\n`;
    content += `Technical Summary: ${prompts.technicalSummary}\n\n`;
    content += `Leadership Summary: ${prompts.leadershipSummary}\n\n`;

    Object.entries(prompts.scenarioSpecific).forEach(([scenario, description]) => {
      const title = scenario.replace(/([A-Z])/g, ' $1').trim();
      content += `For ${title}: ${description}\n\n`;
    });

    return content;
  }

  // Public API methods
  public getMetadata(): PortfolioMetadata {
    return { ...this.metadata };
  }

  public getPersonalInfo(): PersonalInfo {
    return { ...this.personal };
  }

  public getExperience(): ExperienceItem[] {
    return [...this.experience];
  }

  public getSkills(): SkillCategory[] {
    return [...this.skills];
  }

  public getProjects(): Project[] {
    return [...this.projects];
  }

  public getAchievements(): Achievement[] {
    return [...this.achievements];
  }

  public getSection(id: string): PortfolioSection | undefined {
    return this.sections.get(id);
  }

  public getAllSections(): PortfolioSection[] {
    return Array.from(this.sections.values());
  }

  public getSearchableText(): string {
    return this.searchableText;
  }

  public getEmbeddingHints(): string[] {
    return [...this.embeddingHints];
  }

  // Context generation for AI
  public generateFullContext(): string {
    return Array.from(this.sections.values())
      .map(s => `## ${s.title}\n${s.content}`)
      .join('\n\n');
  }

  public generateSummaryContext(): string {
    return this.sections.get('overview')?.content || '';
  }

  public generateContextForQuery(query: string, maxTokens: number = 1000): string {
    // This will be enhanced with semantic matching in the next phase
    const relevantSections = this.findRelevantSections(query);
    let context = '';
    let tokens = 0;

    for (const section of relevantSections) {
      if (tokens + (section.metadata?.tokens || 0) <= maxTokens) {
        context += `## ${section.title}\n${section.content}\n\n`;
        tokens += section.metadata?.tokens || 0;
      }
    }

    return context;
  }

  private findRelevantSections(query: string): PortfolioSection[] {
    const queryLower = query.toLowerCase();
    const sections = Array.from(this.sections.values());

    // Simple keyword matching for now (will be replaced with embeddings)
    return sections
      .filter(s => s.content.toLowerCase().includes(queryLower) ||
                   s.title.toLowerCase().includes(queryLower))
      .sort((a, b) => (b.metadata?.relevance || 0) - (a.metadata?.relevance || 0));
  }

  // Synchronization methods
  public validateDataConsistency(): boolean {
    // Check that all required fields are present
    const hasRequiredFields =
      this.personal &&
      this.experience.length > 0 &&
      this.skills.length > 0;

    return hasRequiredFields;
  }

  public getLastSyncTime(): Date {
    return this.lastSync;
  }

  public refreshData(): void {
    this.loadData();
    this.lastSync = new Date();
  }

  // Export for V1 compatibility
  public exportForV1Terminal(): any {
    return {
      name: this.personal.fullName,
      title: this.personal.title,
      email: this.personal.contact.email,
      linkedin: this.personal.contact.linkedin,
      github: this.personal.contact.github,
      experience: this.experience.map(e => ({
        company: e.company,
        position: e.title,
        duration: `${e.startDate} - ${e.endDate || 'Present'}`,
        description: e.responsibilities.join(' '),
        achievements: e.achievements.map(a => a.description)
      })),
      skills: Object.fromEntries(
        this.skills.map(cat => [
          cat.name.toLowerCase().replace(/\s+/g, '_'),
          cat.skills.map(s => s.name)
        ])
      ),
      projects: this.projects.map(p => ({
        name: p.name,
        description: p.description,
        technologies: p.technologies,
        link: p.url
      }))
    };
  }
}

// Singleton export
export const portfolioStore = PortfolioDataStore.getInstance();