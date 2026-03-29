# DOOM Fire

Create a portfolio page for the person in the attached `profile.md`.

## Concept

Recreate the classic PSX DOOM fire effect — the iconic bottom-up flame propagation algorithm — but rendered entirely with colored text characters (ASCII/Unicode block elements like ░▒▓█). The fire should fill the screen as a living, animated background.

Portfolio content (name, role, skills, career, projects, links) should be presented as sections that float above or emerge from the flames, styled to look like DOOM's UI (blocky, bold, red/orange text on dark backgrounds, reminiscent of the DOOM title screen and HUD).

### Key Elements

1. **The Fire Algorithm**: Implement the classic DOOM fire spread algorithm:
   - A grid of intensity values (0 = cold/black, max = hot/white)
   - Bottom row initialized to max intensity
   - Each frame, fire spreads upward with random wind/decay
   - Map intensity to a fire color palette (black → dark red → red → orange → yellow → white)
   - Render each cell as a colored text character (use block elements: ░▒▓█ or similar)

2. **Portfolio as DOOM HUD**: Present portfolio sections styled like the DOOM game interface:
   - Name/title as a large DOOM-style header (blocky, embossed text)
   - Stats displayed like the DOOM status bar (health/armor/ammo style)
   - Career timeline as "level progression"
   - Skills as "weapons inventory"
   - Projects as "achievements/kills"

3. **Interactivity**:
   - Fire responds to mouse movement (wind direction follows cursor)
   - Clicking intensifies the fire at that location
   - Scrolling reveals portfolio sections rising from the flames
   - Optional: keyboard shortcut to toggle "GOD MODE" (IDDQD) that changes the color scheme

4. **Sound-free**: No audio, purely visual

## Tech Stack

- Vanilla HTML/CSS/JS only
- Canvas for the fire text rendering (performance)
- No external dependencies except Google Fonts
- Responsive at 640px and 900px breakpoints

## Output

Self-contained folder with `index.html`, `styles.css`, `script.js`.

## Footer

Include: `Built with {Model} — Part of the Zuabi.dev Gallery experiment`
