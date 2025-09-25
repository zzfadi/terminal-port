# Copilot Instructions for OnePromptPortfolio

## Quick context
- Single-page app: all production logic lives in `terminal-portfolio.html` (HTML + CSS + large inline JS `terminal` object). No build tooling.
- Aux HTML harnesses: `test-terminal.html` (logic-unit tests with mocks) and `e2e-tests.html` (iframe-driven journeys) document expected behaviour for critical user paths.
- Existing AI guidance in `CLAUDE.md` is authoritative for tone, command roster, and content accuracy—mirror its conventions when evolving features.

## Architecture snapshot
- `terminal` object bootstraps on `DOMContentLoaded`; it wires DOM nodes (`output`, `terminal-input`), history navigation, and a virtual filesystem used by `ls/cd/cat/tree`.
- Commands are registered in `setupCommands()` as lambdas delegating to methods (e.g. `projects` → `showProjects`). Keep new commands in this map + update `showHelp()`.
- Printing flows through `printLine()` or `typeWriter()`; always send formatted HTML fragments (e.g. `<span class="success">`) to preserve neon terminal styling.
- Startup animation executes `startupSequence()` → auto-runs `neofetch`; respect this pacing when adding onboarding content.
- Matrix canvas effect is managed by `initMatrixRain()` with debounced resize logic—avoid heavy DOM operations inside the draw loop.

## Workflow tips
- Development: open `terminal-portfolio.html` directly in the browser or via `python3 -m http.server`; no bundling step.
- Smoke tests: manually exercise commands (`help`, `contact`, `ls`, etc.) after changes—especially anything touching the virtual filesystem or link handlers.
- Automated references: `test-terminal.html` covers command handlers without DOM; update mocks if you add required CLI output. `e2e-tests.html` simulates real journeys—extend journeys if you introduce new “must work” flows.

## Content & UX rules
- Portfolio voice is professional/engaging; keep messaging aligned with sections in `showAbout()`, `showExperience()`, etc. Update all related helpers when facts change.
- Link-style interactions (`contact` links, `openGitHub`, `sendEmail`) rely on `handleContactAction` dispatch—wire new link types there so keyboard/touch handlers keep working.
- Virtual files under `fileSystem` power navigation; when you add folders/files, adjust `showTree()` output and any scripted tests that assert directory listings.
- Resume download uses `generateResume()` returning plain text; if you alter fields, sync with content shown in `neofetch()` and `showContact()` to avoid drift.

## Guardrails
- Preserve single-file delivery (no external JS/CSS); if you must embed assets, inline them.
- Test on mobile breakpoints (CSS switches at 768px and toggles matrix visibility logic). Any new layout should respect the responsive flex structure.
- Don’t rename core commands without updating `CLAUDE.md`, test suites, and boot help messaging.

## When unsure
- Check `CLAUDE.md` for original rationale, tone, and backlog ideas.
- Reach out (email in `showContact()`) if a change touches professional biography or resume data that may require owner approval.
