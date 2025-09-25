# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
This is a single-file interactive terminal portfolio website that simulates a Unix-like terminal environment for Fadi Al Zuabi's professional portfolio. The entire application is contained within `terminal-portfolio.html` - a self-contained HTML file with embedded CSS and JavaScript, requiring no build process or external dependencies.

## Core Purpose
- Showcase Fadi's technical skills through an interactive terminal interface
- Demonstrate proficiency in web development, firmware engineering, and AI/ML
- Provide an engaging, unique portfolio experience that stands out
- Allow visitors to explore qualifications using familiar command-line paradigms

## Architecture

### Single HTML File Design
- **File**: `terminal-portfolio.html` 
- **Size**: ~50KB (optimized for fast loading)
- **Dependencies**: None - fully self-contained
- **Compatibility**: Modern browsers (Chrome, Firefox, Safari, Edge)

### Component Structure
```
terminal-portfolio.html
├── HTML Structure (Terminal UI)
├── CSS Styles (Embedded)
│   ├── Terminal aesthetics (green-on-black)
│   ├── Animations (glow, blink, matrix)
│   └── Responsive design
└── JavaScript (Embedded)
    ├── Terminal object (core logic)
    ├── Command system
    ├── Virtual file system
    └── Matrix rain effect
```

## Key Components

### Terminal Core (`terminal` object)
```javascript
terminal = {
    output: DOM element,        // Terminal output display
    input: DOM element,         // User input field
    history: [],               // Command history array
    commands: {},              // Command function registry
    fileSystem: {},           // Virtual directory structure
    currentPath: string,      // Current directory path
    // Core methods...
}
```

### Command System
Commands are registered in `setupCommands()` and follow this pattern:
```javascript
commandName: (args) => this.functionName(args)
```

**Available Commands:**
- **Info**: `about`, `skills`, `experience`, `projects`, `education`, `ai`, `firmware`
- **Navigation**: `ls`, `cd`, `cat`, `pwd`, `tree`
- **Contact**: `contact`, `github`, `linkedin`, `email`
- **System**: `clear`, `history`, `date`, `neofetch`, `whoami`
- **Special**: `matrix`, `quote`, `download cv`

### Virtual File System
```javascript
fileSystem: {
    'projects': {
        'solidigm': { /* .md files */ },
        'ge-aviation': { /* .md files */ },
        'personal': { /* .md files */ }
    },
    'skills': { /* .txt files */ },
    'docs': { /* .pdf, .md files */ }
}
```

## Development Guidelines

### Adding New Commands
1. Add to `setupCommands()` method:
```javascript
this.commands.newCommand = (args) => this.handleNewCommand(args);
```

2. Implement handler function:
```javascript
handleNewCommand(args) {
    // Validate args if needed
    // Generate output
    this.printLine('<span class="success">Output text</span>');
}
```

3. Update help text in `showHelp()` function

### Modifying Content

#### Personal Information
- `showAbout()`: Bio and current role
- `showContact()`: Contact details
- `neofetch()`: System info display

#### Professional Content
- `showExperience()`: Work history (keep chronological)
- `showSkills()`: Technical competencies (group by category)
- `showProjects()`: Featured projects (highlight impact)
- `showEducation()`: Academic background

#### File System Content
Modify `fileSystem` object to add/remove virtual files:
```javascript
fileSystem.projects.newproject = {
    'README.md': 'Project description...',
    'tech-stack.txt': 'Technologies used...'
}
```

### Styling Guidelines

#### Color Scheme
```css
--terminal-green: #00ff41;     /* Primary text */
--terminal-bg: #0a0e27;        /* Background */
--error-red: #ff0041;          /* Errors */
--info-blue: #00aaff;          /* Information */
--warning-yellow: #ffaa00;     /* Warnings */
--success-green: #00ff88;      /* Success messages */
```

#### CSS Classes
- `.terminal-line`: Individual output lines
- `.prompt`: Command prompt styling
- `.command`: User-entered commands
- `.output`: Command output
- `.highlight`: Emphasized text
- `.dim`: De-emphasized text
- `.section-header`: Section titles

### JavaScript Best Practices

#### Output Formatting
```javascript
// Success message
this.printLine('<span class="success">Operation completed</span>');

// Error message
this.printLine('<span class="error">Error: File not found</span>');

// Section with header
this.printLine('<span class="section-header">Section Title</span>');
```

#### Async Operations
```javascript
async typeWriter(text, speed = 50) {
    // Use for dramatic effect during startup
    await this.delay(speed);
}
```

#### Event Handling
- Enter key: Execute command
- Arrow Up/Down: Navigate history
- Tab: Autocomplete
- Ctrl+L: Clear screen

## Common Development Tasks

### Running the Portfolio
```bash
# Simply open the HTML file in a browser
open terminal-portfolio.html

# Or use a local server for testing
python3 -m http.server 8000
# Then navigate to http://localhost:8000/terminal-portfolio.html
```

### Quick Testing Commands
Since this is a single HTML file with no build process:
- **Test in Browser**: Open directly in browser or use developer tools console
- **Validate HTML**: Use W3C validator or browser developer tools
- **Check Performance**: Use browser's Lighthouse tool
- **Test Commands**: Type `help` in the terminal to see all available commands

## Testing Checklist

### Functionality Tests
- [ ] All commands execute without errors
- [ ] File system navigation works (`cd`, `ls`, `cat`)
- [ ] Command history navigation works
- [ ] Tab autocomplete functions properly
- [ ] External links open correctly
- [ ] Download CV generates file

### Content Validation
- [ ] Contact information is current
- [ ] Experience section is up-to-date
- [ ] Skills reflect current expertise
- [ ] Projects showcase best work
- [ ] No typos or formatting issues

### Browser Compatibility
- [ ] Chrome/Chromium
- [ ] Firefox
- [ ] Safari
- [ ] Edge
- [ ] Mobile browsers (responsive check)

## Performance Optimization

### Current Optimizations
- Single file (no network requests)
- Minimal DOM manipulation
- Efficient animation loops
- Lazy loading of content

### Potential Improvements
- Implement virtual scrolling for large outputs
- Add command output pagination
- Cache frequently accessed content
- Optimize matrix rain animation for mobile

## Deployment

### Static Hosting Options
1. **GitHub Pages**: Direct HTML file serving
2. **Netlify**: Drag-and-drop deployment
3. **Vercel**: Instant deployment
4. **Firebase Hosting**: With custom domain
5. **Personal Server**: Apache/Nginx

### Deployment Steps
```bash
# No build required - just upload the HTML file
# For GitHub Pages:
git add terminal-portfolio.html
git commit -m "Update portfolio"
git push origin main
```

## Future Enhancements

### Planned Features
- [ ] Save terminal session to localStorage
- [ ] Add more interactive games/demos
- [ ] Implement actual file upload/download
- [ ] Add syntax highlighting for code display
- [ ] Create theme switcher (different terminal themes)
- [ ] Add sound effects (optional, with toggle)
- [ ] Implement a real mini Snake game
- [ ] Add API integration for live GitHub stats

### Content Updates
- [ ] Add blog post reader (`blog` command)
- [ ] Include testimonials section
- [ ] Add project screenshots/demos
- [ ] Include certification badges
- [ ] Add conference talk links

## Maintenance

### Regular Updates
- **Monthly**: Update experience and projects
- **Quarterly**: Refresh skills and certifications
- **Annually**: Review entire content for relevance

### Version Control
Track changes with semantic versioning in terminal header:
```javascript
// Current: Terminal v2.0
// Format: Terminal v[MAJOR].[MINOR]
```

## Troubleshooting

### Common Issues

#### Commands Not Working
- Check command spelling in `setupCommands()`
- Verify function exists and is properly bound
- Check browser console for JavaScript errors

#### Styling Issues
- Verify CSS color variables are defined
- Check for conflicting styles
- Test in different browsers

#### Performance Issues
- Reduce matrix rain opacity or disable
- Optimize animation frame rates
- Limit terminal output history

## AI Assistant Instructions

When modifying this portfolio:
1. **Preserve the single-file architecture** - Don't split into multiple files
2. **Maintain terminal authenticity** - Keep Unix-like command structure
3. **Update content holistically** - Ensure consistency across all commands
4. **Test interactively** - Verify commands work before finalizing
5. **Keep it professional** - This represents Fadi's professional brand
6. **Optimize for engagement** - Make it fun and interactive while informative

## Contact for Questions

For questions about this implementation:
- **Email**: fadi.b.zuabi@gmail.com
- **GitHub**: @fadizuabi
- **LinkedIn**: /in/fadi-zuabi

---

*This terminal portfolio showcases the intersection of traditional engineering excellence and modern web development, reflecting Fadi's journey from firmware to full-stack with AI integration.*