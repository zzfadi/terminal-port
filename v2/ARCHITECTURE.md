# OnePromptPortfolio V2 Architecture

## Overview

OnePromptPortfolio V2 is an AI-powered terminal portfolio that combines a minimalist terminal aesthetic with natural language processing through Google's Gemini API. The system features intelligent context management and comprehensive portfolio data integration in a streamlined single-provider architecture.

## Current Architecture (2025)

### Core Stack
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite 7
- **AI Integration**: Google Gemini API (gemini-2.0-flash-exp)
- **Styling**: Pure CSS with terminal aesthetics
- **State Management**: React hooks (useState, useEffect)

### Project Structure
```
v2/
├── src/
│   ├── main.ts                    # React app entry point (20 lines)
│   ├── Terminal.tsx               # Main terminal UI component (188 lines)
│   ├── GeminiClient.ts           # Gemini API integration (98 lines)
│   ├── portfolio.ts              # Portfolio data (161 lines)
│   ├── styles.css                # Terminal aesthetics (220 lines)
│   │
│   ├── ai/                       # AI Context System
│   │   ├── core/
│   │   │   ├── PortfolioDataStore.ts    # Data management (685 lines)
│   │   │   └── ContextBuilder.ts        # Context optimization (371 lines)
│   │   │
│   │   └── commands/
│   │       └── AICommands.ts            # Command helpers (182 lines)
│   │
│   └── data/
│       └── portfolio-data.ts            # Comprehensive portfolio data (662 lines)
│
├── dist/                         # Production build output
├── index.html                    # Minimal HTML entry
├── package.json                  # Dependencies (minimal)
├── vite.config.ts               # Build configuration
└── tsconfig.json                # TypeScript configuration
```

## Key Components

### 1. Terminal UI Layer

#### Terminal.tsx (~188 lines)
- Single React component managing entire UI
- Message history with typing animation
- Three message types: user, ai, system
- Mobile responsive design
- Keyboard shortcuts (Ctrl+L to clear)
- Direct Gemini API integration

### 2. AI System Architecture

#### GeminiClient.ts (Core Integration)
- **Purpose**: Direct Gemini API communication
- **Features**:
  - Single model: gemini-2.0-flash-exp
  - Portfolio context in system prompt
  - Conversation history (last 20 messages)
  - Simple error handling
  - Async/await pattern

#### PortfolioDataStore (Data Layer)
- **Purpose**: Centralized portfolio data management
- **Features**:
  - Single source from portfolio-data.ts
  - Semantic sections for context
  - Efficient data retrieval
  - Rich context generation

#### ContextBuilder (Optimization Layer)
- **Purpose**: Smart context assembly
- **Features**:
  - Query classification
  - Section selection based on relevance
  - Token optimization
  - Focused context generation

### 3. Data Flow

#### Query Processing
```
User Input → GeminiClient → Context Building → Gemini API → Response
      ↓            ↓              ↓               ↓
   Terminal    Portfolio    ContextBuilder   Streaming
   Display      Context      Optimization     Response
```

#### Context Assembly
- Portfolio data loaded from portfolio-data.ts
- Relevant sections selected by ContextBuilder
- System prompt includes full context
- Conversation history maintained

### 4. Portfolio Data Structure

#### portfolio-data.ts
- Comprehensive professional information
- Experience with quantified achievements
- Skills categorized by domain
- Projects with impact metrics
- AI leadership initiatives

### 5. Natural Language Interface

#### Conversation Flow
- No command parsing - pure natural language
- AI interprets user intent from context
- Portfolio data always available
- Contextual responses based on query type

#### Example Interactions
```
"Tell me about Fadi's experience"
"What projects has he worked on?"
"Explain his AI initiatives"
"What are his technical skills?"
"How can I contact him?"
```

## Data Flow

### Query Processing Pipeline
```
User Input
    ↓
Terminal Component
    ↓
GeminiClient.sendMessage()
    ↓
Context Assembly (portfolio + history)
    ↓
Gemini API Request
    ↓
Response Generation
    ↓
History Update
    ↓
Typing Animation
    ↓
User Display
```

### Context Strategy

#### Current Implementation
- Full portfolio context included
- ~1000-1500 tokens per request
- Conversation history (last 20 messages)
- Gemini-2.0-flash-exp model
- Fast response times (1-3 seconds)

## Performance Characteristics

### Token Usage
- **Average Context**: ~1000-1500 tokens
- **With History**: ~2000 tokens max
- **Gemini Flash Model**: Optimized for speed

### Response Times
- **Context Building**: <50ms
- **API Response**: 1-3 seconds
- **Typing Animation**: Configurable
- **Total Time**: 2-4 seconds

### Bundle Size
- **Development**: ~280KB total
- **Production**: ~195KB (optimized)
- **Gemini SDK**: ~87KB (code-split)
- **Main Bundle**: ~108KB
- **Time to Interactive**: <2 seconds

## Portfolio Data Integration

### Core Sections
1. **Profile**: Professional summary and contact
2. **Experience**: Work history with achievements
3. **Skills**: Technical expertise by category
4. **Projects**: Key initiatives and impact
5. **Education**: Academic background
6. **AI Leadership**: Transformation initiatives
7. **Technical Expertise**: Deep technical knowledge

### Data Structure (portfolio-data.ts)
- Single comprehensive data file
- Structured TypeScript interfaces
- Quantified achievements
- Rich contextual information
- AI-optimized descriptions

## Security & Configuration

### Environment Variables
```env
VITE_GEMINI_API_KEY=your_key_here      # Required (only configuration needed)
```

### Content Security Policy
```
default-src 'self';
script-src 'self' 'unsafe-inline' 'unsafe-eval';
style-src 'self' 'unsafe-inline';
connect-src 'self' https://generativelanguage.googleapis.com;
```

## Development Workflow

### Commands
```bash
# Install dependencies
npm install

# Development server (port 3002)
npm run dev

# Production build
npm run build

# Preview production
npm run preview

# Type checking
npm run type-check

# Linting
npm run lint

# Format code
npm run format
```

### Build Process
1. TypeScript compilation (tsc)
2. Vite bundling and optimization
3. Code splitting (main, ai, vendor chunks)
4. Asset optimization
5. Output to `dist/` folder

## Architecture Decisions

### Why React + TypeScript?
- Type safety for AI integration
- Simple component architecture
- Fast development iteration
- Minimal complexity

### Why Gemini Only?
- Simplicity over complexity
- Single API to maintain
- Fast response times with Flash model
- Cost-effective for portfolio use
- No fallback complexity needed

### Why Natural Language?
- No command learning curve
- More accessible to all users
- AI handles intent interpretation
- Focus on conversation

### Why Single Component?
- Entire app ~400 lines of core code
- No routing needed
- Easier to understand and modify
- Faster development

## Future Enhancements

### Potential Additions
- Streaming responses (Gemini supports it)
- Export conversation as PDF
- Voice input/output
- Dark/light theme toggle
- Conversation save/load
- Response regeneration
- Copy code blocks

### Maintaining Simplicity
- Keep single-provider architecture
- Avoid complex state management
- No backend requirements
- Focus on user experience

## Key Metrics

### Performance Targets
- **Response Time**: <3 seconds
- **Bundle Size**: <300KB total
- **Time to Interactive**: <2 seconds
- **Error Rate**: <1%

### Optimization Strategy
- Code splitting (Gemini SDK separate)
- Minimal dependencies
- Direct API calls
- Efficient React rendering

## Testing Approach

### Manual Testing
- API key configuration
- Message sending/receiving
- Error handling
- Mobile responsiveness
- Keyboard shortcuts

### Key Test Cases
- Portfolio queries
- Conversation context
- Error states
- Loading states
- Clear functionality (Ctrl+L)

## Deployment

### Production Build
```bash
npm run build
# Outputs to dist/ folder
# - index.html (~2KB)
# - assets/index-*.js (~108KB)
# - assets/index-*.css (~3KB)
# - assets/ai-*.js (~87KB) - Gemini SDK
```

### Deployment Options
- Static hosting (Vercel, Netlify, GitHub Pages)
- No backend required
- Environment variables for API key
- CDN-friendly assets

## Conclusion

V2 Architecture represents a minimalist approach to AI-powered portfolios:
- **Simple is better**: Single provider, single component
- **Natural language first**: No command memorization
- **Fast and focused**: Gemini Flash for speed
- **Easy to maintain**: ~2,500 lines total codebase
- **Zero complexity**: No backends, no databases, no complexity

The architecture prioritizes user experience and maintainability over architectural complexity, delivering a fast, intuitive portfolio experience with minimal code.