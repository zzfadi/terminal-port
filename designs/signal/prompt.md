# Design

Create a portfolio page for the person in the attached `profile.md`.

## Concept

"Signal Through Noise"

  Aesthetic: Technical-atmospheric, oscilloscope-meets-human-story

  The Insight: Your life has been about finding signal in noise - literally (firmware debugging, waveform analysis) and metaphorically (clarity through chaos, Syria → stability). You've learned to read patterns others miss.

  Visual Direction:

- Layout: Full-bleed, immersive. The page IS the experience.
- Typography: Technical display font like Space Mono or Fira Code for headers, but with custom letter-spacing that breathes. Body text in something unexpectedly warm like Source Serif Pro.
- Color: Dark mode with depth. Not flat black - think layered darkness (#0d1117 → #161b22 → #21262d). Accent: electric cyan (#00d9ff) that pulses like a signal - but used SPARINGLY.
- The Hook: The page opens with animated noise/static that gradually resolves into clarity as you scroll. The noise represents chaos (Syria, financial crisis, scattered projects). The clarity is your current state.

  Visual Elements:

- Subtle waveform graphics that respond to scroll position
- A persistent "signal strength" indicator that increases as you scroll deeper
- Grid lines that feel like oscilloscope divisions
- Glitch effects on hover - controlled chaos

  Motion: More dynamic than Concept 1. Elements emerge from noise. Text types itself like terminal output. But everything is PURPOSE-DRIVEN, not decorative.

  The Hero Experience:

- Screen filled with animated static/noise
- Your name emerges from the noise, letter by letter
- Subtitle fades in: "Firmware Engineer. AI Champion. Builder."
- As you scroll, noise fades, signal clarifies

  What makes it memorable: It's experiential. The visitor FEELS your journey - chaos to clarity, noise to signal. It's technically impressive (you built this) while being emotionally resonant (this is your story).

  Sections flow:

  1. Hero: Noise → Name → Clarity (animated)
  2. Journey: Horizontal scroll timeline with "signal points" at key moments
  3. Domains: Three columns emerge from static - Firmware | AI | Teaching
  4. Proof: Terminal-style output showing real metrics
  5. Connect: "Transmit" button with waveform animation
  
## Tech Stack

- Vanilla HTML/CSS (no JS required)
- Google Fonts: Inter
- CSS variables in `:root` for colors
- Responsive at 640px and 900px breakpoints

## Output

Self-contained folder with `index.html`, `styles.css`.

## Integration

- Footer: "Built with {Model} — Part of the Zuabi.dev Gallery experiment"
- No external dependencies except Google Fonts
