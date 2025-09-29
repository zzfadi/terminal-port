# API Keys Setup Guide

This guide helps you get API keys for the AI features in OnePromptPortfolio v2.

## 🤖 OpenAI API Key

1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in to your account
3. Navigate to [API Keys](https://platform.openai.com/api-keys)
4. Click "Create new secret key"
5. Copy the key and add it to your `.env` file as `VITE_OPENAI_API_KEY`

**Cost:** Pay-per-use, starting at ~$0.002 per 1K tokens

## 🧠 Anthropic API Key (Claude)

1. Go to [Anthropic Console](https://console.anthropic.com/)
2. Sign up or log in to your account
3. Navigate to [Settings > Keys](https://console.anthropic.com/settings/keys)
4. Click "Create Key"
5. Copy the key and add it to your `.env` file as `VITE_ANTHROPIC_API_KEY`

**Cost:** Pay-per-use, competitive pricing with OpenAI

## 🌟 Google Gemini API Key

1. Go to [Google AI Studio](https://ai.google.dev/)
2. Sign in with your Google account
3. Click "Get API Key"
4. Create a new API key
5. Copy the key and add it to your `.env` file as `VITE_GEMINI_API_KEY`

**Cost:** Free tier available, then pay-per-use

## 🔒 Security Best Practices

- **Never commit API keys** to version control (already handled in `.gitignore`)
- **Use environment variables** for all sensitive data
- **Rotate keys regularly** if they've been exposed
- **Monitor usage** to detect unauthorized access
- **Use least privilege** - only grant necessary permissions

## 💡 Tips

- **Start with one provider** - You don't need all three API keys immediately
- **Free tiers** - Most providers offer free credits to get started
- **Rate limiting** - Be aware of API rate limits when testing
- **Fallbacks** - The app gracefully handles missing API keys

## 🚀 Testing Your Setup

After adding your API keys to `.env`:

1. Run `npm run dev`
2. Try an AI command like `ask what is TypeScript?`
3. Check the console for any API connection errors
4. Use `help` to see all available AI commands