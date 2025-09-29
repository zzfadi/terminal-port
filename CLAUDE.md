# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with this repository.

## Project Overview

OnePromptPortfolio is an AI-powered interactive terminal portfolio showcasing Fadi Al Zuabi's engineering expertise. Built with TypeScript, Vite, and Google Gemini AI integration.

## Repository Structure

```
OnePromptPortfolio/
├── v2/                      # Main application
│   ├── src/
│   │   ├── core/           # Terminal engine
│   │   ├── ai/             # Gemini AI integration
│   │   ├── commands/       # Command implementations
│   │   └── filesystem/     # Virtual filesystem
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
├── index.html              # Entry point
└── fadi-info/              # Portfolio content data
```

## Development Commands

```bash
# Install dependencies
cd v2 && npm install

# Development server
npm run dev

# Build for production
npm run build

# Run tests
npm run test
npm run test:e2e

# Code quality
npm run lint
npm run format
```

## Architecture

- **Framework**: TypeScript with Vite bundler
- **AI Integration**: Google Gemini AI for intelligent responses
- **Storage**: IndexedDB for filesystem persistence
- **Testing**: Jest unit tests + Playwright E2E
- **Styling**: Tailwind CSS for responsive design

## Key Patterns

### Command Implementation
```typescript
// src/commands/portfolio.ts
@Command('about', 'Display bio')
async about(args: string[]): Promise<void> {
    // Implementation
}
```

### AI Integration
```typescript
// Use Gemini for intelligent responses
const response = await this.geminiService.query(prompt, {
    temperature: 0.7,
    maxTokens: 1000
});
```

## Testing Requirements

```bash
# Before committing changes
npm run lint
npm run test
npm run build  # Ensure build succeeds
```

## Performance Guidelines

- AI responses load on-demand
- Code split by feature modules
- Monitor bundle size with `npm run build`
- Target <100ms response time for basic commands

## Common Tasks

### Update Personal Information
Update files in `fadi-info/` directory:
- `bio.md`: Personal biography
- `experience.json`: Work history
- `skills.json`: Technical skills
- `projects.json`: Featured projects

### Add New Command
1. Create command file in `v2/src/commands/`
2. Implement command class with decorator
3. Register in command system
4. Add to help documentation

### Deploy Changes
```bash
cd v2 && npm run build
# Deploy dist/ folder to hosting
```

## AI Service Configuration

### Google Gemini Setup
```bash
# v2/.env
VITE_GEMINI_API_KEY=your-api-key-here
```

### Model Configuration
- Primary: Gemini Pro for complex queries
- Fallback: Gemini Flash for speed
- Context window: 32K tokens

## Important Patterns

### Terminal Authenticity
- Unix-like command syntax
- Helpful error messages
- Command history (arrow keys)
- Tab autocomplete support

### Professional Presentation
- Concise, impactful content
- Quantifiable achievements
- Consistent formatting
- Working links

### User Experience
- Fast response times
- Clear visual feedback
- Mobile responsive
- Keyboard accessible

## File Locations

- **Commands**: `v2/src/commands/`
- **AI Logic**: `v2/src/ai/`
- **Portfolio Data**: `fadi-info/`
- **Core Terminal**: `v2/src/core/`
- **Config**: `v2/vite.config.ts`

## Development Guidelines

1. **Test Before Commit**: Always run tests before pushing
2. **Professional Tone**: This represents Fadi's professional brand
3. **Performance First**: Optimize for speed and user experience
4. **Type Safety**: Leverage TypeScript for reliability
5. **AI Enhancement**: Use Gemini to provide intelligent, contextual responses

---

*An AI-enhanced terminal portfolio demonstrating modern web development with cutting-edge AI integration.*