import { GoogleGenAI } from '@google/genai';
import { portfolioData } from './data/portfolio-data';

/**
 * Simplified Gemini Client - Direct approach without over-engineering
 * Builds full context from portfolio data and manages conversation history
 */
export class GeminiClient {
  private ai: GoogleGenAI;
  private model = 'gemini-2.5-flash';
  private conversationHistory: Array<{ role: string; content: string }> = [];

  constructor(apiKey: string) {
    this.ai = new GoogleGenAI({ apiKey });
  }

  /**
   * Send a message to Gemini with full portfolio context
   */
  async sendMessage(userMessage: string): Promise<string> {
    try {
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
          maxOutputTokens: 512,
          temperature: 0.7
        }
      });

      const aiResponse = response.text || 'I apologize, but I encountered an issue generating a response. Please try again.';

      // Update conversation history
      this.conversationHistory.push({ role: 'User', content: userMessage });
      this.conversationHistory.push({ role: 'Assistant', content: aiResponse });

      // Keep only last 20 messages
      if (this.conversationHistory.length > 20) {
        this.conversationHistory = this.conversationHistory.slice(-20);
      }

      return aiResponse;
    } catch (error) {
      console.error('Error calling Gemini API:', error);
      return 'I apologize, but I\'m having trouble connecting right now. Please check your connection and try again.';
    }
  }

  /**
   * Build the complete system prompt with portfolio context
   * Simple approach: include all portfolio data at once
   */
  private buildSystemPrompt(): string {
    const personal = portfolioData.personal;
    const fullName = personal.name.full;
    const firstName = fullName.split(' ')[0];

    // Build comprehensive portfolio context
    const portfolioContext = this.formatPortfolioContext();

    return `You are an AI assistant representing ${fullName}'s professional portfolio.
You're running in a terminal-style interface and should respond in a conversational, technical, yet friendly manner.

Your responses should be:
- Concise and informative (2-4 sentences for simple questions, more detail when asked)
- Technical but accessible
- Formatted for terminal display (no markdown, use plain text)
- Based on ${firstName}'s actual experience and skills

${portfolioContext}

When answering questions:
- Draw from the specific experiences and projects provided above
- Provide concrete examples from the work described
- Be accurate about skills and timeline
- If asked about something not in the background, politely redirect to actual expertise
- You can suggest relevant projects or experiences that might interest the person asking

Remember: You're representing ${firstName} professionally, so maintain a balance between being personable and professional.`;
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