#!/bin/bash

echo "🔧 FLUI - Correção Tailwind CSS v3.4.1"
echo ""
echo "📋 Removendo Tailwind v4 e instalando v3.4.1..."
echo ""

cd ~/flui/flui-frontend-vite || exit 1

# Limpar tudo
echo "1. Limpando instalação anterior..."
rm -rf node_modules package-lock.json .vite dist

# Instalar deps base
echo ""
echo "2. Instalando dependências base..."
npm install --legacy-peer-deps

# Instalar Tailwind v3 EXATO
echo ""
echo "3. Instalando Tailwind CSS v3.4.1 (versão estável)..."
npm install --save-dev tailwindcss@3.4.1 postcss@latest autoprefixer@latest --save-exact

# Verificar versão
echo ""
echo "4. Verificando versão instalada..."
TAILWIND_VERSION=$(npm list tailwindcss | grep tailwindcss | awk '{print $2}')
echo "   Versão: $TAILWIND_VERSION"

if [[ $TAILWIND_VERSION == *"3.4.1"* ]]; then
    echo "   ✅ Tailwind v3.4.1 instalado corretamente!"
else
    echo "   ❌ ERRO: Versão incorreta! Deve ser 3.4.1"
    exit 1
fi

# Build
echo ""
echo "5. Building frontend..."
npm run build

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ BUILD SUCESSO!"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "🚀 Agora execute:"
    echo ""
    echo "   npm run dev"
    echo ""
    echo "   Depois abra: http://localhost:8080"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
else
    echo ""
    echo "❌ BUILD FALHOU!"
    echo ""
    echo "Verifique os erros acima."
fi
