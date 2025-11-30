---
name: addGalleryPage
description: Guide for adding a new design or model implementation to a gallery-based portfolio.
argument-hint: Specify whether adding a "design" or "implementation", and provide the name/model.
---
# Add New Gallery Page

Help me add a new ${design or implementation} to my Zuabi.dev gallery portfolio.

## If Adding a New Design

1. Create a prompt file at `designs/${design-name}/prompt.md` containing:
   - Reference to the content source file for data
   - Tech stack requirements (fonts, CSS approach)
   - Integration requirements (footer attribution, responsive breakpoints)

2. Register the design in `config.json`:
   ```json
   {
     "id": "${design-id}",
     "label": "${Display Name}",
     "description": "${Brief description}",
     "prompt": "designs/${design-name}/prompt.md",
     "models": []
   }
   ```

## If Adding a Model Implementation

1. Generate the page by running the design prompt with the chosen AI model. 
2. DO NOT look at existing implementations—create from scratch and from your inspiration.
3. Create folder: `pages/${design}/${model}/` (nested structure)
4. Save output files: `index.html`, `styles.css`, `script.js` (if needed)
5. Register in `config.json` under the design's `models` array:
   ```json
   {
     "id": "${design}-${model}",
     "model": "${Model Display Name}",
     "path": "pages/${design}/${model}/",
     "date": "${YYYY-MM}"
   }
   ```

## Validation Checklist

- [ ] Page is self-contained (no external dependencies except fonts)
- [ ] Footer includes model attribution
- [ ] Responsive at specified breakpoints
- [ ] CSS variables defined in `:root`
- [ ] Registered in config.json
- [ ] Does not contain any sensitive or private information
