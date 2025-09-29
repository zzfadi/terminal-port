# Copilot Instructions for OnePromptPortfolio

## Repo snapshot
- Production portfolio lives in `terminal-portfolio.html` (v1). It is a single HTML file with inline CSS/JS; never split it or add build tooling.
- The new conversational prototype is under `v2/` and currently consists of just five files in `src/` (`main.ts`, `Terminal.tsx`, `GeminiClient.ts`, `portfolio.ts`, `styles.css`). Docs in `v2/ARCHITECTURE.md` and `v2/README.md` describe an older command-heavy build—ignore those when editing code.
- Serve the legacy experience via `python3 -m http.server 8001` and open `/terminal-portfolio.html`. React/Vite dev server for v2 runs with `npm run dev` inside `v2/` (expects Node ≥18 and listens on port 3002).

## Working on v1 (`terminal-portfolio.html`)
- `terminal.init()` wires input events, history/autocomplete, and calls `startupSequence()` plus `initMatrixRain()`. Keep the boot log + ASCII intro lightweight so the timed sequence stays readable.
- Commands are registered in `setupCommands()` and must print through `printLine()` or `typeWriter()` with HTML spans like `<span class="success">` to preserve styling. Update `showHelp()` and the in-browser tests when you add or rename commands.
- The virtual filesystem (`terminal.fileSystem`) drives `ls/cd/cat/tree`; modify the tree, `listDirectory()`, and any scripted expectations in `Tests/test-terminal.html` together to avoid drift.
- `handleContactAction()` centralizes outbound links; extend its switch when adding contact targets so both click and keyboard activation work.
- Manual regression checklist after changes: `help`, `about`, `experience`, `projects`, navigation commands, and outbound links in both desktop and mobile breakpoints (CSS switches at 768px).

## Working on v2 (React AI terminal)
- `main.ts` simply mounts `<Terminal />` and pulls in `styles.css`. The UI and logic live entirely inside `Terminal.tsx`; keep it self-contained and favor hooks over new global state.
- `Terminal.tsx` maintains `messages`, `input`, `isLoading`, and a `GeminiClient` instance. Responses render sequentially with a word-by-word typing effect—if you change output formatting, keep `messages` immutable and preserve the `scrollIntoView` + `Ctrl+L` clear behaviour.
- `GeminiClient` wraps `@google/genai` with model `gemini-2.0-flash-exp`, injecting portfolio context via `formatPortfolioForAI()`. Provide `VITE_GEMINI_API_KEY` (set in `.env`) before calling `sendMessage`; when adding prompts, keep replies plain-text (no Markdown) and under ~512 tokens.
- Conversation memory lives in `conversationHistory`; trim or reshape it there if you need different summarisation. Call `geminiClient.clearHistory()` when resetting transcripts.
- Portfolio content for AI answers resides in `portfolio.ts`. Update this file—and v1 content functions—together so bios, skills, and experience stay in sync across versions.
- `styles.css` defines the entire aesthetic. Respect the existing palette (#0a0a0a background, neon green accents) and responsive rules when adding UI affordances.

## Testing & tooling
- Legacy test harnesses are browser pages under `Tests/`; open them after serving v1 to verify command outputs and journeys.
- The v2 `package.json` still lists the historic Jest/Playwright stack, but the current five-file build has no tests. Run `npm run build` after edits to ensure Vite + TypeScript succeed, and trim scripts only once you update the tooling.

## Source of truth
- Keep messaging consistent with `CLAUDE.md` and `Docs/PORTFOLIO_CONTENT.md`; both still track Fadi’s official bio. Update contact links in `showContact()` and `portfolio.ts` together.
- Flag obviously stale docs (e.g., `v2/ARCHITECTURE.md`) when touching them rather than quietly relying on them—they predate the conversational rewrite.
