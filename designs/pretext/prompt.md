# Design

Create a portfolio page for the person in the attached `profile.md`.

## Concept

"Measured Typography"

Aesthetic: Text-as-canvas, kinetic typography powered by real-time text measurement

The Insight: This design showcases the **Pretext** library (https://github.com/chenglou/pretext) — a pure JS text measurement engine that calculates text dimensions without DOM reflows. The page itself becomes a demonstration of what Pretext enables: text that knows its own geometry, reflows dynamically, and renders on canvas with pixel-perfect awareness.

Visual Direction:

- Layout: Canvas-rendered typography as hero, with traditional DOM sections below. The contrast between canvas-rendered text (powered by Pretext) and normal HTML text is intentional.
- Typography: Use a clean, measurable font like **Inter** or **Space Grotesk** for all text. The font choice matters because Pretext measures it — use a single named font (not `system-ui`) for reliable measurement.
- Color: Light mode primary, dark mode supported. Minimal palette — off-white background (#fafaf9), near-black text (#1c1917), one accent color (#2563eb blue) used to visualize measurement data (bounding boxes, baselines, line widths).
- The Hook: The hero section is a full-width `<canvas>` where the user's name, tagline, and bio are rendered using Pretext's layout engine. As the browser resizes, text reflows in real-time on canvas — visually showing line breaks recalculating, bounding boxes adjusting, and text metrics updating.

Visual Elements:

- **Measurement overlays**: Subtle visualization of text bounding boxes, baseline positions, and line-height guides drawn on canvas alongside the text — like looking at typography through an engineer's lens
- **Live metrics panel**: A small floating panel showing real-time Pretext output: `lineCount`, `height`, `layout time (ms)` — updating as the viewport changes
- **Reflow animation**: When the window resizes, text on the canvas visibly reflows with a brief highlight animation on changed lines
- **Width scrubber**: An interactive slider that controls the `maxWidth` parameter passed to Pretext's `layout()`, letting visitors see how text reflows at different widths — this is the key interactive demo

Motion: Purposeful and data-driven. Text reflow is the animation. No decorative motion — every visual change reflects an actual Pretext computation. Line breaks should feel precise and mechanical, not bouncy.

The Hero Experience:

- Full-width canvas fills the viewport
- Name rendered large (48-64px) with visible bounding box overlay
- Tagline below with baseline guides shown
- Bio paragraph demonstrating multi-line layout with line-break indicators
- Width scrubber at the bottom of the hero lets visitors drag to see reflow
- Tiny metrics readout: "3 lines · 127px height · 0.04ms layout"

Sections flow:

1. **Hero**: Canvas-rendered name + tagline + bio with measurement overlays and width scrubber
2. **How It Works**: Brief explanation of Pretext — "Text measured without touching the DOM" — with before/after comparison (DOM reflow cost vs Pretext cost)
3. **Career**: Timeline rendered using Pretext to pre-calculate card heights for a masonry-style layout (cards are DOM elements, but heights are pre-computed)
4. **Skills**: Tag cloud where Pretext measures each tag's width to pack them efficiently (no CSS flexbox wrapping — manual Pretext-powered bin packing)
5. **Connect**: Contact links with a footer

## Technical Requirements

### Pretext Integration

Load Pretext from CDN. Use ES module import:

```html
<script type="module">
import { prepare, layout, prepareWithSegments, layoutWithLines } from 'https://esm.sh/pretext@0.3.0';
</script>
```

Key Pretext APIs to use:

- `prepare(text, font)` + `layout(prepared, maxWidth, lineHeight)` — for height-only measurement (career cards, skill tags)
- `prepareWithSegments(text, font)` + `layoutWithLines(prepared, maxWidth, lineHeight)` — for the hero canvas rendering (need individual line data)

### Canvas Rendering

The hero section should use an HTML `<canvas>` element. Use Pretext to compute line breaks and positions, then draw text with `ctx.fillText()` at the computed coordinates. This demonstrates that Pretext decouples measurement from rendering.

### Measurement Overlays

Draw semi-transparent rectangles showing:
- Line bounding boxes (light accent color, ~10% opacity)
- Baseline positions (thin horizontal lines)
- Total paragraph bounding box (dashed outline)

These overlays should be toggleable via a small "Show measurements" checkbox.

### Width Scrubber

An `<input type="range">` that controls the `maxWidth` parameter. Range: 200px to canvas width. On change, re-run `layout()` and re-render the canvas. Display the current maxWidth value.

### Performance Display

Show Pretext's performance characteristics visibly:
- `prepare()` time (one-time cost)
- `layout()` time (per-reflow cost)
- Compare against equivalent DOM measurement (use `performance.now()` around a hidden element measurement for comparison)

## Tech Stack

- Vanilla HTML/CSS/JS (ES modules, no bundler)
- Google Fonts: Inter
- External dependency: Pretext via `https://esm.sh/pretext@0.3.0`
- CSS variables in `:root` for colors
- Canvas API for hero text rendering
- Responsive at 640px and 900px breakpoints

## Output

Self-contained folder with `index.html`, `styles.css`, `script.js`.

The `script.js` should use ES module imports (loaded via `<script type="module" src="script.js">`).

## Integration

- Footer: "Built with {Model} — Part of the Zuabi.dev Gallery experiment"
- External dependencies: Google Fonts + Pretext (via esm.sh CDN)

## Important Notes

- Use a **named font** (Inter), not `system-ui` — Pretext measurement is unreliable with system-ui on macOS
- The page should gracefully degrade if Pretext fails to load — show the same content as regular HTML text
- The canvas should be high-DPI aware (use `devicePixelRatio` for sharp text on retina displays)
- Keep the "How It Works" section brief — this is a portfolio page, not Pretext documentation
