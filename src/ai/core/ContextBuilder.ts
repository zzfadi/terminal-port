/**
 * Context Builder - Dynamic Context Assembly with Caching
 * Optimizes token usage by selecting relevant portfolio sections
 */

import { portfolioStore } from './PortfolioDataStore';

export interface ContextOptions {
  maxTokens?: number;
  includeHistory?: boolean;
  forceRefresh?: boolean;
  provider?: 'gemini' | 'openai' | 'anthropic';
}

export interface ContextResult {
  context: string;
  tokens: number;
  sections: string[];
  cached: boolean;
}

export class ContextBuilder {
  private static instance: ContextBuilder;
  private contextCache: Map<string, { context: string; timestamp: number; tokens: number }>;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly DEFAULT_MAX_TOKENS = 1000;
  private readonly TOKENS_PER_CHAR = 0.25; // Approximate ratio

  private constructor() {
    this.contextCache = new Map();
  }

  static getInstance(): ContextBuilder {
    if (!ContextBuilder.instance) {
      ContextBuilder.instance = new ContextBuilder();
    }
    return ContextBuilder.instance;
  }

  /**
   * Build optimized context based on query
   */
  public async buildContext(
    query: string,
    options: ContextOptions = {}
  ): Promise<ContextResult> {
    const {
      maxTokens = this.DEFAULT_MAX_TOKENS,
      forceRefresh = false,
      provider = 'gemini'
    } = options;

    // Check cache
    const cacheKey = this.getCacheKey(query, provider);
    if (!forceRefresh) {
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        return {
          context: cached.context,
          tokens: cached.tokens,
          sections: this.extractSections(cached.context),
          cached: true
        };
      }
    }

    // Classify query intent
    const queryType = this.classifyQuery(query);

    // Select relevant sections
    const relevantSections = this.selectRelevantSections(queryType, query);

    // Build context within token budget
    const context = this.assembleContext(relevantSections, maxTokens, provider);

    // Estimate tokens
    const tokens = this.estimateTokens(context);

    // Cache the result
    this.cacheContext(cacheKey, context, tokens);

    return {
      context,
      tokens,
      sections: relevantSections.map(s => s.id),
      cached: false
    };
  }

  /**
   * Get full context (no optimization)
   */
  public getFullContext(): ContextResult {
    const context = portfolioStore.generateFullContext();
    const tokens = this.estimateTokens(context);

    return {
      context,
      tokens,
      sections: portfolioStore.getAllSections().map(s => s.id),
      cached: false
    };
  }

  /**
   * Get summary context (minimal)
   */
  public getSummaryContext(): ContextResult {
    const context = portfolioStore.generateSummaryContext();
    const tokens = this.estimateTokens(context);

    return {
      context,
      tokens,
      sections: ['overview'],
      cached: false
    };
  }

  /**
   * Classify query into intent categories
   */
  private classifyQuery(query: string): string {
    const queryLower = query.toLowerCase();

    // Experience queries
    if (this.containsAny(queryLower, ['experience', 'work', 'job', 'career', 'company', 'role', 'position'])) {
      return 'experience';
    }

    // Skills queries
    if (this.containsAny(queryLower, ['skill', 'technology', 'language', 'framework', 'tool', 'expertise'])) {
      return 'skills';
    }

    // Project queries
    if (this.containsAny(queryLower, ['project', 'built', 'created', 'developed', 'portfolio', 'github'])) {
      return 'projects';
    }

    // Achievement queries
    if (this.containsAny(queryLower, ['achievement', 'accomplishment', 'metric', 'result', 'impact', 'success'])) {
      return 'achievements';
    }

    // AI/ML queries
    if (this.containsAny(queryLower, ['ai', 'ml', 'machine learning', 'llm', 'gpt', 'claude', 'gemini', 'artificial intelligence'])) {
      return 'ai_expertise';
    }

    // Contact queries
    if (this.containsAny(queryLower, ['contact', 'email', 'linkedin', 'reach', 'connect', 'hire'])) {
      return 'contact';
    }

    // Education queries
    if (this.containsAny(queryLower, ['education', 'degree', 'university', 'school', 'study', 'major'])) {
      return 'education';
    }

    // General/Overview
    return 'general';
  }

  /**
   * Select relevant portfolio sections based on query type
   */
  private selectRelevantSections(queryType: string, _query: string) {
    const sections = portfolioStore.getAllSections();
    const relevantSections = [];

    // Always include overview for context
    const overview = sections.find(s => s.id === 'overview');
    if (overview) relevantSections.push(overview);

    switch (queryType) {
      case 'experience':
        relevantSections.push(...sections.filter(s => s.id === 'experience' || s.id === 'achievements'));
        break;

      case 'skills':
        relevantSections.push(...sections.filter(s => s.id === 'skills' || s.id === 'projects'));
        break;

      case 'projects':
        relevantSections.push(...sections.filter(s => s.id === 'projects' || s.id === 'skills'));
        break;

      case 'achievements':
        relevantSections.push(...sections.filter(s => s.id === 'achievements' || s.id === 'experience'));
        break;

      case 'ai_expertise':
        // For AI queries, prioritize AI-related content
        const skills = sections.find(s => s.id === 'skills');
        const projects = sections.find(s => s.id === 'projects');
        const experience = sections.find(s => s.id === 'experience');
        if (skills) relevantSections.push(skills);
        if (projects) relevantSections.push(projects);
        if (experience) relevantSections.push(experience);
        break;

      case 'contact':
        // Just overview has contact info
        break;

      case 'education':
        // Education is in overview, add skills for coursework context
        relevantSections.push(...sections.filter(s => s.id === 'skills'));
        break;

      case 'general':
      default:
        // For general queries, include top sections by relevance
        relevantSections.push(
          ...sections
            .filter(s => s.id !== 'overview') // Already included
            .sort((a, b) => (b.metadata?.relevance || 0) - (a.metadata?.relevance || 0))
            .slice(0, 3)
        );
        break;
    }

    // Remove duplicates while preserving order
    const seen = new Set<string>();
    return relevantSections.filter(section => {
      if (seen.has(section.id)) return false;
      seen.add(section.id);
      return true;
    });
  }

  /**
   * Assemble context from sections within token budget
   */
  private assembleContext(sections: any[], maxTokens: number, provider: string): string {
    const personalInfo = portfolioStore.getPersonalInfo();
    let context = '';
    let currentTokens = 0;

    // Provider-specific formatting
    const formatSection = (section: any) => {
      switch (provider) {
        case 'openai':
        case 'anthropic':
          return `### ${section.title}\n${section.content}\n\n`;
        case 'gemini':
        default:
          return `## ${section.title}\n${section.content}\n\n`;
      }
    };

    // System prompt header
    context = `You are an AI assistant representing ${personalInfo.fullName}'s professional portfolio.\n`;
    context += `Current role: ${personalInfo.title}\n`;
    context += `Location: ${personalInfo.location.city}, ${personalInfo.location.state}\n\n`;
    currentTokens = this.estimateTokens(context);

    // Add sections within budget
    for (const section of sections) {
      const sectionText = formatSection(section);
      const sectionTokens = this.estimateTokens(sectionText);

      if (currentTokens + sectionTokens <= maxTokens) {
        context += sectionText;
        currentTokens += sectionTokens;
      } else {
        // Try to fit a summary if we're over budget
        const summaryText = `${section.title}: [Content truncated for brevity]\n`;
        const summaryTokens = this.estimateTokens(summaryText);
        if (currentTokens + summaryTokens <= maxTokens) {
          context += summaryText;
          currentTokens += summaryTokens;
        }
        break;
      }
    }

    return context.trim();
  }

  /**
   * Cache management
   */
  private getCacheKey(query: string, provider: string): string {
    // Simple hash for cache key
    const queryHash = query.split('').reduce((hash, char) => {
      return ((hash << 5) - hash) + char.charCodeAt(0);
    }, 0).toString(36);
    return `${provider}-${queryHash}`;
  }

  private getFromCache(key: string): { context: string; tokens: number } | null {
    const cached = this.contextCache.get(key);
    if (!cached) return null;

    const now = Date.now();
    if (now - cached.timestamp > this.CACHE_TTL) {
      this.contextCache.delete(key);
      return null;
    }

    return { context: cached.context, tokens: cached.tokens };
  }

  private cacheContext(key: string, context: string, tokens: number): void {
    this.contextCache.set(key, {
      context,
      tokens,
      timestamp: Date.now()
    });

    // Clean up old cache entries
    this.cleanupCache();
  }

  private cleanupCache(): void {
    const now = Date.now();
    for (const [key, value] of this.contextCache.entries()) {
      if (now - value.timestamp > this.CACHE_TTL) {
        this.contextCache.delete(key);
      }
    }
  }

  /**
   * Utility methods
   */
  private containsAny(text: string, keywords: string[]): boolean {
    return keywords.some(keyword => text.includes(keyword));
  }

  private estimateTokens(text: string): number {
    // Simple estimation: ~4 characters per token on average
    return Math.ceil(text.length * this.TOKENS_PER_CHAR);
  }

  private extractSections(context: string): string[] {
    const sections: string[] = [];
    const sectionRegex = /##?\s+([^\n]+)/g;
    let match;
    while ((match = sectionRegex.exec(context)) !== null) {
      sections.push(match[1].toLowerCase().replace(/\s+/g, '-'));
    }
    return sections;
  }

  /**
   * Clear all cached contexts
   */
  public clearCache(): void {
    this.contextCache.clear();
  }

  /**
   * Get cache statistics
   */
  public getCacheStats(): { size: number; entries: number } {
    let totalSize = 0;
    for (const value of this.contextCache.values()) {
      totalSize += value.context.length;
    }

    return {
      size: totalSize,
      entries: this.contextCache.size
    };
  }
}

// Singleton export
export const contextBuilder = ContextBuilder.getInstance();