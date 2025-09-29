# AI Terminal Portfolio

An AI-powered interactive terminal portfolio showcasing professional experience through natural language conversation. Built with React, TypeScript, and Google Gemini AI.

![Terminal Portfolio](https://img.shields.io/badge/React-19-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue) ![Vite](https://img.shields.io/badge/Vite-7-purple)

## 🚀 Features

- **Natural Language Interface** - Ask questions in plain English about experience, skills, and projects
- **AI-Powered Responses** - Intelligent context-aware answers using Google Gemini 2.5 Flash
- **Luxury Design** - Glass-morphic UI with aluminum slate aesthetic and smooth animations
- **Responsive** - Works beautifully on desktop and mobile
- **Smart Context** - Dynamic context optimization for relevant, accurate responses
- **Window Controls** - Full minimize/maximize/close functionality with state persistence

## 📦 Installation

```bash
# Clone the repository
git clone https://github.com/fadizuabi/OnePromptPortfolio.git
cd OnePromptPortfolio

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env and add your Gemini API key
```

## 🔑 Environment Setup

Get a free Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey)

Create `.env` file:
```env
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

## 💻 Development

```bash
# Start development server (port 3002)
npm run dev

# Type checking
npm run type-check

# Lint code
npm run lint

# Format code
npm run format
```

## 🏗️ Build

```bash
# Create production build
npm run build

# Preview production build (port 4002)
npm run preview
```

Build output in `dist/`:
- Optimized JavaScript bundles (~280KB total)
- Code-split Gemini SDK (~87KB)
- Minified CSS (~14KB)

## 🎨 Architecture

### Tech Stack
- **React 19** - UI framework
- **TypeScript 5** - Type safety
- **Vite 7** - Build tool and dev server
- **Google Gemini AI** - Natural language processing
- **react-rnd** - Draggable/resizable window
- **framer-motion** - Animations

### Project Structure
```
OnePromptPortfolio/
├── src/
│   ├── Terminal.tsx              # Main UI component
│   ├── GeminiClient.ts           # AI integration
│   ├── main.ts                   # App entry point
│   ├── styles.css                # Luxury UI styling
│   ├── ai/
│   │   ├── core/
│   │   │   ├── ContextBuilder.ts      # Smart context selection
│   │   │   └── PortfolioDataStore.ts  # Data management
│   │   └── commands/
│   │       └── AICommands.ts
│   └── data/
│       └── portfolio-data.ts     # Portfolio content
├── public/
│   └── textures/                 # UI assets
├── index.html
├── package.json
├── vite.config.ts
└── tsconfig.json
```

### Key Features

**Smart Context Assembly**
- Query classification (experience, skills, projects, AI, etc.)
- Relevant section selection based on intent
- Token budget management (1500 token limit)
- 5-minute context cache

**Data Architecture**
- Single source of truth in `portfolio-data.ts`
- Structured sections with relevance scoring
- Automatic context formatting for AI
- Efficient retrieval and caching

**UI/UX**
- Glass-morphic design with backdrop blur
- Aluminum slate background with brushed metal texture
- OLED-style display with phosphor green text
- Smooth 60fps animations (GPU-accelerated)
- Mac-style window controls

## 🎯 Usage

Once running, ask questions like:
- "What is your experience with AI?"
- "Tell me about your firmware projects"
- "What technologies do you work with?"
- "Describe your leadership experience"

**Keyboard Shortcuts:**
- `Ctrl+L` - Clear conversation history
- `Tab` - Navigate between controls
- `Enter` - Activate focused control

## 📊 Performance

- Initial load: <2 seconds
- Time to interactive: <500ms
- AI response time: 1-3 seconds
- Animation FPS: 60fps (GPU-accelerated)
- Bundle size: ~280KB gzipped

## 🚢 Deployment

### Static Hosting (Vercel, Netlify, GitHub Pages)

```bash
npm run build
# Deploy dist/ folder
```

### Environment Variables

Set `VITE_GEMINI_API_KEY` in your hosting platform's environment configuration.

### CSP Configuration

The app requires connection to:
- `https://generativelanguage.googleapis.com` (Gemini API)

## 🛠️ Customization

### Update Portfolio Content
Edit `src/data/portfolio-data.ts` - changes automatically propagate to AI context.

### Modify AI Behavior
Edit system prompt in `src/GeminiClient.ts` (lines 27-46)

### Adjust Styling
Edit `src/styles.css` - colors, animations, layout

### Context Optimization
Tune query classification in `src/ai/core/ContextBuilder.ts`

## 📝 License

MIT © Fadi Al Zuabi

## 🤝 Contributing

This is a personal portfolio project, but suggestions and feedback are welcome via issues.

## 🔗 Links

- **Live Demo**: [zuabi.dev](https://zuabi.dev)
- **LinkedIn**: [Fadi Al Zuabi](https://linkedin.com/in/fadi-alzuabi)
- **GitHub**: [@fadizuabi](https://github.com/fadizuabi)

---

Built with ❤️ using React, TypeScript, and Google Gemini AI