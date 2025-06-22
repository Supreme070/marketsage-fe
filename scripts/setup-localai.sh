#!/bin/bash

# MarketSage LocalAI Setup Script
# ===============================
# 
# This script creates LocalAI directories and configuration files.
# LocalAI is now integrated into Docker Compose using profiles.
#
# Usage:
#   Development: docker-compose up -d (includes LocalAI by default)
#   Production:  docker-compose -f docker-compose.prod.yml --profile ai up -d

set -e  # Exit on any error

echo "🚀 MarketSage LocalAI Setup"
echo "=========================="
echo ""

# Create LocalAI directories
echo "📁 Creating LocalAI directories..."
mkdir -p localai/models
mkdir -p localai/config

echo "📝 Creating LocalAI configuration..."
cat > localai/config/models.yaml << 'EOF'
# MarketSage LocalAI Model Configuration
# =====================================

# GPT-3.5 Turbo Compatible Model
- name: gpt-3.5-turbo
  backend: llama
  model: gpt-3.5-turbo.gguf
  context_size: 4096
  temperature: 0.7
  top_p: 0.9

# GPT-4 Compatible Model  
- name: gpt-4
  backend: llama
  model: gpt-4.gguf
  context_size: 8192
  temperature: 0.7
  top_p: 0.9

# Text Embedding Model
- name: text-embedding-ada-002
  backend: bert-embeddings
  model: all-MiniLM-L6-v2
  embeddings: true
EOF

echo "🤖 Creating model download script..."
cat > localai/download-models.sh << 'EOF'
#!/bin/bash

# Download efficient models for LocalAI
echo "📥 Downloading AI models for MarketSage..."

mkdir -p ./models

# Download small efficient models for CPU inference
echo "Downloading Llama 2 7B Chat (4-bit quantized)..."
wget -c "https://huggingface.co/TheBloke/Llama-2-7B-Chat-GGUF/resolve/main/llama-2-7b-chat.Q4_K_M.gguf" -O ./models/gpt-3.5-turbo.gguf

echo "Downloading CodeLlama for advanced reasoning..."
wget -c "https://huggingface.co/TheBloke/CodeLlama-7B-Instruct-GGUF/resolve/main/codellama-7b-instruct.Q4_K_M.gguf" -O ./models/gpt-4.gguf

echo "✅ Models downloaded successfully!"
EOF

chmod +x localai/download-models.sh

echo "📋 Creating usage guide..."
cat > localai/README.md << 'EOF'
# LocalAI Integration for MarketSage

## Quick Start

### Development (LocalAI included by default)
```bash
docker-compose up -d
```

### Production (LocalAI optional)
```bash
# Without LocalAI
docker-compose -f docker-compose.prod.yml up -d

# With LocalAI
docker-compose -f docker-compose.prod.yml --profile ai up -d
```

## Download Models
```bash
cd localai && ./download-models.sh
```

## Environment Variables
Update your `.env` file:
```bash
AI_PROVIDER=localai
LOCALAI_BASE_URL=http://localhost:8080/v1
```

## API Endpoint
- LocalAI: `http://localhost:8080/v1`
- Compatible with OpenAI API format
EOF

echo ""
echo "✅ LocalAI setup completed!"
echo ""
echo "📋 Next Steps:"
echo "   1. Download models: cd localai && ./download-models.sh"  
echo "   2. For development: docker-compose up -d"
echo "   3. For production: docker-compose -f docker-compose.prod.yml --profile ai up -d"
echo "   4. Update .env with AI_PROVIDER=localai"
echo ""
echo "🌐 LocalAI: http://localhost:8080" 