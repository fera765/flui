#!/bin/bash
# FLUI v3.5 - Script de Instalação e Teste

echo "🚀 FLUI v3.5 - Instalação e Teste Frontend"
echo ""

cd ~/flui/flui-frontend-vite || exit 1

echo "📦 Instalando dependências..."
npm install --legacy-peer-deps

echo ""
echo "🔧 Instalando Tailwind CSS..."
npm install -D tailwindcss@3.4.1 postcss autoprefixer

echo ""
echo "🏗️  Building..."
npm run build

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ BUILD SUCESSO!"
    echo ""
    echo "🚀 Iniciando dev server..."
    echo ""
    npm run dev
else
    echo ""
    echo "❌ BUILD FALHOU!"
    echo "Execute manualmente:"
    echo "  npm install"
    echo "  npm run dev"
fi
