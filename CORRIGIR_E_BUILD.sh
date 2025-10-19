#!/bin/bash

echo "╔══════════════════════════════════════════════════════════╗"
echo "║                                                          ║"
echo "║  🔧 FLUI - CORREÇÃO E BUILD FINAL                       ║"
echo "║                                                          ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

cd ~/flui || exit 1

echo "1️⃣  Instalando dependências faltantes..."
echo ""
npm install --save glob express cors
npm install --save-dev @types/express @types/cors @types/glob

echo ""
echo "2️⃣  Limpando build anterior..."
rm -rf dist

echo ""
echo "3️⃣  Building backend..."
echo ""
npm run build

if [ $? -eq 0 ]; then
    echo ""
    echo "╔══════════════════════════════════════════════════════════╗"
    echo "║  ✅ BUILD SUCESSO!                                       ║"
    echo "╚══════════════════════════════════════════════════════════╝"
    echo ""
    echo "🚀 Agora execute:"
    echo ""
    echo "   npm start"
    echo ""
    echo "   Deve mostrar:"
    echo "   ✅ 10 tools registradas"
    echo "   ✅ MCPs carregados"
    echo "   ✅ API rodando em http://localhost:3001"
    echo ""
else
    echo ""
    echo "╔══════════════════════════════════════════════════════════╗"
    echo "║  ❌ BUILD FALHOU                                         ║"
    echo "╚══════════════════════════════════════════════════════════╝"
    echo ""
    echo "   Verifique os erros acima"
    echo ""
fi
