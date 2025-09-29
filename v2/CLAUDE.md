# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

OnePromptPortfolio V2 has been completely redesigned as a minimalist AI-powered natural language interface. The terminal aesthetic remains, but all traditional command processing has been replaced with conversational AI using Google's Gemini API.

## Current Architecture

### Simplified Structure (V2)
```
v2/
├── src/
│   ├── main.ts          # React app entry point (20 lines)
│   ├── Terminal.tsx     # Single React component for UI (180 lines)
│   ├── GeminiClient.ts  # Gemini AI integration (73 lines)
│   ├── portfolio.ts     # Portfolio data & context (160 lines)
│   └── styles.css       # Terminal aesthetics (220 lines)
├── index.html           # Minimal HTML entry
├── package.json         # Dependencies
└── vite.config.ts       # Build configuration
```

## Development Commands

```bash
# Install dependencies
npm install

# Development server (port 3002)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Type checking
npm run type-check

# Linting
npm run lint

# Format code
npm run format
```

## Key Implementation Details

### Natural Language Processing
The app uses Gemini API directly for all interactions:
- User input → Gemini API with portfolio context → AI response
- No command parsing or traditional terminal commands
- Full conversation history maintained for context

### GeminiClient.ts
- Uses `gemini-2.5-flash` model for best performance
- Includes full portfolio context in system prompt
- Maintains conversation history (last 20 messages)
- Simple error handling with user-friendly messages

### Terminal.tsx
- Single React component handling entire UI
- Message history with typing animation effect
- Three message types: user, ai, system
- Ctrl+L clears chat and history
- Mobile responsive design

### Portfolio Data
The `portfolio.ts` file contains all professional information:
- Profile, skills, experience, education, projects
- `formatPortfolioForAI()` function formats data for AI context
- Data is included in every AI request for accurate responses

## Environment Configuration

Required `.env` file:
```env
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

The Gemini API key is the only required configuration. Without it, the app shows an error message.

## AI Behavior & Prompting

The system prompt in GeminiClient.ts instructs the AI to:
- Represent Fadi Al Zuabi professionally
- Provide concise, technical responses
- Draw from actual experience and projects
- Format for terminal display (no markdown)
- Redirect questions outside expertise appropriately

## Testing & Building

```bash
# Build creates optimized bundles
npm run build

# Output in dist/ folder:
# - index.html
# - assets/index-[hash].js (~195KB)
# - assets/index-[hash].css (~3KB)
# - assets/ai-[hash].js (~87KB) - Gemini SDK chunk
```

## Important Patterns

### State Management
- Simple React useState for messages and UI state
- No complex state management libraries
- Conversation history managed in GeminiClient class

### Styling
- Pure CSS with terminal aesthetic
- CSS variables not used - direct color values
- Mobile responsive with media queries
- Typing animation using async/await

### Error Handling
- Network errors show friendly messages
- API key validation on initialization
- Loading states during AI requests

## Common Modifications

### Update Portfolio Data
Edit `src/portfolio.ts`:
- Modify the portfolioData object directly
- Changes automatically included in AI context

### Adjust AI Behavior
Edit system prompt in `src/GeminiClient.ts`:
- Lines 16-37 contain the system instructions
- Modify to change response style or focus

### Change Visual Style
Edit `src/styles.css`:
- Terminal colors: lines 11-12 (background/text)
- Animation speeds: lines 76-82
- Font family: line 9

## Deployment

The production build is static and can be deployed anywhere:
```bash
npm run build
# Deploy contents of dist/ folder
```

CSP headers in index.html allow connection to:
- `https://generativelanguage.googleapis.com` (Gemini API)

## Architecture Decisions

### Why Single Component?
- Entire app is ~400 lines total
- No routing or complex state needed
- Easier to understand and modify
- Faster development iteration

### Why Direct Gemini Integration?
- No backend proxy needed for prototyping
- Simple API with good performance
- Native streaming support (future enhancement)
- Cost-effective for portfolio use

### Why No Commands?
- Natural language is more accessible
- No learning curve for users
- AI handles all query interpretation
- Focuses on conversation, not terminal emulation

## Future Enhancements

Potential additions without breaking simplicity:
1. Streaming responses (Gemini supports it)
2. Export conversation as PDF
3. Voice input/output
4. Multiple AI model support
5. Conversation branching/saving

## Performance Notes

- Initial load: ~280KB total (including Gemini SDK)
- Time to interactive: <2 seconds
- Gemini response time: 1-3 seconds typically
- No performance optimization needed at current scale

## Debugging

```javascript
// Browser console commands
localStorage.clear()  // Clear any stored data
console.log(import.meta.env.VITE_GEMINI_API_KEY)  // Check API key

// Component has no debug mode - add console.logs as needed
```