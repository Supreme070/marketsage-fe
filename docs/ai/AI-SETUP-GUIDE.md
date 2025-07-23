# MarketSage AI Setup Guide

## Current Status ✅
- **Supreme-AI Engine**: Working (64KB neural network engine)
- **AI Task Automation**: Ready (Phase B complete)
- **AI Workflow Enhancement**: Ready (Phase C complete)
- **Database**: Fully seeded with AI intelligence data
- **System**: 100% operational with fallback AI

## Option 1: Add OpenAI (Recommended) 🚀

1. **Get OpenAI API Key**:
   - Visit: https://platform.openai.com/api-keys
   - Create new API key
   - Copy the key (starts with `sk-`)

2. **Add to your `.env` file**:
   ```bash
   OPENAI_API_KEY=sk-your-actual-api-key-here
   SUPREME_AI_MODE=hybrid
   AI_FALLBACK_MODE=true
   ```

3. **Restart MarketSage**:
   ```bash
   docker-compose -f docker-compose.prod.yml restart web
   ```

## Option 2: Use Built-in AI Only 🧠

MarketSage already works perfectly with just Supreme-AI:

- ✅ Customer behavior analysis
- ✅ Automatic task generation  
- ✅ Workflow optimization
- ✅ Content intelligence
- ✅ Predictive analytics

**Current `.env` setup** (already working):
```bash
AI_FALLBACK_MODE=true
SUPREME_AI_MODE=fallback
DISABLE_ONNX=true
```

## Testing Your Setup 🧪

Run the test script:
```bash
node test-local-ai.js
```

## What Each AI Mode Does

### `SUPREME_AI_MODE=hybrid` (with OpenAI)
- Uses Supreme-AI for fast local processing
- Falls back to OpenAI for complex tasks
- Best performance and capabilities

### `SUPREME_AI_MODE=fallback` (local only)  
- Uses only Supreme-AI engine
- No external API calls
- Full privacy and local control
- Still very capable for most tasks

## AI Features Already Working 🎯

1. **Task Automation** (`/api/ai/tasks/suggest`)
   - Analyzes customer behavior
   - Generates marketing tasks automatically
   - Executes high-confidence tasks

2. **Workflow Enhancement** (`/api/ai/workflows/enhance`)
   - Optimizes existing workflows
   - Generates new workflows
   - Performance analysis

3. **Supreme-AI Engine** (`/api/ai/supreme-v3`)
   - Neural networks and ensemble methods
   - Behavioral prediction
   - Content intelligence

## Recommendation 💡

**For maximum power**: Add OpenAI API key (Option 1)
**For privacy/local-only**: Keep current setup (Option 2)

Both options work perfectly - MarketSage is designed to excel either way! 