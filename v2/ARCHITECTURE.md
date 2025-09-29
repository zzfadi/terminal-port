# OnePromptPortfolio V2 Architecture

## Overview

OnePromptPortfolio V2 is a luxury AI-powered terminal portfolio featuring a premium aluminum slate design with glass-morphic UI elements. The system combines cutting-edge visual aesthetics with natural language processing through Google's Gemini API, intelligent context management, and comprehensive portfolio data integration.

## Current Architecture (2025)

### Core Stack
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite 7
- **AI Integration**: Google Gemini API (gemini-2.5-flash)
- **Styling**: Advanced CSS with glass-morphism and aluminum textures
- **State Management**: React hooks (useState, useEffect)
- **Animation**: GPU-accelerated CSS transitions and keyframes

### Project Structure
```
v2/
├── src/
│   ├── main.ts                    # React app entry point (20 lines)
│   ├── Terminal.tsx               # Main terminal UI component (~250 lines)
│   ├── GeminiClient.ts           # Gemini API integration (99 lines)
│   ├── portfolio.ts              # Legacy portfolio data (161 lines)
│   ├── styles.css                # Luxury terminal design (~870 lines)
│   │
│   ├── ai/                       # AI Context System
│   │   ├── core/
│   │   │   ├── PortfolioDataStore.ts    # Data management (685 lines)
│   │   │   └── ContextBuilder.ts        # Context optimization (371 lines)
│   │   │
│   │   └── commands/
│   │       └── AICommands.ts            # Simplified command helpers (183 lines)
│   │
│   └── data/
│       └── portfolio-data.ts            # Unified portfolio data (722 lines)
│
├── dist/                         # Production build output
├── index.html                    # Minimal HTML entry with meta tags
├── package.json                  # Minimal dependencies
├── vite.config.ts               # Optimized build configuration
└── tsconfig.json                # TypeScript configuration
```

## Luxury UI Design System

### Visual Architecture

#### 1. Aluminum Slate Background
- **Color Palette**: Light greenish-blue (#7FADA9) with gradient variations
- **Texture Layers**:
  - Multi-layer radial gradients for depth
  - Anisotropic brushed metal texture (3 directional patterns)
  - Premium noise texture overlay
  - Subtle shimmer animation (opacity-based)
- **Performance**: GPU-accelerated with `translateZ(0)` and `will-change`

#### 2. Glass-Morphic Terminal
- **Glass Effects**:
  - 20px backdrop blur with 180% saturation
  - Multi-layer glass refraction
  - Chromatic aberration on edges
  - Floating animation (subtle 1px movement)
- **Shadow System**:
  - Multiple box-shadow layers for depth
  - Inset shadows for glass thickness
  - Dynamic shadows on hover/focus

#### 3. OLED Display Technology
- **Display Characteristics**:
  - True black background (#000000)
  - Phosphor green text (#00FF41) with multi-layer glow
  - CRT-style subtle scanlines
  - Deep black enhancement with inset shadows
- **Typography**:
  - SF Mono primary with cascading fallbacks
  - Subpixel antialiasing for crispness
  - Variable font weight (450)
  - Ligatures and contextual alternates enabled

### Window Control System

#### Mac-Style Controls
- **Layout**: Left-aligned (Mac position)
- **Controls**:
  - 🔴 Close: Clears chat and minimizes
  - 🟡 Minimize: Preserves state and minimizes
  - 🟢 Maximize: Toggles between normal (920×600) and full (96vw×92vh)
- **Interactions**:
  - Hover: 1.3x brightness with glow shadow
  - Focus: Green outline for accessibility
  - Keyboard: Enter key activation

#### Dock Button (Minimized State)
- **Design**:
  - Glass-morphic button with aluminum gradient
  - 80×80px with 18px border radius
  - Backdrop blur and saturation filters
- **Animations**:
  - Bounce-in entrance (0.8s elastic)
  - Hover lift and scale
  - Pulsing icon glow (2s cycle)

### Animation System

#### Core Animations
```css
- metalShimmer: Subtle opacity pulse for aluminum
- glassFloat: Gentle floating effect
- glassShine: Light reflection movement
- dockBounceIn: Elastic entrance for dock
- minimizeTerminal: Scale and blur to bottom
- maximizeTerminal: Smooth size transition
- restoreTerminal: Fade and scale from bottom
- messageAppear: Blur and slide for messages
- cursorBlink: Terminal cursor pulse
- loadingPulse: AI response indicators
```

#### State Transitions
- **Minimize**: 0.4s smooth scale to dock
- **Maximize**: 0.3s size transition
- **Restore**: 0.5s fade-in from bottom
- **Message**: 0.4s appear with blur

## Component Architecture

### Terminal.tsx
- **State Management**:
  - Message history
  - Window states (minimized, maximized)
  - State memory for restoration
  - Loading and transition flags
- **Event Handlers**:
  - Global keyboard shortcuts (Ctrl+L to clear)
  - Tab focus management
  - Window control interactions
  - Form submission
- **Accessibility**:
  - ARIA labels on all controls
  - Keyboard navigation support
  - Focus management
  - Screen reader compatibility

### GeminiClient.ts
- **Configuration**:
  - Model: gemini-2.5-flash
  - Context window: 1500 tokens
  - Response streaming: Simulated typing
- **Context Management**:
  - Portfolio data integration
  - Conversation history (20 messages)
  - Smart context optimization
- **Error Handling**:
  - Graceful API failures
  - User-friendly error messages

### PortfolioDataStore.ts
- **Data Sources**:
  - Unified portfolio-data.ts (722 lines)
  - 11 semantic sections
  - Rich metadata and context
- **Features**:
  - Efficient data retrieval
  - Context generation
  - Section relevance scoring

### ContextBuilder.ts
- **Optimization**:
  - Query classification
  - Token budget management
  - Smart section selection
  - 5-minute cache TTL

## Performance Characteristics

### Bundle Size
- **Total**: ~320KB (production)
- **Main**: ~220KB
- **Gemini SDK**: ~86KB (code-split)
- **CSS**: ~14KB

### Load Performance
- **Time to Interactive**: <2 seconds
- **Initial Paint**: <500ms
- **Animation FPS**: 60fps (GPU-accelerated)

### Runtime Performance
- **Context Building**: <50ms
- **API Response**: 1-3 seconds
- **Typing Animation**: 30ms/word
- **State Transitions**: Hardware-accelerated

## Responsive Design

### Desktop (>768px)
- Terminal: 920×600px (normal), 96vw×92vh (maximized)
- Centered layout with aluminum background
- Full animation effects

### Mobile (<768px)
- Terminal: 96%×92vh (normal), 100vw×100vh (maximized)
- Reduced padding and font size (13px)
- Touch-optimized controls
- Simplified animations

### High DPI Support
- 0.5px borders for Retina displays
- Enhanced antialiasing
- Finer scanline effects

## Accessibility Features

### Keyboard Navigation
- **Ctrl+L**: Clear terminal globally
- **Tab**: Cycle through controls
- **Enter**: Activate focused control
- **Arrow Keys**: Navigate input

### Screen Reader Support
- ARIA labels on all controls
- Semantic HTML structure
- Role attributes
- Focus indicators

### Visual Accessibility
- High contrast phosphor green
- Clear focus outlines
- Reduced motion support
- Print styles

## Security Configuration

### Content Security Policy
```
default-src 'self';
script-src 'self' 'unsafe-inline' 'unsafe-eval';
style-src 'self' 'unsafe-inline';
connect-src 'self' https://generativelanguage.googleapis.com;
```

### Environment Variables
```env
VITE_GEMINI_API_KEY=your_key_here  # Required
```

## Build Configuration

### Vite Settings
- Code splitting for Gemini SDK
- Terser minification
- Source maps disabled in production
- CSS optimization

### Development Workflow
```bash
npm install          # Install dependencies
npm run dev         # Start dev server (port 3002)
npm run build       # Production build
npm run preview     # Preview production
npm run type-check  # TypeScript validation
npm run lint        # Code linting
npm run format      # Code formatting
```

## Architecture Decisions

### Why Luxury Design?
- Differentiates portfolio significantly
- Demonstrates advanced CSS capabilities
- Creates memorable user experience
- Shows attention to detail

### Why Glass-Morphism?
- Modern, premium aesthetic
- Depth and layering
- Smooth transitions
- Apple-quality feel

### Why Gemini Only?
- Simplified architecture
- Reduced complexity
- Lower maintenance
- Consistent performance

### Why Single Component?
- Small codebase (~2,500 lines total)
- Easy to understand
- Fast iteration
- Minimal dependencies

## Future Enhancements

### Potential Additions
- WebGL aluminum shaders
- Voice input/output
- Response streaming
- Conversation export
- Theme variations
- Multi-language support

### Performance Optimizations
- Lazy load animations
- Virtual scrolling for messages
- Web Workers for heavy processing
- Service Worker caching

## Testing Strategy

### Manual Testing
- Cross-browser compatibility
- Responsive breakpoints
- Animation performance
- Accessibility validation
- Keyboard navigation

### Automated Testing
- Build verification
- TypeScript compilation
- Linting checks
- Bundle size monitoring

## Deployment

### Static Hosting
- Vercel/Netlify ready
- GitHub Pages compatible
- CDN-friendly assets
- Environment variable support

### Production Build
```bash
npm run build
# Outputs to dist/
# - index.html (~1.6KB)
# - assets/index-*.css (~14KB)
# - assets/index-*.js (~220KB)
# - assets/ai-*.js (~86KB)
```

## Conclusion

V2 Architecture represents a sophisticated evolution combining:
- **Luxury aesthetics** with aluminum and glass design
- **Premium interactions** with smooth animations
- **AI intelligence** through Gemini integration
- **Accessibility** with full keyboard and screen reader support
- **Performance** with GPU acceleration and optimization
- **Simplicity** in architecture and maintenance

The result is a portfolio that stands out through both technical excellence and visual sophistication, delivering an Apple-quality experience while maintaining clean, maintainable code.