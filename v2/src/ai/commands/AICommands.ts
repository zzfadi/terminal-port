/**
 * Simplified AI Terminal Commands
 * Handles natural language chat with Gemini
 */

import { GeminiClient } from '../../GeminiClient';
import { contextBuilder } from '../core/ContextBuilder';

export interface CommandResult {
  success: boolean;
  output: string;
  error?: string;
}

export class AICommands {
  private geminiClient: GeminiClient;

  constructor() {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('Gemini API key not configured');
    }
    this.geminiClient = new GeminiClient(apiKey);
  }

  /**
   * Parse and execute AI commands
   */
  async executeCommand(input: string): Promise<CommandResult> {
    const [command, ...args] = input.trim().split(/\s+/);

    // Handle specific AI management commands
    switch (command.toLowerCase()) {
      case 'ai':
        return this.handleAICommand(args);

      case 'stats':
        return this.showStats();

      case 'clear':
        return this.clearAll();

      default:
        // Everything else goes to natural language processing
        return this.chat(input);
    }
  }

  /**
   * Handle AI subcommands
   */
  private handleAICommand(args: string[]): CommandResult {
    const subcommand = args[0]?.toLowerCase();

    switch (subcommand) {
      case 'help':
        return {
          success: true,
          output: this.getHelpText()
        };

      case 'cache':
        return this.showCacheStats();

      case 'clear':
        return this.clearAll();

      default:
        return {
          success: false,
          output: `Unknown AI subcommand: ${subcommand}. Try 'ai help' for available commands.`
        };
    }
  }

  /**
   * Natural language chat with Gemini
   */
  private async chat(message: string): Promise<CommandResult> {
    try {
      const response = await this.geminiClient.sendMessage(message);

      return {
        success: true,
        output: response
      };
    } catch (error) {
      return {
        success: false,
        output: 'Failed to process your message',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Clear conversation history and cache
   */
  private clearAll(): CommandResult {
    this.geminiClient.clearHistory();
    contextBuilder.clearCache();

    return {
      success: true,
      output: 'Conversation history and cache cleared.'
    };
  }

  /**
   * Show cache statistics
   */
  private showCacheStats(): CommandResult {
    const cacheStats = contextBuilder.getCacheStats();
    const contextStats = this.geminiClient.getContextStats();

    let output = 'Cache Statistics:\n';
    output += '-----------------\n';
    output += `Cache Entries: ${cacheStats.entries}\n`;
    output += `Cache Size: ${(cacheStats.size / 1024).toFixed(2)} KB\n`;

    if (contextStats) {
      output += `\nLast Context:\n`;
      output += `Tokens Used: ${contextStats.tokens}\n`;
      output += `Sections: ${contextStats.sections.join(', ')}\n`;
    }

    return {
      success: true,
      output
    };
  }

  /**
   * Show system statistics
   */
  private showStats(): CommandResult {
    const cacheStats = contextBuilder.getCacheStats();
    const contextStats = this.geminiClient.getContextStats();

    let output = 'AI System Statistics:\n';
    output += '---------------------\n';
    output += `Model: Gemini 2.5 Flash\n`;
    output += `Cache Entries: ${cacheStats.entries}\n`;
    output += `Cache Size: ${(cacheStats.size / 1024).toFixed(2)} KB\n`;

    if (contextStats) {
      output += `Last Query Tokens: ${contextStats.tokens}\n`;
      output += `Optimized Sections: ${contextStats.sections.length}\n`;
    }

    return {
      success: true,
      output
    };
  }

  /**
   * Get help text
   */
  private getHelpText(): string {
    return `
AI Commands Help:
-----------------

ai help              - Show this help message
ai cache             - Show cache statistics
ai clear             - Clear conversation history and cache

stats                - Show system statistics
clear                - Clear conversation and cache

Or just type naturally and I'll understand your question!

Examples:
- "What experience do you have with React?"
- "Tell me about your recent projects"
- "What are your cloud computing skills?"
`;
  }
}

// Export singleton instance
export const aiCommands = new AICommands();