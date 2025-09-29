import { GoogleGenAI } from '@google/genai';
import { contextBuilder } from './ai/core/ContextBuilder';
import { portfolioStore } from './ai/core/PortfolioDataStore';

export class GeminiClient {
  private ai: GoogleGenAI;
  private model = 'gemini-2.5-flash';
  private conversationHistory: Array<{ role: string; content: string }> = [];
  private lastContextResult: { tokens: number; sections: string[] } | null = null;

  constructor(apiKey: string) {
    this.ai = new GoogleGenAI({ apiKey });
  }

  async sendMessage(userMessage: string): Promise<string> {
    try {
      // Build optimized context based on query
      const contextResult = await contextBuilder.buildContext(userMessage, {
        maxTokens: 1500, // Leave room for conversation history and response
        provider: 'gemini'
      });

      // Get personal info for system prompt
      const personalInfo = portfolioStore.getPersonalInfo();

      // Build the system context with optimized portfolio data
      const systemContext = `
You are an AI assistant representing ${personalInfo.fullName}'s professional portfolio.
You're running in a terminal-style interface and should respond in a conversational, technical, yet friendly manner.

Your responses should be:
- Concise and informative (2-4 sentences for simple questions, more detail when asked)
- Technical but accessible
- Formatted for terminal display (no markdown, use plain text)
- Based on ${personalInfo.fullName.split(' ')[0]}'s actual experience and skills

${contextResult.context}

When answering questions:
- Draw from the specific experiences and projects provided above
- Provide concrete examples from the work described
- Be accurate about skills and timeline
- If asked about something not in the background, politely redirect to actual expertise
- You can suggest relevant projects or experiences that might interest the person asking

Remember: You're representing ${personalInfo.fullName.split(' ')[0]} professionally, so maintain a balance between being personable and professional.`;

      // Store context stats for debugging
      this.lastContextResult = {
        tokens: contextResult.tokens,
        sections: contextResult.sections
      };

      // Log optimization metrics in dev mode
      if (import.meta.env.DEV) {
        console.log(`Context optimization: ${contextResult.tokens} tokens, sections: ${contextResult.sections.join(', ')}, cached: ${contextResult.cached}`);
      }

      // Create the full prompt with conversation history
      const fullPrompt = `${systemContext}\n\nConversation History:\n${this.conversationHistory.map(msg => `${msg.role}: ${msg.content}`).join('\n')}\n\nUser: ${userMessage}\n\nAssistant: `;

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

      // Keep only last 10 exchanges to prevent context overflow
      if (this.conversationHistory.length > 20) {
        this.conversationHistory = this.conversationHistory.slice(-20);
      }

      return aiResponse;
    } catch (error) {
      console.error('Error calling Gemini API:', error);
      return 'I apologize, but I\'m having trouble connecting right now. Please check your connection and try again.';
    }
  }

  clearHistory(): void {
    this.conversationHistory = [];
    // Also clear context cache when clearing history
    contextBuilder.clearCache();
  }

  getContextStats(): { tokens: number; sections: string[] } | null {
    return this.lastContextResult;
  }
}