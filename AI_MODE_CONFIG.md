# AI Mode Configuration Guide

This guide explains how to configure the AI features in the Finance Planner application.

## Overview

The AI Assistant supports two modes:

1. **Prompt Mode** (Default) - Generates prompts for users to copy/paste into their favorite AI assistant
2. **API Mode** - Direct integration with AI services via API calls

## Configuration

Add these environment variables to your `.env.local` file:

### Basic Configuration

```bash
# AI Mode Configuration
# 'prompt' = Copy-paste prompts mode (default, no API calls)
# 'api' = Direct API integration mode (requires API keys)
NEXT_PUBLIC_AI_MODE=prompt

# Enable API mode features (set to 'true' to show API functionality)
NEXT_PUBLIC_ENABLE_API_MODE=false
```

### API Mode Configuration (Optional)

Only needed if you want to enable direct API integration:

```bash
# OpenRouter API Configuration
OPENROUTER_API_KEY=your_openrouter_api_key_here
AI_FEATURES_ENABLED=true
DEFAULT_AI_MODEL=anthropic/claude-3-sonnet
```

## Deployment Scenarios

### Scenario 1: Public Release (Recommended)

Deploy with prompt mode only - users get AI assistance without you needing API keys:

```bash
NEXT_PUBLIC_AI_MODE=prompt
NEXT_PUBLIC_ENABLE_API_MODE=false
```

### Scenario 2: Premium Features

Enable API mode for premium users or internal use:

```bash
NEXT_PUBLIC_AI_MODE=api
NEXT_PUBLIC_ENABLE_API_MODE=true
OPENROUTER_API_KEY=your_actual_key
AI_FEATURES_ENABLED=true
DEFAULT_AI_MODEL=anthropic/claude-3-sonnet
```

### Scenario 3: Development

Test both modes during development:

```bash
NEXT_PUBLIC_AI_MODE=prompt
NEXT_PUBLIC_ENABLE_API_MODE=true
OPENROUTER_API_KEY=your_dev_key
AI_FEATURES_ENABLED=true
```

## Features by Mode

### Prompt Mode

- ✅ Generates optimized prompts with user's financial data
- ✅ Works with any AI assistant (ChatGPT, Claude, Gemini, etc.)
- ✅ No API costs for you
- ✅ Privacy-focused - data stays local
- ✅ Country-agnostic financial advice (works globally)
- ✅ International expertise frameworks built into prompts
- ✅ Quick analysis templates
- ✅ Custom question prompts

### API Mode

- ✅ Direct AI integration
- ✅ Instant results
- ✅ Multiple AI model support
- ✅ Built-in rate limiting and cost tracking
- ❌ Requires API keys and costs
- ❌ More complex to deploy

## Migration Path

You can easily switch between modes:

1. **Start with Prompt Mode** for public release
2. **Gather user feedback** on the prompt quality
3. **Enable API Mode** later when you want to offer premium features
4. **No code changes needed** - just environment variables!

## International Compatibility

The AI prompts are designed to work globally:

- **Country-agnostic recommendations** - Avoids US-specific financial products (401k, HSA, IRA)
- **Universal financial principles** - Based on internationally applicable benchmarks
- **Local adaptation guidance** - Acknowledges when local expertise is needed
- **Global banking terminology** - Uses terms that work across different financial systems
- **Regional considerations** - Prompts encourage users to research local options

This makes the application suitable for users worldwide while maintaining professional-grade financial analysis quality.

## How It Works

The implementation preserves all existing API functionality while adding the prompt generation layer. The mode is determined at runtime based on your environment variables, so you can switch without redeploying code.

The AI button will show:

- **"AI Assistant"** in prompt mode
- **"Ask AI"** in API mode
- **"Setup AI"** if API mode is enabled but not configured
