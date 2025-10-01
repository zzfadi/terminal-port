import { GoogleGenAI } from '@google/genai';
import { portfolioData } from './data/portfolio-data';
import { loadSystemPrompt, loadHTMLGenerationPrompt } from './utils/PromptLoader';

/**
 * Simplified Gemini Client - Direct approach without over-engineering
 * Builds full context from portfolio data and manages conversation history
 */
export class GeminiClient {
  private ai: GoogleGenAI;
  private model = 'gemini-flash-latest';
  private conversationHistory: Array<{ role: string; content: string }> = [];

  constructor(apiKey: string) {
    this.ai = new GoogleGenAI({ apiKey });
  }

  /**
   * Detect if user request needs HTML generation
   * Uses keyword-based detection (no AI call) for efficiency
   */
  private shouldGenerateHTML(message: string): boolean {
    const htmlKeywords = [
      'create', 'build', 'make', 'show me',
      'generate', 'design', 'interactive',
      'calculator', 'game', 'chart', 'graph',
      'timeline', 'visualize', 'demo', 'form',
      'widget', 'component', 'animation', 'draw',
      'converter', 'tool', 'app', 'player',
      'timer', 'clock', 'counter', 'progress'
    ];

    const lowerMessage = message.toLowerCase();

    // Check for HTML-related keywords
    const hasHTMLKeyword = htmlKeywords.some(keyword => lowerMessage.includes(keyword));

    // Additional context checks
    const hasInteractiveIntent =
      lowerMessage.includes('how') && (lowerMessage.includes('work') || lowerMessage.includes('look')) ||
      lowerMessage.includes('example of') ||
      lowerMessage.includes('demonstrate');

    return hasHTMLKeyword || hasInteractiveIntent;
  }

  /**
   * Extract HTML requirements from user message
   * Classifies request type and extracts styling preferences
   */
  private extractHTMLRequirements(message: string): {
    requestType: string;
    portfolioColors: string;
  } {
    const lowerMessage = message.toLowerCase();

    // Classify request type based on keywords
    let requestType = 'component';

    if (lowerMessage.match(/calculator|converter|tool|form|input|field/)) {
      requestType = 'interactive';
    } else if (lowerMessage.match(/chart|graph|timeline|visualize|plot|diagram/)) {
      requestType = 'visualization';
    } else if (lowerMessage.match(/demo|example|show|illustrate|how.*work/)) {
      requestType = 'demo';
    } else if (lowerMessage.match(/game|play|snake|tic-tac-toe|puzzle/)) {
      requestType = 'interactive';
    }

    // Portfolio brand colors (from terminal design)
    const portfolioColors = '#00FF41 (primary green), #0a0a0a (background dark), #e0e0e0 (text light)';

    return { requestType, portfolioColors };
  }

  /**
   * Generate HTML using specialized prompt
   * Single AI call with comprehensive HTML generation instructions
   */
  async generateHTMLContent(userMessage: string): Promise<{
    text: string;
    imageData?: string;
    imageMimeType?: string;
  }> {
    try {
      // Extract requirements from user message
      const requirements = this.extractHTMLRequirements(userMessage);

      // Load specialized HTML generation prompt with variables
      const htmlPrompt = loadHTMLGenerationPrompt({
        userRequest: userMessage,
        requestType: requirements.requestType,
        portfolioColors: requirements.portfolioColors
      });

      // Call Gemini API with HTML generation prompt
      const response = await this.ai.models.generateContent({
        model: this.model,
        contents: htmlPrompt,
        config: {
          maxOutputTokens: 8192, // Increased for complex HTML generation
          temperature: 0.3 // Slightly higher for creativity, but still controlled
        }
      });

      const aiResponse = response.text || 'I apologize, but I encountered an issue generating the HTML. Please try again with a more specific request.';

      // Update conversation history (for context in follow-up questions)
      this.conversationHistory.push({ role: 'User', content: userMessage });
      this.conversationHistory.push({ role: 'Assistant', content: aiResponse });

      // Keep only last 20 messages
      if (this.conversationHistory.length > 20) {
        this.conversationHistory = this.conversationHistory.slice(-20);
      }

      return {
        text: aiResponse
      };
    } catch (error) {
      console.error('Error generating HTML:', error);
      return {
        text: 'I apologize, but I encountered an error while generating the HTML. Please try again with a different request.'
      };
    }
  }

  /**
   * Send a message to Gemini with full portfolio context
   * Returns both text and optional image data
   */
  async sendMessage(userMessage: string): Promise<{
    text: string;
    imageData?: string;
    imageMimeType?: string;
  }> {
    try {
      // Check if this request should generate HTML
      if (this.shouldGenerateHTML(userMessage)) {
        return await this.generateHTMLContent(userMessage);
      }

      // Build the complete system prompt with all portfolio context
      const systemPrompt = this.buildSystemPrompt();

      // Format conversation history
      const historyText = this.conversationHistory
        .map(msg => `${msg.role}: ${msg.content}`)
        .join('\n');

      // Assemble the full prompt
      const fullPrompt = historyText
        ? `${systemPrompt}\n\nConversation History:\n${historyText}\n\nUser: ${userMessage}\n\nAssistant: `
        : `${systemPrompt}\n\nUser: ${userMessage}\n\nAssistant: `;

      // Call Gemini API
      const response = await this.ai.models.generateContent({
        model: this.model,
        contents: fullPrompt,
        config: {
          maxOutputTokens: 2048,
          temperature: 0.1
        }
      });

      // Extract text and image data from response
      const parts = response.candidates?.[0]?.content?.parts || [];
      let textContent = '';
      let imageData: string | undefined = undefined;
      let imageMimeType: string | undefined = undefined;

      for (const part of parts) {
        if (part.text) {
          textContent += part.text;
        } else if (part.inlineData) {
          imageData = part.inlineData.data;
          imageMimeType = part.inlineData.mimeType;
        }
      }

      const aiResponse = textContent || response.text || 'I apologize, but I encountered an issue generating a response. Please try again.';

      // Update conversation history (text only)
      this.conversationHistory.push({ role: 'User', content: userMessage });
      this.conversationHistory.push({ role: 'Assistant', content: aiResponse });

      // Keep only last 20 messages
      if (this.conversationHistory.length > 20) {
        this.conversationHistory = this.conversationHistory.slice(-20);
      }

      return {
        text: aiResponse,
        imageData,
        imageMimeType
      };
    } catch (error) {
      console.error('Error calling Gemini API:', error);
      return {
        text: 'I apologize, but I\'m having trouble connecting right now. Please check your connection and try again.'
      };
    }
  }

  /**
   * Build the complete system prompt with portfolio context
   * Now uses externalized prompts from markdown files
   */
  private buildSystemPrompt(): string {
    const personal = portfolioData.personal;
    const fullName = personal.name.full;
    const firstName = fullName.split(' ')[0];

    // Build comprehensive portfolio context
    const portfolioContext = this.formatPortfolioContext();

    // Load system prompt from markdown file and process variables
    return loadSystemPrompt({
      fullName,
      firstName,
      portfolioContext
    });
  }

  /**
   * Format all portfolio data into a comprehensive context string
   */
  private formatPortfolioContext(): string {
    const data = portfolioData;
    let context = '';

    // Personal Information
    context += `## Personal Information\n`;
    context += `Name: ${data.personal.name.full}\n`;
    context += `Title: ${data.personal.title}\n`;
    context += `Location: ${data.personal.location.city}, ${data.personal.location.state}\n`;
    context += `Email: ${data.personal.contact.email}\n`;
    context += `LinkedIn: ${data.personal.contact.linkedin}\n`;
    context += `GitHub: ${data.personal.contact.github}\n`;
    context += `Website: ${data.personal.contact.website}\n\n`;

    // Professional Summary
    context += `## Professional Summary\n`;
    context += `${data.professional.summary}\n`;
    context += `Years of Experience: ${data.professional.yearsExperience}\n`;
    context += `Current Employer: ${data.professional.currentEmployer}\n\n`;

    // Education
    context += `## Education\n`;
    context += `${data.education.degree} in ${data.education.major}\n`;
    context += `${data.education.university}\n`;
    context += `Graduated: ${data.education.graduationYear}\n`;
    context += `GPA: ${data.education.gpa}/${data.education.gpaScale}\n`;
    if (data.education.honors && data.education.honors.length > 0) {
      context += `Honors: ${data.education.honors.join(', ')}\n`;
    }
    if (data.education.relevantCoursework && data.education.relevantCoursework.length > 0) {
      context += `Relevant Coursework: ${data.education.relevantCoursework.join(', ')}\n`;
    }
    context += '\n';

    // Experience
    context += `## Work Experience\n`;
    data.experience.forEach(exp => {
      context += `\n### ${exp.company} (${exp.location.city}, ${exp.location.state})\n`;
      exp.positions.forEach(pos => {
        context += `**${pos.title}** (${pos.period})\n`;
        context += `Responsibilities:\n`;
        pos.responsibilities.forEach(resp => {
          context += `- ${resp}\n`;
        });
        if (pos.achievements && pos.achievements.length > 0) {
          context += `Key Achievements:\n`;
          pos.achievements.forEach(ach => {
            const metric = 'metric' in ach && ach.metric ? ` (${ach.metric})` : '';
            context += `- ${ach.description}${metric}: ${ach.impact}\n`;
          });
        }
      });
    });
    context += '\n';

    // Skills
    context += `## Technical Skills\n`;
    const skills = data.skills.technical;

    context += `Programming Languages:\n`;
    context += `- Expert: ${skills.programmingLanguages.expert.join(', ')}\n`;
    context += `- Proficient: ${skills.programmingLanguages.proficient.join(', ')}\n`;
    context += `- Familiar: ${skills.programmingLanguages.familiar.join(', ')}\n\n`;

    context += `Firmware & Embedded:\n`;
    context += `- Protocols: ${skills.firmwareEmbedded.protocols.join(', ')}\n`;
    context += `- Platforms: ${skills.firmwareEmbedded.platforms.join(', ')}\n`;
    context += `- Tools: ${skills.firmwareEmbedded.tools.join(', ')}\n\n`;

    context += `AI/ML:\n`;
    context += `- LLMs: ${skills.aiMl.llms.join(', ')}\n`;
    context += `- Frameworks: ${skills.aiMl.frameworks.join(', ')}\n`;
    context += `- Techniques: ${skills.aiMl.techniques.join(', ')}\n\n`;

    context += `Full Stack:\n`;
    context += `- Frontend: ${skills.fullStack.frontend.join(', ')}\n`;
    context += `- Backend: ${skills.fullStack.backend.join(', ')}\n`;
    context += `- Cloud: ${skills.fullStack.cloud.join(', ')}\n\n`;

    // AI Initiatives
    context += `## AI Leadership & Initiatives\n`;
    data.aiInitiatives.majorProjects.forEach(proj => {
      context += `\n### ${proj.name}\n`;
      context += `${proj.description}\n`;
      if (proj.impact) context += `Impact: ${proj.impact}\n`;
      if (proj.status) context += `Status: ${proj.status}\n`;
    });
    context += '\n';

    // Projects
    context += `## Projects\n`;
    context += `Professional Projects:\n`;
    data.projects.professional.forEach(proj => {
      context += `- **${proj.name}** (${proj.status}): ${proj.description}\n`;
      if (proj.impact) context += `  Impact: ${proj.impact}\n`;
    });
    context += `\nPersonal Projects:\n`;
    data.projects.personal.forEach(proj => {
      context += `- **${proj.name}** (${proj.status}): ${proj.description}\n`;
      if (proj.url) context += `  URL: ${proj.url}\n`;
    });
    context += '\n';

    // Achievements
    context += `## Key Achievements\n`;
    data.achievements.quantified.forEach(ach => {
      context += `- ${ach.metric}: ${ach.value}${ach.unit ? ` ${ach.unit}` : ''}${ach.context ? ` (${ach.context})` : ''}\n`;
    });
    context += '\n';

    // Vision
    context += `## Vision & Availability\n`;
    context += `${data.visionAndAvailability.visionStatement}\n`;
    context += `Status: ${data.visionAndAvailability.availability.status}\n`;
    context += `Interests: ${data.visionAndAvailability.availability.preferences.join(', ')}\n\n`;

    return context;
  }

  /**
   * Clear conversation history
   */
  clearHistory(): void {
    this.conversationHistory = [];
  }
}