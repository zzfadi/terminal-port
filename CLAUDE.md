# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with this repository.

## Project Overview

AI-powered interactive terminal portfolio showcasing Fadi Al Zuabi's engineering expertise through natural language conversation. Built with React, TypeScript, and Google Gemini AI.

## Repository Structure

```
OnePromptPortfolio/
├── src/
│   ├── Terminal.tsx              # Main React component (811 lines)
│   ├── GeminiClient.ts           # Simplified AI integration (237 lines)
│   ├── main.ts                   # React app entry point
│   ├── styles.css                # Luxury glass-morphic terminal styling
│   ├── data/
│   │   └── portfolio-data.ts     # Central portfolio data (662 lines, single source of truth)
│   ├── prompts/                  # AI prompt templates (markdown)
│   │   ├── system.md
│   │   ├── response-guidelines.md
│   │   └── context-sections.md
│   ├── utils/
│   │   └── PromptLoader.ts       # Loads prompts from markdown files
│   └── types/
│       └── prompts.d.ts
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
├── SIMPLIFICATION_SUMMARY.md     # Details of AI architecture simplification
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

1. **Terminal.tsx** (811 lines) - Single component handling:
   - Message history with typing animations
   - Window controls (minimize/maximize/close)
   - Keyboard navigation and shortcuts
   - Image modal with zoom, download, copy
   - HTML preview with sandboxed iframe
   - Ctrl+L to clear history

2. **GeminiClient.ts** (237 lines) - Simplified AI integration:
   - Direct import of portfolio data
   - Full context building (no optimization needed)
   - Conversation history (last 20 messages)
   - System prompt loaded from markdown templates
   - Model: `gemini-2.5-flash-image-preview` (supports image generation)
   - Returns text + optional image data

3. **portfolio-data.ts** (662 lines) - Single source of truth:
   - Personal info and contact
   - Professional experience with metrics
   - Skills organized by category
   - Projects (professional and personal)
   - AI initiatives and leadership roles

4. **Prompt System** (`src/prompts/*.md`) - AI behavior templates:
   - System prompt with personality and capabilities
   - Response formatting guidelines
   - Template variables ({{fullName}}, {{portfolioContext}})
   - Loaded at build time via PromptLoader

### Data Flow (Simplified)

```
User Input → Terminal.tsx
  ↓
GeminiClient.sendMessage()
  ↓
Build full context from portfolio-data.ts (simple formatting)
  ↓
Gemini API with complete portfolio context
  ↓
Typed response → Terminal display
```

### Architecture Simplification (2025-09-29)

The AI architecture was simplified from **1,155 lines across 3 files** to **237 lines in 1 file** (79% reduction).

**Removed complexity:**
- ContextBuilder.ts (371 lines) - Query classification, caching, token budgeting
- PortfolioDataStore.ts (685 lines) - Complex formatting, singleton patterns
- All optimization layers that weren't needed for this use case

**Why simplified:**
- Portfolio data is small (~663 lines) and fits easily in Gemini's context
- No need for query classification - Gemini handles it naturally
- No need for caching - portfolio data is static
- No need for token budgeting - well within limits

See [SIMPLIFICATION_SUMMARY.md](SIMPLIFICATION_SUMMARY.md) for detailed analysis.

## Environment Configuration

Required `.env` in `v2/`:
```bash
VITE_GEMINI_API_KEY=your_api_key_here
```

## HTML Generation Governance System

### Overview

The portfolio includes a sophisticated HTML generation system that creates complete, interactive HTML applications on demand. This system uses a specialized prompt to ensure high-quality, secure, and consistent HTML output.

### Architecture

**Flow:**
```
User Request → GeminiClient.sendMessage()
    ↓
shouldGenerateHTML() - Keyword detection (NO AI call)
    ├─→ NO: Regular conversation
    └─→ YES: generateHTMLContent()
            ↓
loadHTMLGenerationPrompt() - Specialized prompt
            ↓
Gemini API (single call)
            ↓
DOMPurify sanitization in Terminal.tsx
            ↓
Render in sandboxed iframe
```

**Key Features:**
- Single AI call (efficient keyword-based routing)
- Comprehensive prompt engineering (`html-generation.md`)
- Multi-layer security (DOMPurify + CSP headers)
- Supports interactive apps, visualizations, games, forms

### Components

**1. HTML Generation Prompt** (`src/prompts/html-generation.md`)
- ~400 lines of detailed instructions
- Template variables: `{{userRequest}}`, `{{requestType}}`, `{{portfolioColors}}`
- Complete HTML structure requirements
- Security constraints and best practices
- Request type-specific guidelines
- Full working examples

**2. GeminiClient Methods** (`src/GeminiClient.ts`)
- `shouldGenerateHTML()` - Keyword-based intent detection
- `extractHTMLRequirements()` - Classifies request type and extracts styling
- `generateHTMLContent()` - Generates HTML with specialized prompt
- Automatic routing in `sendMessage()`

**3. Enhanced Validation** (`src/Terminal.tsx`)
- Comprehensive DOMPurify configuration
- Allows full HTML documents (`WHOLE_DOCUMENT: true`)
- Permits necessary tags (html, head, body, script, style, forms, SVG, canvas)
- Blocks XSS attacks while enabling interactivity
- Injects CSP headers for additional security

**4. PromptLoader Integration** (`src/utils/PromptLoader.ts`)
- `loadHTMLGenerationPrompt()` function
- Template variable substitution
- Build-time prompt loading

### Keywords That Trigger HTML Generation

**Interactive**: create, build, make, calculator, tool, converter, form, timer, clock, counter
**Visualization**: chart, graph, timeline, visualize, plot, diagram
**Games**: game, play, snake, tic-tac-toe, puzzle
**General**: show me, demo, interactive, widget, component, animation

### Request Types

1. **Interactive** - Calculators, converters, tools, forms
2. **Visualization** - Charts, graphs, timelines, diagrams
3. **Demo** - Educational examples, concept illustrations
4. **Component** - UI patterns, reusable components

### Security Features

- **DOMPurify Sanitization**: Comprehensive tag/attribute whitelist
- **CSP Headers**: Content Security Policy meta tags
- **Sandboxed Iframe**: Isolated execution environment
- **No External Resources**: Self-contained HTML only
- **Safe JavaScript Patterns**: No eval(), no inline handlers

### Adding New HTML Capabilities

1. **Update Keywords**: Add to `shouldGenerateHTML()` in GeminiClient.ts
2. **Refine Prompt**: Edit `src/prompts/html-generation.md`
3. **Test Classification**: Verify `extractHTMLRequirements()` categorizes correctly
4. **Validate Security**: Ensure DOMPurify config permits new features

### Performance Considerations

- Single AI call per HTML request (no classification overhead)
- Larger token budget (4096 tokens) for complete HTML
- Slightly higher temperature (0.3) for creativity
- Conversation history maintained for follow-up questions

## Common Development Tasks

### Update Portfolio Content

**Edit:** `src/data/portfolio-data.ts`

This is the single source of truth. Changes automatically flow to GeminiClient.

Key sections:
- `personal`: Name, title, contact, location
- `experience`: Work history with achievements and metrics
- `skills.technical`: Organized by category (languages, firmware, AI/ML, full-stack)
- `projects.professional` / `projects.personal`
- `aiInitiatives`: AI Champion role and projects
- `achievements.quantified`: Metrics with context
- `visionAndAvailability`: Career vision and availability

### Modify AI Behavior

**System Prompt Templates:** `src/prompts/*.md`
- `system.md` - Main system prompt with personality
- `response-guidelines.md` - Response formatting rules
- `context-sections.md` - Portfolio context structure
- Uses template variables: `{{fullName}}`, `{{firstName}}`, `{{portfolioContext}}`

**Context Formatting:** `src/GeminiClient.ts`
- Method: `buildSystemPrompt()` (~lines 35-150)
- Simple template-based formatting
- Add/remove sections as needed
- Adjust formatting for different data types

**AI Capabilities:**
- Text responses (conversational)
- Image generation (responds to "show me", "visualize", etc.)
- HTML generation (interactive demos wrapped in ```html)

### Adjust UI/UX

**Styling:** `src/styles.css`
- Terminal colors and glass-morphic effects
- Animation timings
- Responsive breakpoints
- Modal styling (image/HTML viewers)

**Window Behavior:** `src/Terminal.tsx`
- Window controls: minimize/maximize/close
- Keyboard shortcuts: Ctrl+L, Tab, Enter, Escape
- Message rendering with typing animation
- Image modal: full-screen lightbox with toolbar
- HTML preview: sandboxed iframe with security (DOMPurify)

### Add New Portfolio Section

1. Add data to `src/data/portfolio-data.ts`
2. Update formatting in `GeminiClient.formatPortfolioContext()` method
3. Test the changes

That's it! Simple and direct.

## Performance

Current bundle sizes:
- Main bundle: ~251KB (gzip: 78KB)
- AI chunk: ~86KB (gzip: 16KB)
- CSS: ~17KB (gzip: 4KB)

**Image Generation:**
- Model: `gemini-2.5-flash-image-preview`
- Base64-encoded images in responses
- Full-screen modal viewer with download/copy

**HTML Rendering:**
- DOMPurify sanitization (XSS protection)
- Sandboxed iframe for isolation
- Interactive demos and visualizations

**Performance features:**
- Code splitting (Gemini SDK in separate chunk)
- Conversation history limiting (20 messages)
- Simple, fast context building (no overhead)

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

### Why Simplified AI Architecture?
- Portfolio data is small (~663 lines) - no need for optimization
- Gemini 2.5 Flash has 1M+ token context window
- Simple = easier to maintain and enhance
- YAGNI principle: add complexity only when needed
- Reduced from 1,155 lines to 209 lines (81% reduction)

### Why Direct Portfolio Import?
- Single source of truth (`portfolio-data.ts`)
- No abstraction layers needed
- Changes immediately available
- Clear data flow

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

1. **Simplicity over complexity** - Direct approach preferred, avoid over-engineering
2. **YAGNI** (You Aren't Gonna Need It) - Add features only when needed
3. **Type safety** - Leverage TypeScript fully
4. **Professional representation** - This is a live portfolio
5. **Performance first** - Fast responses critical for UX
6. **Build up, not down** - Start simple, add complexity as problems emerge

### When to Add Complexity

Only add optimization/abstraction layers if you hit these problems:

- **Portfolio grows to 10,000+ lines** → Then add smart context selection
- **High API costs** → Then add caching
- **Need semantic search** → Then add vector embeddings + RAG
- **Need multiple AI providers** → Then add provider abstraction
- **Response quality issues** → Then refine system prompt

Current state: None of these problems exist, so keep it simple!