/// <reference types="vite/client" />

interface ImportMetaEnv {
  // AI API Keys
  readonly VITE_OPENAI_API_KEY: string
  readonly VITE_ANTHROPIC_API_KEY: string
  readonly VITE_GEMINI_API_KEY: string
  
  // Optional Azure OpenAI
  readonly VITE_AZURE_OPENAI_ENDPOINT: string
  readonly VITE_AZURE_OPENAI_API_KEY: string
  
  // Feature Flags
  readonly VITE_ENABLE_AI_COMMANDS: string
  readonly VITE_ENABLE_LOCAL_AI: string
  readonly VITE_ENABLE_CLOUD_AI: string
  
  // Development Settings
  readonly VITE_DEV_MODE: string
  readonly VITE_ENABLE_ANALYTICS: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}