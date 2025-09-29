# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with this repository.

## Project Overview

AI-powered interactive terminal portfolio showcasing Fadi Al Zuabi's engineering expertise through natural language conversation. Built with React, TypeScript, and Google Gemini AI.

## Repository Structure

```
OnePromptPortfolio/
├── src/
│   ├── Terminal.tsx              # Main React component (347 lines)
│   ├── GeminiClient.ts           # AI integration with context optimization
│   ├── main.ts                   # React app entry point
│   ├── styles.css                # Luxury glass-morphic terminal styling
│   ├── portfolio.ts              # Legacy portfolio data (to be deprecated)
│   ├── ai/
│   │   ├── core/
│   │   │   ├── ContextBuilder.ts      # Smart context assembly
│   │   │   └── PortfolioDataStore.ts  # Unified data source
│   │   └── commands/
│   │       └── AICommands.ts
│   └── data/
│       └── portfolio-data.ts     # Central portfolio data
├── public/
│   └── textures/                 # UI texture assets
├── .github/
│   └── copilot-instructions.md
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
├── .env.example
├── .gitignore
├── README.md
├── CLAUDE.md
└── CNAME
```

## Development Commands

```bash
# Install dependencies
npm install

# Development server (port 3002)
npm run dev

# Production build
npm run build

# Type checking
npm run type-check

# Code quality
npm run lint
npm run format

# Preview production build (port 4002)
npm run preview
```

## Architecture

**Tech Stack:**
- React 19 with TypeScript
- Vite 7 for bundling
- Gemini 2.5 Flash for AI
- react-rnd for window management
- framer-motion for animations

**Key Components:**

1. **Terminal.tsx** - Single component handling:
   - Message history with typing animations
   - Window controls (minimize/maximize/close)
   - Keyboard navigation and shortcuts
   - Ctrl+L to clear history

2. **GeminiClient.ts** - AI integration with:
   - Dynamic context optimization via ContextBuilder
   - Conversation history (last 20 messages)
   - Token budget management
   - Model: `gemini-2.5-flash`

3. **ContextBuilder.ts** - Smart context assembly:
   - Query classification (experience, skills, projects, AI, etc.)
   - Relevant section selection
   - Token budget enforcement (default 1500 tokens)
   - 5-minute context cache
   - Supports multiple AI providers

4. **PortfolioDataStore.ts** - Unified data layer:
   - Central source of truth for all portfolio content
   - Semantic sections with relevance scores
   - Structured experience, skills, projects, achievements
   - Export capability for V1 compatibility

5. **portfolio-data.ts** - Raw portfolio data:
   - Personal info and contact
   - Professional experience with metrics
   - Skills organized by category
   - Projects (professional and personal)
   - AI initiatives and leadership roles

### Data Flow

```
User Input → Terminal.tsx
  ↓
GeminiClient.sendMessage()
  ↓
ContextBuilder.buildContext(query) ← PortfolioDataStore
  ↓
Gemini API with optimized context
  ↓
Typed response → Terminal display
```

## Environment Configuration

Required `.env` in `v2/`:
```bash
VITE_GEMINI_API_KEY=your_api_key_here
```

## Common Development Tasks

### Update Portfolio Content

**Edit:** `src/data/portfolio-data.ts`

This is the single source of truth. Changes automatically propagate through:
- PortfolioDataStore → ContextBuilder → GeminiClient

Key sections:
- `personal`: Name, title, contact, location
- `experience`: Work history with achievements and metrics
- `skills.technical`: Organized by category (languages, firmware, AI/ML, full-stack)
- `projects.professional` / `projects.personal`
- `aiInitiatives`: AI Champion role and projects
- `achievements.quantified`: Metrics with context
- `visionAndAvailability`: Career vision and availability

### Modify AI Behavior

**Context Assembly:** `src/ai/core/ContextBuilder.ts`
- Query classification logic (line 123-163)
- Section selection strategy (line 168-231)
- Token budget management (line 236-280)

**System Prompt:** `src/GeminiClient.ts:27-46`
- Response style and tone
- Formatting instructions
- Professional guidelines

### Adjust UI/UX

**Styling:** `src/styles.css`
- Terminal colors and glass-morphic effects
- Animation timings
- Responsive breakpoints

**Window Behavior:** `src/Terminal.tsx`
- Window controls: lines 162-223
- Keyboard shortcuts: lines 143-159
- Message rendering: lines 296-315

### Add New Portfolio Section

1. Add data to `src/data/portfolio-data.ts`
2. Create formatting method in `src/ai/core/PortfolioDataStore.ts`
3. Add section in `buildSections()` method
4. Update query classification in `src/ai/core/ContextBuilder.ts` if needed

## Performance Optimization

Current bundle sizes:
- Main bundle: ~195KB
- AI chunk: ~87KB (Gemini SDK)
- CSS: ~3KB

**Optimization features:**
- Dynamic context assembly (only relevant sections)
- Context caching (5-minute TTL)
- Code splitting (Gemini SDK in separate chunk)
- Token budget enforcement
- Conversation history limiting (20 messages)

**Vite configuration** (`vite.config.ts`):
- Manual chunks for AI libraries
- Terser minification
- Console dropping in production
- Port 3002 (dev), 4002 (preview)

## Testing

Currently no automated tests. Run:
```bash
npm run build  # Ensure TypeScript compiles
npm run type-check  # Verify types
```

## Key Architectural Decisions

### Why Single React Component?
- App is ~400 lines total
- No routing or complex state
- Easier to understand and modify
- Faster development

### Why Context Optimization?
- Reduce token costs
- Faster API responses
- Stay within model context limits
- Improve response relevance

### Why Unified Data Store?
- Single source of truth
- Consistency across V1/V2
- Easy synchronization
- Structured for AI consumption

### No Traditional Commands
- Natural language more accessible
- No learning curve
- AI handles all interpretation
- Focus on conversation

## Important Constraints

- **Terminal Component**: Keep Terminal.tsx as single, self-contained component
- **Data Source**: `src/data/portfolio-data.ts` is the single source of truth
- **Tone**: Professional but personable, technical but accessible
- **Performance**: Monitor bundle size, optimize context usage
- **Simplicity**: Avoid over-engineering - direct approach preferred

## Development Philosophy

1. **Simplicity over complexity** - Direct approach preferred
2. **Type safety** - Leverage TypeScript fully
3. **Token efficiency** - Smart context selection
4. **Professional representation** - This is a live portfolio
5. **Performance first** - Fast responses critical for UX