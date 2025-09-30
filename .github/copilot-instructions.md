# Copilot Instructions for OnePromptPortfolio

## Project Overview

AI-powered terminal portfolio built with React, TypeScript, and Google Gemini AI. The entire app is a conversational interface where users ask questions about professional experience in natural language. Features AI-generated images, interactive HTML preview, and a luxury glass-morphic terminal design.

## Repository Structure

```
OnePromptPortfolio/
├── src/
│   ├── Terminal.tsx              # Main React component (812 lines)
│   ├── GeminiClient.ts           # Simplified AI integration (238 lines)
│   ├── main.ts                   # React app entry point
│   ├── styles.css                # Luxury glass-morphic terminal styling
│   ├── data/
│   │   └── portfolio-data.ts     # Single source of truth for content
│   ├── prompts/
│   │   ├── system.md             # AI system prompt template
│   │   ├── response-guidelines.md
│   │   └── context-sections.md
│   ├── utils/
│   │   └── PromptLoader.ts       # Loads prompts from markdown files
│   └── types/
│       └── prompts.d.ts
├── public/
│   └── textures/                 # UI texture assets
├── .github/
│   └── copilot-instructions.md   # This file
├── index.html
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
- `Terminal.tsx` handles all UI: messages, window controls, keyboard shortcuts, image modal, HTML preview
- State managed with React hooks (useState, useEffect)
- No routing or complex state libraries needed
- Keep component self-contained and avoid splitting into sub-components

### AI Integration Flow (Simplified 2025-09)
```
User Input → Terminal.tsx
  ↓
GeminiClient.sendMessage()
  ↓
Build full context from portfolio-data.ts (simple template formatting)
  ↓
Gemini API (gemini-2.5-flash-image-preview model)
  ↓
Response with text + optional image data
  ↓
Typed response animation → Display (with image/HTML preview if present)
```

**Note:** The architecture was simplified from 1,155 lines (3 files) to 238 lines (1 file) in Sept 2025. Removed: ContextBuilder, PortfolioDataStore, query classification, caching, token budgeting. Reason: Portfolio data is small enough to send in full context every time. See `SIMPLIFICATION_SUMMARY.md`.

### Data Management
- **portfolio-data.ts** is the single source of truth (~663 lines)
- Changes automatically flow to GeminiClient's context builder
- No intermediate transformations or caching layers

### Prompt System
- **Prompts live in markdown files** (`src/prompts/*.md`)
- **PromptLoader.ts** loads prompts at build time using Vite's `?raw` import
- Template variables (`{{fullName}}`, `{{portfolioContext}}`) replaced at runtime
- System prompt instructs AI on image generation and HTML rendering capabilities

## Key Implementation Details

### Terminal.tsx (812 lines)
**Message System:**
- Message types: `user`, `ai`, `system`
- Messages can include optional `imageData` (base64) and `imageMimeType`
- Typing animation: 30ms delay per word for AI responses

**Window Controls:**
- Window states: normal (920×600px), minimized (dock button), maximized (96vw×92vh)
- State persistence: remembers maximized state when minimizing
- Keyboard: Ctrl+L clears history, Tab cycles controls, Enter activates, Escape closes modals

**Image Modal Feature:**
- Click any AI-generated image to open full-screen lightbox
- Modal toolbar: Download, Copy to Clipboard, Zoom, Close
- Glass-morphic overlay with backdrop blur
- Escape key or click-outside to close

**HTML Preview Feature:**
- Detects `\`\`\`html` code blocks in AI responses
- Renders in sandboxed iframe below the message
- "Open Fullscreen" button opens modal with toolbar (Download HTML, Copy Code, Open in New Tab)
- DOMPurify sanitizes all HTML to prevent XSS (see `XSS_TEST_CASES.md`)

### GeminiClient.ts (238 lines)
- Model: `gemini-2.5-flash-image-preview` (supports text + image generation)
- System prompt loaded from `src/prompts/system.md` via PromptLoader
- Instructs AI it CAN generate images (responds to "show me", "visualize", etc.)
- Instructs AI it CAN generate interactive HTML (wraps in \`\`\`html)
- Conversation history: last 20 messages for context
- Full portfolio context sent every time (no optimization needed)
- Returns: `{ text: string, imageData?: string, imageMimeType?: string }`

### Styling (styles.css)
- Luxury glass-morphic design with backdrop blur
- Aluminum slate background with brushed metal textures
- OLED-style display: true black (#000) with phosphor green (#00FF41)
- GPU-accelerated animations (transform, opacity only)
- Responsive: <768px switches to mobile layout

## Common Tasks

### Update Portfolio Content
1. Edit `src/data/portfolio-data.ts`
2. Changes automatically flow to GeminiClient's context builder
3. No need to touch multiple files

### Modify AI Behavior
- **System prompt**: Edit `src/prompts/system.md` (markdown template)
- **Response guidelines**: Edit `src/prompts/response-guidelines.md`
- **Context formatting**: `src/GeminiClient.ts` method `buildSystemPrompt()` (lines ~35-150)
- **Conversation history limit**: Change `MAX_HISTORY` constant in GeminiClient.ts

### Adjust UI/UX
- Colors and animations: `src/styles.css`
- Window behavior: `src/Terminal.tsx` (window controls around lines 140-230)
- Message rendering: `src/Terminal.tsx` (typing animation, image detection)
- Modal styling: Search for `.image-modal` and `.html-modal` in styles.css

### Add New Portfolio Section
1. Add data to `src/data/portfolio-data.ts`
2. Update formatting in `GeminiClient.buildSystemPrompt()` if needed
3. That's it - simple and direct

### Modify Prompt Templates
1. Edit markdown files in `src/prompts/`
2. Use `{{variableName}}` syntax for template variables
3. PromptLoader automatically processes variables at runtime
4. Available variables: `{{fullName}}`, `{{firstName}}`, `{{portfolioContext}}`

## Important Constraints

### Keep It Simple
- App is intentionally minimal (~2500 lines total)
- No complex state management or routing
- Direct Gemini API integration (no backend)
- Single component architecture
- Architecture was deliberately simplified (Sept 2025) - don't add back complexity

### Performance Priorities
- Bundle size: ~280KB total is acceptable
- GPU acceleration: only transform/opacity animations
- Code splitting: Gemini SDK in separate chunk
- No context optimization needed (portfolio data fits in context)

### Professional Representation
- This is a live portfolio showcasing real work
- Maintain technical accuracy
- Professional yet personable tone
- No exaggeration or marketing fluff

### Security
- All HTML rendered through DOMPurify sanitization (XSS protection)
- Iframe sandbox for HTML preview
- See `XSS_TEST_CASES.md` for validation test vectors

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
- Don't re-introduce ContextBuilder/PortfolioDataStore (removed for simplicity)
- Don't add caching or query classification (unnecessary complexity)
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