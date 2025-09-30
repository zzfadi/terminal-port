/**
 * Type definitions for prompt system
 */

/**
 * Template variables that can be used in prompts
 */
export interface PromptVariables {
  fullName: string;
  firstName: string;
  portfolioContext: string;
}

/**
 * Available prompt types
 */
export type PromptType = 'system' | 'response-guidelines' | 'context-sections';

/**
 * Prompt metadata
 */
export interface PromptMetadata {
  type: PromptType;
  version: string;
  lastModified: string;
  variables: string[];
}

declare module '*.md?raw' {
  const content: string;
  export default content;
}