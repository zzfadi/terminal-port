# DOOM — Text Edition

Create a playable DOOM-style first-person shooter rendered entirely as ASCII text characters on an HTML canvas.

## Concept

The idea: DOOM is so small it runs on everything — even a text renderer. Build a raycasting engine where every "pixel" is a typographic character. The game viewport is a grid of ASCII characters rendered via canvas `fillText`, with character density representing distance (█▓▒░·) and color representing wall type.

Use the person's data from `profile.md` for any portfolio content shown on title/death screens.

## Technical Requirements

- **Raycaster**: DDA algorithm casting one ray per screen column
- **ASCII framebuffer**: Character grid (~100x35) where each cell has a character + color
- **Canvas rendering**: All characters drawn via `fillText`, batched by color for performance
- **Monospace font**: JetBrains Mono from Google Fonts
- **Game features**: Movement (WASD + mouse look), shooting, enemies, pickups (health/ammo), minimap, HUD, death/restart
- **Map**: Multi-room level with doors (colored differently), enemy spawns, item pickups
- **Pointer lock**: For mouse look (with try-catch for iframe embedding)

## Character Palette

```
Walls (near → far):  █ ▓ ▒ ░ · .   (space)
Floor:               · ∙ : ; , .   (space)
Ceiling:             (space) . ·
Enemies:             Ψ (normal)  ╬ (hit flash)
Pickups:             + (health)  ¤ (ammo)
Weapon:              ║ ╔ ╩ ╗ ╚ ═ ╝ (box-drawing shotgun)
```

## Tech Stack

- Vanilla JS, HTML Canvas, no external dependencies except Google Fonts
- Deployable at GitHub Pages (static site)
- Responsive font sizing (fills available viewport)

## Output

Self-contained folder with `index.html`, `styles.css`, `script.js`.

## Footer

Include: `Built with {Model} — Part of the Zuabi.dev Gallery experiment`
