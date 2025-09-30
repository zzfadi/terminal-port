# AI Prompts Documentation

This directory contains all AI prompts and instructions used by the terminal portfolio application. By externalizing prompts to markdown files, we enable easy modification and version control without touching code.

## File Structure

```
prompts/
├── system.md                   # Main system prompt template
├── response-guidelines.md      # Response formatting and tone rules
├── context-sections.md         # Instructions for context assembly
└── README.md                   # This file
```

## Files Overview

### `system.md`
The core system prompt that defines:
- AI's role and personality
- Response guidelines reference
- Context insertion point (`{{portfolioContext}}`)
- Question-answering instructions
- Professional tone guidance

**Template Variables:**
- `{{fullName}}` - Full name from portfolio data
- `{{firstName}}` - First name only
- `{{portfolioContext}}` - Complete formatted portfolio information

### `response-guidelines.md`
Detailed instructions for how the AI should format and structure responses:
- Formatting rules (plain text, terminal-friendly)
- Response length guidelines (2-4 sentences vs detailed)
- Tone requirements (technical but accessible)
- Content accuracy standards
- Engagement strategies

### `context-sections.md`
Documentation for portfolio context assembly:
- Section order and structure
- Formatting guidelines for each section
- What information to include/exclude
- Context optimization strategies

## How Prompts Are Used

1. **Load Time**: Prompts are loaded at build time using Vite's `?raw` import
2. **Template Processing**: Variables like `{{fullName}}` are replaced with actual data
3. **Context Injection**: Portfolio data is formatted and injected into `{{portfolioContext}}`
4. **Assembly**: Final prompt is assembled from system prompt + context + conversation history
5. **API Call**: Complete prompt sent to Gemini API

## Modifying Prompts

### To Change AI Personality or Behavior
Edit `system.md` - modify the role description, tone instructions, or guidelines.

### To Adjust Response Format
Edit `response-guidelines.md` - change length requirements, formatting rules, or tone.

### To Reorganize Portfolio Context
Edit `context-sections.md` documentation, then update `GeminiClient.formatPortfolioContext()` method.

## Template Variable Syntax

Variables use double curly braces: `{{variableName}}`

Available variables:
- `{{fullName}}` - Complete name (e.g., "Fadi Al Zuabi")
- `{{firstName}}` - First name only (e.g., "Fadi")
- `{{portfolioContext}}` - Full formatted portfolio data

## Best Practices

1. **Version Control**: Commit prompt changes with descriptive messages
2. **A/B Testing**: Create alternative prompt files and test them
3. **Documentation**: Document why you made specific prompt changes
4. **Testing**: Always test prompt changes with various question types
5. **Iterative**: Refine prompts based on actual AI responses

## Prompt Engineering Tips

- **Be Specific**: Clear instructions produce better results
- **Use Examples**: Show the AI what you want (when possible)
- **Structure**: Use headers and bullets for clarity
- **Constraints**: Define what NOT to do as well as what to do
- **Context**: Provide necessary background information

## Technical Implementation

Prompts are loaded via `PromptLoader.ts` utility which:
- Imports markdown files as raw strings
- Processes template variables
- Caches compiled prompts
- Provides type-safe access to prompts

See `src/utils/PromptLoader.ts` for implementation details.

## Future Enhancements

Potential improvements:
- Multi-language support (prompts in different languages)
- Conditional sections (show/hide based on context)
- Prompt variants for different user types
- Analytics on which prompts perform best
- User-customizable system prompts

## Related Files

- `/src/utils/PromptLoader.ts` - Prompt loading utility
- `/src/GeminiClient.ts` - AI client that uses prompts
- `/src/data/portfolio-data.ts` - Data source for context
- `/vite.config.ts` - Build configuration with @prompts alias