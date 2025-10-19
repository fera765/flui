#!/bin/bash

echo "📦 Instalando dependências faltantes..."
echo ""

cd /workspace || cd ~/flui

npm install --save glob express cors
npm install --save-dev @types/express @types/cors @types/glob

echo ""
echo "✅ Dependências instaladas!"
echo ""
echo "Agora execute:"
echo "  npm run build"
