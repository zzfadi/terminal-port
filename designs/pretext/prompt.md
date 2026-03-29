# Design

Create a portfolio page for the person in the attached `profile.md`.

## Concept

"Liquid Typography"

Aesthetic: Full-canvas kinetic text — every word rendered algorithmically, flowing and alive.

The Insight: This design uses the **Pretext** library (https://github.com/chenglou/pretext) to lay out text with **per-line variable widths** — something impossible with DOM layout. Instead of static paragraphs, text becomes a living medium: it waves, wraps around your cursor, forms shapes, and reflows at 60fps. The entire page is a single `<canvas>` experience where scrolling reveals different Pretext-powered text effects.

Don't just explain Pretext — USE it. The page should feel like text is a physical material that moves, breathes, and responds to interaction.

## Visual Direction

- **Full-screen canvas** — All text rendered on canvas, not DOM. The canvas is `position: fixed` and covers the viewport. Scroll position drives which content section is visible.
- **Dark background** — Near-black (#050505) with colorful text and ambient glow effects.
- **Gradient-colored text** — Each line gets a different HSL hue. Use a spectrum (violet → cyan → emerald) that shifts with scroll and time. Only possible on canvas.
- **Floating character particles** — Background filled with drifting single characters from the profile data, each with its own hue cycling through the spectrum. Characters scatter when cursor approaches.
- **Color-shifting glow** — Radial gradients with rotating hues that follow the cursor or orbit when idle. Use dual complementary-color glows for depth.
- **Font**: Use a single bold, geometric display font like **Syne** (Google Fonts). Not a generic font — something with character.

## Sections (scroll-driven)

The page is one continuous canvas. A spacer div provides scroll height (~400vh). Scroll position determines which section is visible, with smooth crossfade transitions.

### 1. Hero (scroll 0–1vh)
Name rendered LARGE (80–100px, weight 800). Tagline below. Bio paragraph below that.

**Effect: Sinusoidal wave + cursor force field.**
- Each line's `maxWidth` is modulated by `sin(lineY + time)`, creating a flowing wave that continuously reshapes the text.
- When the cursor hovers, a circular force field pushes text away — lines near the cursor get shorter maxWidths and shift laterally. The displacement uses cubic easing for a snappy feel.
- Use `layoutNextLine()` (or fallback) with a DIFFERENT `maxWidth` for every single line on every frame. This is the core Pretext capability.
- When idle (no cursor), the wave is the primary animation — text flows organically without interaction.

### 2. Career (scroll 1–2.5vh)
Career entries revealed progressively as you scroll deeper.

**Effect: Zigzag / diagonal wave.**
- Each line's x-offset follows a triangular wave pattern, creating text that flows diagonally.
- Each career entry has a different phase offset so they don't move in sync.
- Dates rendered in muted color, titles in warm accent (orange-gold), descriptions in muted text.

### 3. Skills (scroll 2–3.5vh)
All skills concatenated with `·` separators into a single paragraph.

**Effect: Circular text shape.**
- The `maxWidth` for each line is calculated as the chord of a circle: `2 * sqrt(R² - dy²)`.
- Text fills a circle — narrow at top/bottom, wide in the middle.
- The radius pulsates with `sin(time)`.
- Lines outside the circle radius get `maxWidth: 0` and are skipped.
- Text centered horizontally within the circle.

### 4. Connect (DOM, after canvas)
Simple DOM section at the bottom with contact links. Appears after canvas fades out.

## Technical Requirements

### Pretext Integration

Load from CDN via ES module:
```js
const pt = await import('https://esm.sh/pretext@0.3.0');
```

**Core pattern** — for each text block, on each frame:
1. `prepareWithSegments(text, fontString)` — one-time preparation (cache the result)
2. For each line: compute a `maxWidth` from the effect function (wave, zigzag, circle)
3. `layoutNextLine(prepared, offset, maxWidth, lineHeight)` — Pretext calculates where this line breaks
4. Draw the line text at the computed position with `ctx.fillText()`
5. Advance `offset` to `nextOffset`, repeat until text is consumed

**Graceful fallback** — if Pretext fails to load, implement manual word-wrapping using `ctx.measureText()`. The visual effects should work identically; Pretext just does the line-breaking faster and more accurately.

### Particle System

~80–100 floating characters. Each has: position, velocity, character, font size, alpha (very low: 0.02–0.08), hue. Update each frame:
- Drift with velocity, wrap at screen edges
- Repel from cursor (force inversely proportional to distance)
- Dampen velocity to prevent chaos
- Slowly cycle hue for color variation

### Render Loop

Use `requestAnimationFrame` continuously. On each frame:
1. Clear canvas, fill background
2. Draw particles (behind text)
3. Draw ambient glow (color-shifting radial gradients)
4. Calculate section visibility from `scrollY` — each section fades in/out
5. Render visible section's text with its unique displacement effect
6. All text uses per-line gradient color via `ctx.fillStyle = hsl(...)` before each `fillText`

### Responsive

Scale all font sizes proportionally to viewport width:
- `< 500px`: 50% of base sizes
- `500–800px`: 70% of base sizes
- `> 800px`: full sizes

Touch support: `touchmove` updates cursor position (enables displacement on mobile). `touchend` clears it. Use `{ passive: true }` to not block scrolling.

## Tech Stack

- Vanilla HTML/CSS/JS (ES modules, no bundler)
- Google Fonts: Syne (weights 400–800)
- External dependency: Pretext via `https://esm.sh/pretext@0.3.0`
- Canvas API for all text rendering
- Responsive at all viewport sizes

## Output

Self-contained folder with `index.html`, `styles.css`, `script.js`.

## Footer

Include: `Built with {Model} — Part of the Zuabi.dev Gallery experiment`

## Important Notes

- Use a **named font** (Syne), not `system-ui` — Pretext needs reliable font metrics
- The page must gracefully degrade if Pretext fails to load — use canvas `measureText` for fallback line-breaking
- Canvas must be high-DPI aware (use `devicePixelRatio`)
- The wave animation should run continuously — the page should look impressive even without hovering
- DON'T build a tech demo with labels and metrics — build something beautiful where the effects speak for themselves
