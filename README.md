# Terminal Portfolio

A single-page, terminal-inspired portfolio for Fadi Al Zuabi. The entire experience lives in [`terminal-portfolio.html`](./terminal-portfolio.html) with inline CSS/JS—no build step or external assets required.

## Local development

```bash
python3 -m http.server 8001
```

Then open <http://127.0.0.1:8001/terminal-portfolio.html> in your browser. The matrix rain animation, command handlers, and startup sequence will load automatically.

## Test harnesses

Two browser-based harnesses document the expected behaviours:

- [`Tests/test-terminal.html`](./Tests/test-terminal.html) — unit-style checks for command outputs, filesystem navigation, and external link wiring.
- [`Tests/e2e-tests.html`](./Tests/e2e-tests.html) — iframe-driven journeys covering "learn about Fadi", "contact Fadi", and "terminal reliability" flows.

Serve the site locally (as above) and open each harness to run the suites. All tests currently pass (17/17 unit, 3/3 journeys).

## Deployment

For GitHub Pages:

1. Commit the project to the `main` branch.
2. Enable GitHub Pages in repository settings (Pages → Build and deployment → Branch: `main`, Folder: `/root`).
3. Optionally add a `CNAME` file containing `zuabi.dev` (or your custom domain) and point DNS records to GitHub’s Pages IPs.

## Release notes

- **v1.0.0** – Initial public release with matrix rain intro, comprehensive command set, and passing test harnesses.

Future v2 planning can iterate on this baseline without additional tooling changes.
