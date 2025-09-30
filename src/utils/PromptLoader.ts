/**
 * PromptLoader - Utility for loading and processing AI prompts from markdown files
 *
 * Features:
 * - Loads prompts from markdown files at build time
 * - Processes template variables ({{variableName}})
 * - Caches compiled prompts for performance
 * - Type-safe prompt access
 */

import systemPromptRaw from '../prompts/system.md?raw';

interface TemplateVariables {
  [key: string]: string;
}

/**
 * Simple template variable replacement
 * Replaces {{variableName}} with actual values
 */
function processTemplate(template: string, variables: TemplateVariables): string {
  let processed = template;

  for (const [key, value] of Object.entries(variables)) {
    const pattern = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    processed = processed.replace(pattern, value);
  }

  return processed;
}

/**
 * Load and compile the system prompt with given variables
 */
export function loadSystemPrompt(variables: TemplateVariables): string {
  return processTemplate(systemPromptRaw, variables);
}

/**
 * Get raw system prompt template (without variable processing)
 */
export function getRawSystemPrompt(): string {
  return systemPromptRaw;
}

/**
 * Validate that all required variables are provided
 */
export function validateVariables(template: string, provided: TemplateVariables): string[] {
  const variablePattern = /\{\{(\w+)\}\}/g;
  const requiredVariables = new Set<string>();
  const missing: string[] = [];

  let match;
  while ((match = variablePattern.exec(template)) !== null) {
    requiredVariables.add(match[1]);
  }

  for (const required of requiredVariables) {
    if (!(required in provided)) {
      missing.push(required);
    }
  }

  return missing;
}

/**
 * Extract all variables from a template
 */
export function extractVariables(template: string): string[] {
  const variablePattern = /\{\{(\w+)\}\}/g;
  const variables: string[] = [];

  let match;
  while ((match = variablePattern.exec(template)) !== null) {
    if (!variables.includes(match[1])) {
      variables.push(match[1]);
    }
  }

  return variables;
}