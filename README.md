# Zuabi.dev Gallery

A meta-portfolio showcasing **AI model capabilities** through different landing page implementations. Same content, different designs, multiple AI interpretations per design.

🌐 **Live at [zuabi.dev](https://zuabi.dev)**

## Concept

This gallery explores how different AI models interpret the same design brief. Each design concept (terminal, minimal, signal) is implemented by multiple AI models, creating a unique comparison of AI-generated web pages.

## Three-Layer Architecture

```
├── content/
│   └── profile.md              # Layer 1: Source of truth
├── designs/
│   ├── terminal/prompt.md      # Layer 2: Design prompts
│   ├── minimal/prompt.md
│   └── signal/prompt.md
├── pages/
│   ├── terminal/               # Layer 3: AI implementations
│   │   ├── opus-legacy/        # Claude Opus 4.1 (original)
│   │   ├── opus/               # Claude Opus 4.5
│   │   ├── gemini/             # Gemini 3 Pro
│   │   └── ...
│   ├── minimal/
│   └── signal/
└── gallery.{js,css}            # Navigation system
```

## Features

- **Two-level navigation**: Design tabs + Model radios
- **Keyboard shortcuts**: `G` toggle gallery, arrows to navigate, `Escape` to close
- **Prompt viewer**: See the exact prompt used to generate each design
- **URL routing**: `zuabi.dev/#page-id` for direct linking
- **Self-contained pages**: Each AI output is standalone

## Current Designs

| Design | Description | Models |
|--------|-------------|--------|
| Terminal | Dark CLI aesthetic with interactive commands | 6 |
| Minimal | Clean, modern card-based layout | 1 |
| Signal | Technical-atmospheric oscilloscope theme | 5 |

## Development

```bash
npx serve    # Serve locally
# Open http://localhost:3000
```

No build step required—vanilla HTML/CSS/JS only.

## Adding New Pages

See [.github/copilot-instructions.md](.github/copilot-instructions.md) for detailed instructions.

---

*Built as an experiment in AI-assisted development*
