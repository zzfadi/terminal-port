# Copilot Instructions for OnePromptPortfolio

## Project Overview

AI-powered terminal portfolio built with React, TypeScript, and Google Gemini AI. The entire app is a conversational interface where users ask questions about professional experience in natural language.

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
│   │   │   ├── ContextBuilder.ts      # Smart context assembly (371 lines)
│   │   │   └── PortfolioDataStore.ts  # Unified data source (685 lines)
│   │   └── commands/
│   │       └── AICommands.ts
│   └── data/
│       └── portfolio-data.ts     # Single source of truth for content (722 lines)
├── public/
│   └── textures/                 # UI texture assets
├── index.html                    # Minimal entry point
├── package.json
├── vite.config.ts
└── tsconfig.json
```

## Development Workflow

```bash
npm install         # Install dependencies
npm run dev         # Dev server on port 3002
npm run build       # Production build
npm run type-check  # TypeScript validation
npm run lint        # ESLint
npm run format      # Prettier
```

## Architecture Patterns

### Single Component Design
- `Terminal.tsx` handles all UI: messages, window controls, keyboard shortcuts
- State managed with React hooks (useState, useEffect)
- No routing or complex state libraries needed
- Keep component self-contained

### AI Integration Flow
```
User Input → Terminal.tsx
  ↓
GeminiClient.sendMessage()
  ↓
ContextBuilder.buildContext(query) ← PortfolioDataStore
  ↓
Gemini API with optimized context
  ↓
Typed response animation → Display
```

### Smart Context Assembly
- **ContextBuilder.ts** classifies queries (experience, skills, projects, AI, contact, etc.)
- Selects relevant portfolio sections based on intent
- Enforces 1500 token budget with caching (5 min TTL)
- Only includes necessary data to reduce costs and latency

### Data Management
- **portfolio-data.ts** is the single source of truth (722 lines)
- **PortfolioDataStore.ts** transforms raw data into semantic sections
- Each section has relevance score, token estimate, formatted content
- Changes to portfolio-data.ts automatically propagate through the system

## Key Implementation Details

### Terminal.tsx
- Message types: `user`, `ai`, `system`
- Window states: normal (920×600px), minimized (dock button), maximized (96vw×92vh)
- State persistence: remembers maximized state when minimizing
- Keyboard: Ctrl+L clears history, Tab cycles controls, Enter activates
- Typing animation: 30ms delay per word for AI responses

### GeminiClient.ts
- Model: `gemini-2.5-flash` for speed and cost efficiency
- System prompt instructs AI on tone, format, and boundaries
- Conversation history: last 20 messages for context
- Error handling: friendly messages, no stack traces to user

### ContextBuilder.ts (Lines 123-231)
- Query classification by keywords
- Section selection strategy per query type
- Token budget management
- Cache prevents redundant processing

### PortfolioDataStore.ts
- 11 semantic sections (overview, experience, skills, projects, achievements, vision, AI leadership, technical leadership, learning, career progression, context prompts)
- Formatting methods for different contexts
- V1 export capability (if needed for backwards compatibility)

### Styling (styles.css)
- Luxury glass-morphic design with backdrop blur
- Aluminum slate background with brushed metal textures
- OLED-style display: true black (#000) with phosphor green (#00FF41)
- GPU-accelerated animations (transform, opacity only)
- Responsive: <768px switches to mobile layout

## Common Tasks

### Update Portfolio Content
1. Edit `src/data/portfolio-data.ts`
2. Changes automatically flow to PortfolioDataStore → ContextBuilder → AI
3. No need to touch multiple files

### Modify AI Behavior
- System prompt: `src/GeminiClient.ts` lines 27-46
- Query classification: `src/ai/core/ContextBuilder.ts` lines 123-163
- Section selection: `src/ai/core/ContextBuilder.ts` lines 168-231

### Adjust UI/UX
- Colors and animations: `src/styles.css`
- Window behavior: `src/Terminal.tsx` lines 162-223
- Message rendering: `src/Terminal.tsx` lines 296-315

### Add New Portfolio Section
1. Add data to `src/data/portfolio-data.ts`
2. Create formatting method in `PortfolioDataStore.ts`
3. Add section in `buildSections()` method (around line 326)
4. Update query classification in `ContextBuilder.ts` if needed

## Important Constraints

### Keep It Simple
- App is intentionally minimal (~2500 lines total)
- No complex state management or routing
- Direct Gemini API integration (no backend)
- Single component architecture

### Performance Priorities
- Bundle size: ~280KB total is acceptable
- Context optimization: reduce token usage
- GPU acceleration: only transform/opacity animations
- Code splitting: Gemini SDK in separate chunk

### Professional Representation
- This is a live portfolio showcasing real work
- Maintain technical accuracy
- Professional yet personable tone
- No exaggeration or marketing fluff

## Environment Setup

Required `.env`:
```env
VITE_GEMINI_API_KEY=your_key_here
```

Get API key from: https://aistudio.google.com/app/apikey

## Testing & Validation

```bash
npm run build       # Must succeed without errors
npm run type-check  # Must pass TypeScript checks
```

No automated tests currently. Manual testing covers:
- Desktop and mobile responsive breakpoints
- Window controls (minimize/maximize/close)
- Keyboard navigation
- AI response accuracy
- Error states (no API key, network failure)

## Debugging Tips

Browser console:
```javascript
localStorage.clear()  // Clear cached data
// GeminiClient logs context stats in dev mode
// Check ContextBuilder optimization metrics
```

## Source of Truth

- Portfolio content: `src/data/portfolio-data.ts`
- Architecture guidance: `CLAUDE.md` (root)
- User-facing docs: `README.md` (root)
- This file: Development patterns and practices

## What NOT to Do

- Don't split Terminal.tsx into multiple components (keep simple)
- Don't add backend/API proxy (direct Gemini API is intentional)
- Don't add command parsing (pure conversational interface)
- Don't ignore TypeScript errors
- Don't use CSS-in-JS (pure CSS for performance)
- Don't break the GPU-accelerated animation patterns

## Deployment

Static hosting ready:
```bash
npm run build  # Output to dist/
```

Deploy `dist/` to Vercel, Netlify, GitHub Pages, etc.

Ensure hosting sets `VITE_GEMINI_API_KEY` environment variable.

## Future Enhancements

Potential additions (maintain simplicity):
- Streaming responses (Gemini supports it)
- Voice input/output
- Conversation export (PDF/JSON)
- Multiple language support
- Theme variations

---

Keep the codebase clean, performant, and focused on delivering an exceptional conversational portfolio experience.