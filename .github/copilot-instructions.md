# fadi-landing — AI Coding Instructions

A meta-portfolio showcasing **AI model capabilities** through different landing page implementations. Same content, different designs, multiple AI interpretations per design.

## Three-Layer Architecture

```
├── content/
│   └── profile.md              # Layer 1: Source of truth (versioned, rarely changes)
├── designs/
│   ├── terminal/prompt.md      # Layer 2: Design concepts + generation prompts
│   ├── minimal/prompt.md
│   └── {new-design}/prompt.md
├── pages/
│   ├── terminal/               # Layer 3: Nested by design → model
│   │   ├── opus/
│   │   ├── gemini/
│   │   └── gpt/
│   ├── minimal/
│   │   └── gemini/
│   └── {design}/{model}/
├── index.html                  # Gallery shell with iframe
├── gallery.{js,css}            # Navigation system
└── config.json                 # Page registry
```

### Layer 1: Content Source (`content/profile.md`)
Single source of truth for all personal/professional data. Versioned, rarely updated.
- Name, role, location, company
- Social links, contact info
- Projects with descriptions and tech stacks
- Skills by category with experience levels

### Layer 2: Design Prompts (`designs/{name}/prompt.md`)
Each design concept has a prompt template that references `profile.md` data.
- Design philosophy and aesthetic goals
- Required sections and interactions
- Output format requirements for zero-integration deployment

### Layer 3: Implementations (`pages/{design}/{model}/`)
AI-generated pages. Each is standalone—copy model output directly into folder.

## Adding a New Implementation

1. Pick a design from `designs/` and run its prompt with your chosen model
2. Create folder: `pages/{design}/{model}/` (e.g., `pages/terminal/gpt/`)
3. Paste AI output directly—must be self-contained with `index.html`, `styles.css`, optional `script.js`
4. Register in `config.json` under the appropriate design:
   ```json
   {
     "id": "terminal",
     "label": "Terminal",
     "description": "Dark terminal aesthetic with interactive CLI",
     "prompt": "designs/terminal/prompt.md",
     "models": [
       {
         "id": "terminal-opus",
         "model": "Claude Opus 4.5",
         "path": "pages/terminal/opus/",
         "date": "2025-11"
       },
       {
         "id": "terminal-gpt",
         "model": "GPT-4o",
         "path": "pages/terminal/gpt/",
         "date": "2025-11"
       }
     ]
   }
   ```

## Implementation Output Requirements

For zero-integration deployment, AI-generated pages must:

1. **Be self-contained**: All HTML/CSS/JS in the page folder, no external dependencies except Google Fonts
2. **Include footer attribution**: `"Built with {Model} — Part of the Zuabi.dev Gallery experiment"`
3. **Support dark mode**: Use `prefers-color-scheme: dark` media query
4. **Be responsive**: Breakpoints at `640px` and `900px`
5. **Use CSS variables**: Define colors in `:root` block (`--bg`, `--accent`, `--text-*`)
6. **Use semantic HTML**: `<article>`, `<section>`, `<nav>` for accessibility

## Gallery System

Two-level navigation: **Design tabs** (terminal, minimal, etc.) + **Model radios** (opus, gemini, gpt)

- **URL routing**: `fadi.dev/#page-id` maps to `pages/{design}/{model}/`
- **Keyboard**: `G` toggles selector, `←/→` switch designs, `↑/↓` switch models, `Escape` closes
- **Prompt viewer**: Click "View design prompt" to see the prompt used for current design
- **Config-driven**: `gallery.js` reads `config.json` with `designs[].models[]` hierarchy

## Development

```bash
npx serve    # Serve from project root
# Open http://localhost:3000
```

No build step—vanilla HTML/CSS/JS only. Deploy to GitHub Pages or Firebase Hosting.

## Creating a New Design

1. Create `designs/{design-name}/prompt.md`
2. Include in prompt:
   - Reference to `content/profile.md` for data
   - Clear aesthetic/interaction requirements
   - Output format matching implementation requirements above
3. Add design entry to `config.json` with empty `models: []` and `prompt` path
4. Test with one model, then generate variants with others
