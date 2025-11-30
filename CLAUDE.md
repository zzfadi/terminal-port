# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## What This Repository Is

**Zuabi.dev Gallery** — A meta-portfolio showcasing AI model capabilities through landing page implementations. The same personal/professional content, interpreted by different AI models across different design aesthetics.

**Live at**: [zuabi.dev](https://zuabi.dev)

**Core concept**: Compare how different AI models (Claude Opus/Sonnet, GPT, Gemini, Grok, etc.) interpret the same design brief. Each design concept (terminal, minimal, signal) has multiple AI-generated implementations.

---

## Three-Layer Architecture

```
content/profile.md          → Single source of truth (personal/professional data)
designs/{name}/prompt.md    → Design briefs + generation prompts
pages/{design}/{model}/     → AI-generated implementations (self-contained)
```

### Layer 1: Content Source (`content/profile.md`)
- Single source of truth for all personal/professional information
- Used by design prompts to populate data
- Versioned, rarely updated
- Contains: name, role, company, education, career history, projects, skills, links

### Layer 2: Design Prompts (`designs/{name}/prompt.md`)
- Each design concept has a prompt template that references `profile.md`
- Defines aesthetic, interactions, tech stack requirements
- Used to generate new model implementations
- Must specify output format for zero-integration deployment

### Layer 3: Implementations (`pages/{design}/{model}/`)
- AI-generated pages, copy output directly into folder
- Each must be self-contained: `index.html`, `styles.css`, optional `script.js`
- No external dependencies except Google Fonts
- Must include footer attribution: `"Built with {Model} — Part of the Zuabi.dev Gallery experiment"`

---

## Gallery System

**Two-level navigation**: Design tabs (terminal/minimal/signal) + Model radios (opus/gemini/gpt/etc.)

**Config-driven**: All pages registered in `config.json` with nested `designs[].models[]` structure

**URL routing**: `zuabi.dev/#page-id` maps to `pages/{design}/{model}/`
- Example: `zuabi.dev/#terminal-opus` → `pages/terminal/opus/index.html`
- Page IDs follow format: `{design}-{model}`

**Keyboard shortcuts**:
- `G` — Toggle gallery selector
- `←/→` — Switch between designs
- `↑/↓` — Switch between models
- `Escape` — Close selector

**Prompt viewer**: Click "View design prompt" button to see the exact prompt used for current design

---

## Development

### Local Development
```bash
npx serve    # Serve from project root
# Open http://localhost:3000
```

No build step required — vanilla HTML/CSS/JS only.

### Adding a New Model Implementation

1. **Pick a design** from `designs/` (terminal, minimal, signal, etc.)
2. **Run the design prompt** with your chosen AI model (GPT, Gemini, Grok, Claude, etc.)
3. **Create folder**: `pages/{design}/{model}/`
   - Example: `pages/terminal/gpt/`
4. **Paste AI output** directly — must be self-contained with:
   - `index.html` (required)
   - `styles.css` (required)
   - `script.js` (optional)
5. **Register in `config.json`** under the appropriate design's `models` array:
   ```json
   {
     "id": "{design}-{model}",
     "model": "{Model Display Name}",
     "path": "pages/{design}/{model}/",
     "date": "YYYY-MM"
   }
   ```

**IMPORTANT**: DO NOT look at existing implementations when generating new ones. Each model should create from scratch based solely on the design prompt. This preserves the comparison experiment integrity.

### Adding a New Design

1. **Create prompt file**: `designs/{design-name}/prompt.md`
   - Must reference `content/profile.md` for data
   - Define clear aesthetic/interaction requirements
   - Specify tech stack (fonts, CSS approach)
   - Include output format requirements
2. **Register design** in `config.json`:
   ```json
   {
     "id": "{design-id}",
     "label": "{Display Name}",
     "description": "{Brief description}",
     "prompt": "designs/{design-name}/prompt.md",
     "models": []
   }
   ```
3. **Test with one model** first
4. **Generate variants** with other AI models

---

## Implementation Requirements

All AI-generated pages must meet these requirements for zero-integration deployment:

### Technical Requirements
- **Self-contained**: All HTML/CSS/JS in page folder
- **No external dependencies** except Google Fonts
- **Responsive**: Breakpoints at `640px` and `900px`
- **CSS variables**: Define colors in `:root` block (`--bg`, `--accent`, `--text-*`)
- **Semantic HTML**: Use `<article>`, `<section>`, `<nav>` for accessibility

### Content Requirements
- **Footer attribution**: `"Built with {Model} — Part of the Zuabi.dev Gallery experiment"`
- **Dark mode support**: Use `prefers-color-scheme: dark` media query
- **Data from profile.md**: All content should come from `content/profile.md`

### File Structure
```
pages/{design}/{model}/
├── index.html       # Required
├── styles.css       # Required
└── script.js        # Optional
```

---

## Key Files Reference

### Configuration
- **`config.json`** — Page registry with nested `designs[].models[]` structure
  - `default` field sets initial page on load
  - Each design has `id`, `label`, `description`, `prompt` path
  - Each model has `id`, `model` name, `path`, `date`

### Gallery System
- **`index.html`** — Gallery shell with iframe, selector UI, prompt modal
- **`gallery.js`** — Navigation logic, URL routing, keyboard shortcuts
- **`gallery.css`** — Gallery UI styling (selector, modal, loading states)

### Content & Prompts
- **`content/profile.md`** — Source of truth for personal/professional data
- **`designs/{name}/prompt.md`** — Design briefs for AI generation

### Prompts (GitHub Copilot)
- **`.github/prompts/addGalleryPage.prompt.md`** — Reusable prompt for adding pages

---

## Common Operations

### Update Personal Information
1. Edit `content/profile.md`
2. Regenerate affected pages (or note that existing pages are snapshots)
3. Consider versioning (`profile.md` → `profile-v2.md`) if major changes

### Add Implementation for Existing Design
```bash
# 1. Read design prompt
cat designs/terminal/prompt.md

# 2. Run prompt with AI model (external)

# 3. Create folder and paste output
mkdir -p pages/terminal/gpt
# Copy index.html, styles.css, script.js

# 4. Register in config.json (add to designs[].models[])
```

### Validate New Implementation
- [ ] Page loads in iframe without errors
- [ ] Self-contained (no 404s for assets)
- [ ] Footer includes model attribution
- [ ] Responsive at 640px and 900px breakpoints
- [ ] CSS variables defined in `:root`
- [ ] Registered in `config.json` with correct path
- [ ] Page ID follows `{design}-{model}` format

### Test Navigation
```bash
# Start server
npx serve

# Test URLs
http://localhost:3000/#terminal-opus
http://localhost:3000/#minimal-gemini
http://localhost:3000/#signal-gpt

# Test keyboard shortcuts
# Press G, use arrows, Escape
```

---

## Design Patterns

### URL Structure
- Main gallery: `zuabi.dev/`
- Specific page: `zuabi.dev/#page-id`
- Page ID format: `{design}-{model}` (e.g., `terminal-opus`, `minimal-gemini`)

### Config Structure
```json
{
  "default": "terminal-opus",
  "designs": [
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
        }
      ]
    }
  ]
}
```

### Gallery JavaScript Pattern
- Load `config.json` on init
- Parse URL hash for page ID (`#terminal-opus`)
- Find page in nested config structure
- Load page into iframe
- Build UI from config (tabs from designs, radios from models)
- Handle keyboard shortcuts and navigation

---

## Important Patterns from Copilot Instructions

### Zero-Integration Philosophy
AI outputs are copied directly without modification. This:
- Preserves the AI generation experiment integrity
- Avoids post-processing that obscures model capabilities
- Requires strict prompt engineering to get correct output

### Comparison Experiment Integrity
When adding new implementations:
- DO NOT look at existing implementations
- Generate from design prompt alone
- Each model should interpret independently
- Preserves fair comparison across AI models

### Self-Contained Requirement
Each page must work standalone because:
- Gallery loads pages in iframe
- No shared assets or state
- Enables independent deployment/testing
- Simplifies comparison (everything needed is in one folder)

---

## What NOT to Do

- ❌ Modify AI-generated pages after creation (breaks experiment integrity)
- ❌ Look at other model implementations when generating new ones
- ❌ Add external dependencies beyond Google Fonts
- ❌ Create non-self-contained pages (breaks iframe loading)
- ❌ Skip footer attribution (required for gallery consistency)
- ❌ Forget to register new pages in `config.json`
- ❌ Use incorrect page ID format (must be `{design}-{model}`)
- ❌ Hardcode personal data in design prompts (use `profile.md` reference)

---

## Current Designs

| Design | Description | Models | Prompt |
|--------|-------------|--------|--------|
| **Terminal** | Dark CLI aesthetic with interactive commands | 6 (Opus 4.1, Opus 4.5, Sonnet 4.5, Gemini, GPT, Grok) | `designs/terminal/prompt.md` |
| **Minimal** | Clean, modern card-based layout | 5 (Opus, Gemini, GPT, Grok, Raptor) | `designs/minimal/prompt.md` |
| **Signal** | Technical-atmospheric oscilloscope theme | 5 (Gemini, Grok, GPT, Opus, Raptor) | `designs/signal/prompt.md` |

---

## Deployment

**Platform**: GitHub Pages or Firebase Hosting

**Process**:
1. Push to repository
2. No build step required (static files only)
3. Configure custom domain (`zuabi.dev`)

**Static site requirements met**:
- All paths relative
- No server-side processing
- Config loaded via fetch from same origin
